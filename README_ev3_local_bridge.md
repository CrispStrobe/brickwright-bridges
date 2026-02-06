
# LEGO EV3 Local Bridge Server

WebSocket bridge server that connects browser extensions to LEGO EV3 robots.

## Features

- ✅ **Multiple connection methods**: Serial (USB), Bluetooth, HTTP
- ✅ **Auto-detection**: Automatically finds EV3 via Serial or Bluetooth
- ✅ **Automatic fallback**: Tries alternative connection methods
- ✅ **Robust reconnection**: Automatic reconnection with configurable retries
- ✅ **Verbose logging**: Comprehensive debug output
- ✅ **Cross-platform**: Works on Windows, macOS, Linux, Raspberry Pi
- ✅ **Multiple clients**: Supports simultaneous WebSocket connections
- ✅ **Binary compilation**: Can be compiled to standalone executables

## Installation

### Python Installation

```bash
# Install Python 3.8+
# Then install dependencies:
pip install -r requirements.txt
```

### Platform-Specific Notes

**macOS/Linux:**
```bash
# Bluetooth support may require additional system packages
# macOS: Should work out of the box
# Linux: sudo apt-get install libbluetooth-dev python3-dev
```

**Windows:**
```bash
# Bluetooth support requires Windows Bluetooth stack
# USB/Serial should work out of the box
```

**Raspberry Pi:**
```bash
# Install all dependencies
sudo apt-get install python3-pip libbluetooth-dev python3-dev
pip3 install -r requirements.txt
```

## Usage

### Basic Usage

```bash
# Auto-detect EV3 via Serial
python ev3_bridge.py

# Verbose logging
python ev3_bridge.py --verbose

# Custom WebSocket port
python ev3_bridge.py --ws-port 9000
```

### Connection Methods

**Serial (USB):**
```bash
# Auto-detect
python ev3_bridge.py --type serial

# Specific port
python ev3_bridge.py --type serial --port /dev/ttyACM0          # Linux/macOS
python ev3_bridge.py --type serial --port COM3                   # Windows
```

**Bluetooth:**
```bash
# Auto-detect
python ev3_bridge.py --type bluetooth

# Specific address
python ev3_bridge.py --type bluetooth --bt-address 00:16:53:XX:XX:XX
```

**HTTP:**
```bash
python ev3_bridge.py --type http --http-host 192.168.178.50
```

### Discovery Commands

```bash
# List serial ports
python ev3_bridge.py --list-ports

# Discover Bluetooth devices
python ev3_bridge.py --discover-bt
```

## SSL/TLS Support

### Enable SSL (Secure WebSocket - wss://)
```bash
# Auto-generate self-signed certificate
python ev3_bridge_secure.py --ssl

# Use existing certificate
python ev3_bridge_secure.py --ssl --cert /path/to/cert.crt --key /path/to/key.key

# Custom hostname for certificate
python ev3_bridge_secure.py --ssl --hostname myserver.local
```

### Trust Self-Signed Certificate

**macOS:**
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./certs/server.crt
```

**Windows:**
1. Double-click `certs/server.crt`
2. Click "Install Certificate"
3. Select "Local Machine"
4. Place in "Trusted Root Certification Authorities"

**Linux:**
```bash
sudo cp ./certs/server.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### CORS Configuration
```bash
# Allow all origins (default)
python ev3_bridge_secure.py --cors-origins '*'

# Specific origins
python ev3_bridge_secure.py --cors-origins 'https://turbowarp.org' 'https://studio.penguinmod.com'

# Wildcard subdomain
python ev3_bridge_secure.py --cors-origins '*.example.com'
```

### Authentication
```bash
# Enable authentication with auto-generated token
python ev3_bridge_secure.py --auth

# Provide custom token
python ev3_bridge_secure.py --auth --auth-token your-secret-token-here
```

Connect from browser:
```javascript
const ws = new WebSocket('wss://localhost:8080?token=your-secret-token-here');
```

### HTTP Health Check
```bash
# Enable HTTP health endpoint on separate port
python ev3_bridge_secure.py --health-port 8081
```

Check status:
```bash
curl http://localhost:8081/health
curl http://localhost:8081/status
```

### Startup Example
```bash
# Example bridge startup setup
python ev3_bridge_secure.py \
  --ssl \
  --hostname ev3-bridge.local \
  --cors-origins 'https://turbowarp.org' \
  --auth \
  --health-port 8081 \
  --verbose
```

## Compiling to Binary

Use PyInstaller to create standalone executables:

```bash
# Install PyInstaller
pip install pyinstaller

# Compile for your platform
pyinstaller --onefile --name ev3-bridge ev3_bridge.py

# Binary will be in dist/
# Windows: dist/ev3-bridge.exe
# macOS/Linux: dist/ev3-bridge
```

### Platform-Specific Compilation

**Windows:**
```bash
pyinstaller --onefile --name ev3-bridge --icon=icon.ico ev3_bridge.py
```

**macOS:**
```bash
pyinstaller --onefile --name ev3-bridge --windowed ev3_bridge.py
```

**Linux/Raspberry Pi:**
```bash
pyinstaller --onefile --name ev3-bridge ev3_bridge.py
```

## Configuration

All options can be configured via command line:

```
--type {serial,bluetooth,http}  Connection type
--port PORT                     Serial port
--baud BAUD                     Serial baud rate (default: 115200)
--bt-address ADDRESS            Bluetooth MAC address
--bt-channel CHANNEL            Bluetooth channel (default: 1)
--http-host HOST                HTTP host (default: 192.168.178.50)
--http-port PORT                HTTP port (default: 8080)
--ws-host HOST                  WebSocket host (default: 0.0.0.0)
--ws-port PORT                  WebSocket port (default: 8080)
--reconnect-attempts N          Reconnection attempts (default: 5)
--reconnect-delay SECONDS       Reconnection delay (default: 2.0)
--verbose, -v                   Enable verbose logging
```

## Troubleshooting

**Serial connection issues:**
- Check USB cable
- Try different ports: `python ev3_bridge.py --list-ports`
- Check permissions on Linux: `sudo usermod -a -G dialout $USER`

**Bluetooth issues:**
- Ensure EV3 Bluetooth is enabled
- Pair EV3 with computer first (PIN: 1234)
- Try discovery: `python ev3_bridge.py --discover-bt`

**HTTP issues:**
- Ensure EV3 is on same network
- Check IP address in EV3 settings
- Test with browser: http://192.168.178.50:8080

**Connection fallback:**
The bridge automatically tries alternative methods if the primary fails:
1. Serial (if available)
2. Bluetooth (if available)
3. HTTP (if available)

## License

MIT License - Free for personal and commercial use.
