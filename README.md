# turbowarp-lego

Python bridges, protocol notes, and setup guides for the TurboWarp/Scratch
extensions that talk to older LEGO bricks (NXT, EV3, Boost, Spike Prime, WeDo
2.0, Powered UP) over Bluetooth Classic, BLE, ScratchLink, Web Serial, or a
local Python WebSocket bridge — whichever the platform/firmware actually
allows.

The extension `.js` files themselves live in
[`CrispStrobe/extensions/extensions/CrispStrobe/`](https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe).
They used to be mirrored here too, but were collapsed on 2026-05-02 to stop
drift. The last working-tree of the four transpilers is on the
[`wip-pre-collapse`](https://github.com/CrispStrobe/turbowarp-lego/tree/wip-pre-collapse)
branch — those carry the Phase 2 + Phase 4 audit fixes documented in
`LEARNINGS.md`, **untested on hardware**, and need to be ported to the
gallery once a brick is available for validation.

Most of those extensions need **Sandbox Mode disabled** in TurboWarp.

## Related repos

| Repo | What it does |
|------|-------------|
| [`CrispStrobe/extensions`](https://github.com/CrispStrobe/extensions) | Curated extension gallery (this is where the maintained .js files live) |
| [`CrispStrobe/scratch-gui`](https://github.com/CrispStrobe/scratch-gui) | TurboWarp editor fork that loads the gallery above |
| [`CrispStrobe/turbowarp-desktop`](https://github.com/CrispStrobe/turbowarp-desktop) | Electron build of the editor |
| [`CrispStrobe/turbowarp-android`](https://github.com/CrispStrobe/turbowarp-android) | Android wrapper with native Bluetooth bridges |
| [`CrispStrobe/turbowarp-ios`](https://github.com/CrispStrobe/turbowarp-ios) | iOS wrapper with native Bluetooth bridges |
| [`CrispStrobe/legacy-lego-compiler`](https://github.com/CrispStrobe/legacy-lego-compiler) | Hosted REST API that compiles NXC → `.rxe` and lmsasm → EV3 bytecode (used by the transpile extensions) |
| [`CrispStrobe/scratch-lego-bluetooth-extensions`](https://github.com/CrispStrobe/scratch-lego-bluetooth-extensions) | Older Xcratch-style `.mjs` build of the LEGO extensions |

## What's in here

| Category | File | Notes |
|----------|------|-------|
| **EV3 (ev3dev firmware)** | [`ev3dev_ondevice.py`](./ev3dev_ondevice.py) | HTTP/HTTPS JSON bridge that runs on the EV3. Actively-maintained version is `ev3_bridge.py` in the gallery; the local copy here has diverged. |
| | [`ev3_local_bridge.py`](./ev3_local_bridge.py) | Local-host HTTP bridge variant — see [README_ev3_local_bridge.md](./README_ev3_local_bridge.md) |
| **EV3 (original firmware)** | [`ev3-compiler-service/`](./ev3-compiler-service/) | Flask app + bundled `lmsasm-binary` used by the gallery's `ev3_lms_transpile.js` for server-side EV3-G compilation |
| **NXT** | [`nxt_bridge.py`](./nxt_bridge.py) | WebSocket bridge for direct NXT control over RFCOMM (see [NXT setup](#nxt-setup-and-troubleshooting) below) |
| | [`nxt-pybluez-bridge.py`](./nxt-pybluez-bridge.py) | Experimental PyBluez-based alternative bridge |
| | [`nxt-diag.py`](./nxt-diag.py), [`test_bt.py`](./test_bt.py), [`reset_nxt.sh`](./reset_nxt.sh) | Diagnostic / pairing helpers |
| **Generic Python bridges** | [`lego_bridge.py`](./lego_bridge.py), [`lego_bridge_unified.py`](./lego_bridge_unified.py), [`universal_bridge.py`](./universal_bridge.py), [`universal_lego_bridge.py`](./universal_lego_bridge.py) | Older / experimental WebSocket bridges. See [README_bridges.md](./README_bridges.md) |

The gallery extensions that pair with these bridges are listed at
<https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe>
(`ev3*.js`, `legonxt*.js`, `legospike*.js`, `legoboost_universal.js`,
`lego_poweredup.js`, `lego_wedo2_universal.js`, plus the math/utility
extensions `arrays.js`, `csp.js`, `gamepad.js`, `planetemaths.js`).

## Connection options at a glance

| Hub | BTC (ScratchLink) | BLE (Web BT / native) | Custom WebSocket bridge | Notes |
|------|:-----------------:|:---------------------:|:------------------------:|------|
| EV3 (orig FW) | yes | — | yes | also direct HTTP via `ev3_universal.js` |
| EV3 (ev3dev) | — | — | yes (HTTP/HTTPS JSON) | `ev3dev_ondevice.py` runs on the brick |
| NXT | yes | — | yes (`nxt_bridge.py`) | RFCOMM, drops on macOS — see below |
| Spike Prime / Robot Inventor (FW 2.x) | yes | — | yes | BTC |
| Spike Prime (FW 3.x) | — | yes | — | BLE |
| Boost | — | yes | — | BLE |
| Powered UP / Technic Hub | — | yes | — | BLE |
| WeDo 2.0 | — | yes | — | BLE |

**Platform caveats:**

- **macOS / Windows:** Web Bluetooth and Web Serial work in Chrome/Edge. ScratchLink-mode extensions need [LEGO ScratchLink](https://scratch.mit.edu/scratchlink/) installed.
- **iOS:** Web BT / Web Serial don't exist on iOS. The only path is a Scratch-Link-emulating native shell — try [Scrub](https://github.com/bricklife/Scrub), or use [`turbowarp-ios`](https://github.com/CrispStrobe/turbowarp-ios) which has native BLE/BTC bridges built in.
- **Sandbox mode:** must be disabled for any of the hardware extensions.

---

## EV3 details

### Original LEGO firmware

`ev3_lms_transpile.js` lets you either **stream** direct commands (works while
the editor stays connected) or **transpile** the project to lmsasm and compile
it to EV3 bytecode you can copy onto the brick. Compilation goes through the
hosted REST API at <https://lego-compiler.vercel.app/> — source in
[CrispStrobe/legacy-lego-compiler](https://github.com/CrispStrobe/legacy-lego-compiler).
Internet connectivity is required for compile. **Use with caution.**

`ev3_direct.js` is streaming-only.

`ev3_universal.js` bundles ScratchLink, Web Serial, WebSocket, and direct-HTTP
backends in one extension and lets you pick at runtime.

### ev3dev firmware

[ev3dev](https://www.ev3dev.org/) replaces the LEGO firmware with a Debian
Linux. With it on the brick, `ev3dev_py_transpile.js` lets you either:

- **stream:** Scratch blocks fire as JSON commands at the on-device bridge, e.g.
  `{"cmd":"beep","freq":1000,"dur":500}`; or
- **transpile:** the whole project compiles to a single Python script which the
  bridge runs on the brick.

The bridge script lives in this repo as
[`ev3dev_ondevice.py`](./ev3dev_ondevice.py). The actively-maintained copy
(with on-screen IP/port readout, IP refresh, etc.) is in
[CrispStrobe/extensions](https://github.com/CrispStrobe/extensions/blob/main/extensions/CrispStrobe/ev3_bridge.py).

```bash
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/
ssh robot@ev3dev.local 'python3 ~/ev3dev_ondevice.py'
# then talk to it from your laptop:
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"beep","freq":1000,"dur":500}'
```

See [README_ev3dev_bridge.md](./README_ev3dev_bridge.md) for the full command
reference.

---

## NXT setup and troubleshooting

The NXT brick speaks an old SPP-over-Bluetooth profile that browsers can't
reach directly. There are two viable paths:

1. **Pair via OS, then run `nxt_bridge.py`** (a local WebSocket bridge) →
   editor connects to `ws://localhost:8080`. **Recommended.**
2. **Web Serial on TurboWarp Desktop** with `legonxt_transpile_universal.js` →
   connect to `/dev/cu.NXT` (macOS) or the COM port (Windows). Experimental.

### Requirements

- LEGO MINDSTORMS NXT (1.0 or 2.0)
- macOS / Windows / Linux with Bluetooth
- Python 3.8+ for the bridge: `pip install websockets pyserial`
- Chrome/Edge 89+ for the Web Serial path

### macOS pairing

The macOS RFCOMM channel drops frequently. Workflow that works reliably:

```bash
blueutil --disconnect 00-16-53-XX-XX-XX
blueutil --unpair    00-16-53-XX-XX-XX
# turn the NXT off and back on
blueutil --pair      00-16-53-XX-XX-XX     # PIN: 1234
python3 nxt-diag.py                         # should beep + print battery
```

If commands stop working after inactivity, run [`./reset_nxt.sh`](./reset_nxt.sh)
to re-pair. The port to use in the direct extension is `/dev/cu.NXT` — **not**
`/dev/cu.Bluetooth-Incoming-Port`.

### Windows pairing

Settings → Bluetooth & devices → Devices → set discovery to **Advanced**, then
pair with PIN `1234`. Or in a terminal:

```cmd
btpair -u
```

Note the COM port and use it in the extension.

### Linux pairing

The NXT shows up as `/dev/rfcomm0` after pairing.

### NXT troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No beep, no battery from `nxt-diag.py` | RFCOMM channel never came up | unpair + repair (steps above) |
| Commands sent, nothing happens | RFCOMM channel dropped after idle | run `./reset_nxt.sh`; wait ~10 s after pairing |
| Display patterns work but text/lines don't | Forgot the **update display** block | NXT display is double-buffered — call update after batched draws |
| `ModuleNotFoundError: No module named 'serial'` | missing dependency | `pip install pyserial` |
| "Port not found" | wrong port name | macOS `/dev/cu.NXT`; Windows: check Device Manager; Linux: `/dev/rfcomm0` |

### NXT performance notes

The display is slow — each full `updateDisplay()` is **1–3 s**. Batch all draws
then update once:

```text
clearScreen()
drawText('Line 1', 0, 0)
drawText('Line 2', 0, 10)
drawRect(0, 0, 100, 64, false)
updateDisplay()      # one 1–3 s call
```

### NXT protocol notes

Telegram structure: `[u16 length LE] [cmd type] [opcode] [payload...]`

| Byte | Meaning |
|------|---------|
| `0x00` | direct command (with reply) |
| `0x80` | direct command (no reply) |
| `0x01` | system command (with reply) |
| `0x02` | reply telegram |

Frequently-used opcodes: `0x03` PLAY_TONE · `0x04` SET_OUT_STATE · `0x05`
SET_IN_MODE · `0x07` GET_IN_VALS · `0x0B` GET_BATT_LVL · `0x0F`/`0x10`
LS_WRITE/LS_READ (I²C) · `0x94`/`0x95` READ_IO_MAP/WRITE_IO_MAP (display).

Display memory: 100×64 mono, module ID `0xA0001`, offset 119, 800 bytes (8
vertical pixels per byte, LSB top).

---

## License

Per-extension licenses live at the top of each `.js`. Most files are GPL-3.0;
some are MPL-2.0. The Python bridges are GPL-3.0.
