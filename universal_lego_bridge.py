#!/usr/bin/env python3
"""
Universal LEGO Bridge 
Supports: NXT, EV3, SPIKE Prime, WeDo 2.0, Boost, Powered Up, micro:bit
Connection: Serial, Bluetooth Classic (Native + PyBluez), BLE
Platform: Windows, macOS, Linux
"""

import asyncio
import json
import base64
import logging
import sys
import os
import time
import socket as std_socket
import queue
import threading
import argparse
import platform
import struct
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import traceback

import warnings
# ============================================================================
# 1. SILENCE THE NOISE (macOS / PyObjC Warnings)
# ============================================================================
# Filter out the ancient 'lightblue' and 'objc' warnings that flood the console
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*Objective-C subclass uses super.*")
warnings.filterwarnings("ignore", message=".*pkg_resources is deprecated.*")

# ============================================================================
# DEPENDENCY MANAGER - Lazy Loading with Graceful Degradation
# ============================================================================

class DependencyManager:
    """
    Manages optional dependencies with lazy loading.
    No crashes if libraries are missing - just log warnings.
    """
    
    def __init__(self):
        self.features = {
            "serial": False,
            "ble": False,
            "classic_legacy": False,  # PyBluez
            "classic_native": False,  # Python native sockets
            "http": False,
            "ssl": False,
            "aiohttp": False
        }
        
        # Library references (None if not available)
        self.serial_lib = None
        self.bleak_scanner = None
        self.bleak_client = None
        self.bluetooth_legacy = None
        self.requests_lib = None
        self.ssl_lib = None
        self.aiohttp_lib = None
        
        self._logger = logging.getLogger("DependencyManager")
        self._check_all()
    
    def _check_all(self):
        """Check all dependencies at startup"""
        self._logger.info("🔍 Checking dependencies...")
        
        # 1. Serial/USB (pyserial)
        try:
            import serial
            import serial.tools.list_ports
            self.serial_lib = serial
            self.features["serial"] = True
            self._logger.info("  ✅ pyserial - Serial/USB support enabled")
        except ImportError:
            self._logger.warning("  ⚠️  pyserial not found - Serial/USB disabled")
            self._logger.warning("     Install: pip install pyserial")
        
        # 2. BLE (bleak)
        try:
            from bleak import BleakScanner, BleakClient
            self.bleak_scanner = BleakScanner
            self.bleak_client = BleakClient
            self.features["ble"] = True
            self._logger.info("  ✅ bleak - BLE support enabled")
        except ImportError:
            self._logger.warning("  ⚠️  bleak not found - BLE disabled")
            self._logger.warning("     Install: pip install bleak")
        
        # 3. Native Bluetooth Classic (Python 3.9+ Windows, 3.3+ Linux)
        try:
            if hasattr(std_socket, 'AF_BLUETOOTH'):
                # Test if we can actually create the socket
                test_sock = std_socket.socket(std_socket.AF_BLUETOOTH, std_socket.SOCK_STREAM, std_socket.BTPROTO_RFCOMM)
                test_sock.close()
                self.features["classic_native"] = True
                self._logger.info("  ✅ Native Bluetooth sockets - BT Classic enabled")
            else:
                self._logger.warning("  ⚠️  AF_BLUETOOTH not available - Native BT disabled")
        except Exception as e:
            self._logger.warning(f"  ⚠️  Native Bluetooth test failed: {e}")
        
        # 4. Legacy PyBluez (fallback)
        try:
            import bluetooth
            self.bluetooth_legacy = bluetooth
            self.features["classic_legacy"] = True
            self._logger.info("  ✅ PyBluez - Legacy BT Classic enabled")
        except ImportError:
            self._logger.warning("  ⚠️  PyBluez not found - Legacy BT disabled")
            if not self.features["classic_native"]:
                self._logger.warning("     Install: pip install pybluez")
        
        # 5. HTTP (requests)
        try:
            import requests
            self.requests_lib = requests
            self.features["http"] = True
            self._logger.info("  ✅ requests - HTTP support enabled")
        except ImportError:
            self._logger.warning("  ⚠️  requests not found - HTTP disabled")
        
        # 6. SSL/TLS (cryptography)
        try:
            from cryptography import x509
            import ssl
            self.ssl_lib = ssl
            self.features["ssl"] = True
            self._logger.info("  ✅ cryptography - SSL/TLS enabled")
        except ImportError:
            self._logger.warning("  ⚠️  cryptography not found - SSL disabled")
        
        # 7. HTTP server (aiohttp)
        try:
            import aiohttp
            self.aiohttp_lib = aiohttp
            self.features["aiohttp"] = True
            self._logger.info("  ✅ aiohttp - Health endpoint enabled")
        except ImportError:
            self._logger.warning("  ⚠️  aiohttp not found - Health endpoint disabled")

        try:
            import websockets
        except ImportError:
            self._logger.warning("  ⚠️  websockets not found")
            websockets = None

        # Check for PyObjC on macOS (needed for non-hanging scan)
        if platform.system() == 'Darwin':
            try:
                import objc
                from IOBluetooth import IOBluetoothDeviceInquiry
                self._logger.info("  ✅ PyObjC - Native macOS Bluetooth enabled")
            except ImportError:
                self._logger.warning("  ⚠️  PyObjC missing - macOS Bluetooth scan might hang/fail")
                self._logger.warning("      Install: pip install pyobjc-framework-IOBluetooth")

        enabled = sum(1 for v in self.features.values() if v)
        self._logger.info(f"\n📊 {enabled}/{len(self.features)} features available")
        
        if not any(self.features.values()):
            self._logger.error("❌ NO dependencies available! Install at least one:")
            self._logger.error("   pip install pyserial bleak pybluez")
    
    def require(self, feature: str):
        """Raise error if required feature is missing"""
        if not self.features.get(feature):
            raise RuntimeError(f"Required feature '{feature}' is not available")

# Global dependency manager
DEPS = DependencyManager()

# ============================================================================
# DEVICE TYPE DEFINITIONS
# ============================================================================

class DeviceType(Enum):
    """Supported device types"""
    NXT = "nxt"
    EV3 = "ev3"
    SPIKE_PRIME = "spike"
    WEDO2 = "wedo2"
    BOOST = "boost"
    POWERED_UP = "poweredup"
    MICROBIT = "microbit"
    UNKNOWN = "unknown"

class ConnectionType(Enum):
    """Connection method types"""
    SERIAL = "serial"
    BLUETOOTH_CLASSIC = "bluetooth"
    BLE = "ble"
    HTTP = "http"

class ProtocolMode(Enum):
    """Protocol handling modes"""
    RAW = "raw"           # Pass-through binary/base64
    NORMALIZED = "normalized"  # Convert to universal JSON

@dataclass
class DeviceInfo:
    """Device identification and connection info"""
    device_type: DeviceType
    name: str
    connection_type: ConnectionType
    address: Optional[str] = None
    port: Optional[str] = None
    services: List[str] = field(default_factory=list)
    characteristics: Dict[str, str] = field(default_factory=dict)
    rssi: Optional[int] = None
    
    def get_id(self) -> str:
        """Get unique device identifier"""
        if self.connection_type == ConnectionType.SERIAL:
            return f"{self.device_type.value}_{self.port}"
        elif self.connection_type == ConnectionType.BLUETOOTH_CLASSIC:
            return f"{self.device_type.value}_{self.address}"
        elif self.connection_type == ConnectionType.BLE:
            return f"{self.device_type.value}_{self.address}"
        else:
            return f"{self.device_type.value}_{self.name}"
    
    def __str__(self):
        if self.connection_type == ConnectionType.SERIAL:
            return f"{self.device_type.value.upper()}: {self.name} @ {self.port}"
        elif self.connection_type == ConnectionType.BLUETOOTH_CLASSIC:
            return f"{self.device_type.value.upper()}: {self.name} @ {self.address}"
        elif self.connection_type == ConnectionType.BLE:
            rssi_str = f"(RSSI: {self.rssi})" if self.rssi else ""
            return f"{self.device_type.value.upper()}: {self.name} @ {self.address} {rssi_str}"
        else:
            return f"{self.device_type.value.upper()}: {self.name}"

# ============================================================================
# PROTOCOL NORMALIZATION - Universal JSON Layer
# ============================================================================

class ProtocolTransformer:
    """
    Transforms device-specific binary protocols into universal JSON format.
    This allows web clients to use the same API regardless of device type.
    """
    
    @staticmethod
    def to_normalized(device_type: DeviceType, raw_data: bytes) -> Dict[str, Any]:
        """
        Convert raw device data to normalized JSON structure.
        
        Returns dict with:
        - event: event type (sensor_update, motor_feedback, etc.)
        - device: device type
        - data: normalized data
        - raw: base64 encoded original data
        """
        
        result = {
            "device": device_type.value,
            "timestamp": datetime.now().isoformat(),
            "raw": base64.b64encode(raw_data).decode('ascii')
        }
        
        try:
            if device_type == DeviceType.NXT:
                result.update(ProtocolTransformer._parse_nxt(raw_data))
            elif device_type == DeviceType.BOOST:
                result.update(ProtocolTransformer._parse_boost(raw_data))
            elif device_type == DeviceType.WEDO2:
                result.update(ProtocolTransformer._parse_wedo2(raw_data))
            elif device_type == DeviceType.SPIKE_PRIME:
                result.update(ProtocolTransformer._parse_spike(raw_data))
            elif device_type == DeviceType.MICROBIT:
                result.update(ProtocolTransformer._parse_microbit(raw_data))
            else:
                result["event"] = "raw_data"
        except Exception as e:
            logging.error(f"Protocol parsing error: {e}")
            result["event"] = "raw_data"
            result["parse_error"] = str(e)
        
        return result
    
    @staticmethod
    def _parse_nxt(data: bytes) -> Dict[str, Any]:
        """Parse NXT protocol"""
        if len(data) < 4:
            return {"event": "raw_data"}
        
        length = data[0] | (data[1] << 8)
        cmd_type = data[2]
        opcode = data[3]
        
        # Reply packet
        if cmd_type == 0x02:
            if opcode == 0x0B and len(data) >= 7:  # Battery level
                voltage = data[5] | (data[6] << 8)
                return {
                    "event": "battery_update",
                    "voltage_mv": voltage,
                    "percent": min(100, int((voltage - 6000) / 30))
                }
            elif opcode == 0x07 and len(data) >= 16:  # Sensor values
                port = data[4]
                value = struct.unpack('<H', data[8:10])[0]
                return {
                    "event": "sensor_update",
                    "port": port,
                    "value": value
                }
        
        return {"event": "command_response", "opcode": opcode}
    
    @staticmethod
    def _parse_boost(data: bytes) -> Dict[str, Any]:
        """Parse LEGO Boost/Powered Up protocol"""
        if len(data) < 3:
            return {"event": "raw_data"}
        
        length = data[0]
        msg_type = data[2]
        
        # Port value updates
        if msg_type == 0x45 and len(data) >= 5:
            port = data[3]
            value = data[4]
            
            return {
                "event": "sensor_update",
                "port": port,
                "value": value,
                "type": "distance" if value < 10 else "color"
            }
        
        # Hub attached IO
        elif msg_type == 0x04 and len(data) >= 5:
            port = data[3]
            event = data[4]
            
            return {
                "event": "port_change",
                "port": port,
                "attached": event == 1
            }
        
        # Hub properties
        elif msg_type == 0x01:
            return {
                "event": "hub_property",
                "property": data[3] if len(data) > 3 else None
            }
        
        return {"event": "raw_data"}
    
    @staticmethod
    def _parse_wedo2(data: bytes) -> Dict[str, Any]:
        """Parse LEGO WeDo 2.0 protocol"""
        # WeDo 2.0 uses similar protocol to Boost
        return ProtocolTransformer._parse_boost(data)
    
    @staticmethod
    def _parse_spike(data: bytes) -> Dict[str, Any]:
        """Parse SPIKE Prime protocol (JSON-based)"""
        try:
            text = data.decode('utf-8', errors='ignore').strip()
            
            # Try to parse as JSON
            if text.startswith('{'):
                json_data = json.loads(text)
                
                # MicroPython JSON protocol
                if 'm' in json_data:
                    msg_type = json_data['m']
                    
                    if msg_type == 0:  # Hub status
                        return {
                            "event": "hub_status",
                            "data": json_data.get('p', {})
                        }
                    elif msg_type == 2:  # Battery
                        battery = json_data.get('p', [0, 0])[1]
                        return {
                            "event": "battery_update",
                            "percent": battery
                        }
                    elif msg_type == 3:  # Button
                        return {
                            "event": "button_event",
                            "button": json_data.get('p', [])[0] if json_data.get('p') else None
                        }
                    elif msg_type == 4:  # Gesture
                        return {
                            "event": "gesture",
                            "type": json_data.get('p')
                        }
                
                return {"event": "json_data", "data": json_data}
            
            # Raw text output
            return {"event": "text_output", "text": text}
            
        except Exception as e:
            return {"event": "raw_data"}
    
    @staticmethod
    def _parse_microbit(data: bytes) -> Dict[str, Any]:
        """Parse micro:bit UART protocol"""
        try:
            text = data.decode('utf-8', errors='ignore').strip()
            return {"event": "uart_data", "text": text}
        except:
            return {"event": "raw_data"}
    
    @staticmethod
    def from_normalized(device_type: DeviceType, command: Dict[str, Any]) -> bytes:
        """
        Convert normalized JSON command to device-specific binary.
        
        Example:
        {
            "command": "motor_power",
            "port": 0,
            "power": 75
        }
        """
        
        if device_type == DeviceType.NXT:
            return ProtocolTransformer._encode_nxt(command)
        elif device_type == DeviceType.BOOST:
            return ProtocolTransformer._encode_boost(command)
        elif device_type == DeviceType.SPIKE_PRIME:
            return ProtocolTransformer._encode_spike(command)
        else:
            # Fallback: expect raw base64
            if "raw" in command:
                return base64.b64decode(command["raw"])
            raise ValueError(f"Cannot encode command for {device_type}")
    
    @staticmethod
    def _encode_nxt(command: Dict[str, Any]) -> bytes:
        """Encode NXT command"""
        cmd_type = command.get("command")
        
        if cmd_type == "motor_power":
            port = command.get("port", 0)
            power = command.get("power", 0)
            # NXT SET_OUTPUT_STATE command
            payload = bytes([0x80, 0x04, port, power, 0x01, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00])
            length = len(payload)
            return bytes([length & 0xFF, (length >> 8) & 0xFF]) + payload
        
        elif cmd_type == "play_tone":
            freq = command.get("frequency", 440)
            duration = command.get("duration", 500)
            payload = struct.pack('<BBHH', 0x80, 0x03, freq, duration)
            length = len(payload)
            return bytes([length & 0xFF, (length >> 8) & 0xFF]) + payload
        
        # Fallback to raw
        elif "raw" in command:
            return base64.b64decode(command["raw"])
        
        raise ValueError(f"Unknown NXT command: {cmd_type}")
    
    @staticmethod
    def _encode_boost(command: Dict[str, Any]) -> bytes:
        """Encode Boost/Powered Up command"""
        cmd_type = command.get("command")
        
        if cmd_type == "motor_power":
            port = command.get("port", 0)
            power = command.get("power", 0)
            # Boost motor command
            return bytes([0x08, 0x00, 0x81, port, 0x11, 0x51, 0x00, power])
        
        elif "raw" in command:
            return base64.b64decode(command["raw"])
        
        raise ValueError(f"Unknown Boost command: {cmd_type}")
    
    @staticmethod
    def _encode_spike(command: Dict[str, Any]) -> bytes:
        """Encode SPIKE Prime command"""
        # SPIKE uses Python/JSON - convert to Python code
        cmd_type = command.get("command")
        
        if cmd_type == "motor_power":
            port = command.get("port", "A")
            power = command.get("power", 0)
            code = f"hub.port.{port}.motor.pwm({power})\r\n"
            return code.encode('utf-8')
        
        elif cmd_type == "python":
            code = command.get("code", "")
            return (code + "\r\n").encode('utf-8')
        
        elif "raw" in command:
            return base64.b64decode(command["raw"])
        
        raise ValueError(f"Unknown SPIKE command: {cmd_type}")

# ============================================================================
# STATISTICS TRACKING
# ============================================================================

@dataclass
class ConnectionStats:
    """Track connection statistics"""
    device_type: DeviceType
    connected_at: datetime = field(default_factory=datetime.now)
    packets_sent: int = 0
    packets_received: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0
    errors: int = 0
    reconnects: int = 0
    last_activity: datetime = field(default_factory=datetime.now)
    
    def update_sent(self, data: bytes):
        self.packets_sent += 1
        self.bytes_sent += len(data)
        self.last_activity = datetime.now()
    
    def update_received(self, data: bytes):
        self.packets_received += 1
        self.bytes_received += len(data)
        self.last_activity = datetime.now()
    
    def update_error(self):
        self.errors += 1
    
    def update_reconnect(self):
        self.reconnects += 1
        self.connected_at = datetime.now()
    
    def __str__(self):
        uptime = (datetime.now() - self.connected_at).total_seconds()
        return (f"{self.device_type.value.upper()}: "
                f"↑{self.packets_sent} ↓{self.packets_received} "
                f"({self.bytes_sent}B / {self.bytes_received}B) "
                f"❌{self.errors} 🔄{self.reconnects} ⏱{uptime:.1f}s")

# ============================================================================
# BASE CONNECTION CLASS
# ============================================================================

class BaseConnection:
    """Base class for all device connections"""
    
    def __init__(self, device_info: DeviceInfo, logger: logging.Logger, protocol_mode: ProtocolMode = ProtocolMode.RAW):
        self.device_info = device_info
        self.logger = logger
        self.protocol_mode = protocol_mode
        self.connected = False
        self.running = False
        self.stats = ConnectionStats(device_info.device_type)
        self.read_queue = asyncio.Queue()
        self.write_queue = asyncio.Queue()
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.reconnect_delay = 2.0
        
    async def connect(self) -> bool:
        """Connect to device"""
        raise NotImplementedError
    
    async def disconnect(self):
        """Disconnect from device"""
        self.running = False
        self.connected = False
        self.logger.info(f"🔌 Disconnected: {self.device_info}")
    
    async def send(self, data: bytes) -> bool:
        """Send data to device"""
        raise NotImplementedError
    
    async def receive(self) -> Optional[bytes]:
        """Receive data from device"""
        try:
            return await asyncio.wait_for(self.read_queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None
    
    async def reconnect_loop(self):
        """Auto-reconnect loop"""
        while self.reconnect_attempts < self.max_reconnect_attempts:
            self.logger.info(f"🔄 Reconnection attempt {self.reconnect_attempts + 1}/{self.max_reconnect_attempts}")
            await asyncio.sleep(self.reconnect_delay)
            
            try:
                if await self.connect():
                    self.stats.update_reconnect()
                    self.reconnect_attempts = 0
                    return True
            except Exception as e:
                self.logger.error(f"Reconnect error: {e}")
            
            self.reconnect_attempts += 1
        
        self.logger.error(f"❌ Reconnection failed after {self.max_reconnect_attempts} attempts")
        return False
    
    def log_packet(self, direction: str, data: bytes, description: str = ""):
        """Log packet with hex dump"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        hex_str = data.hex().upper()
        
        if direction == "SEND":
            arrow = "➡️"
            color = '\033[94m'  # Blue
            self.stats.update_sent(data)
        else:
            arrow = "⬅️"
            color = '\033[92m'  # Green
            self.stats.update_received(data)
        
        # Truncate long packets
        if len(hex_str) > 100:
            hex_str = hex_str[:100] + "..."
        
        log_msg = f"[{timestamp}] {arrow} {self.device_info.device_type.value.upper()}: {hex_str}"
        if description:
            log_msg += f" | {description}"
        
        self.logger.debug(f"{color}{log_msg}\033[0m")

# ============================================================================
# SERIAL CONNECTION
# ============================================================================

class SerialConnection(BaseConnection):
    """Serial/USB connection handler"""
    
    def __init__(self, device_info: DeviceInfo, logger: logging.Logger, protocol_mode: ProtocolMode = ProtocolMode.RAW, baudrate: int = 115200):
        super().__init__(device_info, logger, protocol_mode)
        self.baudrate = baudrate
        self.serial = None
        self.read_thread = None
        
        DEPS.require("serial")
    
    async def connect(self) -> bool:
        """Connect to serial port"""
        try:
            self.serial = DEPS.serial_lib.Serial(
                self.device_info.port,
                baudrate=self.baudrate,
                timeout=0.1
            )
            
            # Device-specific initialization
            if self.device_info.device_type == DeviceType.SPIKE_PRIME:
                self.serial.write(b'\x03')  # Ctrl-C to interrupt
                await asyncio.sleep(0.2)
            
            self.connected = True
            self.running = True
            
            # Start read thread
            self.read_thread = threading.Thread(target=self._read_loop, daemon=True)
            self.read_thread.start()
            
            self.logger.info(f"✅ Connected: {self.device_info}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Serial connection failed: {e}")
            self.stats.update_error()
            return False
    
    async def disconnect(self):
        """Disconnect serial port"""
        self.running = False
        if self.serial:
            try:
                self.serial.close()
            except:
                pass
        await super().disconnect()
    
    async def send(self, data: bytes) -> bool:
        """Send data via serial"""
        if not self.connected or not self.serial:
            return False
        
        try:
            self.serial.write(data)
            self.serial.flush()
            self.log_packet("SEND", data)
            return True
        except Exception as e:
            self.logger.error(f"❌ Serial send error: {e}")
            self.stats.update_error()
            return False
    
    def _read_loop(self):
        """Background thread to read serial data"""
        self.logger.debug(f"📖 Read thread started for {self.device_info.name}")
        
        buffer = b''
        
        while self.running:
            try:
                if self.serial.in_waiting > 0:
                    chunk = self.serial.read(self.serial.in_waiting)
                    
                    if self.device_info.device_type == DeviceType.NXT:
                        # NXT: length-prefixed packets
                        buffer += chunk
                        packet = self._extract_nxt_packet(buffer)
                        if packet:
                            buffer = buffer[len(packet):]
                            asyncio.run_coroutine_threadsafe(
                                self.read_queue.put(packet),
                                asyncio.get_event_loop()
                            )
                    elif self.device_info.device_type == DeviceType.SPIKE_PRIME:
                        # SPIKE: line-based
                        buffer += chunk
                        lines = buffer.split(b'\n')
                        buffer = lines[-1]
                        for line in lines[:-1]:
                            if line:
                                asyncio.run_coroutine_threadsafe(
                                    self.read_queue.put(line + b'\n'),
                                    asyncio.get_event_loop()
                                )
                    else:
                        asyncio.run_coroutine_threadsafe(
                            self.read_queue.put(chunk),
                            asyncio.get_event_loop()
                        )
                else:
                    time.sleep(0.01)
                    
            except Exception as e:
                if self.running:
                    self.logger.error(f"❌ Serial read error: {e}")
                    self.stats.update_error()
                break
    
    def _extract_nxt_packet(self, buffer: bytes) -> Optional[bytes]:
        """Extract NXT packet from buffer"""
        if len(buffer) < 2:
            return None
        
        length = buffer[0] | (buffer[1] << 8)
        if length > 256 or length == 0:
            return None
        
        if len(buffer) < length + 2:
            return None
        
        return buffer[:length + 2]

# ============================================================================
# UNIVERSAL BLUETOOTH CLASSIC CONNECTION (Native + PyBluez)
# ============================================================================

class UniversalBluetoothClassicConnection(BaseConnection):
    """
    Bluetooth Classic with dual strategy:
    1. Native Python sockets (preferred for Windows 10+, Linux)
    2. PyBluez fallback (macOS, older systems)
    """
    
    def __init__(self, device_info: DeviceInfo, logger: logging.Logger, protocol_mode: ProtocolMode = ProtocolMode.RAW, channel: int = 1):
        super().__init__(device_info, logger, protocol_mode)
        self.channel = channel
        self.socket = None
        self.read_thread = None
        self.keepalive_thread = None
        self.connection_strategy = None  # "native" or "legacy"
        
        if not (DEPS.features["classic_native"] or DEPS.features["classic_legacy"]):
            raise RuntimeError("No Bluetooth Classic support available")
    
    async def connect(self) -> bool:
        """Connect via Bluetooth Classic with automatic fallback"""
        
        # STRATEGY 1: Native Python Sockets (Preferred for Windows/Linux)
        if DEPS.features["classic_native"] and platform.system() != 'Darwin':
            try:
                self.logger.info("🔌 Attempting native socket connection...")
                self.socket = std_socket.socket(
                    std_socket.AF_BLUETOOTH, 
                    std_socket.SOCK_STREAM, 
                    std_socket.BTPROTO_RFCOMM
                )
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(
                    None,
                    lambda: self.socket.connect((self.device_info.address, self.channel))
                )
                self.socket.setblocking(False)
                self.connection_strategy = "native"
                self.connected = True
                self.running = True
                self._start_threads()
                self.logger.info(f"✅ Connected (native): {self.device_info}")
                return True
            except Exception as e:
                self.logger.warning(f"⚠️  Native socket failed: {e}")
                if self.socket: self.socket.close()

        # STRATEGY 2: Legacy PyBluez (Required for macOS)
        if DEPS.features["classic_legacy"]:
            try:
                self.logger.info("🔌 Attempting PyBluez connection...")
                self.socket = DEPS.bluetooth_legacy.BluetoothSocket(
                    DEPS.bluetooth_legacy.RFCOMM
                )
                
                # CRITICAL FIX FOR MACOS
                if platform.system() == 'Darwin':
                    # macOS: Connect Synchronously on Main Thread
                    self.logger.debug("  ⚠️  macOS: Connecting synchronously")
                    self.socket.connect((self.device_info.address, self.channel))
                else:
                    # Windows/Linux: Connect via Executor
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(
                        None,
                        lambda: self.socket.connect((self.device_info.address, self.channel))
                    )
                
                self.socket.setblocking(False)
                self.connection_strategy = "legacy"
                self.connected = True
                self.running = True
                self._start_threads()
                self.logger.info(f"✅ Connected (PyBluez): {self.device_info}")
                return True
                
            except Exception as e:
                self.logger.error(f"❌ PyBluez connection failed: {e}")
                self.stats.update_error()
                return False
        
        return False
    
    def _start_threads(self):
        """Start read and keepalive threads"""
        # Start read thread
        self.read_thread = threading.Thread(target=self._read_loop, daemon=True)
        self.read_thread.start()
        
        # Start keepalive for NXT
        if self.device_info.device_type == DeviceType.NXT:
            self.keepalive_thread = threading.Thread(target=self._keepalive_loop, daemon=True)
            self.keepalive_thread.start()
            self.logger.info("  ⏰ Keepalive enabled for NXT")
    
    async def disconnect(self):
        """Disconnect Bluetooth"""
        self.running = False
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
        await super().disconnect()
    
    async def send(self, data: bytes) -> bool:
        """Send data via Bluetooth"""
        if not self.connected or not self.socket:
            return False
        
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self.socket.send(data))
            self.log_packet("SEND", data)
            return True
        except Exception as e:
            self.logger.error(f"❌ Bluetooth send error: {e}")
            self.stats.update_error()
            return False
    
    def _read_loop(self):
        """Background thread to read Bluetooth data"""
        self.logger.debug(f"📖 Read thread started ({self.connection_strategy})")
        
        while self.running:
            try:
                # Read length header (2 bytes, little-endian)
                header = b''
                while len(header) < 2 and self.running:
                    try:
                        chunk = self.socket.recv(2 - len(header))
                        if chunk:
                            header += chunk
                    except (BlockingIOError, std_socket.error):
                        time.sleep(0.01)
                
                if len(header) < 2:
                    continue
                
                length = header[0] | (header[1] << 8)
                
                if length > 256 or length == 0:
                    self.logger.warning(f"⚠️  Invalid packet length: {length}")
                    continue
                
                # Read data
                data = b''
                while len(data) < length and self.running:
                    try:
                        chunk = self.socket.recv(length - len(data))
                        if chunk:
                            data += chunk
                    except (BlockingIOError, std_socket.error):
                        time.sleep(0.01)
                
                if len(data) < length:
                    self.logger.warning(f"⚠️  Incomplete packet: got {len(data)}, expected {length}")
                    continue
                
                packet = header + data
                asyncio.run_coroutine_threadsafe(
                    self.read_queue.put(packet),
                    asyncio.get_event_loop()
                )
                
            except Exception as e:
                if self.running:
                    self.logger.error(f"❌ Bluetooth read error: {e}")
                    self.stats.update_error()
                break
    
    def _keepalive_loop(self):
        """Send periodic keepalive packets (NXT)"""
        self.logger.debug("⏰ Keepalive thread started")
        
        while self.running:
            time.sleep(25)  # Every 25 seconds
            
            if self.socket and self.running:
                try:
                    # NXT battery level request
                    keepalive = bytes([0x02, 0x00, 0x00, 0x0B])
                    self.socket.send(keepalive)
                    self.logger.debug("⏰ Keepalive sent")
                except Exception as e:
                    self.logger.warning(f"⚠️  Keepalive failed: {e}")

# ============================================================================
# BLE CONNECTION
# ============================================================================

class BLEConnection(BaseConnection):
    """Bluetooth Low Energy connection handler"""
    
    # BLE Service/Characteristic mappings
    DEVICE_CHARACTERISTICS = {
        DeviceType.BOOST: '00001624-1212-efde-1623-785feabcd123',
        DeviceType.WEDO2: '00001526-1212-efde-1523-785feabcd123',
        DeviceType.MICROBIT: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    }
    
    def __init__(self, device_info: DeviceInfo, logger: logging.Logger, protocol_mode: ProtocolMode = ProtocolMode.RAW):
        super().__init__(device_info, logger, protocol_mode)
        self.client = None
        
        DEPS.require("ble")
        
        # Determine characteristic
        self.char_uuid = self.DEVICE_CHARACTERISTICS.get(
            device_info.device_type,
            list(device_info.characteristics.values())[0] if device_info.characteristics else None
        )
        
        if not self.char_uuid:
            raise ValueError(f"No BLE characteristic found for {device_info.device_type}")
    
    async def connect(self) -> bool:
        """Connect via BLE"""
        try:
            self.client = DEPS.bleak_client(self.device_info.address)
            await self.client.connect()
            
            self.connected = True
            self.running = True
            
            # Start notifications
            await self.client.start_notify(self.char_uuid, self._notification_callback)
            
            self.logger.info(f"✅ Connected: {self.device_info}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ BLE connection failed: {e}")
            self.stats.update_error()
            return False
    
    async def disconnect(self):
        """Disconnect BLE"""
        if self.client:
            try:
                if self.connected:
                    await self.client.stop_notify(self.char_uuid)
                await self.client.disconnect()
            except:
                pass
        await super().disconnect()
    
    async def send(self, data: bytes) -> bool:
        """Send data via BLE"""
        if not self.connected or not self.client:
            return False
        
        try:
            await self.client.write_gatt_char(self.char_uuid, data)
            self.log_packet("SEND", data)
            return True
        except Exception as e:
            self.logger.error(f"❌ BLE send error: {e}")
            self.stats.update_error()
            return False
    
    def _notification_callback(self, sender, data: bytearray):
        """Handle BLE notifications"""
        packet = bytes(data)
        asyncio.run_coroutine_threadsafe(
            self.read_queue.put(packet),
            asyncio.get_event_loop()
        )

# ============================================================================
# DEVICE IDENTIFICATION
# ============================================================================

class DeviceIdentifier:
    """Identify LEGO/micro:bit devices"""
    
    BLE_SERVICES = {
        '00001623-1212-efde-1623-785feabcd123': DeviceType.BOOST,
        '00004a0f-0000-1000-8000-00805f9b34fb': DeviceType.WEDO2,
        '0000e601-0000-1000-8000-00805f9b34fb': DeviceType.MICROBIT,
    }
    
    NAME_PATTERNS = {
        'nxt': DeviceType.NXT,
        'ev3': DeviceType.EV3,
        'spike': DeviceType.SPIKE_PRIME,
        'lego hub': DeviceType.SPIKE_PRIME,
        'boost': DeviceType.BOOST,
        'move hub': DeviceType.BOOST,
        'wedo': DeviceType.WEDO2,
        'powered up': DeviceType.POWERED_UP,
        'technic': DeviceType.POWERED_UP,
        'micro:bit': DeviceType.MICROBIT,
    }
    
    @staticmethod
    def identify_from_name(name: str) -> DeviceType:
        """Identify from name"""
        name_lower = name.lower()
        for pattern, device_type in DeviceIdentifier.NAME_PATTERNS.items():
            if pattern in name_lower:
                return device_type
        return DeviceType.UNKNOWN
    
    @staticmethod
    def identify_from_ble_services(services: List[str]) -> DeviceType:
        """Identify from BLE services"""
        for service in services:
            if service.lower() in DeviceIdentifier.BLE_SERVICES:
                return DeviceIdentifier.BLE_SERVICES[service.lower()]
        return DeviceType.UNKNOWN

# ============================================================================
# DEVICE DISCOVERY (with Hot-Swap Support)
# ============================================================================

# MACOS NATIVE SCANNER (Fixes Hang/Crash)

class MacOSBluetoothScanner:
    """
    Directly uses IOBluetooth to scan without hanging on macOS.
    Fixes the 'deviceInquiryDeviceFound' argument mismatch error.
    """
    def scan(self, timeout=5.0):
        devices = []
        try:
            import objc
            from IOBluetooth import IOBluetoothDeviceInquiry
            from Foundation import NSRunLoop, NSDate, NSObject
        except ImportError:
            return []

        # Delegate to receive device found events
        class InquiryDelegate(NSObject):
            def init(self):
                self = objc.super(InquiryDelegate, self).init()
                self.finished = False
                self.found_devices = []
                return self
            
            # Selector: deviceInquiryComplete:error:aborted:
            def deviceInquiryComplete_error_aborted_(self, sender, error, aborted):
                self.finished = True
                
            # Selector: deviceInquiryDeviceFound:device:
            # CRITICAL FIX: Added _device_ suffix to match the 2-argument selector
            def deviceInquiryDeviceFound_device_(self, sender, device):
                self.found_devices.append(device)

        # Create inquiry
        delegate = InquiryDelegate.alloc().init()
        inquiry = IOBluetoothDeviceInquiry.inquiryWithDelegate_(delegate)
        inquiry.setInquiryLength_(int(timeout))
        inquiry.setUpdateNewDeviceNames_(True)
        
        # Start on Main Thread
        status = inquiry.start()
        if status != 0: 
            return []

        # Manually pump the RunLoop so events process
        start_time = time.time()
        run_loop = NSRunLoop.currentRunLoop()
        
        while not delegate.finished:
            run_loop.runUntilDate_(NSDate.dateWithTimeIntervalSinceNow_(0.1))
            if time.time() - start_time > timeout + 2:
                inquiry.stop()
                break

        # Extract results safely
        for device in delegate.found_devices:
            try:
                name = device.name() or "Unknown"
                addr = device.addressString() or "00:00:00:00:00:00"
                devices.append((addr, name))
            except:
                continue
            
        return devices
    
class DeviceDiscovery:
    def __init__(self, logger):
        self.logger = logger
    
    async def discover_all(self):
        devices = []
        self.logger.info("🔍 Starting device discovery...")
        
        # 1. SERIAL SCAN
        if DEPS.features["serial"]:
            devices.extend(await self._discover_serial())
            
        # 2. BLE SCAN
        if DEPS.features["ble"]:
            devices.extend(await self._discover_ble())
            
        # 3. CLASSIC BLUETOOTH SCAN
        if DEPS.features["classic_legacy"]:
            devices.extend(await self._discover_bluetooth_classic())
                
        self.logger.info(f"✅ Discovery complete: found {len(devices)} device(s)")
        return devices

    async def _discover_serial(self):
        devices = []
        try:
            loop = asyncio.get_event_loop()
            ports = await loop.run_in_executor(None, DEPS.serial_lib.tools.list_ports.comports)
            
            for port in ports:
                name_lower = (port.description or "").lower()
                dev_type = DeviceType.UNKNOWN # Default to Enum
                
                if "nxt" in name_lower: dev_type = DeviceType.NXT
                elif "ev3" in name_lower: dev_type = DeviceType.EV3
                elif "spike" in name_lower or "lego hub" in name_lower: dev_type = DeviceType.SPIKE_PRIME
                elif "usb serial" in name_lower and port.manufacturer and "lego" in port.manufacturer.lower():
                    dev_type = DeviceType.EV3

                if dev_type != DeviceType.UNKNOWN:
                    # FIX: Must return DeviceInfo object, not a dictionary!
                    devices.append(DeviceInfo(
                        device_type=dev_type,
                        name=port.description,
                        connection_type=ConnectionType.SERIAL,
                        port=port.device
                    ))
                    self.logger.info(f"  📍 Serial: {port.device} ({port.description})")
        except Exception as e:
            self.logger.error(f"Serial error: {e}")
        return devices

    async def _discover_ble(self):
        devices = []
        if not DEPS.features["ble"]: return devices
        
        try:
            self.logger.info("  🔵 Scanning BLE (5s)...")
            
            # macOS Permission Check
            if platform.system() == 'Darwin':
                try:
                    await asyncio.wait_for(DEPS.bleak_scanner.discover(timeout=0.5), timeout=1.0)
                except asyncio.TimeoutError: pass
                except Exception as e:
                    if "permission" in str(e).lower() or "unauthorized" in str(e).lower():
                        self.logger.error("❌ BLE Permission Denied! Enable Bluetooth in System Settings.")
                        return devices

            found = await DEPS.bleak_scanner.discover(timeout=5.0)
            
            for d in found:
                name = d.name or "Unknown"
                dev_type = DeviceIdentifier.identify_from_name(name)
                
                if dev_type == DeviceType.UNKNOWN and hasattr(d, 'metadata'):
                    services = d.metadata.get('uuids', [])
                    dev_type = DeviceIdentifier.identify_from_ble_services(services)
                
                if dev_type != DeviceType.UNKNOWN:
                    devices.append(DeviceInfo(
                        device_type=dev_type,
                        name=name,
                        connection_type=ConnectionType.BLE,
                        address=d.address,
                        rssi=getattr(d, 'rssi', None)
                    ))
                    self.logger.info(f"  📍 BLE: {name} @ {d.address}")
                        
        except Exception as e:
            self.logger.error(f"BLE error: {e}")
        return devices

    async def _discover_bluetooth_classic(self):
        """Discover Bluetooth Classic devices (Mac Safe)"""
        devices = []
        
        # 1. macOS NATIVE SCAN
        if platform.system() == 'Darwin':
            try:
                self.logger.info("  🔵 Scanning Bluetooth Classic (Native macOS)...")
                
                # Use our custom class that pumps the RunLoop
                scanner = MacOSBluetoothScanner()
                nearby = scanner.scan(timeout=6.0)
                
                for addr, name in nearby:
                    # Normalize address (00-11-22 -> 00:11:22)
                    addr = addr.replace("-", ":")
                    dev_type = DeviceIdentifier.identify_from_name(name)
                    
                    if dev_type != DeviceType.UNKNOWN:
                        devices.append(DeviceInfo(
                            device_type=dev_type,
                            name=name,
                            connection_type=ConnectionType.BLUETOOTH_CLASSIC,
                            address=addr
                        ))
                        self.logger.info(f"  📍 Classic: {name} @ {addr}")
            except Exception as e:
                self.logger.error(f"macOS Native Scan Error: {e}")
            return devices

        # 2. Windows/Linux (Standard PyBluez)
        if not DEPS.features["classic_legacy"]:
            return devices
            
        try:
            self.logger.info("  🔵 Scanning Bluetooth Classic (PyBluez)...")
            loop = asyncio.get_event_loop()
            nearby = await loop.run_in_executor(
                None, 
                lambda: DEPS.bluetooth_legacy.discover_devices(lookup_names=True, duration=6)
            )
            
            for addr, name in nearby:
                dev_type = DeviceIdentifier.identify_from_name(name)
                if dev_type != DeviceType.UNKNOWN:
                    devices.append(DeviceInfo(
                        device_type=dev_type,
                        name=name,
                        connection_type=ConnectionType.BLUETOOTH_CLASSIC,
                        address=addr
                    ))
                    self.logger.info(f"  📍 Classic: {name} @ {addr}")
                    
        except Exception as e:
            self.logger.error(f"Classic BT error: {e}")
        
        return devices

# ============================================================================
# CONNECTION FACTORY
# ============================================================================

class ConnectionFactory:
    """Create appropriate connection for device"""
    
    @staticmethod
    def create(device_info: DeviceInfo, logger: logging.Logger, protocol_mode: ProtocolMode) -> BaseConnection:
        """Create connection based on device info"""
        if device_info.connection_type == ConnectionType.SERIAL:
            return SerialConnection(device_info, logger, protocol_mode)
        elif device_info.connection_type == ConnectionType.BLUETOOTH_CLASSIC:
            return UniversalBluetoothClassicConnection(device_info, logger, protocol_mode)
        elif device_info.connection_type == ConnectionType.BLE:
            return BLEConnection(device_info, logger, protocol_mode)
        else:
            raise ValueError(f"Unsupported connection type: {device_info.connection_type}")

# ============================================================================
# WEBSOCKET RELAY
# ============================================================================

class WebSocketRelay:
    """WebSocket relay with protocol normalization support"""
    
    def __init__(self, connection: BaseConnection, logger: logging.Logger):
        self.connection = connection
        self.logger = logger
        self.clients: Set = set()
    
    async def handle_client(self, websocket):
        """Handle WebSocket client"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        self.logger.info(f"📱 Client connected: {client_id} ({self.connection.device_info.device_type.value})")
        
        self.clients.add(websocket)
        
        receive_task = asyncio.create_task(self._device_to_client(websocket))
        send_task = asyncio.create_task(self._client_to_device(websocket))
        
        try:
            await asyncio.gather(receive_task, send_task)
        except Exception as e:
            self.logger.error(f"❌ Relay error: {e}")
        finally:
            self.clients.discard(websocket)
            receive_task.cancel()
            send_task.cancel()
    
    async def _device_to_client(self, websocket):
        """Forward data from device to client"""
        while True:
            try:
                data = await self.connection.receive()
                if data:
                    # Transform based on protocol mode
                    if self.connection.protocol_mode == ProtocolMode.NORMALIZED:
                        normalized = ProtocolTransformer.to_normalized(
                            self.connection.device_info.device_type,
                            data
                        )
                        message = json.dumps(normalized)
                    else:
                        # RAW mode
                        if self.connection.device_info.device_type in [DeviceType.NXT, DeviceType.BOOST, DeviceType.WEDO2]:
                            message = base64.b64encode(data).decode('utf-8')
                        else:
                            message = data.decode('utf-8', errors='ignore')
                    
                    await websocket.send(message)
                    self.connection.log_packet("RECV", data)
                else:
                    await asyncio.sleep(0.01)
            except Exception as e:
                self.logger.error(f"❌ Device to client error: {e}")
                break
    
    async def _client_to_device(self, websocket):
        """Forward data from client to device"""
        try:
            async for message in websocket:
                # Parse based on protocol mode
                if self.connection.protocol_mode == ProtocolMode.NORMALIZED:
                    # Expect JSON command
                    try:
                        command = json.loads(message)
                        data = ProtocolTransformer.from_normalized(
                            self.connection.device_info.device_type,
                            command
                        )
                    except Exception as e:
                        self.logger.error(f"❌ Command parsing error: {e}")
                        continue
                else:
                    # RAW mode
                    if self.connection.device_info.device_type in [DeviceType.NXT, DeviceType.BOOST, DeviceType.WEDO2]:
                        if isinstance(message, str):
                            data = base64.b64decode(message)
                        else:
                            data = message
                    else:
                        if isinstance(message, str):
                            data = message.encode('utf-8')
                        else:
                            data = message
                
                await self.connection.send(data)
        except Exception as e:
            self.logger.error(f"❌ Client to device error: {e}")

# ============================================================================
# UNIVERSAL BRIDGE SERVER (with Hot-Swap)
# ============================================================================

class UniversalBridgeServer:
    """Main server with hot-swap device discovery"""
    
    def __init__(self, logger: logging.Logger, protocol_mode: ProtocolMode = ProtocolMode.RAW, 
                 auto_reconnect: bool = True, hot_swap: bool = True):
        self.logger = logger
        self.protocol_mode = protocol_mode
        self.auto_reconnect = auto_reconnect
        self.hot_swap = hot_swap
        self.connections: Dict[str, BaseConnection] = {}
        self.relays: Dict[str, WebSocketRelay] = {}
        self.port_mapping: Dict[int, str] = {}
        self.base_port = 8080
        self.running = False
        self.discovery = DeviceDiscovery(logger)
        self.servers = []
    
    async def add_device(self, device_info: DeviceInfo) -> bool:
        """Add a device connection"""
        device_id = device_info.get_id()
        
        # Check if already connected
        if device_id in self.connections:
            self.logger.debug(f"Device already connected: {device_id}")
            return True
        
        try:
            connection = ConnectionFactory.create(device_info, self.logger, self.protocol_mode)
            
            if await connection.connect():
                self.connections[device_id] = connection
                self.relays[device_id] = WebSocketRelay(connection, self.logger)
                
                # Assign port
                port = self.base_port + len(self.connections) - 1
                self.port_mapping[port] = device_id
                
                # Start WebSocket server for this device
                if self.running:
                    await self._start_server_for_device(port, device_id)
                
                self.logger.info(f"✅ Device added: {device_id} on port {port}")
                
                # Start monitoring
                if self.auto_reconnect:
                    asyncio.create_task(self._monitor_connection(device_id))
                
                return True
            else:
                return False
        
        except Exception as e:
            self.logger.error(f"❌ Failed to add device: {e}")
            if self.logger.isEnabledFor(logging.DEBUG):
                self.logger.debug(traceback.format_exc())
            return False
    
    async def _start_server_for_device(self, port: int, device_id: str):
        """Start WebSocket server for a specific device"""
        relay = self.relays[device_id]
        connection = self.connections[device_id]
        
        try:
            server = await websockets.serve(
                relay.handle_client,
                "0.0.0.0",
                port
            )
            self.servers.append(server)
            self.logger.info(f"🎉 Server started: ws://0.0.0.0:{port} ({connection.device_info.device_type.value.upper()})")
        except Exception as e:
            self.logger.error(f"❌ Failed to start server on port {port}: {e}")
    
    async def _monitor_connection(self, device_id: str):
        """Monitor connection and auto-reconnect"""
        connection = self.connections.get(device_id)
        if not connection:
            return
        
        while self.running and device_id in self.connections:
            await asyncio.sleep(5)
            
            if not connection.connected:
                self.logger.warning(f"⚠️  Connection lost: {device_id}")
                
                if await connection.reconnect_loop():
                    self.logger.info(f"✅ Reconnected: {device_id}")
                else:
                    self.logger.error(f"❌ Failed to reconnect: {device_id}")
                    # Remove failed device
                    await self.remove_device(device_id)
    
    async def remove_device(self, device_id: str):
        """Remove a device connection"""
        if device_id in self.connections:
            connection = self.connections[device_id]
            await connection.disconnect()
            del self.connections[device_id]
            del self.relays[device_id]
            
            # Remove port mapping
            for port, dev_id in list(self.port_mapping.items()):
                if dev_id == device_id:
                    del self.port_mapping[port]
                    break
            
            self.logger.info(f"🗑️  Device removed: {device_id}")
    
    async def hot_swap_scanner(self):
        """Robust periodic scanner (with better error recovery)"""
        self.logger.info("🔥 Hot-swap scanner started")
        
        SCAN_INTERVAL = 5
        BLE_SCAN_COOLDOWN = 30
        
        last_ble_scan = 0
        consecutive_ble_failures = 0
        
        while self.running:
            await asyncio.sleep(SCAN_INTERVAL)
            
            # Serial Scan (Always safe)
            if DEPS.features["serial"]:
                try:
                    new_serial_devices = await asyncio.wait_for(
                        self.discovery._discover_serial(),
                        timeout=3.0
                    )
                    
                    for device in new_serial_devices:
                        is_connected = any(
                            c.device_info.port == device.port 
                            for c in self.connections.values() 
                            if c.device_info.connection_type == ConnectionType.SERIAL
                        )
                        
                        if not is_connected:
                            self.logger.info(f"🆕 Serial device detected: {device.name}")
                            await self.add_device(device)
                            
                except asyncio.TimeoutError:
                    self.logger.warning("⚠️  Serial scan timeout")
                except Exception as e:
                    self.logger.warning(f"⚠️  Serial scan error: {e}")
            
            # BLE/BT Scan (Rate-limited and safe)
            current_time = time.time()
            if (current_time - last_ble_scan) > BLE_SCAN_COOLDOWN:
                
                # Skip if active BLE connections
                active_ble_connections = any(
                    c.device_info.connection_type == ConnectionType.BLE 
                    for c in self.connections.values()
                )
                
                if active_ble_connections:
                    self.logger.debug("🛡️  Skipping BLE scan (active connections)")
                    last_ble_scan = current_time - (BLE_SCAN_COOLDOWN / 2)
                    continue
                
                # Backoff on repeated failures
                if consecutive_ble_failures >= 3:
                    self.logger.debug(f"⏸️  BLE scan paused ({consecutive_ble_failures} failures)")
                    last_ble_scan = current_time
                    consecutive_ble_failures = 0
                    continue
                
                try:
                    last_ble_scan = current_time
                    new_devices = []
                    
                    # BLE scan with timeout
                    if DEPS.features["ble"]:
                        new_devices.extend(await asyncio.wait_for(
                            self.discovery._discover_ble(),
                            timeout=15.0
                        ))
                    
                    # Classic BT (non-macOS only)
                    if DEPS.features["classic_legacy"] and platform.system() != 'Darwin':
                        new_devices.extend(await asyncio.wait_for(
                            self.discovery._discover_bluetooth_classic(),
                            timeout=15.0
                        ))
                    
                    # Add new devices
                    for device in new_devices:
                        is_connected = any(
                            c.device_info.address == device.address
                            for c in self.connections.values()
                        )
                        
                        if not is_connected:
                            self.logger.info(f"🆕 Bluetooth device: {device.name}")
                            await self.add_device(device)
                    
                    consecutive_ble_failures = 0  # Reset on success
                    
                except asyncio.TimeoutError:
                    consecutive_ble_failures += 1
                    self.logger.warning(f"⚠️  Bluetooth scan timeout ({consecutive_ble_failures})")
                except Exception as e:
                    consecutive_ble_failures += 1
                    self.logger.warning(f"⚠️  Bluetooth scan error: {e}")
    
    async def start(self, host: str = "0.0.0.0"):
        """Start all WebSocket servers"""
        self.running = True
        
        # Start servers for all connected devices
        for port, device_id in self.port_mapping.items():
            await self._start_server_for_device(port, device_id)
        
        # Start hot-swap scanner
        scanner_task = None
        if self.hot_swap:
            scanner_task = asyncio.create_task(self.hot_swap_scanner())
        
        try:
            # Keep running
            while self.running:
                await asyncio.sleep(1)
        finally:
            if scanner_task:
                scanner_task.cancel()
    
    async def stop(self):
        """Stop all connections"""
        self.running = False
        
        for device_id in list(self.connections.keys()):
            await self.remove_device(device_id)
        
        for server in self.servers:
            server.close()
            await server.wait_closed()
        
        self.logger.info("👋 All connections closed")
    
    def print_status(self):
        """Print status of all connections"""
        self.logger.info("\n" + "="*70)
        self.logger.info("📊 CONNECTION STATUS")
        self.logger.info("="*70)
        
        if not self.connections:
            self.logger.info("No active connections")
        else:
            for device_id, connection in self.connections.items():
                port = [p for p, d in self.port_mapping.items() if d == device_id][0]
                status = "🟢 CONNECTED" if connection.connected else "🔴 DISCONNECTED"
                self.logger.info(f"{status} | Port {port} | {connection.stats}")
        
        self.logger.info("="*70 + "\n")

# ============================================================================
# MAIN APPLICATION
# ============================================================================

async def async_main(args):
    """Async main function"""
    
    # Banner
    print("""
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║        Universal LEGO Bridge                                          ║
║                                                                       ║
║  🔧 Multi-Device  •  🔄 Auto-Reconnect  •  🔥 Hot-Swap  •  📊 JSON    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
    """)
    
    logger = logging.getLogger("UniversalBridge")
    
    # Platform info
    logger.info("="*70)
    logger.info(f"🖥️  Platform: {platform.system()} {platform.release()}")
    logger.info(f"🐍 Python: {sys.version.split()[0]}")
    logger.info(f"📡 Protocol Mode: {args.protocol_mode.upper()}")
    logger.info(f"🔄 Auto-Reconnect: {'Enabled' if args.auto_reconnect else 'Disabled'}")
    logger.info(f"🔥 Hot-Swap: {'Enabled' if args.hot_swap else 'Disabled'}")
    logger.info("="*70)
    
    # Check dependencies
    if not any(DEPS.features.values()):
        logger.error("\n❌ No connection libraries available!")
        logger.error("   Install: pip install pyserial bleak pybluez")
        logger.erorr("   or: pip install git+https://github.com/airgproducts/pybluez2.git")
        return
    
    # Supported devices
    logger.info("\n🔍 SUPPORTED DEVICES:")
    logger.info("  • LEGO Mindstorms NXT (Serial, Bluetooth)")
    logger.info("  • LEGO Mindstorms EV3 (Serial)")
    logger.info("  • LEGO SPIKE Prime (Serial)")
    logger.info("  • LEGO WeDo 2.0 (BLE)")
    logger.info("  • LEGO Boost (BLE)")
    logger.info("  • LEGO Powered Up (BLE)")
    logger.info("  • BBC micro:bit (BLE)")
    
    # Discover devices
    discovery = DeviceDiscovery(logger)
    devices = await discovery.discover_all()
    
    if not devices:
        logger.error("\n❌ No compatible devices found!")
        logger.info("\n💡 Troubleshooting:")
        logger.info("  • Ensure devices are powered on")
        logger.info("  • Check Bluetooth/USB connections")
        logger.info("  • Run with --debug for details")
        return
    
    # Print discovered
    logger.info("\n📱 DISCOVERED DEVICES:")
    for i, device in enumerate(devices):
        logger.info(f"  {i+1}. {device}")
    
    # Create server
    protocol_mode = ProtocolMode.NORMALIZED if args.protocol_mode == "normalized" else ProtocolMode.RAW
    server = UniversalBridgeServer(
        logger,
        protocol_mode=protocol_mode,
        auto_reconnect=args.auto_reconnect,
        hot_swap=args.hot_swap
    )
    
    # Add devices
    for device in devices:
        if not args.device_filter or device.device_type.value in args.device_filter:
            await server.add_device(device)
    
    if not server.connections:
        logger.error("\n❌ No devices connected!")
        return
    
    # Print status
    logger.info("\n" + "="*70)
    logger.info("🚀 BRIDGE ACTIVE")
    logger.info("="*70)
    
    for port, device_id in server.port_mapping.items():
        connection = server.connections[device_id]
        logger.info(f"📡 ws://localhost:{port} → {connection.device_info.device_type.value.upper()}")
    
    logger.info("="*70)
    logger.info("\n💡 Connect your application to the WebSocket URLs above")
    
    if protocol_mode == ProtocolMode.NORMALIZED:
        logger.info("📝 Protocol: NORMALIZED (JSON commands)")
        logger.info("   Send: {\"command\": \"motor_power\", \"port\": 0, \"power\": 75}")
    else:
        logger.info("📝 Protocol: RAW (base64 binary)")
    
    logger.info("\n⌨️  Press Ctrl+C to stop\n")
    
    # Stats monitoring
    if args.stats_interval > 0:
        async def stats_loop():
            while server.running:
                await asyncio.sleep(args.stats_interval)
                server.print_status()
        
        asyncio.create_task(stats_loop())
    
    # Start server
    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("\n⚠️  Shutdown requested...")
    finally:
        await server.stop()
        
        if args.stats:
            server.print_status()

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Universal LEGO Bridge - Production Edition',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Auto-discover all devices
  %(prog)s --debug                            # Debug logging
  %(prog)s --protocol-mode normalized         # Use JSON protocol
  %(prog)s --device-filter nxt spike          # Only NXT and SPIKE
  %(prog)s --no-auto-reconnect                # Disable reconnection
  %(prog)s --no-hot-swap                      # Disable device scanning
  %(prog)s --stats-interval 30                # Stats every 30s
        """
    )
    
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug logging')
    parser.add_argument('--protocol-mode', choices=['raw', 'normalized'], default='raw',
                       help='Protocol mode: raw (binary) or normalized (JSON)')
    parser.add_argument('--device-filter', nargs='+',
                       choices=['nxt', 'ev3', 'spike', 'wedo2', 'boost', 'poweredup', 'microbit'],
                       help='Only connect specified device types')
    parser.add_argument('--no-auto-reconnect', action='store_true',
                       help='Disable automatic reconnection')
    parser.add_argument('--no-hot-swap', action='store_true',
                       help='Disable hot-swap device detection')
    parser.add_argument('--stats', action='store_true',
                       help='Print statistics on exit')
    parser.add_argument('--stats-interval', type=int, default=0,
                       help='Print stats every N seconds (0=disabled)')
    
    args = parser.parse_args()
    args.auto_reconnect = not args.no_auto_reconnect
    args.hot_swap = not args.no_hot_swap
    
    # Setup logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Fix for Windows
    if platform.system() == 'Windows':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # Run
    try:
        asyncio.run(async_main(args))
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        logging.error(f"❌ Fatal error: {e}")
        if args.debug:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass