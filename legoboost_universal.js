// Name: LEGO Boost Universal
// ID: CrispStrobe/legoboost_universal
// Description: Universal control for LEGO Boost (BLE/Scratch Link/Bridge).
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // DEBUG LOGGER
  // ============================================================================
  
  class DebugLogger {
    constructor(prefix = "[LEGO Boost]", enabled = true) {
      this.prefix = prefix;
      this.enabled = enabled;
      this.logLevel = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
      };
      this.currentLevel = this.logLevel.DEBUG;
    }

    setLevel(level) {
      this.currentLevel = this.logLevel[level.toUpperCase()] || this.logLevel.DEBUG;
    }

    error(...args) {
      if (this.enabled && this.currentLevel >= this.logLevel.ERROR) {
        console.error(this.prefix, "[ERROR]", ...args);
      }
    }

    warn(...args) {
      if (this.enabled && this.currentLevel >= this.logLevel.WARN) {
        console.warn(this.prefix, "[WARN]", ...args);
      }
    }

    info(...args) {
      if (this.enabled && this.currentLevel >= this.logLevel.INFO) {
        console.info(this.prefix, "[INFO]", ...args);
      }
    }

    debug(...args) {
      if (this.enabled && this.currentLevel >= this.logLevel.DEBUG) {
        console.log(this.prefix, "[DEBUG]", ...args);
      }
    }

    trace(...args) {
      if (this.enabled && this.currentLevel >= this.logLevel.TRACE) {
        console.log(this.prefix, "[TRACE]", ...args);
      }
    }

    group(label) {
      if (this.enabled && this.currentLevel >= this.logLevel.DEBUG) {
        console.group(this.prefix + " " + label);
      }
    }

    groupEnd() {
      if (this.enabled && this.currentLevel >= this.logLevel.DEBUG) {
        console.groupEnd();
      }
    }
  }

  const logger = new DebugLogger();

  // ============================================================================
  // POLYFILLS AND UTILITIES
  // ============================================================================

  const ArgumentType = Scratch.ArgumentType;
  const BlockType = Scratch.BlockType;
  const Cast = Scratch.Cast;

  // Color utility functions
  const colorUtils = {
    hsvToRgb: function ({ h, s, v }) {
      const c = v * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;
      let r, g, b;

      if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
      } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
      } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
      } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
      } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }

      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
      };
    },

    rgbToDecimal: function ({ r, g, b }) {
      return (r << 16) | (g << 8) | b;
    },
  };

  // Math utility functions
  const MathUtil = {
    clamp: function (val, min, max) {
      return Math.max(min, Math.min(val, max));
    },

    scale: function (val, inMin, inMax, outMin, outMax) {
      return ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },

    wrapClamp: function (val, min, max) {
      const range = max - min;
      return ((((val - min) % range) + range) % range) + min;
    },
  };

  // Base64 utility functions
  const Base64Util = {
    uint8ArrayToBase64: function (array) {
      let binary = "";
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
      }
      return btoa(binary);
    },

    base64ToUint8Array: function (base64) {
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return array;
    },
  };

  // Rate limiter
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

  // Integer conversion utilities
  const numberToInt32Array = function (number) {
    const buffer = new ArrayBuffer(4);
    const dataview = new DataView(buffer);
    dataview.setInt32(0, number, true);
    return [
      dataview.getInt8(0),
      dataview.getInt8(1),
      dataview.getInt8(2),
      dataview.getInt8(3),
    ];
  };

  const int32ArrayToNumber = function (array) {
    const i = Uint8Array.from(array);
    const d = new DataView(i.buffer);
    return d.getInt32(0, true);
  };

  const decodeVersion = function (version) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, version, true);

    const major = view.getUint8(3) >> 4;
    const minor = view.getUint8(3) & 0x0f;
    const bugfix = view.getUint8(2);
    const build = view.getUint16(0, true);

    return `${major}.${minor}.${bugfix.toString().padStart(2, "0")}.${build.toString().padStart(4, "0")}`;
  };

  // ============================================================================
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  const iconURI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACpQTFRF////fIel5ufolZ62/2YavsPS+YZOkJmy9/j53+Hk6+zs6N/b6dfO////tDhMHAAAAA50Uk5T/////////////////wBFwNzIAAAA6ElEQVR42uzX2w6DIBAEUGDVtlr//3dLaLwgiwUd2z7MJPJg5EQWiGhGcAxBggQJEiT436CIfqXJPTn3MKNYYMSDFpoAmp24OaYgvwKnFgL2zvVTCwHrMoMi+nUQLFthaNCCa0iwclLkDgYVsQp0mzxuqXgK1MRzoCLWgkPXNN2wI/q6Kvt7u/cX0HtejN8x2sXpnpb8J8D3b0Keuhh3X975M+i0xNVbg3s1TIasgK21bQyGO+s2PykaGMYbge8KrNrssvkOWDXkErB8UuBHETjoYLkKBA8ZfuDkbwVBggQJEiR4MC8BBgDTtMZLx2nFCQAAAABJRU5ErkJggg==";

  // Connection types
  const ConnectionType = {
    BLE: "ble",
    SCRATCH_LINK: "scratchlink",
    BRIDGE: "bridge"
  };

  const BoostBLE = {
    service: "00001623-1212-efde-1623-785feabcd123",
    characteristic: "00001624-1212-efde-1623-785feabcd123",
    sendInterval: 100,
    sendRateMax: 20,
  };

  const BoostMotorMaxPowerAdd = 10;
  const BoostPingInterval = 5000;
  const BoostColorSampleSize = 5;

  const BoostIO = {
    MOTOR_WEDO: 0x01,
    MOTOR_SYSTEM: 0x02,
    BUTTON: 0x05,
    LIGHT: 0x08,
    VOLTAGE: 0x14,
    CURRENT: 0x15,
    PIEZO: 0x16,
    LED: 0x17,
    TILT_EXTERNAL: 0x22,
    MOTION_SENSOR: 0x23,
    COLOR: 0x25,
    MOTOREXT: 0x26,
    MOTORINT: 0x27,
    TILT: 0x28,
    TECHNIC_FORCE_SENSOR: 0x3f,
  };

  const BoostPortFeedback = {
    IN_PROGRESS: 0x01,
    COMPLETED: 0x02,
    DISCARDED: 0x04,
    IDLE: 0x08,
    BUSY_OR_FULL: 0x10,
  };

  const BoostPort10000223OrOlder = {
    A: 55,
    B: 56,
    C: 1,
    D: 2,
  };

  const BoostPort10000224OrNewer = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
  };

  let BoostPort = BoostPort10000224OrNewer;

  const BoostColor = {
    ANY: "any",
    NONE: "none",
    RED: "red",
    BLUE: "blue",
    GREEN: "green",
    YELLOW: "yellow",
    WHITE: "white",
    BLACK: "black",
  };

  const BoostColorIndex = {
    [BoostColor.NONE]: 255,
    [BoostColor.RED]: 9,
    [BoostColor.BLUE]: 3,
    [BoostColor.GREEN]: 5,
    [BoostColor.YELLOW]: 7,
    [BoostColor.WHITE]: 10,
    [BoostColor.BLACK]: 0,
  };

  const BoostMessage = {
    HUB_PROPERTIES: 0x01,
    HUB_ACTIONS: 0x02,
    HUB_ALERTS: 0x03,
    HUB_ATTACHED_IO: 0x04,
    ERROR: 0x05,
    PORT_INPUT_FORMAT_SETUP_SINGLE: 0x41,
    PORT_INPUT_FORMAT_SETUP_COMBINED: 0x42,
    PORT_INFORMATION: 0x43,
    PORT_MODEINFORMATION: 0x44,
    PORT_VALUE: 0x45,
    PORT_VALUE_COMBINED: 0x46,
    PORT_INPUT_FORMAT: 0x47,
    PORT_INPUT_FORMAT_COMBINED: 0x48,
    OUTPUT: 0x81,
    PORT_FEEDBACK: 0x82,
  };

  const BoostHubProperty = {
    ADVERTISEMENT_NAME: 0x01,
    BUTTON: 0x02,
    FW_VERSION: 0x03,
    HW_VERSION: 0x04,
    RSSI: 0x05,
    BATTERY_VOLTAGE: 0x06,
    BATTERY_TYPE: 0x07,
    MANUFACTURER_NAME: 0x08,
    RADIO_FW_VERSION: 0x09,
    LEGO_WP_VERSION: 0x0a,
    SYSTEM_TYPE_ID: 0x0b,
    HW_NETWORK_ID: 0x0c,
    PRIMARY_MAC: 0x0d,
    SECONDARY_MAC: 0x0e,
    HW_NETWORK_FAMILY: 0x0f,
  };

  const BoostHubPropertyOperation = {
    SET: 0x01,
    ENABLE_UPDATES: 0x02,
    DISABLE_UPDATES: 0x03,
    RESET: 0x04,
    REQUEST_UPDATE: 0x05,
    UPDATE: 0x06,
  };

  const BoostHubAction = {
    SWITCH_OFF_HUB: 0x01,
    DISCONNECT: 0x02,
    VCC_PORT_CONTROL_ON: 0x03,
    VCC_PORT_CONTROL_OFF: 0x04,
    ACTIVATE_BUSY_INDICATION: 0x05,
    RESET_BUSY_INDICATION: 0x06,
  };

  const BoostAlert = {
    LOW_VOLTAGE: 0x01,
    HIGH_CURRENT: 0x02,
    LOW_SIGNAL_STRENGTH: 0x03,
    OVER_POWER_CONDITION: 0x04,
  };

  const BoostAlertOperation = {
    ENABLE_UPDATES: 0x01,
    DISABLE_UPDATES: 0x02,
    REQUEST_UPDATES: 0x03,
    UPDATE: 0x04,
  };

  const BoostOutputSubCommand = {
    START_POWER: 0x01,
    START_POWER_PAIR: 0x02,
    SET_ACC_TIME: 0x05,
    SET_DEC_TIME: 0x06,
    START_SPEED: 0x07,
    START_SPEED_PAIR: 0x08,
    START_SPEED_FOR_TIME: 0x09,
    START_SPEED_FOR_TIME_PAIR: 0x0a,
    START_SPEED_FOR_DEGREES: 0x0b,
    START_SPEED_FOR_DEGREES_PAIR: 0x0c,
    GO_TO_ABS_POSITION: 0x0d,
    GO_TO_ABS_POSITION_PAIR: 0x0e,
    PRESET_ENCODER: 0x14,
    WRITE_DIRECT_MODE_DATA: 0x51,
  };

  const BoostOutputExecution = {
    BUFFER_IF_NECESSARY: 0x00,
    EXECUTE_IMMEDIATELY: 0x10,
    NO_ACTION: 0x00,
    COMMAND_FEEDBACK: 0x01,
  };

  const BoostMotorEndState = {
    FLOAT: 0,
    HOLD: 126,
    BRAKE: 127,
  };

  const BoostMotorProfile = {
    DO_NOT_USE: 0x00,
    ACCELERATION: 0x01,
    DECELERATION: 0x02,
  };

  const BoostIOEvent = {
    ATTACHED: 0x01,
    DETACHED: 0x00,
    ATTACHED_VIRTUAL: 0x02,
  };

  const BoostMode = {
    TILT: 0,
    LED: 1,
    COLOR: 0,
    COLOR_DISTANCE: 8,
    DISTANCE: 1,
    REFLECTION: 3,
    AMBIENT: 4,
    MOTOR_SENSOR: 2,
    FORCE: 0,
    TOUCHED: 1,
    UNKNOWN: 0,
  };

  const BoostMotorState = {
    OFF: 0,
    ON_FOREVER: 1,
    ON_FOR_TIME: 2,
    ON_FOR_ROTATION: 3,
  };

  const BoostMotorLabel = {
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    AB: "AB",
    ALL: "ALL",
  };

  const BoostMotorDirection = {
    FORWARD: "forward",
    BACKWARD: "backward",
    REVERSE: "reverse",
  };

  const BoostTiltDirection = {
    ANY: "any",
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
  };

  const BoostOperator = {
    LESS: "<",
    GREATER: ">",
    EQUAL: "=",
  };

  // ============================================================================
  // MOTOR CLASS
  // ============================================================================

  class BoostMotor {
    constructor(parent, index) {
      this._parent = parent;
      this._index = index;
      this._direction = 1;
      this._power = 50;
      this._position = 0;
      this._status = BoostMotorState.OFF;
      this._pendingDurationTimeoutId = null;
      this._pendingDurationTimeoutStartTime = null;
      this._pendingDurationTimeoutDelay = null;
      this._stopMode = BoostMotorEndState.BRAKE;
      this._accelerationTime = 0;
      this._decelerationTime = 0;
      logger.debug(`Motor ${index} initialized`);
    }

    get direction() {
      return this._direction;
    }

    set direction(value) {
      logger.debug(`Motor ${this._index} direction set to ${value}`);
      this._direction = value;
    }

    get power() {
      return this._power;
    }

    set power(value) {
      logger.debug(`Motor ${this._index} power set to ${value}`);
      this._power = value;
    }

    get position() {
      return this._position;
    }

    set position(value) {
      this._position = value;
    }

    get status() {
      return this._status;
    }

    set status(value) {
      logger.debug(`Motor ${this._index} status changed to ${value}`);
      this._status = value;
    }

    get stopMode() {
      return this._stopMode;
    }

    set stopMode(value) {
      logger.debug(`Motor ${this._index} stop mode set to ${value}`);
      this._stopMode = value;
    }

    get pendingDurationTimeoutId() {
      return this._pendingDurationTimeoutId;
    }

    get pendingDurationTimeoutStartTime() {
      return this._pendingDurationTimeoutStartTime;
    }

    get pendingDurationTimeoutDelay() {
      return this._pendingDurationTimeoutDelay;
    }

    turnOnForever() {
      logger.debug(`Motor ${this._index} turn on forever at power ${this._power}`);
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
        this._pendingDurationTimeoutId = null;
        this._pendingDurationTimeoutStartTime = null;
        this._pendingDurationTimeoutDelay = null;
      }

      this._status = BoostMotorState.ON_FOREVER;
      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY +
          BoostOutputExecution.COMMAND_FEEDBACK,
        BoostOutputSubCommand.START_SPEED,
        [MathUtil.clamp(this._power * this._direction, -100, 100), BoostMotorMaxPowerAdd, BoostMotorProfile.DO_NOT_USE]
      );

      this._parent.send(BoostBLE.characteristic, cmd);
    }

    turnOnFor(time) {
      logger.debug(`Motor ${this._index} turn on for ${time}ms at power ${this._power}`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
      }

      this._status = BoostMotorState.ON_FOR_TIME;
      this._pendingDurationTimeoutDelay = time;
      this._pendingDurationTimeoutStartTime = Date.now();

      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY +
          BoostOutputExecution.COMMAND_FEEDBACK,
        BoostOutputSubCommand.START_SPEED_FOR_TIME,
        [
          MathUtil.clamp(time, 0, 6553500) & 0xff,
          (MathUtil.clamp(time, 0, 6553500) >> 8) & 0xff,
          MathUtil.clamp(this._power * this._direction, -100, 100),
          BoostMotorMaxPowerAdd,
          this._stopMode,
          BoostMotorProfile.DO_NOT_USE,
        ]
      );

      this._parent.send(BoostBLE.characteristic, cmd);

      this._pendingDurationTimeoutId = setTimeout(() => {
        logger.debug(`Motor ${this._index} time duration completed`);
        this._status = BoostMotorState.OFF;
      }, time);
    }

    turnOnForDegrees(degrees) {
      logger.debug(`Motor ${this._index} turn on for ${degrees}° at power ${this._power}`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
      }

      this._status = BoostMotorState.ON_FOR_ROTATION;
      
      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY +
          BoostOutputExecution.COMMAND_FEEDBACK,
        BoostOutputSubCommand.START_SPEED_FOR_DEGREES,
        numberToInt32Array(degrees).concat([
          MathUtil.clamp(this._power * this._direction, -100, 100),
          BoostMotorMaxPowerAdd,
          this._stopMode,
          BoostMotorProfile.DO_NOT_USE,
        ])
      );

      this._parent.send(BoostBLE.characteristic, cmd);
    }

    turnOff() {
      logger.debug(`Motor ${this._index} turn off`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
        this._pendingDurationTimeoutId = null;
        this._pendingDurationTimeoutStartTime = null;
        this._pendingDurationTimeoutDelay = null;
      }

      this._status = BoostMotorState.OFF;

      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY +
          BoostOutputExecution.COMMAND_FEEDBACK,
        BoostOutputSubCommand.START_SPEED,
        [0, BoostMotorMaxPowerAdd, BoostMotorProfile.DO_NOT_USE]
      );

      this._parent.send(BoostBLE.characteristic, cmd);
    }

    setAcceleration(time) {
      logger.debug(`Motor ${this._index} set acceleration time to ${time}ms`);
      this._accelerationTime = time;
      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY,
        BoostOutputSubCommand.SET_ACC_TIME,
        [
          MathUtil.clamp(time, 0, 10000) & 0xff,
          (MathUtil.clamp(time, 0, 10000) >> 8) & 0xff,
          BoostMotorProfile.ACCELERATION,
        ]
      );
      this._parent.send(BoostBLE.characteristic, cmd);
    }

    setDeceleration(time) {
      logger.debug(`Motor ${this._index} set deceleration time to ${time}ms`);
      this._decelerationTime = time;
      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY,
        BoostOutputSubCommand.SET_DEC_TIME,
        [
          MathUtil.clamp(time, 0, 10000) & 0xff,
          (MathUtil.clamp(time, 0, 10000) >> 8) & 0xff,
          BoostMotorProfile.DECELERATION,
        ]
      );
      this._parent.send(BoostBLE.characteristic, cmd);
    }

    resetPosition(position = 0) {
      logger.debug(`Motor ${this._index} reset position to ${position}`);
      const cmd = this._parent.generateOutputCommand(
        this._index,
        BoostOutputExecution.EXECUTE_IMMEDIATELY,
        BoostOutputSubCommand.PRESET_ENCODER,
        numberToInt32Array(position)
      );
      this._parent.send(BoostBLE.characteristic, cmd);
      this._position = position;
    }
  }

  // ============================================================================
  // CONNECTION ADAPTERS
  // ============================================================================

  // Base Connection Adapter
  class ConnectionAdapter {
    constructor() {
      this._connected = false;
      this._onMessageCallback = null;
    }

    async connect() {
      throw new Error("connect() must be implemented by subclass");
    }

    async disconnect() {
      throw new Error("disconnect() must be implemented by subclass");
    }

    async send(characteristic, data) {
      throw new Error("send() must be implemented by subclass");
    }

    isConnected() {
      return this._connected;
    }

    onMessage(callback) {
      this._onMessageCallback = callback;
    }
  }

  // BLE Direct Connection Adapter
  class BLEAdapter extends ConnectionAdapter {
    constructor() {
      super();
      this._device = null;
      this._server = null;
      this._service = null;
      this._characteristic = null;
      logger.info("BLE Adapter initialized");
    }

    async connect() {
      logger.group("BLE Connection");
      try {
        logger.info("Requesting Bluetooth device...");
        
        this._device = await navigator.bluetooth.requestDevice({
          filters: [
            {
              services: [BoostBLE.service],
            },
          ],
        });

        logger.info(`Device selected: ${this._device.name || "Unknown"}`);

        this._device.addEventListener("gattserverdisconnected", () => {
          logger.warn("Device disconnected");
          this._connected = false;
        });

        logger.info("Connecting to GATT server...");
        this._server = await this._device.gatt.connect();
        
        logger.info("Getting primary service...");
        this._service = await this._server.getPrimaryService(BoostBLE.service);
        
        logger.info("Getting characteristic...");
        this._characteristic = await this._service.getCharacteristic(
          BoostBLE.characteristic
        );

        logger.info("Starting notifications...");
        await this._characteristic.startNotifications();
        
        this._characteristic.addEventListener(
          "characteristicvaluechanged",
          (event) => {
            const data = new Uint8Array(event.target.value.buffer);
            logger.trace("BLE data received:", Array.from(data));
            if (this._onMessageCallback) {
              this._onMessageCallback(data);
            }
          }
        );

        this._connected = true;
        logger.info("✓ BLE connection established");
        return true;
      } catch (error) {
        logger.error("BLE connection failed:", error);
        this._connected = false;
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.info("Disconnecting BLE...");
      if (this._device && this._device.gatt.connected) {
        await this._device.gatt.disconnect();
      }
      this._connected = false;
      this._device = null;
      this._server = null;
      this._service = null;
      this._characteristic = null;
      logger.info("✓ BLE disconnected");
    }

    async send(characteristic, data) {
      if (!this._connected || !this._characteristic) {
        logger.error("Cannot send: not connected");
        throw new Error("Not connected");
      }
      
      logger.trace("Sending BLE data:", Array.from(data));
      await this._characteristic.writeValue(data);
    }
  }

  // Scratch Link Connection Adapter
  class ScratchLinkAdapter extends ConnectionAdapter {
    constructor() {
      super();
      this._ws = null;
      this._requestId = 0;
      this._requests = new Map();
      logger.info("Scratch Link Adapter initialized");
    }

    async connect() {
      logger.group("Scratch Link Connection");
      try {
        logger.info("Connecting to Scratch Link WebSocket...");
        
        return new Promise((resolve, reject) => {
          this._ws = new WebSocket("wss://device-manager.scratch.mit.edu:20110/scratch/ble");

          this._ws.onopen = () => {
            logger.info("✓ WebSocket connected");
            this._sendRequest("discover", {
              filters: [
                {
                  services: [BoostBLE.service],
                },
              ],
            })
              .then((device) => {
                logger.info(`Device discovered: ${device.name || "Unknown"}`);
                return this._sendRequest("connect", { peripheralId: device.peripheralId });
              })
              .then(() => {
                logger.info("✓ Connected to device");
                return this._sendRequest("startNotifications", {
                  serviceId: BoostBLE.service,
                  characteristicId: BoostBLE.characteristic,
                });
              })
              .then(() => {
                logger.info("✓ Notifications started");
                this._connected = true;
                resolve(true);
              })
              .catch(reject);
          };

          this._ws.onerror = (error) => {
            logger.error("WebSocket error:", error);
            reject(error);
          };

          this._ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            logger.trace("Scratch Link message:", message);

            if (message.jsonrpc === "2.0") {
              if (message.method === "characteristicDidChange") {
                const data = Base64Util.base64ToUint8Array(message.params.message);
                logger.trace("Data received:", Array.from(data));
                if (this._onMessageCallback) {
                  this._onMessageCallback(data);
                }
              } else if (message.id !== undefined) {
                const request = this._requests.get(message.id);
                if (request) {
                  this._requests.delete(message.id);
                  if (message.error) {
                    request.reject(new Error(message.error.message));
                  } else {
                    request.resolve(message.result);
                  }
                }
              }
            }
          };

          this._ws.onclose = () => {
            logger.warn("WebSocket closed");
            this._connected = false;
          };
        });
      } catch (error) {
        logger.error("Scratch Link connection failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.info("Disconnecting Scratch Link...");
      if (this._ws) {
        this._ws.close();
        this._ws = null;
      }
      this._connected = false;
      this._requests.clear();
      logger.info("✓ Scratch Link disconnected");
    }

    async send(characteristic, data) {
      if (!this._connected) {
        logger.error("Cannot send: not connected");
        throw new Error("Not connected");
      }

      logger.trace("Sending data via Scratch Link:", Array.from(data));
      
      await this._sendRequest("write", {
        serviceId: BoostBLE.service,
        characteristicId: characteristic,
        message: Base64Util.uint8ArrayToBase64(data),
        encoding: "base64",
      });
    }

    _sendRequest(method, params) {
      return new Promise((resolve, reject) => {
        const id = ++this._requestId;
        this._requests.set(id, { resolve, reject });

        const request = {
          jsonrpc: "2.0",
          id: id,
          method: method,
          params: params,
        };

        logger.trace("Sending request:", request);
        this._ws.send(JSON.stringify(request));
      });
    }
  }

  // Bridge Connection Adapter
  class BridgeAdapter extends ConnectionAdapter {
    constructor(bridgeUrl = "http://localhost:8080") {
      super();
      this._bridgeUrl = bridgeUrl;
      this._pollingInterval = null;
      this._deviceId = null;
      logger.info(`Bridge Adapter initialized with URL: ${bridgeUrl}`);
    }

    async connect() {
      logger.group("Bridge Connection");
      try {
        logger.info("Scanning for devices via bridge...");
        
        const scanResponse = await fetch(`${this._bridgeUrl}/scan`, {
          method: "POST",
        });
        
        if (!scanResponse.ok) {
          throw new Error(`Scan failed: ${scanResponse.statusText}`);
        }

        const devices = await scanResponse.json();
        logger.info(`Found ${devices.length} devices`);
        
        if (devices.length === 0) {
          throw new Error("No LEGO Boost devices found");
        }

        this._deviceId = devices[0].id;
        logger.info(`Connecting to device: ${this._deviceId}`);

        const connectResponse = await fetch(`${this._bridgeUrl}/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: this._deviceId }),
        });

        if (!connectResponse.ok) {
          throw new Error(`Connection failed: ${connectResponse.statusText}`);
        }

        logger.info("✓ Connected to device");

        // Start polling for notifications
        this._startPolling();
        this._connected = true;
        
        logger.info("✓ Bridge connection established");
        return true;
      } catch (error) {
        logger.error("Bridge connection failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.info("Disconnecting bridge...");
      
      if (this._pollingInterval) {
        clearInterval(this._pollingInterval);
        this._pollingInterval = null;
      }

      if (this._deviceId) {
        try {
          await fetch(`${this._bridgeUrl}/disconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: this._deviceId }),
          });
        } catch (error) {
          logger.warn("Disconnect request failed:", error);
        }
      }

      this._connected = false;
      this._deviceId = null;
      logger.info("✓ Bridge disconnected");
    }

    async send(characteristic, data) {
      if (!this._connected) {
        logger.error("Cannot send: not connected");
        throw new Error("Not connected");
      }

      logger.trace("Sending data via bridge:", Array.from(data));

      const response = await fetch(`${this._bridgeUrl}/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: this._deviceId,
          characteristic: characteristic,
          data: Array.from(data),
        }),
      });

      if (!response.ok) {
        throw new Error(`Write failed: ${response.statusText}`);
      }
    }

    _startPolling() {
      logger.info("Starting notification polling...");
      
      this._pollingInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `${this._bridgeUrl}/notifications?deviceId=${this._deviceId}`
          );
          
          if (response.ok) {
            const notifications = await response.json();
            for (const notification of notifications) {
              const data = new Uint8Array(notification.data);
              logger.trace("Bridge notification received:", Array.from(data));
              if (this._onMessageCallback) {
                this._onMessageCallback(data);
              }
            }
          }
        } catch (error) {
          logger.warn("Polling error:", error);
        }
      }, 100);
    }
  }

  // ============================================================================
  // BOOST PERIPHERAL
  // ============================================================================

  class BoostPeripheral {
    constructor(connectionType, bridgeUrl) {
      logger.info(`Initializing Boost Peripheral with connection type: ${connectionType}`);
      
      // Create appropriate connection adapter
      switch (connectionType) {
        case ConnectionType.BLE:
          this._connection = new BLEAdapter();
          break;
        case ConnectionType.SCRATCH_LINK:
          this._connection = new ScratchLinkAdapter();
          break;
        case ConnectionType.BRIDGE:
          this._connection = new BridgeAdapter(bridgeUrl);
          break;
        default:
          throw new Error(`Invalid connection type: ${connectionType}`);
      }

      this._connectionType = connectionType;
      this._motors = {};
      this._ports = {};
      this._portModes = {};
      this._sensors = {};
      this._rateLimiter = new RateLimiter(BoostBLE.sendRateMax);
      this._pingIntervalId = null;

      // Hub status
      this.hubStatus = {
        buttonPressed: false,
        batteryLevel: 100,
        fwVersion: "0.0.00.0000",
        rssi: 0,
        lowVoltage: false,
        highCurrent: false,
        overPower: false,
      };

      // Sensor data
      this.tiltX = 0;
      this.tiltY = 0;
      this.color = BoostColor.NONE;
      this.previousColor = BoostColor.NONE;

      // Set up message handler
      this._connection.onMessage((data) => this._onMessage(data));

      logger.info("Boost Peripheral initialized");
    }

    async connect() {
      logger.info("Connecting Boost Peripheral...");
      await this._connection.connect();
      await this._initialize();
      logger.info("✓ Boost Peripheral connected and initialized");
    }

    async _initialize() {
      logger.group("Initializing Boost Hub");
      try {
        // Request hub properties
        logger.info("Requesting hub firmware version...");
        this._requestHubPropertyValue(BoostHubProperty.FW_VERSION);
        await this._delay(100);

        logger.info("Requesting battery level...");
        this._requestHubPropertyValue(BoostHubProperty.BATTERY_VOLTAGE);
        await this._delay(100);

        logger.info("Requesting RSSI...");
        this._requestHubPropertyValue(BoostHubProperty.RSSI);
        await this._delay(100);

        // Enable button updates
        logger.info("Enabling button updates...");
        this._enableHubPropertyReports(BoostHubProperty.BUTTON);
        await this._delay(100);

        // Enable battery updates
        logger.info("Enabling battery updates...");
        this._enableHubPropertyReports(BoostHubProperty.BATTERY_VOLTAGE);
        await this._delay(100);

        // Enable RSSI updates
        logger.info("Enabling RSSI updates...");
        this._enableHubPropertyReports(BoostHubProperty.RSSI);
        await this._delay(100);

        // Enable alert updates
        logger.info("Enabling alert updates...");
        this._enableAlertReports(BoostAlert.LOW_VOLTAGE);
        await this._delay(50);
        this._enableAlertReports(BoostAlert.HIGH_CURRENT);
        await this._delay(50);
        this._enableAlertReports(BoostAlert.OVER_POWER_CONDITION);
        await this._delay(50);

        // Start ping interval
        logger.info("Starting ping interval...");
        this._startPing();

        logger.info("✓ Hub initialization complete");
      } catch (error) {
        logger.error("Hub initialization failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.info("Disconnecting Boost Peripheral...");
      
      if (this._pingIntervalId) {
        clearInterval(this._pingIntervalId);
        this._pingIntervalId = null;
      }

      await this._connection.disconnect();
      
      this._motors = {};
      this._ports = {};
      this._portModes = {};
      this._sensors = {};
      
      logger.info("✓ Boost Peripheral disconnected");
    }

    isConnected() {
      return this._connection.isConnected();
    }

    motor(portId) {
      return this._motors[portId];
    }

    getColor(portId) {
      return this._sensors[portId]?.color || BoostColor.NONE;
    }

    getDistance(portId) {
      return this._sensors[portId]?.distance || 0;
    }

    getReflection(portId) {
      return this._sensors[portId]?.reflection || 0;
    }

    getForce(portId) {
      return this._sensors[portId]?.force || 0;
    }

    isForcePressed(portId) {
      return this._sensors[portId]?.touched || false;
    }

    async _setInputMode(portId, mode) {
      if (this._portModes[portId] === mode) {
        return;
      }

      logger.debug(`Setting port ${portId} to mode ${mode}`);
      
      const cmd = [
        0x0a,
        0x00,
        BoostMessage.PORT_INPUT_FORMAT_SETUP_SINGLE,
        portId,
        mode,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
      ];

      await this.send(BoostBLE.characteristic, new Uint8Array(cmd));
      this._portModes[portId] = mode;
      await this._delay(100);
    }

    send(characteristic, data) {
      if (!this._rateLimiter.okayToSend()) {
        logger.trace("Rate limiter: message queued");
      }
      
      return this._connection.send(characteristic, data);
    }

    generateOutputCommand(portID, execution, subCommand, payload) {
      const cmd = [
        0x00,
        0x00,
        BoostMessage.OUTPUT,
        portID,
        execution,
        subCommand,
      ].concat(payload);
      cmd[0] = cmd.length;
      
      logger.trace(`Generated output command for port ${portID}:`, cmd);
      return new Uint8Array(cmd);
    }

    setLED(rgbDecimal) {
      logger.debug(`Setting LED to color: ${rgbDecimal.toString(16)}`);
      
      const cmd = this.generateOutputCommand(
        BoostPort.LED || 0x32,
        BoostOutputExecution.EXECUTE_IMMEDIATELY,
        BoostOutputSubCommand.WRITE_DIRECT_MODE_DATA,
        [0x00, rgbDecimal >> 16, (rgbDecimal >> 8) & 0xff, rgbDecimal & 0xff]
      );
      
      this.send(BoostBLE.characteristic, cmd);
    }

    shutdown() {
      logger.info("Shutting down hub...");
      
      const cmd = [
        0x04,
        0x00,
        BoostMessage.HUB_ACTIONS,
        BoostHubAction.SWITCH_OFF_HUB,
      ];
      
      this.send(BoostBLE.characteristic, new Uint8Array(cmd));
    }

    _requestHubPropertyValue(property) {
      logger.debug(`Requesting hub property: ${property}`);
      
      const cmd = [
        0x05,
        0x00,
        BoostMessage.HUB_PROPERTIES,
        property,
        BoostHubPropertyOperation.REQUEST_UPDATE,
      ];
      
      this.send(BoostBLE.characteristic, new Uint8Array(cmd));
    }

    _enableHubPropertyReports(property) {
      logger.debug(`Enabling reports for hub property: ${property}`);
      
      const cmd = [
        0x05,
        0x00,
        BoostMessage.HUB_PROPERTIES,
        property,
        BoostHubPropertyOperation.ENABLE_UPDATES,
      ];
      
      this.send(BoostBLE.characteristic, new Uint8Array(cmd));
    }

    _enableAlertReports(alert) {
      logger.debug(`Enabling reports for alert: ${alert}`);
      
      const cmd = [
        0x05,
        0x00,
        BoostMessage.HUB_ALERTS,
        alert,
        BoostAlertOperation.ENABLE_UPDATES,
      ];
      
      this.send(BoostBLE.characteristic, new Uint8Array(cmd));
    }

    _startPing() {
      this._pingIntervalId = setInterval(() => {
        this._requestHubPropertyValue(BoostHubProperty.RSSI);
      }, BoostPingInterval);
      
      logger.debug("Ping interval started");
    }

    _onMessage(data) {
      logger.trace("Processing message:", Array.from(data));
      
      const messageType = data[2];

      switch (messageType) {
        case BoostMessage.HUB_ATTACHED_IO:
          this._handleDeviceAttached(data);
          break;
        case BoostMessage.HUB_PROPERTIES:
          this._handleHubProperties(data);
          break;
        case BoostMessage.HUB_ALERTS:
          this._handleHubAlerts(data);
          break;
        case BoostMessage.PORT_VALUE:
          this._handlePortValue(data);
          break;
        case BoostMessage.PORT_FEEDBACK:
          this._handlePortFeedback(data);
          break;
        case BoostMessage.ERROR:
          logger.error("Hub error message:", Array.from(data));
          break;
        default:
          logger.trace(`Unhandled message type: ${messageType}`);
      }
    }

    _handleDeviceAttached(data) {
      const portId = data[3];
      const event = data[4];
      const deviceType = data[5];

      logger.group(`Device event on port ${portId}`);
      logger.debug(`Event: ${event}, Device type: ${deviceType}`);

      if (event === BoostIOEvent.ATTACHED) {
        this._ports[portId] = deviceType;

        switch (deviceType) {
          case BoostIO.MOTORINT:
          case BoostIO.MOTOREXT:
          case BoostIO.MOTOR_WEDO:
          case BoostIO.MOTOR_SYSTEM:
            logger.info(`Motor attached on port ${portId}`);
            this._motors[portId] = new BoostMotor(this, portId);
            // Enable position updates
            this._setInputMode(portId, BoostMode.MOTOR_SENSOR);
            break;
          case BoostIO.TILT:
            logger.info(`Tilt sensor attached on port ${portId}`);
            this._setInputMode(portId, BoostMode.TILT);
            break;
          case BoostIO.COLOR:
          case BoostIO.MOTION_SENSOR:
            logger.info(`Color/motion sensor attached on port ${portId}`);
            this._sensors[portId] = {};
            this._setInputMode(portId, BoostMode.COLOR);
            break;
          case BoostIO.TECHNIC_FORCE_SENSOR:
            logger.info(`Force sensor attached on port ${portId}`);
            this._sensors[portId] = {};
            this._setInputMode(portId, BoostMode.FORCE);
            break;
          default:
            logger.debug(`Unknown device type: ${deviceType}`);
        }
      } else if (event === BoostIOEvent.DETACHED) {
        logger.info(`Device detached from port ${portId}`);
        delete this._motors[portId];
        delete this._ports[portId];
        delete this._portModes[portId];
        delete this._sensors[portId];
      }

      logger.groupEnd();
    }

    _handleHubProperties(data) {
      const property = data[3];
      const operation = data[4];

      if (operation !== BoostHubPropertyOperation.UPDATE) {
        return;
      }

      switch (property) {
        case BoostHubProperty.BUTTON:
          this.hubStatus.buttonPressed = data[5] === 1;
          logger.debug(`Button pressed: ${this.hubStatus.buttonPressed}`);
          break;
        case BoostHubProperty.BATTERY_VOLTAGE:
          this.hubStatus.batteryLevel = data[5];
          logger.debug(`Battery level: ${this.hubStatus.batteryLevel}%`);
          break;
        case BoostHubProperty.RSSI:
          this.hubStatus.rssi = -(256 - data[5]);
          logger.trace(`RSSI: ${this.hubStatus.rssi} dBm`);
          break;
        case BoostHubProperty.FW_VERSION:
          const version = int32ArrayToNumber([data[5], data[6], data[7], data[8]]);
          this.hubStatus.fwVersion = decodeVersion(version);
          logger.info(`Firmware version: ${this.hubStatus.fwVersion}`);
          
          // Detect firmware version and adjust ports
          const versionNum = parseInt(this.hubStatus.fwVersion.split(".")[2]);
          if (versionNum <= 23) {
            BoostPort = BoostPort10000223OrOlder;
            logger.info("Using port mapping for firmware <= 1.0.00.0223");
          } else {
            BoostPort = BoostPort10000224OrNewer;
            logger.info("Using port mapping for firmware >= 1.0.00.0224");
          }
          break;
      }
    }

    _handleHubAlerts(data) {
      const alert = data[3];
      const operation = data[4];

      if (operation !== BoostAlertOperation.UPDATE) {
        return;
      }

      switch (alert) {
        case BoostAlert.LOW_VOLTAGE:
          this.hubStatus.lowVoltage = data[5] === 0xff;
          logger.warn(`Low voltage alert: ${this.hubStatus.lowVoltage}`);
          break;
        case BoostAlert.HIGH_CURRENT:
          this.hubStatus.highCurrent = data[5] === 0xff;
          logger.warn(`High current alert: ${this.hubStatus.highCurrent}`);
          break;
        case BoostAlert.OVER_POWER_CONDITION:
          this.hubStatus.overPower = data[5] === 0xff;
          logger.warn(`Over power alert: ${this.hubStatus.overPower}`);
          break;
      }
    }

    _handlePortValue(data) {
      const portId = data[3];
      const deviceType = this._ports[portId];

      if (!deviceType) {
        return;
      }

      switch (deviceType) {
        case BoostIO.TILT:
          this.tiltX = data[4] > 127 ? data[4] - 256 : data[4];
          this.tiltY = data[5] > 127 ? data[5] - 256 : data[5];
          logger.trace(`Tilt: X=${this.tiltX}, Y=${this.tiltY}`);
          break;

        case BoostIO.COLOR:
        case BoostIO.MOTION_SENSOR:
          const mode = this._portModes[portId];
          
          if (!this._sensors[portId]) {
            this._sensors[portId] = {};
          }

          switch (mode) {
            case BoostMode.COLOR:
              const colorValue = data[4];
              const newColor = Object.keys(BoostColorIndex).find(
                (key) => BoostColorIndex[key] === colorValue
              ) || BoostColor.NONE;
              
              if (newColor !== this.color) {
                this.previousColor = this.color;
                this.color = newColor;
                logger.debug(`Color changed: ${this.previousColor} → ${this.color}`);
              }
              
              this._sensors[portId].color = this.color;
              break;

            case BoostMode.DISTANCE:
              const distance = data[4] > 255 ? 255 : data[4];
              this._sensors[portId].distance = distance;
              logger.trace(`Distance: ${distance}`);
              break;

            case BoostMode.REFLECTION:
              const reflection = data[4] > 100 ? 100 : data[4];
              this._sensors[portId].reflection = reflection;
              logger.trace(`Reflection: ${reflection}`);
              break;
          }
          break;

        case BoostIO.MOTORINT:
        case BoostIO.MOTOREXT:
        case BoostIO.MOTOR_WEDO:
        case BoostIO.MOTOR_SYSTEM:
          const motor = this._motors[portId];
          if (motor) {
            const position = int32ArrayToNumber([data[4], data[5], data[6], data[7]]);
            motor.position = position;
            logger.trace(`Motor ${portId} position: ${position}`);
          }
          break;

        case BoostIO.TECHNIC_FORCE_SENSOR:
          const mode2 = this._portModes[portId];
          
          if (!this._sensors[portId]) {
            this._sensors[portId] = {};
          }

          switch (mode2) {
            case BoostMode.FORCE:
              const force = Math.round(data[4] * 10) / 10;
              this._sensors[portId].force = force;
              logger.trace(`Force: ${force}N`);
              break;

            case BoostMode.TOUCHED:
              const touched = data[4] === 1;
              this._sensors[portId].touched = touched;
              logger.trace(`Touched: ${touched}`);
              break;
          }
          break;
      }
    }

    _handlePortFeedback(data) {
      const portId = data[3];
      const feedback = data[4];
      
      logger.trace(`Port ${portId} feedback: ${feedback}`);

      switch (feedback) {
        case BoostPortFeedback.COMPLETED:
          logger.debug(`Port ${portId} command completed`);
          break;
        case BoostPortFeedback.DISCARDED:
          logger.warn(`Port ${portId} command discarded`);
          break;
        case BoostPortFeedback.BUSY_OR_FULL:
          logger.warn(`Port ${portId} is busy or buffer full`);
          break;
      }
    }

    _delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  // ============================================================================
  // EXTENSION CLASS
  // ============================================================================

  class LEGOBoostExtension {
    constructor() {
      logger.info("=".repeat(60));
      logger.info("LEGO Boost Unified Extension");
      logger.info("=".repeat(60));
      
      this._peripheral = null;
      this._connectionType = ConnectionType.BLE;
      this._bridgeUrl = "http://localhost:8080";
      
      logger.info("Extension initialized");
    }

    getInfo() {
      return {
        id: "legoboostunified",
        name: "LEGO Boost (Unified)",
        color1: "#FF6D01",
        color2: "#F05A24",
        color3: "#E0491D",
        blockIconURI: iconURI,
        blocks: [
          // Connection blocks
          {
            opcode: "setConnectionType",
            blockType: BlockType.COMMAND,
            text: "set connection to [TYPE]",
            arguments: {
              TYPE: {
                type: ArgumentType.STRING,
                menu: "connectionType",
                defaultValue: ConnectionType.BLE,
              },
            },
          },
          {
            opcode: "setBridgeURL",
            blockType: BlockType.COMMAND,
            text: "set bridge URL to [URL]",
            arguments: {
              URL: {
                type: ArgumentType.STRING,
                defaultValue: "http://localhost:8080",
              },
            },
          },
          {
            opcode: "connect",
            blockType: BlockType.COMMAND,
            text: "connect to LEGO Boost",
          },
          {
            opcode: "disconnect",
            blockType: BlockType.COMMAND,
            text: "disconnect from LEGO Boost",
          },
          {
            opcode: "isConnected",
            blockType: BlockType.BOOLEAN,
            text: "connected?",
          },

          "---",

          // Debug blocks
          {
            opcode: "setDebugLevel",
            blockType: BlockType.COMMAND,
            text: "set debug level to [LEVEL]",
            arguments: {
              LEVEL: {
                type: ArgumentType.STRING,
                menu: "debugLevel",
                defaultValue: "DEBUG",
              },
            },
          },
          {
            opcode: "enableDebug",
            blockType: BlockType.COMMAND,
            text: "enable debug [ENABLED]",
            arguments: {
              ENABLED: {
                type: ArgumentType.STRING,
                menu: "onOff",
                defaultValue: "on",
              },
            },
          },

          "---",

          // Motor control blocks
          {
            opcode: "motorOn",
            blockType: BlockType.COMMAND,
            text: "turn motor [MOTOR_ID] on",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
            },
          },
          {
            opcode: "motorOff",
            blockType: BlockType.COMMAND,
            text: "turn motor [MOTOR_ID] off",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
            },
          },
          {
            opcode: "motorOnFor",
            blockType: BlockType.COMMAND,
            text: "turn motor [MOTOR_ID] on for [TIME] seconds",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              TIME: {
                type: ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
          },
          {
            opcode: "motorOnForDegrees",
            blockType: BlockType.COMMAND,
            text: "turn motor [MOTOR_ID] on for [DEGREES] degrees",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              DEGREES: {
                type: ArgumentType.NUMBER,
                defaultValue: 360,
              },
            },
          },

          "---",

          // Motor settings blocks
          {
            opcode: "setMotorPower",
            blockType: BlockType.COMMAND,
            text: "set motor [MOTOR_ID] power to [POWER]%",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              POWER: {
                type: ArgumentType.NUMBER,
                defaultValue: 50,
              },
            },
          },
          {
            opcode: "setMotorDirection",
            blockType: BlockType.COMMAND,
            text: "set motor [MOTOR_ID] direction to [MOTOR_DIRECTION]",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              MOTOR_DIRECTION: {
                type: ArgumentType.STRING,
                menu: "motorDirection",
                defaultValue: BoostMotorDirection.FORWARD,
              },
            },
          },
          {
            opcode: "setMotorStopAction",
            blockType: BlockType.COMMAND,
            text: "set motor [MOTOR_ID] stop action to [ACTION]",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              ACTION: {
                type: ArgumentType.STRING,
                menu: "stopAction",
                defaultValue: "brake",
              },
            },
          },
          {
            opcode: "setMotorAcceleration",
            blockType: BlockType.COMMAND,
            text: "set motor [MOTOR_ID] acceleration to [TIME] ms",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              TIME: {
                type: ArgumentType.NUMBER,
                defaultValue: 1000,
              },
            },
          },
          {
            opcode: "setMotorDeceleration",
            blockType: BlockType.COMMAND,
            text: "set motor [MOTOR_ID] deceleration to [TIME] ms",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              TIME: {
                type: ArgumentType.NUMBER,
                defaultValue: 1000,
              },
            },
          },
          {
            opcode: "resetMotorPosition",
            blockType: BlockType.COMMAND,
            text: "reset motor [MOTOR_ID] position to [POSITION]",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorId",
                defaultValue: BoostMotorLabel.A,
              },
              POSITION: {
                type: ArgumentType.NUMBER,
                defaultValue: 0,
              },
            },
          },

          "---",

          // Motor reporter blocks
          {
            opcode: "getMotorPosition",
            blockType: BlockType.REPORTER,
            text: "motor [MOTOR_ID] position",
            arguments: {
              MOTOR_ID: {
                type: ArgumentType.STRING,
                menu: "motorReporterId",
                defaultValue: BoostMotorLabel.A,
              },
            },
          },

          "---",

          // Color sensor blocks
          {
            opcode: "whenColor",
            blockType: BlockType.HAT,
            text: "when color sensor [PORT] sees [COLOR]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: BoostColor.ANY,
              },
            },
          },
          {
            opcode: "seeingColor",
            blockType: BlockType.BOOLEAN,
            text: "color sensor [PORT] seeing [COLOR]?",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: BoostColor.RED,
              },
            },
          },

          "---",

          // Distance sensor blocks
          {
            opcode: "getDistance",
            blockType: BlockType.REPORTER,
            text: "distance sensor [PORT] distance",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
            },
          },
          {
            opcode: "getReflection",
            blockType: BlockType.REPORTER,
            text: "color sensor [PORT] reflection",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
            },
          },

          "---",

          // Force sensor blocks
          {
            opcode: "getForce",
            blockType: BlockType.REPORTER,
            text: "force sensor [PORT] force",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
            },
          },
          {
            opcode: "whenForceSensorPressed",
            blockType: BlockType.HAT,
            text: "when force sensor [PORT] pressed",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
            },
          },
          {
            opcode: "isForceSensorPressed",
            blockType: BlockType.BOOLEAN,
            text: "force sensor [PORT] pressed?",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portId",
                defaultValue: "C",
              },
            },
          },

          "---",

          // Tilt sensor blocks
          {
            opcode: "whenTilted",
            blockType: BlockType.HAT,
            text: "when tilted [TILT_DIRECTION_ANY]",
            arguments: {
              TILT_DIRECTION_ANY: {
                type: ArgumentType.STRING,
                menu: "tiltDirectionAny",
                defaultValue: BoostTiltDirection.ANY,
              },
            },
          },
          {
            opcode: "isTilted",
            blockType: BlockType.BOOLEAN,
            text: "tilted [TILT_DIRECTION_ANY]?",
            arguments: {
              TILT_DIRECTION_ANY: {
                type: ArgumentType.STRING,
                menu: "tiltDirectionAny",
                defaultValue: BoostTiltDirection.ANY,
              },
            },
          },
          {
            opcode: "getTiltAngle",
            blockType: BlockType.REPORTER,
            text: "tilt angle [TILT_DIRECTION]",
            arguments: {
              TILT_DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirection",
                defaultValue: BoostTiltDirection.UP,
              },
            },
          },

          "---",

          // Hub control blocks
          {
            opcode: "setLightHue",
            blockType: BlockType.COMMAND,
            text: "set light color to [HUE]",
            arguments: {
              HUE: {
                type: ArgumentType.NUMBER,
                defaultValue: 50,
              },
            },
          },
          {
            opcode: "shutdown",
            blockType: BlockType.COMMAND,
            text: "shutdown hub",
          },

          "---",

          // Hub status blocks
          {
            opcode: "whenButtonPressed",
            blockType: BlockType.HAT,
            text: "when button pressed",
          },
          {
            opcode: "isButtonPressed",
            blockType: BlockType.BOOLEAN,
            text: "button pressed?",
          },
          {
            opcode: "getBatteryLevel",
            blockType: BlockType.REPORTER,
            text: "battery level",
          },
          {
            opcode: "getFirmwareVersion",
            blockType: BlockType.REPORTER,
            text: "firmware version",
          },
          {
            opcode: "getRSSI",
            blockType: BlockType.REPORTER,
            text: "RSSI",
          },
          {
            opcode: "whenBatteryLow",
            blockType: BlockType.HAT,
            text: "when battery low",
          },
          {
            opcode: "whenMotorOverloaded",
            blockType: BlockType.HAT,
            text: "when motor overloaded",
          },
        ],
        menus: {
          connectionType: {
            acceptReporters: false,
            items: [
              { text: "Web Bluetooth (Direct)", value: ConnectionType.BLE },
              { text: "Scratch Link", value: ConnectionType.SCRATCH_LINK },
              { text: "HTTP Bridge", value: ConnectionType.BRIDGE },
            ],
          },
          debugLevel: {
            acceptReporters: false,
            items: ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"],
          },
          onOff: {
            acceptReporters: false,
            items: [
              { text: "on", value: "on" },
              { text: "off", value: "off" },
            ],
          },
          motorId: {
            acceptReporters: false,
            items: [
              BoostMotorLabel.A,
              BoostMotorLabel.B,
              BoostMotorLabel.C,
              BoostMotorLabel.D,
              BoostMotorLabel.AB,
              BoostMotorLabel.ALL,
            ],
          },
          motorReporterId: {
            acceptReporters: false,
            items: [
              BoostMotorLabel.A,
              BoostMotorLabel.B,
              BoostMotorLabel.C,
              BoostMotorLabel.D,
            ],
          },
          motorDirection: {
            acceptReporters: false,
            items: [
              BoostMotorDirection.FORWARD,
              BoostMotorDirection.BACKWARD,
              BoostMotorDirection.REVERSE,
            ],
          },
          stopAction: {
            acceptReporters: false,
            items: ["float", "brake", "hold"],
          },
          portId: {
            acceptReporters: false,
            items: ["A", "B", "C", "D"],
          },
          color: {
            acceptReporters: false,
            items: [
              BoostColor.ANY,
              BoostColor.RED,
              BoostColor.BLUE,
              BoostColor.GREEN,
              BoostColor.YELLOW,
              BoostColor.WHITE,
              BoostColor.BLACK,
            ],
          },
          tiltDirection: {
            acceptReporters: false,
            items: [
              BoostTiltDirection.UP,
              BoostTiltDirection.DOWN,
              BoostTiltDirection.LEFT,
              BoostTiltDirection.RIGHT,
            ],
          },
          tiltDirectionAny: {
            acceptReporters: false,
            items: [
              BoostTiltDirection.ANY,
              BoostTiltDirection.UP,
              BoostTiltDirection.DOWN,
              BoostTiltDirection.LEFT,
              BoostTiltDirection.RIGHT,
            ],
          },
        },
      };
    }

    // ========================================================================
    // CONNECTION BLOCKS
    // ========================================================================

    setConnectionType(args) {
      this._connectionType = args.TYPE;
      logger.info(`Connection type set to: ${this._connectionType}`);
    }

    setBridgeURL(args) {
      this._bridgeUrl = Cast.toString(args.URL);
      logger.info(`Bridge URL set to: ${this._bridgeUrl}`);
    }

    async connect() {
      logger.group("=== CONNECT ===");
      try {
        if (this._peripheral && this._peripheral.isConnected()) {
          logger.warn("Already connected");
          return;
        }

        logger.info(`Connection type: ${this._connectionType}`);
        this._peripheral = new BoostPeripheral(this._connectionType, this._bridgeUrl);
        
        await this._peripheral.connect();
        logger.info("✓ Successfully connected");
      } catch (error) {
        logger.error("Connection failed:", error);
        this._peripheral = null;
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.group("=== DISCONNECT ===");
      try {
        if (!this._peripheral) {
          logger.warn("Not connected");
          return;
        }

        await this._peripheral.disconnect();
        this._peripheral = null;
        logger.info("✓ Disconnected");
      } catch (error) {
        logger.error("Disconnect failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    isConnected() {
      const connected = this._peripheral && this._peripheral.isConnected();
      logger.trace(`Connection status: ${connected}`);
      return connected;
    }

    // ========================================================================
    // DEBUG BLOCKS
    // ========================================================================

    setDebugLevel(args) {
      logger.setLevel(args.LEVEL);
      logger.info(`Debug level set to: ${args.LEVEL}`);
    }

    enableDebug(args) {
      logger.enabled = args.ENABLED === "on";
      logger.info(`Debug ${logger.enabled ? "enabled" : "disabled"}`);
    }

    // ========================================================================
    // MOTOR CONTROL BLOCKS
    // ========================================================================

    motorOn(args) {
      if (!this._ensureConnected()) return;
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.turnOnForever();
        }
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), BoostBLE.sendInterval);
      });
    }

    motorOff(args) {
      if (!this._ensureConnected()) return;
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.turnOff();
        }
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), BoostBLE.sendInterval);
      });
    }

    motorOnFor(args) {
      if (!this._ensureConnected()) return;
      
      const time = Cast.toNumber(args.TIME) * 1000;
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.turnOnFor(time);
        }
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), time + BoostBLE.sendInterval);
      });
    }

    motorOnForDegrees(args) {
      if (!this._ensureConnected()) return;
      
      const degrees = Cast.toNumber(args.DEGREES);
      
      const promises = [];
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.turnOnForDegrees(degrees);
          
          const estimatedTime = (Math.abs(degrees) / 360) * 1000 * (100 / motor.power);
          promises.push(
            new Promise((resolve) => {
              setTimeout(() => resolve(), estimatedTime);
            })
          );
        }
      });

      return Promise.all(promises).then(() => {});
    }

    // ========================================================================
    // MOTOR SETTINGS BLOCKS
    // ========================================================================

    setMotorPower(args) {
      if (!this._ensureConnected()) return;
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.power = MathUtil.clamp(Cast.toNumber(args.POWER), 0, 100);
          
          switch (motor.status) {
            case BoostMotorState.ON_FOREVER:
              motor.turnOnForever();
              break;
            case BoostMotorState.ON_FOR_TIME:
              motor.turnOnFor(
                motor.pendingDurationTimeoutStartTime +
                  motor.pendingDurationTimeoutDelay -
                  Date.now()
              );
              break;
          }
        }
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), BoostBLE.sendInterval);
      });
    }

    setMotorDirection(args) {
      if (!this._ensureConnected()) return;
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          switch (args.MOTOR_DIRECTION) {
            case BoostMotorDirection.FORWARD:
              motor.direction = 1;
              break;
            case BoostMotorDirection.BACKWARD:
              motor.direction = -1;
              break;
            case BoostMotorDirection.REVERSE:
              motor.direction = -motor.direction;
              break;
          }

          switch (motor.status) {
            case BoostMotorState.ON_FOREVER:
              motor.turnOnForever();
              break;
            case BoostMotorState.ON_FOR_TIME:
              motor.turnOnFor(
                motor.pendingDurationTimeoutStartTime +
                  motor.pendingDurationTimeoutDelay -
                  Date.now()
              );
              break;
          }
        }
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), BoostBLE.sendInterval);
      });
    }

    setMotorStopAction(args) {
      if (!this._ensureConnected()) return;
      
      const stopModeMap = {
        float: BoostMotorEndState.FLOAT,
        brake: BoostMotorEndState.BRAKE,
        hold: BoostMotorEndState.HOLD,
      };
      const action = stopModeMap[args.ACTION] || BoostMotorEndState.BRAKE;

      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.stopMode = action;
        }
      });
    }

    setMotorAcceleration(args) {
      if (!this._ensureConnected()) return;
      
      const time = Cast.toNumber(args.TIME);
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.setAcceleration(time);
        }
      });
    }

    setMotorDeceleration(args) {
      if (!this._ensureConnected()) return;
      
      const time = Cast.toNumber(args.TIME);
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.setDeceleration(time);
        }
      });
    }

    resetMotorPosition(args) {
      if (!this._ensureConnected()) return;
      
      const position = Cast.toNumber(args.POSITION);
      
      this._forEachMotor(args.MOTOR_ID, (motorIndex) => {
        const motor = this._peripheral.motor(motorIndex);
        if (motor) {
          motor.resetPosition(position);
        }
      });
    }

    getMotorPosition(args) {
      if (!this._ensureConnected()) return 0;
      
      let portID = null;
      switch (args.MOTOR_ID) {
        case BoostMotorLabel.A:
          portID = BoostPort.A;
          break;
        case BoostMotorLabel.B:
          portID = BoostPort.B;
          break;
        case BoostMotorLabel.C:
          portID = BoostPort.C;
          break;
        case BoostMotorLabel.D:
          portID = BoostPort.D;
          break;
        default:
          return 0;
      }

      if (portID !== null && this._peripheral.motor(portID)) {
        let val = this._peripheral.motor(portID).position;
        if (portID === BoostPort.A) {
          val *= -1;
        }
        return MathUtil.wrapClamp(val, 0, 360);
      }
      return 0;
    }

    // ========================================================================
    // SENSOR BLOCKS
    // ========================================================================

    async _checkColor(args) {
      if (!this._ensureConnected()) return false;
      
      const port = this._getPortFromLabel(args.PORT);
      if (port === null) return false;

      await this._peripheral._setInputMode(port, BoostMode.COLOR);

      const currentColor = this._peripheral.getColor(port);
      if (args.COLOR === BoostColor.ANY || args.COLOR === "any color") {
        return currentColor !== BoostColor.NONE;
      }
      return currentColor === args.COLOR;
    }

    whenColor(args) {
      if (!this._ensureConnected()) return false;
      
      if (args.COLOR === BoostColor.ANY || args.COLOR === "any color") {
        return (
          this._peripheral.color !== BoostColor.NONE &&
          this._peripheral.color !== this._peripheral.previousColor
        );
      }
      return args.COLOR === this._peripheral.color || this._checkColor(args);
    }

    seeingColor(args) {
      return this._checkColor(args);
    }

    async getDistance(args) {
      if (!this._ensureConnected()) return 0;
      
      const port = this._getPortFromLabel(args.PORT);
      if (port === null) return 0;

      await this._peripheral._setInputMode(port, BoostMode.DISTANCE);
      return this._peripheral.getDistance(port);
    }

    async getReflection(args) {
      if (!this._ensureConnected()) return 0;
      
      const port = this._getPortFromLabel(args.PORT);
      if (port === null) return 0;

      await this._peripheral._setInputMode(port, BoostMode.REFLECTION);
      return this._peripheral.getReflection(port);
    }

    async getForce(args) {
      if (!this._ensureConnected()) return 0;
      
      const port = this._getPortFromLabel(args.PORT);
      if (port === null) return 0;

      await this._peripheral._setInputMode(port, BoostMode.FORCE);
      return this._peripheral.getForce(port);
    }

    async isForceSensorPressed(args) {
      if (!this._ensureConnected()) return false;
      
      const port = this._getPortFromLabel(args.PORT);
      if (port === null) return false;

      await this._peripheral._setInputMode(port, BoostMode.TOUCHED);
      return this._peripheral.isForcePressed(port);
    }

    whenForceSensorPressed(args) {
      return this.isForceSensorPressed(args);
    }

    // ========================================================================
    // TILT BLOCKS
    // ========================================================================

    whenTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.TILT_DIRECTION_ANY);
    }

    isTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.TILT_DIRECTION_ANY);
    }

    getTiltAngle(args) {
      if (!this._ensureConnected()) return 0;
      return this._getTiltAngle(args.TILT_DIRECTION);
    }

    _isTilted(direction) {
      const TILT_THRESHOLD = 15;
      switch (direction) {
        case BoostTiltDirection.ANY:
          return (
            Math.abs(this._peripheral.tiltX) >= TILT_THRESHOLD ||
            Math.abs(this._peripheral.tiltY) >= TILT_THRESHOLD
          );
        default:
          return this._getTiltAngle(direction) >= TILT_THRESHOLD;
      }
    }

    _getTiltAngle(direction) {
      switch (direction) {
        case BoostTiltDirection.UP:
          return this._peripheral.tiltY > 90
            ? 256 - this._peripheral.tiltY
            : -this._peripheral.tiltY;
        case BoostTiltDirection.DOWN:
          return this._peripheral.tiltY > 90
            ? this._peripheral.tiltY - 256
            : this._peripheral.tiltY;
        case BoostTiltDirection.LEFT:
          return this._peripheral.tiltX > 90
            ? this._peripheral.tiltX - 256
            : this._peripheral.tiltX;
        case BoostTiltDirection.RIGHT:
          return this._peripheral.tiltX > 90
            ? 256 - this._peripheral.tiltX
            : -this._peripheral.tiltX;
        default:
          return 0;
      }
    }

    // ========================================================================
    // HUB CONTROL BLOCKS
    // ========================================================================

    setLightHue(args) {
      if (!this._ensureConnected()) return;
      
      let inputHue = Cast.toNumber(args.HUE);
      inputHue = MathUtil.wrapClamp(inputHue, 0, 100);
      const hue = (inputHue * 360) / 100;

      const rgbObject = colorUtils.hsvToRgb({ h: hue, s: 1, v: 1 });
      const rgbDecimal = colorUtils.rgbToDecimal(rgbObject);

      this._peripheral.setLED(rgbDecimal);

      return new Promise((resolve) => {
        setTimeout(() => resolve(), BoostBLE.sendInterval);
      });
    }

    shutdown() {
      if (!this._ensureConnected()) return;
      this._peripheral.shutdown();
    }

    // ========================================================================
    // HUB STATUS BLOCKS
    // ========================================================================

    whenButtonPressed() {
      if (!this._ensureConnected()) return false;
      return this._peripheral.hubStatus.buttonPressed;
    }

    isButtonPressed() {
      if (!this._ensureConnected()) return false;
      return this._peripheral.hubStatus.buttonPressed;
    }

    getBatteryLevel() {
      if (!this._ensureConnected()) return 0;
      return this._peripheral.hubStatus.batteryLevel;
    }

    getFirmwareVersion() {
      if (!this._ensureConnected()) return "0.0.00.0000";
      return this._peripheral.hubStatus.fwVersion;
    }

    getRSSI() {
      if (!this._ensureConnected()) return 0;
      return this._peripheral.hubStatus.rssi;
    }

    whenBatteryLow() {
      if (!this._ensureConnected()) return false;
      return this._peripheral.hubStatus.lowVoltage;
    }

    whenMotorOverloaded() {
      if (!this._ensureConnected()) return false;
      return (
        this._peripheral.hubStatus.highCurrent ||
        this._peripheral.hubStatus.overPower
      );
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    _ensureConnected() {
      if (!this._peripheral || !this._peripheral.isConnected()) {
        logger.warn("Operation attempted while not connected");
        return false;
      }
      return true;
    }

    _forEachMotor(motorID, callback) {
      let motors;
      switch (motorID) {
        case BoostMotorLabel.A:
          motors = [BoostPort.A];
          break;
        case BoostMotorLabel.B:
          motors = [BoostPort.B];
          break;
        case BoostMotorLabel.C:
          motors = [BoostPort.C];
          break;
        case BoostMotorLabel.D:
          motors = [BoostPort.D];
          break;
        case BoostMotorLabel.AB:
          motors = [BoostPort.A, BoostPort.B];
          break;
        case BoostMotorLabel.ALL:
          motors = [BoostPort.A, BoostPort.B, BoostPort.C, BoostPort.D];
          break;
        default:
          motors = [];
          break;
      }
      
      for (const index of motors) {
        callback(index);
      }
    }

    _getPortFromLabel(label) {
      const portMap = {
        A: BoostPort.A,
        B: BoostPort.B,
        C: BoostPort.C,
        D: BoostPort.D,
      };
      return portMap[label] !== undefined ? portMap[label] : null;
    }
  }

  Scratch.extensions.register(new LEGOBoostExtension());
  
  logger.info("🎉 LEGO Boost Unified Extension loaded successfully!");
})(Scratch);