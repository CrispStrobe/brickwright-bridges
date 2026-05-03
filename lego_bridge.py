#!/usr/bin/env python3
"""
LEGO Unified WebSocket Bridge - FEATURE COMPLETE
Supports: NXT, SPIKE Prime, and Boost hubs with full protocol debugging
"""

import asyncio
import base64
import glob
import json
import os
import time
from datetime import datetime
from typing import Any, Optional

import serial
import websockets

# BLE support for Boost
try:
    from bleak import BleakClient, BleakScanner

    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False
    print("⚠️  'bleak' not installed. Boost support disabled.")
    print("   Install with: pip install bleak --break-system-packages")

# ============================================================================
# CONFIGURATION
# ============================================================================

CONFIG = {
    "nxt": {
        "port": 8080,
        "com_port": os.getenv("NXT_PORT", "/dev/cu.NXT"),
        "baudrate": 115200,
        "poll_timeout": 5.0,
        "poll_interval": 0.01,
    },
    "spike": {
        "port": 8081,
        "com_port": os.getenv("SPIKE_PORT", "/dev/cu.LEGOHub"),
        "baudrate": 115200,
    },
    "boost": {
        "port": 8082,
        "ble_service": "00001623-1212-efde-1623-785feabcd123",
        "ble_characteristic": "00001624-1212-efde-1623-785feabcd123",
    },
}

DEBUG = True

stats = {
    "nxt": {"to_hub": 0, "from_hub": 0, "errors": 0},
    "spike": {"to_hub": 0, "from_hub": 0, "errors": 0},
    "boost": {"to_hub": 0, "from_hub": 0, "errors": 0},
    "start_time": None,
}

# ============================================================================
# NXT PROTOCOL CONSTANTS
# ============================================================================

NXT_OPCODE_NAMES = {
    # Command types
    0x00: "DIRECT_CMD",
    0x80: "DIRECT_CMD_NO_REPLY",
    0x01: "SYSTEM_CMD",
    0x81: "SYSTEM_CMD_NO_REPLY",
    0x02: "REPLY",
    # Direct commands
    0x03: "PLAY_TONE",
    0x04: "SET_OUT_STATE",
    0x05: "SET_IN_MODE",
    0x06: "GET_OUT_STATE",
    0x07: "GET_IN_VALS",
    0x08: "RESET_IN_VAL",
    0x09: "MESSAGE_WRITE",
    0x0A: "RESET_POSITION",
    0x0B: "GET_BATT_LVL",
    0x0C: "STOP_SOUND",
    0x0D: "KEEP_ALIVE",
    0x0E: "LS_GET_STATUS",
    0x0F: "LS_WRITE",
    0x10: "LS_READ",
    0x11: "GET_CURR_PROGRAM",
    0x13: "MESSAGE_READ",
    # System commands
    0x81: "OPEN_READ",  # noqa: F601 — 0x81 also names SYSTEM_CMD_NO_REPLY (cmd-type byte); TODO split into separate dicts
    0x82: "OPEN_WRITE",
    0x83: "READ",
    0x84: "WRITE",
    0x85: "CLOSE",
    0x86: "DELETE",
    0x87: "FIND_FIRST",
    0x88: "FIND_NEXT",
    0x89: "GET_FIRMWARE_VERSION",
    0x8A: "OPEN_WRITE_LINEAR",
    0x8B: "OPEN_READ_LINEAR",
    0x8C: "OPEN_WRITE_DATA",
    0x8D: "OPEN_APPEND_DATA",
    0x90: "BOOT",
    0x91: "SET_BRICK_NAME",
    0x92: "GET_DEVICE_INFO",
    0x93: "DELETE_USER_FLASH",
    0x94: "POLL_CMD_LEN",
    0x95: "POLL_CMD",
    0x96: "RENAME_FILE",
    0x97: "BTFACTORYRESET",
    0x94: "READ_IO_MAP",  # noqa: F601 — also names POLL_CMD_LEN earlier in same dict; TODO split
    0x95: "WRITE_IO_MAP",  # noqa: F601 — also names POLL_CMD earlier in same dict; TODO split
}

NXT_ERROR_CODES = {
    0x00: "Success",
    0x20: "Pending communication transaction in progress",
    0x40: "Specified mailbox queue is empty",
    0x81: "No more handles",
    0x82: "No space",
    0x83: "No more files",
    0x84: "End of file expected",
    0x85: "End of file",
    0x86: "Not a linear file",
    0x87: "File not found",
    0x88: "Handle already closed",
    0x89: "No linear space",
    0x8A: "Undefined error",
    0x8B: "File is busy",
    0x8C: "No write buffers",
    0x8D: "Append not possible",
    0x8E: "File is full",
    0x8F: "File exists",
    0x90: "Module not found",
    0x91: "Out of boundary",
    0x92: "Illegal file name",
    0x93: "Illegal handle",
    0xBD: "Request failed (i.e. specified file not found)",
    0xBE: "Unknown command opcode",
    0xBF: "Insane packet",
    0xC0: "Data contains out-of-range values",
    0xDD: "Communication bus error",
    0xDE: "No free memory in communication buffer",
    0xDF: "Specified channel/connection is not valid",
    0xE0: "Specified channel/connection not configured or busy",
    0xEC: "No active program",
    0xED: "Illegal size specified",
    0xEE: "Illegal mailbox queue ID specified",
    0xEF: "Attempted to access invalid field of a structure",
    0xF0: "Bad input or output specified",
    0xFB: "Insufficient memory available",
    0xFF: "Bad arguments",
}

# ============================================================================
# SPIKE PRIME PROTOCOL CONSTANTS
# ============================================================================

SPIKE_JSON_MESSAGES = {
    0: "HUB_STATUS",
    1: "RUNTIME_ERROR",
    2: "BATTERY_UPDATE",
    3: "BUTTON_EVENT",
    4: "ORIENTATION_EVENT",
    5: "PORT_EVENT",
}

# ============================================================================
# BOOST PROTOCOL CONSTANTS
# ============================================================================

BOOST_MESSAGE_TYPES = {
    0x01: "HUB_PROPERTIES",
    0x02: "HUB_ACTIONS",
    0x03: "HUB_ALERTS",
    0x04: "HUB_ATTACHED_IO",
    0x05: "ERROR",
    0x41: "PORT_INPUT_FORMAT_SETUP_SINGLE",
    0x42: "PORT_INPUT_FORMAT_SETUP_COMBINED",
    0x43: "PORT_INFORMATION",
    0x44: "PORT_MODE_INFORMATION",
    0x45: "PORT_VALUE",
    0x46: "PORT_VALUE_COMBINED",
    0x47: "PORT_INPUT_FORMAT",
    0x48: "PORT_INPUT_FORMAT_COMBINED",
    0x81: "OUTPUT",
    0x82: "PORT_FEEDBACK",
}

BOOST_DEVICE_TYPES = {
    0x00: "UNKNOWN",
    0x01: "MOTOR_WEDO",
    0x02: "MOTOR_SYSTEM",
    0x05: "BUTTON",
    0x08: "LIGHT",
    0x14: "VOLTAGE",
    0x15: "CURRENT",
    0x16: "PIEZO",
    0x17: "LED",
    0x22: "TILT_EXTERNAL",
    0x23: "MOTION_SENSOR",
    0x25: "COLOR_DISTANCE",
    0x26: "MOTOREXT",
    0x27: "MOTORINT",
    0x28: "TILT",
    0x3F: "FORCE_SENSOR",
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================


def format_hex(data: bytes, max_len: int = 100) -> str:
    """Format bytes as uppercase hex string"""
    hex_str = data.hex().upper()
    if len(hex_str) > max_len:
        return hex_str[:max_len] + "..."
    return hex_str


def parse_nxt_packet(data: bytes) -> str:
    """Parse NXT packet and return human-readable description"""
    if len(data) < 4:
        return ""

    length = data[0] | (data[1] << 8)
    details = f"[Len:{length}]"

    cmd_type = data[2]
    opcode = data[3]

    cmd_name = NXT_OPCODE_NAMES.get(cmd_type, f"0x{cmd_type:02X}")
    op_name = NXT_OPCODE_NAMES.get(opcode, f"0x{opcode:02X}")

    details += f" [{cmd_name} → {op_name}]"

    # Parse reply packets
    if cmd_type == 0x02:  # REPLY
        if len(data) >= 5:
            status = data[4]
            if status != 0x00:
                error_msg = NXT_ERROR_CODES.get(status, f"Unknown error 0x{status:02X}")
                details += f" [Error: {error_msg}]"
            else:
                details += " [Success]"

    # Parse specific commands
    if opcode == 0x04 and len(data) >= 14:  # SET_OUT_STATE
        port = data[4]
        power = data[5] if data[5] < 128 else data[5] - 256
        mode = data[6]
        details += f" [Port:{port} Power:{power} Mode:{mode}]"

    elif opcode == 0x0B and len(data) >= 7 and cmd_type == 0x02:  # GET_BATT_LVL reply
        voltage = data[5] | (data[6] << 8)
        details += f" [Battery:{voltage}mV]"

    elif opcode == 0x07 and len(data) >= 16 and cmd_type == 0x02:  # GET_IN_VALS reply
        port = data[4]
        valid = data[5]
        value = data[14] | (data[15] << 8)
        details += f" [Port:{port} Valid:{valid} Value:{value}]"

    return details


def parse_spike_message(message: str) -> str:
    """Parse SPIKE Prime message and return description"""
    try:
        data = json.loads(message)
        msg_type = data.get("m", -1)
        msg_name = SPIKE_JSON_MESSAGES.get(msg_type, f"MSG_{msg_type}")

        details = f"[{msg_name}]"

        if msg_type == 0:  # HUB_STATUS
            if "p" in data and len(data["p"]) > 0:
                details += f" [Ports:{len([p for p in data['p'] if p])}]"
        elif msg_type == 2:  # BATTERY
            if "p" in data and len(data["p"]) >= 2:
                details += f" [Battery:{data['p'][1]}%]"
        elif msg_type == 3:  # BUTTON
            if "p" in data and len(data["p"]) >= 2:
                details += f" [Button:{data['p'][0]} Pressed:{data['p'][1]}]"

        return details
    except Exception:
        # Not JSON, check for Python output
        if message.startswith("SENSORS:"):
            return "[Sensor Data]"
        elif message.startswith("MOTOR:"):
            return "[Motor Data]"
        elif message.startswith("GESTURE:"):
            return "[Gesture Event]"
        elif "PYTHON_AVAILABLE" in message:
            return "[Python Ready]"
        elif message.startswith(">>>") or message.startswith("..."):
            return "[Python REPL]"
        return ""


def parse_boost_packet(data: bytes) -> str:
    """Parse Boost BLE packet and return description"""
    if len(data) < 3:
        return ""

    length = data[0]
    hub_id = data[1]
    msg_type = data[2]

    msg_name = BOOST_MESSAGE_TYPES.get(msg_type, f"0x{msg_type:02X}")
    details = f"[Len:{length} Hub:{hub_id} Type:{msg_name}]"

    if msg_type == 0x04 and len(data) >= 6:  # HUB_ATTACHED_IO
        port = data[3]
        event = data[4]
        if event == 0x01:  # Attached
            device_type = data[5]
            device_name = BOOST_DEVICE_TYPES.get(device_type, f"0x{device_type:02X}")
            details += f" [Port:{port} Attached:{device_name}]"
        elif event == 0x00:  # Detached
            details += f" [Port:{port} Detached]"

    elif msg_type == 0x45 and len(data) >= 5:  # PORT_VALUE
        port = data[3]
        value = data[4]
        details += f" [Port:{port} Value:{value}]"

    elif msg_type == 0x01:  # HUB_PROPERTIES
        if len(data) >= 5:
            prop = data[3]
            data[4]
            if prop == 0x06 and len(data) >= 6:  # Battery
                details += f" [Battery:{data[5]}%]"

    return details


def log_message(hub_type: str, direction: str, data: Any, description: str = ""):
    """Log message with full protocol details"""
    if not DEBUG:
        return

    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    arrow = "➡️" if direction == "TO_HUB" else "⬅️"

    # Color codes
    colors = {
        "nxt": "\033[94m",  # Blue
        "spike": "\033[93m",  # Yellow
        "boost": "\033[95m",  # Magenta
        "from": "\033[92m",  # Green
    }

    color = colors.get(hub_type if direction == "TO_HUB" else "from", "\033[0m")

    # Format data and parse protocol
    if isinstance(data, bytes):
        hex_str = format_hex(data, 100)

        # Parse based on hub type
        if hub_type == "nxt":
            protocol_details = parse_nxt_packet(data)
        elif hub_type == "boost":
            protocol_details = parse_boost_packet(data)
        else:
            protocol_details = ""

        display = f"{hex_str}{protocol_details}"
    else:
        # Text data (SPIKE Prime)
        display = str(data)[:200]
        if hub_type == "spike":
            protocol_details = parse_spike_message(str(data))
            if protocol_details:
                display += f" {protocol_details}"

    log_line = f"[{timestamp}] [{hub_type.upper()}] {arrow} {direction}: {display}"
    if description:
        log_line += f" | {description}"

    print(f"{color}{log_line}\033[0m")


def print_stats():
    """Print accumulated statistics"""
    if not DEBUG or stats["start_time"] is None:
        return

    elapsed = (datetime.now() - stats["start_time"]).total_seconds()
    print("\n📊 Statistics:")
    print(f"   Uptime: {elapsed:.1f}s")

    for hub_type in ["nxt", "spike", "boost"]:
        hub_stats = stats[hub_type]
        total = hub_stats["to_hub"] + hub_stats["from_hub"]
        if total > 0:
            rate = total / elapsed if elapsed > 0 else 0
            print(
                f"   {hub_type.upper():6s}: ↗ {hub_stats['to_hub']:4d} ↙ {hub_stats['from_hub']:4d} ❌ {hub_stats['errors']:3d} | {rate:.1f} msg/sec"
            )


def auto_detect_serial_port(hub_type: str) -> Optional[str]:
    """Auto-detect serial port for hub type"""
    patterns = {
        "nxt": ["/dev/cu.NXT*", "/dev/tty.NXT*", "/dev/ttyUSB*"],
        "spike": ["/dev/cu.LEGOHub*", "/dev/tty.LEGOHub*", "/dev/ttyACM*"],
    }

    for pattern in patterns.get(hub_type, []):
        ports = glob.glob(pattern)
        if ports:
            return ports[0]

    return None


# ============================================================================
# NXT CONNECTION HANDLER
# ============================================================================


class NXTConnection:
    """Manages NXT Bluetooth serial connection with full protocol support"""

    def __init__(self, port_name: str):
        self.port_name = port_name
        self.ser = None
        self.connected = False

    def connect(self) -> bool:
        """Open serial connection"""
        try:
            self.ser = serial.Serial(
                self.port_name, baudrate=CONFIG["nxt"]["baudrate"], timeout=0.1
            )
            self.connected = True
            print(f"✅ [NXT] Connected to {self.port_name}")
            return True
        except Exception as e:
            print(f"❌ [NXT] Connection failed: {e}")
            return False

    def is_alive(self) -> bool:
        """Check if connection is alive"""
        return self.connected and self.ser and self.ser.is_open

    def read_packet_polling(self) -> Optional[bytes]:
        """Read NXT packet with polling (matches original implementation exactly)"""
        try:
            start_time = time.time()
            timeout = CONFIG["nxt"]["poll_timeout"]

            # Wait for header (2 bytes)
            while time.time() - start_time < timeout:
                if self.ser.in_waiting >= 2:
                    break
                time.sleep(CONFIG["nxt"]["poll_interval"])

            if self.ser.in_waiting < 2:
                return None  # Timeout, no data

            # Read header
            header = self.ser.read(2)
            if len(header) < 2:
                return None

            length = header[0] | (header[1] << 8)

            if length > 256 or length == 0:
                if DEBUG:
                    print(f"⚠️ [NXT] Invalid length: {length}")
                return None

            # Wait for payload
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.ser.in_waiting >= length:
                    break
                time.sleep(CONFIG["nxt"]["poll_interval"])

            # Read data
            data = self.ser.read(length)

            if len(data) < length:
                if DEBUG:
                    print(f"⚠️ [NXT] Incomplete: got {len(data)}/{length}")
                return None

            return header + data

        except Exception as e:
            if DEBUG:
                print(f"⚠️ [NXT] Read error: {e}")
            return None

    def write(self, data: bytes) -> bool:
        """Write data to NXT with retry logic"""
        if not self.is_alive():
            return False

        max_retries = 3
        for retry_count in range(max_retries):
            try:
                self.ser.write(data)
                self.ser.flush()
                return True
            except Exception as e:
                stats["nxt"]["errors"] += 1
                if DEBUG:
                    print(
                        f"⚠️ [NXT] Write error (attempt {retry_count + 1}/{max_retries}): {e}"
                    )

                if retry_count < max_retries - 1:
                    time.sleep(0.02)
                else:
                    if DEBUG:
                        print(f"❌ [NXT] Write failed after {max_retries} attempts")
                    return False

        return False

    def close(self):
        """Close connection"""
        self.connected = False
        if self.ser:
            try:
                self.ser.close()
            except Exception:
                pass


# ============================================================================
# SPIKE PRIME CONNECTION HANDLER
# ============================================================================


class SPIKEConnection:
    """Manages SPIKE Prime serial connection"""

    def __init__(self, port_name: str):
        self.port_name = port_name
        self.ser = None
        self.connected = False
        self.read_buffer = ""

    def connect(self) -> bool:
        """Open serial connection"""
        try:
            self.ser = serial.Serial(
                self.port_name, baudrate=CONFIG["spike"]["baudrate"], timeout=0.1
            )
            self.connected = True

            # Send Ctrl-C to interrupt running program
            self.ser.write(b"\x03")
            time.sleep(0.2)

            print(f"✅ [SPIKE] Connected to {self.port_name}")
            return True
        except Exception as e:
            print(f"❌ [SPIKE] Connection failed: {e}")
            return False

    def is_alive(self) -> bool:
        """Check if connection is alive"""
        return self.connected and self.ser and self.ser.is_open

    def read_line_nonblocking(self) -> Optional[str]:
        """Read a line without blocking"""
        if not self.is_alive():
            return None

        try:
            if self.ser.in_waiting > 0:
                chunk = self.ser.read(self.ser.in_waiting).decode(
                    "utf-8", errors="ignore"
                )
                self.read_buffer += chunk

            if "\n" in self.read_buffer:
                line, self.read_buffer = self.read_buffer.split("\n", 1)
                return line.strip()

            return None
        except Exception as e:
            if DEBUG:
                print(f"⚠️ [SPIKE] Read error: {e}")
            return None

    def write(self, data: str) -> bool:
        """Write text to SPIKE"""
        if not self.is_alive():
            return False
        try:
            if isinstance(data, str):
                data = data.encode("utf-8")
            self.ser.write(data)
            self.ser.flush()
            return True
        except Exception as e:
            if DEBUG:
                print(f"⚠️ [SPIKE] Write error: {e}")
            return False

    def close(self):
        """Close connection"""
        self.connected = False
        if self.ser:
            try:
                self.ser.close()
            except Exception:
                pass


# ============================================================================
# BOOST CONNECTION HANDLER (BLE)
# ============================================================================


class BoostConnection:
    """Manages LEGO Boost BLE connection"""

    def __init__(self):
        self.client = None
        self.connected = False
        self.notification_callback = None

    async def scan(self, timeout: float = 5.0) -> Optional[str]:
        """Scan for Boost hub"""
        if not BLEAK_AVAILABLE:
            return None

        print("🔍 [BOOST] Scanning for Boost hub...")
        devices = await BleakScanner.discover(timeout=timeout)

        for device in devices:
            if device.name and (
                "Move Hub" in device.name or "BOOST" in device.name.upper()
            ):
                print(f"✅ [BOOST] Found hub: {device.name} ({device.address})")
                return device.address

        return None

    async def connect(self, address: str = None) -> bool:
        """Connect to Boost hub"""
        if not BLEAK_AVAILABLE:
            print("❌ [BOOST] BLE support not available")
            return False

        try:
            if not address:
                address = await self.scan()
                if not address:
                    print("❌ [BOOST] No hub found")
                    return False

            self.client = BleakClient(address)
            await self.client.connect()

            if self.client.is_connected:
                self.connected = True
                print(f"✅ [BOOST] Connected to {address}")
                return True

            return False

        except Exception as e:
            print(f"❌ [BOOST] Connection failed: {e}")
            return False

    def is_alive(self) -> bool:
        """Check if connection is alive"""
        return self.connected and self.client and self.client.is_connected

    async def start_notifications(self, characteristic_uuid: str, callback):
        """Start receiving notifications"""
        if not self.is_alive():
            return False

        try:
            self.notification_callback = callback
            await self.client.start_notify(characteristic_uuid, callback)
            return True
        except Exception as e:
            print(f"⚠️ [BOOST] Notification error: {e}")
            return False

    async def write(self, characteristic_uuid: str, data: bytes) -> bool:
        """Write data to Boost"""
        if not self.is_alive():
            return False

        try:
            await self.client.write_gatt_char(characteristic_uuid, data)
            return True
        except Exception as e:
            if DEBUG:
                print(f"⚠️ [BOOST] Write error: {e}")
            return False

    async def close(self):
        """Close connection"""
        self.connected = False
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass


# ============================================================================
# WEBSOCKET RELAY HANDLERS
# ============================================================================


async def nxt_relay_handler(websocket, nxt: NXTConnection):
    """Handle NXT WebSocket relay with full protocol support"""
    client_ip = websocket.remote_address[0]
    print(f"📱 [NXT] Client connected from {client_ip}")

    async def nxt_to_client():
        """Continuously poll for NXT packets"""
        consecutive_failures = 0
        while True:
            try:
                if not nxt.is_alive():
                    consecutive_failures += 1
                    if consecutive_failures > 5:
                        print("⚠️ [NXT] Connection dead, reconnecting...")
                        if nxt.connect():
                            consecutive_failures = 0
                        else:
                            await asyncio.sleep(1)
                            continue
                    await asyncio.sleep(0.1)
                    continue

                consecutive_failures = 0

                packet = await asyncio.get_event_loop().run_in_executor(
                    None, nxt.read_packet_polling
                )

                if packet:
                    log_message("nxt", "FROM_HUB", packet)
                    stats["nxt"]["from_hub"] += 1

                    b64_data = base64.b64encode(packet).decode("utf-8")
                    await websocket.send(b64_data)
                else:
                    await asyncio.sleep(0.05)

            except Exception as e:
                stats["nxt"]["errors"] += 1
                if DEBUG:
                    print(f"⚠️ [NXT] Reader error: {e}")
                break

    reader_task = asyncio.create_task(nxt_to_client())

    try:
        async for message in websocket:
            try:
                raw_telegram = base64.b64decode(message)

                if len(raw_telegram) == 0:
                    continue

                log_message("nxt", "TO_HUB", raw_telegram)
                stats["nxt"]["to_hub"] += 1

                # Write with retry logic
                await asyncio.get_event_loop().run_in_executor(
                    None, nxt.write, raw_telegram
                )

            except Exception as e:
                stats["nxt"]["errors"] += 1
                if DEBUG:
                    print(f"❌ [NXT] Message error: {e}")

    except websockets.exceptions.ConnectionClosed:
        print(f"📴 [NXT] Client {client_ip} disconnected")
        if DEBUG:
            print_stats()
    finally:
        reader_task.cancel()


async def spike_relay_handler(websocket, spike: SPIKEConnection):
    """Handle SPIKE Prime WebSocket relay"""
    client_ip = websocket.remote_address[0]
    print(f"📱 [SPIKE] Client connected from {client_ip}")

    async def spike_to_client():
        """Read from SPIKE and send to client"""
        consecutive_failures = 0
        while True:
            try:
                if not spike.is_alive():
                    consecutive_failures += 1
                    if consecutive_failures > 5:
                        print("⚠️ [SPIKE] Connection dead, reconnecting...")
                        if spike.connect():
                            consecutive_failures = 0
                        else:
                            await asyncio.sleep(1)
                            continue
                    await asyncio.sleep(0.1)
                    continue

                consecutive_failures = 0

                line = await asyncio.get_event_loop().run_in_executor(
                    None, spike.read_line_nonblocking
                )

                if line:
                    log_message("spike", "FROM_HUB", line)
                    stats["spike"]["from_hub"] += 1
                    await websocket.send(line)
                else:
                    await asyncio.sleep(0.02)

            except Exception as e:
                stats["spike"]["errors"] += 1
                if DEBUG:
                    print(f"⚠️ [SPIKE] Reader error: {e}")
                break

    reader_task = asyncio.create_task(spike_to_client())

    try:
        async for message in websocket:
            try:
                log_message("spike", "TO_HUB", message)
                stats["spike"]["to_hub"] += 1

                if not spike.write(message + "\r\n"):
                    stats["spike"]["errors"] += 1

            except Exception as e:
                stats["spike"]["errors"] += 1
                if DEBUG:
                    print(f"❌ [SPIKE] Message error: {e}")

    except websockets.exceptions.ConnectionClosed:
        print(f"📴 [SPIKE] Client {client_ip} disconnected")
    finally:
        reader_task.cancel()


async def boost_relay_handler(websocket, boost: BoostConnection):
    """Handle LEGO Boost WebSocket relay"""
    client_ip = websocket.remote_address[0]
    print(f"📱 [BOOST] Client connected from {client_ip}")

    def notification_handler(sender, data: bytearray):
        """Handle BLE notifications"""
        log_message("boost", "FROM_HUB", bytes(data))
        stats["boost"]["from_hub"] += 1

        b64_data = base64.b64encode(bytes(data)).decode("utf-8")
        asyncio.create_task(websocket.send(b64_data))

    await boost.start_notifications(
        CONFIG["boost"]["ble_characteristic"], notification_handler
    )

    try:
        async for message in websocket:
            try:
                raw_data = base64.b64decode(message)

                if len(raw_data) == 0:
                    continue

                log_message("boost", "TO_HUB", raw_data)
                stats["boost"]["to_hub"] += 1

                await boost.write(CONFIG["boost"]["ble_characteristic"], raw_data)

            except Exception as e:
                stats["boost"]["errors"] += 1
                if DEBUG:
                    print(f"❌ [BOOST] Message error: {e}")

    except websockets.exceptions.ConnectionClosed:
        print(f"📴 [BOOST] Client {client_ip} disconnected")


# ============================================================================
# SERVER INITIALIZATION
# ============================================================================


async def start_nxt_server(nxt: NXTConnection):
    """Start NXT WebSocket server"""
    async with websockets.serve(
        lambda ws: nxt_relay_handler(ws, nxt), "0.0.0.0", CONFIG["nxt"]["port"]
    ):
        await asyncio.Future()


async def start_spike_server(spike: SPIKEConnection):
    """Start SPIKE Prime WebSocket server"""
    async with websockets.serve(
        lambda ws: spike_relay_handler(ws, spike), "0.0.0.0", CONFIG["spike"]["port"]
    ):
        await asyncio.Future()


async def start_boost_server(boost: BoostConnection):
    """Start LEGO Boost WebSocket server"""
    async with websockets.serve(
        lambda ws: boost_relay_handler(ws, boost), "0.0.0.0", CONFIG["boost"]["port"]
    ):
        await asyncio.Future()


# ============================================================================
# MAIN
# ============================================================================


async def main():
    """Main entry point"""
    print("🚀 LEGO Unified Bridge - Feature Complete")
    print("=" * 60)
    if DEBUG:
        print("🔍 DEBUG MODE ENABLED - Full Protocol Inspection")

    stats["start_time"] = datetime.now()

    # Get local IP
    import socket

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = "127.0.0.1"
    finally:
        s.close()

    # Initialize connections
    servers = []
    connections = []

    # NXT
    nxt_port = auto_detect_serial_port("nxt") or CONFIG["nxt"]["com_port"]
    nxt = NXTConnection(nxt_port)
    if nxt.connect():
        servers.append(("nxt", start_nxt_server(nxt)))
        connections.append(("nxt", nxt))
    else:
        print("⚠️  [NXT] Skipping (not connected)")

    # SPIKE Prime
    spike_port = auto_detect_serial_port("spike") or CONFIG["spike"]["com_port"]
    spike = SPIKEConnection(spike_port)
    if spike.connect():
        servers.append(("spike", start_spike_server(spike)))
        connections.append(("spike", spike))
    else:
        print("⚠️  [SPIKE] Skipping (not connected)")

    # LEGO Boost
    if BLEAK_AVAILABLE:
        boost = BoostConnection()
        if await boost.connect():
            servers.append(("boost", start_boost_server(boost)))
            connections.append(("boost", boost))
        else:
            print("⚠️  [BOOST] Skipping (not connected)")
    else:
        print("⚠️  [BOOST] Skipping (bleak not installed)")

    if not servers:
        print("\n❌ No hubs connected! Exiting.")
        return

    # Print connection info
    print("\n" + "=" * 60)
    print("📡 WebSocket Servers:")
    if any(name == "nxt" for name, _ in servers):
        print(f"   NXT:   ws://{local_ip}:{CONFIG['nxt']['port']}")
    if any(name == "spike" for name, _ in servers):
        print(f"   SPIKE: ws://{local_ip}:{CONFIG['spike']['port']}")
    if any(name == "boost" for name, _ in servers):
        print(f"   BOOST: ws://{local_ip}:{CONFIG['boost']['port']}")
    print("=" * 60)
    print(f"\n💡 In TurboWarp: connect to [{local_ip}:PORT]")
    print("⌨️  Press Ctrl+C to stop\n")

    # Run all servers
    try:
        await asyncio.gather(*[server for _, server in servers])
    except asyncio.CancelledError:
        pass
    finally:
        # Cleanup
        for _name, conn in connections:
            if hasattr(conn, "close"):
                if asyncio.iscoroutinefunction(conn.close):
                    await conn.close()
                else:
                    conn.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Bridge stopped")
        if DEBUG:
            print_stats()
