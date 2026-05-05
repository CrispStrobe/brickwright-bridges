# EV3dev Bridge Server — Setup & Cert Install Guide

The bridge that runs **on the EV3 brick** under
[ev3dev](https://www.ev3dev.org/) and exposes JSON HTTP/HTTPS endpoints
for motors, sensors, sound, screen, and Python script upload+run. It pairs
with `ev3dev_py_transpile.js` in the
[`CrispStrobe/extensions`](https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe)
gallery (and is exercised by `ev3_universal.js`'s direct-HTTP backend).

> Throughout this doc, replace `<brick-ip>` with your brick's actual LAN
> address (e.g. `192.168.178.57`). The brick's hostname is `ev3dev` and
> mDNS resolves it as `ev3dev.local` — the cert validates for both.

---

## Contents

1. [Quick start (90 seconds)](#quick-start-90-seconds)
2. [Versions and what's in v2.3.1](#versions)
3. [Three latent bugs every fresh install hits](#three-latent-bugs-every-fresh-install-hits)
4. [Server installation on the brick](#server-installation-on-the-brick)
5. [Certificate installation (macOS, Firefox, iOS / iPadOS)](#certificate-installation)
6. [Regenerate the cert when the brick's IP changes](#regenerate-the-cert-when-the-bricks-ip-changes)
7. [Auto-start on boot (systemd)](#auto-start-on-boot-systemd)
8. [Optional: VPS tunnel for public access](#optional-vps-tunnel-for-public-access)
9. [Troubleshooting](#troubleshooting)
10. [API reference](#api-reference)
11. [Security notes](#security-notes)

---

## Quick start (90 seconds)

```bash
# 1. Copy the bridge to the brick (default user/password: robot / maker)
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/

# 2. SSH in and run it. PYTHONIOENCODING avoids a locale-related crash on the
#    first startup that generates the SSL cert; -u keeps logs flushed live.
ssh robot@ev3dev.local \
    'PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose'
```

Both **HTTP on `:8080`** and **HTTPS on `:8443`** come up automatically (dual
mode is the default since v2.3.1). The first run takes ~30 s for OpenSSL
to mint a 2048-bit RSA cert — the EV3 CPU is slow.

```bash
# Sanity check from your laptop:
curl http://<brick-ip>:8080/status     # plaintext, works everywhere

# When you've installed the cert (see below):
curl https://<brick-ip>:8443/status    # TLS, works in Safari / iOS
```

Open `http://<brick-ip>:8080/test.html` for an interactive test panel
with buttons that exercise every endpoint.

---

## Versions

The bridge identifies itself in `/status`:

| Version | What's in it | When you should upgrade |
|---|---|---|
| **2.3.1** *(current)* | Python 3.5 compatible (no f-strings); locale-safe (no `→` arrows in log strings); `upload_script` writes UTF-8; cert regeneration triggered by deleting `ev3.{crt,key}`; clean `--http-only` / `--https-only` flags | Always — fixes three latent bugs that crash the bridge on a fresh start (see below) |
| 2.3.0 | f-strings throughout; `→` in log strings; ASCII-default upload | Stop. A clean restart on stock ev3dev (Python 3.5.3) crashes at parse time. Get 2.3.1 from this repo. |

To check what's running: `curl http://<brick-ip>:8080/status` → look at
`"version"`.

---

## Three latent bugs every fresh install hits

These were fixed in 2.3.1 but it's worth knowing what they were so you know
what symptoms to watch for if you're working from an older copy:

1. **f-strings throughout the bridge.** ev3dev ships **Python 3.5.3**.
   f-strings are 3.6+. Older copies of `ev3dev_ondevice.py` won't even
   parse on the brick. Symptom: `SyntaxError` on first run.
2. **ASCII codec crash on `upload_script`** for non-ASCII script bodies.
   The bridge opens the destination file with the platform default
   encoding, which is ASCII (locale=C) on the brick. Any em-dash or arrow
   in a Scratch project name / variable / comment crashes the upload.
   Symptom: `{"status":"error","msg":"'ascii' codec can't encode
   character '—'..."}` from `upload_script`.
3. **`generate_self_signed_cert` returns False after success.** The
   post-success help text contains `→` arrows in three `log()` calls.
   `print()` to a redirected stdout under locale=C raises
   `UnicodeEncodeError`, the function's outer try/except catches it and
   returns False — *even though the cert was generated correctly on
   disk*. The bridge then logs `Cannot start HTTPS without certificates`
   and **binds 8443 without an SSL context**. Browsers see a TCP
   listener but a broken handshake → Safari `(null)` / Firefox
   `CORS request did not succeed`.

**The launcher recipe** below uses `PYTHONIOENCODING=utf-8` as
belt-and-suspenders against any other non-ASCII output we missed in 2.3.1
that might surface in a later log line.

---

## Server installation on the brick

### 1. Upload the script

```bash
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/
ssh robot@ev3dev.local
```

### 2. Open ports in the firewall (if you have iptables enabled)

Most stock ev3dev images don't run iptables, so skip this if `sudo iptables
-L` returns "Chain INPUT (policy ACCEPT)" with no rules. Otherwise:

```bash
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT  # HTTP
sudo iptables -I INPUT -p tcp --dport 8443 -j ACCEPT  # HTTPS
sudo iptables -I INPUT -p tcp --dport 22   -j ACCEPT  # SSH (don't lock yourself out)
sudo iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -I INPUT -i lo -j ACCEPT
sudo sh -c "iptables-save > /etc/iptables.rules"
```

### 3. Start the server

```bash
# HTTP + HTTPS dual-mode (default, recommended):
PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose

# HTTP only:
PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose --http-only

# HTTPS only:
PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose --https-only

# Custom port (overrides the 8080/8443 defaults):
PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --port 9000 --http-only
```

Other useful flags: `--auth user:pass` enables HTTP Basic Auth, `--no-ui`
suppresses the on-brick LCD readout, `--cert <path>` / `--key <path>`
override the cert/key paths.

For a permanent setup, see [§ Auto-start on boot
(systemd)](#auto-start-on-boot-systemd) below.

---

## Certificate installation

The bridge mints a self-signed cert on first start, bound to the brick's
current IP. Each platform needs a one-time install. **Without it**:

| Client | What happens with no cert install |
|---|---|
| `curl -k …` | Works ignoring the cert. Useful for sanity checks; not for production. |
| **macOS Safari** | Strict — refuses outright with "This Connection Is Not Private". |
| **macOS Firefox** | Refuses HTTPS, but its Local Network Access feature now lets the editor talk to **HTTP** (port 8080) from an HTTPS frontend with a one-time per-origin prompt. |
| **macOS Chrome / Edge** | Strict like Safari; uses System Keychain. |
| **iOS / iPadOS Safari + WebViews** | Strict. All WebKit-based apps share the same trust store, so one cert install covers Safari, turbowarp-ios, Scrub, etc. |

### Step 1: Download the cert

```bash
curl -k https://<brick-ip>:8443/certificate -o /tmp/ev3.crt
```

(Keep `/tmp/ev3.crt` around — you'll reference it from each platform's
install step.) Verify it's the right cert:

```bash
openssl x509 -in /tmp/ev3.crt -noout -subject -ext subjectAltName
# Should show CN=<brick-ip> and SAN: IP:<brick-ip>, DNS:ev3dev, DNS:localhost, ...
```

### Step 2: Install per platform

#### A. macOS (Safari, Chrome, Edge)

System Keychain + admin trust. **Run each line separately** so any error is
visible — chaining with `&&` and `;` has caused subtle silent failures:

```bash
# Remove any previously-installed EV3 cert (no-op if missing — that's fine)
sudo security delete-certificate -c "<brick-ip>" /Library/Keychains/System.keychain || true

# Install the new cert as a trusted root, admin domain
sudo security add-trusted-cert -d -r trustRoot \
    -k /Library/Keychains/System.keychain /tmp/ev3.crt
```

Verify:

```bash
security find-certificate -c "<brick-ip>" -p /Library/Keychains/System.keychain | \
    openssl x509 -noout -subject -fingerprint -sha1
```

Should print `subject=…CN=<brick-ip>` plus a SHA-1 fingerprint matching
`openssl x509 -in /tmp/ev3.crt -fingerprint -sha1`.

**Then quit Safari fully (⌘Q, not just close window) and reopen.** Safari
aggressively caches cert verdicts.

The proper success test is **opening
`https://<brick-ip>:8443/test.html` in Safari** — should load with a green
padlock and no warning. (`curl https://<brick-ip>:8443/status` *also*
works without `-k` after install — but be aware that macOS curl actually
reads `/etc/ssl/cert.pem` first and falls back to Keychain second; in
practice the keychain install does cover curl too. Just don't put a `#
comment` on the same line — `zsh`'s `interactive_comments` option is off
by default, so the rest of the line gets passed as args to curl.)

#### B. macOS Firefox

Firefox uses its own NSS trust store, separate from Keychain. Easiest path
is the GUI:

1. **Preferences → Privacy & Security → Certificates → View Certificates**
2. **Authorities** tab → **Import…**
3. Pick `/tmp/ev3.crt`
4. Check **"Trust this CA to identify websites"** → **OK**
5. Restart Firefox

Or via `certutil`:

```bash
brew install nss   # only if certutil isn't already installed
FF_PROFILE=$(find ~/Library/Application\ Support/Firefox/Profiles -name '*.default*' -type d | head -1)
certutil -A -n "EV3 Robot <brick-ip>" -t "C,," -i /tmp/ev3.crt -d "sql:$FF_PROFILE"
killall firefox   # restart to pick up the new cert
```

If you'd rather avoid the Firefox cert install, keep using **HTTP on 8080**
— Firefox now has a "Local Network Access" prompt that allows mixed content
to private-IP hosts from an HTTPS frontend.

#### C. iOS / iPadOS

Three steps. Safari + turbowarp-ios + Scrub all share the iOS trust store,
so one install covers everything.

##### 1. Download the configuration profile

- Open **Safari** on the device (must be Safari, not Chrome).
- Go to: `https://<brick-ip>:8443/profile`
- Safari will warn "This Connection Is Not Private" — this is the
  chicken-and-egg moment, that's expected. Tap **"Show Details"** →
  **"visit this website"** → confirm with passcode/Touch ID/Face ID.
- A small popup at the top says **"This website is trying to download a
  configuration profile"** → **Allow** → **Close**.

##### 2. Install the profile

- **Settings → General → VPN & Device Management** (older iOS:
  "Profiles & Device Management" or just "Profiles").
- Under **"Downloaded Profile"** you'll see **"EV3 Robot
  (<brick-ip>)"**.
- Tap it → **Install** (top right) → enter passcode → **Install** again
  on the warning → **Install** once more → **Done**.

##### 3. ⚠️ Toggle on the trust — **the step almost everyone misses**

- **Settings → General → About → Certificate Trust Settings** (it's at
  the very bottom of the About page).
- You'll see the EV3 cert under **"Enable Full Trust for Root
  Certificates"**.
- **Toggle ON** → **Continue** on the warning.

##### 4. Verify

- In Safari: open `https://<brick-ip>:8443/test.html` — should load with
  no warning and a padlock.
- In **turbowarp-ios** / **Scrub**: connect to the brick at `<brick-ip>`.

##### If turbowarp-ios still refuses despite the trust

That means the shell's App Transport Security policy is blocking
arbitrary-IP connections regardless of cert trust. The fix is in the
shell's `Info.plist` — see [§ App Store ATS settings](#app-store-ats-settings)
below.

#### D. Android

1. Download the cert: `https://<brick-ip>:8443/certificate`
2. Settings → Security → Encryption & credentials → **Install a
   certificate** → **CA certificate**
3. Confirm the warning, navigate to Downloads, select `ev3.crt`
4. Give it a name (e.g. "EV3 Robot")

#### E. Windows

1. Download `ev3.crt`
2. Double-click → **Install Certificate…**
3. **Local Machine** (admin)
4. **Place all certificates in the following store** → **Browse** →
   **Trusted Root Certification Authorities**
5. Next → Finish → confirm warning

---

## Regenerate the cert when the brick's IP changes

The bridge keeps the existing cert if `openssl x509 -noout` confirms it's
structurally valid — even if the IP it's bound to no longer matches. So
when DHCP gives the brick a new lease, the old cert lingers and Safari
refuses (strict hostname check).

**Recipe:**

```bash
ssh robot@ev3dev.local
rm -f /home/robot/ev3.crt /home/robot/ev3.key

# Restart the bridge — see § "Auto-start on boot" if you have the
# systemd service set up; otherwise relaunch the foreground process.
sudo systemctl restart ev3-bridge   # if installed as a service
# - or -
PYTHONIOENCODING=utf-8 python3 -u /home/robot/ev3dev_ondevice.py --verbose
```

The bridge will mint a new cert with the current IP in `CN` and SAN. Then
re-run [§ Step 2](#step-2-install-per-platform) on each device that had
the old cert. (On macOS the `delete-certificate` line in the install recipe
takes care of removing the stale cert.)

A future improvement to the bridge would be to detect the IP mismatch
automatically and re-mint. Tracked in [`LEARNINGS.md`](./LEARNINGS.md).

---

## Auto-start on boot (systemd)

For a brick you don't want to babysit:

```ini
# /etc/systemd/system/ev3-bridge.service
[Unit]
Description=EV3 Bridge Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot
WorkingDirectory=/home/robot
Environment=PYTHONIOENCODING=utf-8
ExecStart=/usr/bin/python3 -u /home/robot/ev3dev_ondevice.py --verbose
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ev3-bridge
sudo systemctl start ev3-bridge
```

Watch logs live:

```bash
sudo journalctl -u ev3-bridge -f
```

---

## Optional: VPS tunnel for public access

If you want to drive the brick from outside your LAN — a school or museum
exhibit, remote-class context — front it with a VPS that has a real
Let's Encrypt cert and SSH-tunnel HTTP back to the brick. This avoids the
self-signed-cert dance entirely (the public domain has a real cert).

### VPS setup (Ubuntu 24.04)

```bash
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable
```

`/etc/nginx/sites-available/ev3`:

```nginx
server {
    listen 80;
    server_name ev3.yourdomain.com;
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;

        # WebSocket support (for Turbowarp/Scratch live updates)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/ev3 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
certbot --nginx -d ev3.yourdomain.com --non-interactive --agree-tos -m you@example.com
```

### Brick-side tunnel

`/home/robot/.ssh/ev3_to_vps` (key, generated with `ssh-keygen -t ed25519
-f ~/.ssh/ev3_to_vps -N ""`), then `/home/robot/tunnel-to-vps.sh`:

```bash
#!/bin/bash
VPS_IP="123.45.67.89"   # your VPS
KEY_PATH="/home/robot/.ssh/ev3_to_vps"

while true; do
    echo "[$(date)] Starting tunnel to $VPS_IP..."
    ssh -i $KEY_PATH \
        -N -R 8080:localhost:8080 \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o StrictHostKeyChecking=no \
        -o ExitOnForwardFailure=yes \
        root@$VPS_IP
    echo "[$(date)] Tunnel disconnected (code: $?). Retry in 5s..."
    sleep 5
done
```

`/etc/systemd/system/ev3-tunnel.service`:

```ini
[Unit]
Description=Persistent SSH Tunnel to VPS
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot
ExecStart=/home/robot/tunnel-to-vps.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable: `sudo systemctl daemon-reload && sudo systemctl enable ev3-tunnel
&& sudo systemctl start ev3-tunnel`. Then any client can hit
`https://ev3.yourdomain.com/` with no cert dance.

---

## Troubleshooting

### `/status` returns version 2.3.0 (not 2.3.1)

You're running the stock bridge. A clean restart will hit one of the three
latent bugs above. Update from this repo:

```bash
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/
ssh robot@ev3dev.local 'sudo systemctl restart ev3-bridge'
# or kill + restart manually if you don't have the systemd service
```

### Bridge starts, port 8443 listens, but TLS handshake fails

Almost certainly the locale crash in `generate_self_signed_cert` (bug 3 in
the section above). Look for `Cannot start HTTPS without certificates` in
the bridge log. Make sure you launched with
`PYTHONIOENCODING=utf-8`. If you're on 2.3.1 and still seeing it, please
file an issue with the full bridge log.

### Bridge log empty, process pinned at high CPU

Your bridge launcher didn't pass `python3 -u`, so output is block-buffered
to the redirected log file. Restart with `python3 -u` and you'll see
what's actually happening.

### Safari still says "Connection Is Not Private" after install

1. Did you fully **quit Safari (⌘Q)** and reopen? Safari caches verdicts.
2. Did the brick's IP change since you installed the cert? Run
   `openssl x509 -in /tmp/ev3.crt -noout -ext subjectAltName` and check
   the SAN against the current `<brick-ip>`. If they differ, follow
   [§ Regenerate the cert](#regenerate-the-cert-when-the-bricks-ip-changes).
3. As a check, run `security find-certificate -c "<brick-ip>" -p
   /Library/Keychains/System.keychain | openssl x509 -noout -subject`.
   If you don't see `CN=<brick-ip>`, the install didn't take — try the
   `add-trusted-cert` line again.

### iOS Safari accepts the cert but turbowarp-ios doesn't

That's the App Transport Security setting in the shell's `Info.plist`,
not a cert problem — see [§ App Store ATS settings](#app-store-ats-settings)
below.

### "Connection Refused"

Check the firewall — see [§ Server installation Step 2](#2-open-ports-in-the-firewall-if-you-have-iptables-enabled).

### "502 Bad Gateway" via VPS

Tunnel not connected. On the brick:

```bash
sudo systemctl status ev3-tunnel
sudo journalctl -u ev3-tunnel -n 50
sudo systemctl restart ev3-tunnel
```

On the VPS: `sudo ss -tulnp | grep 8080` — should show port 8080 listening.

### `Server Won't Start` (script crashes immediately)

```bash
ssh robot@ev3dev.local
sudo fuser -k 8080/tcp 8443/tcp     # free ports if held by zombie processes
python3 -m py_compile /home/robot/ev3dev_ondevice.py   # surface any syntax errors
python3 -u /home/robot/ev3dev_ondevice.py --verbose    # foreground for debug
```

### `running_scripts` count keeps growing forever

Known cosmetic bug in 2.3.1: the bridge doesn't reap the `running_scripts`
dict when a subprocess exits, so each script you run leaves an entry
forever. The actual subprocess does exit and the log file is still
readable; only the count is wrong. Tracked in
[`LEARNINGS.md`](./LEARNINGS.md).

---

## App Store ATS settings

Relevant if you fork [`turbowarp-ios`](https://github.com/CrispStrobe/turbowarp-ios)
and submit it to the App Store. The shell needs an iOS App Transport
Security exception to talk to private-IP devices like the brick.

**Don't use** `NSAllowsArbitraryLoads = true` — Apple flags it during App
Review and asks for justification; can lead to rejection.

**Use** `NSAllowsLocalNetworking = true` (introduced in iOS 10
specifically for this case). It permits TLS-or-HTTP connections to
RFC 1918 private ranges (`192.168.*.*`, `10.*`, `172.16-31.*`) and
`.local` mDNS hosts without disabling ATS for the rest of the internet —
no App Review scrutiny.

In `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
<key>NSLocalNetworkUsageDescription</key>
<string>Connects to your LEGO brick on this Wi-Fi network.</string>
```

The `NSLocalNetworkUsageDescription` purpose string is required by iOS 14+
for any local-network access; iOS shows it to the user the first time the
app tries to connect to a LAN host.

For sideloaded debug builds (Xcode → Run on device), either setting
works since App Review never sees the build.

---

## API reference

Every endpoint accepts JSON over POST to `/`, except where noted.
`<brick-ip>` is your brick's address.

### Discovery & status

| Method | Path | Notes |
|---|---|---|
| GET | `/` or `/status` | Server status JSON |
| GET | `/test.html` | Interactive test page (HTML) |
| GET | `/scripts` | List uploaded + running scripts |
| GET | `/script/<id>/logs?max=N` | Tail last N lines of a running script |
| GET | `/battery` | Battery voltage / level |
| GET | `/certificate` or `/ev3.crt` | Download the bridge's self-signed cert |
| GET | `/profile` or `/ev3.mobileconfig` | Download iOS configuration profile |

### Sensor reads (path-based)

| Path | Returns |
|---|---|
| `/motor/position/<port>` | Current encoder position (degrees) |
| `/motor/speed/<port>` | Current speed |
| `/motor/state/<port>` | State (running, stopped, holding…) |
| `/sensor/touch/<port>` | 0 or 1 |
| `/sensor/color/<port>/<mode>` | Color value depending on mode |
| `/sensor/color_rgb/<port>/<r\|g\|b>` | Single channel value |
| `/sensor/ultrasonic/<port>` | Distance (cm) |
| `/sensor/gyro/<port>/<angle\|rate>` | Gyro angle or rate of rotation |
| `/sensor/infrared/<port>/<mode>` | IR proximity or beacon |
| `/sensor/sound/<port>/<mode>` | Sound level (NXT) |
| `/sensor/light/<port>/<mode>` | Reflected/ambient (NXT) |
| `/button/<name>` | One brick button state |
| `/buttons/all` | All button states at once |

### Motor commands (POST `/`)

```bash
# Run continuously
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"motor_run","port":"A","speed":50}'

# Run for a duration
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"motor_run_timed","port":"A","speed":75,"duration_ms":2000}'

# Run to position
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"motor_run_to_position","port":"A","speed":50,"target":360}'

# Tank drive (two motors at once)
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"tank_drive","left_speed":50,"right_speed":-50,"duration_ms":1500}'
```

Other motor commands: `motor_run_for`, `motor_stop`, `motor_reset`,
`medium_motor_run`, `move_steering`, `set_motor_ramping`,
`stop_all_motors`, `servo_run`, `servo_run_to_position`, `servo_stop`,
`dc_motor_run`, `dc_motor_stop`. See `ev3dev_ondevice.py` itself for the
exact parameter shape — the test page at `/test.html` calls each one with
working sample bodies.

### Screen / sound

```bash
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"screen_text","text":"Hello brick","x":0,"y":0}'

curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"beep","freq":1000,"dur":500}'
```

Other commands: `screen_clear`, `screen_text_grid`, `draw_circle`,
`draw_rectangle`, `draw_line`, `draw_point`, `draw_polygon`, `draw_image`,
`speak`, `play_tone`, `play_tone_sequence`, `simple_beep`, `play_note`,
`play_file`.

### Script upload + run

```bash
# Upload (script body is plain Python; UTF-8 OK)
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{
        "cmd":"upload_script",
        "name":"dance.py",
        "code":"#!/usr/bin/env python3\nprint(\"Dancing!\")"
     }'

# Run — returns {"script_id": N}
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"run_script","name":"dance.py"}'

# Tail the last 100 log lines
curl http://<brick-ip>:8080/script/0/logs?max=100

# Stop a script by id
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"stop_script","script_id":0}'

# Stop all
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"stop_all_scripts"}'

# Delete a script file
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"delete_script","name":"dance.py"}'
```

### Port configuration (NXT-era sensors)

NXT touch / light / sound sensors don't auto-detect on EV3; you have to
declare them. Use `configure_port` once at startup:

```bash
curl -X POST http://<brick-ip>:8080/ \
     -H 'Content-Type: application/json' \
     -d '{"cmd":"configure_port","port":"1","device":"lego-nxt-touch"}'
```

Valid `device` values: `lego-nxt-touch`, `lego-nxt-light`,
`lego-nxt-sound`, `reset` (back to auto).

---

## Security notes

### Local network only

- Self-signed certs are fine on a LAN. The bridge has no auth by default
  — anyone on the same Wi-Fi can drive your motors.
- For shared / school networks, enable HTTP Basic Auth: launch with
  `--auth username:password`.

### Public exposure

- **Don't** expose 8080/8443 directly to the internet.
- If you need remote access, use the VPS tunnel pattern above, with
  Let's Encrypt + Nginx HTTP Basic Auth on the public side.

### Adding HTTP Basic Auth on the VPS Nginx side

```nginx
location / {
    auth_basic "EV3 Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ... rest of proxy config
}
```

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
sudo systemctl restart nginx
```

---

## License

GPL-3.0 (matching the rest of the bridges in this repo).
