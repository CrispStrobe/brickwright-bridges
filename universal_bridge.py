#!/usr/bin/env python3
"""
Universal Scratch Link Surrogate (Complete - Windows/macOS/Linux)
Supports: BLE (micro:bit, LEGO WeDo/Boost/Powered Up) + BT Classic (LEGO NXT)
"""

import argparse
import asyncio
import base64
import json
import logging
import queue
import ssl
import sys
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional

import websockets

# BLE support (cross-platform)
try:
    from bleak import BleakClient, BleakScanner
    from bleak.backends.device import BLEDevice

    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False

# Classic Bluetooth support
try:
    import bluetooth

    PYBLUEZ_AVAILABLE = True
except ImportError:
    PYBLUEZ_AVAILABLE = False

# Certificate generation
try:
    import datetime

    from cryptography import x509
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

# === CONFIGURATION ===
SCRATCH_HOSTNAME = "device-manager.scratch.mit.edu"
SCRATCH_PORT = 20110

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# === CERTIFICATE MANAGEMENT ===
class CertificateManager:
    """Manage SSL certificates for Scratch Link compatibility"""

    def __init__(self):
        self.homedir = Path.home()
        self.cert_dir = self.homedir / ".local/share/scratch-link"
        self.cert_path = self.cert_dir / "scratch-device-manager.cer"
        self.key_path = self.cert_dir / "scratch-device-manager.key"

    def generate_cert(self):
        """Generate self-signed certificate"""
        if not CRYPTO_AVAILABLE:
            logger.error("cryptography library not available")
            return False

        self.cert_dir.mkdir(parents=True, exist_ok=True)

        if self.cert_path.exists() and self.key_path.exists():
            if self._is_valid():
                logger.debug("Valid certificate exists")
                return True

        logger.info("Generating SSL certificate...")

        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537, key_size=2048, backend=default_backend()
        )

        # Create certificate
        subject = issuer = x509.Name(
            [
                x509.NameAttribute(NameOID.COMMON_NAME, SCRATCH_HOSTNAME),
            ]
        )

        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.now(datetime.UTC))
            .not_valid_after(
                datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=3650)
            )
            .add_extension(
                x509.SubjectAlternativeName(
                    [
                        x509.DNSName(SCRATCH_HOSTNAME),
                    ]
                ),
                critical=False,
            )
            .sign(private_key, hashes.SHA256(), default_backend())
        )

        # Write files
        with open(self.cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        with open(self.key_path, "wb") as f:
            f.write(
                private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption(),
                )
            )

        logger.info(f"✓ Certificate: {self.cert_path}")
        self._show_install_instructions()
        return True

    def _is_valid(self) -> bool:
        try:
            with open(self.cert_path, "rb") as f:
                cert = x509.load_pem_x509_certificate(f.read(), default_backend())
            now = datetime.datetime.now(datetime.UTC)
            return cert.not_valid_before_utc <= now <= cert.not_valid_after_utc
        except Exception:
            return False

    def _show_install_instructions(self):
        logger.info("\n" + "=" * 70)
        logger.info("📜 CERTIFICATE SETUP")
        logger.info("=" * 70)
        logger.info(f"Certificate: {self.cert_path}\n")

        logger.info("STEP 1: Edit hosts file")
        if sys.platform == "win32":
            logger.info("  Run Notepad as Administrator")
            logger.info("  Open: C:\\Windows\\System32\\drivers\\etc\\hosts")
            logger.info(f"  Add: 127.0.0.1 {SCRATCH_HOSTNAME}\n")
        else:
            logger.info("  sudo nano /etc/hosts")
            logger.info(f"  Add: 127.0.0.1 {SCRATCH_HOSTNAME}\n")

        logger.info("STEP 2: Trust certificate")
        if sys.platform == "win32":
            logger.info("  1. Double-click certificate file")
            logger.info("  2. Install Certificate > Local Machine")
            logger.info("  3. Trusted Root Certification Authorities\n")
        else:
            logger.info("  Import in browser certificate settings\n")

        logger.info("=" * 70 + "\n")

    def get_ssl_context(self) -> Optional[ssl.SSLContext]:
        if not self.cert_path.exists() or not self.key_path.exists():
            return None

        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(str(self.cert_path), str(self.key_path))
        return ssl_context


# === SESSION BASE ===
class Session:
    """Base session class"""

    def __init__(self, websocket, loop):
        self.websocket = websocket
        self.loop = loop
        self.notification_queue = queue.Queue()
        self.status = "initial"

    async def handle(self):
        """Main session loop"""
        logger.debug("Session started")

        while True:
            try:
                try:
                    req = await asyncio.wait_for(self.websocket.recv(), 0.01)
                    await self._handle_request(req)
                except asyncio.TimeoutError:
                    pass

                await self._send_notifications()

                if self.status == "done":
                    break

                await asyncio.sleep(0.01)

            except websockets.ConnectionClosedError:
                logger.info("Client disconnected")
                break

        self.close()

    async def _handle_request(self, req_str: str):
        try:
            req = json.loads(req_str)
            logger.debug(f"Request: {req.get('method')}")

            if req.get("jsonrpc") != "2.0":
                return

            method = req.get("method")
            params = req.get("params", {})
            result = await self.handle_method(method, params)

            response = {"jsonrpc": "2.0"}
            if "id" in req:
                response["id"] = req["id"]

            if isinstance(result, dict) and "error" in result:
                response["error"] = result["error"]
            else:
                response["result"] = result

            await self.websocket.send(json.dumps(response))

        except Exception as e:
            logger.error(f"Request error: {e}")

    async def handle_method(self, method: str, params: dict):
        return {"error": {"message": "Not implemented"}}

    async def _send_notifications(self):
        while not self.notification_queue.empty():
            method, params = self.notification_queue.get()
            notification = {"jsonrpc": "2.0", "method": method, "params": params}
            await self.websocket.send(json.dumps(notification))

    def notify(self, method: str, params: dict):
        self.notification_queue.put((method, params))

    def close(self):
        pass


# === BLE SESSION ===
class BLESession(Session):
    """BLE session for micro:bit, LEGO WeDo/Boost/Powered Up, etc."""

    found_devices: List[BLEDevice] = []
    scan_lock = asyncio.Lock()
    nr_connected = 0

    def __init__(self, websocket, loop):
        super().__init__(websocket, loop)
        self.client: Optional[BleakClient] = None
        self.device_name = None
        self.notification_handles: Dict[str, Dict] = {}
        self.discovery_task = None

    async def handle_method(self, method: str, params: dict):
        if method == "discover":
            return await self._discover(params)
        elif method == "connect":
            return await self._connect(params)
        elif method == "read":
            return await self._read(params)
        elif method == "write":
            return await self._write(params)
        elif method == "startNotifications":
            return await self._start_notifications(params)
        elif method == "stopNotifications":
            return await self._stop_notifications(params)

        return {"error": {"message": f"Unknown method: {method}"}}

    async def _discover(self, params: dict):
        if not BLEAK_AVAILABLE:
            return {"error": {"message": "Bleak not available"}}

        logger.info("🔍 Scanning BLE devices (10s)...")

        try:
            async with self.scan_lock:
                BLESession.found_devices.clear()
                devices = await BleakScanner.discover(timeout=10.0, return_adv=False)

                filters = params.get("filters", [])

                for device in devices:
                    if self._matches_filter(device, filters):
                        BLESession.found_devices.append(device)
                        self.notify(
                            "didDiscoverPeripheral",
                            {
                                "peripheralId": len(BLESession.found_devices) - 1,
                                "name": device.name or "Unknown",
                                "rssi": getattr(device, "rssi", -50),
                            },
                        )
                        logger.info(f"  ✓ {device.name} ({device.address})")

            self.status = "discovery"

            if not self.discovery_task:
                self.discovery_task = asyncio.create_task(self._discovery_loop())

            return None

        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            return {"error": {"message": str(e)}}

    def _matches_filter(self, device: BLEDevice, filters: List[dict]) -> bool:
        if not filters:
            name = (device.name or "").lower()
            return any(
                k in name
                for k in [
                    "bbc",
                    "micro:bit",
                    "microbit",
                    "lego",
                    "lpf2",
                    "hub",
                    "wedo",
                    "boost",
                ]
            )

        for f in filters:
            if "namePrefix" in f and device.name:
                if device.name.startswith(f["namePrefix"]):
                    return True
            if "name" in f and device.name == f["name"]:
                return True

        return False

    async def _discovery_loop(self):
        while self.status == "discovery":
            for device in BLESession.found_devices:
                self.notify(
                    "didDiscoverPeripheral",
                    {
                        "peripheralId": BLESession.found_devices.index(device),
                        "name": device.name or "Unknown",
                        "rssi": getattr(device, "rssi", -50),
                    },
                )
            await asyncio.sleep(1)

    async def _connect(self, params: dict):
        try:
            device_id = params.get("peripheralId", 0)
            if device_id >= len(BLESession.found_devices):
                return {"error": {"message": "Invalid device ID"}}

            device = BLESession.found_devices[device_id]
            self.device_name = device.name or "Unknown"

            logger.info(f"📱 Connecting to {self.device_name}...")

            self.client = BleakClient(device)
            await self.client.connect()

            logger.info(f"✓ Connected to {self.device_name}")

            self.status = "connected"
            BLESession.nr_connected += 1

            if self.discovery_task:
                self.discovery_task.cancel()
                self.discovery_task = None

            return None

        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return {"error": {"message": str(e)}}

    async def _read(self, params: dict):
        if not self.client or not self.client.is_connected:
            return {"error": {"message": "Not connected"}}

        try:
            char_uuid = params.get("characteristicId")
            data = await self.client.read_gatt_char(char_uuid)

            result = {
                "message": base64.b64encode(data).decode("ascii"),
                "encoding": "base64",
            }

            if params.get("startNotifications"):
                await self._start_notifications(
                    {
                        "serviceId": params.get("serviceId"),
                        "characteristicId": char_uuid,
                    }
                )

            return result

        except Exception as e:
            logger.error(f"Read failed: {e}")
            return {"error": {"message": str(e)}}

    async def _write(self, params: dict):
        if not self.client or not self.client.is_connected:
            return {"error": {"message": "Not connected"}}

        try:
            char_uuid = params.get("characteristicId")
            message = params.get("message", "")
            encoding = params.get("encoding", "base64")

            data = (
                base64.b64decode(message) if encoding == "base64" else message.encode()
            )

            await self.client.write_gatt_char(char_uuid, data, response=True)
            logger.debug(f"Wrote {len(data)} bytes")

            return len(data)

        except Exception as e:
            logger.error(f"Write failed: {e}")
            return {"error": {"message": str(e)}}

    async def _start_notifications(self, params: dict):
        if not self.client or not self.client.is_connected:
            return {"error": {"message": "Not connected"}}

        try:
            service_id = params.get("serviceId")
            char_uuid = params.get("characteristicId")

            self.notification_handles[char_uuid] = {
                "serviceId": service_id,
                "characteristicId": char_uuid,
            }

            def callback(sender, data):
                p = self.notification_handles[char_uuid].copy()
                p["message"] = base64.b64encode(data).decode("ascii")
                p["encoding"] = "base64"
                self.notify("characteristicDidChange", p)

            await self.client.start_notify(char_uuid, callback)
            logger.debug(f"✓ Notifications: {char_uuid}")

            return None

        except Exception as e:
            logger.error(f"Start notifications failed: {e}")
            return {"error": {"message": str(e)}}

    async def _stop_notifications(self, params: dict):
        if not self.client or not self.client.is_connected:
            return {"error": {"message": "Not connected"}}

        try:
            char_uuid = params.get("characteristicId")
            await self.client.stop_notify(char_uuid)

            if char_uuid in self.notification_handles:
                del self.notification_handles[char_uuid]

            return None

        except Exception as e:
            logger.error(f"Stop notifications failed: {e}")
            return {"error": {"message": str(e)}}

    def close(self):
        self.status = "done"

        if self.discovery_task:
            self.discovery_task.cancel()

        if self.client and self.client.is_connected:
            asyncio.create_task(self._disconnect())
            BLESession.nr_connected -= 1

        logger.info("BLE session closed")

    async def _disconnect(self):
        try:
            await self.client.disconnect()
        except Exception:
            pass


# === BT CLASSIC SESSION ===
class BTSession(Session):
    """Classic Bluetooth for LEGO NXT, etc."""

    found_devices = []
    scan_lock = threading.RLock()

    def __init__(self, websocket, loop):
        super().__init__(websocket, loop)
        self.sock = None
        self.device_name = None
        self.receive_thread = None
        self.keepalive_thread = None
        self.running = False

    async def handle_method(self, method: str, params: dict):
        if not PYBLUEZ_AVAILABLE:
            return {"error": {"message": "PyBluez not available"}}

        if method == "discover":
            return await self._discover(params)
        elif method == "connect":
            return await self._connect(params)
        elif method == "send":
            return await self._send(params)

        return {"error": {"message": f"Unknown method: {method}"}}

    async def _discover(self, params: dict):
        logger.info("🔍 Scanning Bluetooth Classic devices (8s)...")

        try:
            with self.scan_lock:
                BTSession.found_devices.clear()

                # Run discovery in executor (blocking operation)
                devices = await self.loop.run_in_executor(
                    None,
                    lambda: bluetooth.discover_devices(
                        duration=8, lookup_names=True, flush_cache=True
                    ),
                )

                for addr, name in devices:
                    BTSession.found_devices.append((addr, name))
                    self.notify(
                        "didDiscoverPeripheral",
                        {
                            "peripheralId": len(BTSession.found_devices) - 1,
                            "name": name,
                            "rssi": -50,
                        },
                    )
                    logger.info(f"  ✓ {name} ({addr})")

            self.status = "discovery"
            return None

        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            return {"error": {"message": str(e)}}

    async def _connect(self, params: dict):
        try:
            device_id = params.get("peripheralId", 0)
            if device_id >= len(BTSession.found_devices):
                return {"error": {"message": "Invalid device ID"}}

            addr, name = BTSession.found_devices[device_id]
            self.device_name = name

            logger.info(f"📱 Connecting to {name}...")

            # Create socket
            self.sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)

            # Connect (blocking)
            await self.loop.run_in_executor(None, lambda: self.sock.connect((addr, 1)))

            self.sock.setblocking(False)

            logger.info(f"✓ Connected to {name}")

            self.status = "connected"
            self.running = True

            # Start receive thread
            self.receive_thread = threading.Thread(
                target=self._receive_loop, daemon=True
            )
            self.receive_thread.start()

            # Start keepalive for NXT
            if "NXT" in name.upper():
                self.keepalive_thread = threading.Thread(
                    target=self._keepalive_loop, daemon=True
                )
                self.keepalive_thread.start()
                logger.info("  ⏰ Keepalive enabled for NXT")

            return None

        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return {"error": {"message": str(e)}}

    async def _send(self, params: dict):
        if not self.sock:
            return {"error": {"message": "Not connected"}}

        try:
            message = params.get("message", "")
            data = base64.b64decode(message)

            # Send in executor (blocking)
            await self.loop.run_in_executor(None, lambda: self.sock.send(data))

            logger.debug(f"Sent: {data.hex().upper()}")
            return len(data)

        except Exception as e:
            logger.error(f"Send failed: {e}")
            return {"error": {"message": str(e)}}

    def _receive_loop(self):
        """Background thread to receive NXT packets"""
        logger.debug("Receive thread started")

        while self.running:
            try:
                # Read length header (2 bytes, little-endian)
                header = b""
                while len(header) < 2 and self.running:
                    try:
                        chunk = self.sock.recv(2 - len(header))
                        if chunk:
                            header += chunk
                    except bluetooth.BluetoothError:
                        time.sleep(0.01)

                if len(header) < 2:
                    continue

                length = header[0] | (header[1] << 8)

                if length > 256 or length == 0:
                    logger.warning(f"Invalid packet length: {length}")
                    continue

                # Read data
                data = b""
                while len(data) < length and self.running:
                    try:
                        chunk = self.sock.recv(length - len(data))
                        if chunk:
                            data += chunk
                    except bluetooth.BluetoothError:
                        time.sleep(0.01)

                if len(data) < length:
                    logger.warning(
                        f"Incomplete packet: got {len(data)}, expected {length}"
                    )
                    continue

                packet = header + data
                logger.debug(f"Received: {packet.hex().upper()}")

                # Notify Scratch
                self.notify(
                    "didReceiveMessage",
                    {
                        "message": base64.b64encode(packet).decode("ascii"),
                        "encoding": "base64",
                    },
                )

            except Exception as e:
                if self.running:
                    logger.error(f"Receive error: {e}")
                break

    def _keepalive_loop(self):
        """Send periodic battery requests to keep NXT alive"""
        logger.debug("Keepalive thread started")

        while self.running:
            time.sleep(25)  # Every 25 seconds

            if self.sock and self.running:
                try:
                    # NXT battery level request: [length LSB, length MSB, 0x00, 0x0B]
                    keepalive = bytes([0x02, 0x00, 0x00, 0x0B])
                    self.sock.send(keepalive)
                    logger.debug("⏰ Keepalive sent")
                except Exception as e:
                    logger.warning(f"Keepalive failed: {e}")

    def close(self):
        self.running = False
        self.status = "done"

        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None

        logger.info(f"BT session closed: {self.device_name}")


# === WEBSOCKET HANDLER ===
async def ws_handler(websocket, path):
    """Route connections to BLE or BT session"""
    session_types = {"/scratch/ble": BLESession, "/scratch/bt": BTSession}

    try:
        logger.info(f"📡 {path} from {websocket.remote_address}")

        if path not in session_types:
            logger.error(f"Unknown path: {path}")
            await websocket.close()
            return

        loop = asyncio.get_event_loop()
        session = session_types[path](websocket, loop)
        await session.handle()

    except Exception as e:
        logger.error(f"Session error: {e}")
        if "session" in locals():
            session.close()


# === MAIN ===
async def async_main(args):
    """Async main function"""
    ssl_context = None
    if not args.no_ssl:
        cert_manager = CertificateManager()
        if not cert_manager.generate_cert():
            return False
        ssl_context = cert_manager.get_ssl_context()

    logger.info("=" * 70)
    logger.info("🚀 Universal Scratch Link")
    logger.info("=" * 70)
    logger.info(f"Platform: {sys.platform}")
    logger.info(f"Mode: {'WSS (SSL)' if ssl_context else 'WS'}")
    logger.info(f"Port: {args.port}")
    logger.info(f"BLE: {'✓ bleak' if BLEAK_AVAILABLE else '✗'}")
    logger.info(f"BT Classic: {'✓ PyBluez' if PYBLUEZ_AVAILABLE else '✗'}")
    logger.info("=" * 70)
    logger.info("Supported devices:")
    logger.info("  • BBC micro:bit (BLE)")
    logger.info("  • LEGO WeDo 2.0, Boost, Powered Up (BLE)")
    logger.info("  • LEGO Mindstorms NXT (BT Classic)" if PYBLUEZ_AVAILABLE else "")
    logger.info("=" * 70 + "\n")

    async with websockets.serve(ws_handler, "0.0.0.0", args.port, ssl=ssl_context):
        logger.info("✓ Server running")
        logger.info("Press Ctrl+C to stop\n")
        await asyncio.Future()


def main():
    parser = argparse.ArgumentParser(description="Universal Scratch Link")
    parser.add_argument("--no-ssl", action="store_true", help="Disable SSL")
    parser.add_argument("--port", type=int, default=SCRATCH_PORT, help="Port")
    parser.add_argument("--debug", action="store_true", help="Debug mode")

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    if not BLEAK_AVAILABLE:
        logger.error("❌ Bleak required: pip install bleak")
        sys.exit(1)

    if not args.no_ssl and not CRYPTO_AVAILABLE:
        logger.error("❌ cryptography required: pip install cryptography")
        sys.exit(1)

    try:
        asyncio.run(async_main(args))
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down...")


if __name__ == "__main__":
    main()
