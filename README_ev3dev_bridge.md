# EV3 Bridge Server v2.3 - Complete Setup Guide

Comprehensive guide for running an EV3 robotics control server with secure HTTPS access from any device (iOS, Android, macOS, Windows).

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [EV3 Server Installation](#ev3-server-installation)
4. [Certificate Installation](#certificate-installation)
5. [VPS Tunnel Setup (Public Access)](#vps-tunnel-setup-public-access)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## Quick Start

### Local Network (HTTP - Simplest)

```bash
# On EV3
python3 ./ev3dev_ondevice.py --verbose

# Access from any device on same network
http://192.168.178.50:8080/test.html
```

### Local Network (HTTPS - iOS Compatible)

```bash
# On EV3
python3 ./ev3dev_ondevice.py --ssl --verbose

# Install certificate (see below), then access:
https://192.168.178.50:8443/test.html
```

---

## Architecture Overview

### Option 1: Direct Local Access (Simple)
```
Your Device -> EV3 (HTTP/HTTPS)
```
- ✅ Fast, low latency
- ✅ No external dependencies
- ❌ Same network only
- ❌ Certificate setup required for HTTPS

### Option 2: VPS Tunnel (Production)
```
Internet -> VPS (HTTPS) -> SSH Tunnel -> EV3 (HTTP)
```
- ✅ Access from anywhere
- ✅ Trusted SSL certificate
- ✅ No certificate installation needed
- ❌ Requires VPS ($5/month)
- ❌ Higher latency

---

## EV3 Server Installation

### 1. Upload the Script

```bash
# From your computer
scp ev3dev_ondevice.py robot@ev3dev.local:/home/robot/

# SSH to EV3
ssh robot@ev3dev.local
```

### 2. Configure Firewall

```bash
# Open required ports
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT  # HTTP
sudo iptables -I INPUT -p tcp --dport 8443 -j ACCEPT  # HTTPS
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT    # SSH

# Allow established connections
sudo iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
sudo iptables -I INPUT -i lo -j ACCEPT

# Save rules
sudo sh -c "iptables-save > /etc/iptables.rules"
```

### 3. Start the Server

**HTTP Only (Works Everywhere):**
```bash
python3 ./ev3dev_ondevice.py --verbose
```

**HTTPS (iOS/Safari Compatible):**
```bash
python3 ./ev3dev_ondevice.py --ssl --verbose
```

**Dual Mode (Both HTTP and HTTPS):**
```bash
# Run HTTP on port 8080
python3 ./ev3dev_ondevice.py --verbose &

# Run HTTPS on port 8443
python3 ./ev3dev_ondevice.py --ssl --port 8443 --verbose
```

---

## Certificate Installation

### Overview

The EV3 generates a self-signed SSL certificate. Each platform requires different installation steps:

| Platform | Difficulty | Method |
|----------|------------|--------|
| curl/API clients | ✅ Easy | Use `-k` flag |
| Firefox | ✅ Easy | Import cert |
| macOS Terminal | ✅ Easy | Command line |
| Chrome/Edge | ⚠️ Medium | Use System cert |
| Safari | 🔴 Hard | Manual trust |
| iOS | ⚠️ Medium | Profile + Trust |

---

### A. Download Certificate

From any browser (accept the warning first time):

```
https://192.168.178.50:8443/certificate
```

Or via command line:
```bash
curl -k https://192.168.178.50:8443/certificate -o ev3.crt
```

---

### B. macOS Installation

#### Method 1: Command Line (Recommended)

```bash
# Download certificate
curl -k https://192.168.178.50:8443/certificate -o ev3.crt

# Verify it's valid
openssl x509 -in ev3.crt -text -noout

# Install to system keychain (requires sudo)
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ev3.crt

# Verify installation
security verify-cert -c ev3.crt -p ssl
# Should show: "...certificate verification successful."

# Test with curl (no -k flag needed)
curl https://192.168.178.50:8443/status
```

#### Method 2: GUI (Safari Required)

1. Download `ev3.crt` file
2. Open **Keychain Access** (Applications → Utilities)
3. Select **System** keychain in left sidebar
4. Drag `ev3.crt` into the window (enter admin password)
5. Find the certificate (search for "192.168.178.50")
6. **Double-click** the certificate
7. Expand **Trust** section
8. Change **"Secure Sockets Layer (SSL)"** to **"Always Trust"**
9. Change **"When using this certificate"** to **"Always Trust"**
10. Close window (enter admin password again)
11. **Quit and restart Safari**

**Note:** Safari may still not trust the certificate even after these steps. This is a Safari limitation. Use Firefox or HTTP instead.

#### Method 3: Configuration Profile (Alternative)

Visit in Safari:
```
https://192.168.178.50:8443/profile
```

This downloads a `.mobileconfig` file that installs the certificate automatically.

---

### C. Firefox Installation

Firefox uses its own certificate store (doesn't use macOS System keychain).

#### GUI Method:

1. Download `ev3.crt`
2. Open Firefox → **Preferences** → **Privacy & Security**
3. Scroll to **Certificates** → Click **"View Certificates"**
4. Click **"Authorities"** tab
5. Click **"Import..."**
6. Select `ev3.crt`
7. Check **"Trust this CA to identify websites"**
8. Click **OK**
9. Restart Firefox

#### Command Line Method:

```bash
# Install certutil (if not present)
brew install nss

# Find Firefox profile
FIREFOX_PROFILE=$(find ~/Library/Application\ Support/Firefox/Profiles -name "*.default*" -type d | head -1)

# Import certificate
certutil -A -n "EV3 Robot" -t "C,," -i ev3.crt -d "sql:$FIREFOX_PROFILE"

# Restart Firefox
killall firefox
```

---

### D. iOS Installation

iOS requires **three steps**: Download → Install → Trust

#### Step 1: Download Certificate

1. Open **Safari** (must be Safari, not Chrome)
2. Navigate to: `https://192.168.178.50:8443/certificate`
3. Tap through the security warning (**"Show Details"** → **"visit this website"**)
4. Certificate will download

#### Step 2: Install Profile

1. Go to **Settings** → You'll see **"Profile Downloaded"** at the very top
2. Tap it
3. Tap **"Install"** (top right)
4. Enter your device **passcode**
5. Tap **"Install"** again on the warning screen
6. Tap **"Done"**

#### Step 3: Trust Certificate (CRITICAL!)

This step is often missed:

1. Go to **Settings** → **General** → **About**
2. Scroll all the way down to **"Certificate Trust Settings"**
3. Find **"192.168.178.50"** certificate
4. **Toggle the switch ON**
5. Tap **"Continue"** on the warning

#### Step 4: Test

Open Safari and navigate to:
```
https://192.168.178.50:8443/test.html
```

Should load without certificate warnings!

#### Alternative: Configuration Profile (Easier)

Visit in Safari:
```
https://192.168.178.50:8443/profile
```

This installs the certificate in one step (still need Step 3 to trust it).

---

### E. Android Installation

1. Download `ev3.crt` from: `https://192.168.178.50:8443/certificate`
2. Go to **Settings** → **Security** → **Encryption & credentials**
3. Tap **"Install a certificate"** → **"CA certificate"**
4. Tap **"Install anyway"**
5. Navigate to Downloads folder and select `ev3.crt`
6. Give it a name (e.g., "EV3 Robot")

---

### F. Windows Installation

1. Download `ev3.crt`
2. **Double-click** the file
3. Click **"Install Certificate..."**
4. Select **"Local Machine"** (requires admin)
5. Choose **"Place all certificates in the following store"**
6. Click **"Browse"** → Select **"Trusted Root Certification Authorities"**
7. Click **OK** → **Next** → **Finish**
8. Click **Yes** on security warning

---

## VPS Tunnel Setup (Public Access)

For accessing your EV3 from anywhere via a trusted HTTPS domain.

### Prerequisites

- VPS with public IP (DigitalOcean, Linode, Vultr, etc.)
- Domain name pointing to VPS
- EV3 connected to internet

### 1. VPS Setup (Ubuntu 24.04)

#### A. Install Requirements

```bash
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx
```

#### B. Configure Firewall

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

#### C. Nginx Configuration

Create `/etc/nginx/sites-available/ev3`:

```nginx
server {
    listen 80;
    server_name ev3.yourdomain.com;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:8080;
        
        # WebSocket Support (for Turbowarp/Scratch)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:

```bash
ln -sf /etc/nginx/sites-available/ev3 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

#### D. SSL Certificate (Let's Encrypt)

```bash
certbot --nginx -d ev3.yourdomain.com \
    --non-interactive \
    --agree-tos \
    -m your-email@example.com
```

Auto-renewal is configured automatically.

---

### 2. EV3 Setup (Tunnel Client)

#### A. Generate SSH Key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ev3_to_vps -N ""
cat ~/.ssh/ev3_to_vps.pub
# Copy this output to VPS authorized_keys
```

#### B. Add Key to VPS

On VPS:
```bash
nano ~/.ssh/authorized_keys
# Paste the EV3's public key here
```

#### C. Create Tunnel Script

Create `/home/robot/tunnel-to-vps.sh`:

```bash
#!/bin/bash

VPS_IP="123.45.67.89"  # Replace with your VPS IP or domain
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
    
    EXIT_CODE=$?
    echo "[$(date)] Tunnel disconnected (exit code: $EXIT_CODE). Reconnecting in 5 seconds..."
    sleep 5
done
```

Make executable:
```bash
chmod +x /home/robot/tunnel-to-vps.sh
```

#### D. Create Systemd Service

Create `/etc/systemd/system/ev3-tunnel.service`:

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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

#### E. Enable & Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable ev3-tunnel
sudo systemctl start ev3-tunnel
```

#### F. Check Status

```bash
sudo systemctl status ev3-tunnel
sudo journalctl -u ev3-tunnel -f  # Follow logs
```

---

### 3. Verify Tunnel

**On EV3:**
```bash
# Check tunnel is running
sudo systemctl status ev3-tunnel

# Check local server
curl http://localhost:8080/status
```

**On VPS:**
```bash
# Check port 8080 is listening
sudo ss -tulnp | grep 8080

# Should show: tcp  LISTEN  0.0.0.0:8080

# Test locally
curl http://localhost:8080/status
```

**From Internet:**
```bash
curl https://ev3.yourdomain.com/status
```

Should return JSON: `{"status": "ev3_bridge_active", ...}`

---

## Troubleshooting

### "Connection Refused"

**Check firewall:**
```bash
# On EV3
sudo iptables -L -n | grep 8080
```

Should show ACCEPT rule. If not, run firewall setup commands above.

### "502 Bad Gateway" (VPS)

**Tunnel not connected:**
```bash
# On EV3
sudo systemctl status ev3-tunnel
sudo journalctl -u ev3-tunnel -n 50

# On VPS
sudo ss -tulnp | grep 8080
```

If port 8080 not listening, restart tunnel:
```bash
# On EV3
sudo systemctl restart ev3-tunnel
```

### Safari "Certificate Unknown" Error

Safari is extremely strict with self-signed certificates. **Solutions:**

1. **Use HTTP instead:** `http://192.168.178.50:8080`
2. **Use Firefox** (easier certificate import)
3. **Use VPS tunnel** (trusted certificate)
4. **Force trust via Keychain Access** (see macOS installation above)

### iOS Won't Trust Certificate

Make sure you completed **Step 3** (Certificate Trust Settings):
```
Settings → General → About → Certificate Trust Settings
```

Toggle ON the certificate.

### Firefox "Secure Connection Failed"

Import certificate via Firefox's certificate manager (see Firefox installation above).

### "SSL Error: CERTIFICATE_UNKNOWN"

The client doesn't trust your certificate. Install it properly for your platform.

### Server Won't Start

```bash
# Check if port is already in use
sudo netstat -tulnp | grep 8080

# Kill existing process
sudo fuser -k 8080/tcp

# Check Python version
python3 --version  # Should be 3.5+

# Check for syntax errors
python3 -m py_compile ev3dev_ondevice.py
```

---

## API Reference

### Endpoints

#### GET /status
Returns server status and connected hardware.

```bash
curl http://192.168.178.50:8080/status
```

Response:
```json
{
  "status": "ev3_bridge_active",
  "version": "2.3.0",
  "running_scripts": 0,
  "available_scripts": 5,
  "motors": ["A", "B"],
  "sensors": ["1_touch", "2_color"]
}
```

#### GET /test.html
Interactive test page with buttons to test all endpoints.

```
http://192.168.178.50:8080/test.html
```

#### GET /certificate
Download SSL certificate for installation.

```bash
curl -k https://192.168.178.50:8443/certificate -o ev3.crt
```

#### GET /profile
Download iOS/macOS configuration profile for easy certificate installation.

```
https://192.168.178.50:8443/profile
```

#### GET /scripts
List available and running scripts.

```bash
curl http://192.168.178.50:8080/scripts
```

#### POST /motor_run
Run a motor at specified speed.

```bash
curl -X POST http://192.168.178.50:8080 \
  -H "Content-Type: application/json" \
  -d '{"cmd": "motor_run", "port": "A", "speed": 50}'
```

#### POST /upload_script
Upload a Python script to the EV3.

```bash
curl -X POST http://192.168.178.50:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "cmd": "upload_script",
    "name": "dance.py",
    "code": "#!/usr/bin/env python3\nprint(\"Dancing!\")"
  }'
```

Full API documentation: See script docstring or `/test.html` for examples.

---

## Production Deployment

### Auto-Start on Boot (EV3)

Create `/etc/systemd/system/ev3-bridge.service`:

```ini
[Unit]
Description=EV3 Bridge Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=robot
WorkingDirectory=/home/robot
ExecStart=/usr/bin/python3 /home/robot/ev3dev_ondevice.py --verbose
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ev3-bridge
sudo systemctl start ev3-bridge
```

### Monitoring

```bash
# Check server status
sudo systemctl status ev3-bridge

# Follow logs
sudo journalctl -u ev3-bridge -f

# Check connections
sudo netstat -an | grep 8080
```

---

## Security Notes

### Local Network Only

- Self-signed certificates are fine for local networks
- Don't expose EV3 directly to internet without authentication

### Public VPS Setup

- Always use HTTPS (Let's Encrypt)
- Consider adding HTTP basic auth to Nginx
- Use firewall rules to limit access
- Monitor access logs

### Adding Authentication (Optional)

Add to Nginx config:
```nginx
location / {
    auth_basic "EV3 Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ... rest of config
}
```

Create password file:
```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
sudo systemctl restart nginx
```

---

## License

MIT License - Feel free to modify and use for your robotics projects!
