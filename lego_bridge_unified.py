#!/usr/bin/env python3
"""
LEGO Unified WebSocket Bridge v3.2 (Connection Persistence)
Fixes: "Success" followed by failure. Keeps ports open once found.
"""

import asyncio
import websockets
import serial
import serial.tools.list_ports
import base64
import time
from datetime import datetime
from typing import Any

# BLE support check
try:
    from bleak import BleakClient, BleakScanner
    BLEAK_AVAILABLE = True
except ImportError:
    BLEAK_AVAILABLE = False

# ============================================================================
# CONFIGURATION
# ============================================================================

CONFIG = {
    'nxt':   {'port': 8080, 'baudrate': 115200, 'timeout': 0.1},
    'spike': {'port': 8081, 'baudrate': 115200},
    'boost': {'port': 8082, 'ble_uuid': '00001624-1212-efde-1623-785feabcd123'},
    'ev3':   {'port': 8083, 'baudrate': 115200, 'timeout': 0.1}
}

DEBUG = True

# ============================================================================
# PROTOCOL DECODING (For Logs)
# ============================================================================

NXT_OPCODES = {
    0x00: 'DIRECT_CMD', 0x03: 'PLAY_TONE', 0x04: 'SET_OUT_STATE', 
    0x06: 'GET_OUT_STATE', 0x07: 'GET_IN_VALS', 0x0D: 'KEEP_ALIVE'
}
EV3_OPCODES = {
    0x00: 'DIRECT_REPLY', 0x80: 'DIRECT_NO_REPLY', 0xA4: 'OUTPUT_POWER', 
    0xA5: 'OUTPUT_SPEED', 0xA6: 'OUTPUT_START', 0xA3: 'OUTPUT_STOP', 
    0x99: 'INPUT_DEVICES', 0x0C: 'KEEP_ALIVE'
}

def log(hub, direct, data):
    if not DEBUG: return
    t = datetime.now().strftime("%H:%M:%S")
    arr = "➡️" if direct == "TO_HUB" else "⬅️"
    
    # Simple color coding
    colors = {'nxt':'\033[94m', 'ev3':'\033[96m', 'spike':'\033[93m', 'boost':'\033[95m'}
    c = colors.get(hub, '')
    
    details = ""
    if isinstance(data, bytes):
        raw = data.hex().upper()
        if hub == 'ev3' and len(data) > 5:
            op = data[5] if data[4] in [0x00, 0x80] else 0x00
            if op in EV3_OPCODES: details = f" [{EV3_OPCODES[op]}]"
        elif hub == 'nxt' and len(data) > 3:
            if data[3] in NXT_OPCODES: details = f" [{NXT_OPCODES[data[3]]}]"
        msg = f"{raw}{details}"
    else:
        msg = str(data).strip()
        
    print(f"{c}[{t}] [{hub.upper()}] {arr} {msg}\033[0m")

# ============================================================================
# CONNECTION CLASSES
# ============================================================================

class SerialPacketConnection:
    """NXT and EV3 Connection"""
    def __init__(self, port, hub_type):
        self.port = port
        self.hub_type = hub_type
        self.ser = None
        self.connected = False

    def connect(self):
        """Attempts to open the serial port."""
        try:
            self.ser = serial.Serial(
                self.port,
                baudrate=CONFIG[self.hub_type]['baudrate'],
                timeout=CONFIG[self.hub_type]['timeout'],
                write_timeout=1,
                dsrdtr=True  # Important for some Windows Bluetooth stacks
            )
            self.connected = True
            return True
        except Exception as e:
            # Don't print "Access Denied" errors during scanning, it spams
            if "Semaphore" in str(e): return False # Wrong Bluetooth Port
            return False

    def read(self):
        if not self.connected: return None
        try:
            if self.ser.in_waiting < 2: return None
            header = self.ser.read(2)
            length = header[0] | (header[1] << 8)
            if length == 0 or length > 1024: return None
            return header + self.ser.read(length)
        except: return None

    def write(self, data):
        if self.connected:
            try: self.ser.write(data)
            except: pass

class SpikeConnection:
    """SPIKE Prime Connection"""
    def __init__(self, port):
        self.port = port
        self.ser = None
        self.connected = False

    def connect(self):
        try:
            self.ser = serial.Serial(self.port, 115200, timeout=0.1)
            self.connected = True
            self.ser.write(b'\x03') # Ctrl+C to wake REPL
            return True
        except: return False

    def read(self):
        if not self.connected or self.ser.in_waiting == 0: return None
        try:
            return self.ser.readline().decode('utf-8', errors='ignore').strip()
        except: return None

    def write(self, data):
        if self.connected:
            try: self.ser.write(data.encode('utf-8'))
            except: pass

class BoostConnection:
    """Boost BLE Connection"""
    def __init__(self):
        self.client = None
        self.connected = False

    async def connect(self):
        if not BLEAK_AVAILABLE: return False
        print("   🔍 Scanning for BOOST...")
        try:
            dev = await BleakScanner.find_device_by_filter(
                lambda d, ad: d.name and ('Move Hub' in d.name or 'BOOST' in d.name.upper())
            )
            if dev:
                self.client = BleakClient(dev.address)
                await self.client.connect()
                self.connected = True
                print(f"   ✅ BOOST Connected: {dev.name}")
                return True
        except: pass
        return False

    async def subscribe(self, cb):
        if self.connected:
            await self.client.start_notify(CONFIG['boost']['ble_uuid'], cb)

    async def write(self, data):
        if self.connected:
            await self.client.write_gatt_char(CONFIG['boost']['ble_uuid'], data)

# ============================================================================
# SCANNER LOGIC
# ============================================================================

def find_connected_hub(hub_type):
    """Finds a port, CONNECTS to it, and returns the active connection object."""
    print(f"🔍 Hunting for {hub_type.upper()}...")
    
    ports = list(serial.tools.list_ports.comports())
    candidates = []
    
    keywords = {
        'ev3': ['ev3', 'mindstorms', 'standard', 'serial'],
        'nxt': ['nxt', 'standard', 'serial', 'bluetooth'],
        'spike': ['spike', 'lego', 'usbmodem', 'pyboard']
    }
    
    # Filter candidates
    for p in ports:
        if any(k in p.description.lower() for k in keywords[hub_type]):
            candidates.append(p.device)
            
    # Try connecting to each
    for port in candidates:
        print(f"   ➡️ Testing {port}...", end='', flush=True)
        
        # Create the connection object
        if hub_type == 'spike':
            conn = SpikeConnection(port)
        else:
            conn = SerialPacketConnection(port, hub_type)
            
        # Attempt actual connection
        if conn.connect():
            print(" ✅ CONNECTED!")
            return conn # Return the OPEN connection immediately
        else:
            print(" ❌ (Failed)")
            
    print(f"   ⚠️ No {hub_type.upper()} found.")
    return None

# ============================================================================
# WEBSOCKET HANDLERS
# ============================================================================

async def relay_packet(ws, hub, name):
    print(f"📱 [{name.upper()}] Client connected")
    async def loop():
        while True:
            data = await asyncio.to_thread(hub.read)
            if data:
                log(name, 'FROM_HUB', data)
                await ws.send(base64.b64encode(data).decode('utf-8'))
            await asyncio.sleep(0.005)
    t = asyncio.create_task(loop())
    try:
        async for msg in ws:
            raw = base64.b64decode(msg)
            log(name, 'TO_HUB', raw)
            await asyncio.to_thread(hub.write, raw)
    except: pass
    finally: t.cancel()

async def relay_text(ws, hub, name):
    print(f"📱 [{name.upper()}] Client connected")
    async def loop():
        while True:
            data = await asyncio.to_thread(hub.read)
            if data:
                log(name, 'FROM_HUB', data)
                await ws.send(data)
            await asyncio.sleep(0.01)
    t = asyncio.create_task(loop())
    try:
        async for msg in ws:
            log(name, 'TO_HUB', msg)
            hub.write(msg + '\r\n')
    except: pass
    finally: t.cancel()

async def relay_ble(ws, hub):
    print(f"📱 [BOOST] Client connected")
    def cb(s, d):
        log('boost', 'FROM_HUB', bytes(d))
        asyncio.create_task(ws.send(base64.b64encode(bytes(d)).decode()))
    await hub.subscribe(cb)
    try:
        async for msg in ws:
            raw = base64.b64decode(msg)
            log('boost', 'TO_HUB', raw)
            await hub.write(raw)
    except: pass

# ============================================================================
# MAIN
# ============================================================================

async def main():
    print("🚀 LEGO Unified Bridge v3.2 (Persistence Fix)")
    print("=============================================")
    
    servers = []
    
    # 1. Connect EV3
    ev3 = await asyncio.to_thread(find_connected_hub, 'ev3')
    if ev3:
        servers.append(websockets.serve(lambda ws: relay_packet(ws, ev3, 'ev3'), "0.0.0.0", 8083))
        
    # 2. Connect NXT
    # (Check to ensure we don't try to open the exact same port again)
    nxt_candidates = find_connected_hub # Just alias for readability
    if not ev3:
        # If no EV3, search freely for NXT
        nxt = await asyncio.to_thread(find_connected_hub, 'nxt')
        if nxt:
             servers.append(websockets.serve(lambda ws: relay_packet(ws, nxt, 'nxt'), "0.0.0.0", 8080))
    else:
        # If EV3 connected, we must manually hunt for NXT on *other* ports
        # But for v3.2, let's just run the scanner. If it hits the locked EV3 port, 
        # it will fail (because it's busy) and move to the next one, which is exactly what we want.
        nxt = await asyncio.to_thread(find_connected_hub, 'nxt')
        if nxt:
            servers.append(websockets.serve(lambda ws: relay_packet(ws, nxt, 'nxt'), "0.0.0.0", 8080))

    # 3. Connect SPIKE
    spike = await asyncio.to_thread(find_connected_hub, 'spike')
    if spike:
        servers.append(websockets.serve(lambda ws: relay_text(ws, spike, 'spike'), "0.0.0.0", 8081))
        
    # 4. Connect BOOST
    if BLEAK_AVAILABLE:
        boost = BoostConnection()
        if await boost.connect():
            servers.append(websockets.serve(lambda ws: relay_ble(ws, boost), "0.0.0.0", 8082))
            
    if not servers:
        print("\n❌ No active connections.")
        return

    print("\n✅ Bridge Active! (Press Ctrl+C to stop)")
    await asyncio.gather(*servers)
    await asyncio.Future() # Keep alive

if __name__ == "__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: pass