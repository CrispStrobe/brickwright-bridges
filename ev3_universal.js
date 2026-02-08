// Name: LEGO EV3 Universal
// ID: CrispStrobe/ev3_universal
// Description: Universal control for LEGO EV3 Mindstorms (Direct/LMS).
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("LEGO EV3 Comprehensive Extension must run unsandboxed");
  }

  const Cast = Scratch.Cast;

  // ============================================================================
  // INTERNATIONALIZATION (i18n)
  // ============================================================================

  const translations = {
    en: {
      extensionName: 'EV3 Comprehensive',
      connectionMode: 'Connection',
      setMode: 'set connection mode to [MODE]',
      connect: 'connect [PARAM]',
      disconnect: 'disconnect',
      isConnected: 'connected?',
      
      // Bridge configuration
      setBridgeURL: 'set bridge URL to [URL]',
      setBridgePort: 'set bridge port to [PORT]',
      enableSSL: 'enable SSL/TLS (wss://)',
      disableSSL: 'disable SSL/TLS (ws://)',
      setAuthToken: 'set auth token to [TOKEN]',
      clearAuthToken: 'clear auth token',
      testBridge: 'test bridge connection',
      
      setEV3IP: 'set EV3 IP to [IP]',
      setLMSApiUrl: 'set LMS API to [URL] port [PORT]',
      testConnection: 'test EV3 connection',
      testCompiler: 'test compiler',
      
      // Transpilation
      transpilation: "Code Generation & Compilation",
      transpileToLMS: "generate LMS assembly code",
      showLMSCode: "show generated LMS code",
      downloadLMSCode: "download as .lms file",
      compileToRBF: "compile to RBF bytecode",
      showRBFCode: "show RBF bytecode (hex)",
      downloadRBF: "download as .rbf file",
      uploadAndRun: "upload RBF to EV3 and run",
      showDebugLog: "show transpilation diagnostics",
      
      // Motors
      motors: "Motors",
      motorRun: "motor [PORT] run at [POWER]%",
      motorRunTime: "motor [PORT] run for [TIME] seconds at [POWER]%",
      motorRunRotations: "motor [PORT] run [ROTATIONS] rotations at [POWER]%",
      motorRunDegrees: "motor [PORT] run [DEGREES] degrees at [POWER]%",
      motorStop: "motor [PORT] stop [BRAKE]",
      motorReset: "reset motor [PORT]",
      motorPolarity: "set motor [PORT] polarity [POLARITY]",
      tankDrive: "tank drive L:[LEFT] R:[RIGHT] for [VALUE] [UNIT]",
      steerDrive: "steer [STEERING] speed [SPEED]% for [VALUE] [UNIT]",
      motorPosition: "motor [PORT] position",
      motorSpeed: "motor [PORT] speed",
      
      // Sensors
      sensors: "Sensors",
      touchSensor: "touch sensor [PORT] pressed?",
      touchSensorBumped: "touch sensor [PORT] bumped?",
      colorSensor: "color sensor [PORT] [MODE]",
      colorSensorRGB: "color sensor [PORT] RGB [COMPONENT]",
      ultrasonicSensor: "ultrasonic sensor [PORT] distance [UNIT]",
      ultrasonicListen: "ultrasonic sensor [PORT] detect?",
      gyroSensor: "gyro sensor [PORT] [MODE]",
      gyroReset: "reset gyro sensor [PORT]",
      irProximity: "infrared [PORT] proximity",
      irBeaconHeading: "infrared [PORT] beacon heading ch[CHANNEL]",
      irBeaconDistance: "infrared [PORT] beacon distance ch[CHANNEL]",
      irRemoteButton: "infrared [PORT] ch[CHANNEL] button [BUTTON] pressed?",
      
      // Display
      display: "Display",
      screenClear: "clear screen",
      screenText: "show text [TEXT] at x:[X] y:[Y]",
      screenTextLarge: "show large text [TEXT] at x:[X] y:[Y]",
      drawPixel: "draw pixel at x:[X] y:[Y]",
      drawLine: "draw line from x1:[X1] y1:[Y1] to x2:[X2] y2:[Y2]",
      drawCircle: "draw circle at x:[X] y:[Y] radius:[R] [FILL]",
      drawRectangle: "draw rectangle x:[X] y:[Y] width:[W] height:[H] [FILL]",
      screenUpdate: "update screen",
      screenInvert: "invert screen",
      
      // Sound
      sound: "Sound",
      playTone: "play tone [FREQ] Hz for [DURATION] ms",
      playNote: "play note [NOTE] for [DURATION] beats",
      beep: "beep",
      setVolume: "set volume to [VOLUME]%",
      getVolume: "volume %",
      stopSound: "stop all sounds",
      
      // LEDs
      leds: "LEDs",
      setLED: "set LED to [COLOR]",
      ledAllOff: "turn all LEDs off",
      
      // Buttons
      buttons: "Buttons",
      buttonPressed: "button [BUTTON] pressed?",
      waitForButton: "wait for button [BUTTON]",
      
      // System
      system: "System",
      batteryLevel: "battery level %",
      batteryCurrent: "battery current mA",
      batteryVoltage: "battery voltage V",
      freeMemory: "free memory KB",
      
      // Timers
      timers: "Timers",
      resetTimer: "reset timer [TIMER]",
      timerValue: "timer [TIMER]",
      waitSeconds: "wait [TIME] seconds",
      waitMillis: "wait [TIME] milliseconds",
      
      // Messages
      connected: "Connected",
      notConnected: "Not connected",
      compilationSuccess: "✅ Compilation successful!",
      compilationFailed: "❌ Compilation failed",
      noCodeGenerated: "No LMS code generated yet!",
      generateFirst: "Generate LMS code first!",
      compileFirst: "Compile to RBF first!",
      downloaded: "Downloaded",
    },
    
    de: {
      extensionName: 'EV3 Umfassend',
      connectionMode: 'Verbindung',
      setMode: 'setze Verbindungsmodus auf [MODE]',
      connect: 'verbinden [PARAM]',
      disconnect: 'trennen',
      isConnected: 'verbunden?',
      
      setBridgeURL: 'setze Bridge-URL auf [URL]',
      setBridgePort: 'setze Bridge-Port auf [PORT]',
      enableSSL: 'aktiviere SSL/TLS (wss://)',
      disableSSL: 'deaktiviere SSL/TLS (ws://)',
      setAuthToken: 'setze Auth-Token auf [TOKEN]',
      clearAuthToken: 'lösche Auth-Token',
      testBridge: 'teste Bridge-Verbindung',
      
      setEV3IP: 'setze EV3-IP auf [IP]',
      setLMSApiUrl: 'setze LMS-API auf [URL] Port [PORT]',
      testConnection: 'teste EV3-Verbindung',
      testCompiler: 'teste Compiler',
      
      transpilation: "Code-Generierung & Kompilierung",
      transpileToLMS: "generiere LMS Assembly Code",
      showLMSCode: "zeige generierten LMS Code",
      downloadLMSCode: "als .lms Datei herunterladen",
      compileToRBF: "zu RBF Bytecode kompilieren",
      showRBFCode: "zeige RBF Bytecode (Hex)",
      downloadRBF: "als .rbf Datei herunterladen",
      uploadAndRun: "RBF zu EV3 hochladen und ausführen",
      showDebugLog: "zeige Transpilierungs-Diagnose",
      
      motors: "Motoren",
      motorRun: "Motor [PORT] läuft mit [POWER]%",
      motorRunTime: "Motor [PORT] läuft für [TIME] Sekunden mit [POWER]%",
      motorRunRotations: "Motor [PORT] läuft [ROTATIONS] Umdrehungen mit [POWER]%",
      motorRunDegrees: "Motor [PORT] läuft [DEGREES] Grad mit [POWER]%",
      motorStop: "Motor [PORT] stopp [BRAKE]",
      motorReset: "Motor [PORT] zurücksetzen",
      motorPolarity: "setze Motor [PORT] Polarität [POLARITY]",
      tankDrive: "Kettenantrieb L:[LEFT] R:[RIGHT] für [VALUE] [UNIT]",
      steerDrive: "Lenken [STEERING] Geschw. [SPEED]% für [VALUE] [UNIT]",
      motorPosition: "Motor [PORT] Position",
      motorSpeed: "Motor [PORT] Geschwindigkeit",
      
      sensors: "Sensoren",
      touchSensor: "Berührungssensor [PORT] gedrückt?",
      touchSensorBumped: "Berührungssensor [PORT] gestoßen?",
      colorSensor: "Farbsensor [PORT] [MODE]",
      colorSensorRGB: "Farbsensor [PORT] RGB [COMPONENT]",
      ultrasonicSensor: "Ultraschallsensor [PORT] Entfernung [UNIT]",
      ultrasonicListen: "Ultraschallsensor [PORT] erkennt?",
      gyroSensor: "Gyrosensor [PORT] [MODE]",
      gyroReset: "Gyrosensor [PORT] zurücksetzen",
      irProximity: "Infrarot [PORT] Nähe",
      irBeaconHeading: "Infrarot [PORT] Bake Richtung Kanal[CHANNEL]",
      irBeaconDistance: "Infrarot [PORT] Bake Entfernung Kanal[CHANNEL]",
      irRemoteButton: "Infrarot [PORT] Kanal[CHANNEL] Taste [BUTTON] gedrückt?",
      
      display: "Anzeige",
      screenClear: "Bildschirm löschen",
      screenText: "zeige Text [TEXT] bei x:[X] y:[Y]",
      screenTextLarge: "zeige großen Text [TEXT] bei x:[X] y:[Y]",
      drawPixel: "zeichne Pixel bei x:[X] y:[Y]",
      drawLine: "zeichne Linie von x1:[X1] y1:[Y1] zu x2:[X2] y2:[Y2]",
      drawCircle: "zeichne Kreis bei x:[X] y:[Y] Radius:[R] [FILL]",
      drawRectangle: "zeichne Rechteck x:[X] y:[Y] Breite:[W] Höhe:[H] [FILL]",
      screenUpdate: "Bildschirm aktualisieren",
      screenInvert: "Bildschirm invertieren",
      
      sound: "Sound",
      playTone: "spiele Ton [FREQ] Hz für [DURATION] ms",
      playNote: "spiele Note [NOTE] für [DURATION] Takte",
      beep: "piep",
      setVolume: "setze Lautstärke auf [VOLUME]%",
      getVolume: "Lautstärke %",
      stopSound: "alle Sounds stoppen",
      
      leds: "LEDs",
      setLED: "setze LED auf [COLOR]",
      ledAllOff: "alle LEDs ausschalten",
      
      buttons: "Tasten",
      buttonPressed: "Taste [BUTTON] gedrückt?",
      waitForButton: "warte auf Taste [BUTTON]",
      
      system: "System",
      batteryLevel: "Batteriestand %",
      batteryCurrent: "Batteriestrom mA",
      batteryVoltage: "Batteriespannung V",
      freeMemory: "freier Speicher KB",
      
      timers: "Timer",
      resetTimer: "Timer [TIMER] zurücksetzen",
      timerValue: "Timer [TIMER]",
      waitSeconds: "warte [TIME] Sekunden",
      waitMillis: "warte [TIME] Millisekunden",
      
      connected: "Verbunden",
      notConnected: "Nicht verbunden",
      compilationSuccess: "✅ Kompilierung erfolgreich!",
      compilationFailed: "❌ Kompilierung fehlgeschlagen",
      noCodeGenerated: "Noch kein LMS Code generiert!",
      generateFirst: "Generiere zuerst LMS Code!",
      compileFirst: "Kompiliere zuerst zu RBF!",
      downloaded: "Heruntergeladen",
    }
  };

  function detectLanguage() {
    try {
      if (window.ReduxStore && window.ReduxStore.getState) {
        const state = window.ReduxStore.getState();
        const reduxLocale = state.locales?.locale;
        if (reduxLocale && typeof reduxLocale === "string") {
          return reduxLocale.toLowerCase().startsWith("de") ? "de" : "en";
        }
      }
    } catch (e) {}

    try {
      const twSettings = localStorage.getItem("tw:language");
      if (twSettings) {
        return twSettings.toLowerCase().startsWith("de") ? "de" : "en";
      }
    } catch (e) {}

    try {
      const navLang = navigator.language;
      if (navLang) {
        return navLang.toLowerCase().startsWith("de") ? "de" : "en";
      }
    } catch (e) {}

    return "en";
  }

  let currentLang = detectLanguage();

  function t(key) {
    return translations[currentLang][key] || translations["en"][key] || key;
  }

  // ============================================================================
  // DEBUG LOGGER
  // ============================================================================

  const LOG_LEVEL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  const CURRENT_LEVEL = LOG_LEVEL.DEBUG; // Set to DEBUG for verbose logging

  const log = {
    debug: (...args) => CURRENT_LEVEL <= LOG_LEVEL.DEBUG && console.log("🔵 [EV3]", ...args),
    info: (...args) => CURRENT_LEVEL <= LOG_LEVEL.INFO && console.log("🟢 [EV3]", ...args),
    warn: (...args) => CURRENT_LEVEL <= LOG_LEVEL.WARN && console.warn("⚠️ [EV3]", ...args),
    error: (...args) => CURRENT_LEVEL <= LOG_LEVEL.ERROR && console.error("❌ [EV3]", ...args),
  };

  // ============================================================================
  // EV3 PROTOCOL CONSTANTS
  // ============================================================================

  const OP = {
    INPUT_DEVICE: 0x99,
    INPUT_READ: 0x9a,
    INPUT_READSI: 0x9d,
    OUTPUT_STOP: 0xa3,
    OUTPUT_POWER: 0xa4,
    OUTPUT_SPEED: 0xa5,
    OUTPUT_START: 0xa6,
    OUTPUT_POLARITY: 0xa7,
    OUTPUT_READ: 0xa8,
    OUTPUT_STEP_SPEED: 0xae,
    OUTPUT_TIME_SPEED: 0xaf,
    OUTPUT_STEP_POWER: 0xac,
    OUTPUT_TIME_POWER: 0xad,
    OUTPUT_RESET: 0xa2,
    OUTPUT_CLR_COUNT: 0xb2,
    SOUND: 0x94,
    UI_DRAW: 0x84,
    UI_WRITE: 0x82,
    UI_READ: 0x81,
    UI_BUTTON: 0x83,
    TIMER_WAIT: 0x85,
    TIMER_READY: 0x86,
    TIMER_READ: 0x87,
    INFO: 0x7c,
    DirectCmd: 0x00,
    DirectCmdNoReply: 0x80
  };

  const CMD = {
    READY_SI: 0x1d,
    TONE: 0x01,
    BREAK: 0x00,
    FILLWINDOW: 0x13,
    UPDATE: 0x00,
    TEXT: 0x05,
    LINE: 0x03,
    CIRCLE: 0x04,
    FILLCIRCLE: 0x18,
    RECT: 0x0a,
    FILLRECT: 0x09,
    PIXEL: 0x02,
    INVERSERECT: 0x10,
    SELECT_FONT: 0x1c,
    LED: 0x1b,
    SHORTPRESS: 0x01,
    WAIT_FOR_PRESS: 0x03,
    FLUSH: 0x04,
    PRESSED: 0x09,
    GET_VBATT: 0x01,
    GET_IBATT: 0x02,
    GET_LBATT: 0x12,
    GET_VOLUME: 0x16,
    SET_VOLUME: 0x01,
    GET_FREE: 0x04
  };

  const LC0 = (v) => {
    if (v >= 0 && v <= 31) return [v];
    if (v >= -31 && v < 0) return [0x40 | (v & 0x1f)];
    return LC1(v);
  };

  const LC1 = (v) => [0x81, v & 0xff];
  const LC2 = (v) => [0x82, v & 0xff, (v >> 8) & 0xff];
  const LC4 = (v) => [0x83, v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff];
  const LCS = (str) => {
    const bytes = [0x84];
    for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
    bytes.push(0x00);
    return bytes;
  };
  const GV0 = (i) => [0x60 | (i & 0x1f)];

  const Base64Util = {
    uint8ArrayToBase64: (array) => btoa(String.fromCharCode.apply(null, array)),
    base64ToUint8Array: (base64) => {
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      return array;
    },
  };

  // ============================================================================
  // JSONRPC CLASS (For Scratch Link)
  // ============================================================================

  class JSONRPC {
    constructor() {
      this._requestID = 0;
      this._openRequests = {};
    }
    _sendRequest(method, params, id) {
      const request = { jsonrpc: "2.0", method, params };
      if (id !== null) request.id = id;
      this._sendMessage(request);
    }
    _handleMessage(json) {
      if (json.method) this._handleRequest(json);
      else this._handleResponse(json);
    }
    _handleResponse(json) {
      const { result, error, id } = json;
      const req = this._openRequests[id];
      if (req) {
        delete this._openRequests[id];
        error ? req.reject(error) : req.resolve(result);
      }
    }
    _handleRequest(json) {
      if (this.didReceiveCall) this.didReceiveCall(json.method, json.params);
    }
    sendRemoteRequest(method, params) {
      const id = this._requestID++;
      return new Promise((resolve, reject) => {
        this._openRequests[id] = { resolve, reject };
        this._sendRequest(method, params, id);
      });
    }
  }

  // ============================================================================
  // CONNECTION BACKENDS
  // ============================================================================

  // SCRATCH LINK BACKEND (Bluetooth)
  class ScratchLinkBackend extends JSONRPC {
    constructor(runtime, extensionId, onConnect, onMessage) {
      super();
      log.debug("ScratchLinkBackend: Initializing");
      this._runtime = runtime;
      this._extensionId = extensionId;
      this._onConnect = onConnect;
      this._onMessage = onMessage;
      this._connected = false;
      
      this._socket = this._runtime.getScratchLinkSocket('BT');
      this._socket.setOnOpen(this._onOpen.bind(this));
      this._socket.setOnClose(this._onClose.bind(this));
      this._socket.setOnError(this._onError.bind(this));
      this._socket.setHandleMessage(this._handleMessage.bind(this));
      this._sendMessage = this._socket.sendMessage.bind(this._socket);
      log.debug("ScratchLinkBackend: Initialized");
    }

    connect() {
      log.info("ScratchLinkBackend: Starting connection");
      this._socket.open();
    }

    _onOpen() {
      log.info("ScratchLinkBackend: Socket opened, discovering devices");
      this.sendRemoteRequest('discover', { majorDeviceClass: 8, minorDeviceClass: 1 });
    }

    didReceiveCall(method, params) {
      log.debug("ScratchLinkBackend: Received call", method, params);
      if (method === 'didDiscoverPeripheral') {
        log.info("ScratchLinkBackend: Discovered peripheral", params.name);
        if (params.name && params.name.includes('EV3')) {
          log.info("ScratchLinkBackend: Connecting to EV3", params.peripheralId);
          this.sendRemoteRequest('connect', { peripheralId: params.peripheralId, pin: '1234' })
            .then(() => {
              log.info("ScratchLinkBackend: Connected successfully");
              this._connected = true;
              this._onConnect();
            })
            .catch(err => log.error("ScratchLinkBackend: Connection failed", err));
        }
      } else if (method === 'didReceiveMessage') {
        const data = Base64Util.base64ToUint8Array(params.message);
        log.debug("ScratchLinkBackend: Received message", data.length, "bytes");
        this._onMessage(data);
      }
    }

    async send(data) {
      if (!this._connected) {
        log.warn("ScratchLinkBackend: Not connected, cannot send");
        return;
      }
      log.debug("ScratchLinkBackend: Sending", data.length, "bytes");
      const base64 = Base64Util.uint8ArrayToBase64(data);
      return this.sendRemoteRequest('send', { message: base64, encoding: 'base64' });
    }

    _onClose() {
      log.info("ScratchLinkBackend: Connection closed");
      this._connected = false;
    }
    
    _onError(e) {
      log.error("ScratchLinkBackend: Error", e);
    }
    
    disconnect() {
      log.info("ScratchLinkBackend: Disconnecting");
      this._socket.close();
    }
    
    isConnected() {
      return this._connected;
    }
  }

  // SERIAL BACKEND (Web Serial API)
  class SerialBackend {
    constructor(onConnect, onMessage) {
      log.debug("SerialBackend: Initializing");
      this._onConnect = onConnect;
      this._onMessage = onMessage;
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.connected = false;
      log.debug("SerialBackend: Initialized");
    }

    async connect() {
      log.info("SerialBackend: Starting connection");
      if (!navigator.serial) {
        log.error("SerialBackend: Web Serial API not available");
        return false;
      }
      
      try {
        log.debug("SerialBackend: Requesting port");
        this.port = await navigator.serial.requestPort();
        log.debug("SerialBackend: Port selected, opening at 115200 baud");
        await this.port.open({ baudRate: 115200, flowControl: 'none' });
        
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();
        this.connected = true;
        
        log.info("SerialBackend: Connected successfully");
        this._onConnect();
        this._readLoop();
        return true;
      } catch (e) {
        log.error("SerialBackend: Connection failed", e);
        return false;
      }
    }

    async _readLoop() {
      log.debug("SerialBackend: Starting read loop");
      while (this.connected && this.reader) {
        try {
          const { value, done } = await this.reader.read();
          if (done) {
            log.debug("SerialBackend: Read stream done");
            break;
          }
          if (value) {
            log.debug("SerialBackend: Received", value.length, "bytes");
            this._onMessage(value);
          }
        } catch (e) {
          log.error("SerialBackend: Read error", e);
          break;
        }
      }
      log.debug("SerialBackend: Read loop ended");
    }

    async send(data) {
      if (this.writer) {
        log.debug("SerialBackend: Sending", data.length, "bytes");
        await this.writer.write(data);
      } else {
        log.warn("SerialBackend: No writer available");
      }
    }

    disconnect() {
      log.info("SerialBackend: Disconnecting");
      this.connected = false;
      if (this.reader) this.reader.cancel();
      if (this.writer) this.writer.releaseLock();
      if (this.port) this.port.close();
    }
    
    isConnected() {
      return this.connected;
    }
  }

  // BRIDGE BACKEND (WebSocket)
  class BridgeBackend {
    constructor(onConnect, onMessage) {
      log.debug("BridgeBackend: Initializing");
      this._onConnect = onConnect;
      this._onMessage = onMessage;
      this.ws = null;
      this.connected = false;
      log.debug("BridgeBackend: Initialized");
    }

    /**
     * Connect to bridge server
     * @param {Object} config - Connection configuration
     * @param {string} config.host - Bridge host (default: localhost)
     * @param {number} config.port - Bridge port (default: 8080)
     * @param {boolean} config.ssl - Use SSL/TLS (wss://)
     * @param {string} config.authToken - Authentication token
     */
    async connect(config = {}) {
      const {
        host = 'localhost',
        port = 8080,
        ssl = false,
        authToken = null
      } = config;

      const protocol = ssl ? 'wss' : 'ws';
      let url = `${protocol}://${host}:${port}`;
      
      // Add auth token as query parameter if provided
      if (authToken) {
        url += `?token=${encodeURIComponent(authToken)}`;
        log.debug("BridgeBackend: Using authentication");
      }
      
      log.info("BridgeBackend: Connecting to", url);
      
      return new Promise(resolve => {
        try {
          this.ws = new WebSocket(url);
          this.ws.binaryType = 'arraybuffer';
          
          this.ws.onopen = () => {
            log.info("BridgeBackend: Connected successfully");
            this.connected = true;
            this._onConnect();
            resolve(true);
          };
          
          this.ws.onmessage = (e) => {
            if (e.data instanceof ArrayBuffer) {
              const data = new Uint8Array(e.data);
              log.debug("BridgeBackend: Received", data.length, "bytes");
              this._onMessage(data);
            } else {
              // Handle text/JSON messages
              log.debug("BridgeBackend: Received text message", e.data);
              try {
                const json = JSON.parse(e.data);
                if (json.error) {
                  log.error("BridgeBackend: Server error:", json.error);
                }
              } catch (err) {
                log.warn("BridgeBackend: Non-JSON text message");
              }
            }
          };
          
          this.ws.onerror = (e) => {
            log.error("BridgeBackend: WebSocket error", e);
            this.connected = false;
            resolve(false);
          };
          
          this.ws.onclose = (e) => {
            log.info("BridgeBackend: Connection closed", e.code, e.reason);
            this.connected = false;
          };
          
          // Timeout after 10 seconds
          setTimeout(() => {
            if (!this.connected) {
              log.error("BridgeBackend: Connection timeout");
              if (this.ws) {
                this.ws.close();
              }
              resolve(false);
            }
          }, 10000);
          
        } catch (e) {
          log.error("BridgeBackend: Connection failed", e);
          resolve(false);
        }
      });
    }

    disconnect() {
      log.info("BridgeBackend: Disconnecting");
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.connected = false;
    }

    send(data) {
      if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        log.warn("BridgeBackend: Cannot send, not connected");
        return false;
      }
      
      try {
        log.debug("BridgeBackend: Sending", data.length, "bytes");
        this.ws.send(data);
        return true;
      } catch (e) {
        log.error("BridgeBackend: Send failed", e);
        return false;
      }
    }

    /**
     * Send a status request to the bridge
     */
    async requestStatus() {
      if (!this.connected || !this.ws) {
        return null;
      }
      
      return new Promise(resolve => {
        const handler = (e) => {
          try {
            const json = JSON.parse(e.data);
            this.ws.removeEventListener('message', handler);
            resolve(json);
          } catch (err) {
            // Not the status response
          }
        };
        
        this.ws.addEventListener('message', handler);
        this.ws.send(JSON.stringify({ command: 'status' }));
        
        setTimeout(() => {
          this.ws.removeEventListener('message', handler);
          resolve(null);
        }, 2000);
      });
    }
  }

  // HTTP BACKEND (Direct EV3 HTTP)
  class HTTPBackend {
    constructor(onConnect, onMessage) {
      log.debug("HTTPBackend: Initializing");
      this._onConnect = onConnect;
      this._onMessage = onMessage;
      this.connected = false;
      this.ev3IP = "192.168.178.50";
      this.ev3Port = 8080;
      log.debug("HTTPBackend: Initialized");
    }

    async connect(ip, port) {
      log.info("HTTPBackend: Testing connection to", ip, "port", port);
      this.ev3IP = ip || this.ev3IP;
      this.ev3Port = port || this.ev3Port;
      
      try {
        const url = `http://${this.ev3IP}:${this.ev3Port}/`;
        log.debug("HTTPBackend: Testing URL", url);
        const response = await fetch(url, { method: 'GET' });
        
        if (response.ok) {
          log.info("HTTPBackend: Connected successfully");
          this.connected = true;
          this._onConnect();
          return true;
        } else {
          log.warn("HTTPBackend: Connection test failed, status", response.status);
          return false;
        }
      } catch (e) {
        log.error("HTTPBackend: Connection failed", e);
        return false;
      }
    }

    async send(data) {
      if (!this.connected) {
        log.warn("HTTPBackend: Not connected, cannot send");
        return;
      }
      
      try {
        const url = `http://${this.ev3IP}:${this.ev3Port}/ev3`;
        log.debug("HTTPBackend: Sending to", url, data.length, "bytes");
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: data
        });
        
        if (response.ok) {
          const responseData = await response.arrayBuffer();
          const uint8Data = new Uint8Array(responseData);
          log.debug("HTTPBackend: Received response", uint8Data.length, "bytes");
          if (uint8Data.length > 0) {
            this._onMessage(uint8Data);
          }
        } else {
          log.warn("HTTPBackend: Send failed, status", response.status);
        }
      } catch (e) {
        log.error("HTTPBackend: Send error", e);
      }
    }

    disconnect() {
      log.info("HTTPBackend: Disconnecting");
      this.connected = false;
    }
    
    isConnected() {
      return this.connected;
    }
  }

  // ============================================================================
  // LMS TRANSPILER
  // ============================================================================

  class LMSTranspiler {
    constructor() {
      log.debug("LMSTranspiler: Initializing");
      this.lmsCode = "";
      this.indentLevel = 0;
      this.variableCounter = 0;
      this.labelCounter = 0;
      this.threadCounter = 0;
      this.arrayCounter = 0;
      this.variables = new Map();
      this.globalVars = [];
      this.localVars = [];
      this.timerVars = new Map();
      this.broadcastHandlers = new Map();
      this.debugLog = [];
      this.currentThread = "MAIN";
      this.spriteStates = {};
      this.errors = [];
      this.warnings = [];

      this.opcodes = {
        OUTPUT_POWER: "OUTPUT_POWER",
        OUTPUT_START: "OUTPUT_START",
        OUTPUT_STOP: "OUTPUT_STOP",
        OUTPUT_SPEED: "OUTPUT_SPEED",
        OUTPUT_TIME_POWER: "OUTPUT_TIME_POWER",
        OUTPUT_TIME_SPEED: "OUTPUT_TIME_SPEED",
        OUTPUT_STEP_POWER: "OUTPUT_STEP_POWER",
        OUTPUT_STEP_SPEED: "OUTPUT_STEP_SPEED",
        OUTPUT_RESET: "OUTPUT_RESET",
        OUTPUT_CLR_COUNT: "OUTPUT_CLR_COUNT",
        OUTPUT_POLARITY: "OUTPUT_POLARITY",
        INPUT_DEVICE: "INPUT_DEVICE",
        INPUT_READ: "INPUT_READ",
        INPUT_READSI: "INPUT_READSI",
        UI_DRAW: "UI_DRAW",
        UI_WRITE: "UI_WRITE",
        UI_READ: "UI_READ",
        UI_BUTTON: "UI_BUTTON",
        SOUND: "SOUND",
        TIMER_WAIT: "TIMER_WAIT",
        TIMER_READY: "TIMER_READY",
        TIMER_READ: "TIMER_READ",
        INFO: "INFO",
        JR: "JR",
        JR_FALSE: "JR_FALSE",
        JR_TRUE: "JR_TRUE",
        CALL: "CALL",
        RETURN: "RETURN",
        OBJECT_END: "OBJECT_END",
        ADD32: "ADD32",
        SUB32: "SUB32",
        MUL32: "MUL32",
        DIV32: "DIV32",
        CP_LT32: "CP_LT32",
        CP_GT32: "CP_GT32",
        CP_EQ32: "CP_EQ32",
        CP_GTEQ32: "CP_GTEQ32",
        JR_GTEQ32: "JR_GTEQ32",
        MOVE8_8: "MOVE8_8",
        MOVE32_32: "MOVE32_32",
        MOVE16_16: "MOVE16_16",
        MOVE32_16: "MOVE32_16",
        MATH: "MATH",
        AND8: "AND8",
        OR8: "OR8",
        XOR8: "XOR8",
        ARRAY_READ: "ARRAY_READ",
      };

      this.UI_DRAW = {
        UPDATE: "UPDATE",
        CLEAN: "CLEAN",
        PIXEL: "PIXEL",
        LINE: "LINE",
        CIRCLE: "CIRCLE",
        TEXT: "TEXT",
        FILLRECT: "FILLRECT",
        RECT: "RECT",
        INVERSERECT: "INVERSERECT",
        SELECT_FONT: "SELECT_FONT",
        FILLWINDOW: "FILLWINDOW",
        FILLCIRCLE: "FILLCIRCLE",
      };

      this.SOUND_CMD = { BREAK: "BREAK", TONE: "TONE" };
      this.UI_BUTTON_CMD = { PRESSED: "PRESSED", WAIT_FOR_PRESS: "WAIT_FOR_PRESS", FLUSH: "FLUSH" };
      this.BUTTONS = {
        UP: "UP_BUTTON",
        DOWN: "DOWN_BUTTON",
        LEFT: "LEFT_BUTTON",
        RIGHT: "RIGHT_BUTTON",
        ENTER: "ENTER_BUTTON",
        BACK: "BACK_BUTTON",
      };

      this.UI_READ_CMD = { GET_VBATT: "GET_VBATT", GET_IBATT: "GET_IBATT", GET_LBATT: "GET_LBATT", GET_VOLUME: "GET_VOLUME" };
      this.UI_WRITE_CMD = { LED: "LED", SET_VOLUME: "SET_VOLUME" };
      this.INFO_CMD = { GET_FREE: "GET_FREE" };

      this.OUTPUT_PORTS = { A: "0x01", B: "0x02", C: "0x04", D: "0x08", ALL: "0x0F" };
      this.INPUT_PORTS = { 1: "0", 2: "1", 3: "2", 4: "3" };

      this.SENSOR_TYPE = {
        NONE: "0", NXT_TOUCH: "1", NXT_LIGHT: "2", NXT_SOUND: "3", NXT_COLOR: "4",
        NXT_ULTRASONIC: "5", LARGE_MOTOR: "7", MEDIUM_MOTOR: "8",
        EV3_TOUCH: "16", EV3_COLOR: "29", EV3_ULTRASONIC: "30", EV3_GYRO: "32", EV3_IR: "33",
      };

      this.SENSOR_MODE = {
        TOUCH: "0", BUMP: "1",
        COLOR_REFLECTED: "0", COLOR_AMBIENT: "1", COLOR_COLOR: "2", COLOR_REFLECTED_RAW: "3", COLOR_RGB_RAW: "4",
        US_DIST_CM: "0", US_DIST_IN: "1", US_LISTEN: "2", US_SI_CM: "3", US_SI_IN: "4",
        GYRO_ANGLE: "0", GYRO_RATE: "1", GYRO_FAS: "2", GYRO_G_AND_A: "3", GYRO_CALIBRATE: "4",
        IR_PROX: "0", IR_SEEK: "1", IR_REMOTE: "2",
        MOTOR_DEGREE: "0", MOTOR_ROTATION: "1", MOTOR_SPEED: "2",
      };

      this.LED_COLOR = {
        OFF: "0", GREEN: "1", RED: "2", ORANGE: "3",
        GREEN_FLASH: "4", RED_FLASH: "5", ORANGE_FLASH: "6",
        GREEN_PULSE: "7", RED_PULSE: "8", ORANGE_PULSE: "9",
      };

      log.debug("LMSTranspiler: Initialized");
    }

    // [COPY PASTE: All LMSTranspiler methods from document 2, lines ~230-1600]
    // This includes: log, indent, addLine, addComment, allocateVariable, getDataType, generateLabel,
    // transpile, reset, generateHeader, processTarget, processHatBlock, generateBroadcastSubcalls,
    // processBlockChain, processBlock, and all the transpile* methods for motors, sensors, display, etc.
    
    log(message, data = null, level = "INFO") {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [LMS-${level}] ${message}`;
      if (level === "ERROR") {
        console.error(logEntry, data || "");
        this.errors.push({ timestamp, message, data });
      } else if (level === "WARN") {
        console.warn(logEntry, data || "");
        this.warnings.push({ timestamp, message, data });
      } else {
        console.log(logEntry, data || "");
      }
      this.debugLog.push({ timestamp, level, message, data });
    }

    indent() {
      return "  ".repeat(this.indentLevel);
    }

    addLine(code) {
      this.lmsCode += this.indent() + code + "\n";
      this.log(`Added line: ${code}`, null, "DEBUG");
    }

    addComment(comment) {
      this.addLine(`// ${comment}`);
    }

    allocateVariable(type, name = null, isGlobal = false) {
      const varName = name || `var${this.variableCounter++}`;
      const fullType = this.getDataType(type);
      if (isGlobal) {
        this.globalVars.push({ name: varName, type: fullType });
      } else {
        this.localVars.push({ name: varName, type: fullType });
        this.addLine(`${fullType} ${varName}`);
      }
      this.log(`Allocated variable: ${varName} (${fullType})`, { isGlobal }, "DEBUG");
      return varName;
    }

    getDataType(type) {
      const types = { 8: "DATA8", 16: "DATA16", 32: "DATA32", F: "DATAF", S: "DATAS" };
      return types[type] || "DATA32";
    }

    generateLabel(prefix = "LABEL") {
      const label = `${prefix}_${this.labelCounter++}`;
      this.log(`Generated label: ${label}`, null, "DEBUG");
      return label;
    }

    transpile() {
      this.log("=== Starting LMS Transpilation ===");
      this.reset();
      try {
        const runtime = Scratch.vm.runtime;
        const targets = runtime.targets;
        this.log("Found targets", { count: targets.length });

        for (const target of targets) {
          if (!target.isStage) {
            this.spriteStates[target.sprite.name] = {
              x: target.x || 0, y: target.y || 0, direction: target.direction || 90,
              size: target.size || 100, visible: target.visible !== false,
            };
          }
        }
        this.log("Sprite states collected", this.spriteStates);

        this.generateHeader();

        for (const target of targets) {
          this.log(`Processing ${target.isStage ? "stage" : "sprite"}`, { name: target.sprite.name });
          this.processTarget(target);
        }

        this.generateBroadcastSubcalls();

        this.addComment("End of program");
        this.addLine("OBJECT_END()");
        this.indentLevel--;
        this.addLine("}");

        this.log("=== LMS Transpilation Complete ===", {
          codeLength: this.lmsCode.length,
          lines: this.lmsCode.split("\n").length,
          errors: this.errors.length,
          warnings: this.warnings.length,
        });

        if (this.errors.length > 0) this.log("ERRORS DETECTED", this.errors, "ERROR");
        if (this.warnings.length > 0) this.log("WARNINGS DETECTED", this.warnings, "WARN");

        console.log("=== GENERATED LMS CODE ===\n" + this.lmsCode);
        return this.lmsCode;
      } catch (error) {
        this.log("CRITICAL ERROR during transpilation", { error: error.message, stack: error.stack }, "ERROR");
        console.error(error);
        throw error;
      }
    }

    reset() {
      this.lmsCode = "";
      this.indentLevel = 0;
      this.variableCounter = 0;
      this.labelCounter = 0;
      this.threadCounter = 0;
      this.arrayCounter = 0;
      this.variables.clear();
      this.globalVars = [];
      this.localVars = [];
      this.timerVars.clear();
      this.broadcastHandlers.clear();
      this.debugLog = [];
      this.errors = [];
      this.warnings = [];
      this.currentThread = "MAIN";
      this.spriteStates = {};
    }

    generateHeader() {
      this.addComment("Generated LMS Assembly from Scratch");
      this.addComment("by TurboWarp EV3 Comprehensive Extension");
      this.addComment(`Language: ${currentLang}`);
      this.addComment(`Generated: ${new Date().toISOString()}`);
      this.addLine("");
      this.addLine("vmthread MAIN");
      this.addLine("{");
      this.indentLevel++;
      this.addComment("Global variables");
      this.addLine("DATA8 layer");
      this.addLine("DATA8 port");
      this.addLine("DATA8 ports");
      this.addLine("DATA8 power");
      this.addLine("DATA8 speed");
      this.addLine("DATA8 brake");
      this.addLine("DATA8 polarity");
      this.addLine("DATA32 time_ms");
      this.addLine("DATA32 ramp_up");
      this.addLine("DATA32 ramp_down");
      this.addLine("DATA32 degrees");
      this.addLine("DATA32 rotations");
      this.addLine("DATA16 frequency");
      this.addLine("DATA16 duration");
      this.addLine("DATA8 type");
      this.addLine("DATA8 mode");
      this.addLine("DATA8 sensor_value8");
      this.addLine("DATA16 sensor_value16");
      this.addLine("DATA32 sensor_value32");
      this.addLine("DATAF sensor_valuef");
      this.addLine("DATA8 result8");
      this.addLine("DATA16 result16");
      this.addLine("DATA32 result32");
      this.addLine("DATAF resultf");
      this.addLine("DATA8 temp8");
      this.addLine("DATA16 temp16");
      this.addLine("DATA32 temp32");
      this.addLine("DATAF tempf");
      this.addLine("DATA8 button_state");
      this.addLine("DATA8 volume");
      this.addLine("");
      this.addComment("Initialize layer");
      this.addLine("MOVE8_8(0, layer)");
      this.addLine("");
      this.addComment("Initialize default motor ramp times");
      this.addLine("MOVE32_32(100, ramp_up)");
      this.addLine("MOVE32_32(100, ramp_down)");
      this.addLine("");
    }

    processTarget(target) {
      const blocks = target.blocks;
      const blockArray = blocks._blocks;
      const blockKeys = Object.keys(blockArray);
      const hatBlocks = [];
      for (const blockKey of blockKeys) {
        const block = blockArray[blockKey];
        if (block.opcode && block.opcode.startsWith("event_when")) {
          hatBlocks.push(block);
        }
      }
      this.log("Found hat blocks", { count: hatBlocks.length });
      for (const hatBlock of hatBlocks) {
        this.processHatBlock(hatBlock, blocks);
      }
    }

    processHatBlock(hatBlock, blocks) {
      const opcode = hatBlock.opcode;
      this.addComment(`Event: ${opcode}`);
      if (opcode === "event_whenflagclicked") {
        this.addComment("When green flag clicked");
        this.processBlockChain(hatBlock.next, blocks);
      } else if (opcode === "event_whenbroadcastreceived") {
        const broadcastName = this.getFieldValue(hatBlock, "BROADCAST_OPTION");
        const labelName = this.generateLabel(`ON_${this.sanitizeName(broadcastName)}`);
        this.broadcastHandlers.set(broadcastName, { label: labelName, startBlock: hatBlock.next });
        this.log(`Registered broadcast handler: ${broadcastName} -> ${labelName}`);
      } else if (opcode === "event_whenkeypressed") {
        this.addComment("WARNING: Key press events not supported in LMS");
        this.log("WARNING: Key press event not supported in LMS", null, "WARN");
      }
    }

    generateBroadcastSubcalls() {
      if (this.broadcastHandlers.size === 0) return;
      this.addLine("");
      this.addComment("Broadcast handler subcalls");
      for (const [broadcastName, handler] of this.broadcastHandlers.entries()) {
        this.addLine("");
        this.addLine(`${handler.label}:`);
        this.indentLevel++;
        if (handler.startBlock) {
          this.processBlockChain(handler.startBlock, this.currentBlocks);
        } else {
          this.addComment("Empty broadcast handler");
        }
        this.addLine("RETURN()");
        this.indentLevel--;
      }
    }

    processBlockChain(blockId, blocks) {
      this.currentBlocks = blocks;
      let currentId = blockId;
      let chainLength = 0;
      const maxChainLength = 10000;
      while (currentId) {
        const block = blocks._blocks[currentId];
        if (!block) {
          this.log("Block not found, ending chain", { blockId: currentId }, "WARN");
          break;
        }
        chainLength++;
        if (chainLength > maxChainLength) {
          this.log("WARNING: Block chain too long, stopping", { chainLength }, "WARN");
          this.addComment(`WARNING: Chain exceeded ${maxChainLength} blocks`);
          break;
        }
        this.processBlock(block, blocks);
        currentId = block.next;
      }
      this.log(`Processed block chain: ${chainLength} blocks`);
    }

    processBlock(block, blocks) {
      const opcode = block.opcode;
      this.log(`Processing block: ${opcode}`, { block: block.id });
      try {
        if (opcode === "ev3_motorRun" || opcode === "ev3lms_motorRun") {
          this.transpileMotorRun(block, blocks);
        } else if (opcode === "ev3_motorRunTime" || opcode === "ev3lms_motorRunTime") {
          this.transpileMotorRunTime(block, blocks);
        } else if (opcode === "ev3_motorRunRotations" || opcode === "ev3lms_motorRunRotations") {
          this.transpileMotorRunRotations(block, blocks);
        } else if (opcode === "ev3_motorRunDegrees" || opcode === "ev3lms_motorRunDegrees") {
          this.transpileMotorRunDegrees(block, blocks);
        } else if (opcode === "ev3_motorStop" || opcode === "ev3lms_motorStop") {
          this.transpileMotorStop(block, blocks);
        } else if (opcode === "ev3_motorReset" || opcode === "ev3lms_motorReset") {
          this.transpileMotorReset(block, blocks);
        } else if (opcode === "ev3_motorPolarity" || opcode === "ev3lms_motorPolarity") {
          this.transpileMotorPolarity(block, blocks);
        } else if (opcode === "ev3_tankDrive" || opcode === "ev3lms_tankDrive") {
          this.transpileTankDrive(block, blocks);
        } else if (opcode === "ev3_steerDrive" || opcode === "ev3lms_steerDrive") {
          this.transpileSteerDrive(block, blocks);
        } else if (opcode === "ev3_screenClear" || opcode === "ev3lms_screenClear") {
          this.transpileScreenClear(block, blocks);
        } else if (opcode === "ev3_screenText" || opcode === "ev3lms_screenText") {
          this.transpileScreenText(block, blocks);
        } else if (opcode === "ev3_screenTextLarge" || opcode === "ev3lms_screenTextLarge") {
          this.transpileScreenTextLarge(block, blocks);
        } else if (opcode === "ev3_drawPixel" || opcode === "ev3lms_drawPixel") {
          this.transpileDrawPixel(block, blocks);
        } else if (opcode === "ev3_drawLine" || opcode === "ev3lms_drawLine") {
          this.transpileDrawLine(block, blocks);
        } else if (opcode === "ev3_drawCircle" || opcode === "ev3lms_drawCircle") {
          this.transpileDrawCircle(block, blocks);
        } else if (opcode === "ev3_drawRectangle" || opcode === "ev3lms_drawRectangle") {
          this.transpileDrawRectangle(block, blocks);
        } else if (opcode === "ev3_screenUpdate" || opcode === "ev3lms_screenUpdate") {
          this.transpileScreenUpdate(block, blocks);
        } else if (opcode === "ev3_screenInvert" || opcode === "ev3lms_screenInvert") {
          this.transpileScreenInvert(block, blocks);
        } else if (opcode === "ev3_playTone" || opcode === "ev3lms_playTone") {
          this.transpilePlayTone(block, blocks);
        } else if (opcode === "ev3_playNote" || opcode === "ev3lms_playNote") {
          this.transpilePlayNote(block, blocks);
        } else if (opcode === "ev3_beep" || opcode === "ev3lms_beep") {
          this.transpileBeep(block, blocks);
        } else if (opcode === "ev3_setVolume" || opcode === "ev3lms_setVolume") {
          this.transpileSetVolume(block, blocks);
        } else if (opcode === "ev3_stopSound" || opcode === "ev3lms_stopSound") {
          this.transpileStopSound(block, blocks);
        } else if (opcode === "ev3_setLED" || opcode === "ev3lms_setLED") {
          this.transpileSetLED(block, blocks);
        } else if (opcode === "ev3_ledAllOff" || opcode === "ev3lms_ledAllOff") {
          this.transpileLEDAllOff(block, blocks);
        } else if (opcode === "ev3_buttonPressed" || opcode === "ev3lms_buttonPressed") {
          this.transpileButtonPressed(block, blocks);
        } else if (opcode === "ev3_waitForButton" || opcode === "ev3lms_waitForButton") {
          this.transpileWaitForButton(block, blocks);
        } else if (opcode === "ev3_touchSensor" || opcode === "ev3lms_touchSensor") {
          this.transpileTouchSensor(block, blocks);
        } else if (opcode === "ev3_touchSensorBumped" || opcode === "ev3lms_touchSensorBumped") {
          this.transpileTouchSensorBumped(block, blocks);
        } else if (opcode === "ev3_colorSensor" || opcode === "ev3lms_colorSensor") {
          this.transpileColorSensor(block, blocks);
        } else if (opcode === "ev3_colorSensorRGB" || opcode === "ev3lms_colorSensorRGB") {
          this.transpileColorSensorRGB(block, blocks);
        } else if (opcode === "ev3_ultrasonicSensor" || opcode === "ev3lms_ultrasonicSensor") {
          this.transpileUltrasonicSensor(block, blocks);
        } else if (opcode === "ev3_ultrasonicListen" || opcode === "ev3lms_ultrasonicListen") {
          this.transpileUltrasonicListen(block, blocks);
        } else if (opcode === "ev3_gyroSensor" || opcode === "ev3lms_gyroSensor") {
          this.transpileGyroSensor(block, blocks);
        } else if (opcode === "ev3_gyroReset" || opcode === "ev3lms_gyroReset") {
          this.transpileGyroReset(block, blocks);
        } else if (opcode === "ev3_irProximity" || opcode === "ev3lms_irProximity") {
          this.transpileIRProximity(block, blocks);
        } else if (opcode === "ev3_irBeaconHeading" || opcode === "ev3lms_irBeaconHeading") {
          this.transpileIRBeaconHeading(block, blocks);
        } else if (opcode === "ev3_irBeaconDistance" || opcode === "ev3lms_irBeaconDistance") {
          this.transpileIRBeaconDistance(block, blocks);
        } else if (opcode === "ev3_irRemoteButton" || opcode === "ev3lms_irRemoteButton") {
          this.transpileIRRemoteButton(block, blocks);
        } else if (opcode === "control_wait") {
          this.transpileWait(block, blocks);
        } else if (opcode === "ev3_waitSeconds" || opcode === "ev3lms_waitSeconds") {
          this.transpileWaitSeconds(block, blocks);
        } else if (opcode === "ev3_waitMillis" || opcode === "ev3lms_waitMillis") {
          this.transpileWaitMillis(block, blocks);
        } else if (opcode === "control_repeat") {
          this.transpileRepeat(block, blocks);
        } else if (opcode === "control_forever") {
          this.transpileForever(block, blocks);
        } else if (opcode === "control_if") {
          this.transpileIf(block, blocks);
        } else if (opcode === "control_if_else") {
          this.transpileIfElse(block, blocks);
        } else if (opcode === "control_repeat_until") {
          this.transpileRepeatUntil(block, blocks);
        } else if (opcode === "control_stop") {
          this.transpileStop(block, blocks);
        } else if (opcode === "event_broadcast") {
          this.transpileBroadcast(block, blocks);
        } else if (opcode === "event_broadcastandwait") {
          this.transpileBroadcastAndWait(block, blocks);
        } else if (opcode === "motion_movesteps") {
          this.transpileMoveSteps(block, blocks);
        } else if (opcode === "motion_turnright") {
          this.transpileTurnRight(block, blocks);
        } else if (opcode === "motion_turnleft") {
          this.transpileTurnLeft(block, blocks);
        } else if (opcode === "data_setvariableto") {
          this.transpileSetVariable(block, blocks);
        } else if (opcode === "data_changevariableby") {
          this.transpileChangeVariable(block, blocks);
        } else if (opcode === "looks_say" || opcode === "looks_sayforsecs") {
          this.transpileSay(block, blocks);
        } else if (opcode === "sound_play" || opcode === "sound_playuntildone") {
          this.transpilePlaySound(block, blocks);
        } else if (opcode === "ev3_resetTimer" || opcode === "ev3lms_resetTimer") {
          this.transpileResetTimer(block, blocks);
        } else if (opcode === "ev3_timerValue" || opcode === "ev3lms_timerValue") {
          this.transpileTimerValue(block, blocks);
        } else if (opcode === "ev3_batteryLevel" || opcode === "ev3lms_batteryLevel") {
          this.transpileBatteryLevel(block, blocks);
        } else if (opcode === "ev3_batteryVoltage" || opcode === "ev3lms_batteryVoltage") {
          this.transpileBatteryVoltage(block, blocks);
        } else if (opcode === "ev3_batteryCurrent" || opcode === "ev3lms_batteryCurrent") {
          this.transpileBatteryCurrent(block, blocks);
        } else if (opcode === "ev3_freeMemory" || opcode === "ev3lms_freeMemory") {
          this.transpileFreeMemory(block, blocks);
        } else {
          this.addComment(`TODO: Unsupported block: ${opcode}`);
          this.log(`WARNING: Unsupported block: ${opcode}`, null, "WARN");
        }
      } catch (error) {
        this.log(`ERROR processing block ${opcode}`, { error: error.message, stack: error.stack }, "ERROR");
        this.addComment(`ERROR: ${opcode} - ${error.message}`);
      }
    }

    transpileMotorRun(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const power = this.getInputValue(block, "POWER", blocks);
      this.addComment(`Motor ${port} run at ${power}%`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${power}, power)`);
      this.addLine(`OUTPUT_POWER(0, port, power)`);
      this.addLine(`OUTPUT_START(0, port)`);
    }

    transpileMotorRunTime(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const time = this.getInputValue(block, "TIME", blocks);
      const power = this.getInputValue(block, "POWER", blocks);
      this.addComment(`Motor ${port} run for ${time} seconds at ${power}%`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${power}, power)`);
      const timeMs = this.evaluateExpression(time, "*", 1000, 32);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
      this.addLine(`OUTPUT_TIME_POWER(0, port, power, ramp_up, time_ms, ramp_down, 1)`);
    }

    transpileMotorRunRotations(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const rotations = this.getInputValue(block, "ROTATIONS", blocks);
      const power = this.getInputValue(block, "POWER", blocks);
      this.addComment(`Motor ${port} run ${rotations} rotations at ${power}%`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${power}, power)`);
      const degreesValue = this.evaluateExpression(rotations, "*", 360, 32);
      this.addLine(`MOVE32_32(${degreesValue}, degrees)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, power, 30, degrees, 30, 1)`);
    }

    transpileMotorRunDegrees(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const degrees = this.getInputValue(block, "DEGREES", blocks);
      const power = this.getInputValue(block, "POWER", blocks);
      this.addComment(`Motor ${port} run ${degrees} degrees at ${power}%`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${power}, power)`);
      this.addLine(`MOVE32_32(${degrees}, degrees)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, power, 10, degrees, 10, 1)`);
    }

    transpileMotorStop(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const brake = this.getInputValue(block, "BRAKE", blocks);
      const brakeMode = brake === '"coast"' || brake === "coast" ? "0" : "1";
      this.addComment(`Motor ${port} stop (brake: ${brake})`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`OUTPUT_STOP(0, port, ${brakeMode})`);
    }

    transpileMotorReset(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      this.addComment(`Reset motor ${port}`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`OUTPUT_RESET(0, port)`);
      this.addLine(`OUTPUT_CLR_COUNT(0, port)`);
    }

    transpileMotorPolarity(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const polarity = this.getInputValue(block, "POLARITY", blocks);
      this.addComment(`Set motor ${port} polarity to ${polarity}`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${polarity}, polarity)`);
      this.addLine(`OUTPUT_POLARITY(0, port, polarity)`);
    }

    transpileTankDrive(block, blocks) {
      const left = this.getInputValue(block, "LEFT", blocks);
      const right = this.getInputValue(block, "RIGHT", blocks);
      const value = this.getInputValue(block, "VALUE", blocks);
      const unit = this.getInputValue(block, "UNIT", blocks);
      this.addComment(`Tank drive L:${left} R:${right} for ${value} ${unit}`);
      const leftPort = this.OUTPUT_PORTS.B;
      const rightPort = this.OUTPUT_PORTS.C;
      if (unit === '"seconds"' || unit === "seconds" || unit === "'seconds'") {
        const timeMs = this.evaluateExpression(value, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_TIME_POWER(0, port, ${left}, ramp_up, time_ms, ramp_down, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(`OUTPUT_TIME_POWER(0, port, ${right}, ramp_up, time_ms, ramp_down, 1)`);
      } else if (unit === '"rotations"' || unit === "rotations" || unit === "'rotations'") {
        const degreesValue = this.evaluateExpression(value, "*", 360, 32);
        this.addLine(`MOVE32_32(${degreesValue}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${left}, 30, degrees, 30, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${right}, 30, degrees, 30, 1)`);
      } else {
        this.addLine(`MOVE32_32(${value}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${left}, 10, degrees, 10, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${right}, 10, degrees, 10, 1)`);
      }
    }

    transpileSteerDrive(block, blocks) {
      const steering = this.getInputValue(block, "STEERING", blocks);
      const speed = this.getInputValue(block, "SPEED", blocks);
      const value = this.getInputValue(block, "VALUE", blocks);
      const unit = this.getInputValue(block, "UNIT", blocks);
      this.addComment(`Steer drive steering:${steering} speed:${speed} for ${value} ${unit}`);
      const leftVar = this.allocateVariable(8, "steer_left");
      const rightVar = this.allocateVariable(8, "steer_right");
      const steerVal = this.allocateVariable(8, "steer_val");
      this.addLine(`MOVE8_8(${steering}, ${steerVal})`);
      this.addLine(`MOVE8_8(${speed}, ${leftVar})`);
      this.addLine(`MOVE8_8(${speed}, ${rightVar})`);
      const skipLeft = this.generateLabel("SKIP_LEFT_ADJUST");
      const skipRight = this.generateLabel("SKIP_RIGHT_ADJUST");
      const continueSteer = this.generateLabel("CONTINUE_STEER");
      this.addLine(`JR_LT8(${steerVal}, 0, ${skipRight})`);
      this.addLine(`MUL8(${speed}, ${steerVal}, temp16)`);
      this.addLine(`DIV16(temp16, 100, temp16)`);
      this.addLine(`SUB16(${speed}, temp16, temp16)`);
      this.addLine(`MOVE16_8(temp16, ${rightVar})`);
      this.addLine(`JR(${continueSteer})`);
      this.addLine(`${skipRight}:`);
      this.addLine(`JR_GT8(${steerVal}, 0, ${skipLeft})`);
      this.addLine(`MUL8(${speed}, ${steerVal}, temp16)`);
      this.addLine(`DIV16(temp16, -100, temp16)`);
      this.addLine(`SUB16(${speed}, temp16, temp16)`);
      this.addLine(`MOVE16_8(temp16, ${leftVar})`);
      this.addLine(`${skipLeft}:`);
      this.addLine(`${continueSteer}:`);
      const leftPort = this.OUTPUT_PORTS.B;
      const rightPort = this.OUTPUT_PORTS.C;
      if (unit === '"seconds"' || unit === "seconds" || unit === "'seconds'") {
        const timeMs = this.evaluateExpression(value, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_TIME_POWER(0, port, ${leftVar}, ramp_up, time_ms, ramp_down, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(`OUTPUT_TIME_POWER(0, port, ${rightVar}, ramp_up, time_ms, ramp_down, 1)`);
      } else {
        const degreesValue = this.evaluateExpression(value, "*", 360, 32);
        this.addLine(`MOVE32_32(${degreesValue}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${leftVar}, 30, degrees, 30, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${rightVar}, 30, degrees, 30, 1)`);
      }
    }

    transpileScreenClear(block, blocks) {
      this.addComment("Clear screen");
      this.addLine(`UI_DRAW(FILLWINDOW, 0, 0, 0)`);
      this.addLine(`UI_DRAW(UPDATE)`);
    }

    transpileScreenText(block, blocks) {
      const text = this.getInputValue(block, "TEXT", blocks);
      const x = this.getInputValue(block, "X", blocks);
      const y = this.getInputValue(block, "Y", blocks);
      this.addComment(`Display text at (${x}, ${y})`);
      this.addLine(`UI_DRAW(TEXT, 0, ${x}, ${y}, ${text})`);
    }

    transpileScreenTextLarge(block, blocks) {
      const text = this.getInputValue(block, "TEXT", blocks);
      const x = this.getInputValue(block, "X", blocks);
      const y = this.getInputValue(block, "Y", blocks);
      this.addComment(`Display large text at (${x}, ${y})`);
      this.addLine(`UI_DRAW(SELECT_FONT, 1)`);
      this.addLine(`UI_DRAW(TEXT, 0, ${x}, ${y}, ${text})`);
      this.addLine(`UI_DRAW(SELECT_FONT, 0)`);
    }

    transpileDrawPixel(block, blocks) {
      const x = this.getInputValue(block, "X", blocks);
      const y = this.getInputValue(block, "Y", blocks);
      this.addComment(`Draw pixel at (${x}, ${y})`);
      this.addLine(`UI_DRAW(PIXEL, 0, ${x}, ${y})`);
    }

    transpileDrawLine(block, blocks) {
      const x1 = this.getInputValue(block, "X1", blocks);
      const y1 = this.getInputValue(block, "Y1", blocks);
      const x2 = this.getInputValue(block, "X2", blocks);
      const y2 = this.getInputValue(block, "Y2", blocks);
      this.addComment(`Draw line from (${x1}, ${y1}) to (${x2}, ${y2})`);
      this.addLine(`UI_DRAW(LINE, 0, ${x1}, ${y1}, ${x2}, ${y2})`);
    }

    transpileDrawCircle(block, blocks) {
      const x = this.getInputValue(block, "X", blocks);
      const y = this.getInputValue(block, "Y", blocks);
      const r = this.getInputValue(block, "R", blocks);
      const fill = this.getInputValue(block, "FILL", blocks);
      const fillMode = fill === '"filled"' || fill === "filled";
      const drawCmd = fillMode ? "FILLCIRCLE" : "CIRCLE";
      this.addComment(`Draw circle at (${x}, ${y}) radius ${r}`);
      this.addLine(`UI_DRAW(${drawCmd}, 0, ${x}, ${y}, ${r})`);
    }

    transpileDrawRectangle(block, blocks) {
      const x = this.getInputValue(block, "X", blocks);
      const y = this.getInputValue(block, "Y", blocks);
      const w = this.getInputValue(block, "W", blocks);
      const h = this.getInputValue(block, "H", blocks);
      const fill = this.getInputValue(block, "FILL", blocks);
      const fillMode = fill === '"filled"' || fill === "filled";
      const drawCmd = fillMode ? "FILLRECT" : "RECT";
      this.addComment(`Draw rectangle at (${x}, ${y}) size ${w}x${h}`);
      this.addLine(`UI_DRAW(${drawCmd}, 0, ${x}, ${y}, ${w}, ${h})`);
    }

    transpileScreenUpdate(block, blocks) {
      this.addComment("Update screen");
      this.addLine(`UI_DRAW(UPDATE)`);
    }

    transpileScreenInvert(block, blocks) {
      this.addComment("Invert screen");
      this.addLine(`UI_DRAW(INVERSERECT, 0, 0, 0, 178, 128)`);
    }

    transpilePlayTone(block, blocks) {
      const freq = this.getInputValue(block, "FREQ", blocks);
      const duration = this.getInputValue(block, "DURATION", blocks);
      this.addComment(`Play tone ${freq} Hz for ${duration} ms`);
      const skipLabel = this.generateLabel("SKIP_TONE");
      this.addLine(`MOVE16_16(${freq}, frequency)`);
      this.addLine(`JR_LT16(frequency, 250, ${skipLabel})`);
      this.addLine(`MOVE16_16(${duration}, duration)`);
      this.addLine(`SOUND(TONE, 100, frequency, duration)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(duration, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
      this.addLine(`${skipLabel}:`);
    }

    transpilePlayNote(block, blocks) {
      const note = this.getInputValue(block, "NOTE", blocks);
      const duration = this.getInputValue(block, "DURATION", blocks);
      this.addComment(`Play note ${note} for ${duration} beats`);
      const noteToFreq = {
        '"C4"': 262, '"D4"': 294, '"E4"': 330, '"F4"': 349, '"G4"': 392, '"A4"': 440, '"B4"': 494, '"C5"': 523,
        C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523,
        "'C4'": 262, "'D4'": 294, "'E4'": 330, "'F4'": 349, "'G4'": 392, "'A4'": 440, "'B4'": 494, "'C5'": 523,
      };
      const freq = noteToFreq[note] || 440;
      const timeMs = this.evaluateExpression(duration, "*", 500, 32);
      this.addLine(`MOVE16_16(${freq}, frequency)`);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
      this.addLine(`MOVE32_16(time_ms, duration)`);
      this.addLine(`SOUND(TONE, 100, frequency, duration)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(duration, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileBeep(block, blocks) {
      this.addComment("Beep");
      this.addLine(`SOUND(TONE, 100, 1000, 100)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(100, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileSetVolume(block, blocks) {
      const volume = this.getInputValue(block, "VOLUME", blocks);
      this.addComment(`Set volume to ${volume}%`);
      this.addLine(`MOVE8_8(${volume}, volume)`);
      this.addLine(`UI_WRITE(SET_VOLUME, volume)`);
    }

    transpileStopSound(block, blocks) {
      this.addComment("Stop all sounds");
      this.addLine(`SOUND(BREAK)`);
    }

    transpilePlaySound(block, blocks) {
      this.addComment("Play sound file");
      this.addComment("NOTE: Sound file playback requires file name - using beep instead");
      this.addLine(`SOUND(TONE, 100, 1000, 200)`);
    }

    transpileSetLED(block, blocks) {
      const color = this.getInputValue(block, "COLOR", blocks);
      const colorMap = {
        '"OFF"': this.LED_COLOR.OFF, '"GREEN"': this.LED_COLOR.GREEN, '"RED"': this.LED_COLOR.RED, '"ORANGE"': this.LED_COLOR.ORANGE,
        OFF: this.LED_COLOR.OFF, GREEN: this.LED_COLOR.GREEN, RED: this.LED_COLOR.RED, ORANGE: this.LED_COLOR.ORANGE,
      };
      const ledColor = colorMap[color] || this.LED_COLOR.GREEN;
      this.addComment(`Set LED to ${color}`);
      this.addLine(`UI_WRITE(LED, ${ledColor})`);
    }

    transpileLEDAllOff(block, blocks) {
      this.addComment("Turn all LEDs off");
      this.addLine(`UI_WRITE(LED, ${this.LED_COLOR.OFF})`);
    }

    transpileButtonPressed(block, blocks) {
      const button = this.getInputValue(block, "BUTTON", blocks);
      const resultVar = this.allocateVariable(8, "button_pressed");
      const buttonMap = {
        '"up"': this.BUTTONS.UP, '"down"': this.BUTTONS.DOWN, '"left"': this.BUTTONS.LEFT,
        '"right"': this.BUTTONS.RIGHT, '"enter"': this.BUTTONS.ENTER, '"back"': this.BUTTONS.BACK,
        up: this.BUTTONS.UP, down: this.BUTTONS.DOWN, left: this.BUTTONS.LEFT,
        right: this.BUTTONS.RIGHT, enter: this.BUTTONS.ENTER, back: this.BUTTONS.BACK,
      };
      const buttonConst = buttonMap[button] || this.BUTTONS.ENTER;
      this.addComment(`Check if button ${button} is pressed`);
      this.addLine(`UI_BUTTON(PRESSED, ${buttonConst}, ${resultVar})`);
      return resultVar;
    }

    transpileWaitForButton(block, blocks) {
      const button = this.getInputValue(block, "BUTTON", blocks);
      this.addComment(`Wait for button ${button}`);
      this.addLine(`UI_BUTTON(WAIT_FOR_PRESS)`);
      this.addLine(`UI_BUTTON(FLUSH)`);
    }

    transpileTouchSensor(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "touch_val");
      this.addComment(`Read touch sensor on port ${port}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_TOUCH}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.TOUCH}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileTouchSensorBumped(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "touch_bump");
      this.addComment(`Read touch sensor bumped on port ${port}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_TOUCH}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.BUMP}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileColorSensor(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const mode = this.getInputValue(block, "MODE", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "color_val");
      const modeMap = {
        '"reflected"': this.SENSOR_MODE.COLOR_REFLECTED, '"ambient"': this.SENSOR_MODE.COLOR_AMBIENT,
        '"color"': this.SENSOR_MODE.COLOR_COLOR, '"raw"': this.SENSOR_MODE.COLOR_REFLECTED_RAW,
        reflected: this.SENSOR_MODE.COLOR_REFLECTED, ambient: this.SENSOR_MODE.COLOR_AMBIENT,
        color: this.SENSOR_MODE.COLOR_COLOR, raw: this.SENSOR_MODE.COLOR_REFLECTED_RAW,
      };
      const sensorMode = modeMap[mode] || this.SENSOR_MODE.COLOR_REFLECTED;
      this.addComment(`Read color sensor on port ${port} mode ${mode}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_COLOR}, type)`);
      this.addLine(`MOVE8_8(${sensorMode}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileColorSensorRGB(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const component = this.getInputValue(block, "COMPONENT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(16, "rgb_component");
      this.addComment(`Read color sensor RGB on port ${port} component ${component}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_COLOR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.COLOR_RGB_RAW}, mode)`);
      const arrayName = `rgb_array_${this.arrayCounter++}`;
      this.addLine(`DATA16 ${arrayName}[3]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 3, ${arrayName})`);
      const componentMap = { '"red"': 0, '"green"': 1, '"blue"': 2, red: 0, green: 1, blue: 2 };
      const index = componentMap[component] || 0;
      this.addLine(`ARRAY_READ(${arrayName}, ${index}, ${resultVar})`);
      return resultVar;
    }

    transpileUltrasonicSensor(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const unit = this.getInputValue(block, "UNIT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(16, "us_dist");
      const modeMap = {
        '"cm"': this.SENSOR_MODE.US_DIST_CM, '"inch"': this.SENSOR_MODE.US_DIST_IN,
        '"cm_si"': this.SENSOR_MODE.US_SI_CM, '"inch_si"': this.SENSOR_MODE.US_SI_IN,
        cm: this.SENSOR_MODE.US_DIST_CM, inch: this.SENSOR_MODE.US_DIST_IN,
        cm_si: this.SENSOR_MODE.US_SI_CM, inch_si: this.SENSOR_MODE.US_SI_IN,
      };
      const sensorMode = modeMap[unit] || this.SENSOR_MODE.US_DIST_CM;
      this.addComment(`Read ultrasonic sensor on port ${port} unit ${unit}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_ULTRASONIC}, type)`);
      this.addLine(`MOVE8_8(${sensorMode}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileUltrasonicListen(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "us_listen");
      this.addComment(`Ultrasonic sensor listen on port ${port}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_ULTRASONIC}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.US_LISTEN}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileGyroSensor(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const mode = this.getInputValue(block, "MODE", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(16, "gyro_val");
      const modeMap = {
        '"angle"': this.SENSOR_MODE.GYRO_ANGLE, '"rate"': this.SENSOR_MODE.GYRO_RATE,
        '"fast"': this.SENSOR_MODE.GYRO_FAS, '"angle_rate"': this.SENSOR_MODE.GYRO_G_AND_A,
        angle: this.SENSOR_MODE.GYRO_ANGLE, rate: this.SENSOR_MODE.GYRO_RATE,
        fast: this.SENSOR_MODE.GYRO_FAS, angle_rate: this.SENSOR_MODE.GYRO_G_AND_A,
      };
      const sensorMode = modeMap[mode] || this.SENSOR_MODE.GYRO_ANGLE;
      this.addComment(`Read gyro sensor on port ${port} mode ${mode}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_GYRO}, type)`);
      this.addLine(`MOVE8_8(${sensorMode}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileGyroReset(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      this.addComment(`Reset/calibrate gyro sensor on port ${port}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_GYRO}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.GYRO_CALIBRATE}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, sensor_value8)`);
    }

    transpileIRProximity(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "ir_prox");
      this.addComment(`Read IR proximity on port ${port}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_PROX}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    transpileIRBeaconHeading(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const channel = this.getInputValue(block, "CHANNEL", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "ir_heading");
      this.addComment(`Read IR beacon heading on port ${port} channel ${channel}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_SEEK}, mode)`);
      const arrayName = `ir_seek_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[8]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 8, ${arrayName})`);
      const headingIndex = `((${channel} - 1) * 2)`;
      this.addLine(`ARRAY_READ(${arrayName}, ${headingIndex}, ${resultVar})`);
      return resultVar;
    }

    transpileIRBeaconDistance(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const channel = this.getInputValue(block, "CHANNEL", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "ir_distance");
      this.addComment(`Read IR beacon distance on port ${port} channel ${channel}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_SEEK}, mode)`);
      const arrayName = `ir_seek_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[8]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 8, ${arrayName})`);
      const distanceIndex = `((${channel} - 1) * 2 + 1)`;
      this.addLine(`ARRAY_READ(${arrayName}, ${distanceIndex}, ${resultVar})`);
      return resultVar;
    }

    transpileIRRemoteButton(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const channel = this.getInputValue(block, "CHANNEL", blocks);
      const button = this.getInputValue(block, "BUTTON", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "ir_button");
      this.addComment(`Check IR remote button on port ${port} channel ${channel} button ${button}`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_REMOTE}, mode)`);
      const arrayName = `ir_remote_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[4]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 4, ${arrayName})`);
      const channelIndex = `(${channel} - 1)`;
      const channelValue = this.allocateVariable(8, "ir_chan_val");
      this.addLine(`ARRAY_READ(${arrayName}, ${channelIndex}, ${channelValue})`);
      const buttonMap = {
        '"1"': 1, '"2"': 2, '"3"': 3, '"4"': 4, '"5"': 5, '"6"': 6,
        '"7"': 7, '"8"': 8, '"9"': 9, '"10"': 10, '"11"': 11,
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11,
      };
      const buttonCode = buttonMap[button] || 1;
      this.addLine(`CP_EQ8(${channelValue}, ${buttonCode}, ${resultVar})`);
      return resultVar;
    }

    transpileWait(block, blocks) {
      const duration = this.getInputValue(block, "DURATION", blocks);
      this.addComment(`Wait ${duration} seconds`);
      const timeMs = this.evaluateExpression(duration, "*", 1000, 32);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileWaitSeconds(block, blocks) {
      const time = this.getInputValue(block, "TIME", blocks);
      this.addComment(`Wait ${time} seconds`);
      const timeMs = this.evaluateExpression(time, "*", 1000, 32);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileWaitMillis(block, blocks) {
      const time = this.getInputValue(block, "TIME", blocks);
      this.addComment(`Wait ${time} milliseconds`);
      this.addLine(`MOVE32_32(${time}, time_ms)`);
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileRepeat(block, blocks) {
      const times = this.getInputValue(block, "TIMES", blocks);
      const counterVar = this.allocateVariable(32, "loop_counter");
      const loopStart = this.generateLabel("LOOP_START");
      const loopEnd = this.generateLabel("LOOP_END");
      this.addComment(`Repeat ${times} times`);
      this.addLine(`MOVE32_32(0, ${counterVar})`);
      this.addLine(`${loopStart}:`);
      this.indentLevel++;
      this.addLine(`JR_GTEQ32(${counterVar}, ${times}, ${loopEnd})`);
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) this.processBlockChain(substackId, blocks);
      this.addLine(`ADD32(${counterVar}, 1, ${counterVar})`);
      this.addLine(`JR(${loopStart})`);
      this.indentLevel--;
      this.addLine(`${loopEnd}:`);
    }

    transpileForever(block, blocks) {
      const loopStart = this.generateLabel("FOREVER_START");
      this.addComment("Forever loop");
      this.addLine(`${loopStart}:`);
      this.indentLevel++;
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) this.processBlockChain(substackId, blocks);
      this.addLine(`JR(${loopStart})`);
      this.indentLevel--;
    }

    transpileIf(block, blocks) {
      const condition = this.evaluateCondition(block, "CONDITION", blocks);
      const endLabel = this.generateLabel("IF_END");
      this.addComment("If condition");
      this.addLine(`JR_FALSE(${condition}, ${endLabel})`);
      this.indentLevel++;
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) this.processBlockChain(substackId, blocks);
      this.indentLevel--;
      this.addLine(`${endLabel}:`);
    }

    transpileIfElse(block, blocks) {
      const condition = this.evaluateCondition(block, "CONDITION", blocks);
      const elseLabel = this.generateLabel("ELSE");
      const endLabel = this.generateLabel("IF_END");
      this.addComment("If-else condition");
      this.addLine(`JR_FALSE(${condition}, ${elseLabel})`);
      this.indentLevel++;
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) this.processBlockChain(substackId, blocks);
      this.addLine(`JR(${endLabel})`);
      this.indentLevel--;
      this.addLine(`${elseLabel}:`);
      this.indentLevel++;
      const substack2Id = this.getSubstackId(block, "SUBSTACK2");
      if (substack2Id) this.processBlockChain(substack2Id, blocks);
      this.indentLevel--;
      this.addLine(`${endLabel}:`);
    }

    transpileRepeatUntil(block, blocks) {
      const loopStart = this.generateLabel("UNTIL_START");
      const loopEnd = this.generateLabel("UNTIL_END");
      this.addComment("Repeat until");
      this.addLine(`${loopStart}:`);
      this.indentLevel++;
      const condition = this.evaluateCondition(block, "CONDITION", blocks);
      this.addLine(`JR_TRUE(${condition}, ${loopEnd})`);
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) this.processBlockChain(substackId, blocks);
      this.addLine(`JR(${loopStart})`);
      this.indentLevel--;
      this.addLine(`${loopEnd}:`);
    }

    transpileStop(block, blocks) {
      const stopOption = this.getFieldValue(block, "STOP_OPTION") || "all";
      if (stopOption === "all") {
        this.addComment("Stop all");
        this.addLine("OBJECT_END()");
      } else {
        this.addComment("Stop this script");
        this.addLine("RETURN()");
      }
    }

    transpileBroadcast(block, blocks) {
      const broadcastInput = this.getInputValue(block, "BROADCAST_INPUT", blocks);
      const broadcastName = broadcastInput.replace(/'/g, "").replace(/"/g, "");
      const handler = this.broadcastHandlers.get(broadcastName);
      if (handler) {
        this.addComment(`Broadcast: ${broadcastName}`);
        this.addLine(`CALL(${handler.label})`);
      } else {
        this.addComment(`WARNING: No handler for broadcast: ${broadcastName}`);
        this.log(`WARNING: No handler for broadcast: ${broadcastName}`, null, "WARN");
      }
    }

    transpileBroadcastAndWait(block, blocks) {
      this.transpileBroadcast(block, blocks);
    }

    transpileMoveSteps(block, blocks) {
      const steps = this.getInputValue(block, "STEPS", blocks);
      this.addComment(`Move ${steps} steps`);
      const ports = `(${this.OUTPUT_PORTS.B} | ${this.OUTPUT_PORTS.C})`;
      this.addLine(`MOVE8_8(${ports}, ports)`);
      const scaledSteps = this.evaluateExpression(steps, "*", 10, 32);
      this.addLine(`MOVE32_32(${scaledSteps}, degrees)`);
      this.addLine(`OUTPUT_STEP_POWER(0, ports, 50, 10, degrees, 10, 1)`);
    }

    transpileTurnRight(block, blocks) {
      const degrees = this.getInputValue(block, "DEGREES", blocks);
      this.addComment(`Turn right ${degrees} degrees`);
      const scaledDegrees = this.evaluateExpression(degrees, "*", 2, 32);
      this.addLine(`MOVE32_32(${scaledDegrees}, degrees)`);
      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.B}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, 50, 10, degrees, 10, 0)`);
      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.C}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, -50, 10, degrees, 10, 1)`);
    }

    transpileTurnLeft(block, blocks) {
      const degrees = this.getInputValue(block, "DEGREES", blocks);
      this.addComment(`Turn left ${degrees} degrees`);
      const scaledDegrees = this.evaluateExpression(degrees, "*", 2, 32);
      this.addLine(`MOVE32_32(${scaledDegrees}, degrees)`);
      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.B}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, -50, 10, degrees, 10, 0)`);
      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.C}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, 50, 10, degrees, 10, 1)`);
    }

    transpileSetVariable(block, blocks) {
      const varName = this.getFieldValue(block, "VARIABLE");
      const value = this.getInputValue(block, "VALUE", blocks);
      let varInfo = this.variables.get(varName);
      if (!varInfo) {
        const lmsVar = this.allocateVariable(32, this.sanitizeName(varName));
        varInfo = { lmsVar, type: 32 };
        this.variables.set(varName, varInfo);
      }
      this.addComment(`Set ${varName} to ${value}`);
      this.addLine(`MOVE32_32(${value}, ${varInfo.lmsVar})`);
    }

    transpileChangeVariable(block, blocks) {
      const varName = this.getFieldValue(block, "VARIABLE");
      const value = this.getInputValue(block, "VALUE", blocks);
      let varInfo = this.variables.get(varName);
      if (!varInfo) {
        const lmsVar = this.allocateVariable(32, this.sanitizeName(varName));
        varInfo = { lmsVar, type: 32 };
        this.variables.set(varName, varInfo);
        this.addLine(`MOVE32_32(0, ${lmsVar})`);
      }
      this.addComment(`Change ${varName} by ${value}`);
      this.addLine(`ADD32(${varInfo.lmsVar}, ${value}, ${varInfo.lmsVar})`);
    }

    transpileResetTimer(block, blocks) {
      const timer = this.getInputValue(block, "TIMER", blocks);
      const timerVar = this.getOrCreateTimer(timer);
      this.addComment(`Reset timer ${timer}`);
      this.addLine(`MOVE32_32(0, ${timerVar})`);
      this.addLine(`TIMER_READ(${timerVar})`);
    }

    transpileTimerValue(block, blocks) {
      const timer = this.getInputValue(block, "TIMER", blocks);
      const resultVar = this.allocateVariable(32, `timer_${timer}_val`);
      const timerVar = this.getOrCreateTimer(timer);
      this.addComment(`Read timer ${timer}`);
      this.addLine(`TIMER_READ(${timerVar})`);
      this.addLine(`MOVE32_32(${timerVar}, ${resultVar})`);
      return resultVar;
    }

    transpileBatteryLevel(block, blocks) {
      const resultVar = this.allocateVariable(8, "battery_pct");
      this.addComment("Read battery level");
      this.addLine(`UI_READ(GET_LBATT, ${resultVar})`);
      return resultVar;
    }

    transpileBatteryVoltage(block, blocks) {
      const resultVar = this.allocateVariable("F", "battery_v");
      this.addComment("Read battery voltage");
      this.addLine(`UI_READ(GET_VBATT, ${resultVar})`);
      return resultVar;
    }

    transpileBatteryCurrent(block, blocks) {
      const resultVar = this.allocateVariable("F", "battery_i");
      this.addComment("Read battery current");
      this.addLine(`UI_READ(GET_IBATT, ${resultVar})`);
      return resultVar;
    }

    transpileFreeMemory(block, blocks) {
      const resultVar = this.allocateVariable(32, "free_mem");
      this.addComment("Read free memory");
      this.addLine(`INFO(GET_FREE, ${resultVar})`);
      return resultVar;
    }

    transpileSay(block, blocks) {
      const message = this.getInputValue(block, "MESSAGE", blocks);
      this.addComment(`Say: ${message}`);
      this.addLine(`UI_DRAW(TEXT, 0, 0, 50, ${message})`);
      this.addLine(`UI_DRAW(UPDATE)`);
      if (block.opcode === "looks_sayforsecs") {
        const secs = this.getInputValue(block, "SECS", blocks);
        const timeMs = this.evaluateExpression(secs, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
        const timerVar = this.getOrCreateTimer(0);
        this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
        this.addLine(`TIMER_READY(${timerVar})`);
        this.addLine(`UI_DRAW(FILLWINDOW, 0, 0, 0)`);
        this.addLine(`UI_DRAW(UPDATE)`);
      }
    }

    getInputValue(block, inputName, blocks) {
      const input = block.inputs[inputName];
      if (!input) return "0";
      if (typeof input === "object" && !Array.isArray(input)) {
        if (input.block) {
          const refBlock = blocks._blocks[input.block];
          if (refBlock) return this.evaluateBlock(refBlock, blocks);
        }
        if (input.shadow) {
          const shadowBlock = blocks._blocks[input.shadow];
          if (shadowBlock) return this.evaluateBlock(shadowBlock, blocks);
        }
        return "0";
      }
      if (!Array.isArray(input)) return "0";
      const inputType = input[0];
      const inputData = input[1];
      if (inputType === 1 || inputType === 2 || inputType === 3) {
        if (Array.isArray(inputData)) {
          const primitiveType = inputData[0];
          const primitiveValue = inputData[1];
          if (primitiveType >= 4 && primitiveType <= 8) {
            return String(primitiveValue);
          } else if (primitiveType === 10) {
            if (typeof primitiveValue === "number") return String(primitiveValue);
            return `'${primitiveValue}'`;
          }
        } else if (typeof inputData === "string") {
          const refBlock = blocks._blocks[inputData];
          if (refBlock) return this.evaluateBlock(refBlock, blocks);
        }
        if (inputType === 3 && Array.isArray(inputData) && inputData.length >= 2) {
          if (typeof inputData[0] === "string") {
            const refBlock = blocks._blocks[inputData[0]];
            if (refBlock) return this.evaluateBlock(refBlock, blocks);
          }
          const shadowData = inputData[1];
          if (Array.isArray(shadowData)) {
            const primitiveType = shadowData[0];
            const primitiveValue = shadowData[1];
            if (primitiveType >= 4 && primitiveType <= 8) {
              return String(primitiveValue);
            } else if (primitiveType === 10) {
              if (typeof primitiveValue === "number") return String(primitiveValue);
              return `'${primitiveValue}'`;
            }
          }
        }
      }
      return "0";
    }

    evaluateExpression(value, operation, operand, resultType = 32) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && !value.includes("var") && !value.includes("timer") && !value.includes("_") && /^-?\d+\.?\d*$/.test(String(value).trim())) {
        let result;
        switch (operation) {
          case "*": result = numValue * operand; break;
          case "/": result = numValue / operand; break;
          case "+": result = numValue + operand; break;
          case "-": result = numValue - operand; break;
          default: result = numValue;
        }
        if (resultType === "F" || resultType === "DATAF") return result.toFixed(1) + "F";
        return Math.round(result).toString();
      } else {
        const resultVar = this.allocateVariable(resultType, `calc_result`);
        const operandConst = operand.toString();
        switch (operation) {
          case "*":
            if (resultType === 32) this.addLine(`MUL32(${value}, ${operandConst}, ${resultVar})`);
            else if (resultType === 16) this.addLine(`MUL16(${value}, ${operandConst}, ${resultVar})`);
            else if (resultType === "F") this.addLine(`MULF(${value}, ${operandConst}, ${resultVar})`);
            break;
          case "/":
            if (resultType === 32) this.addLine(`DIV32(${value}, ${operandConst}, ${resultVar})`);
            else if (resultType === 16) this.addLine(`DIV16(${value}, ${operandConst}, ${resultVar})`);
            break;
          case "+":
            if (resultType === 32) this.addLine(`ADD32(${value}, ${operandConst}, ${resultVar})`);
            else if (resultType === 16) this.addLine(`ADD16(${value}, ${operandConst}, ${resultVar})`);
            break;
          case "-":
            if (resultType === 32) this.addLine(`SUB32(${value}, ${operandConst}, ${resultVar})`);
            else if (resultType === 16) this.addLine(`SUB16(${value}, ${operandConst}, ${resultVar})`);
            break;
        }
        return resultVar;
      }
    }

    evaluateBlock(block, blocks) {
      const opcode = block.opcode;
      if (opcode === "math_number" || opcode === "math_whole_number" || opcode === "math_positive_number" || opcode === "math_integer") {
        const num = this.getFieldValue(block, "NUM");
        return num || "0";
      } else if (opcode === "text") {
        const text = this.getFieldValue(block, "TEXT");
        if (typeof text === "number" || !isNaN(text)) return String(text);
        return `'${text || ""}'`;
      } else if (opcode === "data_variable") {
        const varName = this.getFieldValue(block, "VARIABLE");
        let varInfo = this.variables.get(varName);
        if (!varInfo) {
          const lmsVar = this.allocateVariable(32, this.sanitizeName(varName));
          varInfo = { lmsVar, type: 32 };
          this.variables.set(varName, varInfo);
          this.addLine(`MOVE32_32(0, ${lmsVar})`);
        }
        return varInfo.lmsVar;
      } else if (opcode === "operator_add") {
        return this.evaluateBinaryOp(block, blocks, "ADD32");
      } else if (opcode === "operator_subtract") {
        return this.evaluateBinaryOp(block, blocks, "SUB32");
      } else if (opcode === "operator_multiply") {
        return this.evaluateBinaryOp(block, blocks, "MUL32");
      } else if (opcode === "operator_divide") {
        return this.evaluateBinaryOp(block, blocks, "DIV32");
      } else if (opcode === "operator_mod") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        const tempDiv = this.allocateVariable(32);
        const tempMul = this.allocateVariable(32);
        const resultVar = this.allocateVariable(32);
        this.addLine(`DIV32(${num1}, ${num2}, ${tempDiv})`);
        this.addLine(`MUL32(${tempDiv}, ${num2}, ${tempMul})`);
        this.addLine(`SUB32(${num1}, ${tempMul}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_round") {
        const num = this.getInputValue(block, "NUM", blocks);
        const resultVar = this.allocateVariable("F");
        this.addLine(`MATH(ROUND, ${num}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_mathop") {
        const operator = this.getFieldValue(block, "OPERATOR");
        const num = this.getInputValue(block, "NUM", blocks);
        const resultVar = this.allocateVariable("F");
        const mathFuncMap = {
          abs: "ABS", floor: "FLOOR", ceiling: "CEIL", sqrt: "SQRT",
          sin: "SIN", cos: "COS", tan: "TAN", asin: "ASIN", acos: "ACOS", atan: "ATAN",
          ln: "LN", log: "LOG", "e ^": "EXP", "10 ^": "POW",
        };
        const mathFunc = mathFuncMap[operator];
        if (mathFunc === "POW") {
          this.addLine(`MATH(POW, 10, ${num}, ${resultVar})`);
        } else if (mathFunc) {
          this.addLine(`MATH(${mathFunc}, ${num}, ${resultVar})`);
        } else {
          this.log(`WARNING: Unsupported math operation: ${operator}`, null, "WARN");
          return num;
        }
        return resultVar;
      } else if (opcode === "operator_join" || opcode === "operator_letter_of" || opcode === "operator_length") {
        this.log("WARNING: String operations not fully supported", null, "WARN");
        return "''";
      } else if (opcode === "operator_gt" || opcode === "operator_lt" || opcode === "operator_equals") {
        return this.evaluateComparison(block, blocks);
      } else if (opcode === "ev3_motorPosition" || opcode === "ev3lms_motorPosition") {
        return this.evaluateMotorPosition(block, blocks);
      } else if (opcode === "ev3_motorSpeed" || opcode === "ev3lms_motorSpeed") {
        return this.evaluateMotorSpeed(block, blocks);
      } else if (opcode === "ev3_touchSensor" || opcode === "ev3lms_touchSensor") {
        return this.transpileTouchSensor(block, blocks);
      } else if (opcode === "ev3_touchSensorBumped" || opcode === "ev3lms_touchSensorBumped") {
        return this.transpileTouchSensorBumped(block, blocks);
      } else if (opcode === "ev3_colorSensor" || opcode === "ev3lms_colorSensor") {
        return this.transpileColorSensor(block, blocks);
      } else if (opcode === "ev3_colorSensorRGB" || opcode === "ev3lms_colorSensorRGB") {
        return this.transpileColorSensorRGB(block, blocks);
      } else if (opcode === "ev3_ultrasonicSensor" || opcode === "ev3lms_ultrasonicSensor") {
        return this.transpileUltrasonicSensor(block, blocks);
      } else if (opcode === "ev3_ultrasonicListen" || opcode === "ev3lms_ultrasonicListen") {
        return this.transpileUltrasonicListen(block, blocks);
      } else if (opcode === "ev3_gyroSensor" || opcode === "ev3lms_gyroSensor") {
        return this.transpileGyroSensor(block, blocks);
      } else if (opcode === "ev3_irProximity" || opcode === "ev3lms_irProximity") {
        return this.transpileIRProximity(block, blocks);
      } else if (opcode === "ev3_irBeaconHeading" || opcode === "ev3lms_irBeaconHeading") {
        return this.transpileIRBeaconHeading(block, blocks);
      } else if (opcode === "ev3_irBeaconDistance" || opcode === "ev3lms_irBeaconDistance") {
        return this.transpileIRBeaconDistance(block, blocks);
      } else if (opcode === "ev3_irRemoteButton" || opcode === "ev3lms_irRemoteButton") {
        return this.transpileIRRemoteButton(block, blocks);
      } else if (opcode === "ev3_buttonPressed" || opcode === "ev3lms_buttonPressed") {
        return this.transpileButtonPressed(block, blocks);
      } else if (opcode === "ev3_timerValue" || opcode === "ev3lms_timerValue") {
        return this.transpileTimerValue(block, blocks);
      } else if (opcode === "ev3_batteryLevel" || opcode === "ev3lms_batteryLevel") {
        return this.transpileBatteryLevel(block, blocks);
      } else if (opcode === "ev3_batteryVoltage" || opcode === "ev3lms_batteryVoltage") {
        return this.transpileBatteryVoltage(block, blocks);
      } else if (opcode === "ev3_batteryCurrent" || opcode === "ev3lms_batteryCurrent") {
        return this.transpileBatteryCurrent(block, blocks);
      } else if (opcode === "ev3_freeMemory" || opcode === "ev3lms_freeMemory") {
        return this.transpileFreeMemory(block, blocks);
      } else if (opcode.endsWith("_menu") || opcode.includes("menu_")) {
        const fieldNames = Object.keys(block.fields);
        if (fieldNames.length > 0) {
          const value = this.getFieldValue(block, fieldNames[0]);
          this.log(`Menu block evaluated: ${opcode} = ${value}`, null, "DEBUG");
          return `'${value}'`;
        }
        this.log(`Menu block ${opcode} has no fields, using empty string`, null, "DEBUG");
        return "''";
      }
      this.log(`WARNING: Unsupported reporter: ${opcode}`, null, "WARN");
      return "0";
    }

    evaluateBinaryOp(block, blocks, opcode) {
      const num1 = this.getInputValue(block, "NUM1", blocks);
      const num2 = this.getInputValue(block, "NUM2", blocks);
      const resultVar = this.allocateVariable(32);
      this.addLine(`${opcode}(${num1}, ${num2}, ${resultVar})`);
      return resultVar;
    }

    evaluateComparison(block, blocks) {
      const opcode = block.opcode;
      const op1 = this.getInputValue(block, "OPERAND1", blocks);
      const op2 = this.getInputValue(block, "OPERAND2", blocks);
      const resultVar = this.allocateVariable(8);
      if (opcode === "operator_gt") {
        this.addLine(`CP_GT32(${op1}, ${op2}, ${resultVar})`);
      } else if (opcode === "operator_lt") {
        this.addLine(`CP_LT32(${op1}, ${op2}, ${resultVar})`);
      } else if (opcode === "operator_equals") {
        this.addLine(`CP_EQ32(${op1}, ${op2}, ${resultVar})`);
      }
      return resultVar;
    }

    evaluateCondition(block, inputName, blocks) {
      const input = block.inputs[inputName];
      if (!input) {
        const trueVar = this.allocateVariable(8);
        this.addLine(`MOVE8_8(1, ${trueVar})`);
        return trueVar;
      }
      let conditionBlock = null;
      if (typeof input === "object" && !Array.isArray(input)) {
        if (input.block) conditionBlock = blocks._blocks[input.block];
      } else if (Array.isArray(input) && input.length >= 2) {
        if (typeof input[1] === "string") conditionBlock = blocks._blocks[input[1]];
      }
      if (!conditionBlock) {
        const trueVar = this.allocateVariable(8);
        this.addLine(`MOVE8_8(1, ${trueVar})`);
        return trueVar;
      }
      const opcode = conditionBlock.opcode;
      if (opcode === "operator_gt" || opcode === "operator_lt" || opcode === "operator_equals") {
        return this.evaluateComparison(conditionBlock, blocks);
      } else if (opcode === "operator_and") {
        const cond1 = this.evaluateCondition(conditionBlock, "OPERAND1", blocks);
        const cond2 = this.evaluateCondition(conditionBlock, "OPERAND2", blocks);
        const resultVar = this.allocateVariable(8);
        this.addLine(`AND8(${cond1}, ${cond2}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_or") {
        const cond1 = this.evaluateCondition(conditionBlock, "OPERAND1", blocks);
        const cond2 = this.evaluateCondition(conditionBlock, "OPERAND2", blocks);
        const resultVar = this.allocateVariable(8);
        this.addLine(`OR8(${cond1}, ${cond2}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_not") {
        const cond = this.evaluateCondition(conditionBlock, "OPERAND", blocks);
        const resultVar = this.allocateVariable(8);
        this.addLine(`XOR8(${cond}, 1, ${resultVar})`);
        return resultVar;
      } else {
        return this.evaluateBlock(conditionBlock, blocks);
      }
    }

    evaluateMotorPosition(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.getMotorAsInputPort(port);
      const resultVar = this.allocateVariable(32, "motor_pos");
      this.addComment(`Read motor ${port} position`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.LARGE_MOTOR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.MOTOR_DEGREE}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    evaluateMotorSpeed(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const portNum = this.getMotorAsInputPort(port);
      const resultVar = this.allocateVariable(8, "motor_speed");
      this.addComment(`Read motor ${port} speed`);
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.LARGE_MOTOR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.MOTOR_SPEED}, mode)`);
      this.addLine(`INPUT_READ(0, port, type, mode, ${resultVar})`);
      return resultVar;
    }

    getFieldValue(block, fieldName) {
      if (block.fields && block.fields[fieldName]) {
        const field = block.fields[fieldName];
        return field.value || field.id || field.name;
      }
      return null;
    }

    getSubstackId(block, substackName) {
      const substack = block.inputs[substackName];
      if (!substack) return null;
      if (typeof substack === "object" && !Array.isArray(substack)) {
        return substack.block || null;
      }
      if (Array.isArray(substack) && substack.length >= 2) {
        return substack[1];
      }
      return null;
    }

    getPortMask(port) {
      const portStr = String(port).replace(/'/g, "").replace(/"/g, "");
      return this.OUTPUT_PORTS[portStr] || this.OUTPUT_PORTS.A;
    }

    getMotorAsInputPort(port) {
      const portStr = String(port).replace(/'/g, "").replace(/"/g, "");
      const portMap = { A: "0", B: "1", C: "2", D: "3" };
      return portMap[portStr] || "0";
    }

    getOrCreateTimer(timerId) {
      if (!this.timerVars.has(timerId)) {
        const timerVar = this.allocateVariable(32, `timer${timerId}`);
        this.timerVars.set(timerId, timerVar);
      }
      return this.timerVars.get(timerId);
    }

    sanitizeName(name) {
      if (!name) return "unnamed";
      return name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
  }

  // ============================================================================
  // EV3 PERIPHERAL MANAGER (Real-time control)
  // ============================================================================

  class EV3Peripheral {
    constructor(runtime) {
      this.runtime = runtime;
      this.mode = 'serial';
      this.backend = null;
      this.messageCounter = 0;
      this.pendingRequests = new Map();
      
      // Bridge configuration
      this.bridgeConfig = {
        host: 'localhost',
        port: 8080,
        ssl: false,
        authToken: null
      };
      
      // EV3 IP configuration
      this.ev3IP = '192.168.178.50';
      this.ev3Port = 8080;
      
      log.info("EV3Peripheral: Initialized");
    }

    async setMode(mode) {
      log.info(`EV3Peripheral: Setting mode to ${mode}`);
      if (this.backend) {
        await this.disconnect();
      }
      this.mode = mode;
    }

    /**
     * Configure bridge connection settings
     */
    setBridgeConfig(config) {
      log.info("EV3Peripheral: Configuring bridge", config);
      this.bridgeConfig = { ...this.bridgeConfig, ...config };
    }

    /**
     * Connect to EV3 using current mode
     * @param {string} param - Connection parameter (optional, mode-specific)
     */
    async connect(param) {
      log.info(`EV3Peripheral: Connecting via ${this.mode}...`);
      
      if (this.mode === 'serial') {
        this.backend = new SerialBackend(
          () => this._onConnect(),
          (data) => this._onMessage(data)
        );
        return await this.backend.connect();
        
      } else if (this.mode === 'scratchlink') {
        this.backend = new ScratchLinkBackend(
          this.runtime,
          'legoev3',
          () => this._onConnect(),
          (data) => this._onMessage(data)
        );
        this.backend.connect();
        return true;
        
      } else if (this.mode === 'bridge') {
        this.backend = new BridgeBackend(
          () => this._onConnect(),
          (data) => this._onMessage(data)
        );
        
        // Use stored bridge config
        const config = { ...this.bridgeConfig };
        
        // Allow param to override (for backward compatibility)
        if (param) {
          // Parse param as URL: ws://host:port or host:port
          const match = param.match(/^(?:(wss?):\/\/)?([^:]+)(?::(\d+))?$/);
          if (match) {
            config.ssl = match[1] === 'wss';
            config.host = match[2];
            if (match[3]) config.port = parseInt(match[3]);
          }
        }
        
        return await this.backend.connect(config);
        
      } else if (this.mode === 'http') {
        this.backend = new HTTPBackend(
          () => this._onConnect(),
          (data) => this._onMessage(data)
        );
        
        // Use stored EV3 IP or parse param
        let ip = this.ev3IP;
        let port = this.ev3Port;
        
        if (param) {
          const [paramIP, paramPort] = param.split(':');
          ip = paramIP;
          if (paramPort) port = parseInt(paramPort);
        }
        
        return await this.backend.connect(ip, port);
      }
      
      return false;
    }

    async disconnect() {
      log.info("EV3Peripheral: Disconnecting");
      if (this.backend) {
        await this.backend.disconnect();
        this.backend = null;
      }
    }

    isConnected() {
      return this.backend ? this.backend.connected : false;
    }

    _onConnect() {
      log.info("EV3Peripheral: Connection established");
    }

    _onMessage(data) {
      log.debug("EV3Peripheral: Message Received", data.length, "bytes");
      const combined = new Uint8Array(this.readBuffer.length + data.length);
      combined.set(this.readBuffer);
      combined.set(data, this.readBuffer.length);
      this.readBuffer = combined;

      while (this.readBuffer.length >= 2) {
        const len = this.readBuffer[0] | (this.readBuffer[1] << 8);
        if (this.readBuffer.length < len + 2) break;
        const packet = this.readBuffer.slice(2, len + 2);
        this.readBuffer = this.readBuffer.slice(len + 2);
        this._handlePacket(packet);
      }
    }

    _handlePacket(packet) {
      log.debug("EV3Peripheral: Handling packet", packet.length, "bytes");
      if (packet.length < 3) return;
      const count = packet[0] | (packet[1] << 8);
      const type = packet[2];
      if (this.pendingRequests.has(count)) {
        const { resolve } = this.pendingRequests.get(count);
        if (type === 0x02 || type === 0x04) {
          resolve(packet.slice(3));
        }
        this.pendingRequests.delete(count);
      }
    }

    async sendDirect(opcodes, globalAlloc = 0, localAlloc = 0, reply = false) {
      if (!this.isConnected()) {
        log.warn("EV3Peripheral: Not connected, cannot send");
        return null;
      }
      const count = this.msgCounter++;
      if (this.msgCounter > 60000) this.msgCounter = 0;
      const header = [
        globalAlloc & 0xFF,
        ((globalAlloc >> 8) & 0x03) | ((localAlloc & 0x3F) << 2)
      ];
      const cmdType = reply ? OP.DirectCmd : OP.DirectCmdNoReply;
      const payload = [count & 0xFF, (count >> 8) & 0xFF, cmdType, ...header, ...opcodes];
      const len = payload.length;
      const packet = new Uint8Array(len + 2);
      packet[0] = len & 0xFF;
      packet[1] = (len >> 8) & 0xFF;
      packet.set(payload, 2);

      log.debug("EV3Peripheral: Sending direct command", packet.length, "bytes", reply ? "(reply expected)" : "(no reply)");

      let promise = null;
      if (reply) {
        promise = new Promise(resolve => {
          this.pendingRequests.set(count, { resolve });
          setTimeout(() => {
            if (this.pendingRequests.has(count)) {
              log.warn("EV3Peripheral: Request timeout", count);
              this.pendingRequests.delete(count);
              resolve(null);
            }
          }, 1000);
        });
      }

      await this.backend.send(packet);
      return promise;
    }

    playTone(freq, ms) {
      log.debug("EV3Peripheral: Playing tone", freq, "Hz for", ms, "ms");
      const cmd = [OP.SOUND, CMD.TONE, ...LC1(50), ...LC2(freq), ...LC2(ms)];
      this.sendDirect(cmd);
    }

    motorOn(ports, power) {
      log.debug("EV3Peripheral: Motor on", ports, "power", power);
      const p = Math.max(-100, Math.min(100, power));
      const cmd = [
        OP.OUTPUT_SPEED, 0x00, ports, ...LC1(p),
        OP.OUTPUT_START, 0x00, ports
      ];
      this.sendDirect(cmd);
    }

    motorRunDegrees(ports, power, degrees) {
      log.debug("EV3Peripheral: Motor run degrees", ports, "power", power, "degrees", degrees);
      const p = Math.max(-100, Math.min(100, power));
      const cmd = [
        OP.OUTPUT_STEP_SPEED, 0x00, ports, ...LC1(p),
        ...LC0(0), ...LC4(degrees), ...LC0(0), ...LC0(1)
      ];
      this.sendDirect(cmd);
    }

    async getSensor(port, type, mode) {
      log.debug("EV3Peripheral: Get sensor", port, "type", type, "mode", mode);
      const cmd = [
        OP.INPUT_DEVICE, CMD.READY_SI, 0x00, port, ...LC0(type), ...LC0(mode), ...LC0(1),
        ...GV0(0)
      ];
      const reply = await this.sendDirect(cmd, 4, 0, true);
      if (reply) {
        const view = new DataView(reply.buffer, reply.byteOffset, reply.byteLength);
        const value = view.getFloat32(0, true);
        log.debug("EV3Peripheral: Sensor value", value);
        return value;
      }
      log.warn("EV3Peripheral: No sensor response");
      return 0;
    }
  }

  // ============================================================================
  // MAIN EXTENSION CLASS
  // ============================================================================

  class EV3ComprehensiveExtension {
    constructor(runtime) {
      this.runtime = runtime;
      this.ev3 = new EV3Peripheral(runtime);
      this.transpiler = new LMSTranspiler(runtime);
      
      // Configuration
      this.ev3IP = '192.168.178.50';
      this.ev3Port = 8080;
      this.lmsApiUrl = 'http://127.0.0.1';
      this.lmsApiPort = 7860;
      
      // Bridge configuration
      this.bridgeHost = 'localhost';
      this.bridgePort = 8080;
      this.bridgeSSL = false;
      this.bridgeAuthToken = null;
      
      // Transpiler state
      this.lmsCode = null;
      this.rbfBytecode = null;
      this.rbfBase64 = null;
      
      this.COMPILE_TIMEOUT_MS = 30000;
      
      log.info("EV3ComprehensiveExtension: Initialized");
    }

    getInfo() {
      return {
        id: 'ev3comprehensive',
        name: t('extensionName'),
        color1: '#7C3A9A',
        color2: '#5C2A7A',
        color3: '#4C1A6A',
        blocks: [
          // Connection mode
          { blockType: Scratch.BlockType.LABEL, text: t('connectionMode') },
          {
            opcode: 'setMode',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setMode'),
            arguments: {
              MODE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'connectionModes',
                defaultValue: 'serial'
              }
            }
          },
          {
            opcode: 'connect',
            blockType: Scratch.BlockType.COMMAND,
            text: t('connect'),
            arguments: {
              PARAM: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'disconnect',
            blockType: Scratch.BlockType.COMMAND,
            text: t('disconnect')
          },
          {
            opcode: 'isConnected',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('isConnected')
          },

          '---',

          // Bridge configuration
          { blockType: Scratch.BlockType.LABEL, text: '🌉 Bridge Settings' },
          {
            opcode: 'setBridgeHost',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setBridgeURL'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'localhost'
              }
            }
          },
          {
            opcode: 'setBridgePort',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setBridgePort'),
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8080
              }
            }
          },
          {
            opcode: 'enableBridgeSSL',
            blockType: Scratch.BlockType.COMMAND,
            text: t('enableSSL')
          },
          {
            opcode: 'disableBridgeSSL',
            blockType: Scratch.BlockType.COMMAND,
            text: t('disableSSL')
          },
          {
            opcode: 'setBridgeAuthToken',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setAuthToken'),
            arguments: {
              TOKEN: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'clearBridgeAuthToken',
            blockType: Scratch.BlockType.COMMAND,
            text: t('clearAuthToken')
          },
          {
            opcode: 'testBridgeConnection',
            blockType: Scratch.BlockType.REPORTER,
            text: t('testBridge')
          },

          '---',

          // EV3 HTTP configuration
          { blockType: Scratch.BlockType.LABEL, text: '🤖 EV3 Settings' },
          {
            opcode: 'setEV3IP',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setEV3IP'),
            arguments: {
              IP: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '192.168.178.50'
              }
            }
          },
          {
            opcode: 'setEV3Port',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set EV3 port to [PORT]',
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8080
              }
            }
          },
          {
            opcode: 'testConnection',
            blockType: Scratch.BlockType.REPORTER,
            text: t('testConnection')
          },

          '---',

          // LMS API configuration
          { blockType: Scratch.BlockType.LABEL, text: '⚙️ Compiler Settings' },
          {
            opcode: 'setLMSApiUrl',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setLMSApiUrl'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'http://127.0.0.1'
              },
              PORT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 7860
              }
            }
          },
          {
            opcode: 'testCompiler',
            blockType: Scratch.BlockType.REPORTER,
            text: t('testCompiler')
          },

          '---',

          // Transpilation blocks (same as before)
          { blockType: Scratch.BlockType.LABEL, text: '📝 Code Generation' },
          {
            opcode: 'transpileToLMS',
            blockType: Scratch.BlockType.COMMAND,
            text: 'generate LMS code'
          },
          {
            opcode: 'showLMSCode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'show LMS code'
          },
          {
            opcode: 'downloadLMSCode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download LMS code'
          },
          {
            opcode: 'compileToRBF',
            blockType: Scratch.BlockType.COMMAND,
            text: 'compile to RBF'
          },
          {
            opcode: 'showRBFCode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'show RBF bytecode'
          },
          {
            opcode: 'downloadRBF',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download RBF file'
          },
          {
            opcode: 'uploadAndRun',
            blockType: Scratch.BlockType.COMMAND,
            text: 'upload and run on EV3'
          },
          {
            opcode: 'showDebugLog',
            blockType: Scratch.BlockType.COMMAND,
            text: 'show debug log'
          },

          '---',

          // Motor blocks
          { blockType: Scratch.BlockType.LABEL, text: t('motors') },
          {
            opcode: 'motorRun',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorRun'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'motorRunTime',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorRunTime'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'motorRunRotations',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorRunRotations'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              ROTATIONS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'motorRunDegrees',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorRunDegrees'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              DEGREES: { type: Scratch.ArgumentType.NUMBER, defaultValue: 90 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'motorStop',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorStop'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              BRAKE: { type: Scratch.ArgumentType.STRING, menu: 'brakeMode' }
            }
          },
          {
            opcode: 'motorReset',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorReset'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' }
            }
          },
          {
            opcode: 'motorPolarity',
            blockType: Scratch.BlockType.COMMAND,
            text: t('motorPolarity'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' },
              POLARITY: { type: Scratch.ArgumentType.STRING, menu: 'motorPolarity' }
            }
          },
          {
            opcode: 'tankDrive',
            blockType: Scratch.BlockType.COMMAND,
            text: t('tankDrive'),
            arguments: {
              LEFT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              RIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              UNIT: { type: Scratch.ArgumentType.STRING, menu: 'driveUnit' }
            }
          },
          {
            opcode: 'steerDrive',
            blockType: Scratch.BlockType.COMMAND,
            text: t('steerDrive'),
            arguments: {
              STEERING: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              SPEED: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              UNIT: { type: Scratch.ArgumentType.STRING, menu: 'driveUnit' }
            }
          },
          {
            opcode: 'motorPosition',
            blockType: Scratch.BlockType.REPORTER,
            text: t('motorPosition'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' }
            }
          },
          {
            opcode: 'motorSpeed',
            blockType: Scratch.BlockType.REPORTER,
            text: t('motorSpeed'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'motorPorts' }
            }
          },

          '---',

          // Sensor blocks
          { blockType: Scratch.BlockType.LABEL, text: t('sensors') },
          {
            opcode: 'touchSensor',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('touchSensor'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' }
            }
          },
          {
            opcode: 'touchSensorBumped',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('touchSensorBumped'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' }
            }
          },
          {
            opcode: 'colorSensor',
            blockType: Scratch.BlockType.REPORTER,
            text: t('colorSensor'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              MODE: { type: Scratch.ArgumentType.STRING, menu: 'colorModes' }
            }
          },
          {
            opcode: 'colorSensorRGB',
            blockType: Scratch.BlockType.REPORTER,
            text: t('colorSensorRGB'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              COMPONENT: { type: Scratch.ArgumentType.STRING, menu: 'rgbComponents' }
            }
          },
          {
            opcode: 'ultrasonicSensor',
            blockType: Scratch.BlockType.REPORTER,
            text: t('ultrasonicSensor'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              UNIT: { type: Scratch.ArgumentType.STRING, menu: 'distanceUnits' }
            }
          },
          {
            opcode: 'ultrasonicListen',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('ultrasonicListen'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' }
            }
          },
          {
            opcode: 'gyroSensor',
            blockType: Scratch.BlockType.REPORTER,
            text: t('gyroSensor'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              MODE: { type: Scratch.ArgumentType.STRING, menu: 'gyroModes' }
            }
          },
          {
            opcode: 'gyroReset',
            blockType: Scratch.BlockType.COMMAND,
            text: t('gyroReset'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' }
            }
          },
          {
            opcode: 'irProximity',
            blockType: Scratch.BlockType.REPORTER,
            text: t('irProximity'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' }
            }
          },
          {
            opcode: 'irBeaconHeading',
            blockType: Scratch.BlockType.REPORTER,
            text: t('irBeaconHeading'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'irBeaconDistance',
            blockType: Scratch.BlockType.REPORTER,
            text: t('irBeaconDistance'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'irRemoteButton',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('irRemoteButton'),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: 'sensorPorts' },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: 'irButtons' }
            }
          },

          '---',

          // Display blocks
          { blockType: Scratch.BlockType.LABEL, text: t('display') },
          {
            opcode: 'screenClear',
            blockType: Scratch.BlockType.COMMAND,
            text: t('screenClear')
          },
          {
            opcode: 'screenText',
            blockType: Scratch.BlockType.COMMAND,
            text: t('screenText'),
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello' },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          },
          {
            opcode: 'screenTextLarge',
            blockType: Scratch.BlockType.


            COMMAND,
            text: t('screenTextLarge'),
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello' },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          },
          {
            opcode: 'drawPixel',
            blockType: Scratch.BlockType.COMMAND,
            text: t('drawPixel'),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'drawLine',
            blockType: Scratch.BlockType.COMMAND,
            text: t('drawLine'),
            arguments: {
              X1: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y1: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              X2: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y2: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 }
            }
          },
          {
            opcode: 'drawCircle',
            blockType: Scratch.BlockType.COMMAND,
            text: t('drawCircle'),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              R: { type: Scratch.ArgumentType.NUMBER, defaultValue: 20 },
              FILL: { type: Scratch.ArgumentType.STRING, menu: 'fillMode' }
            }
          },
          {
            opcode: 'drawRectangle',
            blockType: Scratch.BlockType.COMMAND,
            text: t('drawRectangle'),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
              W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              H: { type: Scratch.ArgumentType.NUMBER, defaultValue: 30 },
              FILL: { type: Scratch.ArgumentType.STRING, menu: 'fillMode' }
            }
          },
          {
            opcode: 'screenUpdate',
            blockType: Scratch.BlockType.COMMAND,
            text: t('screenUpdate')
          },
          {
            opcode: 'screenInvert',
            blockType: Scratch.BlockType.COMMAND,
            text: t('screenInvert')
          },

          '---',

          // Sound blocks
          { blockType: Scratch.BlockType.LABEL, text: t('sound') },
          {
            opcode: 'playTone',
            blockType: Scratch.BlockType.COMMAND,
            text: t('playTone'),
            arguments: {
              FREQ: { type: Scratch.ArgumentType.NUMBER, defaultValue: 440 },
              DURATION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 500 }
            }
          },
          {
            opcode: 'playNote',
            blockType: Scratch.BlockType.COMMAND,
            text: t('playNote'),
            arguments: {
              NOTE: { type: Scratch.ArgumentType.STRING, menu: 'notes' },
              DURATION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'beep',
            blockType: Scratch.BlockType.COMMAND,
            text: t('beep')
          },
          {
            opcode: 'setVolume',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setVolume'),
            arguments: {
              VOLUME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 80 }
            }
          },
          {
            opcode: 'getVolume',
            blockType: Scratch.BlockType.REPORTER,
            text: t('getVolume')
          },
          {
            opcode: 'stopSound',
            blockType: Scratch.BlockType.COMMAND,
            text: t('stopSound')
          },

          '---',

          // LED blocks
          { blockType: Scratch.BlockType.LABEL, text: t('leds') },
          {
            opcode: 'setLED',
            blockType: Scratch.BlockType.COMMAND,
            text: t('setLED'),
            arguments: {
              COLOR: { type: Scratch.ArgumentType.STRING, menu: 'ledColors' }
            }
          },
          {
            opcode: 'ledAllOff',
            blockType: Scratch.BlockType.COMMAND,
            text: t('ledAllOff')
          },

          '---',

          // Button blocks
          { blockType: Scratch.BlockType.LABEL, text: t('buttons') },
          {
            opcode: 'buttonPressed',
            blockType: Scratch.BlockType.BOOLEAN,
            text: t('buttonPressed'),
            arguments: {
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: 'buttons' }
            }
          },
          {
            opcode: 'waitForButton',
            blockType: Scratch.BlockType.COMMAND,
            text: t('waitForButton'),
            arguments: {
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: 'buttons' }
            }
          },

          '---',

          // System blocks
          { blockType: Scratch.BlockType.LABEL, text: t('system') },
          {
            opcode: 'batteryLevel',
            blockType: Scratch.BlockType.REPORTER,
            text: t('batteryLevel')
          },
          {
            opcode: 'batteryCurrent',
            blockType: Scratch.BlockType.REPORTER,
            text: t('batteryCurrent')
          },
          {
            opcode: 'batteryVoltage',
            blockType: Scratch.BlockType.REPORTER,
            text: t('batteryVoltage')
          },
          {
            opcode: 'freeMemory',
            blockType: Scratch.BlockType.REPORTER,
            text: t('freeMemory')
          },

          '---',

          // Timer blocks
          { blockType: Scratch.BlockType.LABEL, text: t('timers') },
          {
            opcode: 'resetTimer',
            blockType: Scratch.BlockType.COMMAND,
            text: t('resetTimer'),
            arguments: {
              TIMER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'timerValue',
            blockType: Scratch.BlockType.REPORTER,
            text: t('timerValue'),
            arguments: {
              TIMER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'waitSeconds',
            blockType: Scratch.BlockType.COMMAND,
            text: t('waitSeconds'),
            arguments: {
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'waitMillis',
            blockType: Scratch.BlockType.COMMAND,
            text: t('waitMillis'),
            arguments: {
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1000 }
            }
          },
        ],
        menus: {
          connectionModes: {
            items: [
              { text: '📱 Web Serial (Chrome/Edge)', value: 'serial' },
              { text: '🔵 Scratch Link (Bluetooth)', value: 'scratchlink' },
              { text: '🌉 Bridge Server (WebSocket)', value: 'bridge' },
              { text: '🌐 HTTP (Direct EV3)', value: 'http' }
            ]
          },
          motorPorts: {
            acceptReporters: true,
            items: ['A', 'B', 'C', 'D']
          },
          sensorPorts: {
            acceptReporters: true,
            items: ['1', '2', '3', '4']
          },
          brakeMode: {
            items: ['brake', 'coast']
          },
          motorPolarity: {
            items: [
              { text: 'forward (+1)', value: '1' },
              { text: 'reverse (-1)', value: '-1' },
              { text: 'toggle (0)', value: '0' }
            ]
          },
          driveUnit: {
            items: ['seconds', 'rotations', 'degrees']
          },
          fillMode: {
            items: ['outline', 'filled']
          },
          ledColors: {
            items: ['OFF', 'GREEN', 'RED', 'ORANGE']
          },
          notes: {
            items: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
          },
          buttons: {
            items: ['up', 'down', 'left', 'right', 'enter', 'back']
          },
          colorModes: {
            items: ['reflected', 'ambient', 'color', 'raw']
          },
          rgbComponents: {
            items: ['red', 'green', 'blue']
          },
          distanceUnits: {
            items: ['cm', 'inch']
          },
          gyroModes: {
            items: ['angle', 'rate', 'fast', 'angle_rate']
          },
          irButtons: {
            items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
          }
        }
      };
    }

    async setMode(args) {
      await this.ev3.setMode(args.MODE);
    }

    async connect(args) {
      return await this.ev3.connect(args.PARAM);
    }

    async disconnect() {
      await this.ev3.disconnect();
    }

    isConnected() {
      return this.ev3.isConnected();
    }

    // ============================================================================
    // BRIDGE CONFIGURATION METHODS
    // ============================================================================

    setBridgeHost(args) {
      this.bridgeHost = args.URL;
      this.ev3.setBridgeConfig({ host: this.bridgeHost });
      log.info("Bridge host configured:", this.bridgeHost);
    }

    setBridgePort(args) {
      this.bridgePort = parseInt(args.PORT);
      this.ev3.setBridgeConfig({ port: this.bridgePort });
      log.info("Bridge port configured:", this.bridgePort);
    }

    enableBridgeSSL() {
      this.bridgeSSL = true;
      this.ev3.setBridgeConfig({ ssl: true });
      log.info("Bridge SSL enabled (wss://)");
    }

    disableBridgeSSL() {
      this.bridgeSSL = false;
      this.ev3.setBridgeConfig({ ssl: false });
      log.info("Bridge SSL disabled (ws://)");
    }

    setBridgeAuthToken(args) {
      this.bridgeAuthToken = args.TOKEN || null;
      this.ev3.setBridgeConfig({ authToken: this.bridgeAuthToken });
      log.info("Bridge auth token configured");
    }

    clearBridgeAuthToken() {
      this.bridgeAuthToken = null;
      this.ev3.setBridgeConfig({ authToken: null });
      log.info("Bridge auth token cleared");
    }

    async testBridgeConnection() {
      try {
        const protocol = this.bridgeSSL ? 'wss' : 'ws';
        const url = `${protocol}://${this.bridgeHost}:${this.bridgePort}`;
        
        log.info("Testing bridge connection:", url);
        
        // Try to connect temporarily
        const testBackend = new BridgeBackend(() => {}, () => {});
        const success = await testBackend.connect({
          host: this.bridgeHost,
          port: this.bridgePort,
          ssl: this.bridgeSSL,
          authToken: this.bridgeAuthToken
        });
        
        if (success) {
          // Request status
          const status = await testBackend.requestStatus();
          testBackend.disconnect();
          
          if (status) {
            return `✅ Connected (${status.clients || 0} clients)`;
          }
          return '✅ Connected';
        }
        
        return '❌ Connection failed';
        
      } catch (error) {
        log.error("Bridge test failed:", error);
        return '❌ Error: ' + error.message;
      }
    }

    // ============================================================================
    // EV3 CONFIGURATION METHODS
    // ============================================================================

    setEV3IP(args) {
      this.ev3IP = args.IP;
      this.ev3.ev3IP = this.ev3IP;
      log.info("EV3 IP configured:", this.ev3IP);
    }

    setEV3Port(args) {
      this.ev3Port = parseInt(args.PORT);
      this.ev3.ev3Port = this.ev3Port;
      log.info("EV3 port configured:", this.ev3Port);
    }

    async testConnection() {
      try {
        const url = `http://${this.ev3IP}:${this.ev3Port}/`;
        const response = await this.fetchWithTimeout(url, { method: 'GET' }, 2000);
        return response.ok ? '✅ Connected' : '❌ Connection failed';
      } catch (error) {
        log.error("Connection test failed:", error);
        return '❌ ' + error.message;
      }
    }

    // ============================================================================
    // COMPILER CONFIGURATION METHODS
    // ============================================================================

    setLMSApiUrl(args) {
      this.lmsApiUrl = args.URL;
      this.lmsApiPort = parseInt(args.PORT);
      log.info("LMS API configured:", this.lmsApiUrl, this.lmsApiPort);
    }

    async testCompiler() {
      try {
        const url = `${this.lmsApiUrl}:${this.lmsApiPort}/`;
        const response = await this.fetchWithTimeout(url, { method: 'GET' }, 2000);
        return response.ok ? '✅ Compiler online' : '❌ Compiler offline';
      } catch (error) {
        log.error("Compiler test failed:", error);
        return '❌ ' + error.message;
      }
    }

    // Transpilation methods
    transpileToLMS() {
      try {
        this.lmsCode = this.transpiler.transpile();
        let message = "✅ LMS code generated!";
        if (this.transpiler.errors.length > 0) {
          message += `\n\n❌ ${this.transpiler.errors.length} ERROR(S):\n`;
          message += this.transpiler.errors.map((err, i) => `${i + 1}. ${err.message}`).join('\n');
        }
        if (this.transpiler.warnings.length > 0) {
          message += `\n\n⚠️ ${this.transpiler.warnings.length} WARNING(S):\n`;
          message += this.transpiler.warnings.map((warn, i) => `${i + 1}. ${warn.message}`).join('\n');
        }
        if (this.transpiler.errors.length > 0 || this.transpiler.warnings.length > 0) {
          this.showDiagnosticsModal(message);
        } else {
          alert(message);
        }
      } catch (error) {
        log.error("Transpilation error", error);
        alert("❌ Transpilation failed:\n" + error.message);
      }
    }

    showLMSCode() {
      if (!this.lmsCode) {
        alert(t('noCodeGenerated'));
        return;
      }
      this.showModal(t('generatedCode'), this.lmsCode);
    }

    downloadLMSCode() {
      if (!this.lmsCode) {
        alert(t('generateFirst'));
        return;
      }
      this.downloadFile('program.lms', this.lmsCode, 'text/plain');
      alert(t('downloaded') + ' program.lms');
    }

    async compileToRBF() {
      if (!this.lmsCode) {
        alert(t('generateFirst'));
        return;
      }
      try {
        log.info("Starting RBF compilation");
        const url = `${this.lmsApiUrl}:${this.lmsApiPort}/compile`;
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: this.lmsCode })
        }, this.COMPILE_TIMEOUT_MS);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        log.info("Compilation response received", result);

        if (result.success) {
          this.rbfBase64 = result.base64;
          const binaryString = atob(this.rbfBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          this.rbfBytecode = bytes;
          log.info("RBF bytecode stored", bytes.length, "bytes");
          let message = t('compilationSuccess');
          if (result.message) message += "\n\n" + result.message;
          alert(message);
        } else {
          throw new Error(result.error || "Unknown compilation error");
        }
      } catch (error) {
        log.error("Compilation error", error);
        let errorMessage = t('compilationFailed') + "\n\n";
        errorMessage += "Error: " + error.message;
        this.showModal("Compilation Failed", errorMessage);
      }
    }

    showRBFCode() {
      if (!this.rbfBytecode) {
        alert(t('compileFirst'));
        return;
      }
      const hexStr = Array.from(this.rbfBytecode).map(b => b.toString(16).padStart(2, '0')).join(' ');
      this.showModal(t('rbfBytecode'), hexStr);
    }

    downloadRBF() {
      if (!this.rbfBytecode) {
        alert(t('compileFirst'));
        return;
      }
      this.downloadFile('program.rbf', this.rbfBytecode, 'application/octet-stream');
      alert(t('downloaded') + ' program.rbf');
    }

    async uploadAndRun() {
      if (!this.rbfBytecode) {
        alert(t('compileFirst'));
        return;
      }
      try {
        const url = `http://${this.ev3IP}:${this.ev3Port}/upload`;
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: this.rbfBytecode
        }, 10000);

        if (response.ok) {
          alert(t('uploadSuccess'));
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        log.error("Upload error", error);
        alert(t('uploadFailed') + "\n" + error.message);
      }
    }

    showDebugLog() {
      if (!this.lmsCode) {
        alert("No code has been generated yet. Generate LMS code first.");
        return;
      }
      this.showFullDiagnostics();
    }

    showFullDiagnostics() {
      let fullReport = "=== TRANSPILATION DIAGNOSTICS ===\n\n";
      fullReport += `Generated Code Length: ${this.lmsCode.length} characters\n`;
      fullReport += `Total Lines: ${this.lmsCode.split('\n').length}\n`;
      fullReport += `Errors: ${this.transpiler.errors.length}\n`;
      fullReport += `Warnings: ${this.transpiler.warnings.length}\n\n`;

      if (this.transpiler.errors.length > 0) {
        fullReport += "=== ERRORS ===\n";
        this.transpiler.errors.forEach((err, i) => {
          fullReport += `\nError ${i + 1}:\n`;
          fullReport += `  Time: ${err.timestamp}\n`;
          fullReport += `  Message: ${err.message}\n`;
          if (err.data) fullReport += `  Details: ${JSON.stringify(err.data, null, 2)}\n`;
        });
        fullReport += "\n";
      }

      if (this.transpiler.warnings.length > 0) {
        fullReport += "=== WARNINGS ===\n";
        this.transpiler.warnings.forEach((warn, i) => {
          fullReport += `\nWarning ${i + 1}:\n`;
          fullReport += `  Time: ${warn.timestamp}\n`;
          fullReport += `  Message: ${warn.message}\n`;
          if (warn.data) fullReport += `  Details: ${JSON.stringify(warn.data, null, 2)}\n`;
        });
        fullReport += "\n";
      }

      if (this.transpiler.debugLog && this.transpiler.debugLog.length > 0) {
        fullReport += "=== DEBUG LOG (Last 100 entries) ===\n";
        const recentLogs = this.transpiler.debugLog.slice(-100);
        recentLogs.forEach((log) => {
          fullReport += `[${log.timestamp}] [${log.level}] ${log.message}\n`;
          if (log.data) fullReport += `  Data: ${JSON.stringify(log.data)}\n`;
        });
      } else {
        fullReport += "=== DEBUG LOG ===\nNo debug entries available.\n";
      }

      this.showModal("Full Diagnostic Report", fullReport);
    }

    showDiagnosticsModal(message) {
      const modal = document.createElement('div');
      modal.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border: 3px solid #7C3A9A; border-radius: 10px; max-width: 700px; max-height: 80%; overflow: auto; z-index: 10000; box-shadow: 0 8px 16px rgba(0,0,0,0.4); color: black; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`;

      const titleEl = document.createElement('h3');
      titleEl.textContent = 'Transpilation Results';
      titleEl.style.cssText = 'margin-top: 0; color: #7C3A9A; font-size: 20px;';

      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.6;`;

      const formattedMessage = message
        .replace(/✅/g, '<span style="color: green; font-weight: bold;">✅</span>')
        .replace(/❌/g, '<span style="color: red; font-weight: bold;">❌</span>')
        .replace(/⚠️/g, '<span style="color: orange; font-weight: bold;">⚠️</span>')
        .replace(/ERROR\(S\):/g, '<span style="color: red; font-weight: bold;">ERROR(S):</span>')
        .replace(/WARNING\(S\):/g, '<span style="color: orange; font-weight: bold;">WARNING(S):</span>');

      contentDiv.innerHTML = formattedMessage;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;';

      const detailsBtn = document.createElement('button');
      detailsBtn.textContent = 'View Full Log';
      detailsBtn.style.cssText = 'padding: 10px 20px; background: #5C2A7A; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      detailsBtn.onclick = () => this.showFullDiagnostics();

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = 'padding: 10px 20px; background: #7C3A9A; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      closeBtn.onclick = () => document.body.removeChild(modal);

      buttonContainer.appendChild(detailsBtn);
      buttonContainer.appendChild(closeBtn);

      modal.appendChild(titleEl);
      modal.appendChild(contentDiv);
      modal.appendChild(buttonContainer);

      document.body.appendChild(modal);
    }

    // Motor methods (real-time control when connected)
    motorRun(args) {
      log.debug("motorRun called", args);
    }

    motorRunTime(args) {
      log.debug("motorRunTime called", args);
    }

    motorRunRotations(args) {
      log.debug("motorRunRotations called", args);
    }

    motorRunDegrees(args) {
      log.debug("motorRunDegrees called", args);
    }

    motorStop(args) {
      log.debug("motorStop called", args);
    }

    motorReset(args) {
      log.debug("motorReset called", args);
    }

    motorPolarity(args) {
      log.debug("motorPolarity called", args);
    }

    tankDrive(args) {
      log.debug("tankDrive called", args);
    }

    steerDrive(args) {
      log.debug("steerDrive called", args);
    }

    motorPosition(args) {
      log.debug("motorPosition called", args);
      return 0;
    }

    motorSpeed(args) {
      log.debug("motorSpeed called", args);
      return 0;
    }

    // Sensor methods
    touchSensor(args) {
      log.debug("touchSensor called", args);
      return false;
    }

    touchSensorBumped(args) {
      log.debug("touchSensorBumped called", args);
      return false;
    }

    colorSensor(args) {
      log.debug("colorSensor called", args);
      return 0;
    }

    colorSensorRGB(args) {
      log.debug("colorSensorRGB called", args);
      return 0;
    }

    ultrasonicSensor(args) {
      log.debug("ultrasonicSensor called", args);
      return 0;
    }

    ultrasonicListen(args) {
      log.debug("ultrasonicListen called", args);
      return false;
    }

    gyroSensor(args) {
      log.debug("gyroSensor called", args);
      return 0;
    }

    gyroReset(args) {
      log.debug("gyroReset called", args);
    }

    irProximity(args) {
      log.debug("irProximity called", args);
      return 0;
    }

    irBeaconHeading(args) {
      log.debug("irBeaconHeading called", args);
      return 0;
    }

    irBeaconDistance(args) {
      log.debug("irBeaconDistance called", args);
      return 0;
    }

    irRemoteButton(args) {
      log.debug("irRemoteButton called", args);
      return false;
    }

    // Display methods
    screenClear() {
      log.debug("screenClear called");
    }

    screenText(args) {
      log.debug("screenText called", args);
    }

    screenTextLarge(args) {
      log.debug("screenTextLarge called", args);
    }

    drawPixel(args) {
      log.debug("drawPixel called", args);
    }

    drawLine(args) {
      log.debug("drawLine called", args);
    }

    drawCircle(args) {
      log.debug("drawCircle called", args);
    }

    drawRectangle(args) {
      log.debug("drawRectangle called", args);
    }

    screenUpdate() {
      log.debug("screenUpdate called");
    }

    screenInvert() {
      log.debug("screenInvert called");
    }

    // Sound methods
    playTone(args) {
      log.debug("playTone called", args);
    }

    playNote(args) {
      log.debug("playNote called", args);
    }

    beep() {
      log.debug("beep called");
    }

    setVolume(args) {
      log.debug("setVolume called", args);
    }

    getVolume() {
      log.debug("getVolume called");
      return 80;
    }

    stopSound() {
      log.debug("stopSound called");
    }

    // LED methods
    setLED(args) {
      log.debug("setLED called", args);
    }

    ledAllOff() {
      log.debug("ledAllOff called");
    }

    // Button methods
    buttonPressed(args) {
      log.debug("buttonPressed called", args);
      return false;
    }

    waitForButton(args) {
      log.debug("waitForButton called", args);
    }

    // System methods
    batteryLevel() {
      log.debug("batteryLevel called");
      return 100;
    }

    batteryCurrent() {
      log.debug("batteryCurrent called");
      return 0;
    }

    batteryVoltage() {
      log.debug("batteryVoltage called");
      return 9.0;
    }

    freeMemory() {
      log.debug("freeMemory called");
      return 0;
    }

    // Timer methods
    resetTimer(args) {
      log.debug("resetTimer called", args);
    }

    timerValue(args) {
      log.debug("timerValue called", args);
      return 0;
    }

    waitSeconds(args) {
      log.debug("waitSeconds called", args);
    }

    waitMillis(args) {
      log.debug("waitMillis called", args);
    }

    // Utility methods
    async fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Timeout after ${timeoutMs}ms`);
        }
        throw error;
      }
    }

    showModal(title, content) {
      const modal = document.createElement('div');
      modal.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #7C3A9A; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto; z-index: 10000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); color: black;`;

      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      titleEl.style.cssText = 'margin-top: 0; color: #7C3A9A;';

      const pre = document.createElement('pre');
      pre.style.cssText = 'background: #f5f5f5; color: black; border: 1px solid #ccc; padding: 10px; overflow: auto; max-height: 500px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;';
      pre.textContent = content;

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #7C3A9A; color: white; border: none; border-radius: 4px; cursor: pointer;';
      closeBtn.onclick = () => document.body.removeChild(modal);

      modal.appendChild(titleEl);
      modal.appendChild(pre);
      modal.appendChild(closeBtn);

      document.body.appendChild(modal);
    }

    downloadFile(filename, content, mimeType) {
      let blob;
      if (content instanceof Uint8Array) {
        blob = new Blob([content], { type: mimeType });
      } else {
        blob = new Blob([content], { type: mimeType });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  Scratch.extensions.register(new EV3ComprehensiveExtension(Scratch.vm ? Scratch.vm.runtime : null));

})(Scratch);