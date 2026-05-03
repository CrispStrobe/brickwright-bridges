import asyncio
import base64
import socket as sock_module
import sys
from datetime import datetime

import websockets

try:
    import bluetooth
except ImportError:
    print("❌ PyBluez not installed!")
    print("   Install it with: pip install pybluez")
    sys.exit(1)

# --- CONFIGURATION ---
LISTEN_PORT = 8080
NXT_NAME = "NXT"  # Your NXT's Bluetooth name
NXT_ADDRESS = None  # Auto-detect
DEBUG = True

# Packet statistics
stats = {"to_nxt": 0, "from_nxt": 0, "errors": 0, "start_time": None}

# Opcode lookup
OPCODE_NAMES = {
    0x00: "DIRECT_CMD",
    0x80: "DIRECT_CMD_NO_REPLY",
    0x01: "SYSTEM_CMD",
    0x02: "REPLY",
    0x03: "PLAY_TONE",
    0x04: "SET_OUT_STATE",
    0x05: "SET_IN_MODE",
    0x06: "GET_OUT_STATE",
    0x07: "GET_IN_VALS",
    0x0A: "RESET_POSITION",
    0x0B: "GET_BATT_LVL",
    0x0E: "LS_GET_STATUS",
    0x0F: "LS_WRITE",
    0x10: "LS_READ",
    0x94: "READ_IO_MAP",
    0x95: "WRITE_IO_MAP",
}


def log_packet(direction, data, description=""):
    """Log packet with timestamp and hex dump"""
    if not DEBUG:
        return

    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    hex_str = data.hex().upper()

    # Parse packet structure
    details = ""
    if len(data) >= 2:
        length = data[0] | (data[1] << 8)
        details = f" [Len:{length}]"

        if len(data) >= 4:
            cmd_type = data[2]
            opcode = data[3]
            cmd_name = OPCODE_NAMES.get(cmd_type, f"0x{cmd_type:02X}")
            op_name = OPCODE_NAMES.get(opcode, f"0x{opcode:02X}")
            details += f" [{cmd_name} → {op_name}]"

    arrow = "➡️" if direction == "TO_NXT" else "⬅️"
    color = "\033[94m" if direction == "TO_NXT" else "\033[92m"

    log_line = f"[{timestamp}] {arrow} {direction}: {hex_str}{details}"
    if description:
        log_line += f" | {description}"

    print(f"{color}{log_line}\033[0m")


def print_stats():
    if not DEBUG or stats["start_time"] is None:
        return

    elapsed = (datetime.now() - stats["start_time"]).total_seconds()
    print("\n📊 Statistics:")
    print(f"   Uptime: {elapsed:.1f}s")
    print(f"   Packets TO NXT: {stats['to_nxt']}")
    print(f"   Packets FROM NXT: {stats['from_nxt']}")
    print(f"   Errors: {stats['errors']}")
    if elapsed > 0:
        print(
            f"   Rate: {(stats['to_nxt'] + stats['from_nxt']) / elapsed:.1f} packets/sec"
        )


print("🚀 Initializing NXT Bluetooth Bridge (PyBluez)...")
if DEBUG:
    print("🔍 DEBUG MODE ENABLED - Packet traffic will be logged\n")


def find_nxt():
    """Search for NXT brick via Bluetooth"""
    print(f"🔍 Searching for NXT brick '{NXT_NAME}'...")

    try:
        nearby_devices = bluetooth.discover_devices(
            duration=8, lookup_names=True, flush_cache=True
        )

        if not nearby_devices:
            print("❌ No Bluetooth devices found!")
            return None, None

        print(f"\n📱 Found {len(nearby_devices)} Bluetooth device(s):")
        for addr, name in nearby_devices:
            marker = "✅" if NXT_NAME.lower() in name.lower() else "  "
            print(f"   {marker} {name} - {addr}")

        # Find NXT
        for addr, name in nearby_devices:
            if NXT_NAME.lower() in name.lower():
                print(f"\n✅ Found NXT: {name} ({addr})")
                return addr, name

        print(f"\n❌ Could not find NXT brick named '{NXT_NAME}'")
        print("   Make sure:")
        print("   1. NXT is turned on")
        print("   2. NXT Bluetooth is enabled")
        print("   3. NXT is in range")
        return None, None

    except Exception as e:
        print(f"❌ Bluetooth discovery error: {e}")
        return None, None


def connect_nxt(address):
    """Connect to NXT via RFCOMM"""
    print(f"\n🔌 Connecting to NXT at {address}...")

    try:
        # Create RFCOMM socket
        sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)

        # NXT uses channel 1 for RFCOMM
        sock.connect((address, 1))

        # Set non-blocking mode
        sock.setblocking(False)

        print("✅ Connected to NXT!")
        return sock

    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None


# Find and connect to NXT
NXT_ADDRESS, NXT_NAME_FOUND = find_nxt()

if not NXT_ADDRESS:
    print("\n💡 Troubleshooting:")
    print("   - Make sure NXT is paired in macOS Bluetooth settings")
    print("   - Ensure NXT is powered on")
    print("   - Try moving closer to the NXT")
    sys.exit(1)

nxt_sock = connect_nxt(NXT_ADDRESS)

if not nxt_sock:
    print("\n💡 Try:")
    print("   1. Turn NXT off and on")
    print("   2. Re-pair in Bluetooth settings")
    print("   3. Make sure no other app is connected")
    sys.exit(1)


def read_nxt_packet(sock):
    """
    Read a complete NXT telegram
    Returns complete packet (length header + data) or None
    """
    try:
        # Read 2-byte length header (little-endian)
        header = b""
        while len(header) < 2:
            try:
                chunk = sock.recv(2 - len(header))
                if not chunk:
                    return None
                header += chunk
            except bluetooth.BluetoothError:
                return None

        # Parse length
        length = header[0] | (header[1] << 8)

        # Validate length
        if length > 256 or length == 0:
            if DEBUG:
                print(f"⚠️ Invalid packet length: {length}")
            return None

        # Read telegram data
        data = b""
        while len(data) < length:
            try:
                chunk = sock.recv(length - len(data))
                if not chunk:
                    break
                data += chunk
            except bluetooth.BluetoothError:
                break

        if len(data) < length:
            if DEBUG:
                print(f"⚠️ Incomplete packet: expected {length}, got {len(data)}")
            return None

        # Return complete packet
        return header + data

    except Exception as e:
        if DEBUG:
            print(f"⚠️ Packet read error: {e}")
        return None


async def relay_handler(websocket):
    client_ip = websocket.remote_address[0]
    print(f"📱 Client connected from {client_ip}")

    if stats["start_time"] is None:
        stats["start_time"] = datetime.now()

    # Read from NXT and forward to WebSocket
    async def nxt_to_client():
        """Forward NXT packets to client"""
        while True:
            try:
                # Read packet (non-blocking)
                packet = await asyncio.get_event_loop().run_in_executor(
                    None, read_nxt_packet, nxt_sock
                )

                if packet:
                    log_packet("FROM_NXT", packet)
                    stats["from_nxt"] += 1

                    # Send to client
                    b64_data = base64.b64encode(packet).decode("utf-8")
                    await websocket.send(b64_data)
                else:
                    # No data, brief sleep
                    await asyncio.sleep(0.01)

            except Exception as e:
                stats["errors"] += 1
                if DEBUG:
                    print(f"⚠️ NXT read error: {e}")
                break

    nxt_task = asyncio.create_task(nxt_to_client())

    try:
        async for message in websocket:
            try:
                raw_telegram = base64.b64decode(message)

                if len(raw_telegram) == 0:
                    continue

                log_packet("TO_NXT", raw_telegram)
                stats["to_nxt"] += 1

                # Send to NXT
                retry_count = 0
                max_retries = 3

                while retry_count < max_retries:
                    try:
                        nxt_sock.send(raw_telegram)
                        break

                    except bluetooth.BluetoothError as e:
                        retry_count += 1
                        stats["errors"] += 1
                        if DEBUG:
                            print(
                                f"⚠️ Bluetooth send error (attempt {retry_count}/{max_retries}): {e}"
                            )

                        if retry_count < max_retries:
                            await asyncio.sleep(0.02)
                        else:
                            if DEBUG:
                                print(f"❌ Send failed after {max_retries} attempts")

                    except Exception as e:
                        stats["errors"] += 1
                        if DEBUG:
                            print(f"❌ Unexpected error: {e}")
                        break

            except Exception as e:
                stats["errors"] += 1
                if DEBUG:
                    print(f"❌ Message handling error: {e}")

    except websockets.exceptions.ConnectionClosed:
        print(f"📴 Client {client_ip} disconnected")
        if DEBUG:
            print_stats()
    finally:
        nxt_task.cancel()


async def main():
    async with websockets.serve(relay_handler, "0.0.0.0", LISTEN_PORT):
        local_ip = get_local_ip()
        print("\n🎉 Bluetooth Bridge running!")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📡 WebSocket Server: ws://{local_ip}:{LISTEN_PORT}")
        print(f"🔗 Local connection:  ws://localhost:{LISTEN_PORT}")
        print(f"🔵 NXT: {NXT_NAME_FOUND} ({NXT_ADDRESS})")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("\n💡 In TurboWarp/Scratch:")
        print("   Use your JavaScript extension (NOT this bridge)")
        print(f"   OR use WebSocket block: connect to [{local_ip}:{LISTEN_PORT}]")
        print("\n⌨️  Press Ctrl+C to stop\n")
        await asyncio.get_running_loop().create_future()


def get_local_ip():
    s = sock_module.socket(sock_module.AF_INET, sock_module.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = "127.0.0.1"
    finally:
        s.close()
    return IP


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Bridge stopped")
        if DEBUG:
            print_stats()
        if nxt_sock:
            nxt_sock.close()
