#!/usr/bin/env python3

"""
ev3_ondevice_bridge.py
EV3 Bridge Server v2.3 with Integrated Script Manager
"""

import http.server
import socketserver
import json
import os
import sys
import threading
import subprocess
import time
import base64
import argparse
import traceback
import signal
import queue
from datetime import datetime
import ssl
from pathlib import Path

# EV3 imports
from ev3dev2.motor import (
    LargeMotor,
    MediumMotor,
    OUTPUT_A,
    OUTPUT_B,
    OUTPUT_C,
    OUTPUT_D,
    SpeedPercent,
    ServoMotor,
    DcMotor,
    MoveTank,
    MoveSteering,
)
from ev3dev2.sensor import INPUT_1, INPUT_2, INPUT_3, INPUT_4
from ev3dev2.sensor.lego import (
    TouchSensor,
    ColorSensor,
    UltrasonicSensor,
    GyroSensor,
    InfraredSensor,
    SoundSensor,
    LightSensor,
)
from ev3dev2.sound import Sound
from ev3dev2.display import Display
from ev3dev2.button import Button
from ev3dev2.led import Leds
from ev3dev2.power import PowerSupply


# ============================================================================
# CONFIGURATION
# ============================================================================

PORT = 8080
SCRIPTS_DIR = "/home/robot/scripts"
SOUNDS_DIR = "/home/robot/sounds"

USE_SSL = False
SSL_CERT = "ev3.crt"
SSL_KEY = "ev3.key"

VERBOSE = False

# Ensure directories exist
os.makedirs(SCRIPTS_DIR, exist_ok=True)
os.makedirs(SOUNDS_DIR, exist_ok=True)

# ============================================================================
# GLOBAL STATE
# ============================================================================

# Hardware Cache
motors = {}
sensors = {}
display = Display()
sound = Sound()
buttons = Button()
leds = Leds()
power = PowerSupply()

# Script management
running_scripts = {}
script_counter = 0
script_lock = threading.Lock()
script_list = []  # List of available scripts
script_list_lock = threading.Lock()
current_menu_index = 0
menu_scroll_offset = 0

# UI Mode
ui_mode = "status"  # "status" or "scripts"

# ============================================================================
# SIGNAL HANDLERS
# ============================================================================


def signal_handler(sig, frame):
    """Handle Ctrl+C and termination signals"""
    print("\nStopping all scripts...")

    # Stop all running scripts
    for script_id, script_info in list(running_scripts.items()):
        try:
            script_info["process"].terminate()
        except:
            pass

    # Stop all motors
    try:
        for motor in list(motors.values()):
            if motor:
                try:
                    motor.stop()
                except:
                    pass
    except:
        pass

    print("Shutdown complete")
    os._exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


# ============================================================================
# LOGGING
# ============================================================================


def vlog(message, data=None):
    """Verbose logging"""
    if VERBOSE:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        if data:
            print("[{0}] [BRIDGE] {1}: {2}".format(timestamp, message, data))
        else:
            print("[{0}] [BRIDGE] {1}".format(timestamp, message))


def log(message, data=None):
    """Standard logging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if data:
        print("[{0}] {1}: {2}".format(timestamp, message, data))
    else:
        print("[{0}] {1}".format(timestamp, message))


# ============================================================================
# SCRIPT MANAGER
# ============================================================================


class ScriptManager:
    """Manages scripts in the scripts directory"""

    def __init__(self, scripts_dir):
        self.scripts_dir = scripts_dir
        self.last_scan = 0
        self.scan_interval = 2.0  # Scan every 2 seconds

    def scan_scripts(self):
        """Scan scripts directory and return list of .py files"""
        global script_list

        current_time = time.time()

        # Only scan if interval has passed
        if current_time - self.last_scan < self.scan_interval:
            return script_list

        self.last_scan = current_time

        try:
            # Get all .py files
            py_files = sorted(
                [
                    f
                    for f in os.listdir(self.scripts_dir)
                    if f.endswith(".py")
                    and os.path.isfile(os.path.join(self.scripts_dir, f))
                ]
            )

            # Update global list with lock
            with script_list_lock:
                old_count = len(script_list)
                script_list = py_files
                new_count = len(script_list)

                if new_count != old_count:
                    log("Script list updated", {"count": new_count})

            # Ensure all scripts are executable
            for script in py_files:
                script_path = os.path.join(self.scripts_dir, script)
                self._ensure_executable(script_path)

            return script_list

        except Exception as e:
            log("Script scan error", str(e))
            if VERBOSE:
                traceback.print_exc()
            return []

    def _ensure_executable(self, script_path):
        """Ensure script has proper shebang and is executable"""
        try:
            # Check if file has shebang
            with open(script_path, "r") as f:
                first_line = f.readline()
                if not first_line.startswith("#!"):
                    # Add shebang at the beginning
                    content = f.read()
                    with open(script_path, "w") as fw:
                        fw.write("#!/usr/bin/env python3\n" + first_line + content)
                    log("Added shebang to", script_path)

            # Make executable
            os.chmod(script_path, 0o755)

        except Exception as e:
            vlog("Could not make script executable", str(e))

    def run_script(self, script_name):
        """Run a script with bounded log capture"""
        global script_counter, script_lock, running_scripts

        script_path = os.path.join(self.scripts_dir, script_name)

        # SECURITY: Validate filename to prevent path traversal
        if not script_name.endswith('.py') or '/' in script_name or '..' in script_name or '\\' in script_name:
            log("Invalid script name", {"name": script_name, "reason": "path_traversal_attempt"})
            return None

        if not os.path.exists(script_path):
            log("Script not found", {"name": script_name, "path": script_path})
            return None

        try:
            # Atomic counter increment
            with script_lock:
                script_id = script_counter
                script_counter += 1

            log("Starting script", {
                "name": script_name,
                "id": script_id,
                "path": script_path
            })

            # Create log file in /tmp
            log_file = "/tmp/ev3_script_{0}.log".format(script_id)

            # Open log file
            log_fd = open(log_file, 'w', buffering=1)  # Line buffered

            # Start process
            proc = subprocess.Popen(
                ["python3", "-u", script_path],  # -u for unbuffered output
                stdout=log_fd,
                stderr=subprocess.STDOUT,  # Merge stderr into stdout
                stdin=subprocess.DEVNULL,  # Scripts shouldn't need input
                cwd=self.scripts_dir,  # Run in scripts directory
            )

            # Thread-safe insertion
            with script_lock:
                running_scripts[script_id] = {
                    "name": script_name,
                    "process": proc,
                    "started": time.time(),
                    "log_file": log_file,
                    "log_fd": log_fd,
                }

            log("Script started successfully", {
                "name": script_name,
                "id": script_id,
                "pid": proc.pid,
                "log_file": log_file
            })

            # Play start sound
            try:
                sound.beep()
            except Exception as e:
                vlog("Could not play start sound", str(e))

            return script_id

        except Exception as e:
            log("Script start failed", {
                "name": script_name,
                "error": str(e),
                "type": type(e).__name__
            })
            if VERBOSE:
                traceback.print_exc()
            return None

    def stop_script(self, script_id):
        """
        Stop a running script with comprehensive error handling and logging.
        
        Thread-safe, idempotent, handles edge cases.
        
        Args:
            script_id: Integer ID of script to stop
            
        Returns:
            bool: True if stopped successfully, False if script not found
        """
        import time
        global script_lock, running_scripts
        
        start_time = time.time()
        
        # Phase 1: Validate and extract script info (thread-safe)
        log("Stop script requested", {
            "script_id": script_id,
            "timestamp": start_time
        })
        
        with script_lock:
            if script_id not in running_scripts:
                log("Script not running (already stopped or never existed)", {
                    "script_id": script_id,
                    "known_scripts": list(running_scripts.keys())
                })
                return False
            
            # Make a copy of script info (don't hold lock during slow operations)
            script_info = running_scripts[script_id].copy()
        
        # Extract info for clarity
        process = script_info["process"]
        log_fd = script_info.get("log_fd")
        log_file = script_info.get("log_file")
        script_name = script_info["name"]
        start_timestamp = script_info["started"]
        runtime = time.time() - start_timestamp
        
        log("Script info retrieved", {
            "script_id": script_id,
            "name": script_name,
            "pid": process.pid if process else "N/A",
            "runtime_seconds": round(runtime, 2),
            "log_file": log_file
        })
        
        # Phase 2: Check if process is already dead
        try:
            poll_result = process.poll()
            if poll_result is not None:
                log("Process already terminated", {
                    "script_id": script_id,
                    "pid": process.pid,
                    "exit_code": poll_result,
                    "runtime": round(runtime, 2)
                })
                # Skip termination, go straight to cleanup
                process_stopped = True
            else:
                process_stopped = False
                log("Process is running, will terminate", {
                    "script_id": script_id,
                    "pid": process.pid
                })
        except Exception as e:
            log("Error checking process status", {
                "script_id": script_id,
                "error": str(e),
                "error_type": type(e).__name__
            })
            process_stopped = False
        
        # Phase 3: Graceful termination (SIGTERM)
        if not process_stopped:
            try:
                log("Sending SIGTERM", {
                    "script_id": script_id,
                    "pid": process.pid
                })
                
                process.terminate()
                
                log("SIGTERM sent, waiting up to 2 seconds", {
                    "script_id": script_id,
                    "pid": process.pid
                })
                
                try:
                    exit_code = process.wait(timeout=2.0)
                    log("Process terminated gracefully", {
                        "script_id": script_id,
                        "pid": process.pid,
                        "exit_code": exit_code,
                        "method": "SIGTERM",
                        "wait_time": round(time.time() - start_time, 2)
                    })
                    process_stopped = True
                    
                except subprocess.TimeoutExpired:
                    log("Process did not respond to SIGTERM within 2 seconds", {
                        "script_id": script_id,
                        "pid": process.pid,
                        "timeout_seconds": 2
                    })
                    process_stopped = False
                    
            except OSError as e:
                # Process might have died between poll() and terminate()
                if e.errno == 3:  # ESRCH - No such process
                    log("Process disappeared before SIGTERM (race condition)", {
                        "script_id": script_id,
                        "pid": process.pid,
                        "errno": e.errno
                    })
                    process_stopped = True
                else:
                    log("OSError during SIGTERM", {
                        "script_id": script_id,
                        "error": str(e),
                        "errno": e.errno
                    })
                    
            except Exception as e:
                log("Unexpected error during SIGTERM", {
                    "script_id": script_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc() if VERBOSE else None
                })
        
        # Phase 4: Force kill if still alive (SIGKILL)
        if not process_stopped:
            try:
                log("Force killing process with SIGKILL", {
                    "script_id": script_id,
                    "pid": process.pid
                })
                
                process.kill()
                
                log("SIGKILL sent, waiting up to 1 second", {
                    "script_id": script_id,
                    "pid": process.pid
                })
                
                try:
                    exit_code = process.wait(timeout=1.0)
                    log("Process killed forcefully", {
                        "script_id": script_id,
                        "pid": process.pid,
                        "exit_code": exit_code,
                        "method": "SIGKILL",
                        "total_wait_time": round(time.time() - start_time, 2)
                    })
                    process_stopped = True
                    
                except subprocess.TimeoutExpired:
                    log("WARNING: Process survived SIGKILL (zombie or kernel issue)", {
                        "script_id": script_id,
                        "pid": process.pid,
                        "timeout_seconds": 1
                    })
                    # Continue with cleanup anyway
                    process_stopped = True
                    
            except OSError as e:
                if e.errno == 3:  # ESRCH
                    log("Process disappeared before SIGKILL", {
                        "script_id": script_id,
                        "errno": e.errno
                    })
                    process_stopped = True
                else:
                    log("OSError during SIGKILL", {
                        "script_id": script_id,
                        "error": str(e),
                        "errno": e.errno
                    })
                    
            except Exception as e:
                log("Unexpected error during SIGKILL", {
                    "script_id": script_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc() if VERBOSE else None
                })
        
        # Phase 5: Cleanup log file (even if process stop failed)
        if log_fd:
            try:
                log("Flushing log file buffer", {
                    "script_id": script_id,
                    "log_file": log_file
                })
                
                log_fd.flush()
                
                log("Closing log file descriptor", {
                    "script_id": script_id,
                    "log_file": log_file
                })
                
                log_fd.close()
                
                log("Log file closed successfully", {
                    "script_id": script_id,
                    "log_file": log_file
                })
                
            except ValueError as e:
                # File already closed
                log("Log file already closed", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "error": str(e)
                })
                
            except Exception as e:
                log("Error closing log file", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc() if VERBOSE else None
                })
        else:
            log("No log file descriptor to close", {
                "script_id": script_id
            })
        
        # Phase 6: Delete log file from disk
        if log_file and os.path.exists(log_file):
            try:
                file_size = os.path.getsize(log_file)
                
                log("Deleting log file from disk", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "size_bytes": file_size
                })
                
                os.remove(log_file)
                
                log("Log file deleted successfully", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "freed_bytes": file_size
                })
                
            except FileNotFoundError:
                log("Log file already deleted", {
                    "script_id": script_id,
                    "log_file": log_file
                })
                
            except PermissionError as e:
                log("Permission denied deleting log file (will be cleaned later)", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "error": str(e)
                })
                
            except Exception as e:
                log("Error deleting log file", {
                    "script_id": script_id,
                    "log_file": log_file,
                    "error": str(e),
                    "error_type": type(e).__name__
                })
        elif log_file:
            log("Log file does not exist (already deleted or never created)", {
                "script_id": script_id,
                "log_file": log_file
            })
        
        # Phase 7: Remove from running_scripts dict (thread-safe)
        with script_lock:
            if script_id in running_scripts:
                del running_scripts[script_id]
                log("Removed from running_scripts registry", {
                    "script_id": script_id,
                    "remaining_scripts": len(running_scripts)
                })
            else:
                log("Already removed from registry (race condition)", {
                    "script_id": script_id
                })
        
        # Phase 8: Calculate final statistics
        total_time = time.time() - start_time
        
        log("Script stop completed", {
            "script_id": script_id,
            "name": script_name,
            "success": process_stopped,
            "total_stop_time_seconds": round(total_time, 3),
            "script_runtime_seconds": round(runtime, 2)
        })
        
        # Phase 9: Audio feedback (non-critical, don't let this fail the operation)
        try:
            sound.tone([(400, 100, 0)])
            vlog("Stop sound played", {"script_id": script_id})
        except Exception as e:
            vlog("Could not play stop sound (non-critical)", {
                "script_id": script_id,
                "error": str(e)
            })
        
        return True

    def get_script_log(self, script_id, max_lines=100):
        """Get recent log lines for a script"""
        global script_lock, running_scripts

        with script_lock:
            if script_id not in running_scripts:
                # Try to read log file even if script stopped
                log_file = "/tmp/ev3_script_{0}.log".format(script_id)
                if not os.path.exists(log_file):
                    return []
            else:
                log_file = running_scripts[script_id]["log_file"]

        try:
            # Read last N lines efficiently using tail
            import subprocess
            result = subprocess.run(
                ["tail", "-n", str(max_lines), log_file],
                capture_output=True,
                text=True,
                timeout=1
            )
            lines = result.stdout.strip().split('\n') if result.stdout else []
            
            vlog("Retrieved script logs", {
                "script_id": script_id,
                "line_count": len(lines)
            })
            
            return lines
        except Exception as e:
            log("Error reading script log", {
                "script_id": script_id,
                "error": str(e)
            })
            return []

    def stop_all_scripts(self):
        """Stop all running scripts"""
        for script_id in list(running_scripts.keys()):
            self.stop_script(script_id)
        log("All scripts stopped")

    def delete_script(self, script_name):
        """Delete a script file"""
        if not script_name.endswith('.py') or '/' in script_name or '..' in script_name:
            log("Invalid script name for deletion", script_name)
            return False

        script_path = os.path.join(self.scripts_dir, script_name)

        if not os.path.exists(script_path):
            return False

        try:
            # Stop any running instances first
            for script_id, info in list(running_scripts.items()):
                if info["name"] == script_name:
                    self.stop_script(script_id)

            # Delete file
            os.remove(script_path)
            log("Script deleted", script_name)

            # Update script list
            self.scan_scripts()

            return True

        except Exception as e:
            log("Script delete error", str(e))
            return False


# Initialize script manager
script_manager = ScriptManager(SCRIPTS_DIR)

# ============================================================================
# MOTOR & SENSOR HELPERS
# ============================================================================


def get_motor(port_char):
    """Lazy load motors with disconnect protection"""
    vlog("get_motor called", {"port": port_char})

    if port_char in motors:
        motor = motors[port_char]
        if motor:
            try:
                _ = motor.is_running
                return motor
            except:
                log("Motor {0} disconnected".format(port_char))
                motors[port_char] = None

    try:
        mapping = {"A": OUTPUT_A, "B": OUTPUT_B, "C": OUTPUT_C, "D": OUTPUT_D}

        try:
            motors[port_char] = LargeMotor(mapping[port_char])
            log("Large motor initialized on port {0}".format(port_char))
        except:
            try:
                motors[port_char] = MediumMotor(mapping[port_char])
                log("Medium motor initialized on port {0}".format(port_char))
            except:
                motors[port_char] = None
                return None
    except Exception as e:
        log("Motor init failed", str(e))
        motors[port_char] = None

    return motors[port_char]


def get_medium_motor(port_char):
    """Lazy load medium motors"""
    vlog("get_medium_motor called", {"port": port_char})
    key = "M" + port_char
    if key not in motors:
        try:
            mapping = {"A": OUTPUT_A, "B": OUTPUT_B, "C": OUTPUT_C, "D": OUTPUT_D}
            motors[key] = MediumMotor(mapping[port_char])
            log("Medium motor initialized on port {0}".format(port_char))
        except Exception as e:
            log(
                "Failed to initialize medium motor on port {0}".format(port_char),
                str(e),
            )
            if VERBOSE:
                traceback.print_exc()
            motors[key] = None
    return motors[key]


def get_servo_motor(port_char):
    """Lazy load servo motors"""
    key = "SERVO_" + port_char
    if key not in motors:
        try:
            mapping = {"A": OUTPUT_A, "B": OUTPUT_B, "C": OUTPUT_C, "D": OUTPUT_D}
            motors[key] = ServoMotor(mapping[port_char])
            log("Servo motor initialized on port {0}".format(port_char))
        except Exception as e:
            log("Servo motor init failed", str(e))
            motors[key] = None
    return motors[key]


def get_dc_motor(port_char):
    """Lazy load DC motors"""
    key = "DC_" + port_char
    if key not in motors:
        try:
            mapping = {"A": OUTPUT_A, "B": OUTPUT_B, "C": OUTPUT_C, "D": OUTPUT_D}
            motors[key] = DcMotor(mapping[port_char])
            log("DC motor initialized on port {0}".format(port_char))
        except Exception as e:
            log("DC motor init failed", str(e))
            motors[key] = None
    return motors[key]


def get_sensor(port, sensor_type):
    """Get or create sensor on specified port"""
    key = "{0}_{1}".format(port, sensor_type)
    if key not in sensors:
        port_map = {"1": INPUT_1, "2": INPUT_2, "3": INPUT_3, "4": INPUT_4}
        sensor_classes = {
            # EV3 sensors
            "touch": TouchSensor,
            "color": ColorSensor,
            "ultrasonic": UltrasonicSensor,
            "gyro": GyroSensor,
            "infrared": InfraredSensor,
            # NXT sensors
            "sound": SoundSensor,
            "light": LightSensor,
        }
        try:
            sensors[key] = sensor_classes[sensor_type](port_map[port])

            # Set appropriate mode for sensor
            sensor = sensors[key]
            if sensor_type == "touch":
                sensor.mode = "TOUCH"
            elif sensor_type == "color":
                sensor.mode = "COL-REFLECT"  # Default mode
            elif sensor_type == "ultrasonic":
                sensor.mode = "US-DIST-CM"
            elif sensor_type == "gyro":
                sensor.mode = "GYRO-ANG"
            elif sensor_type == "infrared":
                sensor.mode = "IR-PROX"
            elif sensor_type == "sound":
                sensor.mode = "DB"  # Decibels mode
            elif sensor_type == "light":
                sensor.mode = "REFLECT"  # Reflected light mode

            log("Initialized {0} sensor on port {1}".format(sensor_type, port))
        except Exception as e:
            log("Sensor init failed", str(e))
            sensors[key] = None
    return sensors[key]


def safe_motor_command(motor, command_func, error_msg="Motor operation failed"):
    """Execute motor command with disconnect protection"""
    if not motor:
        return False

    try:
        command_func()
        return True
    except Exception as e:
        # Motor likely disconnected during operation
        log(error_msg, str(e))
        # Remove from cache to force re-initialization
        for port, m in list(motors.items()):
            if m is motor:
                motors[port] = None
                break
        return False


# ============================================================================
# HTTP HANDLER
# ============================================================================

class BridgeHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        """Only log HTTP requests if verbose mode enabled"""
        if VERBOSE:
            log(
                "HTTP {0} {1} from {2}".format(
                    self.command, self.path, self.client_address[0]
                )
            )

    def end_headers(self):
        """Add CORS headers for browser compatibility"""
        # Allow all origins (restrict in production!)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header('Access-Control-Max-Age', '3600')
        super().end_headers()

    def _send_json(self, data, code=200):
        """Send JSON response"""
        vlog("Sending response", {"code": code, "data": data})
        
        self.send_response(code)           # 1. Set status (200, 404, etc)
        self.send_header("Content-type", "application/json")  # 2. Set content type
        # Note: CORS headers are added by end_headers() automatically
        self.end_headers()                 # 3. Send all headers (calls our override)
        
        self.wfile.write(json.dumps(data).encode())  # 4. Send body

    def do_OPTIONS(self):
        """Handle CORS preflight - browser sends this BEFORE POST/GET"""
        self.send_response(200)
        self.end_headers()  # ← This will call our custom end_headers()

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode("utf-8"))
            command = data.get("cmd")

            log("Command: {0}".format(command))

            # === SCRIPT MANAGEMENT ===
            if command == "upload_script":
                filename = data["name"]
                code = data["code"]

                # SECURITY: Validate filename
                if not filename.endswith('.py') or '/' in filename or '..' in filename or '\\' in filename:
                    self._send_json({"status": "error", "msg": "Invalid filename"}, 400)
                    return
                
                os.makedirs(SCRIPTS_DIR, exist_ok=True)

                filepath = os.path.join(SCRIPTS_DIR, filename)

                # Write script
                with open(filepath, "w") as f:
                    # Ensure shebang
                    if not code.startswith("#!"):
                        f.write("#!/usr/bin/env python3\n")
                    f.write(code)

                # Make executable
                os.chmod(filepath, 0o755)

                log("Script uploaded", filename)

                # Trigger script list update
                script_manager.scan_scripts()

                self._send_json({"status": "ok", "msg": "Script uploaded"})

            elif command == "upload_sound":
                filename = data.get("name")
                sound_data_b64 = data.get("data")
                
                if not filename or not sound_data_b64:
                    self._send_json({"status": "error", "msg": "Missing filename or data"}, 400)
                    return
                
                # SECURITY: Validate filename
                if not filename.endswith(('.wav', '.mp3', '.ogg')):
                    self._send_json({"status": "error", "msg": "Invalid file type"}, 400)
                    return
                
                # Sanitize filename (prevent path traversal)
                safe_filename = os.path.basename(filename)
                safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in '._-')
                
                if not safe_filename:
                    self._send_json({"status": "error", "msg": "Invalid filename"}, 400)
                    return
                
                try:
                    # Decode base64
                    try:
                        sound_data = base64.b64decode(sound_data_b64, validate=True)
                    except:
                        self._send_json({"status": "error", "msg": "Invalid base64"}, 400)
                        return
                    
                    # Validate size (max 10MB)
                    if len(sound_data) > 10 * 1024 * 1024:
                        self._send_json({"status": "error", "msg": "File too large (max 10MB)"}, 400)
                        return
                    
                    # Write to sounds directory
                    filepath = os.path.join(SOUNDS_DIR, safe_filename)
                    
                    with open(filepath, "wb") as f:
                        f.write(sound_data)
                    
                    log("Sound uploaded", {
                        "filename": safe_filename,
                        "size": len(sound_data),
                        "path": filepath
                    })
                    
                    self._send_json({
                        "status": "ok",
                        "msg": "Sound uploaded",
                        "filename": safe_filename,
                        "size": len(sound_data)
                    })
                    
                except Exception as e:
                    log("Sound upload failed", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)}, 500)


            elif command == "run_script":
                script_name = data["name"]
                script_id = script_manager.run_script(script_name)

                if script_id is not None:
                    self._send_json(
                        {
                            "status": "ok",
                            "script_id": script_id,
                            "msg": "Script started",
                        }
                    )
                else:
                    self._send_json({"status": "error", "msg": "Failed to start"}, 500)

            elif command == "stop_script":
                script_id = data.get("script_id")
                if script_manager.stop_script(script_id):
                    self._send_json({"status": "ok", "msg": "Script stopped"})
                else:
                    self._send_json({"status": "error", "msg": "Script not found"}, 404)

            elif command == "stop_all_scripts":
                script_manager.stop_all_scripts()
                self._send_json({"status": "ok", "msg": "All scripts stopped"})

            elif command == "delete_script":
                script_name = data["name"]
                if script_manager.delete_script(script_name):
                    self._send_json({"status": "ok", "msg": "Script deleted"})
                else:
                    self._send_json({"status": "error", "msg": "Delete failed"}, 500)

            # === MOTORS ===
            elif command == "motor_run":
                m = get_motor(data["port"])
                if m:
                    m.on(SpeedPercent(data["speed"]))
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "motor_run_for":
                m = get_motor(data["port"])
                if safe_motor_command(
                    m,
                    lambda: m.on_for_rotations(
                        SpeedPercent(data["speed"]),
                        data["rotations"],
                        brake=data.get("brake", True),
                        block=False,
                    ),
                    "Motor run_for failed",
                ):
                    vlog(
                        "Motor run_for",
                        {
                            "port": data["port"],
                            "speed": data["speed"],
                            "rotations": data["rotations"],
                        },
                    )
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "motor_run_timed":
                m = get_motor(data["port"])
                if m:
                    m.on_for_seconds(
                        SpeedPercent(data["speed"]),
                        data["seconds"],
                        block=data.get("block", False),
                    )
                    vlog(
                        "Motor run_timed",
                        {
                            "port": data["port"],
                            "speed": data["speed"],
                            "seconds": data["seconds"],
                        },
                    )
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "motor_run_to_position":
                m = get_motor(data["port"])
                if m:
                    m.on_to_position(
                        SpeedPercent(data["speed"]),
                        data["position"],
                        block=data.get("block", False),
                    )
                    vlog(
                        "Motor run_to_position",
                        {
                            "port": data["port"],
                            "speed": data["speed"],
                            "position": data["position"],
                        },
                    )
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "motor_stop":
                m = get_motor(data["port"])
                brake_mode = data.get("brake", "brake")
                if safe_motor_command(
                    m, lambda: m.stop(stop_action=brake_mode), "Motor stop failed"
                ):
                    vlog("Motor stopped", {"port": data["port"], "mode": brake_mode})
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "motor_reset":
                m = get_motor(data["port"])
                if m:
                    m.position = 0
                    vlog("Motor position reset", {"port": data["port"]})
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            elif command == "medium_motor_run":
                m = get_medium_motor(data["port"])
                if m:
                    m.on(SpeedPercent(data["speed"]))
                    vlog(
                        "Medium motor running",
                        {"port": data["port"], "speed": data["speed"]},
                    )
                    self._send_json({"status": "ok"})
                else:
                    self._send_json(
                        {"status": "error", "msg": "Medium motor not connected"}
                    )

            elif command == "tank_drive":
                motor_left = get_motor(data.get("left_port", "B"))
                motor_right = get_motor(data.get("right_port", "C"))

                if not motor_left or not motor_right:
                    self._send_json({"status": "error", "msg": "Motors not connected"})
                    return

                try:
                    motor_left.on_for_rotations(
                        SpeedPercent(data["left"]),
                        data["rotations"],
                        brake=data.get("brake", True),
                        block=False,
                    )
                    motor_right.on_for_rotations(
                        SpeedPercent(data["right"]),
                        data["rotations"],
                        brake=data.get("brake", True),
                        block=True,
                    )
                    vlog(
                        "Tank drive",
                        {
                            "left": data["left"],
                            "right": data["right"],
                            "rotations": data["rotations"],
                        },
                    )
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Tank drive failed", str(e))
                    # Clear both motors from cache
                    motors[data.get("left_port", "B")] = None
                    motors[data.get("right_port", "C")] = None
                    self._send_json(
                        {
                            "status": "error",
                            "msg": "Tank drive failed - motors disconnected",
                        }
                    )

            elif command == "stop_all_motors":
                try:
                    for port_char in ["A", "B", "C", "D"]:
                        m = get_motor(port_char)
                        if m:
                            m.stop()
                    vlog("All motors stopped")
                    self._send_json({"status": "ok"})
                except Exception as e:
                    self._send_json({"status": "error", "msg": str(e)})

            # === SERVO MOTOR ===
            elif command == "servo_run":
                m = get_servo_motor(data["port"])
                if m:
                    m.on(SpeedPercent(data["speed"]))
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Servo not connected"})

            elif command == "servo_run_to_position":
                m = get_servo_motor(data["port"])
                if m:
                    m.run_to_abs_pos(
                        position_sp=data["position"],
                        speed_sp=SpeedPercent(data.get("speed", 50)),
                    )
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Servo not connected"})

            elif command == "servo_stop":
                m = get_servo_motor(data["port"])
                if m:
                    m.stop()
                    self._send_json({"status": "ok"})
                else:
                    self._send_json({"status": "error", "msg": "Servo not connected"})

            # === DC MOTOR ===
            elif command == "dc_motor_run":
                m = get_dc_motor(data["port"])
                if m:
                    m.on(SpeedPercent(data["speed"]))
                    self._send_json({"status": "ok"})
                else:
                    self._send_json(
                        {"status": "error", "msg": "DC motor not connected"}
                    )

            elif command == "dc_motor_stop":
                m = get_dc_motor(data["port"])
                if m:
                    m.stop()
                    self._send_json({"status": "ok"})
                else:
                    self._send_json(
                        {"status": "error", "msg": "DC motor not connected"}
                    )

            # === MOVE TANK (High-level tank driving) ===
            elif command == "move_tank":
                # MoveTank makes tank driving easier
                try:
                    tank = MoveTank(
                        data.get("left_port", "B"), data.get("right_port", "C")
                    )

                    if "rotations" in data:
                        tank.on_for_rotations(
                            SpeedPercent(data["left_speed"]),
                            SpeedPercent(data["right_speed"]),
                            data["rotations"],
                        )
                    elif "seconds" in data:
                        tank.on_for_seconds(
                            SpeedPercent(data["left_speed"]),
                            SpeedPercent(data["right_speed"]),
                            data["seconds"],
                        )
                    else:
                        tank.on(
                            SpeedPercent(data["left_speed"]),
                            SpeedPercent(data["right_speed"]),
                        )

                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("MoveTank failed", str(e))
                    self._send_json({"status": "error", "msg": str(e)})

            # === MOVE STEERING (High-level steering) ===
            elif command == "move_steering":
                # MoveSteering for car-like steering
                try:
                    steering = MoveSteering(
                        data.get("left_port", "B"), data.get("right_port", "C")
                    )

                    # Steering: -100 (full left) to 100 (full right)
                    # Speed: motor speed

                    if "rotations" in data:
                        steering.on_for_rotations(
                            data["steering"],
                            SpeedPercent(data["speed"]),
                            data["rotations"],
                        )
                    elif "seconds" in data:
                        steering.on_for_seconds(
                            data["steering"],
                            SpeedPercent(data["speed"]),
                            data["seconds"],
                        )
                    else:
                        steering.on(data["steering"], SpeedPercent(data["speed"]))

                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("MoveSteering failed", str(e))
                    self._send_json({"status": "error", "msg": str(e)})

            # === DISPLAY ===
            elif command == "screen_clear":
                display.clear()
                display.update()
                vlog("Screen cleared")
                self._send_json({"status": "ok"})

            elif command == "screen_text":
                display.text_pixels(str(data["text"]), x=data["x"], y=data["y"])
                display.update()
                vlog(
                    "Text displayed",
                    {"text": data["text"], "x": data["x"], "y": data["y"]},
                )
                self._send_json({"status": "ok"})

            elif command == "screen_text_grid":
                # Text using character grid (12 chars x 8 rows)
                display.text_grid(str(data["text"]), x=data["x"], y=data["y"])
                display.update()
                vlog(
                    "Text grid displayed",
                    {"text": data["text"], "x": data["x"], "y": data["y"]},
                )
                self._send_json({"status": "ok"})

            elif command == "draw_circle":
                try:
                    from PIL import ImageDraw

                    draw = ImageDraw.Draw(display.image)
                    x, y, r = data["x"], data["y"], data["r"]
                    fill = data.get("fill", False)
                    draw.ellipse(
                        (x - r, y - r, x + r, y + r),
                        outline="black",
                        fill="black" if fill else None,
                    )
                    display.update()
                    vlog("Circle drawn", {"x": x, "y": y, "r": r, "fill": fill})
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw circle error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "draw_rectangle":
                try:
                    from PIL import ImageDraw

                    draw = ImageDraw.Draw(display.image)
                    fill = data.get("fill", False)
                    draw.rectangle(
                        (data["x1"], data["y1"], data["x2"], data["y2"]),
                        outline="black",
                        fill="black" if fill else None,
                    )
                    display.update()
                    vlog("Rectangle drawn", data)
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw rectangle error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "draw_line":
                try:
                    from PIL import ImageDraw

                    draw = ImageDraw.Draw(display.image)
                    width = data.get("width", 1)
                    draw.line(
                        (data["x1"], data["y1"], data["x2"], data["y2"]),
                        fill="black",
                        width=width,
                    )
                    display.update()
                    vlog("Line drawn", data)
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw line error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "draw_point":
                try:
                    from PIL import ImageDraw

                    draw = ImageDraw.Draw(display.image)
                    draw.point((data["x"], data["y"]), fill="black")
                    display.update()
                    vlog("Point drawn", {"x": data["x"], "y": data["y"]})
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw point error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "draw_polygon":
                try:
                    from PIL import ImageDraw

                    draw = ImageDraw.Draw(display.image)
                    points = data["points"]  # List of [x, y] pairs
                    fill = data.get("fill", False)
                    draw.polygon(
                        points, outline="black", fill="black" if fill else None
                    )
                    display.update()
                    vlog("Polygon drawn", {"points": points, "fill": fill})
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw polygon error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "draw_image":
                try:
                    from PIL import Image
                    import io

                    # Expect base64 encoded image data
                    img_data = base64.b64decode(data["data"])
                    img = Image.open(io.BytesIO(img_data))
                    # Convert to 1-bit black and white
                    img = img.convert("1")
                    # Paste onto display
                    display.image.paste(img, (data.get("x", 0), data.get("y", 0)))
                    display.update()
                    vlog("Image drawn", {"x": data.get("x", 0), "y": data.get("y", 0)})
                    self._send_json({"status": "ok"})
                except Exception as e:
                    log("Draw image error", str(e))
                    if VERBOSE:
                        traceback.print_exc()
                    self._send_json({"status": "error", "msg": str(e)})

            # === SOUND ===
            elif command == "speak":
                text = str(data["text"])
                # Detect language from text or use system language
                # Simple heuristic: check for German characters
                has_umlauts = any(c in text for c in "äöüÄÖÜß")

                if has_umlauts or data.get("lang") == "de":
                    # German voice with slower speed for clarity
                    sound.speak(text, espeak_opts="-v de -a 200 -s 120")
                else:
                    # English voice (default)
                    sound.speak(text)

                vlog(
                    "Speaking",
                    {"text": text, "detected_lang": "de" if has_umlauts else "en"},
                )
                self._send_json({"status": "ok"})

            elif command == "beep":
                freq = data.get("freq", 1000)
                dur = data.get("dur", 100)
                # beep() doesn't take frequency/duration - use play_tone instead
                sound.play_tone(freq, dur / 1000.0)  # Convert ms to seconds
                vlog("Beep/Tone", {"freq": freq, "dur": dur})
                self._send_json({"status": "ok"})

            elif command == "play_tone":
                # Play tone with frequency and duration
                freq = data.get("freq", 440)
                dur = data.get("dur", 1000)  # milliseconds
                sound.tone(freq, dur)
                vlog("Playing tone", {"freq": freq, "dur": dur})
                self._send_json({"status": "ok"})

            elif command == "play_tone_sequence":
                # Play sequence of tones: [(freq, duration_ms, delay_ms), ...]
                sequence = data.get("sequence", [])
                sound.tone(sequence)
                vlog("Tone sequence", {"count": len(sequence)})
                self._send_json({"status": "ok"})

            elif command == "simple_beep":
                # Simple beep without parameters using beep command
                args = data.get("args", "")  # beep command line args
                sound.beep(args=args)
                vlog("Simple beep", {"args": args})
                self._send_json({"status": "ok"})

            elif command == "play_note":
                # Play musical note
                note = data.get("note", "C4")
                duration = data.get("duration", 0.5)
                sound.play_note(note, duration)
                vlog("Playing note", {"note": note, "duration": duration})
                self._send_json({"status": "ok"})

            elif command == "play_file":
                # Play WAV file
                filename = data.get("filename")
                if filename:
                    filepath = os.path.join(SOUNDS_DIR, filename)
                    if os.path.exists(filepath):
                        sound.play_file(filepath, volume=data.get("volume", 100))
                        vlog("Playing file", {"filename": filename})
                        self._send_json({"status": "ok"})
                    else:
                        self._send_json(
                            {"status": "error", "msg": "File not found"}, 404
                        )
                else:
                    self._send_json({"status": "error", "msg": "No filename"}, 400)

            elif command == "play_song":
                # Data comes in as [[note, dur], [note, dur]]
                raw_notes = data.get("notes", [])
                tempo = data.get("tempo", 120)
                
                # Convert list of lists to list of tuples for ev3dev2
                notes = [(n[0], n[1]) for n in raw_notes]
                
                try:
                    sound.play_song(notes, tempo=tempo)
                    vlog("Playing song", {"notes_count": len(notes)})
                    self._send_json({"status": "ok"})
                except Exception as e:
                    self._send_json({"status": "error", "msg": str(e)})

            elif command == "set_volume":
                volume = data["volume"]
                sound.set_volume(volume)
                vlog("Volume set", {"volume": volume})
                self._send_json({"status": "ok"})

            elif command == "get_volume":
                volume = sound.get_volume()
                vlog("Volume retrieved", {"volume": volume})
                self._send_json({"status": "ok", "volume": volume})

            # === LED ===
            elif command == "set_led":
                color = data["color"]
                # Map OFF to BLACK (proper ev3dev2 color)
                if color == "OFF":
                    color = "BLACK"
                side = data.get("side", "BOTH")  # LEFT, RIGHT, or BOTH
                if side == "BOTH":
                    leds.set_color("LEFT", color)
                    leds.set_color("RIGHT", color)
                else:
                    leds.set_color(side, color)
                vlog("LED set", {"color": color, "side": side})
                self._send_json({"status": "ok"})

            elif command == "led_off":
                leds.all_off()
                vlog("LEDs turned off")
                self._send_json({"status": "ok"})

            elif command == "led_reset":
                leds.reset()
                vlog("LEDs reset to default")
                self._send_json({"status": "ok"})

            elif command == "led_animate_police":
                color1 = data.get("color1", "RED")
                color2 = data.get("color2", "BLUE")
                sleeptime = data.get("sleeptime", 0.5)
                duration = data.get("duration", 5)
                leds.animate_police_lights(
                    color1, color2, sleeptime=sleeptime, duration=duration, block=False
                )
                vlog("LED police animation", {"color1": color1, "color2": color2})
                self._send_json({"status": "ok"})

            elif command == "led_animate_flash":
                color = data.get("color", "AMBER")
                groups = data.get("groups", ["LEFT", "RIGHT"])
                sleeptime = data.get("sleeptime", 0.5)
                duration = data.get("duration", 5)
                leds.animate_flash(
                    color,
                    groups=tuple(groups),
                    sleeptime=sleeptime,
                    duration=duration,
                    block=False,
                )
                vlog("LED flash animation", {"color": color})
                self._send_json({"status": "ok"})

            elif command == "led_animate_cycle":
                colors = data.get("colors", ["RED", "GREEN", "AMBER"])
                groups = data.get("groups", ["LEFT", "RIGHT"])
                sleeptime = data.get("sleeptime", 0.5)
                duration = data.get("duration", 5)
                leds.animate_cycle(
                    tuple(colors),
                    groups=tuple(groups),
                    sleeptime=sleeptime,
                    duration=duration,
                    block=False,
                )
                vlog("LED cycle animation", {"colors": colors})
                self._send_json({"status": "ok"})

            elif command == "led_animate_rainbow":
                duration = data.get("duration", 5)
                sleeptime = data.get("sleeptime", 0.1)
                increment = data.get("increment", 0.1)
                leds.animate_rainbow(
                    increment_by=increment,
                    sleeptime=sleeptime,
                    duration=duration,
                    block=False,
                )
                vlog("LED rainbow animation")
                self._send_json({"status": "ok"})

            elif command == "led_stop_animation":
                leds.animate_stop()
                vlog("LED animation stopped")
                self._send_json({"status": "ok"})

            else:
                log("Unknown command: {0}".format(command))
                self._send_json({"status": "error", "msg": "Unknown command"}, 400)

        except Exception as e:
            log("Error processing command", str(e))
            if VERBOSE:
                traceback.print_exc()
            self._send_json({"status": "error", "msg": str(e)}, 500)

    def do_GET(self):
        """Handle GET requests (sensor reads, status etc)"""
        vlog("GET request", {"path": self.path})

        try:
            # Status
            if self.path == "/" or self.path == "/status":
                status = {
                    "status": "ev3_bridge_active",
                    "version": "2.3.0",
                    "running_scripts": len(running_scripts),
                    "available_scripts": len(script_list),
                    "motors": list(motors.keys()),
                    "sensors": list(sensors.keys()),
                }
                self._send_json(status)

            # List scripts
            elif self.path == "/scripts":
                scripts = script_manager.scan_scripts()
                self._send_json(
                    {
                        "status": "ok",
                        "scripts": scripts,
                        "running": [
                            {
                                "id": sid,
                                "name": info["name"],
                                "runtime": time.time() - info["started"],
                            }
                            for sid, info in running_scripts.items()
                        ],
                    }
                )

            elif self.path.startswith("/script/") and "/logs" in self.path:
                try:
                    # Parse: /script/123/logs?max=100
                    parts = self.path.split('/')
                    script_id = int(parts[2])
                    
                    # Parse query parameters
                    max_lines = 100
                    if '?' in self.path:
                        query = self.path.split('?')[1]
                        for param in query.split('&'):
                            if param.startswith('max='):
                                max_lines = int(param.split('=')[1])
                    
                    lines = script_manager.get_script_log(script_id, max_lines)
                    
                    self._send_json({
                        "status": "ok",
                        "script_id": script_id,
                        "lines": lines,
                        "count": len(lines)
                    })
                    
                except ValueError:
                    self._send_json({"status": "error", "msg": "Invalid script ID"}, 400)
                except Exception as e:
                    log("Error fetching logs", str(e))
                    self._send_json({"status": "error", "msg": str(e)}, 500)

            # === BATTERY ===
            elif self.path == "/battery":
                voltage = power.measured_volts
                current = power.measured_amps
                # Approximate percentage (7.4V = 0%, 9.0V = 100%)
                percentage = max(0, min(100, ((voltage - 7.4) / (9.0 - 7.4)) * 100))
                vlog(
                    "Battery read",
                    {"voltage": voltage, "percentage": percentage, "current": current},
                )
                self._send_json(
                    {"value": percentage, "voltage": voltage, "current": current}
                )

            # === MOTORS ===
            elif self.path.startswith("/motor/position/"):
                port = self.path.split("/")[-1].upper()
                m = get_motor(port)
                if m:
                    try:
                        value = m.position
                        vlog("Motor position read", {"port": port, "position": value})
                        self._send_json({"value": value})
                    except Exception as e:
                        log("Motor position read failed - disconnected", str(e))
                        motors[port] = None
                        self._send_json({"value": 0})
                else:
                    self._send_json({"value": 0})

            elif self.path.startswith("/motor/speed/"):
                port = self.path.split("/")[-1].upper()
                m = get_motor(port)
                if m:
                    try:
                        value = m.speed
                        vlog("Motor speed read", {"port": port, "speed": value})
                        self._send_json({"value": value})
                    except Exception as e:
                        log("Motor speed read failed - disconnected", str(e))
                        motors[port] = None
                        self._send_json({"value": 0})
                else:
                    self._send_json({"value": 0})

            elif self.path.startswith("/motor/state/"):
                port = self.path.split("/")[-1].upper()
                m = get_motor(port)
                if m:
                    state = {
                        "position": m.position,
                        "speed": m.speed,
                        "is_running": m.is_running,
                        "is_stalled": m.is_stalled,
                    }
                    vlog("Motor state read", {"port": port, "state": state})
                    self._send_json({"status": "ok", "state": state})
                else:
                    self._send_json({"status": "error", "msg": "Motor not connected"})

            # === TOUCH SENSOR ===
            elif self.path.startswith("/sensor/touch/"):
                port = self.path.split("/")[-1]
                sensor = get_sensor(port, "touch")
                value = sensor.is_pressed if sensor else False
                vlog("Touch sensor read", {"port": port, "pressed": value})
                self._send_json({"value": value})

            # === COLOR SENSOR ===
            elif self.path.startswith("/sensor/color/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "color"

                sensor = get_sensor(port, "color")

                if not sensor:
                    self._send_json({"value": 0})
                    return

                if mode == "color":
                    value = sensor.color
                elif mode == "reflected_light_intensity":
                    value = sensor.reflected_light_intensity
                elif mode == "ambient_light_intensity":
                    value = sensor.ambient_light_intensity
                else:
                    value = 0

                vlog("Color sensor read", {"port": port, "mode": mode, "value": value})
                self._send_json({"value": value})

            # === COLOR SENSOR RGB ===
            elif self.path.startswith("/sensor/color_rgb/"):
                parts = self.path.split("/")
                port = parts[3]
                component = parts[4] if len(parts) > 4 else "red"

                sensor = get_sensor(port, "color")

                if not sensor:
                    self._send_json({"value": 0})
                    return

                rgb = sensor.rgb
                component_map = {"red": 0, "green": 1, "blue": 2}
                idx = component_map.get(component, 0)
                value = rgb[idx] if rgb else 0

                vlog(
                    "Color RGB read",
                    {"port": port, "component": component, "value": value},
                )
                self._send_json({"value": value})

            # === ULTRASONIC SENSOR ===
            elif self.path.startswith("/sensor/ultrasonic/"):
                port = self.path.split("/")[-1]
                sensor = get_sensor(port, "ultrasonic")
                value = sensor.distance_centimeters if sensor else 0
                vlog("Ultrasonic sensor read", {"port": port, "distance": value})
                self._send_json({"value": value})

            # === GYRO SENSOR ===
            elif self.path.startswith("/sensor/gyro/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "angle"

                sensor = get_sensor(port, "gyro")

                if not sensor:
                    value = 0 if mode != "both" else {"angle": 0, "rate": 0}
                    self._send_json({"value": value})
                    return

                if mode == "angle":
                    value = sensor.angle
                elif mode == "rate":
                    value = sensor.rate
                elif mode == "both":
                    value = {"angle": sensor.angle, "rate": sensor.rate}
                else:
                    value = 0 if mode != "both" else {"angle": 0, "rate": 0}

                vlog("Gyro sensor read", {"port": port, "mode": mode, "value": value})
                self._send_json({"value": value})

            # === INFRARED SENSOR ===
            elif self.path.startswith("/sensor/infrared/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "proximity"

                sensor = get_sensor(port, "infrared")

                if not sensor:
                    self._send_json({"value": 0})
                    return

                if mode == "proximity":
                    value = sensor.proximity
                elif mode == "heading":
                    channel = int(parts[5]) if len(parts) > 5 else 1
                    value = sensor.heading(channel)
                elif mode == "distance":
                    channel = int(parts[5]) if len(parts) > 5 else 1
                    value = sensor.distance(channel) or 0
                elif mode == "button":
                    channel = int(parts[5]) if len(parts) > 5 else 1
                    button = parts[6] if len(parts) > 6 else "top_left"
                    button_methods = {
                        "top_left": sensor.top_left,
                        "bottom_left": sensor.bottom_left,
                        "top_right": sensor.top_right,
                        "bottom_right": sensor.bottom_right,
                        "beacon": sensor.beacon,
                    }
                    value = button_methods.get(button, lambda ch: False)(channel)
                else:
                    value = 0

                vlog(
                    "Infrared sensor read", {"port": port, "mode": mode, "value": value}
                )
                self._send_json({"value": value})

            # === NXT SOUND SENSOR ===
            elif self.path.startswith("/sensor/sound/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "db"  # db or dba

                sensor = get_sensor(port, "sound") 

                if not sensor:
                    self._send_json({"value": 0})
                    return

                if mode == "db":
                    # Set mode to DB (decibels)
                    sensor.mode = "DB"
                    value = sensor.sound_pressure
                elif mode == "dba":
                    # Set mode to DBA (A-weighted decibels)
                    sensor.mode = "DBA"
                    value = sensor.sound_pressure_low
                else:
                    value = 0

                vlog("Sound sensor read", {"port": port, "mode": mode, "value": value})
                self._send_json({"value": value})

            # === NXT LIGHT SENSOR ===
            elif self.path.startswith("/sensor/light/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "reflect"  # reflect or ambient

                sensor = get_sensor(port, "light")

                if not sensor:
                    self._send_json({"value": 0})
                    return

                if mode == "reflect":
                    sensor.mode = "REFLECT"
                    value = sensor.reflected_light_intensity
                elif mode == "ambient":
                    sensor.mode = "AMBIENT"
                    value = sensor.ambient_light_intensity
                else:
                    value = 0

                vlog("Light sensor read", {"port": port, "mode": mode, "value": value})
                self._send_json({"value": value})

            # === BUTTONS ===
            elif self.path.startswith("/button/"):
                button_name = self.path.split("/")[-1]
                button_map = {
                    "up": buttons.up,
                    "down": buttons.down,
                    "left": buttons.left,
                    "right": buttons.right,
                    "enter": buttons.enter,
                    "backspace": buttons.backspace,
                }
                pressed = button_map.get(button_name, False)
                vlog("Button read", {"button": button_name, "pressed": pressed})
                self._send_json({"value": pressed})

            elif self.path == "/buttons/all":
                all_buttons = {
                    "up": buttons.up,
                    "down": buttons.down,
                    "left": buttons.left,
                    "right": buttons.right,
                    "enter": buttons.enter,
                    "backspace": buttons.backspace,
                }
                vlog("All buttons read", all_buttons)
                self._send_json({"value": all_buttons})

            else:
                self._send_json({"status": "error", "msg": "Unknown endpoint"}, 404)

        except Exception as e:
            log("Error processing GET", str(e))
            if VERBOSE:
                traceback.print_exc()
            self._send_json({"status": "error", "msg": str(e)}, 500)


# ============================================================================
# EV3 UI WITH SCRIPT MENU
# ============================================================================


def draw_script_menu():
    """Draw the script selection menu"""
    global current_menu_index, menu_scroll_offset

    display.clear()

    # Title
    display.text_pixels("SCRIPT MENU", x=30, y=2, font="Lat15-Terminus12x6")
    display.text_pixels("=" * 26, x=2, y=15)

    # Get current scripts
    scripts = script_manager.scan_scripts()

    if not scripts:
        display.text_pixels("No scripts found", x=20, y=50)
        display.text_pixels("Upload via web", x=20, y=65)
        display.update()
        return

    # Calculate visible range (show 5 scripts at a time)
    max_visible = 5
    total_scripts = len(scripts)

    # Adjust scroll offset if needed
    if current_menu_index < menu_scroll_offset:
        menu_scroll_offset = current_menu_index
    elif current_menu_index >= menu_scroll_offset + max_visible:
        menu_scroll_offset = current_menu_index - max_visible + 1

    # Draw visible scripts
    y = 25
    for i in range(
        menu_scroll_offset, min(menu_scroll_offset + max_visible, total_scripts)
    ):
        script_name = scripts[i]

        # Truncate long names
        if len(script_name) > 20:
            display_name = script_name[:17] + "..."
        else:
            display_name = script_name

        # Highlight selected
        if i == current_menu_index:
            display.text_pixels(
                "> " + display_name, x=5, y=y, font="Lat15-Terminus12x6"
            )
        else:
            display.text_pixels(
                "  " + display_name, x=5, y=y, font="Lat15-Terminus12x6"
            )

        y += 15

    # Scroll indicator
    if menu_scroll_offset > 0:
        display.text_pixels("^", x=170, y=25)
    if menu_scroll_offset + max_visible < total_scripts:
        display.text_pixels("v", x=170, y=100)

    # Footer
    display.text_pixels("-" * 26, x=2, y=110)
    display.text_pixels("ENTER=Run  BACK=Exit", x=5, y=118, font="helvB08")

    display.update()


def draw_status_screen():
    """Draw the main status screen"""
    display.clear()

    # Title
    display.text_pixels("EV3 BRIDGE v2.3", x=15, y=2, font="Lat15-Terminus12x6")
    display.text_pixels("=" * 26, x=2, y=15)

    # Connection info
    display.text_pixels("Port: {0}".format(PORT), x=5, y=25)
    display.text_pixels("Scripts: {0}".format(len(script_list)), x=5, y=40)
    display.text_pixels("Running: {0}".format(len(running_scripts)), x=5, y=55)

    # Show running script names
    if running_scripts:
        y = 70
        for script_id, info in list(running_scripts.items())[:2]:  # Show max 2
            name = info["name"]
            if len(name) > 18:
                name = name[:15] + "..."
            display.text_pixels("* " + name, x=5, y=y, font="helvR08")
            y += 12

    # Battery
    try:
        voltage = power.measured_volts
        percentage = max(0, min(100, ((voltage - 7.4) / (9.0 - 7.4)) * 100))
        display.text_pixels(
            "Battery: {0:.1f}V ({1:.0f}%)".format(voltage, percentage), x=5, y=105
        )
    except:
        pass

    # Footer
    display.text_pixels("UP=Menu  BACK=Exit", x=15, y=118, font="helvB08")

    display.update()


def ui_loop():
    """Main UI loop with menu navigation"""
    global ui_mode, current_menu_index, menu_scroll_offset

    last_update = 0
    update_interval = 0.5
    button_pressed = {
        "up": False,
        "down": False,
        "left": False,
        "right": False,
        "enter": False,
        "back": False,
    }

    while True:
        current_time = time.time()

        # Update display
        if current_time - last_update >= update_interval:
            try:
                if ui_mode == "status":
                    draw_status_screen()
                elif ui_mode == "scripts":
                    draw_script_menu()

                last_update = current_time
            except Exception as e:
                log("UI draw error", str(e))

        # Handle button presses
        try:
            # UP button
            if buttons.up and not button_pressed["up"]:
                button_pressed["up"] = True

                if ui_mode == "status":
                    # Switch to script menu
                    ui_mode = "scripts"
                    current_menu_index = 0
                    menu_scroll_offset = 0
                    sound.beep()
                elif ui_mode == "scripts":
                    # Move selection up
                    if current_menu_index > 0:
                        current_menu_index -= 1
                        sound.tone([(600, 50)])

            elif not buttons.up:
                button_pressed["up"] = False

            # DOWN button
            if buttons.down and not button_pressed["down"]:
                button_pressed["down"] = True

                if ui_mode == "scripts":
                    scripts = script_manager.scan_scripts()
                    if current_menu_index < len(scripts) - 1:
                        current_menu_index += 1
                        sound.tone([(600, 50)])

            elif not buttons.down:
                button_pressed["down"] = False

            # ENTER button
            if buttons.enter and not button_pressed["enter"]:
                button_pressed["enter"] = True

                if ui_mode == "scripts":
                    scripts = script_manager.scan_scripts()
                    if scripts and current_menu_index < len(scripts):
                        # Run selected script
                        script_name = scripts[current_menu_index]
                        script_manager.run_script(script_name)

                        # Show confirmation
                        display.clear()
                        display.text_pixels("Running:", x=40, y=50)
                        display.text_pixels(script_name, x=20, y=65)
                        display.update()
                        time.sleep(1)

                        # Return to status
                        ui_mode = "status"

            elif not buttons.enter:
                button_pressed["enter"] = False

            # BACK button
            if buttons.backspace and not button_pressed["back"]:
                button_pressed["back"] = True

                if ui_mode == "scripts":
                    # Return to status
                    ui_mode = "status"
                    sound.tone([(400, 100)])
                else:
                    # Exit program
                    log("Backspace pressed - exiting")
                    display.clear()
                    display.text_pixels("Shutting down...", x=30, y=60)
                    display.update()
                    time.sleep(1)
                    os._exit(0)

            elif not buttons.backspace:
                button_pressed["back"] = False

        except Exception as e:
            log("Button handling error", str(e))

        time.sleep(0.05)  # 50ms loop


# ============================================================================
# SSL/SERVER
# ============================================================================


def generate_self_signed_cert(cert_file="ev3.crt", key_file="ev3.key"):
    """Generate self-signed certificate"""
    if os.path.exists(cert_file) and os.path.exists(key_file):
        return True

    try:
        import socket

        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)

        cmd = [
            "openssl",
            "req",
            "-x509",
            "-newkey",
            "rsa:2048",
            "-nodes",
            "-out",
            cert_file,
            "-keyout",
            key_file,
            "-days",
            "365",
            "-subj",
            "/CN={0}".format(local_ip),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        log("Certificate generation failed", str(e))
        return False


def run_server():
    """Start HTTP server"""
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("", PORT), BridgeHandler)
    server.allow_reuse_address = True

    if USE_SSL:
        if not generate_self_signed_cert(SSL_CERT, SSL_KEY):
            log("Cannot start HTTPS without certificates")
            return

        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(SSL_CERT, SSL_KEY)
        server.socket = context.wrap_socket(server.socket, server_side=True)

    log("=" * 50)
    log("EV3 Bridge Server v2.3 Started")
    log("Protocol: {0}".format("HTTPS" if USE_SSL else "HTTP"))
    log("Port: {0}".format(PORT))
    log("=" * 50)

    server.serve_forever()


# ============================================================================
# MAIN
# ============================================================================


def main():
    global VERBOSE, PORT, USE_SSL, SSL_CERT, SSL_KEY

    parser = argparse.ArgumentParser(description="EV3 Bridge Server v2.3")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--no-ui", action="store_true")
    parser.add_argument("--ssl", "--https", action="store_true")
    parser.add_argument("--cert", type=str, default="ev3.crt")
    parser.add_argument("--key", type=str, default="ev3.key")

    args = parser.parse_args()

    PORT = args.port
    VERBOSE = args.verbose
    USE_SSL = args.ssl
    SSL_CERT = args.cert
    SSL_KEY = args.key

    if USE_SSL and args.port == 8080:
        PORT = 8443

    print("=" * 50)
    print("EV3 BRIDGE SERVER v2.3 with Script Manager")
    print("=" * 50)

    # Start script scanning thread
    def script_scanner():
        while True:
            script_manager.scan_scripts()
            time.sleep(2)

    scanner_thread = threading.Thread(target=script_scanner, daemon=True)
    scanner_thread.start()

    # Start server thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    if args.no_ui:
        log("Running in headless mode")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    else:
        # Run UI with menu
        try:
            ui_loop()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
