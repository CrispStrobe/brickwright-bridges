// Name: LEGO Powered Up
// ID: CrispStrobe/lego_poweredup
// Description: Control LEGO Powered Up hubs and motors.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // DEBUG LOGGER
  // ============================================================================
  
  class DebugLogger {
    constructor(prefix = "[LEGO Powered Up]", enabled = true) {
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

  const PoweredUpBLE = {
    service: "00001623-1212-efde-1623-785feabcd123",
    characteristic: "00001624-1212-efde-1623-785feabcd123",
    sendInterval: 100,
    sendRateMax: 20,
  };

  const PoweredUpPingInterval = 5000;

  // Hub Types
  const HubType = {
    UNKNOWN: 0,
    WEDO2_SMART_HUB: 1,
    MOVE_HUB: 2,              // Boost Move Hub
    HUB: 3,                   // Powered Up Hub
    REMOTE_CONTROL: 4,
    DUPLO_TRAIN_BASE: 5,
    TECHNIC_MEDIUM_HUB: 6,    // Also called Control+ Hub
    MARIO: 7,
    TECHNIC_SMALL_HUB: 8,
    };

  const HubTypeName = {
    [HubType.UNKNOWN]: "Unknown Hub",
    [HubType.WEDO2_SMART_HUB]: "WeDo 2.0 Smart Hub",
    [HubType.MOVE_HUB]: "Boost Move Hub",
    [HubType.HUB]: "Powered Up Hub",
    [HubType.REMOTE_CONTROL]: "Powered Up Remote",
    [HubType.DUPLO_TRAIN_BASE]: "Duplo Train Hub",
    [HubType.TECHNIC_MEDIUM_HUB]: "Control+ Hub",  // Also Technic Medium Hub
    [HubType.MARIO]: "Mario",
    [HubType.TECHNIC_SMALL_HUB]: "Technic Small Hub",
    };

  // Device Types (all Powered Up compatible devices)
  const DeviceType = {
    UNKNOWN: 0x00,
    SIMPLE_MEDIUM_LINEAR_MOTOR: 0x01, // WeDo 2.0 Medium Motor
    TRAIN_MOTOR: 0x02,
    LIGHT: 0x08,
    VOLTAGE_SENSOR: 0x14,
    CURRENT_SENSOR: 0x15,
    PIEZO_BUZZER: 0x16,
    HUB_LED: 0x17,
    EXTERNAL_TILT_SENSOR: 0x22, // WeDo 2.0 Tilt Sensor
    MOTION_SENSOR: 0x23, // WeDo 2.0 Motion Sensor
    COLOR_DISTANCE_SENSOR: 0x25, // Boost Color and Distance Sensor
    EXTERNAL_MOTOR_TACHO: 0x26, // Boost External Motor
    INTERNAL_MOTOR_TACHO: 0x27, // Boost Internal Motor
    INTERNAL_TILT: 0x28,
    DUPLO_TRAIN_BASE_MOTOR: 0x29,
    DUPLO_TRAIN_BASE_SPEAKER: 0x2a,
    DUPLO_TRAIN_BASE_COLOR: 0x2b,
    DUPLO_TRAIN_BASE_SPEEDOMETER: 0x2c,
    CONTROL_PLUS_LARGE_MOTOR: 0x2e, // Control+ Large Motor (Technic)
    CONTROL_PLUS_XLARGE_MOTOR: 0x2f, // Control+ XLarge Motor (Technic)
    SPIKE_MEDIUM_MOTOR: 0x30, // SPIKE Prime Medium Angular Motor
    SPIKE_LARGE_MOTOR: 0x31, // SPIKE Prime Large Angular Motor
    TECHNIC_MEDIUM_HUB_GEST_SENSOR: 0x36,
    REMOTE_CONTROL_BUTTON: 0x37,
    REMOTE_CONTROL_RSSI: 0x38,
    TECHNIC_MEDIUM_HUB_ACCELEROMETER: 0x39,
    TECHNIC_MEDIUM_HUB_GYRO_SENSOR: 0x3a,
    TECHNIC_MEDIUM_HUB_TILT_SENSOR: 0x3b,
    TECHNIC_MEDIUM_HUB_TEMPERATURE_SENSOR: 0x3c,
    SPIKE_COLOR_SENSOR: 0x3d, // SPIKE Prime Color Sensor
    SPIKE_ULTRASONIC_SENSOR: 0x3e, // SPIKE Prime Distance Sensor
    SPIKE_FORCE_SENSOR: 0x3f, // SPIKE Prime Force Sensor / Technic Force Sensor
    SPIKE_SMALL_MOTOR: 0x41, // SPIKE Essential Small Angular Motor
    TECHNIC_MEDIUM_ANGULAR_MOTOR_GREY: 0x4b,
    TECHNIC_LARGE_ANGULAR_MOTOR_GREY: 0x4c,
    SPIKE_3x3_COLOR_LIGHT_MATRIX: 0x40, // SPIKE Essential 3x3 Color Matrix
    MARIO_HUB_ACCELEROMETER: 0x47,
    MARIO_HUB_BARCODE_SENSOR: 0x49,
    MARIO_HUB_PANTS_SENSOR: 0x4a,
    MARIO_HUB_GESTURE_SENSOR: 0x54,

    VOLTAGE_SENSOR: 0x14,                    // 20
    CURRENT_SENSOR: 0x15,                    // 21
    PIEZO_BUZZER: 0x16,                      // 22
    MOVE_HUB_TILT_SENSOR: 0x28,              // 40
    DUPLO_TRAIN_BASE_SPEEDOMETER: 0x2c,      // 44
    TECHNIC_MEDIUM_HUB_GEST_SENSOR: 0x36,    // 54
    REMOTE_CONTROL_BUTTON: 0x37,             // 55
    REMOTE_CONTROL_RSSI: 0x38,               // 56
    TECHNIC_MEDIUM_HUB_ACCELEROMETER: 0x39,  // 57
    TECHNIC_MEDIUM_HUB_GYRO_SENSOR: 0x3a,    // 58
    TECHNIC_MEDIUM_HUB_TILT_SENSOR: 0x3b,    // 59
    TECHNIC_MEDIUM_HUB_TEMPERATURE_SENSOR: 0x3c, // 60
    MARIO_ACCELEROMETER: 0x47,               // 71
    MARIO_BARCODE_SENSOR: 0x49,              // 73
    MARIO_PANTS_SENSOR: 0x4a,                // 74
  };

  const DeviceTypeName = {
    [DeviceType.SIMPLE_MEDIUM_LINEAR_MOTOR]: "WeDo 2.0 Medium Motor",
    [DeviceType.TRAIN_MOTOR]: "Powered Up Train Motor",
    [DeviceType.LIGHT]: "Powered Up LED Light",
    [DeviceType.VOLTAGE_SENSOR]: "Voltage Sensor",
    [DeviceType.CURRENT_SENSOR]: "Current Sensor",
    [DeviceType.PIEZO_BUZZER]: "Piezo Buzzer",
    [DeviceType.HUB_LED]: "Hub LED",
    [DeviceType.EXTERNAL_TILT_SENSOR]: "WeDo 2.0 Tilt Sensor",
    [DeviceType.MOTION_SENSOR]: "WeDo 2.0 Motion Sensor",
    [DeviceType.COLOR_DISTANCE_SENSOR]: "Boost Color & Distance Sensor",
    [DeviceType.EXTERNAL_MOTOR_TACHO]: "Boost External Motor",
    [DeviceType.INTERNAL_MOTOR_TACHO]: "Boost Internal Motor",
    [DeviceType.INTERNAL_TILT]: "Internal Tilt Sensor",
    [DeviceType.CONTROL_PLUS_LARGE_MOTOR]: "Control+ Large Motor",
    [DeviceType.CONTROL_PLUS_XLARGE_MOTOR]: "Control+ XLarge Motor",
    [DeviceType.SPIKE_MEDIUM_MOTOR]: "SPIKE Prime Medium Motor",
    [DeviceType.SPIKE_LARGE_MOTOR]: "SPIKE Prime Large Motor",
    [DeviceType.SPIKE_COLOR_SENSOR]: "SPIKE Prime Color Sensor",
    [DeviceType.SPIKE_ULTRASONIC_SENSOR]: "SPIKE Prime Distance Sensor",
    [DeviceType.SPIKE_FORCE_SENSOR]: "SPIKE Prime Force Sensor",
    [DeviceType.SPIKE_SMALL_MOTOR]: "SPIKE Essential Small Motor",
    [DeviceType.SPIKE_3x3_COLOR_LIGHT_MATRIX]: "SPIKE 3x3 Color Matrix",
    [DeviceType.DUPLO_TRAIN_BASE_MOTOR]: "Duplo Train Motor",
    [DeviceType.DUPLO_TRAIN_BASE_SPEAKER]: "Duplo Train Speaker",
    [DeviceType.DUPLO_TRAIN_BASE_COLOR]: "Duplo Train Color Sensor",
    [DeviceType.DUPLO_TRAIN_BASE_SPEEDOMETER]: "Duplo Train Speedometer",
    [DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR_GREY]: "Technic Medium Angular Motor",
    [DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR_GREY]: "Technic Large Angular Motor",
    [DeviceType.VOLTAGE_SENSOR]: "Voltage Sensor",
    [DeviceType.CURRENT_SENSOR]: "Current Sensor",
    [DeviceType.PIEZO_BUZZER]: "Piezo Buzzer",
    [DeviceType.MOVE_HUB_TILT_SENSOR]: "Boost Internal Tilt Sensor",
    [DeviceType.DUPLO_TRAIN_BASE_SPEEDOMETER]: "Duplo Train Speedometer",
    [DeviceType.TECHNIC_MEDIUM_HUB_GEST_SENSOR]: "Gesture Sensor",
    [DeviceType.REMOTE_CONTROL_BUTTON]: "Remote Control Button",
    [DeviceType.REMOTE_CONTROL_RSSI]: "Remote Control RSSI",
    [DeviceType.TECHNIC_MEDIUM_HUB_ACCELEROMETER]: "Hub Accelerometer",
    [DeviceType.TECHNIC_MEDIUM_HUB_GYRO_SENSOR]: "Hub Gyro Sensor",
    [DeviceType.TECHNIC_MEDIUM_HUB_TILT_SENSOR]: "Hub Tilt Sensor",
    [DeviceType.TECHNIC_MEDIUM_HUB_TEMPERATURE_SENSOR]: "Hub Temperature Sensor",
    [DeviceType.MARIO_ACCELEROMETER]: "Mario Accelerometer",
    [DeviceType.MARIO_BARCODE_SENSOR]: "Mario Barcode Sensor",
    [DeviceType.MARIO_PANTS_SENSOR]: "Mario Pants Sensor",
    };


  // Check if device is a motor
  const isMotor = (deviceType) => {
    return [
        DeviceType.SIMPLE_MEDIUM_LINEAR_MOTOR,
        DeviceType.TRAIN_MOTOR,
        DeviceType.EXTERNAL_MOTOR_TACHO,
        DeviceType.INTERNAL_MOTOR_TACHO,
        DeviceType.MEDIUM_LINEAR_MOTOR,         
        DeviceType.MOVE_HUB_MEDIUM_LINEAR_MOTOR, 
        DeviceType.DUPLO_TRAIN_BASE_MOTOR,
        DeviceType.CONTROL_PLUS_LARGE_MOTOR,
        DeviceType.CONTROL_PLUS_XLARGE_MOTOR,
        DeviceType.SPIKE_MEDIUM_MOTOR,
        DeviceType.SPIKE_LARGE_MOTOR,
        DeviceType.SPIKE_SMALL_MOTOR,
        DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR_GREY,
        DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR_GREY,
    ].includes(deviceType);
    };

  // Check if motor has tacho (position sensing)
  const hasTacho = (deviceType) => {
    return [
      DeviceType.EXTERNAL_MOTOR_TACHO,
      DeviceType.INTERNAL_MOTOR_TACHO,
      DeviceType.MEDIUM_LINEAR_MOTOR,             
      DeviceType.MOVE_HUB_MEDIUM_LINEAR_MOTOR,   
      DeviceType.CONTROL_PLUS_LARGE_MOTOR,
      DeviceType.CONTROL_PLUS_XLARGE_MOTOR,
      DeviceType.SPIKE_MEDIUM_MOTOR,
      DeviceType.SPIKE_LARGE_MOTOR,
      DeviceType.SPIKE_SMALL_MOTOR,
      DeviceType.TECHNIC_MEDIUM_ANGULAR_MOTOR_GREY,
      DeviceType.TECHNIC_LARGE_ANGULAR_MOTOR_GREY,
    ].includes(deviceType);
  };

  const PortFeedback = {
    IN_PROGRESS: 0x01,
    COMPLETED: 0x02,
    DISCARDED: 0x04,
    IDLE: 0x08,
    BUSY_OR_FULL: 0x10,
  };

  const Color = {
    ANY: "any",
    NONE: "none",
    BLACK: "black",
    PINK: "pink",
    PURPLE: "purple",
    BLUE: "blue",
    LIGHTBLUE: "light blue",
    CYAN: "cyan",
    GREEN: "green",
    YELLOW: "yellow",
    ORANGE: "orange",
    RED: "red",
    WHITE: "white",
    BROWN: "brown",
  };

  const ColorIndex = {
    [Color.NONE]: 255,
    [Color.BLACK]: 0,
    [Color.PINK]: 1,
    [Color.PURPLE]: 2,
    [Color.BLUE]: 3,
    [Color.LIGHTBLUE]: 4,
    [Color.CYAN]: 5,
    [Color.GREEN]: 6,
    [Color.YELLOW]: 7,
    [Color.ORANGE]: 8,
    [Color.RED]: 9,
    [Color.WHITE]: 10,
    [Color.BROWN]: 11,
  };

  // Reverse lookup
  const IndexToColor = Object.fromEntries(
    Object.entries(ColorIndex).map(([k, v]) => [v, k])
  );

  const Message = {
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
    VIRTUAL_PORT_SETUP: 0x61,
    OUTPUT: 0x81,
    PORT_FEEDBACK: 0x82,
  };

  const HubProperty = {
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

  const HubPropertyOperation = {
    SET: 0x01,
    ENABLE_UPDATES: 0x02,
    DISABLE_UPDATES: 0x03,
    RESET: 0x04,
    REQUEST_UPDATE: 0x05,
    UPDATE: 0x06,
  };

  const HubAction = {
    SWITCH_OFF_HUB: 0x01,
    DISCONNECT: 0x02,
    VCC_PORT_CONTROL_ON: 0x03,
    VCC_PORT_CONTROL_OFF: 0x04,
    ACTIVATE_BUSY_INDICATION: 0x05,
    RESET_BUSY_INDICATION: 0x06,
    SHUTDOWN: 0x2f,
    HUB_WILL_SWITCH_OFF: 0x30,
    HUB_WILL_DISCONNECT: 0x31,
    HUB_WILL_BOOT_MODE: 0x32,
  };

  const Alert = {
    LOW_VOLTAGE: 0x01,
    HIGH_CURRENT: 0x02,
    LOW_SIGNAL_STRENGTH: 0x03,
    OVER_POWER_CONDITION: 0x04,
  };

  const AlertOperation = {
    ENABLE_UPDATES: 0x01,
    DISABLE_UPDATES: 0x02,
    REQUEST_UPDATES: 0x03,
    UPDATE: 0x04,
  };

  const OutputSubCommand = {
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

  const OutputExecution = {
    BUFFER_IF_NECESSARY: 0x00,
    EXECUTE_IMMEDIATELY: 0x10,
    NO_ACTION: 0x00,
    COMMAND_FEEDBACK: 0x01,
  };

  const MotorEndState = {
    FLOAT: 0,
    HOLD: 127,    
    BRAKE: 128,  
    };

  const MotorProfile = {
    DO_NOT_USE: 0x00,
    ACCELERATION: 0x01,
    DECELERATION: 0x02,
  };

  const IOEvent = {
    ATTACHED: 0x01,
    DETACHED: 0x00,
    ATTACHED_VIRTUAL: 0x02,
  };

  // Device modes - varies by device
  const Mode = {
    // Motor modes
    MOTOR_POWER: 0,
    MOTOR_SPEED: 1,
    MOTOR_POSITION: 2,
    MOTOR_ABSOLUTE_POSITION: 3,
    
    // Tilt sensor modes
    TILT_ANGLE: 0,
    TILT_DIRECTION: 1,
    TILT_IMPACT: 2,
    TILT_ACCELERATION: 3,
    
    // Color/Distance sensor modes
    COLOR: 0,
    DISTANCE: 1,
    COUNT: 2,
    REFLECTION: 3,
    AMBIENT: 4,
    RGB: 5,
    IR: 6,
    DEBUG: 7,
    CALIBRATION: 8,
    
    // LED modes
    LED_COLOR: 0,
    LED_RGB: 1,
    
    // Motion sensor
    MOTION_DISTANCE: 0,
    MOTION_COUNT: 1,
    
    // Force sensor
    FORCE: 0,
    TOUCHED: 1,
    TAPPED: 2,
    
    // Voltage/Current
    VOLTAGE: 0,
    CURRENT: 0,
    
    // Train motor
    TRAIN_SPEED: 0,
  };

  const MotorState = {
    OFF: 0,
    ON_FOREVER: 1,
    ON_FOR_TIME: 2,
    ON_FOR_ROTATION: 3,
  };

  const MotorLabel = {
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    AB: "AB",
    ALL: "ALL",
  };

  const MotorDirection = {
    FORWARD: "forward",
    BACKWARD: "backward",
    REVERSE: "reverse",
  };

  const TiltDirection = {
    ANY: "any",
    UP: "up",
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
    FORWARD: "forward",
    BACKWARD: "backward",
  };

  // ============================================================================
  // DEVICE CLASSES
  // ============================================================================

  // Base Device Class
  class PoweredUpDevice {
    constructor(parent, portId, deviceType) {
      this._parent = parent;
      this._portId = portId;
      this._deviceType = deviceType;
      this._deviceName = DeviceTypeName[deviceType] || "Unknown Device";
      this._modes = {};
      this._currentMode = null;
      this._values = {};
      
      logger.debug(`Device created: ${this._deviceName} on port ${portId}`);
    }

    get portId() {
      return this._portId;
    }

    get deviceType() {
      return this._deviceType;
    }

    get deviceName() {
      return this._deviceName;
    }

    getValue(key = "default") {
      return this._values[key];
    }

    setValue(key, value) {
      this._values[key] = value;
    }
  }

  // Motor Device Class
  class PoweredUpMotor extends PoweredUpDevice {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      
      this._direction = 1;
      this._power = 50;
      this._position = 0;
      this._absolutePosition = 0;
      this._status = MotorState.OFF;
      this._pendingDurationTimeoutId = null;
      this._pendingDurationTimeoutStartTime = null;
      this._pendingDurationTimeoutDelay = null;
      this._stopMode = MotorEndState.BRAKE;
      this._accelerationTime = 0;
      this._decelerationTime = 0;
      this._hasTacho = hasTacho(deviceType);
      
      logger.debug(`Motor ${portId} initialized (tacho: ${this._hasTacho})`);
    }

    get direction() {
      return this._direction;
    }

    set direction(value) {
      logger.debug(`Motor ${this._portId} direction set to ${value}`);
      this._direction = value;
    }

    get power() {
      return this._power;
    }

    set power(value) {
      logger.debug(`Motor ${this._portId} power set to ${value}`);
      this._power = value;
    }

    get position() {
      return this._position;
    }

    set position(value) {
      this._position = value;
    }

    get absolutePosition() {
      return this._absolutePosition;
    }

    set absolutePosition(value) {
      this._absolutePosition = value;
    }

    get status() {
      return this._status;
    }

    set status(value) {
      logger.debug(`Motor ${this._portId} status changed to ${value}`);
      this._status = value;
    }

    get stopMode() {
      return this._stopMode;
    }

    set stopMode(value) {
      logger.debug(`Motor ${this._portId} stop mode set to ${value}`);
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
      logger.debug(`Motor ${this._portId} turn on forever at power ${this._power}`);
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
        this._pendingDurationTimeoutId = null;
        this._pendingDurationTimeoutStartTime = null;
        this._pendingDurationTimeoutDelay = null;
      }

      this._status = MotorState.ON_FOREVER;
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY + OutputExecution.COMMAND_FEEDBACK,
        OutputSubCommand.START_SPEED,
        [MathUtil.clamp(this._power * this._direction, -100, 100), 100, MotorProfile.DO_NOT_USE]
      );

      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    turnOnFor(time) {
      logger.debug(`Motor ${this._portId} turn on for ${time}ms at power ${this._power}`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
      }

      this._status = MotorState.ON_FOR_TIME;
      this._pendingDurationTimeoutDelay = time;
      this._pendingDurationTimeoutStartTime = Date.now();

      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY + OutputExecution.COMMAND_FEEDBACK,
        OutputSubCommand.START_SPEED_FOR_TIME,
        [
          MathUtil.clamp(time, 0, 6553500) & 0xff,
          (MathUtil.clamp(time, 0, 6553500) >> 8) & 0xff,
          MathUtil.clamp(this._power * this._direction, -100, 100),
          100,
          this._stopMode,
          MotorProfile.DO_NOT_USE,
        ]
      );

      this._parent.send(PoweredUpBLE.characteristic, cmd);

      this._pendingDurationTimeoutId = setTimeout(() => {
        logger.debug(`Motor ${this._portId} time duration completed`);
        this._status = MotorState.OFF;
      }, time);
    }

    turnOnForDegrees(degrees) {
      if (!this._hasTacho) {
        logger.warn(`Motor ${this._portId} does not support degree control`);
        return;
      }

      logger.debug(`Motor ${this._portId} turn on for ${degrees}° at power ${this._power}`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
      }

      this._status = MotorState.ON_FOR_ROTATION;
      
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY + OutputExecution.COMMAND_FEEDBACK,
        OutputSubCommand.START_SPEED_FOR_DEGREES,
        numberToInt32Array(degrees).concat([
          MathUtil.clamp(this._power * this._direction, -100, 100),
          100,
          this._stopMode,
          MotorProfile.DO_NOT_USE,
        ])
      );

      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    turnOff() {
      logger.debug(`Motor ${this._portId} turn off`);
      
      if (this._pendingDurationTimeoutId) {
        clearTimeout(this._pendingDurationTimeoutId);
        this._pendingDurationTimeoutId = null;
        this._pendingDurationTimeoutStartTime = null;
        this._pendingDurationTimeoutDelay = null;
      }

      this._status = MotorState.OFF;

      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY + OutputExecution.COMMAND_FEEDBACK,
        OutputSubCommand.START_SPEED,
        [0, 100, MotorProfile.DO_NOT_USE]
      );

      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    setAcceleration(time) {
      logger.debug(`Motor ${this._portId} set acceleration time to ${time}ms`);
      this._accelerationTime = time;
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.SET_ACC_TIME,
        [
          MathUtil.clamp(time, 0, 10000) & 0xff,
          (MathUtil.clamp(time, 0, 10000) >> 8) & 0xff,
          MotorProfile.ACCELERATION,
        ]
      );
      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    setDeceleration(time) {
      logger.debug(`Motor ${this._portId} set deceleration time to ${time}ms`);
      this._decelerationTime = time;
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.SET_DEC_TIME,
        [
          MathUtil.clamp(time, 0, 10000) & 0xff,
          (MathUtil.clamp(time, 0, 10000) >> 8) & 0xff,
          MotorProfile.DECELERATION,
        ]
      );
      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    resetPosition(position = 0) {
      if (!this._hasTacho) {
        logger.warn(`Motor ${this._portId} does not support position reset`);
        return;
      }

      logger.debug(`Motor ${this._portId} reset position to ${position}`);
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.PRESET_ENCODER,
        numberToInt32Array(position)
      );
      this._parent.send(PoweredUpBLE.characteristic, cmd);
      this._position = position;
    }
  }

  // Sensor Device Class
  class PoweredUpSensor extends PoweredUpDevice {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      logger.debug(`Sensor ${portId} initialized: ${this._deviceName}`);
    }
  }

  // LED Device Class
  class PoweredUpLED extends PoweredUpDevice {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      this._brightness = 100;
      logger.debug(`LED ${portId} initialized`);
    }

    setBrightness(brightness) {
      this._brightness = MathUtil.clamp(brightness, 0, 100);
      logger.debug(`LED ${this._portId} brightness set to ${this._brightness}`);
      
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.WRITE_DIRECT_MODE_DATA,
        [0, this._brightness]
      );
      
      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }
  }

  // 3x3 Color Matrix Device Class
  class PoweredUp3x3Matrix extends PoweredUpDevice {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      this._pixels = Array(9).fill(0);
      logger.debug(`3x3 Matrix ${portId} initialized`);
    }

    setPixel(index, colorIndex) {
      if (index < 0 || index >= 9) return;
      this._pixels[index] = colorIndex;
      
      logger.debug(`Matrix ${this._portId} pixel ${index} set to color ${colorIndex}`);
      
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.WRITE_DIRECT_MODE_DATA,
        [0, ...this._pixels]
      );
      
      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    setAllPixels(colorIndex) {
      this._pixels.fill(colorIndex);
      
      logger.debug(`Matrix ${this._portId} all pixels set to color ${colorIndex}`);
      
      const cmd = this._parent.generateOutputCommand(
        this._portId,
        OutputExecution.EXECUTE_IMMEDIATELY,
        OutputSubCommand.WRITE_DIRECT_MODE_DATA,
        [0, ...this._pixels]
      );
      
      this._parent.send(PoweredUpBLE.characteristic, cmd);
    }

    clear() {
      this.setAllPixels(0);
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
              services: [PoweredUpBLE.service],
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
        this._service = await this._server.getPrimaryService(PoweredUpBLE.service);
        
        logger.info("Getting characteristic...");
        this._characteristic = await this._service.getCharacteristic(
          PoweredUpBLE.characteristic
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
    constructor(runtime, extensionId) {
      super();
      this._runtime = runtime;
      this._extensionId = extensionId;
      this._ws = null;
      this._requestId = 0;
      this._requests = new Map();
      logger.info("Scratch Link Adapter initialized", {
        hasRuntime: !!runtime,
        extensionId
      });
    }

    async connect() {
      logger.group("Scratch Link Connection");
      try {
        logger.info("Connecting to Scratch Link WebSocket...");
        
        return new Promise((resolve, reject) => {
          this._ws = new WebSocket("wss://device-manager.scratch.mit.edu:20110/scratch/ble");

          this._ws.onopen = () => {
            logger.info("✓ WebSocket connected");
            
            // Emit that we're ready to discover
            if (this._runtime) {
              this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
            }
            
            this._sendRequest("discover", {
              filters: [
                {
                  services: [PoweredUpBLE.service],
                },
              ],
            })
              .then((device) => {
                logger.info(`Device discovered: ${device.name || "Unknown"}`);
                
                // Emit peripheral list update
                if (this._runtime) {
                  this._runtime.emit(
                    this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                    { [device.peripheralId]: device }
                  );
                }
                
                return this._sendRequest("connect", { peripheralId: device.peripheralId });
              })
              .then(() => {
                logger.info("✓ Connected to device");
                return this._sendRequest("startNotifications", {
                  serviceId: PoweredUpBLE.service,
                  characteristicId: PoweredUpBLE.characteristic,
                });
              })
              .then(() => {
                logger.info("✓ Notifications started");
                this._connected = true;
                
                // Emit connected event
                if (this._runtime) {
                  this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
                }
                
                resolve(true);
              })
              .catch(reject);
          };

          this._ws.onerror = (error) => {
            logger.error("WebSocket error:", error);
            
            if (this._runtime) {
              this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
                message: "Scratch lost connection to LEGO Powered Up",
                extensionId: this._extensionId,
              });
            }
            
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
            
            if (this._runtime) {
              this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR, {
                message: "Scratch lost connection to LEGO Powered Up",
                extensionId: this._extensionId,
              });
            }
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
        serviceId: PoweredUpBLE.service,
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
          throw new Error("No LEGO Powered Up devices found");
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
  // POWERED UP HUB
  // ============================================================================

  class PoweredUpHub {
    constructor(runtime, extensionId, connectionType, bridgeUrl) {
      logger.info(`Initializing Powered Up Hub with connection type: ${connectionType}`);
      
      this._runtime = runtime;
      this._extensionId = extensionId;
      
      // Only register if runtime is available
      if (this._runtime) {
        try {
          this._runtime.registerPeripheralExtension(extensionId, this);
          this._runtime.on("PROJECT_STOP_ALL", this.stopAll.bind(this));
          logger.info("Registered as peripheral extension");
        } catch (error) {
          logger.warn("Could not register peripheral extension:", error);
        }
      } else {
        logger.warn("No runtime available - peripheral features may be limited");
      }
      
      // Create appropriate connection adapter
      switch (connectionType) {
        case ConnectionType.BLE:
          this._connection = new BLEAdapter();
          break;
        case ConnectionType.SCRATCH_LINK:
          this._connection = new ScratchLinkAdapter(runtime, extensionId);
          break;
        case ConnectionType.BRIDGE:
          this._connection = new BridgeAdapter(bridgeUrl);
          break;
        default:
          throw new Error(`Invalid connection type: ${connectionType}`);
      }

      this._connectionType = connectionType;
      this._devices = {};
      this._ports = {};
      this._portModes = {};
      this._rateLimiter = new RateLimiter(PoweredUpBLE.sendRateMax);
      this._pingIntervalId = null;

      // Hub info
      this.hubType = null;
      this.hubName = "Unknown Hub";

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

      // Tilt data (for hubs with built-in tilt sensors)
      this.tiltX = 0;
      this.tiltY = 0;
      this.tiltZ = 0;

      // Set up message handler
      this._connection.onMessage((data) => this._onMessage(data));

      logger.info("Powered Up Hub initialized");
    }

    // Required peripheral interface methods
    scan() {
      logger.info("Peripheral scan requested");
      // For ScratchLink, the connection adapter handles scanning
      if (this._connectionType === ConnectionType.SCRATCH_LINK) {
        if (!this._connection) {
          this._connection = new ScratchLinkAdapter();
          this._connection.onMessage((data) => this._onMessage(data));
        }
        return this._connection.connect();
      }
    }

    connectPeripheral(id) {
      logger.info(`Connect to peripheral: ${id}`);
      if (this._connection && this._connection.connectPeripheral) {
        return this._connection.connectPeripheral(id);
      }
    }

    getPeripheralIsConnected() {
      return this.isConnected();
    }

    _getStatus() {
      logger.debug("Get status called");
      const connected = this.isConnected();
      return {
        status: connected ? 2 : 1,
        msg: connected ? "Connected" : "Disconnected"
      };
    }

    // rest of the class methods

    stopAll() {
      if (!this.isConnected()) return;
      this.stopAllMotors();
    }
    
    stopAllMotors() {
      Object.values(this._devices).forEach(device => {
        if (device instanceof PoweredUpMotor) {
          device.turnOff(false);
        }
      });
    }



    async connect() {
      logger.info("Connecting Powered Up Hub...");
      await this._connection.connect();
      await this._initialize();
      logger.info("✓ Powered Up Hub connected and initialized");
    }

    async _initialize() {
      logger.group("Initializing Hub");
      try {
        // Request hub type
        logger.info("Requesting hub type...");
        this._requestHubPropertyValue(HubProperty.SYSTEM_TYPE_ID);
        await this._delay(100);

        // Request hub properties
        logger.info("Requesting hub firmware version...");
        this._requestHubPropertyValue(HubProperty.FW_VERSION);
        await this._delay(100);

        logger.info("Requesting battery level...");
        this._requestHubPropertyValue(HubProperty.BATTERY_VOLTAGE);
        await this._delay(100);

        logger.info("Requesting RSSI...");
        this._requestHubPropertyValue(HubProperty.RSSI);
        await this._delay(100);

        // Enable button updates
        logger.info("Enabling button updates...");
        this._enableHubPropertyReports(HubProperty.BUTTON);
        await this._delay(100);

        // Enable battery updates
        logger.info("Enabling battery updates...");
        this._enableHubPropertyReports(HubProperty.BATTERY_VOLTAGE);
        await this._delay(100);

        // Enable RSSI updates
        logger.info("Enabling RSSI updates...");
        this._enableHubPropertyReports(HubProperty.RSSI);
        await this._delay(100);

        // Enable alert updates
        logger.info("Enabling alert updates...");
        this._enableAlertReports(Alert.LOW_VOLTAGE);
        await this._delay(50);
        this._enableAlertReports(Alert.HIGH_CURRENT);
        await this._delay(50);
        this._enableAlertReports(Alert.OVER_POWER_CONDITION);
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
      logger.info("Disconnecting Powered Up Hub...");
      
      if (this._pingIntervalId) {
        clearInterval(this._pingIntervalId);
        this._pingIntervalId = null;
      }

      await this._connection.disconnect();
      
      this._devices = {};
      this._ports = {};
      this._portModes = {};
      
      logger.info("✓ Powered Up Hub disconnected");
    }

    isConnected() {
      return this._connection.isConnected();
    }

    getDevice(portId) {
      return this._devices[portId];
    }

    getMotor(portId) {
      const device = this._devices[portId];
      return device instanceof PoweredUpMotor ? device : null;
    }

    getSensor(portId) {
      const device = this._devices[portId];
      return device instanceof PoweredUpSensor ? device : null;
    }

    getLED(portId) {
      const device = this._devices[portId];
      return device instanceof PoweredUpLED ? device : null;
    }

    getMatrix(portId) {
      const device = this._devices[portId];
      return device instanceof PoweredUp3x3Matrix ? device : null;
    }

    getConnectedDevices() {
      return Object.values(this._devices);
    }

    getConnectedPorts() {
      return Object.keys(this._devices);
    }

    async _setInputMode(portId, mode) {
      if (this._portModes[portId] === mode) {
        return;
      }

      logger.debug(`Setting port ${portId} to mode ${mode}`);
      
      const cmd = [
        0x0a,
        0x00,
        Message.PORT_INPUT_FORMAT_SETUP_SINGLE,
        portId,
        mode,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
      ];

      await this.send(PoweredUpBLE.characteristic, new Uint8Array(cmd));
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
        Message.OUTPUT,
        portID,
        execution,
        subCommand,
      ].concat(payload);
      cmd[0] = cmd.length;
      
      logger.trace(`Generated output command for port ${portID}:`, cmd);
      return new Uint8Array(cmd);
    }

    setHubLED(rgbDecimal) {
        logger.debug(`Setting Hub LED to color: ${rgbDecimal.toString(16)}`);
        
        // Find the hub LED port (usually port 50 or 0x32, but can vary)
        let ledPort = null;
        for (const [port, deviceType] of Object.entries(this._ports)) {
            if (deviceType === DeviceType.HUB_LED) {
            ledPort = parseInt(port);
            break;
            }
        }

        if (ledPort === null) {
            // Try common LED port locations
            const commonLEDPorts = [0x32, 50, 0x17, 23];
            for (const port of commonLEDPorts) {
            if (this._ports[port] === DeviceType.HUB_LED) {
                ledPort = port;
                break;
            }
            }
        }

        if (ledPort === null) {
            logger.warn("Hub LED not found on any port");
            return;
        }
        
        const cmd = this.generateOutputCommand(
            ledPort,
            OutputExecution.EXECUTE_IMMEDIATELY,
            OutputSubCommand.WRITE_DIRECT_MODE_DATA,
            [0x00, rgbDecimal >> 16, (rgbDecimal >> 8) & 0xff, rgbDecimal & 0xff]
        );
        
        this.send(PoweredUpBLE.characteristic, cmd);
        }

    shutdown() {
      logger.info("Shutting down hub...");
      
      const cmd = [
        0x04,
        0x00,
        Message.HUB_ACTIONS,
        HubAction.SWITCH_OFF_HUB,
      ];
      
      this.send(PoweredUpBLE.characteristic, new Uint8Array(cmd));
    }

    _requestHubPropertyValue(property) {
      logger.debug(`Requesting hub property: ${property}`);
      
      const cmd = [
        0x05,
        0x00,
        Message.HUB_PROPERTIES,
        property,
        HubPropertyOperation.REQUEST_UPDATE,
      ];
      
      this.send(PoweredUpBLE.characteristic, new Uint8Array(cmd));
    }

    _enableHubPropertyReports(property) {
      logger.debug(`Enabling reports for hub property: ${property}`);
      
      const cmd = [
        0x05,
        0x00,
        Message.HUB_PROPERTIES,
        property,
        HubPropertyOperation.ENABLE_UPDATES,
      ];
      
      this.send(PoweredUpBLE.characteristic, new Uint8Array(cmd));
    }

    _enableAlertReports(alert) {
      logger.debug(`Enabling reports for alert: ${alert}`);
      
      const cmd = [
        0x05,
        0x00,
        Message.HUB_ALERTS,
        alert,
        AlertOperation.ENABLE_UPDATES,
      ];
      
      this.send(PoweredUpBLE.characteristic, new Uint8Array(cmd));
    }

    _startPing() {
      this._pingIntervalId = setInterval(() => {
        this._requestHubPropertyValue(HubProperty.RSSI);
      }, PoweredUpPingInterval);
      
      logger.debug("Ping interval started");
    }

    _onMessage(data) {
      logger.trace("Processing message:", Array.from(data));
      
      const messageType = data[2];

      switch (messageType) {
        case Message.HUB_ATTACHED_IO:
          this._handleDeviceAttached(data);
          break;
        case Message.HUB_PROPERTIES:
          this._handleHubProperties(data);
          break;
        case Message.HUB_ALERTS:
          this._handleHubAlerts(data);
          break;
        case Message.PORT_VALUE:
          this._handlePortValue(data);
          break;
        case Message.PORT_FEEDBACK:
          this._handlePortFeedback(data);
          break;
        case Message.ERROR:
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
      logger.debug(`Event: ${event}, Device type: ${deviceType} (${DeviceTypeName[deviceType] || "Unknown"})`);

      if (event === IOEvent.ATTACHED) {
        this._ports[portId] = deviceType;

        // Create appropriate device object
        if (isMotor(deviceType)) {
          logger.info(`Motor attached: ${DeviceTypeName[deviceType]}`);
          this._devices[portId] = new PoweredUpMotor(this, portId, deviceType);
          
          // Enable position updates for motors with tacho
          if (hasTacho(deviceType)) {
            this._setInputMode(portId, Mode.MOTOR_POSITION);
          }
        } else if (deviceType === DeviceType.COLOR_DISTANCE_SENSOR) {
          logger.info("Boost Color & Distance Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.COLOR);
        } else if (deviceType === DeviceType.SPIKE_COLOR_SENSOR) {
          logger.info("SPIKE Prime Color Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.COLOR);
        } else if (deviceType === DeviceType.SPIKE_ULTRASONIC_SENSOR) {
          logger.info("SPIKE Prime Distance Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.DISTANCE);
        } else if (deviceType === DeviceType.SPIKE_FORCE_SENSOR) {
          logger.info("SPIKE Prime/Technic Force Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.FORCE);
        } else if (deviceType === DeviceType.EXTERNAL_TILT_SENSOR) {
          logger.info("WeDo 2.0 Tilt Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.TILT_ANGLE);
        } else if (deviceType === DeviceType.MOTION_SENSOR) {
          logger.info("WeDo 2.0 Motion Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.MOTION_DISTANCE);
        } else if (deviceType === DeviceType.INTERNAL_TILT) {
          logger.info("Internal Tilt Sensor attached");
          this._devices[portId] = new PoweredUpSensor(this, portId, deviceType);
          this._setInputMode(portId, Mode.TILT_ANGLE);
        } else if (deviceType === DeviceType.LIGHT) {
          logger.info("Powered Up LED Light attached");
          this._devices[portId] = new PoweredUpLED(this, portId, deviceType);
        } else if (deviceType === DeviceType.SPIKE_3x3_COLOR_LIGHT_MATRIX) {
          logger.info("SPIKE 3x3 Color Matrix attached");
          this._devices[portId] = new PoweredUp3x3Matrix(this, portId, deviceType);
        } else if (deviceType === DeviceType.HUB_LED) {
          logger.info("Hub LED registered");
          this._devices[portId] = new PoweredUpLED(this, portId, deviceType);
        } else {
          logger.debug(`Unknown device type: ${deviceType}`);
          this._devices[portId] = new PoweredUpDevice(this, portId, deviceType);
        }
      } else if (event === IOEvent.DETACHED) {
        logger.info(`Device detached from port ${portId}`);
        delete this._devices[portId];
        delete this._ports[portId];
        delete this._portModes[portId];
      }

      logger.groupEnd();
    }

    _handleHubProperties(data) {
      const property = data[3];
      const operation = data[4];

      if (operation !== HubPropertyOperation.UPDATE) {
        return;
      }

      switch (property) {
        case HubProperty.SYSTEM_TYPE_ID:
          this.hubType = data[5];
            this.hubName = HubTypeName[this.hubType] || "Unknown Hub";
            logger.info(`Hub type: ${this.hubName} (ID: ${this.hubType})`);
            break;
        case HubProperty.BUTTON:
          this.hubStatus.buttonPressed = data[5] === 1;
          logger.debug(`Button pressed: ${this.hubStatus.buttonPressed}`);
          break;
        case HubProperty.BATTERY_VOLTAGE:
          this.hubStatus.batteryLevel = data[5];
          logger.debug(`Battery level: ${this.hubStatus.batteryLevel}%`);
          break;
        case HubProperty.RSSI:
          this.hubStatus.rssi = -(256 - data[5]);
          logger.trace(`RSSI: ${this.hubStatus.rssi} dBm`);
          break;
        case HubProperty.FW_VERSION:
          const version = int32ArrayToNumber([data[5], data[6], data[7], data[8]]);
          this.hubStatus.fwVersion = decodeVersion(version);
          logger.info(`Firmware version: ${this.hubStatus.fwVersion}`);
          break;
      }
    }

    _handleHubAlerts(data) {
      const alert = data[3];
      const operation = data[4];

      if (operation !== AlertOperation.UPDATE) {
        return;
      }

      switch (alert) {
        case Alert.LOW_VOLTAGE:
          this.hubStatus.lowVoltage = data[5] === 0xff;
          logger.warn(`Low voltage alert: ${this.hubStatus.lowVoltage}`);
          break;
        case Alert.HIGH_CURRENT:
          this.hubStatus.highCurrent = data[5] === 0xff;
          logger.warn(`High current alert: ${this.hubStatus.highCurrent}`);
          break;
        case Alert.OVER_POWER_CONDITION:
          this.hubStatus.overPower = data[5] === 0xff;
          logger.warn(`Over power alert: ${this.hubStatus.overPower}`);
          break;
      }
    }

    _handlePortValue(data) {
      const portId = data[3];
      const deviceType = this._ports[portId];
      const device = this._devices[portId];

      if (!device) {
        return;
      }

      const mode = this._portModes[portId];

      // Handle different device types
      switch (deviceType) {
        case DeviceType.INTERNAL_TILT:
        case DeviceType.EXTERNAL_TILT_SENSOR:
        case DeviceType.MOVE_HUB_TILT_SENSOR: 
        case DeviceType.TECHNIC_MEDIUM_HUB_TILT_SENSOR:
          if (mode === Mode.TILT_ANGLE) {
            this.tiltX = data[4] > 127 ? data[4] - 256 : data[4];
            this.tiltY = data[5] > 127 ? data[5] - 256 : data[5];
            // Check if Z axis is available (some sensors have 3 axes)
            if (data.length > 6) {
            this.tiltZ = data[6] > 127 ? data[6] - 256 : data[6];
            }
            logger.trace(`Tilt: X=${this.tiltX}, Y=${this.tiltY}, Z=${this.tiltZ}`);
            device.setValue("tiltX", this.tiltX);
            device.setValue("tiltY", this.tiltY);
            device.setValue("tiltZ", this.tiltZ);
        }
        break;

        case DeviceType.COLOR_DISTANCE_SENSOR:
        case DeviceType.SPIKE_COLOR_SENSOR:
        case DeviceType.TECHNIC_COLOR_SENSOR:
          switch (mode) {
            case Mode.COLOR:
              const colorValue = data[4];
              const color = IndexToColor[colorValue] || Color.NONE;
              device.setValue("color", color);
              logger.trace(`Color: ${color} (${colorValue})`);
              break;
            case Mode.DISTANCE:
              const distance = data[4];
              device.setValue("distance", distance);
              logger.trace(`Distance: ${distance}`);
              break;
            case Mode.REFLECTION:
              const reflection = data[4];
              device.setValue("reflection", reflection);
              logger.trace(`Reflection: ${reflection}`);
              break;
          }
          break;

        case DeviceType.SPIKE_ULTRASONIC_SENSOR:
        case DeviceType.TECHNIC_DISTANCE_SENSOR:
          if (mode === Mode.DISTANCE) {
            // SPIKE sensors report in millimeters as int16
            const distanceMM = data[4] | (data[5] << 8);
            const distanceCM = distanceMM / 10;  // Convert to cm for consistency
            device.setValue("distance", distanceCM);
            logger.trace(`Distance: ${distanceCM} cm (${distanceMM} mm)`);
        }
        break;

        case DeviceType.MOTION_SENSOR:
          if (mode === Mode.MOTION_DISTANCE) {
            const distance = data[4];
            device.setValue("distance", distance);
            logger.trace(`Motion distance: ${distance}`);
          }
          break;

        case DeviceType.SPIKE_FORCE_SENSOR:
          switch (mode) {
            case Mode.FORCE:
              const force = Math.round(data[4] * 10) / 10;
              device.setValue("force", force);
              logger.trace(`Force: ${force}N`);
              break;
            case Mode.TOUCHED:
              const touched = data[4] === 1;
              device.setValue("touched", touched);
              logger.trace(`Touched: ${touched}`);
              break;
          }
          break;

        default:
          // Handle motors with tacho
          if (isMotor(deviceType) && hasTacho(deviceType)) {
            const motor = device;
            if (mode === Mode.MOTOR_POSITION) {
              const position = int32ArrayToNumber([data[4], data[5], data[6], data[7]]);
              motor.position = position;
              logger.trace(`Motor ${portId} position: ${position}`);
            }
          }
      }
    }

    _handlePortFeedback(data) {
      const portId = data[3];
      const feedback = data[4];
      
      logger.trace(`Port ${portId} feedback: ${feedback}`);

      switch (feedback) {
        case PortFeedback.COMPLETED:
          logger.debug(`Port ${portId} command completed`);
          break;
        case PortFeedback.DISCARDED:
          logger.warn(`Port ${portId} command discarded`);
          break;
        case PortFeedback.BUSY_OR_FULL:
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

  class LEGOPoweredUpExtension {
    constructor(runtime) {
      logger.info("=".repeat(60));
      logger.info("LEGO Powered Up Unified Extension");
      logger.info("=".repeat(60));
      
      // Get runtime - try multiple sources
      this._runtime = runtime;
      
      // If runtime not passed, try to get it from Scratch global
      if (!this._runtime && typeof Scratch !== "undefined" && Scratch.vm) {
        this._runtime = Scratch.vm.runtime;
        logger.info("Got runtime from Scratch.vm.runtime");
      }
      
      // Last resort - try vm global
      if (!this._runtime && typeof vm !== "undefined") {
        this._runtime = vm.runtime;
        logger.info("Got runtime from vm.runtime");
      }
      
      logger.info("Runtime available:", !!this._runtime);
      
      this._hub = null;
      this._connectionType = ConnectionType.SCRATCH_LINK;
      this._bridgeUrl = "http://localhost:8080";
      
      logger.info("Extension initialized");
    }

    getInfo() {
      return {
        id: "legopoweredup",
        name: "LEGO Powered Up",
        color1: "#FF6D01",
        color2: "#F05A24",
        color3: "#E0491D",
        blockIconURI: iconURI,
        showStatusButton: true,
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
            text: "connect to hub",
          },
          {
            opcode: "disconnect",
            blockType: BlockType.COMMAND,
            text: "disconnect from hub",
          },
          {
            opcode: "isConnected",
            blockType: BlockType.BOOLEAN,
            text: "connected?",
          },

          "---",

          // Hub info blocks
          {
            opcode: "getHubType",
            blockType: BlockType.REPORTER,
            text: "hub type",
          },
          {
            opcode: "getConnectedDevices",
            blockType: BlockType.REPORTER,
            text: "connected devices",
          },
          {
            opcode: "getDeviceOnPort",
            blockType: BlockType.REPORTER,
            text: "device on port [PORT]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
            },
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
            text: "turn motor [PORT] on",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "motorOff",
            blockType: BlockType.COMMAND,
            text: "turn motor [PORT] off",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "motorOnFor",
            blockType: BlockType.COMMAND,
            text: "turn motor [PORT] on for [TIME] seconds",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "turn motor [PORT] on for [DEGREES] degrees",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "set motor [PORT] power to [POWER]%",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "set motor [PORT] direction to [DIRECTION]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "motorDirection",
                defaultValue: MotorDirection.FORWARD,
              },
            },
          },
          {
            opcode: "setMotorStopAction",
            blockType: BlockType.COMMAND,
            text: "set motor [PORT] stop action to [ACTION]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "set motor [PORT] acceleration to [TIME] ms",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "set motor [PORT] deceleration to [TIME] ms",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "reset motor [PORT] position to [POSITION]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
            text: "motor [PORT] position",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
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
                menu: "portLabel",
                defaultValue: "C",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: Color.ANY,
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
                menu: "portLabel",
                defaultValue: "C",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: Color.RED,
              },
            },
          },
          {
            opcode: "getColor",
            blockType: BlockType.REPORTER,
            text: "color sensor [PORT] color",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "C",
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
                menu: "portLabel",
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
                menu: "portLabel",
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
                menu: "portLabel",
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
                menu: "portLabel",
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
                menu: "portLabel",
                defaultValue: "C",
              },
            },
          },

          "---",

          // Tilt sensor blocks
          {
            opcode: "whenTilted",
            blockType: BlockType.HAT,
            text: "when tilted [DIRECTION]",
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirectionAny",
                defaultValue: TiltDirection.ANY,
              },
            },
          },
          {
            opcode: "isTilted",
            blockType: BlockType.BOOLEAN,
            text: "tilted [DIRECTION]?",
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirectionAny",
                defaultValue: TiltDirection.ANY,
              },
            },
          },
          {
            opcode: "getTiltAngle",
            blockType: BlockType.REPORTER,
            text: "tilt angle [DIRECTION]",
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirection",
                defaultValue: TiltDirection.UP,
              },
            },
          },

          "---",

          // LED blocks
          {
            opcode: "setHubLED",
            blockType: BlockType.COMMAND,
            text: "set hub LED to [HUE]",
            arguments: {
              HUE: {
                type: ArgumentType.NUMBER,
                defaultValue: 50,
              },
            },
          },
          {
            opcode: "setLEDBrightness",
            blockType: BlockType.COMMAND,
            text: "set LED [PORT] brightness to [BRIGHTNESS]%",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
              BRIGHTNESS: {
                type: ArgumentType.NUMBER,
                defaultValue: 100,
              },
            },
          },

          "---",

          // 3x3 Matrix blocks
          {
            opcode: "setMatrixPixel",
            blockType: BlockType.COMMAND,
            text: "set matrix [PORT] pixel [INDEX] to [COLOR]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
              INDEX: {
                type: ArgumentType.NUMBER,
                defaultValue: 0,
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: Color.RED,
              },
            },
          },
          {
            opcode: "setMatrixAll",
            blockType: BlockType.COMMAND,
            text: "set matrix [PORT] all pixels to [COLOR]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
              COLOR: {
                type: ArgumentType.STRING,
                menu: "color",
                defaultValue: Color.RED,
              },
            },
          },
          {
            opcode: "clearMatrix",
            blockType: BlockType.COMMAND,
            text: "clear matrix [PORT]",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "portLabel",
                defaultValue: "A",
              },
            },
          },

          "---",

          // Hub control blocks
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
          portLabel: {
            acceptReporters: true,
            items: ["A", "B", "C", "D", "E", "F"],
          },
          motorDirection: {
            acceptReporters: false,
            items: [
              MotorDirection.FORWARD,
              MotorDirection.BACKWARD,
              MotorDirection.REVERSE,
            ],
          },
          stopAction: {
            acceptReporters: false,
            items: ["float", "brake", "hold"],
          },
          color: {
            acceptReporters: false,
            items: [
              Color.ANY,
              Color.RED,
              Color.GREEN,
              Color.BLUE,
              Color.YELLOW,
              Color.CYAN,
              Color.ORANGE,
              Color.PURPLE,
              Color.WHITE,
              Color.BLACK,
              Color.PINK,
              Color.LIGHTBLUE,
              Color.BROWN,
            ],
          },
          tiltDirection: {
            acceptReporters: false,
            items: [
              TiltDirection.UP,
              TiltDirection.DOWN,
              TiltDirection.LEFT,
              TiltDirection.RIGHT,
            ],
          },
          tiltDirectionAny: {
            acceptReporters: false,
            items: [
              TiltDirection.ANY,
              TiltDirection.UP,
              TiltDirection.DOWN,
              TiltDirection.LEFT,
              TiltDirection.RIGHT,
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
        if (this._hub && this._hub.isConnected()) {
          logger.warn("Already connected");
          return;
        }

        logger.info(`Connection type: ${this._connectionType}`);
        
        // Pass runtime and extensionId to hub
        this._hub = new PoweredUpHub(
          this._runtime,
          "legopoweredup",  // Must match the id in getInfo()
          this._connectionType,
          this._bridgeUrl
        );
        
        await this._hub.connect();
        logger.info("✓ Successfully connected");
      } catch (error) {
        logger.error("Connection failed:", error);
        this._hub = null;
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    async disconnect() {
      logger.group("=== DISCONNECT ===");
      try {
        if (!this._hub) {
          logger.warn("Not connected");
          return;
        }

        await this._hub.disconnect();
        this._hub = null;
        logger.info("✓ Disconnected");
      } catch (error) {
        logger.error("Disconnect failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    isConnected() {
      const connected = this._hub && this._hub.isConnected();
      logger.trace(`Connection status: ${connected}`);
      return connected;
    }

    // ========================================================================
    // HUB INFO BLOCKS
    // ========================================================================

    getHubType() {
      if (!this._ensureConnected()) return "Not connected";
      return this._hub.hubName;
    }

    getConnectedDevices() {
      if (!this._ensureConnected()) return "Not connected";
      
      const devices = this._hub.getConnectedDevices();
      if (devices.length === 0) {
        return "No devices";
      }
      
      return devices.map(d => `Port ${d.portId}: ${d.deviceName}`).join(", ");
    }

    getDeviceOnPort(args) {
      if (!this._ensureConnected()) return "Not connected";
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return "Invalid port";
      
      const device = this._hub.getDevice(portId);
      if (!device) return "No device";
      
      return device.deviceName;
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
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.turnOnForever();
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    motorOff(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.turnOff();
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    motorOnFor(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (!motor) return;
      
      const time = Cast.toNumber(args.TIME) * 1000;
      motor.turnOnFor(time);

      return new Promise((resolve) => {
        setTimeout(() => resolve(), time + PoweredUpBLE.sendInterval);
      });
    }

    motorOnForDegrees(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (!motor) return;
      
      const degrees = Cast.toNumber(args.DEGREES);
      motor.turnOnForDegrees(degrees);

      // Estimate time
      const estimatedTime = (Math.abs(degrees) / 360) * 1000 * (100 / motor.power);
      return new Promise((resolve) => {
        setTimeout(() => resolve(), estimatedTime);
      });
    }

    // ========================================================================
    // MOTOR SETTINGS BLOCKS
    // ========================================================================

    setMotorPower(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.power = MathUtil.clamp(Cast.toNumber(args.POWER), 0, 100);
        
        if (motor.status === MotorState.ON_FOREVER) {
          motor.turnOnForever();
        } else if (motor.status === MotorState.ON_FOR_TIME) {
          motor.turnOnFor(
            motor.pendingDurationTimeoutStartTime +
              motor.pendingDurationTimeoutDelay -
              Date.now()
          );
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    setMotorDirection(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        switch (args.DIRECTION) {
          case MotorDirection.FORWARD:
            motor.direction = 1;
            break;
          case MotorDirection.BACKWARD:
            motor.direction = -1;
            break;
          case MotorDirection.REVERSE:
            motor.direction = -motor.direction;
            break;
        }

        if (motor.status === MotorState.ON_FOREVER) {
          motor.turnOnForever();
        } else if (motor.status === MotorState.ON_FOR_TIME) {
          motor.turnOnFor(
            motor.pendingDurationTimeoutStartTime +
              motor.pendingDurationTimeoutDelay -
              Date.now()
          );
        }
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    setMotorStopAction(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        const stopModeMap = {
          float: MotorEndState.FLOAT,
          brake: MotorEndState.BRAKE,
          hold: MotorEndState.HOLD,
        };
        motor.stopMode = stopModeMap[args.ACTION] || MotorEndState.BRAKE;
      }
    }

    setMotorAcceleration(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.setAcceleration(Cast.toNumber(args.TIME));
      }
    }

    setMotorDeceleration(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.setDeceleration(Cast.toNumber(args.TIME));
      }
    }

    resetMotorPosition(args) {
      if (!this._ensureConnected()) return;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        motor.resetPosition(Cast.toNumber(args.POSITION));
      }
    }

    getMotorPosition(args) {
      if (!this._ensureConnected()) return 0;
      
      const motor = this._getMotor(args.PORT);
      if (motor) {
        return MathUtil.wrapClamp(motor.position, 0, 360);
      }
      return 0;
    }

    // ========================================================================
    // SENSOR BLOCKS
    // ========================================================================

    async whenColor(args) {
      if (!this._ensureConnected()) return false;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return false;

      await this._hub._setInputMode(portId, Mode.COLOR);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return false;

      const currentColor = sensor.getValue("color");
      
      if (args.COLOR === Color.ANY) {
        return currentColor !== Color.NONE;
      }
      return currentColor === args.COLOR;
    }

    async seeingColor(args) {
      return this.whenColor(args);
    }

    async getColor(args) {
      if (!this._ensureConnected()) return Color.NONE;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return Color.NONE;

      await this._hub._setInputMode(portId, Mode.COLOR);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return Color.NONE;

      return sensor.getValue("color") || Color.NONE;
    }

    async getDistance(args) {
      if (!this._ensureConnected()) return 0;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return 0;

      await this._hub._setInputMode(portId, Mode.DISTANCE);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return 0;

      return sensor.getValue("distance") || 0;
    }

    async getReflection(args) {
      if (!this._ensureConnected()) return 0;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return 0;

      await this._hub._setInputMode(portId, Mode.REFLECTION);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return 0;

      return sensor.getValue("reflection") || 0;
    }

    async getForce(args) {
      if (!this._ensureConnected()) return 0;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return 0;

      await this._hub._setInputMode(portId, Mode.FORCE);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return 0;

      return sensor.getValue("force") || 0;
    }

    async isForceSensorPressed(args) {
      if (!this._ensureConnected()) return false;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return false;

      await this._hub._setInputMode(portId, Mode.TOUCHED);

      const sensor = this._hub.getSensor(portId);
      if (!sensor) return false;

      return sensor.getValue("touched") || false;
    }

    whenForceSensorPressed(args) {
      return this.isForceSensorPressed(args);
    }

    // ========================================================================
    // TILT BLOCKS
    // ========================================================================

    whenTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.DIRECTION);
    }

    isTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.DIRECTION);
    }

    getTiltAngle(args) {
      if (!this._ensureConnected()) return 0;
      return this._getTiltAngle(args.DIRECTION);
    }

    _isTilted(direction) {
      const TILT_THRESHOLD = 15;
      switch (direction) {
        case TiltDirection.ANY:
          return (
            Math.abs(this._hub.tiltX) >= TILT_THRESHOLD ||
            Math.abs(this._hub.tiltY) >= TILT_THRESHOLD
          );
        default:
          return this._getTiltAngle(direction) >= TILT_THRESHOLD;
      }
    }

    _getTiltAngle(direction) {
      switch (direction) {
        case TiltDirection.UP:
          return this._hub.tiltY > 90
            ? 256 - this._hub.tiltY
            : -this._hub.tiltY;
        case TiltDirection.DOWN:
          return this._hub.tiltY > 90
            ? this._hub.tiltY - 256
            : this._hub.tiltY;
        case TiltDirection.LEFT:
          return this._hub.tiltX > 90
            ? this._hub.tiltX - 256
            : this._hub.tiltX;
        case TiltDirection.RIGHT:
          return this._hub.tiltX > 90
            ? 256 - this._hub.tiltX
            : -this._hub.tiltX;
        default:
          return 0;
      }
    }

    // ========================================================================
    // LED BLOCKS
    // ========================================================================

    setHubLED(args) {
      if (!this._ensureConnected()) return;
      
      let inputHue = Cast.toNumber(args.HUE);
      inputHue = MathUtil.wrapClamp(inputHue, 0, 100);
      const hue = (inputHue * 360) / 100;

      const rgbObject = colorUtils.hsvToRgb({ h: hue, s: 1, v: 1 });
      const rgbDecimal = colorUtils.rgbToDecimal(rgbObject);

      this._hub.setHubLED(rgbDecimal);

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    setLEDBrightness(args) {
      if (!this._ensureConnected()) return;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return;

      const led = this._hub.getLED(portId);
      if (led) {
        led.setBrightness(Cast.toNumber(args.BRIGHTNESS));
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    // ========================================================================
    // 3x3 MATRIX BLOCKS
    // ========================================================================

    setMatrixPixel(args) {
      if (!this._ensureConnected()) return;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return;

      const matrix = this._hub.getMatrix(portId);
      if (matrix) {
        const colorIndex = ColorIndex[args.COLOR] || 0;
        matrix.setPixel(Cast.toNumber(args.INDEX), colorIndex);
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    setMatrixAll(args) {
      if (!this._ensureConnected()) return;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return;

      const matrix = this._hub.getMatrix(portId);
      if (matrix) {
        const colorIndex = ColorIndex[args.COLOR] || 0;
        matrix.setAllPixels(colorIndex);
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    clearMatrix(args) {
      if (!this._ensureConnected()) return;
      
      const portId = this._getPortId(args.PORT);
      if (portId === null) return;

      const matrix = this._hub.getMatrix(portId);
      if (matrix) {
        matrix.clear();
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(), PoweredUpBLE.sendInterval);
      });
    }

    // ========================================================================
    // HUB CONTROL BLOCKS
    // ========================================================================

    shutdown() {
      if (!this._ensureConnected()) return;
      this._hub.shutdown();
    }

    // ========================================================================
    // HUB STATUS BLOCKS
    // ========================================================================

    whenButtonPressed() {
      if (!this._ensureConnected()) return false;
      return this._hub.hubStatus.buttonPressed;
    }

    isButtonPressed() {
      if (!this._ensureConnected()) return false;
      return this._hub.hubStatus.buttonPressed;
    }

    getBatteryLevel() {
      if (!this._ensureConnected()) return 0;
      return this._hub.hubStatus.batteryLevel;
    }

    getFirmwareVersion() {
      if (!this._ensureConnected()) return "0.0.00.0000";
      return this._hub.hubStatus.fwVersion;
    }

    getRSSI() {
      if (!this._ensureConnected()) return 0;
      return this._hub.hubStatus.rssi;
    }

    whenBatteryLow() {
      if (!this._ensureConnected()) return false;
      return this._hub.hubStatus.lowVoltage;
    }

    whenMotorOverloaded() {
      if (!this._ensureConnected()) return false;
      return (
        this._hub.hubStatus.highCurrent ||
        this._hub.hubStatus.overPower
      );
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    _ensureConnected() {
      if (!this._hub || !this._hub.isConnected()) {
        logger.warn("Operation attempted while not connected");
        return false;
      }
      return true;
    }

    _getPortId(portLabel) {
      // Simple letter to number mapping (A=0, B=1, C=2, D=3, E=4, F=5)
      const label = Cast.toString(portLabel).toUpperCase();
      const charCode = label.charCodeAt(0);
      
      if (charCode >= 65 && charCode <= 70) { // A-F
        return charCode - 65;
      }
      
      // Try to parse as number
      const num = parseInt(label);
      if (!isNaN(num) && num >= 0 && num <= 255) {
        return num;
      }
      
      return null;
    }

    _getMotor(portLabel) {
      const portId = this._getPortId(portLabel);
      if (portId === null) {
        logger.warn(`Invalid port: ${portLabel}`);
        return null;
      }
      
      const motor = this._hub.getMotor(portId);
      if (!motor) {
        logger.warn(`No motor found on port ${portId}`);
        return null;
      }
      
      return motor;
    }
  }

  Scratch.extensions.register(new LEGOPoweredUpExtension());
  
  logger.info("🎉 LEGO Powered Up Unified Extension loaded successfully!");
})(Scratch);