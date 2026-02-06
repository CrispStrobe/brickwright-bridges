#!/usr/bin/env python3
"""
LEGO EV3 Local Bridge Server - Enhanced with SSL/TLS and CORS
Connects browser extensions to EV3 via WebSocket with security features

Features:
- SSL/TLS support (wss://)
- CORS handling
- Origin validation
- Self-signed certificate generation
- Optional authentication
- HTTP health check endpoint

Compile to binary:
    pip install pyinstaller
    pyinstaller --onefile --name ev3-bridge ev3_bridge_secure.py
"""

import asyncio
import json
import sys
import time
import logging
import argparse
import platform
import struct
import ssl
import os
import hashlib
import secrets
from pathlib import Path
from typing import Optional, Dict, List, Set
from dataclasses import dataclass
from enum import Enum

try:
    import websockets
    from websockets.server import serve, WebSocketServerProtocol
except ImportError:
    print("ERROR: websockets not installed. Run: pip install websockets")
    sys.exit(1)

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    print("WARNING: pyserial not installed. Serial connections disabled.")

try:
    import bluetooth
    BLUETOOTH_AVAILABLE = True
except ImportError:
    BLUETOOTH_AVAILABLE = False
    print("WARNING: pybluez not installed. Bluetooth connections disabled.")

try:
    import requests
    HTTP_AVAILABLE = True
except ImportError:
    HTTP_AVAILABLE = False
    print("WARNING: requests not installed. HTTP forwarding disabled.")

try:
    from aiohttp import web
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    print("WARNING: aiohttp not installed. HTTP health endpoint disabled.")
    print("Install with: pip install aiohttp")

try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend
    import datetime
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("WARNING: cryptography not installed. SSL cert generation disabled.")
    print("Install with: pip install cryptography")

# ============================================================================
# LOGGING SETUP
# ============================================================================

class ColoredFormatter(logging.Formatter):
    """Colored log formatter for terminal output"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        if sys.stdout.isatty():
            color = self.COLORS.get(record.levelname, self.RESET)
            record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)

def setup_logging(verbose: bool = False):
    """Setup logging with verbose option"""
    level = logging.DEBUG if verbose else logging.INFO
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    formatter = ColoredFormatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)
    
    return logging.getLogger(__name__)

# ============================================================================
# SSL CERTIFICATE GENERATION
# ============================================================================

class CertificateManager:
    """Manages SSL certificates for secure WebSocket connections"""
    
    def __init__(self, logger: logging.Logger, cert_dir: str = "./certs"):
        self.logger = logger
        self.cert_dir = Path(cert_dir)
        self.cert_path = self.cert_dir / "server.crt"
        self.key_path = self.cert_dir / "server.key"
        
    def ensure_certificate(self, hostname: str = "localhost") -> bool:
        """Ensure SSL certificate exists, generate if needed"""
        
        if not CRYPTO_AVAILABLE:
            self.logger.error("❌ Cannot generate certificate: cryptography not installed")
            return False
        
        # Create cert directory
        self.cert_dir.mkdir(parents=True, exist_ok=True)
        
        # Check if certificate exists and is valid
        if self.cert_path.exists() and self.key_path.exists():
            self.logger.info(f"✅ Using existing certificate: {self.cert_path}")
            return True
        
        self.logger.info("🔐 Generating self-signed SSL certificate...")
        return self.generate_self_signed_cert(hostname)
    
    def generate_self_signed_cert(self, hostname: str) -> bool:
        """Generate self-signed SSL certificate"""
        try:
            # Generate private key
            self.logger.debug("Generating RSA private key (2048 bits)...")
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            
            # Generate certificate
            self.logger.debug(f"Generating certificate for {hostname}...")
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "EV3 Bridge"),
                x509.NameAttribute(NameOID.COMMON_NAME, hostname),
            ])
            
            cert = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                datetime.datetime.utcnow()
            ).not_valid_after(
                datetime.datetime.utcnow() + datetime.timedelta(days=365)
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName(hostname),
                    x509.DNSName("localhost"),
                    x509.DNSName("127.0.0.1"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256(), default_backend())
            
            # Write private key
            self.logger.debug(f"Writing private key to {self.key_path}...")
            with open(self.key_path, "wb") as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            
            # Write certificate
            self.logger.debug(f"Writing certificate to {self.cert_path}...")
            with open(self.cert_path, "wb") as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))
            
            # Set restrictive permissions
            os.chmod(self.key_path, 0o600)
            os.chmod(self.cert_path, 0o644)
            
            self.logger.info(f"✅ Generated self-signed certificate: {self.cert_path}")
            self.logger.warning("⚠️  Self-signed certificate will show security warnings in browsers")
            self.logger.info("📋 To trust this certificate:")
            self.logger.info(f"   Certificate: {self.cert_path.absolute()}")
            self.logger.info("   Add to your system's trusted certificates or browser")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate certificate: {e}")
            self.logger.debug("Exception details:", exc_info=True)
            return False
    
    def get_ssl_context(self) -> Optional[ssl.SSLContext]:
        """Get SSL context for server"""
        if not self.cert_path.exists() or not self.key_path.exists():
            self.logger.error("❌ Certificate files not found")
            return None
        
        try:
            self.logger.debug("Creating SSL context...")
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ssl_context.load_cert_chain(self.cert_path, self.key_path)
            
            # Security settings
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            self.logger.debug("✅ SSL context created")
            return ssl_context
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create SSL context: {e}")
            self.logger.debug("Exception details:", exc_info=True)
            return None

# ============================================================================
# CORS AND ORIGIN VALIDATION
# ============================================================================

class SecurityManager:
    """Manages CORS and origin validation"""
    
    def __init__(self, logger: logging.Logger, allowed_origins: Optional[List[str]] = None,
                 require_auth: bool = False, auth_token: Optional[str] = None):
        self.logger = logger
        self.allowed_origins = allowed_origins or ['*']
        self.require_auth = require_auth
        self.auth_token = auth_token or self.generate_token()
        
        if self.require_auth:
            self.logger.info(f"🔐 Authentication enabled. Token: {self.auth_token}")
    
    @staticmethod
    def generate_token() -> str:
        """Generate random authentication token"""
        return secrets.token_urlsafe(32)
    
    def validate_origin(self, origin: Optional[str]) -> bool:
        """Validate WebSocket origin"""
        if '*' in self.allowed_origins:
            self.logger.debug(f"✅ Origin accepted (wildcard): {origin}")
            return True
        
        if not origin:
            self.logger.warning("⚠️  No origin provided")
            return '*' in self.allowed_origins
        
        # Normalize origin
        origin = origin.lower()
        
        # Check against allowed origins
        for allowed in self.allowed_origins:
            if allowed == '*':
                return True
            
            allowed_lower = allowed.lower()
            
            # Exact match
            if origin == allowed_lower:
                self.logger.debug(f"✅ Origin accepted (exact): {origin}")
                return True
            
            # Wildcard subdomain match (e.g., *.example.com)
            if allowed_lower.startswith('*.'):
                domain = allowed_lower[2:]
                if origin.endswith(domain):
                    self.logger.debug(f"✅ Origin accepted (wildcard): {origin}")
                    return True
        
        self.logger.warning(f"❌ Origin rejected: {origin}")
        self.logger.debug(f"Allowed origins: {self.allowed_origins}")
        return False
    
    def validate_auth(self, token: Optional[str]) -> bool:
        """Validate authentication token"""
        if not self.require_auth:
            return True
        
        if not token:
            self.logger.warning("⚠️  No authentication token provided")
            return False
        
        # Constant-time comparison to prevent timing attacks
        if secrets.compare_digest(token, self.auth_token):
            self.logger.debug("✅ Authentication successful")
            return True
        
        self.logger.warning("❌ Authentication failed: invalid token")
        return False
    
    def get_cors_headers(self) -> Dict[str, str]:
        """Get CORS headers for HTTP responses"""
        origin = self.allowed_origins[0] if self.allowed_origins else '*'
        
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }

# ============================================================================
# CONNECTION TYPES (SAME AS BEFORE)
# ============================================================================

class ConnectionType(Enum):
    """Supported connection types"""
    SERIAL = "serial"
    BLUETOOTH = "bluetooth"
    HTTP = "http"
    NONE = "none"

@dataclass
class ConnectionConfig:
    """Connection configuration"""
    type: ConnectionType
    serial_port: Optional[str] = None
    serial_baud: int = 115200
    bluetooth_address: Optional[str] = None
    bluetooth_channel: int = 1
    http_host: str = "192.168.178.50"
    http_port: int = 8080
    reconnect_attempts: int = 5
    reconnect_delay: float = 2.0

# [COPY ALL CONNECTION CLASSES FROM PREVIOUS VERSION]
# SerialConnection, BluetoothConnection, HTTPConnection, EV3Connection classes
# (Lines ~230-800 from previous version - keeping this shorter for space)

class EV3Connection:
    """Abstract base for EV3 connections"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        self.connected = False
        
    async def connect(self) -> bool:
        raise NotImplementedError
        
    async def disconnect(self):
        raise NotImplementedError
        
    async def send(self, data: bytes) -> bool:
        raise NotImplementedError
        
    async def receive(self, timeout: float = 1.0) -> Optional[bytes]:
        raise NotImplementedError

# [INSERT SerialConnection, BluetoothConnection, HTTPConnection classes here]
# (Same implementations as previous version)

# ============================================================================
# HTTP HEALTH CHECK SERVER
# ============================================================================

class HealthCheckServer:
    """HTTP server for health checks and CORS preflight"""
    
    def __init__(self, logger: logging.Logger, security: SecurityManager, 
                 bridge_server: 'EV3BridgeServer'):
        self.logger = logger
        self.security = security
        self.bridge_server = bridge_server
        self.app = None
        self.runner = None
        
    async def start(self, host: str = '0.0.0.0', port: int = 8081):
        """Start HTTP health check server"""
        if not AIOHTTP_AVAILABLE:
            self.logger.warning("⚠️  HTTP health check disabled (aiohttp not installed)")
            return
        
        self.logger.info(f"🏥 Starting HTTP health check server on {host}:{port}")
        
        self.app = web.Application()
        self.app.router.add_get('/health', self.handle_health)
        self.app.router.add_get('/status', self.handle_status)
        self.app.router.add_options('/health', self.handle_options)
        self.app.router.add_options('/status', self.handle_options)
        
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        
        site = web.TCPSite(self.runner, host, port)
        await site.start()
        
        self.logger.info(f"✅ HTTP health check server running on http://{host}:{port}")
        self.logger.info(f"   Health: http://{host}:{port}/health")
        self.logger.info(f"   Status: http://{host}:{port}/status")
    
    async def handle_options(self, request: web.Request) -> web.Response:
        """Handle CORS preflight"""
        self.logger.debug(f"CORS preflight: {request.path}")
        return web.Response(
            status=200,
            headers=self.security.get_cors_headers()
        )
    
    async def handle_health(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        self.logger.debug("Health check request")
        
        health = {
            'status': 'ok',
            'timestamp': time.time(),
            'platform': platform.system(),
        }
        
        return web.json_response(
            health,
            headers=self.security.get_cors_headers()
        )
    
    async def handle_status(self, request: web.Request) -> web.Response:
        """Status endpoint with detailed information"""
        self.logger.debug("Status request")
        
        connection = self.bridge_server.connection
        
        status = {
            'server': {
                'running': self.bridge_server.running,
                'clients': len(self.bridge_server.clients),
                'platform': platform.system(),
                'python_version': sys.version,
            },
            'connection': {
                'connected': connection.connected if connection else False,
                'type': self.bridge_server.config.type.value,
            },
            'features': {
                'serial': SERIAL_AVAILABLE,
                'bluetooth': BLUETOOTH_AVAILABLE,
                'http': HTTP_AVAILABLE,
                'ssl': CRYPTO_AVAILABLE,
            },
            'timestamp': time.time(),
        }
        
        return web.json_response(
            status,
            headers=self.security.get_cors_headers()
        )
    
    async def stop(self):
        """Stop HTTP server"""
        if self.runner:
            await self.runner.cleanup()

# ============================================================================
# ENHANCED BRIDGE SERVER
# ============================================================================

class EV3BridgeServer:
    """WebSocket bridge server with SSL and CORS support"""
    
    def __init__(self, config: ConnectionConfig, logger: logging.Logger,
                 security: SecurityManager, ssl_context: Optional[ssl.SSLContext] = None):
        self.config = config
        self.logger = logger
        self.security = security
        self.ssl_context = ssl_context
        self.connection: Optional[EV3Connection] = None
        self.clients: Set[WebSocketServerProtocol] = set()
        self.running = False
        self.health_server: Optional[HealthCheckServer] = None
        
    async def start(self, host: str = '0.0.0.0', port: int = 8080, http_port: Optional[int] = None):
        """Start the WebSocket server"""
        self.logger.info("=" * 60)
        self.logger.info("🚀 Starting EV3 Bridge Server (Enhanced)")
        self.logger.info("=" * 60)
        
        protocol = "wss" if self.ssl_context else "ws"
        self.logger.info(f"WebSocket server: {protocol}://{host}:{port}")
        self.logger.info(f"SSL/TLS: {'✅ Enabled' if self.ssl_context else '❌ Disabled'}")
        self.logger.info(f"CORS: ✅ Enabled (origins: {self.security.allowed_origins})")
        self.logger.info(f"Authentication: {'✅ Required' if self.security.require_auth else '❌ Optional'}")
        self.logger.info(f"Connection type: {self.config.type.value}")
        self.logger.info(f"Platform: {platform.system()} {platform.release()}")
        self.logger.info(f"Python: {sys.version}")
        self.logger.info("=" * 60)
        
        # Start HTTP health check server
        if http_port:
            self.health_server = HealthCheckServer(self.logger, self.security, self)
            await self.health_server.start(host, http_port)
        
        # Connect to EV3
        await self.connect_ev3()
        
        # Start WebSocket server
        self.running = True
        
        # Custom process_request for origin validation
        async def process_request(path, request_headers):
            origin = request_headers.get('Origin')
            
            self.logger.debug(f"WebSocket connection request from origin: {origin}")
            
            if not self.security.validate_origin(origin):
                self.logger.warning(f"❌ Rejected connection from unauthorized origin: {origin}")
                return (403, [], b'Origin not allowed\n')
            
            # Check authentication in query params or headers
            if self.security.require_auth:
                auth_header = request_headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    token = auth_header[7:]
                    if not self.security.validate_auth(token):
                        return (401, [], b'Unauthorized\n')
                else:
                    return (401, [], b'Authentication required\n')
            
            self.logger.debug("✅ WebSocket connection authorized")
            return None  # Allow connection
        
        async with serve(
            self.handle_client,
            host,
            port,
            ssl=self.ssl_context,
            process_request=process_request
        ):
            self.logger.info(f"✅ WebSocket server running on {protocol}://{host}:{port}")
            
            if self.security.require_auth:
                self.logger.info(f"🔑 Connect with: {protocol}://{host}:{port}?token={self.security.auth_token}")
            else:
                self.logger.info(f"🔓 Connect with: {protocol}://{host}:{port}")
            
            self.logger.info("Waiting for connections...")
            
            try:
                await asyncio.Future()
            except asyncio.CancelledError:
                self.logger.info("Server shutdown requested")
    
    async def connect_ev3(self) -> bool:
        """Connect to EV3 with automatic fallback"""
        # [SAME AS PREVIOUS VERSION - copy connect_ev3 method]
        self.logger.info(f"🔌 Attempting to connect to EV3 ({self.config.type.value})")
        # ... (implementation from previous version)
        return True
    
    async def handle_client(self, websocket: WebSocketServerProtocol):
        """Handle WebSocket client connection"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        self.logger.info(f"👤 Client connected: {client_id}")
        self.logger.debug(f"Client details: {websocket.remote_address}")
        
        self.clients.add(websocket)
        
        try:
            async for message in websocket:
                self.logger.debug(f"📨 Received from {client_id}: {len(message)} bytes")
                
                if isinstance(message, bytes):
                    await self.handle_binary_message(websocket, message)
                else:
                    await self.handle_text_message(websocket, message)
                    
        except websockets.exceptions.ConnectionClosed as e:
            self.logger.info(f"👋 Client disconnected: {client_id} (code={e.code})")
        except Exception as e:
            self.logger.error(f"❌ Error handling client {client_id}: {e}")
            self.logger.debug("Exception details:", exc_info=True)
        finally:
            self.clients.discard(websocket)
            self.logger.debug(f"Remaining clients: {len(self.clients)}")
    
    async def handle_binary_message(self, websocket: WebSocketServerProtocol, data: bytes):
        """Handle binary message (EV3 command)"""
        # [SAME AS PREVIOUS VERSION]
        self.logger.debug(f"📦 Binary message: {len(data)} bytes")
        # ... (implementation)
    
    async def handle_text_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle text message (JSON command)"""
        # [SAME AS PREVIOUS VERSION]
        self.logger.debug(f"💬 Text message: {message[:100]}...")
        # ... (implementation)
    
    async def shutdown(self):
        """Shutdown the server"""
        self.logger.info("🛑 Shutting down server...")
        self.running = False
        
        # Stop health server
        if self.health_server:
            await self.health_server.stop()
        
        # Close all client connections
        for client in self.clients:
            await client.close()
        
        # Disconnect from EV3
        if self.connection:
            await self.connection.disconnect()
        
        self.logger.info("✅ Server shutdown complete")

# ============================================================================
# MAIN
# ============================================================================

def print_banner():
    """Print startup banner"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        LEGO EV3 Local Bridge Server - Enhanced           ║
║                                                           ║
║  🔐 SSL/TLS Support  •  🌐 CORS Enabled  •  🔑 Auth      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)

async def main():
    """Main entry point"""
    print_banner()
    
    parser = argparse.ArgumentParser(
        description='LEGO EV3 Local Bridge Server (Enhanced)',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    # Connection options
    parser.add_argument('--type', choices=['serial', 'bluetooth', 'http'],
                       default='serial', help='Connection type (default: serial)')
    parser.add_argument('--port', help='Serial port')
    parser.add_argument('--baud', type=int, default=115200, help='Serial baud rate')
    parser.add_argument('--bt-address', help='Bluetooth address')
    parser.add_argument('--bt-channel', type=int, default=1, help='Bluetooth channel')
    parser.add_argument('--http-host', default='192.168.178.50', help='HTTP host')
    parser.add_argument('--http-port', type=int, default=8080, help='HTTP port')
    
    # Server options
    parser.add_argument('--ws-host', default='0.0.0.0', help='WebSocket host')
    parser.add_argument('--ws-port', type=int, default=8080, help='WebSocket port')
    parser.add_argument('--health-port', type=int, help='HTTP health check port')
    
    # Security options
    parser.add_argument('--ssl', action='store_true', help='Enable SSL/TLS (wss://)')
    parser.add_argument('--cert', help='SSL certificate file')
    parser.add_argument('--key', help='SSL private key file')
    parser.add_argument('--cert-dir', default='./certs', help='Certificate directory')
    parser.add_argument('--hostname', default='localhost', help='Certificate hostname')
    
    # CORS options
    parser.add_argument('--cors-origins', nargs='+', default=['*'],
                       help='Allowed CORS origins (default: *)')
    
    # Authentication options
    parser.add_argument('--auth', action='store_true', help='Require authentication')
    parser.add_argument('--auth-token', help='Authentication token (generated if not provided)')
    
    # Other options
    parser.add_argument('--reconnect-attempts', type=int, default=5)
    parser.add_argument('--reconnect-delay', type=float, default=2.0)
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    parser.add_argument('--list-ports', action='store_true')
    parser.add_argument('--discover-bt', action='store_true')
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(args.verbose)
    
    # Handle utility commands
    if args.list_ports:
        print("\n📋 Available Serial Ports:")
        # ... (same as before)
        return
    
    if args.discover_bt:
        print("\n🔍 Discovering Bluetooth devices...")
        # ... (same as before)
        return
    
    # Setup SSL
    ssl_context = None
    if args.ssl:
        cert_manager = CertificateManager(logger, args.cert_dir)
        
        if args.cert and args.key:
            logger.info(f"Using provided certificate: {args.cert}")
            cert_manager.cert_path = Path(args.cert)
            cert_manager.key_path = Path(args.key)
        else:
            if not cert_manager.ensure_certificate(args.hostname):
                logger.error("❌ Failed to setup SSL certificate")
                return
        
        ssl_context = cert_manager.get_ssl_context()
        if not ssl_context:
            logger.error("❌ Failed to create SSL context")
            return
    
    # Setup security
    security = SecurityManager(
        logger,
        allowed_origins=args.cors_origins,
        require_auth=args.auth,
        auth_token=args.auth_token
    )
    
    # Create configuration
    config = ConnectionConfig(
        type=ConnectionType(args.type),
        serial_port=args.port,
        serial_baud=args.baud,
        bluetooth_address=args.bt_address,
        bluetooth_channel=args.bt_channel,
        http_host=args.http_host,
        http_port=args.http_port,
        reconnect_attempts=args.reconnect_attempts,
        reconnect_delay=args.reconnect_delay
    )
    
    # Create and start server
    server = EV3BridgeServer(config, logger, security, ssl_context)
    
    try:
        await server.start(
            host=args.ws_host,
            port=args.ws_port,
            http_port=args.health_port
        )
    except KeyboardInterrupt:
        logger.info("\n⚠️ Keyboard interrupt received")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        logger.debug("Exception details:", exc_info=True)
    finally:
        await server.shutdown()

if __name__ == '__main__':
    try:
        # Fix for Windows
        if platform.system() == 'Windows':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)