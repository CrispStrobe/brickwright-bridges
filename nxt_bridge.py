#!/usr/bin/env python3
"""
LEGO Unified WebSocket Bridge
Supports: NXT, SPIKE Prime, and Boost hubs
"""

import asyncio
import base64
import glob
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

# Configuration
CONFIG = {
    "nxt": {
        "port": 8080,
        "com_port": os.getenv("NXT_PORT", "/dev/cu.NXT"),
        "baudrate": 115200,
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
# UTILITY FUNCTIONS
# ============================================================================


def log_message(hub_type: str, direction: str, data: Any, description: str = ""):
    """Log message with color coding"""
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

    # Format data
    if isinstance(data, bytes):
        display_data = data.hex().upper()[:100]
    else:
        display_data = str(data)[:100]

    log_line = f"[{timestamp}] [{hub_type.upper()}] {arrow} {direction}: {display_data}"
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
        if hub_stats["to_hub"] > 0 or hub_stats["from_hub"] > 0:
            print(
                f"   {hub_type.upper()}: ↗ {hub_stats['to_hub']} ↙ {hub_stats['from_hub']} ❌ {hub_stats['errors']}"
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
    """Manages NXT Bluetooth serial connection"""

    def __init__(self, port_name: str):
        self.port_name = port_name
        self.ser = None
        self.connected = False

    def connect(self) -> bool:
        """Open serial connection"""
        try:
            self.ser = serial.Serial(self.port_name, baudrate=115200, timeout=0.1)
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
        """Read NXT packet with polling"""
        try:
            start_time = time.time()
            timeout = 2.0

            # Wait for header (2 bytes)
            while time.time() - start_time < timeout:
                if self.ser.in_waiting >= 2:
                    break
                time.sleep(0.005)

            if self.ser.in_waiting < 2:
                return None

            header = self.ser.read(2)
            if len(header) < 2:
                return None

            length = header[0] | (header[1] << 8)
            if length > 256 or length == 0:
                return None

            # Wait for payload
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.ser.in_waiting >= length:
                    break
                time.sleep(0.005)

            data = self.ser.read(length)
            if len(data) < length:
                return None

            return header + data

        except Exception as e:
            if DEBUG:
                print(f"⚠️ [NXT] Read error: {e}")
            return None

    def write(self, data: bytes) -> bool:
        """Write data to NXT"""
        if not self.is_alive():
            return False
        try:
            self.ser.write(data)
            self.ser.flush()
            return True
        except Exception as e:
            if DEBUG:
                print(f"⚠️ [NXT] Write error: {e}")
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
            self.ser = serial.Serial(self.port_name, baudrate=115200, timeout=0.1)
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
            # Boost advertises as "Move Hub" or "Boost"
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
            # Auto-scan if no address provided
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
    """Handle NXT WebSocket relay"""
    client_ip = websocket.remote_address[0]
    print(f"📱 [NXT] Client connected from {client_ip}")

    async def nxt_to_client():
        """Read from NXT and send to client"""
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

                if not nxt.write(raw_telegram):
                    stats["nxt"]["errors"] += 1

            except Exception as e:
                stats["nxt"]["errors"] += 1
                if DEBUG:
                    print(f"❌ [NXT] Message error: {e}")

    except websockets.exceptions.ConnectionClosed:
        print(f"📴 [NXT] Client {client_ip} disconnected")
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

    # Notification callback
    def notification_handler(sender, data: bytearray):
        """Handle BLE notifications"""
        log_message("boost", "FROM_HUB", bytes(data))
        stats["boost"]["from_hub"] += 1

        # Convert to base64 and send to WebSocket
        b64_data = base64.b64encode(bytes(data)).decode("utf-8")
        asyncio.create_task(websocket.send(b64_data))

    # Start notifications
    await boost.start_notifications(
        CONFIG["boost"]["ble_characteristic"], notification_handler
    )

    try:
        async for message in websocket:
            try:
                # Decode base64 message
                raw_data = base64.b64decode(message)

                if len(raw_data) == 0:
                    continue

                log_message("boost", "TO_HUB", raw_data)
                stats["boost"]["to_hub"] += 1

                # Write to Boost
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
        print(f"🎉 [NXT] Bridge running on port {CONFIG['nxt']['port']}")
        await asyncio.Future()  # Run forever


async def start_spike_server(spike: SPIKEConnection):
    """Start SPIKE Prime WebSocket server"""
    async with websockets.serve(
        lambda ws: spike_relay_handler(ws, spike), "0.0.0.0", CONFIG["spike"]["port"]
    ):
        print(f"🎉 [SPIKE] Bridge running on port {CONFIG['spike']['port']}")
        await asyncio.Future()  # Run forever


async def start_boost_server(boost: BoostConnection):
    """Start LEGO Boost WebSocket server"""
    async with websockets.serve(
        lambda ws: boost_relay_handler(ws, boost), "0.0.0.0", CONFIG["boost"]["port"]
    ):
        print(f"🎉 [BOOST] Bridge running on port {CONFIG['boost']['port']}")
        await asyncio.Future()  # Run forever


# ============================================================================
# MAIN
# ============================================================================


async def main():
    """Main entry point"""
    print("🚀 LEGO Unified Bridge")
    print("=" * 60)
    if DEBUG:
        print("🔍 DEBUG MODE ENABLED")

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

    # NXT
    nxt_port = auto_detect_serial_port("nxt") or CONFIG["nxt"]["com_port"]
    nxt = NXTConnection(nxt_port)
    if nxt.connect():
        servers.append(("nxt", start_nxt_server(nxt)))
    else:
        print("⚠️  [NXT] Skipping (not connected)")

    # SPIKE Prime
    spike_port = auto_detect_serial_port("spike") or CONFIG["spike"]["com_port"]
    spike = SPIKEConnection(spike_port)
    if spike.connect():
        servers.append(("spike", start_spike_server(spike)))
    else:
        print("⚠️  [SPIKE] Skipping (not connected)")

    # LEGO Boost
    if BLEAK_AVAILABLE:
        boost = BoostConnection()
        if await boost.connect():
            servers.append(("boost", start_boost_server(boost)))
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

    # Run all servers concurrently
    try:
        await asyncio.gather(*[server for _, server in servers])
    except asyncio.CancelledError:
        pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Bridge stopped")
        if DEBUG:
            print_stats()
