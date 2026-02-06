# LEGO Bridges

## 📊 Comprehensive Features & Support Matrix

| Feature | nxt-pybluez-bridge.py | ev3_local_bridge.py | lego_bridge.py | nxt_bridge.py | universal_bridge.py | legospike_bridge.js |
|---------|----------------------|---------------------|----------------|---------------|---------------------|---------------------|
| **Type** | NXT Bluetooth Bridge | EV3 Multi-Protocol | Unified Multi-Hub | Unified Multi-Hub | Scratch Link Surrogate | Browser Extension |
| **Architecture** | Bridge | Bridge | Bridge | Bridge | Bridge | Client/Translator |

### 🔌 Connection Methods (TO Device)

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **USB/Serial** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Bluetooth Classic** | ✅ (PyBluez) | ✅ (PyBluez) | ❌ | ❌ | ✅ (PyBluez) | ❌ |
| **BLE** | ❌ | ❌ | ✅ (Bleak) | ✅ (Bleak) | ✅ (Bleak) | ❌ |
| **HTTP/Network** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **WebSocket Client** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 🔌 Connection Methods (FROM Bridge)

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **WebSocket Server** | ✅ (ws://) | ✅ (ws://) | ✅ (ws://) | ✅ (ws://) | ✅ (wss://) | ❌ |
| **SSL/TLS (wss://)** | ❌ | ✅ (optional) | ❌ | ❌ | ✅ (default) | ❌ |
| **Self-Signed Certs** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **HTTP Health Endpoint** | ❌ | ✅ (aiohttp) | ❌ | ❌ | ❌ | ❌ |
| **Scratch Extension** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 🤖 LEGO Device Support

| Device | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|--------|-------------|-----------|-------------|------------|-----------|--------------|
| **NXT** | ✅ | ❌ | ✅ (serial) | ✅ (serial) | ✅ (BT) | ❌ |
| **EV3** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SPIKE Prime** | ❌ | ❌ | ✅ (serial) | ✅ (serial) | ❌ | ✅ |
| **WeDo 2.0** | ❌ | ❌ | ❌ | ❌ | ✅ (BLE) | ❌ |
| **Boost** | ❌ | ❌ | ✅ (BLE) | ✅ (BLE) | ✅ (BLE) | ❌ |
| **Powered Up** | ❌ | ❌ | ❌ | ❌ | ✅ (BLE) | ❌ |

### 💻 Platform Support

| Platform | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|----------|-------------|-----------|-------------|------------|-----------|--------------|
| **Windows** | ⚠️ Limited | ✅ | ✅ | ✅ | ✅ | ✅ (Browser) |
| **macOS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Browser) |
| **Linux** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Browser) |
| **Raspberry Pi** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Browser) |

### 📦 Python Dependencies

| Dependency | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|------------|-------------|-----------|-------------|------------|-----------|--------------|
| **websockets** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (N/A) |
| **pyserial** | ❌ | ✅ (optional) | ✅ | ✅ | ❌ | ❌ |
| **PyBluez** | ✅ (required) | ✅ (optional) | ❌ | ❌ | ✅ (optional) | ❌ |
| **bleak** | ❌ | ❌ | ✅ (optional) | ✅ (optional) | ✅ (required) | ❌ |
| **cryptography** | ❌ | ✅ (optional) | ❌ | ❌ | ✅ (required) | ❌ |
| **aiohttp** | ❌ | ✅ (optional) | ❌ | ❌ | ❌ | ❌ |
| **requests** | ❌ | ✅ (optional) | ❌ | ❌ | ❌ | ❌ |

### 🔒 Security Features

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **SSL/TLS** | ❌ | ✅ | ❌ | ❌ | ✅ | N/A |
| **Certificate Generation** | ❌ | ✅ | ❌ | ❌ | ✅ | N/A |
| **CORS Support** | ❌ | ✅ | ❌ | ❌ | ❌ | N/A |
| **Origin Validation** | ❌ | ✅ | ❌ | ❌ | ❌ | N/A |
| **Authentication** | ❌ | ✅ (optional) | ❌ | ❌ | ❌ | N/A |
| **Auth Tokens** | ❌ | ✅ | ❌ | ❌ | ❌ | N/A |

### 🌐 Network Configuration

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **Port(s)** | 8080 | 8080 (configurable) | 8080/8081/8082 | 8080/8081/8082 | 20110 | Client connects |
| **Host Binding** | 0.0.0.0 | 0.0.0.0 | 0.0.0.0 | 0.0.0.0 | 0.0.0.0 | N/A |
| **Multi-Port** | ❌ Single | ❌ Single | ✅ (3 ports) | ✅ (3 ports) | ❌ Single | N/A |
| **Custom Port** | ❌ | ✅ (CLI arg) | ❌ | ❌ | ✅ (CLI arg) | ✅ (config) |

### 📡 Protocol Support

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **NXT Binary Protocol** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **EV3 Binary Protocol** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SPIKE Python/JSON** | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Boost LWP Protocol** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Scratch Link JSON-RPC** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Base64 Encoding** | ✅ | ✅ | ✅ (NXT/Boost) | ✅ (NXT/Boost) | ✅ | ✅ |
| **Raw Binary** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **JSON Messages** | ❌ | ✅ | ✅ (SPIKE) | ✅ (SPIKE) | ✅ | ✅ |

### 🎯 Advanced Features

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **Multi-Hub Support** | ❌ | ❌ | ✅ (NXT+SPIKE+Boost) | ✅ (NXT+SPIKE+Boost) | ⚠️ Sequential | ❌ |
| **Auto-Reconnect** | ❌ | ✅ | ✅ (SPIKE) | ✅ (SPIKE) | ❌ | ✅ |
| **Auto-Discovery** | ✅ (BT scan) | ✅ (CLI options) | ✅ (serial ports) | ✅ (serial ports) | ✅ (BLE scan) | ❌ |
| **Keepalive** | ❌ | ❌ | ❌ | ❌ | ✅ (NXT only) | ❌ |
| **Connection Retry** | ❌ | ✅ (configurable) | ❌ | ❌ | ❌ | ✅ |
| **Bidirectional** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 📊 Debugging & Monitoring

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **Debug Mode** | ✅ | ✅ (verbose) | ✅ | ✅ | ✅ | ✅ (console) |
| **Packet Logging** | ✅ (hex dump) | ✅ | ✅ (hex dump) | ✅ | ✅ | ✅ |
| **Protocol Parsing** | ✅ (opcodes) | ⚠️ Partial | ✅ (all protocols) | ✅ (all protocols) | ⚠️ Basic | ✅ (SPIKE) |
| **Statistics** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Timestamp Logging** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Color-Coded Logs** | ✅ | ✅ | ✅ | ✅ | ⚠️ Basic | N/A |
| **Error Tracking** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### ⚙️ Configuration

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **CLI Arguments** | ❌ | ✅ (extensive) | ❌ | ❌ | ✅ (basic) | N/A |
| **Environment Variables** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Config File** | ❌ | ❌ | ✅ (dict) | ✅ (dict) | ✅ (constants) | ✅ (object) |
| **Runtime Config** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 🔧 Special Capabilities

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **Binary Compilation** | ❌ | ✅ (PyInstaller) | ❌ | ❌ | ❌ | N/A |
| **HTTP Health Check** | ❌ | ✅ | ❌ | ❌ | ❌ | N/A |
| **Device Discovery UI** | ❌ | ✅ (CLI) | ❌ | ❌ | ❌ | N/A |
| **Port Listing** | ❌ | ✅ | ❌ | ❌ | ❌ | N/A |
| **Python REPL Access** | ❌ | ❌ | ✅ (SPIKE) | ✅ (SPIKE) | ❌ | ✅ (SPIKE) |
| **Sensor Monitoring** | ❌ | ❌ | ✅ (all hubs) | ✅ (all hubs) | ⚠️ Basic | ✅ (SPIKE) |
| **Motor Control** | ⚠️ via protocol | ⚠️ via protocol | ✅ (direct) | ✅ (direct) | ⚠️ via protocol | ✅ (blocks) |
| **Display Control** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (SPIKE) |
| **IMU/Gyro Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (SPIKE) |
| **Battery Monitoring** | ✅ | ❌ | ✅ (SPIKE) | ✅ (SPIKE) | ❌ | ✅ (SPIKE) |

### 📝 Code Quality

| Feature | nxt-pybluez | ev3_local | lego_bridge | nxt_bridge | universal | legospike.js |
|---------|-------------|-----------|-------------|------------|-----------|--------------|
| **Lines of Code** | ~350 | ~790 | ~1000 | ~670 | ~775 | ~1035 |
| **Async/Await** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Error Handling** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Documentation** | ✅ (good) | ✅ (excellent) | ✅ (excellent) | ✅ (good) | ✅ (good) | ✅ (good) |
| **Type Hints** | ⚠️ Partial | ✅ | ✅ | ✅ | ✅ | N/A (JS) |
| **Class-Based** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 🎯 Best Use Cases

| Bridge | Best For |
|--------|----------|
| **nxt-pybluez-bridge.py** | Simple NXT Bluetooth connectivity on macOS/Linux |
| **ev3_local_bridge.py** | Production EV3 deployments with security requirements |
| **lego_bridge.py** | Development/testing with multiple hub types simultaneously |
| **nxt_bridge.py** | Multi-hub projects (NXT + SPIKE + Boost) |
| **universal_bridge.py** | Scratch 3.0 compatibility, WeDo 2.0, or Powered Up support |
| **legospike_bridge.js** | TurboWarp/Scratch extensions for SPIKE Prime |

### ⚠️ Limitations

| Bridge | Key Limitations |
|--------|----------------|
| **nxt-pybluez-bridge.py** | NXT only, no SSL, PyBluez Windows issues |
| **ev3_local_bridge.py** | EV3 only, complex setup, many dependencies |
| **lego_bridge.py** | No EV3, no Powered Up, serial connection only |
| **nxt_bridge.py** | No EV3, no Powered Up, similar to lego_bridge |
| **universal_bridge.py** | Requires hosts file modification, complex SSL setup |
| **legospike_bridge.js** | SPIKE only, requires separate bridge server, browser-only |
