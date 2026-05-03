import sys
import time
from datetime import datetime

import serial

# --- CONFIGURATION ---
LISTEN_PORT = 8080
NXT_COM_PORT = "/dev/cu.NXT"  # Hardcoded since we found it
DEBUG = True

# Packet statistics
stats = {"to_nxt": 0, "from_nxt": 0, "errors": 0, "start_time": None}

OPCODE_NAMES = {
    0x00: "DIRECT_CMD",
    0x80: "DIRECT_CMD_NO_REPLY",
    0x01: "SYSTEM_CMD",
    0x02: "REPLY",
    0x03: "PLAY_TONE",
    0x04: "SET_OUT_STATE",
    0x0B: "GET_BATT_LVL",
}


def log(msg, color="\033[0m"):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"{color}[{timestamp}] {msg}\033[0m")


print("🚀 NXT Diagnostic Bridge")
print("=" * 60)

# Open serial port
try:
    ser = serial.Serial(NXT_COM_PORT, baudrate=115200, timeout=0.5)
    log(f"✅ Opened {NXT_COM_PORT}", "\033[92m")

    # Check if port is actually usable
    log(f"   Baudrate: {ser.baudrate}")
    log(f"   Timeout: {ser.timeout}s")
    log(f"   Is open: {ser.is_open}")

except Exception as e:
    log(f"❌ Failed to open port: {e}", "\033[91m")
    sys.exit(1)

print("=" * 60)

# TEST 1: Can we write?
print("\n🧪 TEST 1: Sending battery command...")
battery_cmd = bytes([0x02, 0x00, 0x00, 0x0B])  # GET_BATT_LVL
log(f"Writing: {battery_cmd.hex().upper()}", "\033[94m")

try:
    bytes_written = ser.write(battery_cmd)
    ser.flush()
    log(f"✅ Wrote {bytes_written} bytes", "\033[92m")
except Exception as e:
    log(f"❌ Write failed: {e}", "\033[91m")
    ser.close()
    sys.exit(1)

# TEST 2: Can we read?
print("\n🧪 TEST 2: Waiting for reply (5 seconds)...")
log("Listening for data...", "\033[93m")

start = time.time()
total_read = b""

while time.time() - start < 5:
    try:
        # Check how many bytes are waiting
        waiting = ser.in_waiting

        if waiting > 0:
            chunk = ser.read(waiting)
            total_read += chunk
            log(f"📥 Received {len(chunk)} bytes: {chunk.hex().upper()}", "\033[92m")
        else:
            # No data, brief sleep
            time.sleep(0.05)

    except Exception as e:
        log(f"❌ Read error: {e}", "\033[91m")
        break

elapsed = time.time() - start
print(f"\n📊 After {elapsed:.1f}s:")
print(f"   Total bytes received: {len(total_read)}")
if total_read:
    print(f"   Data: {total_read.hex().upper()}")

    # Try to parse if we got a reply
    if len(total_read) >= 2:
        length = total_read[0] | (total_read[1] << 8)
        print(f"   Packet length: {length}")
        if len(total_read) >= length + 2:
            print("   ✅ Complete packet received!")
        else:
            print(f"   ⚠️ Incomplete: have {len(total_read)}, need {length + 2}")
else:
    print("   ❌ NO DATA RECEIVED!")
    print("\n💡 This means:")
    print("   - NXT might not be receiving commands, OR")
    print("   - NXT is not sending replies back, OR")
    print("   - Bluetooth pairing needs to be reset")

# TEST 3: Try playing a tone (doesn't need reply)
print("\n\n🧪 TEST 3: Playing tone (440 Hz, 500ms)...")
tone_cmd = bytes([0x06, 0x00, 0x80, 0x03, 0xB8, 0x01, 0xF4, 0x01])
log(f"Writing: {tone_cmd.hex().upper()}", "\033[94m")

try:
    ser.write(tone_cmd)
    ser.flush()
    log("✅ Command sent", "\033[92m")
    print("\n❓ Did you hear a beep from the NXT?")
    print("   If YES: Commands reach NXT, but replies aren't coming back")
    print("   If NO:  Commands aren't reaching NXT at all")
except Exception as e:
    log(f"❌ Write failed: {e}", "\033[91m")

# Cleanup
ser.close()
print("\n" + "=" * 60)
print("🔍 DIAGNOSIS COMPLETE")
print("\nNext steps:")
print("  1. Check if you heard the beep")
print("  2. If no beep: Re-pair NXT (forget device + pair again)")
print("  3. If beep but no data: Bluetooth driver issue")
print("=" * 60)
