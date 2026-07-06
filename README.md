# brickwright-bridges

Python bridges, protocol notes, and setup guides for the TurboWarp/Scratch
extensions that talk to LEGO bricks (NXT, EV3, Boost, Spike Prime, WeDo 2.0,
Powered UP) over Bluetooth Classic, BLE, ScratchLink, Web Serial, or a local
Python WebSocket bridge — whichever the platform/firmware actually allows.

The extension `.js` files themselves live in
[`CrispStrobe/extensions`](https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe).
They used to be mirrored here but were collapsed on **2026-05-02** to stop
drift; this repo now holds the **on-device Python bridges** and **protocol
docs** only. The four transpilers' Phase 2 + Phase 4 audit fixes live on
the [`wip-pre-collapse`](https://github.com/CrispStrobe/brickwright-bridges/tree/wip-pre-collapse)
branch — **hardware-validated for ev3dev** as of 2026-05-05 (44/44
smoke-test cases pass on a real brick); Spike/NXT/LMS hardware checks
deferred. See [`LEARNINGS.md`](./LEARNINGS.md) for the full picture.

> **Heads up:** Most of these extensions need **Sandbox Mode disabled** in
> TurboWarp. Click the menu next to a loaded extension and toggle off
> "Run in sandbox" before connecting to hardware.

---

## I just want it to work — what do I do?

Pick your brick + platform, then jump straight to the matching guide.

| Your brick | Your editor / platform | What you need | Guide |
|---|---|---|---|
| **EV3 with ev3dev firmware** | Any browser on any OS | Bridge running on the brick | [§ EV3dev quick start](#ev3dev-quick-start-the-90-second-version) ↓ |
| **EV3 with original firmware** | macOS/Win Chrome/Edge | LEGO ScratchLink (BTC) | [§ EV3 (LEGO firmware)](#ev3-original-firmware) ↓ |
| **EV3 with original firmware** | iOS / Android | Native shell (brickwright-ios, Scrub) | [`brickwright-ios`](https://github.com/CrispStrobe/brickwright-ios) / [Scrub](https://github.com/bricklife/Scrub) |
| **NXT** | macOS/Win + browser | Pair via OS, run `nxt_bridge.py` | [§ NXT setup](#nxt-setup) ↓ |
| **NXT** | TurboWarp Desktop on Mac/Win | Web Serial via `legonxt_transpile_universal.js` | [§ NXT setup](#nxt-setup) ↓ |
| **Spike Prime FW 2.x** | macOS/Win Chrome | LEGO ScratchLink (BTC) | [`extensions` gallery](https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe) — `legospike*.js` |
| **Spike Prime FW 3.x** | macOS/Win Chrome | Web Bluetooth (no bridge) | gallery — `legospike*.js` |
| **Boost / Powered UP / Technic Hub** | macOS/Win Chrome | Web Bluetooth (no bridge) | gallery — `legoboost_universal.js`, `lego_poweredup.js` |
| **WeDo 2.0** | macOS/Win Chrome | Web Bluetooth (no bridge) | gallery — `lego_wedo2_universal.js` |
| **Spike Prime / EV3 / NXT on iOS/iPad** | brickwright-ios or Scrub | Native shell + (for HTTPS) cert install | [`brickwright-ios`](https://github.com/CrispStrobe/brickwright-ios) — see [iOS notes](#ios--ipad-notes) ↓ |

The TurboWarp editor is at [`scratch-gui-three.vercel.app/editor.html`](https://scratch-gui-three.vercel.app/editor.html)
(fork of TurboWarp that loads `CrispStrobe/extensions`). On macOS/Windows
desktops you can use [TurboWarp Desktop](https://github.com/CrispStrobe/brickwright-desktop)
instead.

---

## EV3dev quick start (the 90-second version)

You have an EV3 brick flashed with [ev3dev](https://www.ev3dev.org/), it's
on Wi-Fi, and it has an IP like `192.168.178.57`.

```bash
# 1. From your laptop: copy the bridge to the brick (default password: maker)
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/

# 2. SSH in and run it. UTF-8 in the env avoids a locale crash; -u keeps logs flushed.
ssh robot@ev3dev.local 'PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose'
```

That serves both **HTTP on `:8080`** and **HTTPS on `:8443`**. From any device
on the same Wi-Fi:

```bash
# Sanity check (HTTP — works in every browser without any cert dance)
curl http://<brick-ip>:8080/status
```

Open `http://<brick-ip>:8080/test.html` in any browser to get the
interactive test panel.

**For Safari, iOS/iPad, or any HTTPS-only frontend** (e.g. the Vercel-hosted
editor) — the brick's TLS cert is self-signed, so you have to install it
once. The ten-line copy-paste recipe per platform lives in
[**`README_ev3dev_bridge.md`**](./README_ev3dev_bridge.md) — it has been
tested end-to-end on macOS Safari, Firefox, and iPadOS and will get you
from "cert error" to "green padlock" without surprises. It also documents
the **three latent bugs** in the bridge that need a `--verbose` start to
even surface, the **regenerate-cert-when-the-IP-changes** recipe, and the
"**why does it work in Firefox but not Safari**" answer.

If you're impatient: the bridge currently identifies as **`v2.3.1`** in
`/status`. If yours says `2.3.0`, you're running stock and will hit the
locale crash on a fresh start. Update from this repo and restart with
`PYTHONIOENCODING=utf-8`.

---

## Related repos

| Repo | What it does |
|------|-------------|
| [`CrispStrobe/extensions`](https://github.com/CrispStrobe/extensions) | Extension gallery — the `.js` files for the editor. **The maintained EV3/NXT/Spike code lives here.** |
| [`CrispStrobe/scratch-gui`](https://github.com/CrispStrobe/scratch-gui) | TurboWarp editor fork that loads the gallery above |
| [`CrispStrobe/brickwright-desktop`](https://github.com/CrispStrobe/brickwright-desktop) | Electron build of the editor for macOS / Windows / Linux |
| [`CrispStrobe/brickwright-android`](https://github.com/CrispStrobe/brickwright-android) | Android wrapper with native Bluetooth bridges |
| [`CrispStrobe/brickwright-ios`](https://github.com/CrispStrobe/brickwright-ios) | iOS / iPadOS wrapper with native Bluetooth bridges |
| [`CrispStrobe/legacy-lego-compiler`](https://github.com/CrispStrobe/legacy-lego-compiler) | Hosted REST API that compiles NXC → `.rxe` and lmsasm → EV3 bytecode (used by the transpile extensions) |
| [`CrispStrobe/scratch-lego-bluetooth-extensions`](https://github.com/CrispStrobe/scratch-lego-bluetooth-extensions) | Older Xcratch-style `.mjs` build of the LEGO extensions (feature-frozen) |

## What's in this repo

| Category | File | Notes |
|----------|------|-------|
| **EV3 (ev3dev firmware)** | [`ev3dev_ondevice.py`](./ev3dev_ondevice.py) | HTTP/HTTPS JSON bridge that runs **on the brick**. Currently v2.3.1; see [`README_ev3dev_bridge.md`](./README_ev3dev_bridge.md). |
| | [`ev3_local_bridge.py`](./ev3_local_bridge.py) | Local-host HTTP bridge variant — see [`README_ev3_local_bridge.md`](./README_ev3_local_bridge.md) |
| **EV3 (original firmware)** | [`ev3-compiler-service/`](./ev3-compiler-service/) | Flask app + bundled `lmsasm-binary` used by the gallery's `ev3_lms_transpile.js` for server-side EV3-G compilation |
| **NXT** | [`nxt_bridge.py`](./nxt_bridge.py) | Local WebSocket bridge for NXT control over RFCOMM (see [§ NXT setup](#nxt-setup) below) |
| | [`nxt-pybluez-bridge.py`](./nxt-pybluez-bridge.py) | Experimental PyBluez-based alternative bridge |
| | [`nxt-diag.py`](./nxt-diag.py), [`test_bt.py`](./test_bt.py), [`reset_nxt.sh`](./reset_nxt.sh) | Diagnostic / pairing helpers |
| **Generic Python bridges** | [`lego_bridge.py`](./lego_bridge.py), [`lego_bridge_unified.py`](./lego_bridge_unified.py), [`universal_bridge.py`](./universal_bridge.py), [`universal_lego_bridge.py`](./universal_lego_bridge.py) | Older / experimental WebSocket bridges. See [`README_bridges.md`](./README_bridges.md) |
| **Audit notes** | [`PLAN.md`](./PLAN.md), [`LEARNINGS.md`](./LEARNINGS.md) | Phase-by-phase audit log of the four transpilers + bridge bugs. Skim if you want to know **why** something is the way it is. |

---

## Connection options at a glance

| Hub | BTC (ScratchLink) | BLE (Web BT / native) | Custom WebSocket / HTTP bridge | Notes |
|------|:-----------------:|:---------------------:|:------------------------------:|------|
| EV3 (orig FW) | yes | — | yes | also direct HTTP via `ev3_universal.js` |
| EV3 (ev3dev) | — | — | yes (HTTP/HTTPS JSON) | `ev3dev_ondevice.py` runs on the brick |
| NXT | yes | — | yes (`nxt_bridge.py`) | RFCOMM, drops on macOS — see below |
| Spike Prime / Robot Inventor (FW 2.x) | yes | — | yes | BTC |
| Spike Prime (FW 3.x) | — | yes | — | BLE |
| Boost | — | yes | — | BLE |
| Powered UP / Technic Hub | — | yes | — | BLE |
| WeDo 2.0 | — | yes | — | BLE |

**Platform caveats:**

- **macOS / Windows desktop browsers:** Web Bluetooth and Web Serial work in Chrome/Edge. ScratchLink-mode extensions need [LEGO ScratchLink](https://scratch.mit.edu/scratchlink/) installed.
- **macOS Safari:** strict TLS — see [iOS notes](#ios--ipad-notes) for cert install (the procedure is the same for Mac Safari and iPad Safari).
- **macOS Firefox:** has its own trust store (independent of Keychain). Either import the cert into Firefox's certificate manager, or stay on HTTP via "Local Network Access" (Firefox now prompts for that).
- **iOS / iPadOS:** Web BT / Web Serial don't exist on iOS. The only path is a Scratch-Link-emulating native shell — try [Scrub](https://github.com/bricklife/Scrub), or use [`brickwright-ios`](https://github.com/CrispStrobe/brickwright-ios) which has native BLE/BTC bridges built in.
- **Sandbox mode:** must be disabled for any of the hardware extensions.

---

## EV3 details

### Original LEGO firmware

`ev3_lms_transpile.js` lets you either **stream** direct commands (works while
the editor stays connected) or **transpile** the project to lmsasm and compile
it to EV3 bytecode you can copy onto the brick. Compilation goes through the
hosted REST API at <https://lego-compiler.vercel.app/> — source in
[CrispStrobe/legacy-lego-compiler](https://github.com/CrispStrobe/legacy-lego-compiler).
Internet connectivity is required for compile. Use with caution if your
project has destructive blocks.

`ev3_direct.js` is streaming-only. `ev3_universal.js` bundles ScratchLink,
Web Serial, WebSocket, and direct-HTTP backends in one extension and lets
you pick at runtime.

### ev3dev firmware

[ev3dev](https://www.ev3dev.org/) replaces the LEGO firmware with a Debian
Linux. With it on the brick, `ev3dev_py_transpile.js` lets you either:

- **stream:** Scratch blocks fire as JSON commands at the on-device bridge, e.g.
  `{"cmd":"beep","freq":1000,"dur":500}`; or
- **transpile:** the whole project compiles to a single Python script that
  the bridge runs on the brick.

The bridge is [`ev3dev_ondevice.py`](./ev3dev_ondevice.py), running on the
brick under stock ev3dev (Python 3.5.3). **Full setup, cert install, and
troubleshooting** in [`README_ev3dev_bridge.md`](./README_ev3dev_bridge.md).

---

## NXT setup

The NXT brick speaks SPP-over-Bluetooth (an old profile that browsers can't
reach directly). Two viable paths:

1. **Pair via OS, then run `nxt_bridge.py`** (a local WebSocket bridge) →
   editor connects to `ws://localhost:8080`. **Recommended.**
2. **Web Serial on TurboWarp Desktop** with `legonxt_transpile_universal.js` →
   connect to `/dev/cu.NXT` (macOS) or the COM port (Windows). Experimental.

### Requirements

- LEGO MINDSTORMS NXT (1.0 or 2.0)
- macOS / Windows / Linux with Bluetooth
- Python 3.8+ for the bridge: `pip install websockets pyserial`
- Chrome/Edge 89+ for the Web Serial path

### macOS pairing (the one that actually works reliably)

The macOS RFCOMM channel drops frequently. Workflow:

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

## iOS / iPad notes

iOS Safari (mobile + iPad) and any WebKit-based shell (brickwright-ios, Scrub,
in-app webviews) all share **the same TLS trust store**. So one cert install
on the device makes all of them work simultaneously.

The full step-by-step is in [`README_ev3dev_bridge.md` § Certificate
installation](./README_ev3dev_bridge.md#ios--ipados). Three steps:

1. **Safari → `https://<brick-ip>:8443/profile`** → tap through warning →
   download the configuration profile.
2. **Settings → General → VPN & Device Management → "EV3 Robot
   (192.168.x.y)"** → Install (passcode).
3. **Settings → General → About → Certificate Trust Settings** → toggle the
   EV3 cert ON.

Step 3 is the one almost everyone misses. Without it the cert is installed
but iOS does **not** trust it for SSL.

### For App Store submitters: ATS settings

If you fork [`brickwright-ios`](https://github.com/CrispStrobe/brickwright-ios)
and intend to submit to the App Store, **don't** use
`NSAllowsArbitraryLoads = true` — Apple will scrutinize that and may reject.
Use the purpose-built local-network exception instead, in `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
<key>NSLocalNetworkUsageDescription</key>
<string>Connects to your LEGO brick on this Wi-Fi network.</string>
```

`NSAllowsLocalNetworking` was added in iOS 10 specifically for this case.
It permits TLS-or-HTTP connections to RFC 1918 private ranges
(`192.168.*.*`, `10.*`, `172.16-31.*`) and `.local` mDNS hosts without
disabling ATS for the rest of the internet. The
`NSLocalNetworkUsageDescription` purpose string is required by iOS 14+ for
local-network access — Apple shows it to the user on first connect.

For sideloaded debug builds (Xcode → Run on device) either setting works,
since App Review never sees the build.

---

## License

Per-extension licenses live at the top of each `.js` (in the gallery repo).
Most files are GPL-3.0; some are MPL-2.0. The Python bridges in this repo
are GPL-3.0.
