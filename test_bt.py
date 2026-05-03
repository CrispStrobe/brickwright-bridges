import subprocess
import sys
from datetime import datetime

LISTEN_PORT = 8080
DEBUG = True


def log(msg, color=""):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"{color}[{timestamp}] {msg}\033[0m" if color else f"[{timestamp}] {msg}")


print("🚀 NXT Bridge via macOS IOBluetooth")

# Use macOS blueutil to connect
try:
    # Check if blueutil is installed
    result = subprocess.run(["which", "blueutil"], capture_output=True)
    if result.returncode != 0:
        print("❌ blueutil not found!")
        print("   Install with: brew install blueutil")
        sys.exit(1)

    # Find NXT
    result = subprocess.run(["blueutil", "--paired"], capture_output=True, text=True)
    print(f"\n📱 Paired devices:\n{result.stdout}")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
