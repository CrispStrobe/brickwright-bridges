// Name: LEGO Spike Prime (BLE Alt)
// ID: CrispStrobe/legospikeprime_ble
// Description: Alternative BLE control for Spike Prime.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("SPIKE Prime (BLE) extension must run unsandboxed");
  }

  const ArgumentType = Scratch.ArgumentType;
  const BlockType = Scratch.BlockType;
  const Cast = Scratch.Cast;

  // ============================================================================
  // DEBUG CONFIGURATION
  // ============================================================================
  const DEBUG = {
    enabled: true,
    bluetooth: true,
    protocol: true,
    sensors: true,
    motors: true,
    transpiler: true,
    execution: true,
    verbose: false,
  };

  const log = {
    info: (...args) => DEBUG.enabled && console.log("🔵 [SPIKE-BLE]", ...args),
    warn: (...args) =>
      DEBUG.enabled && console.warn("⚠️  [SPIKE-BLE]", ...args),
    error: (...args) =>
      DEBUG.enabled && console.error("❌ [SPIKE-BLE]", ...args),
    bt: (...args) => DEBUG.bluetooth && console.log("📡 [BLE]", ...args),
    proto: (...args) => DEBUG.protocol && console.log("📦 [PROTOCOL]", ...args),
    sensor: (...args) => DEBUG.sensors && console.log("📊 [SENSOR]", ...args),
    motor: (...args) => DEBUG.motors && console.log("⚙️  [MOTOR]", ...args),
    transpile: (...args) =>
      DEBUG.transpiler && console.log("🔄 [TRANSPILE]", ...args),
    exec: (...args) => DEBUG.execution && console.log("▶️  [EXEC]", ...args),
    verbose: (...args) => DEBUG.verbose && console.log("🔍 [VERBOSE]", ...args),
  };

  log.info("Extension loading...");

  // ============================================================================
  // TRANSLATIONS
  // ============================================================================
  const translations = {
    en: {
      extensionName: "SPIKE Prime (BLE)",

      // Connection & Modes
      connection: "Connection & Modes",
      scanAndConnect: "scan and connect to SPIKE hub",
      disconnect: "disconnect from hub",
      isConnected: "connected to hub?",
      enableStreamingMode: "enable streaming mode",
      disableStreamingMode: "disable streaming mode",
      getHubType: "hub type",

      // Transpilation
      transpilation: "Code Generation",
      transpileProject: "transpile project to SPIKE Python",
      showGeneratedCode: "show generated code",
      downloadCode: "download as .py file",
      uploadAndRun: "upload and run project",
      uploadScript: "upload project as [NAME]",

      // Movement
      movement: "Movement (Motor Pairs)",
      setMovementMotors: "set movement motors [PORT_A] and [PORT_B]",
      moveForward: "move [DIRECTION] for [VALUE] [UNIT]",
      moveSteering: "move with steering [STEERING] for [VALUE] [UNIT]",
      steer: "start steering [STEERING] speed [SPEED]%",
      startTank: "start tank drive left [LEFT] right [RIGHT]",
      setMovementSpeed: "set movement speed to [SPEED]%",
      stopMovement: "stop movement",

      // Motors
      motors: "Motors",
      motorRunFor: "[PORT] run [DIRECTION] for [VALUE] [UNIT]",
      motorRunToPosition: "[PORT] run to position [POSITION] degrees",
      motorStart: "[PORT] start motor [DIRECTION]",
      motorStop: "[PORT] stop motor",
      motorSetSpeed: "[PORT] set speed to [SPEED]%",
      getPosition: "[PORT] position",
      getSpeed: "[PORT] speed (deg/s)",
      resetMotorPosition: "reset [PORT] motor position to [POSITION]",

      // Display
      display: "5x5 Display",
      displayText: "write [TEXT]",
      displayImage: "show image [IMAGE]",
      displayPattern: "display pattern [PATTERN]",
      displayClear: "clear display",
      setPixel: "set pixel [X] [Y] to [BRIGHTNESS]%",
      setCenterButtonColor: "set center button to [COLOR]",

      // IMU
      imu: "IMU (Motion Sensor)",
      getYaw: "yaw angle",
      getPitch: "pitch angle",
      getRoll: "roll angle",
      resetYaw: "reset yaw angle",
      presetYaw: "preset yaw to [ANGLE] degrees",

      // Sound
      sound: "Sound",
      playBeep: "beep [FREQUENCY] Hz for [DURATION] ms",
      playNote: "play note [NOTE] for [SECS] seconds",
      setVolume: "set volume to [VOLUME]%",
      stopSound: "stop all sounds",

      // Sensors
      sensors: "Sensors",
      getDistance: "[PORT] distance (mm)",
      setDistanceLights: "set [PORT] distance lights [TL] [TR] [BL] [BR]",
      getColor: "[PORT] color",
      getReflection: "[PORT] reflection",
      getForceSensor: "[PORT] force",
      isForceSensorPressed: "[PORT] force sensor pressed?",
      isColor: "[PORT] sees [COLOR]?",

      // Status
      status: "Hub Status",
      getBatteryLevel: "battery level %",

      // Python
      python: "Python Execution",
      runPythonCode: "run Python: [CODE]",

      // Menus
      forward: "forward",
      backward: "backward",

      // Messages
      noCodeGenerated: "No code generated yet!",
      generateFirst: "Generate code first!",
      downloaded: "Downloaded",
      generatedCode: "Generated SPIKE Python Code",
      close: "Close",
    },
    de: {
      extensionName: "SPIKE Prime (BLE)",

      // Connection & Modes
      connection: "Verbindung & Modi",
      scanAndConnect: "SPIKE Hub scannen und verbinden",
      disconnect: "vom Hub trennen",
      isConnected: "mit Hub verbunden?",
      enableStreamingMode: "Streaming-Modus aktivieren",
      disableStreamingMode: "Streaming-Modus deaktivieren",
      getHubType: "Hub-Typ",

      // Transpilation
      transpilation: "Code-Generierung",
      transpileProject: "Projekt zu SPIKE Python transpilieren",
      showGeneratedCode: "generierten Code anzeigen",
      downloadCode: "als .py Datei herunterladen",

      // Movement
      movement: "Bewegung (Motor-Paare)",
      setMovementMotors: "setze Bewegungsmotoren [PORT_A] und [PORT_B]",
      moveForward: "bewege [DIRECTION] für [VALUE] [UNIT]",
      moveSteering: "bewege mit Lenkung [STEERING] für [VALUE] [UNIT]",
      steer: "starte Lenkung [STEERING] Geschwindigkeit [SPEED]%",
      startTank: "starte Kettenantrieb links [LEFT] rechts [RIGHT]",
      setMovementSpeed: "setze Bewegungsgeschwindigkeit auf [SPEED]%",
      stopMovement: "stoppe Bewegung",

      // Motors
      motors: "Motoren",
      motorRunFor: "[PORT] fahre [DIRECTION] für [VALUE] [UNIT]",
      motorRunToPosition: "[PORT] fahre zu Position [POSITION] Grad",
      motorStart: "[PORT] starte Motor [DIRECTION]",
      motorStop: "[PORT] stoppe Motor",
      motorSetSpeed: "[PORT] setze Geschwindigkeit auf [SPEED]%",
      getPosition: "[PORT] Position",
      getSpeed: "[PORT] Geschwindigkeit (Grad/s)",
      resetMotorPosition: "setze [PORT] Motorposition auf [POSITION] zurück",

      // Display
      display: "5x5 Display",
      displayText: "schreibe [TEXT]",
      displayImage: "zeige Bild [IMAGE]",
      displayPattern: "zeige Muster [PATTERN]",
      displayClear: "lösche Display",
      setPixel: "setze Pixel [X] [Y] auf [BRIGHTNESS]%",
      setCenterButtonColor: "setze Center-Button auf [COLOR]",

      // IMU
      imu: "IMU (Bewegungssensor)",
      getYaw: "Gierwinkel",
      getPitch: "Nickwinkel",
      getRoll: "Rollwinkel",
      resetYaw: "setze Gierwinkel zurück",
      presetYaw: "setze Gierwinkel auf [ANGLE] Grad",

      // Sound
      sound: "Sound",
      playBeep: "Piep [FREQUENCY] Hz für [DURATION] ms",
      playNote: "spiele Note [NOTE] für [SECS] Sekunden",
      setVolume: "setze Lautstärke auf [VOLUME]%",
      stopSound: "stoppe alle Sounds",

      // Sensors
      sensors: "Sensoren",
      getDistance: "[PORT] Entfernung (mm)",
      setDistanceLights: "setze [PORT] Entfernungslichter [TL] [TR] [BL] [BR]",
      getColor: "[PORT] Farbe",
      getReflection: "[PORT] Reflexion",
      getForceSensor: "[PORT] Kraft",
      isForceSensorPressed: "[PORT] Kraftsensor gedrückt?",
      isColor: "[PORT] sieht [COLOR]?",

      // Status
      status: "Hub-Status",
      getBatteryLevel: "Batteriestand %",

      // Python
      python: "Python-Ausführung",
      runPythonCode: "führe Python aus: [CODE]",

      // Menus
      forward: "vorwärts",
      backward: "rückwärts",

      // Messages
      noCodeGenerated: "Noch kein Code generiert!",
      generateFirst: "Generiere zuerst Code!",
      downloaded: "Heruntergeladen",
      generatedCode: "Generierter SPIKE Python Code",
      close: "Schließen",
    },
  };

  function detectLanguage() {
    let finalLanguage = "en"; // Default fallback

    // Priority 1: Redux store (most reliable for TurboWarp)
    try {
      if (window.ReduxStore && window.ReduxStore.getState) {
        const state = window.ReduxStore.getState();
        const reduxLocale = state.locales?.locale;
        if (reduxLocale && typeof reduxLocale === "string") {
          return reduxLocale.toLowerCase().startsWith("de") ? "de" : "en";
        }
      }
    } catch (e) {
      // Continue to next method
    }

    // Priority 2: TurboWarp localStorage
    try {
      const twSettings = localStorage.getItem("tw:language");
      if (twSettings) {
        return twSettings.toLowerCase().startsWith("de") ? "de" : "en";
      }
    } catch (e) {
      // Continue to next method
    }

    // Priority 3: navigator.language
    try {
      const navLang = navigator.language;
      if (navLang) {
        return navLang.toLowerCase().startsWith("de") ? "de" : "en";
      }
    } catch (e) {
      // Continue to next method
    }

    return finalLanguage;
  }

  let currentLang = detectLanguage();

  function t(key) {
    return translations[currentLang][key] || translations["en"][key] || key;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  const MathUtil = {
    clamp: (val, min, max) => Math.max(min, Math.min(val, max)),
    scale: (val, inMin, inMax, outMin, outMax) =>
      ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin,
    wrapClamp: (val, min, max) => {
      const range = max - min;
      return ((((val - min) % range) + range) % range) + min;
    },
  };

  // ============================================================================
  // COBS ENCODING/DECODING (UNCHANGED)
  // ============================================================================
  const DELIMITER = 0x02;
  const XOR = 0x03;
  const COBS_CODE_OFFSET = 3;
  const MAX_BLOCK_SIZE = 84;
  const NO_DELIMITER = 0xff;

  const COBS = {
    encode: (data) => {
      const buffer = [];
      let codeIndex = 0;
      let block = 0;

      const beginBlock = () => {
        codeIndex = buffer.length;
        buffer.push(NO_DELIMITER);
        block = 1;
      };

      beginBlock();

      for (const byte of data) {
        if (byte > DELIMITER) {
          buffer.push(byte);
          block++;
        }
        if (byte <= DELIMITER || block > MAX_BLOCK_SIZE) {
          if (byte <= DELIMITER) {
            const delimiterBase = byte * MAX_BLOCK_SIZE;
            const blockOffset = block + COBS_CODE_OFFSET;
            buffer[codeIndex] = delimiterBase + blockOffset;
          }
          beginBlock();
        }
      }

      buffer[codeIndex] = block + COBS_CODE_OFFSET;
      return new Uint8Array(buffer);
    },

    decode: (data) => {
      const buffer = [];

      const unescape = (code) => {
        if (code === 0xff) {
          return { value: null, block: MAX_BLOCK_SIZE + 1 };
        }
        let value = Math.floor((code - COBS_CODE_OFFSET) / MAX_BLOCK_SIZE);
        let block = (code - COBS_CODE_OFFSET) % MAX_BLOCK_SIZE;
        if (block === 0) {
          block = MAX_BLOCK_SIZE;
          value -= 1;
        }
        return { value, block };
      };

      let { value, block } = unescape(data[0]);

      for (let i = 1; i < data.length; i++) {
        block--;
        if (block > 0) {
          buffer.push(data[i]);
          continue;
        }
        if (value !== null) {
          buffer.push(value);
        }
        ({ value, block } = unescape(data[i]));
      }

      return new Uint8Array(buffer);
    },

    pack: (data) => {
      const encoded = COBS.encode(data);
      const buffer = new Uint8Array(encoded.length + 1);
      for (let i = 0; i < encoded.length; i++) {
        buffer[i] = encoded[i] ^ XOR;
      }
      buffer[buffer.length - 1] = DELIMITER;
      return buffer;
    },

    unpack: (frame) => {
      let start = 0;
      if (frame[0] === 0x01) start = 1;
      const unframed = new Uint8Array(frame.length - start - 1);
      for (let i = 0; i < unframed.length; i++) {
        unframed[i] = frame[start + i] ^ XOR;
      }
      return COBS.decode(unframed);
    },
  };

  // ============================================================================
  // MESSAGE TYPES (UNCHANGED)
  // ============================================================================
  const MessageType = {
    INFO_REQUEST: 0x00,
    INFO_RESPONSE: 0x01,
    PROGRAM_FLOW_REQUEST: 0x1e,
    PROGRAM_FLOW_RESPONSE: 0x1f,
    PROGRAM_FLOW_NOTIFICATION: 0x20,
    CONSOLE_NOTIFICATION: 0x21,
    TUNNEL_MESSAGE: 0x32,
    DEVICE_NOTIFICATION_REQUEST: 0x28,
    DEVICE_NOTIFICATION_RESPONSE: 0x29,
    DEVICE_NOTIFICATION: 0x3c,
  };

  const DeviceMessageType = {
    BATTERY: 0x00,
    IMU_VALUES: 0x01,
    MATRIX_5x5_DISPLAY: 0x02,
    MOTOR: 0x0a,
    FORCE_SENSOR: 0x0b,
    COLOR_SENSOR: 0x0c,
    DISTANCE_SENSOR: 0x0d,
    MATRIX_3x3_COLOR: 0x0e,
  };

  const SpikeColor = {
    BLACK: 0x00,
    MAGENTA: 0x01,
    PURPLE: 0x02,
    BLUE: 0x03,
    AZURE: 0x04,
    TURQUOISE: 0x05,
    GREEN: 0x06,
    YELLOW: 0x07,
    ORANGE: 0x08,
    RED: 0x09,
    WHITE: 0x0a,
    NONE: 0xff,
  };

  const SpikePort = {
    A: 0x00,
    B: 0x01,
    C: 0x02,
    D: 0x03,
    E: 0x04,
    F: 0x05,
  };

  // ============================================================================
  // BASE64 UTILITIES (UNCHANGED)
  // ============================================================================
  const Base64Util = {
    uint8ArrayToBase64: (array) => btoa(String.fromCharCode.apply(null, array)),
    base64ToUint8Array: (base64) => {
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return array;
    },
  };

  // ============================================================================
  // RATE LIMITER (UNCHANGED)
  // ============================================================================
  class RateLimiter {
    constructor(maxRate) {
      this._maxRate = maxRate;
      this._lastSendTime = 0;
      this._sendInterval = 1000 / maxRate;
    }

    okayToSend() {
      const now = Date.now();
      if (now - this._lastSendTime >= this._sendInterval) {
        this._lastSendTime = now;
        return true;
      }
      return false;
    }
  }

  // ============================================================================
  // JSONRPC CLASS (UNCHANGED)
  // ============================================================================
  class JSONRPC {
    constructor() {
      this._requestID = 0;
      this._openRequests = {};
    }

    sendRemoteRequest(method, params) {
      const requestID = this._requestID++;
      const promise = new Promise((resolve, reject) => {
        this._openRequests[requestID] = { resolve, reject };

        setTimeout(() => {
          if (this._openRequests[requestID]) {
            delete this._openRequests[requestID];
            log.warn("Request timeout:", method, "ID:", requestID);
            reject(new Error("Request timeout"));
          }
        }, 5000);
      });
      this._sendRequest(method, params, requestID);
      return promise;
    }

    sendRemoteNotification(method, params) {
      this._sendRequest(method, params);
    }

    didReceiveCall(/* method, params */) {
      throw new Error("Must override didReceiveCall");
    }

    _sendMessage(/* jsonMessageObject */) {
      throw new Error("Must override _sendMessage");
    }

    _sendRequest(method, params, id) {
      const request = {
        jsonrpc: "2.0",
        method,
        params,
      };
      if (id !== null && typeof id !== "undefined") {
        request.id = id;
      }
      this._sendMessage(request);
    }

    _handleMessage(json) {
      if (json.jsonrpc !== "2.0") {
        throw new Error(`Bad JSON-RPC version: ${JSON.stringify(json)}`);
      }
      if (Object.prototype.hasOwnProperty.call(json, "method")) {
        this._handleRequest(json);
      } else {
        this._handleResponse(json);
      }
    }

    _sendResponse(id, result, error) {
      const response = {
        jsonrpc: "2.0",
        id,
      };
      if (error) {
        response.error = error;
      } else {
        response.result = result || null;
      }
      this._sendMessage(response);
    }

    _handleResponse(json) {
      const { result, error, id } = json;
      const openRequest = this._openRequests[id];
      delete this._openRequests[id];
      if (openRequest) {
        if (error) {
          openRequest.reject(error);
        } else {
          openRequest.resolve(result);
        }
      }
    }

    _handleRequest(json) {
      const { method, params, id } = json;
      const rawResult = this.didReceiveCall(method, params);
      if (id !== null && typeof id !== "undefined") {
        Promise.resolve(rawResult).then(
          (result) => {
            this._sendResponse(id, result);
          },
          (error) => {
            this._sendResponse(id, null, error);
          },
        );
      }
    }
  }

  // ============================================================================
  // BLE CLASS (UNCHANGED)
  // ============================================================================
  class BLE extends JSONRPC {
    constructor(
      runtime,
      extensionId,
      peripheralOptions,
      connectCallback,
      resetCallback = null,
    ) {
      super();

      this._runtime = runtime;
      this._extensionId = extensionId;
      this._peripheralOptions = peripheralOptions;
      this._connectCallback = connectCallback;
      this._resetCallback = resetCallback;

      this._socket = runtime.getScratchLinkSocket("BLE");
      this._socket.setOnOpen(this.requestPeripheral.bind(this));
      this._socket.setOnClose(this.handleDisconnectError.bind(this));
      this._socket.setOnError(this._handleRequestError.bind(this));
      this._socket.setHandleMessage(this._handleMessage.bind(this));

      this._sendMessage = this._socket.sendMessage.bind(this._socket);

      this._availablePeripherals = {};
      this._connected = false;
      this._characteristicDidChangeCallback = null;
      this._discoverTimeoutID = null;

      this._socket.open();
    }

    requestPeripheral() {
      this._availablePeripherals = {};
      if (this._discoverTimeoutID) {
        window.clearTimeout(this._discoverTimeoutID);
      }
      this._discoverTimeoutID = window.setTimeout(
        this._handleDiscoverTimeout.bind(this),
        15000,
      );

      this.sendRemoteRequest("discover", this._peripheralOptions).catch((e) => {
        this._handleRequestError(e);
      });
    }

    connectPeripheral(id) {
      this.sendRemoteRequest("connect", { peripheralId: id })
        .then(() => {
          this._connected = true;
          this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
          this._connectCallback();
        })
        .catch((e) => {
          this._handleRequestError(e);
        });
    }

    disconnect() {
      if (this._connected) {
        this._connected = false;
      }

      if (this._socket.isOpen()) {
        this._socket.close();
      }

      if (this._discoverTimeoutID) {
        window.clearTimeout(this._discoverTimeoutID);
      }

      this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
    }

    isConnected() {
      return this._connected;
    }

    startNotifications(
      serviceId,
      characteristicId,
      onCharacteristicChanged = null,
    ) {
      const params = {
        serviceId,
        characteristicId,
      };
      this._characteristicDidChangeCallback = onCharacteristicChanged;
      return this.sendRemoteRequest("startNotifications", params).catch((e) => {
        this.handleDisconnectError(e);
      });
    }

    write(
      serviceId,
      characteristicId,
      message,
      encoding = null,
      withResponse = null,
    ) {
      const params = { serviceId, characteristicId, message };
      if (encoding) {
        params.encoding = encoding;
      }
      if (withResponse !== null) {
        params.withResponse = withResponse;
      }
      return this.sendRemoteRequest("write", params).catch((e) => {
        this.handleDisconnectError(e);
      });
    }

    didReceiveCall(method, params) {
      switch (method) {
        case "didDiscoverPeripheral":
          this._availablePeripherals[params.peripheralId] = params;
          this._runtime.emit(
            this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
            this._availablePeripherals,
          );
          if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
          }
          break;
        case "userDidPickPeripheral":
          this._availablePeripherals[params.peripheralId] = params;
          this._runtime.emit(
            this._runtime.constructor.USER_PICKED_PERIPHERAL,
            this._availablePeripherals,
          );
          if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
          }
          break;
        case "userDidNotPickPeripheral":
          this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
          if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
          }
          break;
        case "characteristicDidChange":
          if (this._characteristicDidChangeCallback) {
            this._characteristicDidChangeCallback(params.message);
          }
          break;
        case "ping":
          return 42;
      }
    }

    handleDisconnectError(/* e */) {
      if (!this._connected) return;

      this.disconnect();

      if (this._resetCallback) {
        this._resetCallback();
      }

      this._runtime.emit(
        this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR,
        {
          message: `Scratch lost connection to`,
          extensionId: this._extensionId,
        },
      );
    }

    _handleRequestError(/* e */) {
      this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
        message: `Scratch lost connection to`,
        extensionId: this._extensionId,
      });
    }

    _handleDiscoverTimeout() {
      if (this._discoverTimeoutID) {
        window.clearTimeout(this._discoverTimeoutID);
      }
      this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }
  }

  // ============================================================================
  // SPIKE BLE CONFIG (UNCHANGED)
  // ============================================================================
  const SpikeBLE = {
    service: "0000FD02-0000-1000-8000-00805F9B34FB",
    rxChar: "0000FD02-0001-1000-8000-00805F9B34FB",
    txChar: "0000FD02-0002-1000-8000-00805F9B34FB",
    sendRateMax: 20,
  };

  // ============================================================================
  // SPIKE PERIPHERAL CLASS (UNCHANGED BLE LOGIC)
  // ============================================================================
  class SpikePeripheral {
    constructor(runtime, extensionId) {
      log.info("SpikePeripheral initializing...");

      this._runtime = runtime;
      this._extensionId = extensionId;
      this._ble = null;
      this._rateLimiter = new RateLimiter(SpikeBLE.sendRateMax);
      this._hubType = "SPIKE Prime";

      this._sensors = {
        motors: {},
        colorSensors: {},
        distanceSensors: {},
        forceSensors: {},
        battery: { level: 0, temperature: 0, voltage: 0, current: 0 },
        imu: {
          yaw: 0,
          pitch: 0,
          roll: 0,
          gyroX: 0,
          gyroY: 0,
          gyroZ: 0,
          accelX: 0,
          accelY: 0,
          accelZ: 0,
        },
      };

      this._buffer = [];
      this._replOutput = "";

      this._onConnect = this._onConnect.bind(this);
      this._onMessage = this._onMessage.bind(this);
      this.reset = this.reset.bind(this);

      log.info("SpikePeripheral initialized");
    }

    scan() {
      log.bt("Starting scan...");
      if (this._ble) {
        this._ble.disconnect();
      }

      const bleConfig = {
        filters: [{ services: [SpikeBLE.service] }],
        optionalServices: [],
      };

      try {
        this._ble = new BLE(
          this._runtime,
          this._extensionId,
          bleConfig,
          this._onConnect,
          this.reset,
        );
      } catch (error) {
        log.error("Error creating BLE:", error);
      }
    }

    connect(id) {
      if (this._ble) {
        this._ble.connectPeripheral(id);
      }
    }

    disconnect() {
      if (this._ble) {
        this._ble.disconnect();
      }
      this.reset();
    }

    reset() {
      log.bt("Resetting peripheral state");
      this._sensors = {
        motors: {},
        colorSensors: {},
        distanceSensors: {},
        forceSensors: {},
        battery: { level: 0, temperature: 0, voltage: 0, current: 0 },
        imu: {
          yaw: 0,
          pitch: 0,
          roll: 0,
          gyroX: 0,
          gyroY: 0,
          gyroZ: 0,
          accelX: 0,
          accelY: 0,
          accelZ: 0,
        },
      };
      this._buffer = [];
      this._replOutput = "";
    }

    isConnected() {
      return this._ble ? this._ble.isConnected() : false;
    }

    getHubType() {
      return this._hubType;
    }

    _onConnect() {
      log.bt("Connected! Starting notifications...");

      this._ble.startNotifications(
        SpikeBLE.service,
        SpikeBLE.txChar,
        this._onMessage,
      );

      setTimeout(() => {
        this._enableDeviceNotifications();
      }, 500);
    }

    _enableDeviceNotifications() {
      log.proto("Enabling device notifications...");
      const message = new Uint8Array([
        MessageType.DEVICE_NOTIFICATION_REQUEST,
        100 & 0xff,
        (100 >> 8) & 0xff,
      ]);
      this._send(message, false);
    }

    _onMessage(base64) {
      const frame = Base64Util.base64ToUint8Array(base64);
      log.verbose("Received BLE data, length:", frame.length);

      for (const byte of frame) {
        this._buffer.push(byte);

        if (byte === DELIMITER) {
          const message = new Uint8Array(this._buffer);
          this._buffer = [];

          try {
            const unpacked = COBS.unpack(message);
            this._processMessage(unpacked);
          } catch (error) {
            log.error("Failed to process frame:", error);
          }
        }
      }
    }

    _processMessage(data) {
      if (data.length === 0) return;

      const messageType = data[0];
      log.proto("Processing message, type:", `0x${messageType.toString(16)}`);

      switch (messageType) {
        case MessageType.INFO_RESPONSE:
          log.proto("INFO_RESPONSE received");
          break;

        case MessageType.DEVICE_NOTIFICATION:
          this._handleDeviceNotification(data);
          break;

        case MessageType.CONSOLE_NOTIFICATION:
          const message = new TextDecoder().decode(data.slice(1));
          log.info("Console output:", message);
          this._replOutput += message;
          break;

        case MessageType.PROGRAM_FLOW_RESPONSE:
        case MessageType.PROGRAM_FLOW_NOTIFICATION:
          log.proto("Program flow message received");
          break;
      }
    }

    _handleDeviceNotification(data) {
      const payloadSize = data[1] | (data[2] << 8);
      let offset = 3;

      while (offset < data.length) {
        const deviceType = data[offset];
        log.sensor(
          "Device notification, type:",
          `0x${deviceType.toString(16)}`,
        );

        switch (deviceType) {
          case DeviceMessageType.BATTERY:
            this._sensors.battery.level = data[offset + 1];
            log.sensor("Battery:", this._sensors.battery.level, "%");
            offset += 2;
            break;

          case DeviceMessageType.IMU_VALUES:
            {
              const yaw = data[offset + 3] | (data[offset + 4] << 8);
              const pitch = data[offset + 5] | (data[offset + 6] << 8);
              const roll = data[offset + 7] | (data[offset + 8] << 8);

              this._sensors.imu.yaw = yaw > 32767 ? yaw - 65536 : yaw;
              this._sensors.imu.pitch = pitch > 32767 ? pitch - 65536 : pitch;
              this._sensors.imu.roll = roll > 32767 ? roll - 65536 : roll;

              log.verbose("IMU updated:", this._sensors.imu);
              offset += 21;
            }
            break;

          case DeviceMessageType.MOTOR:
            {
              const port = data[offset + 1];
              const position =
                data[offset + 8] |
                (data[offset + 9] << 8) |
                (data[offset + 10] << 16) |
                (data[offset + 11] << 24);
              const speed = data[offset + 7];

              this._sensors.motors[port] = {
                position:
                  position > 2147483647 ? position - 4294967296 : position,
                speed: speed > 127 ? speed - 256 : speed,
              };

              log.motor(
                "Motor port",
                port,
                "updated:",
                this._sensors.motors[port],
              );
              offset += 12;
            }
            break;

          case DeviceMessageType.COLOR_SENSOR:
            {
              const port = data[offset + 1];
              this._sensors.colorSensors[port] = {
                color: data[offset + 2],
                red: data[offset + 3] | (data[offset + 4] << 8),
                green: data[offset + 5] | (data[offset + 6] << 8),
                blue: data[offset + 7] | (data[offset + 8] << 8),
              };
              log.sensor("Color sensor port", port, "updated");
              offset += 9;
            }
            break;

          case DeviceMessageType.DISTANCE_SENSOR:
            {
              const port = data[offset + 1];
              const distance = data[offset + 2] | (data[offset + 3] << 8);
              this._sensors.distanceSensors[port] = distance;
              log.sensor("Distance sensor port", port, ":", distance, "mm");
              offset += 4;
            }
            break;

          case DeviceMessageType.FORCE_SENSOR:
            {
              const port = data[offset + 1];
              const value = data[offset + 2];
              const pressed = data[offset + 3] === 0x01;
              this._sensors.forceSensors[port] = { value, pressed };
              log.sensor("Force sensor port", port, "updated");
              offset += 4;
            }
            break;

          default:
            log.warn("Unknown device type:", `0x${deviceType.toString(16)}`);
            return;
        }
      }
    }

    _send(message, useLimiter = true) {
      if (!this.isConnected()) {
        return Promise.resolve();
      }

      if (useLimiter && !this._rateLimiter.okayToSend()) {
        log.verbose("Rate limit - message queued");
        return Promise.resolve();
      }

      const packed = COBS.pack(message);
      const base64 = Base64Util.uint8ArrayToBase64(packed);

      log.proto("Sending message, size:", packed.length);

      return this._ble.write(
        SpikeBLE.service,
        SpikeBLE.rxChar,
        base64,
        "base64",
      );
    }

    executeCode(code) {
      if (!this.isConnected()) {
        log.error("Cannot execute code: not connected");
        return Promise.resolve();
      }

      log.exec("Executing Python code:", code);

      const encoder = new TextEncoder();
      const codeBytes = encoder.encode(code);

      const message = new Uint8Array(3 + codeBytes.length);
      message[0] = MessageType.TUNNEL_MESSAGE;
      message[1] = codeBytes.length & 0xff;
      message[2] = (codeBytes.length >> 8) & 0xff;
      message.set(codeBytes, 3);

      return this._send(message, true);
    }

    getBattery() {
      return this._sensors.battery.level;
    }

    getIMU() {
      return this._sensors.imu;
    }

    getMotor(port) {
      return this._sensors.motors[port] || { position: 0, speed: 0 };
    }

    getSensor(type, port) {
      if (type === "color") return this._sensors.colorSensors[port];
      if (type === "distance") return this._sensors.distanceSensors[port];
      if (type === "force") return this._sensors.forceSensors[port];
      return null;
    }

    getReplOutput() {
      return this._replOutput;
    }

    clearReplOutput() {
      this._replOutput = "";
    }
  }

  // ============================================================================
  // CODE TRANSPILER
  // ============================================================================

  class SpikeTranspiler {
    constructor() {
      this.code = [];
      this.imports = new Set();
      this.indent = 0;
      this.movementMotors = { left: "A", right: "B" };
      this.variables = new Map();
      this.broadcasts = [];
      this.scriptCounter = 1;
      this.mainScripts = [];
      this.soundFiles = [];
      this.spriteStates = {};
    }

    reset() {
      this.code = [];
      this.imports = new Set();
      this.indent = 0;
      this.variables.clear();
      this.broadcasts = [];
      this.scriptCounter = 1;
      this.mainScripts = [];
      this.soundFiles = [];
      this.spriteStates = {};
    }

    addImport(module) {
      this.imports.add(module);
    }

    addLine(line) {
      const spaces = "    ".repeat(this.indent);
      this.code.push(spaces + line);
    }

    increaseIndent() {
      this.indent++;
    }

    decreaseIndent() {
      this.indent = Math.max(0, this.indent - 1);
    }

    getCode() {
      // const imports = Array.from(this.imports).sort().join("\n");
      const body = this.code.join("\n");
      // return imports + (imports ? "\n\n" : "") + body;
      return body;
    }

    sanitizeName(name) {
      if (!name) return "unnamed";
      return name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }

    isNumeric(value) {
      if (typeof value === "number") return true;
      if (typeof value === "string") {
        return !isNaN(value) && !isNaN(parseFloat(value));
      }
      return false;
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

          if (
            primitiveType === 4 ||
            primitiveType === 5 ||
            primitiveType === 6 ||
            primitiveType === 7
          ) {
            return String(primitiveValue);
          } else if (primitiveType === 10) {
            if (this.isNumeric(primitiveValue)) {
              return String(primitiveValue);
            }
            return '"' + primitiveValue + '"';
          }
        } else if (typeof inputData === "string") {
          const refBlock = blocks._blocks[inputData];
          if (refBlock) return this.evaluateBlock(refBlock, blocks);
        }

        if (
          inputType === 3 &&
          Array.isArray(inputData) &&
          inputData.length >= 2
        ) {
          if (typeof inputData[0] === "string") {
            const refBlock = blocks._blocks[inputData[0]];
            if (refBlock) return this.evaluateBlock(refBlock, blocks);
          }

          const shadowData = inputData[1];
          if (Array.isArray(shadowData)) {
            const primitiveType = shadowData[0];
            const primitiveValue = shadowData[1];

            if (
              primitiveType === 4 ||
              primitiveType === 5 ||
              primitiveType === 6 ||
              primitiveType === 7
            ) {
              return String(primitiveValue);
            } else if (primitiveType === 10) {
              if (this.isNumeric(primitiveValue)) {
                return String(primitiveValue);
              }
              return '"' + primitiveValue + '"';
            }
          }
        }
      }

      return "0";
    }

    evaluateBlock(block, blocks) {
      // Numbers
      if (
        block.opcode === "math_number" ||
        block.opcode === "math_whole_number" ||
        block.opcode === "math_positive_number" ||
        block.opcode === "math_integer"
      ) {
        const num = this.getFieldValue(block, "NUM");
        return num || "0";
      }
      // Text
      else if (block.opcode === "text") {
        const text = this.getFieldValue(block, "TEXT");
        if (this.isNumeric(text)) return String(text);
        return '"' + (text || "").replace(/"/g, '\\"') + '"';
      }
      // Variables
      else if (block.opcode === "data_variable") {
        const varName = this.getFieldValue(block, "VARIABLE");
        return 'variables.get("' + varName + '", 0)';
      }
      // SPIKE Sensor reporters
      else if (block.opcode === "spikeprime_getMotorPosition") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(get_motor_position(port.${port}))`;
      } else if (block.opcode === "spikeprime_getMotorSpeed") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(get_motor_speed(port.${port}))`;
      } else if (block.opcode === "spikeprime_getColorSensorColor") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(get_color(port.${port}))`;
      } else if (block.opcode === "spikeprime_getDistanceSensor") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(get_distance(port.${port}))`;
      } else if (block.opcode === "spikeprime_getForceSensor") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(get_force(port.${port}))`;
      } else if (block.opcode === "spikeprime_isForceSensorPressed") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        return `(is_force_pressed(port.${port}))`;
      } else if (block.opcode === "spikeprime_getYaw") {
        return "(motion_sensor.tilt_angles()[0] / 10)";
      } else if (block.opcode === "spikeprime_getPitch") {
        return "(motion_sensor.tilt_angles()[1] / 10)";
      } else if (block.opcode === "spikeprime_getRoll") {
        return "(motion_sensor.tilt_angles()[2] / 10)";
      } else if (block.opcode === "spikeprime_getBattery") {
        this.addImport("import hub");
        return "hub.battery.capacity_left()";
      }
      // Operators
      else if (block.opcode === "operator_gt") {
        const op1 = this.getInputValue(block, "OPERAND1", blocks);
        const op2 = this.getInputValue(block, "OPERAND2", blocks);
        return `(${op1} > ${op2})`;
      } else if (block.opcode === "operator_lt") {
        const op1 = this.getInputValue(block, "OPERAND1", blocks);
        const op2 = this.getInputValue(block, "OPERAND2", blocks);
        return `(${op1} < ${op2})`;
      } else if (block.opcode === "operator_equals") {
        const op1 = this.getInputValue(block, "OPERAND1", blocks);
        const op2 = this.getInputValue(block, "OPERAND2", blocks);
        return `(${op1} == ${op2})`;
      } else if (block.opcode === "operator_and") {
        const op1 = this.getInputValue(block, "OPERAND1", blocks);
        const op2 = this.getInputValue(block, "OPERAND2", blocks);
        return `(${op1} and ${op2})`;
      } else if (block.opcode === "operator_or") {
        const op1 = this.getInputValue(block, "OPERAND1", blocks);
        const op2 = this.getInputValue(block, "OPERAND2", blocks);
        return `(${op1} or ${op2})`;
      } else if (block.opcode === "operator_not") {
        const op = this.getInputValue(block, "OPERAND", blocks);
        return `(not ${op})`;
      } else if (block.opcode === "operator_add") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        return `(${num1} + ${num2})`;
      } else if (block.opcode === "operator_subtract") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        return `(${num1} - ${num2})`;
      } else if (block.opcode === "operator_multiply") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        return `(${num1} * ${num2})`;
      } else if (block.opcode === "operator_divide") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        return `(${num1} / ${num2})`;
      } else if (block.opcode === "operator_random") {
        const from = this.getInputValue(block, "FROM", blocks);
        const to = this.getInputValue(block, "TO", blocks);
        this.addImport("import random");
        return `random.randint(int(${from}), int(${to}))`;
      } else if (block.opcode === "operator_join") {
        const s1 = this.getInputValue(block, "STRING1", blocks);
        const s2 = this.getInputValue(block, "STRING2", blocks);
        return `(str(${s1}) + str(${s2}))`;
      } else if (block.opcode === "operator_mod") {
        const num1 = this.getInputValue(block, "NUM1", blocks);
        const num2 = this.getInputValue(block, "NUM2", blocks);
        return `(${num1} % ${num2})`;
      } else if (block.opcode === "operator_round") {
        const num = this.getInputValue(block, "NUM", blocks);
        return `round(${num})`;
      } else if (block.opcode === "operator_mathop") {
        const operator = this.getFieldValue(block, "OPERATOR");
        const num = this.getInputValue(block, "NUM", blocks);
        this.addImport("import math");

        const mathOps = {
          abs: `abs(${num})`,
          floor: `math.floor(${num})`,
          ceiling: `math.ceil(${num})`,
          sqrt: `math.sqrt(${num})`,
          sin: `math.sin(math.radians(${num}))`,
          cos: `math.cos(math.radians(${num}))`,
          tan: `math.tan(math.radians(${num}))`,
          asin: `math.degrees(math.asin(${num}))`,
          acos: `math.degrees(math.acos(${num}))`,
          atan: `math.degrees(math.atan(${num}))`,
          ln: `math.log(${num})`,
          log: `math.log10(${num})`,
          "e ^": `math.exp(${num})`,
          "10 ^": `(10 ** ${num})`,
        };

        return mathOps[operator] || `(${num})`;
      }

      return "0";
    }

    fixPortValue(portValue) {
      // Convert numeric strings to letter ports
      const portMap = { 0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F" };
      const cleaned = portValue.replace(/"/g, "");
      return portMap[cleaned] || cleaned;
    }

    processBlock(block, blocks) {
      const opcode = block.opcode;
      log.transpile("Processing block:", opcode);

      // SPIKE Motor blocks
      if (opcode === "spikeprime_motorRun") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        const direction = this.getInputValue(
          block,
          "DIRECTION",
          blocks,
        ).replace(/"/g, "");
        const speed = direction === "forward" ? "750" : "-750";
        this.addImport("import motor");
        this.addImport("from hub import port");
        this.addLine(`motor.run(port.${port}, ${speed})`);
      } else if (opcode === "spikeprime_motorRunForTime") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        const direction = this.getInputValue(
          block,
          "DIRECTION",
          blocks,
        ).replace(/"/g, "");
        const value = this.getInputValue(block, "VALUE", blocks);
        const unit = this.getInputValue(block, "UNIT", blocks).replace(
          /"/g,
          "",
        );

        let speed = direction === "forward" ? "750" : "-750";
        let duration =
          unit === "seconds"
            ? `${value} * 1000`
            : unit === "degrees"
              ? `(${value} / 360) * 1000`
              : `${value} * 1000`;

        this.addImport("import motor");
        this.addImport("from hub import port");
        this.addLine(
          `await motor.run_for_time(port.${port}, ${duration}, ${speed})`,
        );
      } else if (opcode === "spikeprime_motorStop") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        this.addImport("import motor");
        this.addImport("from hub import port");
        this.addLine(`motor.stop(port.${port})`);
      } else if (opcode === "spikeprime_resetMotorPosition") {
        const port = this.fixPortValue(
          this.getInputValue(block, "PORT", blocks),
        );
        const position = this.getInputValue(block, "POSITION", blocks);
        this.addImport("import motor");
        this.addImport("from hub import port");
        this.addLine(
          `motor.reset_relative_position(port.${port}, ${position})`,
        );
      }

      // Motor Pair blocks
      else if (opcode === "spikeprime_setMovementMotors") {
        const portA = this.fixPortValue(
          this.getInputValue(block, "PORT_A", blocks),
        );
        const portB = this.fixPortValue(
          this.getInputValue(block, "PORT_B", blocks),
        );

        this.movementMotors = { left: portA, right: portB };
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(`motor_pair.unpair(motor_pair.PAIR_1)`);
        this.addLine(
          `motor_pair.pair(motor_pair.PAIR_1, port.${portA}, port.${portB})`,
        );
      } else if (opcode === "spikeprime_motorPairMoveForTime") {
        const direction = this.getInputValue(
          block,
          "DIRECTION",
          blocks,
        ).replace(/"/g, "");
        const value = this.getInputValue(block, "VALUE", blocks);
        const unit = this.getInputValue(block, "UNIT", blocks).replace(
          /"/g,
          "",
        );

        let duration =
          unit === "seconds"
            ? `${value} * 1000`
            : unit === "degrees"
              ? `(${value} / 360) * 1000`
              : `${value} * 1000`;
        let speed = direction === "forward" ? "500" : "-500";

        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(
          `await motor_pair.move_for_time(motor_pair.PAIR_1, 0, ${duration}, velocity=${speed})`,
        );
      } else if (opcode === "spikeprime_motorPairMove") {
        const steering = this.getInputValue(block, "STEERING", blocks);
        const speed = this.getInputValue(block, "SPEED", blocks);
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(
          `motor_pair.move(motor_pair.PAIR_1, ${steering}, velocity=${speed * 10})`,
        );
      } else if (opcode === "spikeprime_stopMovement") {
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(`motor_pair.stop(motor_pair.PAIR_1)`);
      }

      // Display blocks
      else if (opcode === "spikeprime_displayShowImage") {
        const image = this.getInputValue(block, "IMAGE", blocks);
        this.addImport("from hub import light_matrix");
        this.addLine(`light_matrix.show_image(${image})`);
      } else if (opcode === "spikeprime_displayWrite") {
        const text = this.getInputValue(block, "TEXT", blocks);
        this.addImport("from hub import light_matrix");
        this.addLine(`light_matrix.write(${text})`);
      } else if (opcode === "spikeprime_displaySetPixel") {
        const x = this.getInputValue(block, "X", blocks);
        const y = this.getInputValue(block, "Y", blocks);
        const brightness = this.getInputValue(block, "BRIGHTNESS", blocks);
        this.addImport("from hub import light_matrix");
        this.addLine(`light_matrix.set_pixel(${x}, ${y}, ${brightness})`);
      } else if (opcode === "spikeprime_displayClear") {
        this.addImport("from hub import light_matrix");
        this.addLine(`light_matrix.clear()`);
      }

      // Sound blocks
      else if (opcode === "spikeprime_playBeep") {
        const freq = this.getInputValue(block, "FREQUENCY", blocks);
        const duration = this.getInputValue(block, "DURATION", blocks);
        this.addImport("from hub import sound");
        this.addLine(`sound.beep(${freq}, ${duration}, 100)`);
      } else if (opcode === "spikeprime_playNote") {
        const note = this.getInputValue(block, "NOTE", blocks);
        const secs = this.getInputValue(block, "SECS", blocks);
        this.addImport("from hub import sound");
        this.addLine(`freq = int(440 * (2 ** ((${note} - 69) / 12)))`);
        this.addLine(`sound.beep(freq, int(${secs} * 1000), 100)`);
      }

      // IMU blocks
      else if (opcode === "spikeprime_resetYaw") {
        this.addImport("from hub import motion_sensor");
        this.addLine(`motion_sensor.reset_yaw(0)`);
      } else if (opcode === "spikeprime_presetYaw") {
        const angle = this.getInputValue(block, "ANGLE", blocks);
        this.addImport("from hub import motion_sensor");
        this.addLine(`motion_sensor.reset_yaw(${angle})`);
      }

      // Standard Scratch blocks
      else if (opcode === "motion_movesteps") {
        const steps = this.getInputValue(block, "STEPS", blocks);
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(`# Move ${steps} steps`);
        this.addLine(
          `await motor_pair.move_for_degrees(motor_pair.PAIR_1, 0, int(${steps}) * 5)`,
        );
      } else if (opcode === "motion_turnright") {
        const degrees = this.getInputValue(block, "DEGREES", blocks);
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(`# Turn right ${degrees} degrees`);
        this.addLine(
          `await motor_pair.move_for_degrees(motor_pair.PAIR_1, 100, int(${degrees}) * 2)`,
        );
      } else if (opcode === "motion_turnleft") {
        const degrees = this.getInputValue(block, "DEGREES", blocks);
        this.addImport("import motor_pair");
        this.addImport("from hub import port");
        this.addLine(`# Turn left ${degrees} degrees`);
        this.addLine(
          `await motor_pair.move_for_degrees(motor_pair.PAIR_1, -100, int(${degrees}) * 2)`,
        );
      }

      // Control blocks
      else if (opcode === "control_wait") {
        const duration = this.getInputValue(block, "DURATION", blocks);
        this.addImport("import runloop");
        this.addLine(`await runloop.sleep_ms(int(${duration} * 1000))`);
      } else if (opcode === "control_repeat") {
        const times = this.getInputValue(block, "TIMES", blocks);
        this.addLine(`for _ in range(int(${times})):`);
        this.increaseIndent();
        this.addLine("if stop_all: break");

        const substackId = this.getSubstackId(block, "SUBSTACK");
        if (substackId) {
          this.processBlockChain(substackId, blocks);
        } else {
          this.addLine("pass");
        }
        this.decreaseIndent();
      } else if (opcode === "control_forever") {
        this.addLine("while not stop_all:");
        this.increaseIndent();

        const substackId = this.getSubstackId(block, "SUBSTACK");
        if (substackId) {
          this.processBlockChain(substackId, blocks);
        } else {
          this.addLine("pass");
        }
        this.addImport("import runloop");
        this.addLine("await runloop.sleep_ms(10)");
        this.decreaseIndent();
      } else if (opcode === "control_if") {
        const condition = this.getInputValue(block, "CONDITION", blocks);
        this.addLine(`if ${condition}:`);
        this.increaseIndent();

        const substackId = this.getSubstackId(block, "SUBSTACK");
        if (substackId) {
          this.processBlockChain(substackId, blocks);
        } else {
          this.addLine("pass");
        }
        this.decreaseIndent();
      } else if (opcode === "control_if_else") {
        const condition = this.getInputValue(block, "CONDITION", blocks);
        this.addLine(`if ${condition}:`);
        this.increaseIndent();

        const substackId = this.getSubstackId(block, "SUBSTACK");
        if (substackId) {
          this.processBlockChain(substackId, blocks);
        } else {
          this.addLine("pass");
        }

        this.decreaseIndent();
        this.addLine("else:");
        this.increaseIndent();

        const substack2Id = this.getSubstackId(block, "SUBSTACK2");
        if (substack2Id) {
          this.processBlockChain(substack2Id, blocks);
        } else {
          this.addLine("pass");
        }
        this.decreaseIndent();
      } else if (opcode === "control_repeat_until") {
        const condition = this.getInputValue(block, "CONDITION", blocks);
        this.addLine(`while not (${condition}) and not stop_all:`);
        this.increaseIndent();

        const substackId = this.getSubstackId(block, "SUBSTACK");
        if (substackId) {
          this.processBlockChain(substackId, blocks);
        } else {
          this.addLine("pass");
        }
        this.decreaseIndent();
      } else if (opcode === "control_stop") {
        const stopOption = this.getFieldValue(block, "STOP_OPTION") || "all";
        if (stopOption === "all") {
          this.addLine("stop_all = True");
          this.addLine("return");
        } else {
          this.addLine("return");
        }
      }

      // Event blocks
      else if (opcode === "event_broadcast") {
        const broadcastInput = this.getInputValue(
          block,
          "BROADCAST_INPUT",
          blocks,
        );
        this.addLine(`trigger_broadcast(${broadcastInput})`);
      } else if (opcode === "event_broadcastandwait") {
        const broadcastInput = this.getInputValue(
          block,
          "BROADCAST_INPUT",
          blocks,
        );
        this.addLine(`await trigger_broadcast_wait(${broadcastInput})`);
      }

      // Data blocks
      else if (opcode === "data_setvariableto") {
        const varName = this.getFieldValue(block, "VARIABLE");
        const value = this.getInputValue(block, "VALUE", blocks);
        this.addLine(`variables["${varName}"] = ${value}`);
      } else if (opcode === "data_changevariableby") {
        const varName = this.getFieldValue(block, "VARIABLE");
        const value = this.getInputValue(block, "VALUE", blocks);
        this.addLine(
          `variables["${varName}"] = variables.get("${varName}", 0) + (${value})`,
        );
      }

      // Sound blocks (Scratch standard)
      else if (opcode === "sound_play" || opcode === "sound_playuntildone") {
        const soundMenu = this.getInputValue(block, "SOUND_MENU", blocks);
        const soundName = soundMenu.replace(/"/g, "");
        if (soundName && soundName !== "0") {
          this.soundFiles.push(soundName);
          this.addImport("from hub import sound");
          this.addLine(`# Play sound: ${soundName}`);
          this.addLine(
            `sound.beep(440, 200, 100)  # Placeholder for ${soundName}`,
          );
        }
      }

      // Looks blocks
      else if (opcode === "looks_say" || opcode === "looks_sayforsecs") {
        const message = this.getInputValue(block, "MESSAGE", blocks);
        this.addImport("from hub import light_matrix");
        this.addLine(`light_matrix.write(str(${message}))`);
        if (opcode === "looks_sayforsecs") {
          const secs = this.getInputValue(block, "SECS", blocks);
          this.addImport("import runloop");
          this.addLine(`await runloop.sleep_ms(int(${secs} * 1000))`);
        }
      }

      // Python execution
      else if (opcode === "spikeprime_runPythonCode") {
        const code = this.getInputValue(block, "CODE", blocks);
        this.addLine(`# Custom Python code:`);
        this.addLine(`exec(${code})`);
      } else {
        this.addLine(`# TODO: ${opcode}`);
      }
    }

    processBlockChain(blockId, blocks) {
      let currentId = blockId;
      let chainLength = 0;

      while (currentId) {
        const block = blocks._blocks[currentId];
        if (!block) break;

        chainLength++;
        if (chainLength > 1000) {
          log.warn("Block chain too long, stopping at", chainLength);
          break;
        }

        this.processBlock(block, blocks);
        currentId = block.next;
      }
    }

    processHatBlock(hatBlock, blocks) {
      const opcode = hatBlock.opcode;
      let funcName = "";

      if (opcode === "event_whenflagclicked") {
        funcName = `on_green_flag_${this.scriptCounter}`;
      } else if (opcode === "event_whenbroadcastreceived") {
        const broadcastName = this.getFieldValue(hatBlock, "BROADCAST_OPTION");
        funcName = `on_broadcast_${this.sanitizeName(broadcastName)}_${this.scriptCounter}`;
      } else {
        funcName = `on_event_${this.scriptCounter}`;
      }

      this.scriptCounter++;

      this.addLine(`# Event: ${opcode}`);
      this.addLine(`async def ${funcName}():`);
      this.increaseIndent();

      let currentBlockId = hatBlock.next;
      let blockCount = 0;

      while (currentBlockId) {
        const block = blocks._blocks[currentBlockId];
        if (!block) break;

        blockCount++;
        this.processBlock(block, blocks);
        currentBlockId = block.next;
      }

      if (blockCount === 0) {
        this.addLine("pass");
      }

      this.decreaseIndent();
      this.addLine("");

      if (opcode === "event_whenflagclicked") {
        this.mainScripts.push(funcName);
      } else if (opcode === "event_whenbroadcastreceived") {
        const broadcastName = this.getFieldValue(hatBlock, "BROADCAST_OPTION");
        if (!this.broadcasts.includes(broadcastName)) {
          this.broadcasts.push(broadcastName);
        }
        this.addLine(`broadcasts["${broadcastName}"].append(${funcName})`);
        this.addLine("");
      }
    }

    processTarget(target) {
      const blocks = target.blocks;
      const blockArray = blocks._blocks;

      // Find hat blocks
      for (const blockId in blockArray) {
        const block = blockArray[blockId];
        if (block.opcode && block.opcode.startsWith("event_when")) {
          this.processHatBlock(block, blocks);
        }
      }
    }

    generateHeader() {
      this.addLine("#!/usr/bin/env python3");
      this.addLine("# Generated from Scratch by SPIKE Prime BLE Extension");
      this.addLine(`# Language: ${currentLang}`);
      this.addLine(`# Generated: ${new Date().toISOString()}`);
      this.addLine("");

      // Always add these core imports
      this.addImport("import runloop");
      this.addImport("from hub import port");

      // Output ALL collected imports (sorted)
      const imports = Array.from(this.imports).sort();
      for (const imp of imports) {
        this.addLine(imp);
      }

      if (imports.length > 0) {
        this.addLine("");
      }
    }

    generateHeader_with_imports() {
      this.addLine("#!/usr/bin/env python3");
      this.addLine("# Generated from Scratch by SPIKE Prime BLE Extension");
      this.addLine(`# Language: ${currentLanguage}`);
      this.addLine(`# Generated: ${new Date().toISOString()}`);
      this.addLine("");
    }

    generateGlobals() {
      this.addLine("# Global variables");
      this.addLine("stop_all = False");
      this.addLine("variables = {}");
      this.addLine("broadcasts = {}");
      this.addLine("");

      // Initialize broadcast lists
      for (const broadcast of this.broadcasts) {
        this.addLine(`broadcasts["${broadcast}"] = []`);
      }
      if (this.broadcasts.length > 0) {
        this.addLine("");
      }
    }

    generateHelpers() {
      this.addLine("# Helper functions");
      this.addLine("");

      // Sensor helpers
      this.addLine("def get_motor_position(p):");
      this.increaseIndent();
      this.addLine("import motor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("return motor.relative_position(p)");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return 0");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("def get_motor_speed(p):");
      this.increaseIndent();
      this.addLine("import motor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("return motor.velocity(p)");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return 0");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("def get_color(p):");
      this.increaseIndent();
      this.addLine("import color_sensor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("c = color_sensor.color(p)");
      this.addLine(
        "color_map = {0:'black', 1:'magenta', 3:'blue', 5:'turquoise', 6:'green', 7:'yellow', 9:'red', 10:'white'}",
      );
      this.addLine("return color_map.get(c, 'none')");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return 'none'");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("def get_distance(p):");
      this.increaseIndent();
      this.addLine("import distance_sensor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("return distance_sensor.distance(p)");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return -1");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("def get_force(p):");
      this.increaseIndent();
      this.addLine("import force_sensor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("return force_sensor.force(p)");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return 0");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("def is_force_pressed(p):");
      this.increaseIndent();
      this.addLine("import force_sensor");
      this.addLine("try:");
      this.increaseIndent();
      this.addLine("return force_sensor.pressed(p)");
      this.decreaseIndent();
      this.addLine("except:");
      this.increaseIndent();
      this.addLine("return False");
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      // Broadcast helpers
      this.addLine("def trigger_broadcast(message):");
      this.increaseIndent();
      this.addLine(
        '"""Trigger all handlers for broadcast (fire-and-forget)"""',
      );
      this.addLine("if message in broadcasts:");
      this.increaseIndent();
      this.addLine("for handler in broadcasts[message]:");
      this.increaseIndent();
      this.addLine("runloop.run(handler())");
      this.decreaseIndent();
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");

      this.addLine("async def trigger_broadcast_wait(message):");
      this.increaseIndent();
      this.addLine('"""Trigger broadcast and wait for completion"""');
      this.addLine("if message in broadcasts:");
      this.increaseIndent();
      this.addLine("for handler in broadcasts[message]:");
      this.increaseIndent();
      this.addLine("await handler()");
      this.decreaseIndent();
      this.decreaseIndent();
      this.decreaseIndent();
      this.addLine("");
    }

    generateMainExecution() {
      if (this.mainScripts.length > 0) {
        this.addLine("# Main execution");
        this.addLine("async def main():");
        this.increaseIndent();
        this.addLine("try:");
        this.increaseIndent();

        for (const script of this.mainScripts) {
          this.addLine(`runloop.run(${script}())`);
        }

        this.addLine("while not stop_all:");
        this.increaseIndent();
        this.addLine("await runloop.sleep_ms(100)");
        this.decreaseIndent();

        this.decreaseIndent();
        this.addLine("except KeyboardInterrupt:");
        this.increaseIndent();
        this.addLine("print('Program stopped')");
        this.decreaseIndent();
        this.addLine("finally:");
        this.increaseIndent();
        this.addLine("import motor, motor_pair");
        this.addLine(
          "motor.stop(port.A, port.B, port.C, port.D, port.E, port.F)",
        );
        this.addLine("motor_pair.stop(motor_pair.PAIR_1)");
        this.decreaseIndent();

        this.decreaseIndent();
        this.addLine("");
        this.addLine("runloop.run(main())");
      }
    }

    // ========================================================================
    // MAIN TRANSPILE METHOD (FOLLOWING EV3 PATTERN)
    // ========================================================================
    transpileProject() {
      log.transpile("=== Starting Transpilation ===");
      this.reset();

      try {
        const runtime = Scratch.vm.runtime;
        const targets = runtime.targets;

        log.transpile("Found targets:", targets.length);

        // Collect sprite states
        for (const target of targets) {
          if (!target.isStage) {
            this.spriteStates[target.sprite.name] = {
              x: target.x || 0,
              y: target.y || 0,
              size: target.size || 100,
              visible: target.visible !== false,
            };
          }
        }

        log.transpile("Sprite states collected:", this.spriteStates);

        // Collect broadcasts first
        for (const target of targets) {
          const blocks = target.blocks._blocks;
          for (const blockId in blocks) {
            const block = blocks[blockId];
            if (block.opcode === "event_whenbroadcastreceived") {
              const broadcastName = this.getFieldValue(
                block,
                "BROADCAST_OPTION",
              );
              if (broadcastName && !this.broadcasts.includes(broadcastName)) {
                this.broadcasts.push(broadcastName);
              }
            }
          }
        }

        log.transpile("Broadcasts found:", this.broadcasts);

        // FIRST PASS: Process all targets to collect imports and generate code body
        const tempCode = this.code;
        this.code = []; // Temporarily clear code array

        // Generate globals (without header)
        this.generateGlobals();
        this.generateHelpers();

        // Process each target
        for (const target of targets) {
          const targetType = target.isStage ? "stage" : "sprite";
          log.transpile(`Processing ${targetType}:`, target.sprite.name);
          this.processTarget(target);
        }

        // Generate main
        this.generateMainExecution();

        // Save the body
        const bodyCode = this.code.join("\n");

        // SECOND PASS: Now generate header with all collected imports
        this.code = [];
        this.generateHeader(); // This will now have all imports

        // Combine header + body
        const finalCode = this.code.join("\n") + "\n" + bodyCode;

        log.transpile("=== Transpilation Complete ===", {
          codeLength: finalCode.length,
          scripts: this.mainScripts.length,
          broadcasts: this.broadcasts.length,
          imports: this.imports.size,
        });

        console.log("=== GENERATED SPIKE PYTHON CODE ===\n" + finalCode);

        return finalCode;
      } catch (error) {
        log.error("ERROR during transpilation:", error.message, error.stack);
        throw error;
      }
    }
  }

  // ============================================================================
  // MAIN EXTENSION CLASS
  // ============================================================================
  class SpikeExtension {
    constructor(runtime) {
      log.info("SpikeExtension constructor called");

      this._runtime = runtime;
      this._peripheral = new SpikePeripheral(runtime, "spikeprime");
      this._transpiler = new SpikeTranspiler();
      this._streamingMode = true;
      this._generatedCode = null;

      this._movementMotors = { left: "A", right: "B" };
      this._movementSpeed = 50;

      if (this._runtime) {
        this._runtime.registerPeripheralExtension("spikeprime", this);
      }

      log.info("SpikeExtension initialized");
    }

    getInfo() {
      return {
        id: "spikeprime",
        name: t("extensionName"),
        color1: "#FF661A",
        color2: "#FF5500",
        color3: "#CC4400",
        showStatusButton: true,
        blocks: this._getBlocks(),
        menus: this._getMenus(),
      };
    }

    scan() {
      this._peripheral.scan();
    }

    connect(id) {
      this._peripheral.connect(id);
    }

    disconnect() {
      this._peripheral.disconnect();
    }

    isConnected() {
      return this._peripheral.isConnected();
    }

    _getBlocks() {
      return [
        {
          blockType: BlockType.LABEL,
          text: t("connection"),
        },
        {
          opcode: "isConnected",
          text: t("isConnected"),
          blockType: BlockType.BOOLEAN,
        },
        {
          opcode: "getHubType",
          text: t("getHubType"),
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "enableStreamingMode",
          text: t("enableStreamingMode"),
          blockType: BlockType.COMMAND,
        },
        {
          opcode: "disableStreamingMode",
          text: t("disableStreamingMode"),
          blockType: BlockType.COMMAND,
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("transpilation"),
        },
        {
          opcode: "transpileProject",
          text: t("transpileProject"),
          blockType: BlockType.COMMAND,
        },
        {
          opcode: "showCode",
          text: t("showGeneratedCode"),
          blockType: BlockType.COMMAND,
        },
        {
          opcode: "downloadCode",
          text: t("downloadCode"),
          blockType: BlockType.COMMAND,
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("movement"),
        },
        {
          opcode: "setMovementMotors",
          text: t("setMovementMotors"),
          blockType: BlockType.COMMAND,
          arguments: {
            PORT_A: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
            PORT_B: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "B",
            },
          },
        },
        {
          opcode: "motorPairMove",
          text: t("steer"),
          blockType: BlockType.COMMAND,
          arguments: {
            STEERING: { type: ArgumentType.NUMBER, defaultValue: 0 },
            SPEED: { type: ArgumentType.NUMBER, defaultValue: 50 },
          },
        },
        {
          opcode: "motorPairMoveForTime",
          text: t("moveForward"),
          blockType: BlockType.COMMAND,
          arguments: {
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: "DIRECTION",
              defaultValue: "forward",
            },
            VALUE: { type: ArgumentType.NUMBER, defaultValue: 1 },
            UNIT: {
              type: ArgumentType.STRING,
              menu: "TIME_UNIT",
              defaultValue: "seconds",
            },
          },
        },
        {
          opcode: "stopMovement",
          text: t("stopMovement"),
          blockType: BlockType.COMMAND,
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("motors"),
        },
        {
          opcode: "motorRun",
          text: t("motorStart"),
          blockType: BlockType.COMMAND,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: "DIRECTION",
              defaultValue: "forward",
            },
          },
        },
        {
          opcode: "motorRunForTime",
          text: t("motorRunFor"),
          blockType: BlockType.COMMAND,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: "DIRECTION",
              defaultValue: "forward",
            },
            VALUE: { type: ArgumentType.NUMBER, defaultValue: 1 },
            UNIT: {
              type: ArgumentType.STRING,
              menu: "TIME_UNIT",
              defaultValue: "seconds",
            },
          },
        },
        {
          opcode: "motorStop",
          text: t("motorStop"),
          blockType: BlockType.COMMAND,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "getMotorPosition",
          text: t("getPosition"),
          blockType: BlockType.REPORTER,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "getMotorSpeed",
          text: t("getSpeed"),
          blockType: BlockType.REPORTER,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "resetMotorPosition",
          text: t("resetMotorPosition"),
          blockType: BlockType.COMMAND,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
            POSITION: { type: ArgumentType.NUMBER, defaultValue: 0 },
          },
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("display"),
        },
        {
          opcode: "displayShowImage",
          text: t("displayImage"),
          blockType: BlockType.COMMAND,
          arguments: {
            IMAGE: { type: ArgumentType.NUMBER, defaultValue: 1 },
          },
        },
        {
          opcode: "displayWrite",
          text: t("displayText"),
          blockType: BlockType.COMMAND,
          arguments: {
            TEXT: { type: ArgumentType.STRING, defaultValue: "Hi!" },
          },
        },
        {
          opcode: "displaySetPixel",
          text: t("setPixel"),
          blockType: BlockType.COMMAND,
          arguments: {
            X: { type: ArgumentType.NUMBER, defaultValue: 0 },
            Y: { type: ArgumentType.NUMBER, defaultValue: 0 },
            BRIGHTNESS: { type: ArgumentType.NUMBER, defaultValue: 100 },
          },
        },
        {
          opcode: "displayClear",
          text: t("displayClear"),
          blockType: BlockType.COMMAND,
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("sound"),
        },
        {
          opcode: "playBeep",
          text: t("playBeep"),
          blockType: BlockType.COMMAND,
          arguments: {
            FREQUENCY: { type: ArgumentType.NUMBER, defaultValue: 440 },
            DURATION: { type: ArgumentType.NUMBER, defaultValue: 500 },
          },
        },
        {
          opcode: "playNote",
          text: t("playNote"),
          blockType: BlockType.COMMAND,
          arguments: {
            NOTE: { type: ArgumentType.NUMBER, defaultValue: 60 },
            SECS: { type: ArgumentType.NUMBER, defaultValue: 0.5 },
          },
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("sensors"),
        },
        {
          opcode: "getColorSensorColor",
          text: t("getColor"),
          blockType: BlockType.REPORTER,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "getDistanceSensor",
          text: t("getDistance"),
          blockType: BlockType.REPORTER,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "getForceSensor",
          text: t("getForceSensor"),
          blockType: BlockType.REPORTER,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },
        {
          opcode: "isForceSensorPressed",
          text: t("isForceSensorPressed"),
          blockType: BlockType.BOOLEAN,
          arguments: {
            PORT: {
              type: ArgumentType.STRING,
              menu: "PORT",
              defaultValue: "A",
            },
          },
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("imu"),
        },
        {
          opcode: "getYaw",
          text: t("getYaw"),
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "getPitch",
          text: t("getPitch"),
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "getRoll",
          text: t("getRoll"),
          blockType: BlockType.REPORTER,
        },
        {
          opcode: "resetYaw",
          text: t("resetYaw"),
          blockType: BlockType.COMMAND,
        },
        {
          opcode: "presetYaw",
          text: t("presetYaw"),
          blockType: BlockType.COMMAND,
          arguments: {
            ANGLE: { type: ArgumentType.NUMBER, defaultValue: 0 },
          },
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("status"),
        },
        {
          opcode: "getBattery",
          text: t("getBatteryLevel"),
          blockType: BlockType.REPORTER,
        },

        "---",

        {
          blockType: BlockType.LABEL,
          text: t("python"),
        },
        {
          opcode: "runPythonCode",
          text: t("runPythonCode"),
          blockType: BlockType.COMMAND,
          arguments: {
            CODE: { type: ArgumentType.STRING, defaultValue: "print('Hello')" },
          },
        },
      ];
    }

    _getMenus() {
      return {
        PORT: {
          acceptReporters: true,
          items: ["A", "B", "C", "D", "E", "F"],
        },
        DIRECTION: {
          acceptReporters: true,
          items: [
            { text: t("forward"), value: "forward" },
            { text: t("backward"), value: "backward" },
          ],
        },
        TIME_UNIT: {
          acceptReporters: false,
          items: ["seconds", "rotations", "degrees"],
        },
      };
    }

    // ========================================================================
    // CONNECTION BLOCKS
    // ========================================================================

    isConnected() {
      return this._peripheral.isConnected();
    }

    getHubType() {
      return this._peripheral.getHubType();
    }

    enableStreamingMode() {
      this._streamingMode = true;
      log.info("Streaming mode enabled");
    }

    disableStreamingMode() {
      this._streamingMode = false;
      log.info("Streaming mode disabled");
    }

    // ========================================================================
    // TRANSPILATION BLOCKS
    // ========================================================================

    transpileProject() {
      try {
        // Call transpiler's transpileProject() - no parameters needed!
        this._generatedCode = this._transpiler.transpileProject();
        log.info("Project transpiled successfully");
      } catch (error) {
        log.error("Transpilation failed:", error);
        alert(`Transpilation failed: ${error.message}`);
      }
    }

    showCode() {
      if (!this._generatedCode) {
        alert(t("noCodeGenerated"));
        return;
      }

      const modal = document.createElement("div");
      modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border: 2px solid #FF661A;
            border-radius: 8px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
        `;

      const title = document.createElement("h3");
      title.textContent = t("generatedCode");
      title.style.cssText = `
            margin-top: 0;
            color: #333;
        `;

      const pre = document.createElement("pre");
      pre.style.cssText = `
            background: #f5f5f5;
            padding: 10px;
            overflow: auto;
            max-height: 500px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border-radius: 4px;
            color: #000;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;
      pre.textContent = this._generatedCode;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = t("close");
      closeBtn.style.cssText = `
            margin-top: 10px;
            padding: 8px 16px;
            background: #FF661A;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
      closeBtn.onclick = () => document.body.removeChild(modal);

      modal.appendChild(title);
      modal.appendChild(pre);
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);
    }

    downloadCode() {
      if (!this._generatedCode) {
        alert(t("generateFirst"));
        return;
      }

      const blob = new Blob([this._generatedCode], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spike_program.py";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(t("downloaded") + " spike_program.py");
    }

    // ========================================================================
    // MOVEMENT BLOCKS
    // ========================================================================

    setMovementMotors(args) {
      this._movementMotors.left = Cast.toString(args.PORT_A);
      this._movementMotors.right = Cast.toString(args.PORT_B);
      log.motor("Movement motors set:", this._movementMotors);

      if (this._streamingMode) {
        const code = `import motor_pair
from hub import port
motor_pair.unpair(motor_pair.PAIR_1)
motor_pair.pair(motor_pair.PAIR_1, port.${this._movementMotors.left}, port.${this._movementMotors.right})`;
        return this._peripheral.executeCode(code);
      }
    }

    motorPairMove(args) {
      const steering = MathUtil.clamp(Cast.toNumber(args.STEERING), -100, 100);
      const speed = Cast.toNumber(args.SPEED) || this._movementSpeed;

      if (this._streamingMode) {
        const code = `import motor_pair
from hub import port
motor_pair.unpair(motor_pair.PAIR_1)
motor_pair.pair(motor_pair.PAIR_1, port.${this._movementMotors.left}, port.${this._movementMotors.right})
motor_pair.move(motor_pair.PAIR_1, ${steering}, velocity=${speed * 10})`;

        return this._peripheral.executeCode(code);
      }
    }

    motorPairMoveForTime(args) {
      const direction = Cast.toString(args.DIRECTION);
      const value = Cast.toNumber(args.VALUE);
      const unit = Cast.toString(args.UNIT);

      let timeMs = value * 1000;
      if (unit === "degrees") {
        timeMs = (value / 360) * 1000;
      } else if (unit === "rotations") {
        timeMs = value * 1000;
      }

      let speed = this._movementSpeed;
      if (direction === "backward") {
        speed = -Math.abs(speed);
      }

      if (this._streamingMode) {
        const code = `import motor_pair, runloop
from hub import port
async def main():
    motor_pair.unpair(motor_pair.PAIR_1)
    motor_pair.pair(motor_pair.PAIR_1, port.${this._movementMotors.left}, port.${this._movementMotors.right})
    await motor_pair.move_for_time(motor_pair.PAIR_1, 0, ${timeMs}, velocity=${speed * 10})
runloop.run(main())`;

        return this._peripheral.executeCode(code);
      }
    }

    stopMovement() {
      if (this._streamingMode) {
        const code = `import motor_pair
from hub import port
motor_pair.unpair(motor_pair.PAIR_1)
motor_pair.pair(motor_pair.PAIR_1, port.${this._movementMotors.left}, port.${this._movementMotors.right})
motor_pair.stop(motor_pair.PAIR_1)`;

        return this._peripheral.executeCode(code);
      }
    }

    // ========================================================================
    // MOTOR BLOCKS
    // ========================================================================

    motorRun(args) {
      const port = Cast.toString(args.PORT);
      const direction = Cast.toString(args.DIRECTION);
      const speed = direction === "forward" ? 750 : -750;

      if (this._streamingMode) {
        const code = `import motor
from hub import port
motor.run(port.${port}, ${speed})`;

        return this._peripheral.executeCode(code);
      }
    }

    motorRunForTime(args) {
      const port = Cast.toString(args.PORT);
      const direction = Cast.toString(args.DIRECTION);
      const value = Cast.toNumber(args.VALUE);
      const unit = Cast.toString(args.UNIT);

      let speed = 750;
      if (direction === "backward") speed = -750;

      let timeMs = value * 1000;
      if (unit === "degrees") {
        timeMs = (value / 360) * 1000;
      } else if (unit === "rotations") {
        timeMs = value * 1000;
      }

      if (this._streamingMode) {
        const code = `import motor, runloop
from hub import port
async def main():
    await motor.run_for_time(port.${port}, ${timeMs}, ${speed})
runloop.run(main())`;

        return this._peripheral.executeCode(code);
      }
    }

    motorStop(args) {
      const port = Cast.toString(args.PORT);

      if (this._streamingMode) {
        const code = `import motor
from hub import port
motor.stop(port.${port})`;

        return this._peripheral.executeCode(code);
      }
    }

    resetMotorPosition(args) {
      const port = Cast.toString(args.PORT);
      const position = Cast.toNumber(args.POSITION);

      if (this._streamingMode) {
        const code = `import motor
from hub import port
motor.reset_relative_position(port.${port}, ${position})`;

        return this._peripheral.executeCode(code);
      }
    }

    getMotorPosition(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const motor = this._peripheral.getMotor(port);
      return motor ? motor.position : 0;
    }

    getMotorSpeed(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const motor = this._peripheral.getMotor(port);
      return motor ? motor.speed : 0;
    }

    // ========================================================================
    // DISPLAY BLOCKS
    // ========================================================================

    displayShowImage(args) {
      const image = MathUtil.clamp(Cast.toNumber(args.IMAGE), 0, 66);

      if (this._streamingMode) {
        const code = `from hub import light_matrix
light_matrix.show_image(${image})`;

        return this._peripheral.executeCode(code);
      }
    }

    displayWrite(args) {
      const text = Cast.toString(args.TEXT).replace(/'/g, "\\'");

      if (this._streamingMode) {
        const code = `from hub import light_matrix
light_matrix.write('${text}')`;

        return this._peripheral.executeCode(code);
      }
    }

    displaySetPixel(args) {
      const x = MathUtil.clamp(Cast.toNumber(args.X), 0, 4);
      const y = MathUtil.clamp(Cast.toNumber(args.Y), 0, 4);
      const brightness = MathUtil.clamp(Cast.toNumber(args.BRIGHTNESS), 0, 100);

      if (this._streamingMode) {
        const code = `from hub import light_matrix
light_matrix.set_pixel(${x}, ${y}, ${brightness})`;

        return this._peripheral.executeCode(code);
      }
    }

    displayClear() {
      if (this._streamingMode) {
        const code = `from hub import light_matrix
light_matrix.clear()`;

        return this._peripheral.executeCode(code);
      }
    }

    // ========================================================================
    // SOUND BLOCKS
    // ========================================================================

    playBeep(args) {
      const freq = MathUtil.clamp(Cast.toNumber(args.FREQUENCY), 100, 10000);
      const time = Math.max(0, Cast.toNumber(args.DURATION));

      if (this._streamingMode) {
        const code = `from hub import sound
sound.beep(${freq}, ${time}, 100)`;

        return this._peripheral.executeCode(code);
      }
    }

    playNote(args) {
      const note = Cast.toNumber(args.NOTE);
      const secs = Cast.toNumber(args.SECS);
      const freq = Math.pow(2, (note - 69) / 12) * 440;

      if (this._streamingMode) {
        const code = `from hub import sound
sound.beep(${Math.round(freq)}, ${secs * 1000}, 100)`;

        return this._peripheral.executeCode(code);
      }
    }

    // ========================================================================
    // SENSOR BLOCKS
    // ========================================================================

    getColorSensorColor(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const sensor = this._peripheral.getSensor("color", port);
      if (!sensor) return "none";

      const colorNames = {
        [SpikeColor.BLACK]: "black",
        [SpikeColor.MAGENTA]: "magenta",
        [SpikeColor.PURPLE]: "purple",
        [SpikeColor.BLUE]: "blue",
        [SpikeColor.AZURE]: "azure",
        [SpikeColor.TURQUOISE]: "turquoise",
        [SpikeColor.GREEN]: "green",
        [SpikeColor.YELLOW]: "yellow",
        [SpikeColor.ORANGE]: "orange",
        [SpikeColor.RED]: "red",
        [SpikeColor.WHITE]: "white",
        [SpikeColor.NONE]: "none",
      };

      return colorNames[sensor.color] || "none";
    }

    getDistanceSensor(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const distance = this._peripheral.getSensor("distance", port);
      return distance !== null && distance !== undefined ? distance : -1;
    }

    getForceSensor(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const sensor = this._peripheral.getSensor("force", port);
      return sensor ? sensor.value : 0;
    }

    isForceSensorPressed(args) {
      const port = SpikePort[Cast.toString(args.PORT)];
      const sensor = this._peripheral.getSensor("force", port);
      return sensor ? sensor.pressed : false;
    }

    // ========================================================================
    // IMU BLOCKS
    // ========================================================================

    getYaw() {
      return this._peripheral.getIMU().yaw / 10;
    }

    getPitch() {
      return this._peripheral.getIMU().pitch / 10;
    }

    getRoll() {
      return this._peripheral.getIMU().roll / 10;
    }

    resetYaw() {
      if (this._streamingMode) {
        const code = `from hub import motion_sensor
motion_sensor.reset_yaw(0)`;

        return this._peripheral.executeCode(code);
      }
    }

    presetYaw(args) {
      const angle = Cast.toNumber(args.ANGLE);

      if (this._streamingMode) {
        const code = `from hub import motion_sensor
motion_sensor.reset_yaw(${angle})`;

        return this._peripheral.executeCode(code);
      }
    }

    // ========================================================================
    // STATUS BLOCKS
    // ========================================================================

    getBattery() {
      return this._peripheral.getBattery();
    }

    // ========================================================================
    // PYTHON BLOCKS
    // ========================================================================

    runPythonCode(args) {
      const code = Cast.toString(args.CODE);

      if (this._streamingMode) {
        return this._peripheral.executeCode(code);
      }
    }
  }

  Scratch.extensions.register(new SpikeExtension());
  log.info("🎉 Extension registered successfully!");
})(Scratch);
