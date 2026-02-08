// Name: LEGO Spike Prime (Legacy)
// ID: CrispStrobe/legospikeprime_btc_scratchlink
// Description: Control Spike Prime via Scratch Link (Old Firmware/BTC).
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("SPIKE Prime BTC extension must run unsandboxed");
  }

  console.log("🤖 [SPIKE] Extension loading...");

  const ArgumentType = Scratch.ArgumentType;
  const BlockType = Scratch.BlockType;
  const Cast = Scratch.Cast;

  // ============================================================================
  // TRANSLATIONS
  // ============================================================================
  const translations = {
    en: {
      extensionName: "SPIKE Prime Ultimate (BTC)",
      // Movement
      setMovementMotors: "set movement motors [PORT_A] and [PORT_B]",
      moveForward: "move [DIRECTION] for [VALUE] [UNIT]",
      steer: "start steering [STEERING]",
      startTank: "start tank drive left [LEFT_SPEED] right [RIGHT_SPEED]",
      setMovementSpeed: "set movement speed to [SPEED]%",
      stopMovement: "stop movement",
      // Motors
      motorRunFor: "[PORT] run [DIRECTION] for [VALUE] [UNIT]",
      motorRunToPosition: "[PORT] run to position [POSITION] degrees",
      motorStart: "[PORT] start motor [DIRECTION]",
      motorStop: "[PORT] stop motor",
      motorSetSpeed: "[PORT] set speed to [SPEED] %",
      motorSetStopAction: "[PORT] set stop action to [ACTION]",
      getPosition: "[PORT] position",
      getRelativePosition: "[PORT] relative position",
      getAbsolutePosition: "[PORT] absolute position",
      getSpeed: "[PORT] speed (deg/s)",
      resetMotorPosition: "reset [PORT] motor position to [POSITION]",
      // Display
      displayText: "write [TEXT]",
      displayImage: "turn on [MATRIX]",
      displayPattern: "display pattern [PATTERN]",
      displayClear: "turn off pixels",
      setPixel: "set pixel [X] [Y] to [BRIGHTNESS] %",
      rotateDisplay: "rotate display [ANGLE] degrees",
      setCenterButtonColor: "set center button to [COLOR]",
      // IMU
      getAngle: "[AXIS] angle",
      getGyroRate: "gyro rate [AXIS] (deg/s)",
      getFilteredGyroRate: "filtered gyro rate [AXIS] (deg/s)",
      getAcceleration: "acceleration [AXIS] (milli-g)",
      getFilteredAcceleration: "filtered acceleration [AXIS] (milli-g)",
      resetYaw: "reset yaw angle",
      presetYaw: "preset yaw to [ANGLE] degrees",
      // 3x3 Matrix
      setMatrix3x3ColorGrid:
        "set [PORT] 3x3 colors: [P1][P2][P3] [P4][P5][P6] [P7][P8][P9]",
      setMatrix3x3Custom: "set [PORT] 3x3 custom pattern [PATTERN]",
      setMatrix3x3SolidColor:
        "set [PORT] 3x3 matrix all [COLOR] brightness [BRIGHTNESS]",
      clearMatrix3x3: "clear [PORT] 3x3 matrix",
      // Gestures
      whenGesture: "when hub [GESTURE]",
      isGesture: "hub [GESTURE]?",
      getOrientation: "orientation",
      // Sound
      playHubSound: "play hub sound [SOUND]",
      playBeep: "beep [FREQUENCY] Hz for [DURATION] ms",
      playNote: "play note [NOTE] for [SECS] seconds",
      playWaveBeep: "beep [WAVEFORM] [FREQUENCY] Hz for [DURATION] ms",
      setVolume: "set volume to [VOLUME]%",
      stopSound: "stop all sounds",
      // Status
      getBatteryLevel: "battery level %",
      getBatteryTemperature: "battery temperature",
      getHubTemperature: "hub temperature",
      getHubCurrent: "hub current (mA)",
      getHubVoltage: "hub voltage (mV)",
      // Timer
      getTimer: "timer",
      resetTimer: "reset timer",
      // Sensors
      getDistance: "[PORT] distance",
      setDistanceLights: "set [PORT] distance lights [TL] [TR] [BL] [BR]",
      getColor: "[PORT] color",
      getReflection: "[PORT] reflection",
      getAmbientLight: "[PORT] ambient light",
      getForce: "[PORT] force",
      isForceSensorPressed: "[PORT] force sensor pressed?",
      whenColor: "when [PORT] sees [COLOR]",
      isColor: "[PORT] sees [COLOR]?",
      whenForceSensor: "when [PORT] is [STATE]",
      // Buttons
      isButtonPressed: "[BUTTON] button pressed?",
      whenButtonPressed: "when [BUTTON] button pressed",
      // File System
      writeLogFile: "append [TEXT] to log file [FILENAME]",
      readLogFile: "read log file [FILENAME]",
      deleteLogFile: "delete file [FILENAME]",
      listFiles: "list files",
      // Python
      runReplCommand: "run Python REPL: [CODE]",
      getReplOutput: "REPL output",
      clearReplOutput: "clear REPL output",
      getReplHistory: "REPL command [INDEX]",
      runPythonCommand: "run Python: [CODE]",
      runHubCommand: "run hub command: [CODE]",
      exitScript: "exit Python script",
      // Menus
      forward: "forward",
      backward: "backward",
      left: "left",
      right: "right",
      tapped: "tapped",
      doubletapped: "doubletapped",
      shake: "shake",
      freefall: "freefall",
    },
    de: {
      extensionName: "SPIKE Prime Ultimate (BTC)",
      // Movement
      setMovementMotors: "setze Bewegungsmotoren [PORT_A] und [PORT_B]",
      moveForward: "bewege [DIRECTION] für [VALUE] [UNIT]",
      steer: "starte Lenkung [STEERING]",
      startTank: "starte Kettenantrieb links [LEFT_SPEED] rechts [RIGHT_SPEED]",
      setMovementSpeed: "setze Bewegungsgeschwindigkeit auf [SPEED]%",
      stopMovement: "stoppe Bewegung",
      // Motors
      motorRunFor: "[PORT] läuft [DIRECTION] für [VALUE] [UNIT]",
      motorRunToPosition: "[PORT] läuft zu Position [POSITION] Grad",
      motorStart: "[PORT] starte Motor [DIRECTION]",
      motorStop: "[PORT] stoppe Motor",
      motorSetSpeed: "[PORT] setze Geschwindigkeit auf [SPEED] %",
      motorSetStopAction: "[PORT] setze Stopp-Aktion auf [ACTION]",
      getPosition: "[PORT] Position",
      getRelativePosition: "[PORT] relative Position",
      getAbsolutePosition: "[PORT] absolute Position",
      getSpeed: "[PORT] Geschwindigkeit (Grad/s)",
      resetMotorPosition: "setze [PORT] Motorposition auf [POSITION] zurück",
      // Display
      displayText: "schreibe [TEXT]",
      displayImage: "schalte [MATRIX] ein",
      displayPattern: "zeige Muster [PATTERN]",
      displayClear: "schalte Pixel aus",
      setPixel: "setze Pixel [X] [Y] auf [BRIGHTNESS] %",
      rotateDisplay: "drehe Display um [ANGLE] Grad",
      setCenterButtonColor: "setze mittlere Taste auf [COLOR]",
      // IMU
      getAngle: "[AXIS] Winkel",
      getGyroRate: "Gyro-Rate [AXIS] (Grad/s)",
      getFilteredGyroRate: "gefilterte Gyro-Rate [AXIS] (Grad/s)",
      getAcceleration: "Beschleunigung [AXIS] (Milli-g)",
      getFilteredAcceleration: "gefilterte Beschleunigung [AXIS] (Milli-g)",
      resetYaw: "setze Gier-Winkel zurück",
      presetYaw: "setze Gier-Winkel auf [ANGLE] Grad",
      // 3x3 Matrix
      setMatrix3x3ColorGrid:
        "setze [PORT] 3x3 Farben: [P1][P2][P3] [P4][P5][P6] [P7][P8][P9]",
      setMatrix3x3Custom: "setze [PORT] 3x3 eigenes Muster [PATTERN]",
      setMatrix3x3SolidColor:
        "setze [PORT] 3x3 Matrix alle [COLOR] Helligkeit [BRIGHTNESS]",
      clearMatrix3x3: "lösche [PORT] 3x3 Matrix",
      // Gestures
      whenGesture: "wenn Hub [GESTURE]",
      isGesture: "Hub [GESTURE]?",
      getOrientation: "Ausrichtung",
      // Sound
      playHubSound: "spiele Hub-Sound [SOUND]",
      playBeep: "Piep [FREQUENCY] Hz für [DURATION] ms",
      playNote: "spiele Note [NOTE] für [SECS] Sekunden",
      playWaveBeep: "Piep [WAVEFORM] [FREQUENCY] Hz für [DURATION] ms",
      setVolume: "setze Lautstärke auf [VOLUME]%",
      stopSound: "stoppe alle Töne",
      // Status
      getBatteryLevel: "Batteriestand %",
      getBatteryTemperature: "Batterietemperatur",
      getHubTemperature: "Hub-Temperatur",
      getHubCurrent: "Hub-Strom (mA)",
      getHubVoltage: "Hub-Spannung (mV)",
      // Timer
      getTimer: "Timer",
      resetTimer: "setze Timer zurück",
      // Sensors
      getDistance: "[PORT] Abstand",
      setDistanceLights: "setze [PORT] Abstandslichter [TL] [TR] [BL] [BR]",
      getColor: "[PORT] Farbe",
      getReflection: "[PORT] Reflexion",
      getAmbientLight: "[PORT] Umgebungslicht",
      getForce: "[PORT] Kraft",
      isForceSensorPressed: "[PORT] Kraftsensor gedrückt?",
      whenColor: "wenn [PORT] sieht [COLOR]",
      isColor: "[PORT] sieht [COLOR]?",
      whenForceSensor: "wenn [PORT] ist [STATE]",
      // Buttons
      isButtonPressed: "[BUTTON] Taste gedrückt?",
      whenButtonPressed: "wenn [BUTTON] Taste gedrückt",
      // File System
      writeLogFile: "füge [TEXT] zu Log-Datei [FILENAME] hinzu",
      readLogFile: "lese Log-Datei [FILENAME]",
      deleteLogFile: "lösche Datei [FILENAME]",
      listFiles: "liste Dateien auf",
      // Python
      runReplCommand: "führe Python REPL aus: [CODE]",
      getReplOutput: "REPL-Ausgabe",
      clearReplOutput: "lösche REPL-Ausgabe",
      getReplHistory: "REPL-Befehl [INDEX]",
      runPythonCommand: "führe Python aus: [CODE]",
      runHubCommand: "führe Hub-Befehl aus: [CODE]",
      exitScript: "beende Python-Skript",
      // Menus
      forward: "vorwärts",
      backward: "rückwärts",
      left: "links",
      right: "rechts",
      tapped: "angetippt",
      doubletapped: "doppelt angetippt",
      shake: "geschüttelt",
      freefall: "freier Fall",
    },
  };

  // ============================================================================
  // LANGUAGE DETECTION
  // ============================================================================
  function detectLanguage() {
    const results = {};
    let finalLanguage = "en";

    console.log("🌍 [SPIKE] === LANGUAGE DETECTION DEBUG ===");

    // Method 1: navigator.language
    try {
      results.navigatorLanguage = navigator.language;
      console.log("🌍 [SPIKE] 1. navigator.language:", navigator.language);
    } catch (e) {
      results.navigatorLanguage = "error: " + e.message;
    }

    // Method 2: navigator.languages array
    try {
      results.navigatorLanguages = navigator.languages;
      console.log("🌍 [SPIKE] 2. navigator.languages:", navigator.languages);
    } catch (e) {
      results.navigatorLanguages = "error: " + e.message;
    }

    // Method 3: TurboWarp localStorage
    try {
      const twSettings = localStorage.getItem("tw:language");
      results.turboWarpLocalStorage = twSettings;
      console.log("🌍 [SPIKE] 3. TurboWarp localStorage:", twSettings);
    } catch (e) {
      results.turboWarpLocalStorage = "error: " + e.message;
    }

    // Method 4: Scratch VM locale
    try {
      if (typeof Scratch !== "undefined" && Scratch.vm && Scratch.vm.runtime) {
        const vmLocale = Scratch.vm.runtime.getLocale
          ? Scratch.vm.runtime.getLocale()
          : null;
        results.scratchVMLocale = vmLocale;
        console.log("🌍 [SPIKE] 4. Scratch VM locale:", vmLocale);
      } else {
        results.scratchVMLocale = null;
      }
    } catch (e) {
      results.scratchVMLocale = "error: " + e.message;
    }

    // Method 5: Redux store
    try {
      if (
        typeof window !== "undefined" &&
        window.ReduxStore &&
        window.ReduxStore.getState
      ) {
        const state = window.ReduxStore.getState();
        const reduxLocale = state.locales?.locale;
        results.reduxStore = reduxLocale;
        console.log("🌍 [SPIKE] 5. Redux store locale:", reduxLocale);
      } else {
        results.reduxStore = "not available";
      }
    } catch (e) {
      results.reduxStore = "error: " + e.message;
    }

    // Method 6: document.documentElement.lang
    try {
      const htmlLang = document.documentElement.lang;
      results.documentLang = htmlLang;
      console.log(
        "🌍 [SPIKE] 6. document.documentElement.lang:",
        htmlLang || "(empty)",
      );
    } catch (e) {
      results.documentLang = "error: " + e.message;
    }

    console.log("\n🌍 [SPIKE] === ALL DETECTION RESULTS ===");
    console.log(JSON.stringify(results, null, 2));

    // Decision logic - Priority order
    console.log("\n🌍 [SPIKE] === DECISION LOGIC ===");

    // Priority 1: Redux store
    if (
      results.reduxStore &&
      typeof results.reduxStore === "string" &&
      !results.reduxStore.includes("error") &&
      results.reduxStore !== "not available"
    ) {
      console.log("🌍 [SPIKE] ✓ Using Redux store locale:", results.reduxStore);
      finalLanguage = results.reduxStore.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 2: TurboWarp localStorage
    else if (
      results.turboWarpLocalStorage &&
      typeof results.turboWarpLocalStorage === "string" &&
      !results.turboWarpLocalStorage.includes("error")
    ) {
      console.log(
        "🌍 [SPIKE] ✓ Using TurboWarp localStorage:",
        results.turboWarpLocalStorage,
      );
      finalLanguage = results.turboWarpLocalStorage
        .toLowerCase()
        .startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 3: Scratch VM locale
    else if (
      results.scratchVMLocale &&
      typeof results.scratchVMLocale === "string" &&
      !results.scratchVMLocale.includes("error")
    ) {
      console.log(
        "🌍 [SPIKE] ✓ Using Scratch VM locale:",
        results.scratchVMLocale,
      );
      finalLanguage = results.scratchVMLocale.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 4: document.documentElement.lang
    else if (
      results.documentLang &&
      typeof results.documentLang === "string" &&
      results.documentLang !== "" &&
      !results.documentLang.includes("error")
    ) {
      console.log(
        "🌍 [SPIKE] ✓ Using document.documentElement.lang:",
        results.documentLang,
      );
      finalLanguage = results.documentLang.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 5: navigator.language
    else if (
      results.navigatorLanguage &&
      typeof results.navigatorLanguage === "string" &&
      !results.navigatorLanguage.includes("error")
    ) {
      console.log(
        "🌍 [SPIKE] ✓ Using navigator.language:",
        results.navigatorLanguage,
      );
      finalLanguage = results.navigatorLanguage.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 6: navigator.languages
    else if (
      results.navigatorLanguages &&
      Array.isArray(results.navigatorLanguages) &&
      results.navigatorLanguages.length > 0
    ) {
      console.log(
        "🌍 [SPIKE] ✓ Using navigator.languages[0]:",
        results.navigatorLanguages[0],
      );
      finalLanguage = results.navigatorLanguages[0]
        .toLowerCase()
        .startsWith("de")
        ? "de"
        : "en";
    } else {
      console.log("🌍 [SPIKE] ✗ No locale detected, using default: en");
    }

    console.log("\n🌍 [SPIKE] === FINAL DECISION ===");
    console.log("🌍 [SPIKE] Selected language:", finalLanguage);
    console.log("🌍 [SPIKE] ================================\n");

    return finalLanguage;
  }

  let currentLang = detectLanguage();

  function t(key) {
    return translations[currentLang]?.[key] || translations["en"][key] || key;
  }

  // Watch for language changes
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "tw:language") {
        console.log("🌍 [SPIKE] TurboWarp language changed, re-detecting...");
        const newLang = detectLanguage();
        if (newLang !== currentLang) {
          currentLang = newLang;
          console.log("🌍 [SPIKE] Language updated to:", currentLang);
        }
      }
    });

    let lastKnownLocale = null;
    setInterval(() => {
      try {
        if (window.ReduxStore && window.ReduxStore.getState) {
          const state = window.ReduxStore.getState();
          const currentLocale = state.locales?.locale;
          if (currentLocale && currentLocale !== lastKnownLocale) {
            lastKnownLocale = currentLocale;
            const newLang = currentLocale.toLowerCase().startsWith("de")
              ? "de"
              : "en";
            if (newLang !== currentLang) {
              currentLang = newLang;
              console.log(
                "🌍 [SPIKE] Extension language updated to:",
                currentLang,
              );
            }
          }
        }
      } catch (e) {}
    }, 1000);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  const MathUtil = {
    clamp: (val, min, max) => Math.max(min, Math.min(val, max)),
    wrapClamp: (val, min, max) => {
      const range = max - min;
      return ((((val - min) % range) + range) % range) + min;
    },
  };

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
  // JSONRPC CLASS
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
      const request = { jsonrpc: "2.0", method, params };
      if (id !== null && typeof id !== "undefined") {
        request.id = id;
      }
      this._sendMessage(request);
    }

    _handleMessage(json) {
      if (json.jsonrpc !== "2.0") {
        throw new Error(
          `Bad or missing JSON-RPC version in message: ${JSON.stringify(json)}`,
        );
      }
      if (Object.prototype.hasOwnProperty.call(json, "method")) {
        this._handleRequest(json);
      } else {
        this._handleResponse(json);
      }
    }

    _sendResponse(id, result, error) {
      const response = { jsonrpc: "2.0", id };
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
  // BT CLASS
  // ============================================================================
  class BT extends JSONRPC {
    constructor(
      runtime,
      extensionId,
      peripheralOptions,
      connectCallback,
      resetCallback = null,
      messageCallback,
    ) {
      super();
      this._socket = runtime.getScratchLinkSocket("BT");
      this._socket.setOnOpen(this.requestPeripheral.bind(this));
      this._socket.setOnClose(this.handleDisconnectError.bind(this));
      this._socket.setOnError(this._handleRequestError.bind(this));
      this._socket.setHandleMessage(this._handleMessage.bind(this));
      this._sendMessage = this._socket.sendMessage.bind(this._socket);
      this._availablePeripherals = {};
      this._connectCallback = connectCallback;
      this._connected = false;
      this._resetCallback = resetCallback;
      this._discoverTimeoutID = null;
      this._extensionId = extensionId;
      this._peripheralOptions = peripheralOptions;
      this._messageCallback = messageCallback;
      this._runtime = runtime;
      this._socket.open();
    }

    requestPeripheral() {
      this._availablePeripherals = {};
      if (this._discoverTimeoutID) window.clearTimeout(this._discoverTimeoutID);
      this._discoverTimeoutID = window.setTimeout(
        this._handleDiscoverTimeout.bind(this),
        15000,
      );
      this.sendRemoteRequest("discover", this._peripheralOptions).catch((e) =>
        this._handleRequestError(e),
      );
    }

    connectPeripheral(id, pin = null) {
      const params = { peripheralId: id };
      if (pin) params.pin = pin;
      this.sendRemoteRequest("connect", params)
        .then(() => {
          this._connected = true;
          this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
          this._connectCallback();
        })
        .catch((e) => this._handleRequestError(e));
    }

    disconnect() {
      if (this._connected) this._connected = false;
      if (this._socket.isOpen()) this._socket.close();
      if (this._discoverTimeoutID) window.clearTimeout(this._discoverTimeoutID);
      this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
    }

    isConnected() {
      return this._connected;
    }

    sendMessage(options) {
      return this.sendRemoteRequest("send", options).catch((e) =>
        this.handleDisconnectError(e),
      );
    }

    didReceiveCall(method, params) {
      switch (method) {
        case "didDiscoverPeripheral":
          this._availablePeripherals[params.peripheralId] = params;
          this._runtime.emit(
            this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
            this._availablePeripherals,
          );
          if (this._discoverTimeoutID)
            window.clearTimeout(this._discoverTimeoutID);
          break;
        case "userDidPickPeripheral":
          this._availablePeripherals[params.peripheralId] = params;
          this._runtime.emit(
            this._runtime.constructor.USER_PICKED_PERIPHERAL,
            this._availablePeripherals,
          );
          if (this._discoverTimeoutID)
            window.clearTimeout(this._discoverTimeoutID);
          break;
        case "userDidNotPickPeripheral":
          this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
          if (this._discoverTimeoutID)
            window.clearTimeout(this._discoverTimeoutID);
          break;
        case "didReceiveMessage":
          if (this._messageCallback) this._messageCallback(params);
          break;
        case "ping":
          return 42;
      }
    }

    handleDisconnectError(/* e */) {
      if (!this._connected) return;
      this.disconnect();
      if (this._resetCallback) this._resetCallback();
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
      if (this._discoverTimeoutID) window.clearTimeout(this._discoverTimeoutID);
      this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }
  }

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const iconURI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAUKADAAQAAAABAAAAUAAAAAASKG51AAAEUUlEQVR4Ae2cTWgTURDHZxORatUeFLUeqtaThSDFHopQ1HoQhB4LigjWq3pTEbUXK+LHUb2qICrYkwiCF7UUpYdq0UA9iFVbaFXqoWq1CMm6/022SZNsnsmb3X2kM7Dp5s17k5lf5r15KewjEhECQkAICAEhIASEgBBYjAQs7qB7r9zvoLR90rbtNsd2I7f9Ku1NWZY1TDHrat+pA4NV2ig5jBVg76W7Z2yyLpBts9ot6XkVjY5TabKot+/0wYtVDC85hC1QN/NS6efxeDzW2ZGg1kQzraivK/mhYTf+mp2jkeQYPR1MUiqVSlM8tosrE2NswWDaErnwOtpbjIGH+PBFwid8sfARSwxX3GwAs2uem3lcznHbwayAeL5y2F/CYSRrwy0YUU3b77NEt4aIkpMZbxIbiHraiVbX5yLM842tuHECzHka8h3gHe8n+jmX++CB90SvJ4iudS+EmOvBc8c2hXncqc4KMg/w2pqIbh/KXLhHG3RBSk0A9KbtsZ2ZbMO0xT3E02Xe8b/WBEB+LP9vsSYAomBArg8QYT3EhXuIp8u843+tiSKCaouCMTxOdPhODtJKZx8PXZBSEwCx5qHaqrYxQYCsCYAAA4gn9gSBqLzNmlgDy4cYrFYAavKNfgqPFvxDqMX5uV9OKu1fzhaDTjJQE6IAFICaBDSHR78Gqta8wgAr7V84nvm9TGFNoOFloF/1DLpdE5BquGSgipBCLwAVgFRqAagipNCHtwb6Vc+g2xUAdNWSgZoEw8vAoKutn31NQKrhkoEqQgq9AFQAUqkFoIqQQh/eGhh0tfWzrwCgq5YM1CQYXgb6OepXPStt97MfcLtkoCZgASgANQloDo9+DfSrnpW2a4KodrhM4WrJZcdFn4F+AfhVYb/+EbVLBmqCF4ACUJOA5nBz10C/KqwZMPdwmcKaRAWgANQkoDncyDXw1ZsPhOvb9Iwb3to1DbR92xb30oyXfbhRAPFYav+jlzT26cuCQCcmpwnX23efqbtrh1FPghoF0IPXsGo57d3dSpub1rkgP45/pSfPRlyw6NOzv3MB4CjfGFNEMGWReYB39Mg+Smzd6GYanrDEPdqgQx/0NUWMAggoyLxldUuL+KANOogALMJD8wXDm7YlusxPaa+4lOoTdpsxGRh24FyfZwxAbFUgKBh+4um8vn79wmw3BiD2eRBU2z9zf4sYoA06iNe3qFMEDUYBbN60nmZ+/KYbNx9T0tnzYV+IC/dogw59TAJo1D4Qm2RvL/jg4YuifAI89DFJOAFOOYE1ImPyTseoKFaMwyYZ2xRcXrXl+ikH37ICX1mEDSDOpnLOY+nCCUE45EZHgvrdC98g7jlaOg7mjeVbA52DvZzHBtM4XmlwaNRdu/I+J9JbZB58gm/wEYeQcTlU8Kikntlzl++dtdL2efd4JT1TgYx24Zl6+JgX8WI7/s6LW/4KASEgBISAEBACQkAILC4C/wDBL1fytvgQdgAAAABJRU5ErkJggg==";

  const BTSendRateMax = 40;
  const SpikePorts = ["A", "B", "C", "D", "E", "F"];
  const SpikeMotorStopMode = { float: 0, brake: 1, hold: 2 };
  const SpikeOrientation = {
    front: 1,
    back: 2,
    up: 3,
    down: 4,
    rightside: 5,
    leftside: 6,
  };
  const HubSoundFiles = [
    "menu_click",
    "menu_fastback",
    "menu_program_start",
    "menu_program_stop",
    "menu_shutdown",
    "startup",
  ];
  const ColorEmojiMap = {
    "⚫": 0,
    "🟣": 1,
    "🟪": 2,
    "🔵": 3,
    "🔷": 4,
    "🟢": 5,
    "🟩": 6,
    "🟡": 7,
    "🟠": 8,
    "🔴": 9,
    "⚪": 10,
  };
  const DisplayPatterns = {
    heart: "960000960960a60960960000960",
    smile: "760076000078000076000760",
    sad: "760076000087600076000760",
    angry: "970079000087600079000970",
    surprised: "760076000999900076000760",
    wink: "760070000078000076000760",
    arrow_up: "060060060686060606000000",
    arrow_down: "000060606068606060606000",
    arrow_left: "000060068006000060000000",
    arrow_right: "000600000680600060000000",
    check: "000000080000806080000000",
    x: "970000970000090000970000970",
    square: "979797900009900099000979797",
    triangle: "060060606996999999600000",
    diamond: "060060606906906060000600",
    plus: "060000600999996060000600",
    minus: "000000000999999000000000",
    dot: "000000000000a00000000000000",
    frame: "979797900009900099000979797",
    spiral: "979797060000900009000979797",
  };
  const CenterLEDColors = {
    OFF: 0,
    PINK: 1,
    PURPLE: 2,
    BLUE: 3,
    TEAL: 4,
    GREEN: 5,
    LIME: 6,
    YELLOW: 7,
    ORANGE: 8,
    RED: 9,
    WHITE: 10,
    GREY: 11,
  };
  const SoundWaveforms = {
    sin: "hub.sound.SOUND_SIN",
    square: "hub.sound.SOUND_SQUARE",
    triangle: "hub.sound.SOUND_TRIANGLE",
    sawtooth: "hub.sound.SOUND_SAWTOOTH",
  };

  // ============================================================================
  // MOTOR SETTING CLASS
  // ============================================================================
  class SpikeMotorSetting {
    constructor() {
      this._speed = 75;
      this._stopMode = SpikeMotorStopMode.brake;
      this._stallDetection = true;
    }
    get speed() {
      return this._speed;
    }
    set speed(value) {
      this._speed = MathUtil.clamp(value, -100, 100);
    }
    get stopMode() {
      return this._stopMode;
    }
    set stopMode(value) {
      if (value >= 0 && value <= 2) this._stopMode = value;
    }
    get stallDetection() {
      return this._stallDetection;
    }
    set stallDetection(value) {
      this._stallDetection = value;
    }
  }

  // ============================================================================
  // SPIKE PRIME PERIPHERAL CLASS
  // ============================================================================
  class SpikePrime {
    constructor(runtime, extensionId) {
      this._runtime =
        runtime || (typeof vm !== "undefined" ? vm.runtime : null);
      this._extensionId = extensionId;
      this._remainingText = "";

      this._sensors = {
        buttons: [0, 0, 0, 0],
        angle: { pitch: 0, roll: 0, yaw: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        accelerationFiltered: { x: 0, y: 0, z: 0 },
        gyro: { x: 0, y: 0, z: 0 },
        gyroFiltered: { x: 0, y: 0, z: 0 },
        orientation: SpikeOrientation.front,
        battery: 100,
        temperature: 25,
        hubTemp: 25,
        power: { current: 0, voltage: 0 }, // NEW: Power supervision
        gestures: {
          tapped: false,
          doubletapped: false,
          shake: false,
          freefall: false,
        },
        motorPositions: {},
      };

      this._portValues = {};
      this._pixelBrightness = 100;
      this._motorSettings = {
        A: new SpikeMotorSetting(),
        B: new SpikeMotorSetting(),
        C: new SpikeMotorSetting(),
        D: new SpikeMotorSetting(),
        E: new SpikeMotorSetting(),
        F: new SpikeMotorSetting(),
      };

      this._movementMotors = ["A", "B"];
      this._timer = { start: Date.now(), current: 0 };
      this._volume = 100;
      this._replHistory = [];
      this._replOutput = "";

      this._bt = null;
      this._rateLimiter = new RateLimiter(BTSendRateMax);
      this._openRequests = {};
      this._pythonAvailable = false;
      this._sensorLoopRunning = false;

      this.reset = this.reset.bind(this);
      this._onConnect = this._onConnect.bind(this);
      this._onMessage = this._onMessage.bind(this);

      if (this._runtime) {
        this._runtime.registerPeripheralExtension(extensionId, this);
        this._runtime.on("PROJECT_STOP_ALL", this.stopAll.bind(this));
      }

      setInterval(() => {
        this._timer.current = (Date.now() - this._timer.start) / 1000;
      }, 10);
    }

    // Getters
    get angle() {
      return this._sensors.angle;
    }
    get orientation() {
      return this._sensors.orientation;
    }
    get portValues() {
      return this._portValues;
    }
    get pixelBrightness() {
      return this._pixelBrightness;
    }
    set pixelBrightness(value) {
      this._pixelBrightness = value;
    }
    get motorSettings() {
      return this._motorSettings;
    }
    get acceleration() {
      return this._sensors.acceleration;
    }
    get accelerationFiltered() {
      return this._sensors.accelerationFiltered;
    }
    get gyro() {
      return this._sensors.gyro;
    }
    get gyroFiltered() {
      return this._sensors.gyroFiltered;
    }
    get battery() {
      return this._sensors.battery;
    }
    get temperature() {
      return this._sensors.temperature;
    }
    get hubTemp() {
      return this._sensors.hubTemp;
    }
    get power() {
      return this._sensors.power;
    } // NEW
    get gestures() {
      return this._sensors.gestures;
    }
    get movementMotors() {
      return this._movementMotors;
    }
    get timer() {
      return this._timer.current;
    }
    get volume() {
      return this._volume;
    }
    get replOutput() {
      return this._replOutput;
    }
    get replHistory() {
      return this._replHistory;
    }

    stopAll() {
      if (!this.isConnected()) return;
      this.stopAllMotors();
      this.stopSound();
    }

    stopSound() {
      this.sendPythonCommand("import hub; hub.sound.stop()");
    }

    stopAllMotors() {
      this.sendPythonCommand(
        'import hub; [hub.port[p].motor.stop() for p in "ABCDEF" if hasattr(hub.port[p], "motor")]',
      );
    }

    scan() {
      if (this._bt) this._bt.disconnect();
      this._bt = new BT(
        this._runtime,
        this._extensionId,
        { majorDeviceClass: 8, minorDeviceClass: 1 },
        this._onConnect,
        this.reset,
        this._onMessage,
      );
    }

    connect(id) {
      if (this._bt) this._bt.connectPeripheral(id);
    }

    disconnect() {
      if (this._bt) this._bt.disconnect();
      this.reset();
    }

    reset() {
      this._remainingText = "";
      this._sensors = {
        buttons: [0, 0, 0, 0],
        angle: { pitch: 0, roll: 0, yaw: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        accelerationFiltered: { x: 0, y: 0, z: 0 },
        gyro: { x: 0, y: 0, z: 0 },
        gyroFiltered: { x: 0, y: 0, z: 0 },
        orientation: SpikeOrientation.front,
        battery: 100,
        temperature: 25,
        hubTemp: 25,
        power: { current: 0, voltage: 0 },
        gestures: {
          tapped: false,
          doubletapped: false,
          shake: false,
          freefall: false,
        },
        motorPositions: {},
      };
      this._portValues = {};
      this._pythonAvailable = false;
      this._sensorLoopRunning = false;
      this._timer.start = Date.now();
      this._timer.current = 0;
      this._replOutput = "";
      this._replHistory = [];
    }

    isConnected() {
      return this._bt ? this._bt.isConnected() : false;
    }

    sendJSON(json, useLimiter = false) {
      const jsonText = JSON.stringify(json);
      return this.sendRaw(`${jsonText}\r`, useLimiter, json.i);
    }

    sendRaw(text, useLimiter = false, id = null) {
      if (!this.isConnected()) return Promise.resolve();
      if (useLimiter && !this._rateLimiter.okayToSend())
        return Promise.resolve();
      if (!id) return this._bt.sendMessage({ message: text });
      const promise = new Promise((resolve, reject) => {
        this._openRequests[id] = { resolve, reject };
      });
      this._bt.sendMessage({ message: text });
      return promise;
    }

    sendCommand(method, params, needsResponse = true) {
      if (needsResponse) {
        const id = Math.random().toString(36).slice(-4);
        return this.sendJSON({ i: id, m: method, p: params });
      }
      return this.sendJSON({ m: method, p: params });
    }

    sendPythonCommand(pythonCode) {
      return this.sendRaw(`${pythonCode}\r\n`);
    }

    sendReplCommand(pythonCode) {
      this._replHistory.push(pythonCode);
      if (this._replHistory.length > 50) this._replHistory.shift();
      const wrappedCode = `
try:
    _result = eval("${pythonCode.replace(/"/g, '\\"')}")
    if _result is not None:
        print(f">>> {_result}")
    else:
        exec("${pythonCode.replace(/"/g, '\\"')}")
        print(">>> Command executed")
except Exception as e:
    print(f">>> Error: {e}")
`;
      return this.sendPythonCommand(wrappedCode);
    }

    _onConnect() {
      this.sendRaw("\x03");
      setTimeout(() => {
        this.sendRaw('import hub\r\nprint("PYTHON_AVAILABLE")\r\n');
        this.sendCommand("trigger_current_state", {}, false);
      }, 250);
    }

    _initializeContinuousSensorMonitoring() {
      if (!this._pythonAvailable || this._sensorLoopRunning) return;
      this._sensorLoopRunning = true;

      const sensorScript = `
import hub, utime
def continuous_sensor_loop():
    while True:
        try:
            yaw_angle, pitch_angle, roll_angle = hub.motion.position()
            accel_x, accel_y, accel_z = hub.motion.accelerometer()
            orientation = hub.motion.orientation()
            battery_temp = hub.battery.temperature()
            hub_temp = hub.temperature()
            sup = hub.supervision.info()
            current = sup.get('continuous_current', 0)
            voltage = hub.battery.voltage()
            motor_data = {}
            for port in 'ABCDEF':
                if hasattr(hub.port[port], 'motor'):
                    try:
                        speed, rel_deg, abs_deg, pwm = hub.port[port].motor.get()
                        motor_data[port] = f"{speed},{rel_deg},{abs_deg},{pwm}"
                    except: pass
            motor_str = "|".join([f"{k}:{v}" for k, v in motor_data.items()])
            print(f"SENSORS:{yaw_angle},{pitch_angle},{roll_angle}|{accel_x},{accel_y},{accel_z}|{orientation}|{battery_temp},{hub_temp}|{motor_str}|P:{current},{voltage}")
            for gesture in ['tapped', 'doubletapped', 'shake', 'freefall']:
                if hub.motion.was_gesture(gesture):
                    print(f"GESTURE:{gesture.upper()}")
        except: pass
        utime.sleep_ms(100)
continuous_sensor_loop()
`;
      this.sendPythonCommand(sensorScript);
    }

    _onMessage(params) {
      const message = params.message;
      const data = Base64Util.base64ToUint8Array(message);
      const text = new TextDecoder().decode(data);
      const responses = (this._remainingText + text).split("\r\n");
      this._remainingText = responses.pop();

      for (const responseText of responses) {
        const trimmedText = responseText.trim();
        if (!trimmedText) continue;
        try {
          const json = JSON.parse(trimmedText);
          this._parseResponse(json);
        } catch (error) {
          this._parseData(trimmedText);
        }
      }
    }

    _parseData(dataText) {
      try {
        if (dataText.startsWith("SENSORS:")) {
          const sensorData = dataText.substring(8);
          const parts = sensorData.split("|");
          if (parts.length >= 5) {
            const angles = parts[0].split(",").map(parseFloat);
            if (angles.length === 3)
              this._sensors.angle = {
                yaw: angles[0],
                pitch: angles[1],
                roll: angles[2],
              };
            const accel = parts[1].split(",").map(parseFloat);
            if (accel.length === 3)
              this._sensors.acceleration = {
                x: accel[0],
                y: accel[1],
                z: accel[2],
              };
            this._sensors.orientation = parseInt(parts[2], 10);
            const temps = parts[3].split(",").map(parseFloat);
            if (temps.length >= 2) {
              this._sensors.temperature = temps[0];
              this._sensors.hubTemp = temps[1];
            }
            if (parts[4]) {
              const motorPairs = parts[4].split("|");
              for (const pair of motorPairs) {
                const [port, values] = pair.split(":");
                if (port && values) {
                  const [speed, relDeg, absDeg, pwm] = values
                    .split(",")
                    .map(parseFloat);
                  this._sensors.motorPositions[port] = {
                    speed,
                    relativePosition: relDeg,
                    absolutePosition: absDeg,
                    power: pwm,
                  };
                }
              }
            }
            // NEW: Parse power data
            if (parts.length >= 6 && parts[5].startsWith("P:")) {
              const powerVals = parts[5]
                .substring(2)
                .split(",")
                .map(parseFloat);
              this._sensors.power = {
                current: powerVals[0],
                voltage: powerVals[1],
              };
            }
          }
        } else if (dataText.startsWith("GESTURE:")) {
          const gesture = dataText.substring(8).toLowerCase();
          if (this._sensors.gestures.hasOwnProperty(gesture)) {
            this._sensors.gestures[gesture] = true;
            setTimeout(() => {
              this._sensors.gestures[gesture] = false;
            }, 100);
          }
        } else if (dataText.includes("PYTHON_AVAILABLE")) {
          if (!this._pythonAvailable) {
            this._pythonAvailable = true;
            this._initializeContinuousSensorMonitoring();
          }
        } else if (dataText.startsWith(">>>")) {
          this._replOutput += dataText + "\n";
          if (this._replOutput.length > 1000) {
            this._replOutput = this._replOutput.substring(
              this._replOutput.length - 1000,
            );
          }
        }
      } catch (error) {
        console.warn("Error parsing raw data:", error);
      }
    }

    _parseResponse(response) {
      if (response.hasOwnProperty("m")) {
        switch (response.m) {
          case 0:
            this._parseHubStatus(response);
            break;
          case 2:
            if (response.p && response.p.length >= 2) {
              this._sensors.battery = Math.round(response.p[1]);
            }
            break;
          case 3:
            this._parseButtonEvent(response);
            break;
          case 4:
            this._parseEventResponse(response);
            break;
        }
      }
      if (response.hasOwnProperty("i")) {
        const openRequest = this._openRequests[response.i];
        delete this._openRequests[response.i];
        if (openRequest) openRequest.resolve();
      }
    }

    _parseHubStatus(response) {
      for (let i = 0; i < 6; i++) {
        const port = SpikePorts[i];
        const deviceId = response.p[i][0];
        const values = response.p[i][1];
        switch (deviceId) {
          case 48:
          case 49:
            this._portValues[port] = {
              type: "motor",
              speed: values[0],
              degreesCounted: values[1],
              position: (values[2] + 360) % 360,
              power: values[3],
              relativePosition: values[1] || 0,
              absolutePosition: values[2] || 0,
            };
            break;
          case 61:
            if (values.length >= 4)
              this._portValues[port] = {
                type: "color",
                color: values[0],
                reflection: values[1],
                ambient: values[2],
                red: values[3] || 0,
                green: values[4] || 0,
                blue: values[5] || 0,
              };
            break;
          case 62:
            this._portValues[port] = {
              type: "distance",
              distance: values[0] === -1 ? 0 : values[0],
            };
            break;
          case 63:
            this._portValues[port] = {
              type: "force",
              force: values[0],
              pressed: values[1] > 0,
            };
            break;
          default:
            this._portValues[port] = { type: "unknown" };
            break;
        }
      }
      if (response.p.length > 8 && response.p[8] && response.p[8].length >= 3) {
        this._sensors.angle = {
          yaw: response.p[8][0],
          pitch: response.p[8][1],
          roll: response.p[8][2],
        };
      }
    }

    _parseButtonEvent(response) {
      if (response.p && response.p.length >= 2) {
        const button = response.p[0];
        const pressed = response.p[1] === 1;
        const buttonIndex = { left: 0, center: 1, right: 2 }[button];
        if (buttonIndex !== undefined)
          this._sensors.buttons[buttonIndex] = pressed ? 1 : 0;
      }
    }

    _parseEventResponse(response) {
      if (SpikeOrientation.hasOwnProperty(response.p)) {
        this._sensors.orientation = SpikeOrientation[response.p];
      }
      const gestureMap = {
        tapped: "tapped",
        doubletapped: "doubletapped",
        shake: "shake",
        freefall: "freefall",
      };
      if (gestureMap[response.p]) {
        this._sensors.gestures[gestureMap[response.p]] = true;
        setTimeout(() => {
          this._sensors.gestures[gestureMap[response.p]] = false;
        }, 100);
      }
    }
  }

  // ============================================================================
  // EXTENSION CLASS
  // ============================================================================
  class SpikePrimeExtension {
    constructor(runtime) {
      this.runtime = runtime;
      if (!this.runtime && typeof Scratch !== "undefined" && Scratch.vm) {
        this.runtime = Scratch.vm.runtime;
      }
      this._peripheral = new SpikePrime(this.runtime, "spikeprime");
      console.log("🤖 [SPIKE] Extension loaded - Language:", currentLang);
    }

    getInfo() {
      return {
        id: "spikeprime",
        name: t("extensionName"),
        blockIconURI: iconURI,
        showStatusButton: true,
        blocks: [
          // Movement
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
            opcode: "moveForward",
            text: t("moveForward"),
            blockType: BlockType.COMMAND,
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "MOVE_DIRECTION",
                defaultValue: "forward",
              },
              VALUE: { type: ArgumentType.NUMBER, defaultValue: 10 },
              UNIT: {
                type: ArgumentType.STRING,
                menu: "MOVE_UNIT",
                defaultValue: "cm",
              },
            },
          },
          {
            opcode: "steer",
            text: t("steer"),
            blockType: BlockType.COMMAND,
            arguments: {
              STEERING: { type: ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "startTank",
            text: t("startTank"),
            blockType: BlockType.COMMAND,
            arguments: {
              LEFT_SPEED: { type: ArgumentType.NUMBER, defaultValue: 50 },
              RIGHT_SPEED: { type: ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "setMovementSpeed",
            text: t("setMovementSpeed"),
            blockType: BlockType.COMMAND,
            arguments: {
              SPEED: { type: ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "stopMovement",
            text: t("stopMovement"),
            blockType: BlockType.COMMAND,
          },
          "---",
          // Motors
          {
            opcode: "motorRunFor",
            text: t("motorRunFor"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "MULTIPLE_PORT",
                defaultValue: "A",
              },
              DIRECTION: {
                type: ArgumentType.NUMBER,
                menu: "DIRECTION",
                defaultValue: 1,
              },
              VALUE: { type: ArgumentType.NUMBER, defaultValue: 1 },
              UNIT: {
                type: ArgumentType.STRING,
                menu: "MOTOR_UNIT",
                defaultValue: "rotations",
              },
            },
          },
          {
            opcode: "motorRunToPosition",
            text: t("motorRunToPosition"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "C",
              },
              POSITION: { type: ArgumentType.ANGLE, defaultValue: 0 },
            },
          },
          {
            opcode: "motorStart",
            text: t("motorStart"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "MULTIPLE_PORT",
                defaultValue: "A",
              },
              DIRECTION: {
                type: ArgumentType.NUMBER,
                menu: "DIRECTION",
                defaultValue: 1,
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
                menu: "MULTIPLE_PORT",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "motorSetSpeed",
            text: t("motorSetSpeed"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "MULTIPLE_PORT",
                defaultValue: "A",
              },
              SPEED: { type: ArgumentType.NUMBER, defaultValue: 75 },
            },
          },
          {
            opcode: "motorSetStopAction",
            text: t("motorSetStopAction"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              ACTION: {
                type: ArgumentType.STRING,
                menu: "STOP_ACTION",
                defaultValue: "brake",
              },
            },
          },
          {
            opcode: "getPosition",
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
            opcode: "getRelativePosition",
            text: t("getRelativePosition"),
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
            opcode: "getAbsolutePosition",
            text: t("getAbsolutePosition"),
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
            opcode: "getSpeed",
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
          // Display
          {
            opcode: "displayText",
            text: t("displayText"),
            blockType: BlockType.COMMAND,
            arguments: {
              TEXT: { type: ArgumentType.STRING, defaultValue: "Hello" },
            },
          },
          {
            opcode: "displayImage",
            text: t("displayImage"),
            blockType: BlockType.COMMAND,
            arguments: {
              MATRIX: {
                type: ArgumentType.MATRIX,
                defaultValue: "1101111011000001000101110",
              },
            },
          },
          {
            opcode: "displayPattern",
            text: t("displayPattern"),
            blockType: BlockType.COMMAND,
            arguments: {
              PATTERN: {
                type: ArgumentType.STRING,
                menu: "DISPLAY_PATTERN",
                defaultValue: "heart",
              },
            },
          },
          {
            opcode: "displayClear",
            text: t("displayClear"),
            blockType: BlockType.COMMAND,
          },
          {
            opcode: "setPixel",
            text: t("setPixel"),
            blockType: BlockType.COMMAND,
            arguments: {
              X: { type: ArgumentType.NUMBER, defaultValue: 3 },
              Y: { type: ArgumentType.NUMBER, defaultValue: 3 },
              BRIGHTNESS: { type: ArgumentType.NUMBER, defaultValue: 100 },
            },
          },
          {
            opcode: "rotateDisplay",
            text: t("rotateDisplay"),
            blockType: BlockType.COMMAND,
            arguments: {
              ANGLE: {
                type: ArgumentType.STRING,
                menu: "ROTATION_ANGLE",
                defaultValue: "90",
              },
            },
          },
          {
            opcode: "setCenterButtonColor",
            text: t("setCenterButtonColor"),
            blockType: BlockType.COMMAND,
            arguments: {
              COLOR: {
                type: ArgumentType.STRING,
                menu: "CENTER_LED_COLOR",
                defaultValue: "GREEN",
              },
            },
          },
          "---",
          // IMU & Gyro
          {
            opcode: "getAngle",
            text: t("getAngle"),
            blockType: BlockType.REPORTER,
            arguments: {
              AXIS: {
                type: ArgumentType.STRING,
                menu: "AXIS",
                defaultValue: "pitch",
              },
            },
          },
          {
            opcode: "getGyroRate",
            text: t("getGyroRate"),
            blockType: BlockType.REPORTER,
            arguments: {
              AXIS: {
                type: ArgumentType.STRING,
                menu: "AXIS",
                defaultValue: "yaw",
              },
            },
          },
          {
            opcode: "getFilteredGyroRate",
            text: t("getFilteredGyroRate"),
            blockType: BlockType.REPORTER,
            arguments: {
              AXIS: {
                type: ArgumentType.STRING,
                menu: "AXIS",
                defaultValue: "yaw",
              },
            },
          },
          {
            opcode: "getAcceleration",
            text: t("getAcceleration"),
            blockType: BlockType.REPORTER,
            arguments: {
              AXIS: {
                type: ArgumentType.STRING,
                menu: "AXIS_XYZ",
                defaultValue: "x",
              },
            },
          },
          {
            opcode: "getFilteredAcceleration",
            text: t("getFilteredAcceleration"),
            blockType: BlockType.REPORTER,
            arguments: {
              AXIS: {
                type: ArgumentType.STRING,
                menu: "AXIS_XYZ",
                defaultValue: "x",
              },
            },
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
          // 3x3 LED Matrix
          {
            opcode: "setMatrix3x3ColorGrid",
            text: t("setMatrix3x3ColorGrid"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              P1: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P2: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "⚫",
              },
              P3: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P4: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P5: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P6: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P7: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "⚫",
              },
              P8: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              P9: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "⚫",
              },
            },
          },
          {
            opcode: "setMatrix3x3Custom",
            text: t("setMatrix3x3Custom"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              PATTERN: {
                type: ArgumentType.STRING,
                defaultValue: "r8 g6 b4\\ny7 w9 o5\\nm3 v2 .1",
              },
            },
          },
          {
            opcode: "setMatrix3x3SolidColor",
            text: t("setMatrix3x3SolidColor"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "MATRIX_COLOR_EMOJI",
                defaultValue: "🔴",
              },
              BRIGHTNESS: {
                type: ArgumentType.STRING,
                menu: "BRIGHTNESS_1_TO_10",
                defaultValue: "5",
              },
            },
          },
          {
            opcode: "clearMatrix3x3",
            text: t("clearMatrix3x3"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
            },
          },
          "---",
          // Gestures
          {
            opcode: "whenGesture",
            blockType: BlockType.HAT,
            text: t("whenGesture"),
            arguments: {
              GESTURE: {
                type: ArgumentType.STRING,
                menu: "GESTURE",
                defaultValue: "tapped",
              },
            },
          },
          {
            opcode: "isGesture",
            blockType: BlockType.BOOLEAN,
            text: t("isGesture"),
            arguments: {
              GESTURE: {
                type: ArgumentType.STRING,
                menu: "GESTURE",
                defaultValue: "tapped",
              },
            },
          },
          {
            opcode: "getOrientation",
            text: t("getOrientation"),
            blockType: BlockType.REPORTER,
          },
          "---",
          // Sound
          {
            opcode: "playHubSound",
            text: t("playHubSound"),
            blockType: BlockType.COMMAND,
            arguments: {
              SOUND: {
                type: ArgumentType.STRING,
                menu: "HUB_SOUND",
                defaultValue: "startup",
              },
            },
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
              NOTE: { type: ArgumentType.NOTE, defaultValue: 60 },
              SECS: { type: ArgumentType.NUMBER, defaultValue: 0.5 },
            },
          },
          {
            opcode: "playWaveBeep",
            text: t("playWaveBeep"),
            blockType: BlockType.COMMAND,
            arguments: {
              WAVEFORM: {
                type: ArgumentType.STRING,
                menu: "WAVEFORM",
                defaultValue: "sin",
              },
              FREQUENCY: { type: ArgumentType.NUMBER, defaultValue: 440 },
              DURATION: { type: ArgumentType.NUMBER, defaultValue: 500 },
            },
          },
          {
            opcode: "setVolume",
            text: t("setVolume"),
            blockType: BlockType.COMMAND,
            arguments: {
              VOLUME: { type: ArgumentType.NUMBER, defaultValue: 100 },
            },
          },
          {
            opcode: "stopSound",
            text: t("stopSound"),
            blockType: BlockType.COMMAND,
          },
          "---",
          // Status & Power (NEW: Added power blocks)
          {
            opcode: "getBatteryLevel",
            text: t("getBatteryLevel"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "getBatteryTemperature",
            text: t("getBatteryTemperature"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "getHubTemperature",
            text: t("getHubTemperature"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "getHubCurrent",
            text: t("getHubCurrent"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "getHubVoltage",
            text: t("getHubVoltage"),
            blockType: BlockType.REPORTER,
          },
          "---",
          // Timer
          {
            opcode: "getTimer",
            text: t("getTimer"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "resetTimer",
            text: t("resetTimer"),
            blockType: BlockType.COMMAND,
          },
          "---",
          // Sensors
          {
            opcode: "getDistance",
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
            opcode: "setDistanceLights",
            text: t("setDistanceLights"),
            blockType: BlockType.COMMAND,
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              TL: { type: ArgumentType.NUMBER, defaultValue: 9 },
              TR: { type: ArgumentType.NUMBER, defaultValue: 9 },
              BL: { type: ArgumentType.NUMBER, defaultValue: 9 },
              BR: { type: ArgumentType.NUMBER, defaultValue: 9 },
            },
          },
          {
            opcode: "getColor",
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
            opcode: "getReflection",
            text: t("getReflection"),
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
            opcode: "getAmbientLight",
            text: t("getAmbientLight"),
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
            opcode: "getForce",
            text: t("getForce"),
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
          {
            opcode: "whenColor",
            blockType: BlockType.HAT,
            text: t("whenColor"),
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "COLOR",
                defaultValue: "red",
              },
            },
          },
          {
            opcode: "isColor",
            blockType: BlockType.BOOLEAN,
            text: t("isColor"),
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "COLOR",
                defaultValue: "red",
              },
            },
          },
          {
            opcode: "whenForceSensor",
            blockType: BlockType.HAT,
            text: t("whenForceSensor"),
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              STATE: {
                type: ArgumentType.STRING,
                menu: "FORCE_STATE",
                defaultValue: "pressed",
              },
            },
          },
          "---",
          // Buttons
          {
            opcode: "isButtonPressed",
            text: t("isButtonPressed"),
            blockType: BlockType.BOOLEAN,
            arguments: {
              BUTTON: {
                type: ArgumentType.STRING,
                menu: "BUTTON",
                defaultValue: "center",
              },
            },
          },
          {
            opcode: "whenButtonPressed",
            blockType: BlockType.HAT,
            text: t("whenButtonPressed"),
            arguments: {
              BUTTON: {
                type: ArgumentType.STRING,
                menu: "BUTTON",
                defaultValue: "center",
              },
            },
          },
          "---",
          // File System (NEW)
          {
            opcode: "writeLogFile",
            text: t("writeLogFile"),
            blockType: BlockType.COMMAND,
            arguments: {
              TEXT: { type: ArgumentType.STRING, defaultValue: "data" },
              FILENAME: { type: ArgumentType.STRING, defaultValue: "log.txt" },
            },
          },
          {
            opcode: "readLogFile",
            text: t("readLogFile"),
            blockType: BlockType.REPORTER,
            arguments: {
              FILENAME: { type: ArgumentType.STRING, defaultValue: "log.txt" },
            },
          },
          {
            opcode: "deleteLogFile",
            text: t("deleteLogFile"),
            blockType: BlockType.COMMAND,
            arguments: {
              FILENAME: { type: ArgumentType.STRING, defaultValue: "log.txt" },
            },
          },
          {
            opcode: "listFiles",
            text: t("listFiles"),
            blockType: BlockType.REPORTER,
          },
          "---",
          // Python REPL
          {
            opcode: "runReplCommand",
            text: t("runReplCommand"),
            blockType: BlockType.COMMAND,
            arguments: {
              CODE: {
                type: ArgumentType.STRING,
                defaultValue: 'print("Hello REPL!")',
              },
            },
          },
          {
            opcode: "getReplOutput",
            text: t("getReplOutput"),
            blockType: BlockType.REPORTER,
          },
          {
            opcode: "clearReplOutput",
            text: t("clearReplOutput"),
            blockType: BlockType.COMMAND,
          },
          {
            opcode: "getReplHistory",
            text: t("getReplHistory"),
            blockType: BlockType.REPORTER,
            arguments: {
              INDEX: { type: ArgumentType.NUMBER, defaultValue: -1 },
            },
          },
          "---",
          // Advanced Python
          {
            opcode: "runPythonCommand",
            text: t("runPythonCommand"),
            blockType: BlockType.COMMAND,
            arguments: {
              CODE: {
                type: ArgumentType.STRING,
                defaultValue: 'print("Hello World")',
              },
            },
          },
          {
            opcode: "runHubCommand",
            text: t("runHubCommand"),
            blockType: BlockType.COMMAND,
            arguments: {
              CODE: { type: ArgumentType.STRING, defaultValue: "hub.status()" },
            },
          },
          {
            opcode: "exitScript",
            text: t("exitScript"),
            blockType: BlockType.COMMAND,
          },
        ],
        menus: {
          PORT: { acceptReporters: true, items: SpikePorts },
          MULTIPLE_PORT: {
            acceptReporters: true,
            items: [
              "A",
              "B",
              "C",
              "D",
              "E",
              "F",
              "A+B",
              "C+D",
              "E+F",
              "A+B+C+D+E+F",
            ],
          },
          MOTOR_UNIT: {
            acceptReporters: false,
            items: ["rotations", "degrees", "seconds"],
          },
          AXIS: { acceptReporters: false, items: ["pitch", "roll", "yaw"] },
          AXIS_XYZ: { acceptReporters: false, items: ["x", "y", "z"] },
          DIRECTION: {
            acceptReporters: false,
            items: [
              { text: "⬆️", value: "1" },
              { text: "⬇️", value: "-1" },
            ],
          },
          DISPLAY_PATTERN: {
            acceptReporters: false,
            items: Object.keys(DisplayPatterns),
          },
          ROTATION_ANGLE: {
            acceptReporters: false,
            items: ["90", "-90", "180", "-180"],
          },
          CENTER_LED_COLOR: {
            acceptReporters: false,
            items: Object.keys(CenterLEDColors),
          },
          GESTURE: {
            acceptReporters: false,
            items: [t("tapped"), t("doubletapped"), t("shake"), t("freefall")],
          },
          HUB_SOUND: { acceptReporters: false, items: HubSoundFiles },
          WAVEFORM: {
            acceptReporters: false,
            items: ["sin", "square", "triangle", "sawtooth"],
          },
          BUTTON: {
            acceptReporters: false,
            items: [t("left"), "center", t("right"), "connect"],
          },
          MOVE_DIRECTION: {
            acceptReporters: false,
            items: [t("forward"), t("backward")],
          },
          MOVE_UNIT: {
            acceptReporters: false,
            items: ["cm", "in", "rotations", "degrees", "seconds"],
          },
          STOP_ACTION: {
            acceptReporters: false,
            items: ["coast", "brake", "hold"],
          },
          COLOR: {
            acceptReporters: true,
            items: [
              "red",
              "green",
              "blue",
              "yellow",
              "cyan",
              "magenta",
              "white",
              "black",
            ],
          },
          FORCE_STATE: {
            acceptReporters: false,
            items: ["pressed", "hard pressed", "released"],
          },
          MATRIX_COLOR_EMOJI: {
            acceptReporters: false,
            items: [
              { text: "⚫ Off", value: "⚫" },
              { text: "🟣 Magenta", value: "🟣" },
              { text: "🟪 Violet", value: "🟪" },
              { text: "🔵 Blue", value: "🔵" },
              { text: "🔷 Turquoise", value: "🔷" },
              { text: "🟢 Mint", value: "🟢" },
              { text: "🟩 Green", value: "🟩" },
              { text: "🟡 Yellow", value: "🟡" },
              { text: "🟠 Orange", value: "🟠" },
              { text: "🔴 Red", value: "🔴" },
              { text: "⚪ White", value: "⚪" },
            ],
          },
          BRIGHTNESS_1_TO_10: {
            acceptReporters: false,
            items: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          },
        },
      };
    }

    // [IMPLEMENTATION METHODS CONTINUE IN NEXT MESSAGE DUE TO LENGTH]

    // Movement implementations
    setMovementMotors(args) {
      const portA = Cast.toString(args.PORT_A).trim().toUpperCase();
      const portB = Cast.toString(args.PORT_B).trim().toUpperCase();
      this._peripheral._movementMotors = [portA, portB];
    }

    moveForward(args) {
      const direction = Cast.toString(args.DIRECTION);
      const value = Cast.toNumber(args.VALUE);
      const unit = Cast.toString(args.UNIT);
      const [portA] = this._peripheral._movementMotors;
      const speed = this._peripheral.motorSettings[portA].speed;
      const dirMultiplier = direction === "forward" ? 1 : -1;
      if (unit === "cm") {
        const rotations = value / 17.6;
        return this._peripheral.sendPythonCommand(
          `motors.move(${rotations * dirMultiplier}, 'rotations', speed=${speed})`,
        );
      } else if (unit === "in") {
        const rotations = value / 6.93;
        return this._peripheral.sendPythonCommand(
          `motors.move(${rotations * dirMultiplier}, 'rotations', speed=${speed})`,
        );
      } else {
        return this._peripheral.sendPythonCommand(
          `motors.move(${value * dirMultiplier}, '${unit}', speed=${speed})`,
        );
      }
    }

    steer(args) {
      const steering = Cast.toNumber(args.STEERING);
      const [portA] = this._peripheral._movementMotors;
      const speed = this._peripheral.motorSettings[portA].speed;
      return this._peripheral.sendPythonCommand(
        `motors.start(${steering}, speed=${speed})`,
      );
    }

    startTank(args) {
      const leftSpeed = Cast.toNumber(args.LEFT_SPEED);
      const rightSpeed = Cast.toNumber(args.RIGHT_SPEED);
      return this._peripheral.sendPythonCommand(
        `motors.start_tank(${leftSpeed}, ${rightSpeed})`,
      );
    }

    setMovementSpeed(args) {
      const speed = Cast.toNumber(args.SPEED);
      const [portA, portB] = this._peripheral._movementMotors;
      this._peripheral.motorSettings[portA].speed = speed;
      this._peripheral.motorSettings[portB].speed = speed;
      return this._peripheral.sendPythonCommand(
        `motors.set_default_speed(${speed})`,
      );
    }

    stopMovement() {
      return this._peripheral.sendPythonCommand("motors.stop()");
    }

    // Motor implementations
    motorRunFor(args) {
      const direction = args.DIRECTION;
      const value = Cast.toNumber(args.VALUE);
      const unit = args.UNIT;
      const ports = this._validatePorts(Cast.toString(args.PORT));
      switch (unit) {
        case "rotations":
          return this._motorRunForDegrees(ports, direction, value * 360);
        case "degrees":
          return this._motorRunForDegrees(ports, direction, value);
        case "seconds":
          return this._motorRunTimed(ports, direction, value);
        default:
          return Promise.resolve();
      }
    }

    motorRunToPosition(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const position = Cast.toNumber(args.POSITION);
      const speed = this._peripheral.motorSettings[port].speed;
      return this._peripheral.sendPythonCommand(
        `hub.port.${port}.motor.run_to_position(${position}, speed=${speed})`,
      );
    }

    _motorRunForDegrees(ports, direction, degrees) {
      const promises = ports.map((port) => {
        const setting = this._peripheral.motorSettings[port];
        const standardCommand = this._peripheral.sendCommand(
          "scratch.motor_run_for_degrees",
          {
            port: port,
            speed: setting.speed * direction,
            degrees: Math.floor(degrees),
            stop: setting.stopMode,
            stall: setting.stallDetection,
          },
        );
        const altCommand = this._peripheral.sendPythonCommand(
          `import hub; hub.port.${port}.motor.run_for_degrees(${Math.floor(degrees)}, ${setting.speed * direction})`,
        );
        return standardCommand.catch(() => altCommand);
      });
      return Promise.all(promises).then(() => {});
    }

    _motorRunTimed(ports, direction, seconds) {
      const promises = ports.map((port) => {
        const setting = this._peripheral.motorSettings[port];
        const standardCommand = this._peripheral.sendCommand(
          "scratch.motor_run_timed",
          {
            port: port,
            speed: setting.speed * direction,
            time: Math.floor(seconds * 1000),
            stop: setting.stopMode,
            stall: setting.stallDetection,
          },
        );
        const altCommand = this._peripheral.sendPythonCommand(
          `import hub; hub.port.${port}.motor.run_for_time(${Math.floor(seconds * 1000)}, ${setting.speed * direction})`,
        );
        return standardCommand.catch(() => altCommand);
      });
      return Promise.all(promises).then(() => {});
    }

    motorStart(args) {
      const direction = args.DIRECTION;
      const ports = this._validatePorts(Cast.toString(args.PORT));
      const promises = ports.map((port) => {
        const setting = this._peripheral.motorSettings[port];
        const standardCommand = this._peripheral.sendCommand(
          "scratch.motor_start",
          {
            port: port,
            speed: setting.speed * direction,
            stall: setting.stallDetection,
          },
        );
        const altCommand = this._peripheral.sendPythonCommand(
          `import hub; hub.port.${port}.motor.pwm(${Math.round(setting.speed * direction)})`,
        );
        return standardCommand.catch(() => altCommand);
      });
      return Promise.all(promises).then(() => {});
    }

    motorStop(args) {
      const ports = this._validatePorts(Cast.toString(args.PORT));
      const promises = ports.map((port) => {
        const setting = this._peripheral.motorSettings[port];
        const standardCommand = this._peripheral.sendCommand(
          "scratch.motor_stop",
          { port: port, stop: setting.stopMode },
        );
        const altCommand = this._peripheral.sendPythonCommand(
          `import hub; hub.port.${port}.motor.stop()`,
        );
        return standardCommand.catch(() => altCommand);
      });
      return Promise.all(promises).then(() => {});
    }

    motorSetSpeed(args) {
      const speed = Cast.toNumber(args.SPEED);
      const ports = this._validatePorts(Cast.toString(args.PORT));
      ports.forEach((port) => {
        this._peripheral.motorSettings[port].speed = speed;
      });
    }

    motorSetStopAction(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const action = Cast.toString(args.ACTION);
      const stopModeMap = { coast: 0, brake: 1, hold: 2 };
      this._peripheral.motorSettings[port].stopMode = stopModeMap[action] || 1;
      return this._peripheral.sendPythonCommand(
        `hub.port.${port}.motor.set_stop_action('${action}')`,
      );
    }

    getPosition(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      return this._peripheral.portValues[port]?.position ?? 0;
    }

    getRelativePosition(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const altData = this._peripheral._sensors.motorPositions[port];
      if (altData) return altData.relativePosition;
      return this._peripheral.portValues[port]?.relativePosition ?? 0;
    }

    getAbsolutePosition(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const altData = this._peripheral._sensors.motorPositions[port];
      if (altData) return altData.absolutePosition;
      return this._peripheral.portValues[port]?.absolutePosition ?? 0;
    }

    getSpeed(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const altData = this._peripheral._sensors.motorPositions[port];
      if (altData) return Math.round(altData.speed * 9.3);
      const speedPercent = this._peripheral.portValues[port]?.speed ?? 0;
      return Math.round(speedPercent * 9.3);
    }

    resetMotorPosition(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const position = Cast.toNumber(args.POSITION);
      return this._peripheral.sendPythonCommand(
        `import hub; hub.port.${port}.motor.preset(${position})`,
      );
    }

    // Display implementations
    displayText(args) {
      const text = Cast.toString(args.TEXT);
      const standardCommand = this._peripheral.sendCommand(
        "scratch.display_text",
        { text: text },
      );
      const altCommand = this._peripheral.sendPythonCommand(
        `import hub; hub.display.show("${text.replace(/"/g, '\\"')}")`,
      );
      return standardCommand.catch(() => altCommand);
    }

    displayImage(args) {
      const matrix = Cast.toString(args.MATRIX);
      const brightness = Math.round(
        (9 * this._peripheral.pixelBrightness) / 100,
      );
      const symbol = (matrix.replace(/\D/g, "") + "0".repeat(25)).slice(0, 25);
      const image = symbol.replace(/1/g, brightness).match(/.{5}/g).join(":");
      const standardCommand = this._peripheral.sendCommand(
        "scratch.display_image",
        { image: image },
      );
      const altImage = symbol
        .replace(/1/g, "9")
        .replace(/0/g, "_")
        .match(/.{5}/g)
        .join(":");
      const altCommand = this._peripheral.sendPythonCommand(
        `import hub; hub.display.show(hub.Image("${altImage}"))`,
      );
      return standardCommand.catch(() => altCommand);
    }

    displayPattern(args) {
      const pattern = Cast.toString(args.PATTERN);
      const patternData = DisplayPatterns[pattern];
      if (patternData) return this.displayImage({ MATRIX: patternData });
      return Promise.resolve();
    }

    displayClear() {
      const standardCommand = this._peripheral.sendCommand(
        "scratch.display_clear",
        {},
      );
      const altCommand = this._peripheral.sendPythonCommand(
        'import hub; hub.display.show(" ")',
      );
      return standardCommand.catch(() => altCommand);
    }

    setPixel(args) {
      const x = Cast.toNumber(args.X) - 1;
      const y = Cast.toNumber(args.Y) - 1;
      const brightness = Cast.toNumber(args.BRIGHTNESS);
      if (x < 0 || x > 4 || y < 0 || y > 4) return Promise.resolve();
      const standardCommand = this._peripheral.sendCommand(
        "scratch.display_set_pixel",
        { x: x, y: y, brightness: Math.round((brightness * 9) / 100) },
      );
      const altCommand = this._peripheral.sendPythonCommand(
        `import hub; hub.display.pixel(${x}, ${y}, ${Math.round((brightness * 9) / 100)})`,
      );
      return standardCommand.catch(() => altCommand);
    }

    rotateDisplay(args) {
      const angle = Cast.toString(args.ANGLE);
      return this._peripheral.sendPythonCommand(
        `import hub; hub.display.rotation(${angle})`,
      );
    }

    setCenterButtonColor(args) {
      const colorName = Cast.toString(args.COLOR);
      const colorValue = CenterLEDColors[colorName] || 0;
      const standardCommand = this._peripheral.sendCommand(
        "scratch.center_button_lights",
        { color: colorValue },
      );
      const altCommand = this._peripheral.sendPythonCommand(
        `import hub; hub.led(${colorValue})`,
      );
      return standardCommand.catch(() => altCommand);
    }

    // IMU & Gyro
    getAngle(args) {
      const axis = Cast.toString(args.AXIS);
      return this._peripheral.angle[axis] || 0;
    }
    getGyroRate(args) {
      const axis = Cast.toString(args.AXIS);
      return this._peripheral.gyro[axis] || 0;
    }
    getFilteredGyroRate(args) {
      const axis = Cast.toString(args.AXIS);
      return this._peripheral.gyroFiltered[axis] || 0;
    }
    getAcceleration(args) {
      const axis = Cast.toString(args.AXIS);
      return this._peripheral.acceleration[axis] || 0;
    }
    getFilteredAcceleration(args) {
      const axis = Cast.toString(args.AXIS);
      return this._peripheral.accelerationFiltered[axis] || 0;
    }
    resetYaw() {
      this._peripheral._timer.start = Date.now();
      return this._peripheral.sendPythonCommand(
        "import hub; hub.motion.reset_yaw()",
      );
    }
    presetYaw(args) {
      const angle = Cast.toNumber(args.ANGLE);
      return this._peripheral.sendPythonCommand(
        `import hub; hub.motion.preset_yaw(${angle})`,
      );
    }

    // 3x3 LED Matrix
    setMatrix3x3ColorGrid(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const pixels = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"].map(
        (pixel) => {
          const emoji = Cast.toString(args[pixel]);
          const colorId = ColorEmojiMap[emoji] || 0;
          return 5 * 16 + colorId;
        },
      );
      const byteString = pixels
        .map((b) => `\\x${b.toString(16).padStart(2, "0")}`)
        .join("");
      return this._peripheral.sendPythonCommand(
        `import hub; matrix = hub.port.${port}.device; matrix.mode(2); matrix.mode(2, b"${byteString}")`,
      );
    }

    setMatrix3x3Custom(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const pattern = Cast.toString(args.PATTERN);
      const colorCodes = {
        ".": 0,
        m: 1,
        v: 2,
        b: 3,
        t: 4,
        n: 5,
        g: 6,
        y: 7,
        o: 8,
        r: 9,
        w: 10,
      };
      try {
        const lines = pattern.split(/\n|\|/);
        const pixels = [];
        for (const line of lines) {
          const pixelCodes = line.trim().split(/\s+/);
          for (const code of pixelCodes) {
            if (code.length >= 2) {
              const colorChar = code.charAt(0).toLowerCase();
              const brightnessStr = code.substring(1);
              const colorId =
                colorCodes[colorChar] !== undefined ? colorCodes[colorChar] : 0;
              const brightness = Math.max(
                1,
                Math.min(10, parseInt(brightnessStr) || 1),
              );
              pixels.push(brightness * 16 + colorId);
            }
          }
        }
        while (pixels.length < 9) pixels.push(0x01);
        pixels.splice(9);
        const byteString = pixels
          .map((b) => `\\x${b.toString(16).padStart(2, "0")}`)
          .join("");
        return this._peripheral.sendPythonCommand(
          `import hub; matrix = hub.port.${port}.device; matrix.mode(2); matrix.mode(2, b"${byteString}")`,
        );
      } catch (error) {
        return this._peripheral.sendPythonCommand(
          `import hub; matrix = hub.port.${port}.device; matrix.mode(2); matrix.mode(2, b"\\x01\\x01\\x01\\x01\\x01\\x01\\x01\\x01\\x01")`,
        );
      }
    }

    setMatrix3x3SolidColor(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const colorEmoji = Cast.toString(args.COLOR);
      const brightness = MathUtil.clamp(Cast.toNumber(args.BRIGHTNESS), 1, 10);
      const colorId = ColorEmojiMap[colorEmoji] || 0;
      const value = brightness * 16 + colorId;
      const pixels = Array(9).fill(value);
      const byteString = pixels
        .map((b) => `\\x${b.toString(16).padStart(2, "0")}`)
        .join("");
      return this._peripheral.sendPythonCommand(
        `import hub; matrix = hub.port.${port}.device; matrix.mode(2); matrix.mode(2, b"${byteString}")`,
      );
    }

    clearMatrix3x3(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      return this._peripheral.sendPythonCommand(
        `import hub; matrix = hub.port.${port}.device; matrix.mode(2); matrix.mode(2, b"\\x01\\x01\\x01\\x01\\x01\\x01\\x01\\x01\\x01")`,
      );
    }

    // Gestures
    whenGesture(args) {
      return this.isGesture(args);
    }
    isGesture(args) {
      const gesture = Cast.toString(args.GESTURE);
      return this._peripheral.gestures[gesture] || false;
    }
    getOrientation() {
      const orientationNames = ["up", "front", "right", "down", "back", "left"];
      return orientationNames[this._peripheral.orientation] || "unknown";
    }

    // Sound
    playHubSound(args) {
      const sound = Cast.toString(args.SOUND);
      return this._peripheral.sendPythonCommand(
        `import hub; hub.sound.play("/sounds/${sound}")`,
      );
    }
    playBeep(args) {
      const frequency = Cast.toNumber(args.FREQUENCY);
      const duration = Cast.toNumber(args.DURATION);
      const standardCommand = this._peripheral.sendCommand(
        "scratch.sound_beep",
        { frequency: frequency, duration: duration },
      );
      const altCommand = this._peripheral.sendPythonCommand(
        `import hub; hub.sound.beep(${frequency}, ${duration}, hub.sound.SOUND_SIN)`,
      );
      return standardCommand.catch(() => altCommand);
    }
    playNote(args) {
      const note = Cast.toNumber(args.NOTE);
      const secs = Cast.toNumber(args.SECS);
      const freq = this._noteToFrequency(note);
      const volume = this._peripheral.volume / 100;
      return this._peripheral.sendPythonCommand(
        `hub.sound.beep(${Math.round(freq)}, ${Math.round(secs * 1000)}, hub.sound.SOUND_SIN, ${volume})`,
      );
    }
    playWaveBeep(args) {
      const waveform = Cast.toString(args.WAVEFORM);
      const frequency = Cast.toNumber(args.FREQUENCY);
      const duration = Cast.toNumber(args.DURATION);
      const waveformCode = SoundWaveforms[waveform] || SoundWaveforms.sin;
      return this._peripheral.sendPythonCommand(
        `import hub; hub.sound.beep(${frequency}, ${duration}, ${waveformCode})`,
      );
    }
    setVolume(args) {
      const volume = Cast.toNumber(args.VOLUME);
      this._peripheral._volume = MathUtil.clamp(volume, 0, 100);
      return this._peripheral.sendPythonCommand(`hub.sound.volume(${volume})`);
    }
    stopSound() {
      return this._peripheral.stopSound();
    }

    // Status & Temperature & Power
    getBatteryLevel() {
      return this._peripheral.battery || 100;
    }
    getBatteryTemperature() {
      return this._peripheral.temperature || 25;
    }
    getHubTemperature() {
      return this._peripheral.hubTemp || 25;
    }
    getHubCurrent() {
      return this._peripheral.power.current || 0;
    } // NEW
    getHubVoltage() {
      return this._peripheral.power.voltage || 0;
    } // NEW

    // Timer
    getTimer() {
      return this._peripheral.timer;
    }
    resetTimer() {
      this._peripheral._timer.start = Date.now();
      this._peripheral._timer.current = 0;
    }

    // Sensors
    getDistance(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "distance") return portData.distance;
      return 0;
    }
    setDistanceLights(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const tl = MathUtil.clamp(Cast.toNumber(args.TL), 0, 9);
      const tr = MathUtil.clamp(Cast.toNumber(args.TR), 0, 9);
      const bl = MathUtil.clamp(Cast.toNumber(args.BL), 0, 9);
      const br = MathUtil.clamp(Cast.toNumber(args.BR), 0, 9);
      return this._peripheral.sendPythonCommand(
        `import hub; dist_sensor = hub.port.${port}.device; dist_sensor.mode(5, bytes([${tl}, ${tr}, ${bl}, ${br}]))`,
      );
    }
    getColor(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "color") {
        const colorNames = [
          "black",
          "magenta",
          "purple",
          "blue",
          "azure",
          "turquoise",
          "green",
          "yellow",
          "orange",
          "red",
          "white",
        ];
        return colorNames[portData.color] || "none";
      }
      return "none";
    }
    getReflection(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "color")
        return portData.reflection || 0;
      return 0;
    }
    getAmbientLight(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "color") return portData.ambient || 0;
      return 0;
    }
    getForce(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "force") return portData.force || 0;
      return 0;
    }
    isForceSensorPressed(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "force")
        return portData.pressed || false;
      return false;
    }
    whenColor(args) {
      return this.isColor(args);
    }
    isColor(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const color = Cast.toString(args.COLOR);
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "color") {
        const colorNames = [
          "black",
          "magenta",
          "purple",
          "blue",
          "azure",
          "turquoise",
          "green",
          "yellow",
          "orange",
          "red",
          "white",
        ];
        return colorNames[portData.color] === color;
      }
      return false;
    }
    whenForceSensor(args) {
      const port = Cast.toString(args.PORT).trim().toUpperCase();
      const state = Cast.toString(args.STATE);
      const portData = this._peripheral.portValues[port];
      if (portData && portData.type === "force") {
        switch (state) {
          case "pressed":
            return portData.pressed;
          case "hard pressed":
            return portData.force > 8;
          case "released":
            return !portData.pressed;
        }
      }
      return false;
    }

    // Buttons
    isButtonPressed(args) {
      const button = Cast.toString(args.BUTTON);
      const buttonIndex = { left: 0, center: 1, right: 2 }[button];
      if (buttonIndex !== undefined) {
        return this._peripheral._sensors.buttons[buttonIndex] === 1;
      }
      return false;
    }
    whenButtonPressed(args) {
      return this.isButtonPressed(args);
    }

    // File System (NEW)
    writeLogFile(args) {
      const filename = Cast.toString(args.FILENAME).replace(
        /[^a-zA-Z0-9._-]/g,
        "",
      );
      const text = Cast.toString(args.TEXT).replace(/"/g, '\\"');
      return this._peripheral.sendPythonCommand(
        `with open("${filename}", "a") as f: f.write("${text}\\n")`,
      );
    }

    readLogFile(args) {
      const filename = Cast.toString(args.FILENAME).replace(
        /[^a-zA-Z0-9._-]/g,
        "",
      );
      return this._peripheral.sendReplCommand(
        `print(open("${filename}", "r").read())`,
      );
    }

    deleteLogFile(args) {
      const filename = Cast.toString(args.FILENAME).replace(
        /[^a-zA-Z0-9._-]/g,
        "",
      );
      return this._peripheral.sendPythonCommand(
        `import uos; uos.remove("${filename}")`,
      );
    }

    listFiles() {
      return this._peripheral.sendReplCommand(
        'import uos; print(", ".join(uos.listdir()))',
      );
    }

    // Python REPL
    runReplCommand(args) {
      const code = Cast.toString(args.CODE);
      return this._peripheral.sendReplCommand(code);
    }
    getReplOutput() {
      return this._peripheral.replOutput || "";
    }
    clearReplOutput() {
      this._peripheral._replOutput = "";
    }
    getReplHistory(args) {
      const index = Cast.toNumber(args.INDEX);
      const history = this._peripheral.replHistory;
      if (index === -1) {
        return history[history.length - 1] || "";
      } else if (index >= 0 && index < history.length) {
        return history[index] || "";
      }
      return "";
    }

    // Advanced Python
    runPythonCommand(args) {
      const code = Cast.toString(args.CODE);
      return this._peripheral.sendPythonCommand(code);
    }
    runHubCommand(args) {
      const code = Cast.toString(args.CODE);
      const pythonCode = `import hub; ${code}`;
      return this._peripheral.sendPythonCommand(pythonCode);
    }
    exitScript() {
      return this._peripheral.sendPythonCommand("raise SystemExit");
    }

    // Utility
    _noteToFrequency(note) {
      return Math.pow(2, (note - 69 + 12) / 12) * 440;
    }
    _validatePorts(text) {
      return text
        .toUpperCase()
        .replace(/[^ABCDEF]/g, "")
        .split("")
        .filter((x, i, self) => self.indexOf(x) === i)
        .sort();
    }
  }

  Scratch.extensions.register(new SpikePrimeExtension());
})(Scratch);
