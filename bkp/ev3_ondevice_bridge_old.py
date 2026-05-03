#!/usr/bin/env python3

"""
ev3_ondevice_bridge_old.py
Complete EV3 Bridge Server v2.1
Runs on EV3 Brick - Provides HTTP API for both streaming control and script management
Python 3.5.3 compatible
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
from datetime import datetime
import ssl
import subprocess

# EV3 imports
from ev3dev2.motor import (
    LargeMotor,
    MediumMotor,
    OUTPUT_A,
    OUTPUT_B,
    OUTPUT_C,
    OUTPUT_D,
    SpeedPercent,
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


def signal_handler(sig, frame):
    """Handle Ctrl+C and termination signals"""
    global stop_all
    print("\nStopping all scripts...")
    stop_all = True

    # Stop all motors immediately
    try:
        for motor in list(motors.values()):
            if motor:
                try:
                    motor.stop()
                except:
                    pass
    except:
        pass

    # Clean exit
    print("Shutdown complete")
    os._exit(0)


# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Configuration
PORT = 8080
SCRIPTS_DIR = "/home/robot/scripts"
SOUNDS_DIR = "/home/robot/sounds"

USE_SSL = False
SSL_CERT = "ev3.crt"
SSL_KEY = "ev3.key"

# Ensure directories exist
os.makedirs(SCRIPTS_DIR, exist_ok=True)
os.makedirs(SOUNDS_DIR, exist_ok=True)

# Global verbose flag
VERBOSE = False

# Hardware Cache
motors = {}
sensors = {}
display = Display()
sound = Sound()
buttons = Button()
leds = Leds()
power = PowerSupply()

# Running scripts tracking
running_scripts = {}
script_counter = 0


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


def get_motor(port_char):
    """Lazy load motors with disconnect protection and optimization"""
    vlog("get_motor called", {"port": port_char})

    # Check if motor exists in cache
    if port_char in motors:
        motor = motors[port_char]
        if motor:
            # Verify motor is still connected
            try:
                _ = motor.is_running  # Quick connectivity check
                return motor
            except Exception as e:
                log("Motor {0} disconnected".format(port_char), str(e))
                motors[port_char] = None
                # Fall through to re-initialization

    # Initialize new motor
    try:
        mapping = {"A": OUTPUT_A, "B": OUTPUT_B, "C": OUTPUT_C, "D": OUTPUT_D}

        # Try LargeMotor first (most common)
        try:
            motors[port_char] = LargeMotor(mapping[port_char])
            log("Large motor initialized on port {0}".format(port_char))
        except:
            # Try MediumMotor as fallback
            try:
                motors[port_char] = MediumMotor(mapping[port_char])
                log("Medium motor initialized on port {0}".format(port_char))
            except:
                log("No motor found on port {0}".format(port_char))
                motors[port_char] = None
                return None

        vlog(
            "Motor details",
            {
                "port": port_char,
                "driver": motors[port_char].driver_name,
                "address": motors[port_char].address,
                "type": motors[port_char].__class__.__name__,
            },
        )

    except Exception as e:
        log("Failed to initialize motor on port {0}".format(port_char), str(e))
        if VERBOSE:
            traceback.print_exc()
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
            vlog(
                "Medium motor details",
                {
                    "port": port_char,
                    "driver": motors[key].driver_name,
                    "address": motors[key].address,
                },
            )
        except Exception as e:
            log(
                "Failed to initialize medium motor on port {0}".format(port_char),
                str(e),
            )
            if VERBOSE:
                traceback.print_exc()
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
                sensor.mode = "COL-REFLECT"  # Default to reflected light
            elif sensor_type == "ultrasonic":
                sensor.mode = "US-DIST-CM"
            elif sensor_type == "gyro":
                sensor.mode = "GYRO-ANG"
            elif sensor_type == "infrared":
                sensor.mode = "IR-PROX"

            log("Initialized {0} sensor on port {1}".format(sensor_type, port))
            vlog(
                "Sensor details",
                {
                    "port": port,
                    "type": sensor_type,
                    "driver": sensors[key].driver_name,
                    "address": sensors[key].address,
                    "mode": sensors[key].mode,
                },
            )
        except Exception as e:
            log(
                "Failed to initialize {0} sensor on port {1}".format(sensor_type, port),
                str(e),
            )
            if VERBOSE:
                traceback.print_exc()
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


class BridgeHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        """Override to ALWAYS log requests for debugging"""
        log(
            "HTTP {0} {1} from {2}".format(
                self.command, self.path, self.client_address[0]
            )
        )

    def _send_json(self, data, code=200):
        """Send JSON response - ENHANCED CORS"""
        vlog("Sending response", {"code": code, "data": data})
        self.send_response(code)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight - ENHANCED"""
        vlog("CORS preflight request")
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-Requested-With",
        )
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        """Handle POST requests (commands)"""
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode("utf-8"))
            command = data.get("cmd")

            log("Command received: {0}".format(command))
            vlog("Command data", data)

            # === UPLOAD HANDLING ===
            if command == "upload_script":
                filename = os.path.join(SCRIPTS_DIR, data["name"])
                with open(filename, "w") as f:
                    f.write(data["code"])
                os.chmod(filename, 0o755)
                log("Script uploaded: {0}".format(data["name"]))
                self._send_json(
                    {"status": "ok", "msg": "Saved {0}".format(data["name"])}
                )

            elif command == "upload_sound":
                filename = os.path.join(SOUNDS_DIR, data["name"])
                # Decode base64 if present
                if "data" in data:
                    sound_data = base64.b64decode(data["data"])
                    with open(filename, "wb") as f:
                        f.write(sound_data)
                    log("Sound uploaded: {0}".format(data["name"]))
                    self._send_json({"status": "ok", "msg": "Sound uploaded"})
                else:
                    self._send_json({"status": "error", "msg": "No sound data"}, 400)

            # === SCRIPT EXECUTION ===
            elif command == "run_script":
                path = os.path.join(SCRIPTS_DIR, data["name"])
                if os.path.exists(path):
                    global script_counter
                    script_id = script_counter
                    script_counter += 1
                    proc = subprocess.Popen(["python3", path])
                    running_scripts[script_id] = {
                        "name": data["name"],
                        "process": proc,
                        "started": time.time(),
                    }
                    log("Script started: {0} (ID: {1})".format(data["name"], script_id))
                    self._send_json(
                        {"status": "ok", "msg": "Started", "script_id": script_id}
                    )
                else:
                    self._send_json({"status": "error", "msg": "File not found"}, 404)

            elif command == "stop_script":
                script_id = data.get("script_id")
                if script_id in running_scripts:
                    running_scripts[script_id]["process"].terminate()
                    del running_scripts[script_id]
                    log("Script stopped (ID: {0})".format(script_id))
                    self._send_json({"status": "ok", "msg": "Stopped"})
                else:
                    self._send_json({"status": "error", "msg": "Script not found"}, 404)

            elif command == "list_scripts":
                try:
                    scripts = [f for f in os.listdir(SCRIPTS_DIR) if f.endswith(".py")]
                    vlog("Listing scripts", {"count": len(scripts)})
                    self._send_json({"status": "ok", "scripts": scripts})
                except Exception as e:
                    self._send_json({"status": "error", "msg": str(e)}, 500)

            elif command == "delete_script":
                try:
                    filename = os.path.join(SCRIPTS_DIR, data["name"])
                    if os.path.exists(filename):
                        os.remove(filename)
                        log("Script deleted: {0}".format(data["name"]))
                        self._send_json({"status": "ok", "msg": "Deleted"})
                    else:
                        self._send_json(
                            {"status": "error", "msg": "File not found"}, 404
                        )
                except Exception as e:
                    self._send_json({"status": "error", "msg": str(e)}, 500)

            # === MOTORS ===
            elif command == "motor_run":
                m = get_motor(data["port"])
                if safe_motor_command(
                    m, lambda: m.on(SpeedPercent(data["speed"])), "Motor run failed"
                ):
                    vlog(
                        "Motor running", {"port": data["port"], "speed": data["speed"]}
                    )
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
                # Play sequence of notes
                notes = data.get("notes", [])  # List of (note, duration) tuples
                for note, duration in notes:
                    sound.play_note(note, duration)
                vlog("Playing song", {"notes": notes})
                self._send_json({"status": "ok"})

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
        """Handle GET requests (sensor reads, status)"""
        vlog("GET request", {"path": self.path})

        try:
            # === ROOT STATUS ===
            if self.path == "/" or self.path == "/status":
                status = {
                    "status": "ev3_bridge_active",
                    "version": "2.1.0",
                    "uptime": time.time(),
                    "running_scripts": len(running_scripts),
                    "motors": list(motors.keys()),
                    "sensors": list(sensors.keys()),
                }
                self._send_json(status)

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
                sensor = get_sensor(port, TouchSensor)
                value = sensor.is_pressed if sensor else False
                vlog("Touch sensor read", {"port": port, "pressed": value})
                self._send_json({"value": value})

            # === COLOR SENSOR ===
            elif self.path.startswith("/sensor/color/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "color"

                sensor = get_sensor(port, ColorSensor)

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

                sensor = get_sensor(port, ColorSensor)

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
                sensor = get_sensor(port, UltrasonicSensor)
                value = sensor.distance_centimeters if sensor else 0
                vlog("Ultrasonic sensor read", {"port": port, "distance": value})
                self._send_json({"value": value})

            # === GYRO SENSOR ===
            elif self.path.startswith("/sensor/gyro/"):
                parts = self.path.split("/")
                port = parts[3]
                mode = parts[4] if len(parts) > 4 else "angle"

                sensor = get_sensor(port, GyroSensor)

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

                sensor = get_sensor(port, InfraredSensor)

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


def generate_self_signed_cert(cert_file="ev3.crt", key_file="ev3.key"):
    """Generate self-signed certificate if it doesn't exist"""
    if os.path.exists(cert_file) and os.path.exists(key_file):
        log("Using existing certificate: {0}".format(cert_file))
        return True

    log("Generating self-signed certificate...")
    try:
        # Get EV3's IP address for CN
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

        if result.returncode == 0:
            log("Certificate generated successfully")
            log("Install {0} on iOS devices to trust certificate".format(cert_file))
            return True
        else:
            log("Certificate generation failed", result.stderr)
            return False

    except Exception as e:
        log("Failed to generate certificate", str(e))
        if VERBOSE:
            traceback.print_exc()
        return False


def run_server():
    """Start HTTP server with optional SSL/TLS support"""
    # Enable address reuse to prevent "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True

    server = None
    try:
        # Create base server
        server = socketserver.TCPServer(("", PORT), BridgeHandler)
        server.allow_reuse_address = True

        # Wrap with SSL if enabled
        if USE_SSL:
            log("Enabling HTTPS/SSL mode")

            # Generate certificate if needed
            if not os.path.exists(SSL_CERT) or not os.path.exists(SSL_KEY):
                if not generate_self_signed_cert(SSL_CERT, SSL_KEY):
                    log("Cannot start HTTPS server without certificates")
                    return

            # Create SSL context
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            try:
                context.load_cert_chain(SSL_CERT, SSL_KEY)
                server.socket = context.wrap_socket(server.socket, server_side=True)
                log("SSL/TLS enabled successfully")
            except Exception as e:
                log("Failed to enable SSL", str(e))
                if VERBOSE:
                    traceback.print_exc()
                return

        log("=" * 50)
        log("EV3 Bridge Server v2.1 Started")
        log("=" * 50)
        log("Protocol: {0}".format("HTTPS" if USE_SSL else "HTTP"))
        log("Listening on port {0}".format(PORT))
        log("Verbose logging: {0}".format("ENABLED" if VERBOSE else "DISABLED"))

        if USE_SSL:
            log("Certificate: {0}".format(SSL_CERT))
            log("IMPORTANT: Install {0} on client devices!".format(SSL_CERT))

        log("Scripts directory: {0}".format(SCRIPTS_DIR))
        log("Sounds directory: {0}".format(SOUNDS_DIR))
        log("=" * 50)

        server.serve_forever()
    except KeyboardInterrupt:
        log("Server interrupted")
    except Exception as e:
        log("Server error", str(e))
        if VERBOSE:
            traceback.print_exc()
    finally:
        if server:
            log("Shutting down server...")
            server.shutdown()
            server.server_close()
        log("Server stopped")


def ui_loop():
    """Display UI on EV3 screen"""
    last_update = 0
    update_interval = 1.0  # Update every second

    while True:
        current_time = time.time()

        if current_time - last_update >= update_interval:
            try:
                display.clear()

                # Title
                display.text_pixels("EV3 BRIDGE v2.1", x=10, y=5)
                display.text_pixels("-" * 20, x=10, y=20)

                # Status
                display.text_pixels("Port: {0}".format(PORT), x=10, y=35)
                display.text_pixels(
                    "Scripts: {0}".format(len(running_scripts)), x=10, y=50
                )

                # Motor status - with disconnect protection
                y = 65
                for port, motor in list(
                    motors.items()
                ):  # Use list() to avoid dict change during iteration
                    if motor:
                        try:
                            # Test if motor is still connected
                            pos = motor.position
                            display.text_pixels(
                                "M{0}: {1}".format(port, pos), x=10, y=y
                            )
                            y += 15
                            if y > 110:
                                break
                        except Exception as e:
                            # Motor disconnected - remove from cache
                            log("Motor {0} disconnected".format(port), str(e))
                            motors[port] = None

                # Sensors - with disconnect protection
                sensor_count = 0
                for key, sensor in list(sensors.items()):
                    if sensor:
                        try:
                            # Test if sensor is still connected by accessing mode
                            _ = sensor.mode
                            sensor_count += 1
                        except Exception:
                            # Sensor disconnected - remove from cache
                            sensors[key] = None

                if sensor_count > 0:
                    display.text_pixels("Sensors: {0}".format(sensor_count), x=10, y=95)

                # Battery
                try:
                    voltage = power.measured_volts
                    display.text_pixels("Bat: {0:.1f}V".format(voltage), x=10, y=110)
                except Exception as e:
                    log("Battery read error", str(e))

                # Instructions
                display.text_pixels("Press BACK to exit", x=5, y=120)

                display.update()
                last_update = current_time

            except Exception as e:
                log("UI update error", str(e))
                if VERBOSE:
                    traceback.print_exc()

        # Check for exit button
        try:
            if buttons.backspace:
                log("Backspace pressed - exiting")
                display.clear()
                display.text_pixels("Shutting down...", x=30, y=60)
                display.update()
                time.sleep(1)
                os._exit(0)  # Force exit
        except Exception as e:
            log("Button check error", str(e))

        time.sleep(0.1)


def main():
    """Main entry point"""
    global VERBOSE, PORT, USE_SSL, SSL_CERT, SSL_KEY

    parser = argparse.ArgumentParser(description="EV3 Bridge Server v2.1")
    parser.add_argument(
        "--port", type=int, default=8080, help="HTTP server port (default: 8080)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose debug logging"
    )
    parser.add_argument(
        "--no-ui", action="store_true", help="Disable LCD UI (headless mode)"
    )
    parser.add_argument(
        "--ssl",
        "--https",
        action="store_true",
        help="Enable HTTPS/SSL (uses port 8443 by default)",
    )
    parser.add_argument(
        "--cert",
        type=str,
        default="ev3.crt",
        help="SSL certificate file (default: ev3.crt)",
    )
    parser.add_argument(
        "--key",
        type=str,
        default="ev3.key",
        help="SSL private key file (default: ev3.key)",
    )

    args = parser.parse_args()

    PORT = args.port
    VERBOSE = args.verbose
    USE_SSL = args.ssl
    SSL_CERT = args.cert
    SSL_KEY = args.key

    # Default to port 8443 for HTTPS if not explicitly set
    if USE_SSL and args.port == 8080:
        PORT = 8443
        log("SSL enabled - using default HTTPS port 8443")

    # Banner
    print("=" * 50)
    print("EV3 BRIDGE SERVER v2.1")
    print("Python 3.5.3 Compatible")
    print("=" * 50)
    print("Protocol: {0}".format("HTTPS" if USE_SSL else "HTTP"))
    print("Port: {0}".format(PORT))
    print("Verbose: {0}".format(VERBOSE))
    print("UI: {0}".format("Disabled" if args.no_ui else "Enabled"))
    if USE_SSL:
        print("Certificate: {0}".format(SSL_CERT))
        print("Key: {0}".format(SSL_KEY))
    print("=" * 50)

    # Start server in background thread
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()

    if args.no_ui:
        # Headless mode - just keep running
        log("Running in headless mode (no UI)")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            log("Interrupted - shutting down")
    else:
        # Run UI loop in main thread
        try:
            ui_loop()
        except KeyboardInterrupt:
            log("Interrupted - shutting down")
        except Exception as e:
            log("Fatal error in UI loop", str(e))
            if VERBOSE:
                traceback.print_exc()


if __name__ == "__main__":
    main()
