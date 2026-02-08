// Name: LEGO WeDo 2.0 Universal
// ID: CrispStrobe/lego_wedo2_universal
// Description: Universal control for LEGO WeDo 2.0 sets (BLE/Scratch Link).
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // DEBUG LOGGER
  // ============================================================================
  
  class DebugLogger {
    constructor(prefix = "[LEGO WeDo 2.0]", enabled = true) {
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
  // CONSTANTS AND CONFIGURATION
  // ============================================================================

  const ConnectionType = {
    BLE: "ble",
    SCRATCH_LINK: "scratchlink",
  };

  const WeDo2BLE = {
    advertisementService: "00001523-1212-efde-1523-785feabcd123",
    ioService: "00004f0e-1212-efde-1523-785feabcd123",
    batteryService: "0000180f-0000-1000-8000-00805f9b34fb",
    
    attachedIO: "00001527-1212-efde-1523-785feabcd123",
    inputValues: "00001560-1212-efde-1523-785feabcd123",
    inputCommand: "00001563-1212-efde-1523-785feabcd123",
    outputCommand: "00001565-1212-efde-1523-785feabcd123",
    battery: "00002a19-0000-1000-8000-00805f9b34fb",
    button: "00001526-1212-efde-1523-785feabcd123",
    disconnect: "0000152e-1212-efde-1523-785feabcd123",
    
    sendRateMax: 20,
    sendInterval: 50,
  };

  const DeviceType = {
    MOTOR: 1,
    VOLTAGE_SENSOR: 20,
    CURRENT_SENSOR: 21,
    PIEZO: 22,
    RGB_LED: 23,
    TILT_SENSOR: 34,
    MOTION_SENSOR: 35,
  };

  const DeviceTypeName = {
    [DeviceType.MOTOR]: "WeDo 2.0 Motor",
    [DeviceType.VOLTAGE_SENSOR]: "Voltage Sensor",
    [DeviceType.CURRENT_SENSOR]: "Current Sensor",
    [DeviceType.PIEZO]: "Piezo Buzzer",
    [DeviceType.RGB_LED]: "RGB LED",
    [DeviceType.TILT_SENSOR]: "Tilt Sensor",
    [DeviceType.MOTION_SENSOR]: "Motion Sensor",
  };

  const Port = {
    A: 1,
    B: 2,
    PIEZO: 5,
    LED: 6,
  };

  const InputMode = {
    TILT: 0,
    MOTION: 0,
  };

  // ============================================================================
  // DEVICE CLASSES
  // ============================================================================

  class WeDo2Device {
    constructor(parent, portId, deviceType) {
      this._parent = parent;
      this._portId = portId;
      this._deviceType = deviceType;
      this._deviceName = DeviceTypeName[deviceType] || "Unknown Device";
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

  class WeDo2Motor extends WeDo2Device {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      
      this._power = 100;
      this._direction = 1;
      this._brakeTimeout = null;
      
      logger.debug(`Motor ${portId} initialized`);
    }

    get power() {
      return this._power;
    }

    set power(value) {
        const p = Math.max(0, Math.min(value, 100));
        // WeDo 2.0 motors respond best in the 30-100 range
        if (p === 0) {
            this._power = 0;
        } else {
            // Use Scratch's official mapping formula
            const delta = 100 / p;
            this._power = 30 + (70 / delta);
        }
        logger.debug(`Motor ${this._portId} power set to ${this._power}`);
        }

    get direction() {
      return this._direction;
    }

    set direction(value) {
      this._direction = value < 0 ? -1 : 1;
      logger.debug(`Motor ${this._portId} direction set to ${this._direction}`);
    }

    turnOn() {
      this._clearBrake();
      
      let effectivePower = 0;
      if (this._power > 0) {
        // Map 1-100 to WeDo's effective 30-100 range for better control
        effectivePower = Math.floor(30 + (0.7 * this._power)) * this._direction;
      }
      
      logger.debug(`Motor ${this._portId} turn on at ${effectivePower}`);
      
      const cmd = [this._portId, 1, 1, effectivePower & 0xFF];
      this._parent.send(WeDo2BLE.outputCommand, new Uint8Array(cmd));
    }

    turnOff() {
      this._clearBrake();
      
      logger.debug(`Motor ${this._portId} turn off (brake then float)`);
      
      // First brake
      const brakeCmd = [this._portId, 1, 1, 127];
      this._parent.send(WeDo2BLE.outputCommand, new Uint8Array(brakeCmd));
      
      // Then float after 1 second
      this._brakeTimeout = setTimeout(() => {
        const floatCmd = [this._portId, 1, 1, 0];
        this._parent.send(WeDo2BLE.outputCommand, new Uint8Array(floatCmd));
        logger.trace(`Motor ${this._portId} floated after brake`);
      }, 1000);
    }

    _clearBrake() {
      if (this._brakeTimeout) {
        clearTimeout(this._brakeTimeout);
        this._brakeTimeout = null;
      }
    }
  }

  class WeDo2Sensor extends WeDo2Device {
    constructor(parent, portId, deviceType) {
      super(parent, portId, deviceType);
      logger.debug(`Sensor ${portId} initialized: ${this._deviceName}`);
    }
  }

  // ============================================================================
  // CONNECTION ADAPTERS
  // ============================================================================

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

    async read(characteristic) {
      throw new Error("read() must be implemented by subclass");
    }

    isConnected() {
      return this._connected;
    }

    onMessage(callback) {
      this._onMessageCallback = callback;
    }
  }

  class BLEAdapter extends ConnectionAdapter {
    constructor() {
      super();
      this._device = null;
      this._server = null;
      this._characteristics = new Map();
      logger.info("BLE Adapter initialized");
    }

    async connect() {
      logger.group("BLE Connection");
      try {
        logger.info("Requesting Bluetooth device...");
        
        this._device = await navigator.bluetooth.requestDevice({
          filters: [
            {
              services: [WeDo2BLE.advertisementService],
            },
          ],
          optionalServices: [WeDo2BLE.ioService, WeDo2BLE.batteryService],
        });

        logger.info(`Device selected: ${this._device.name || "WeDo 2.0"}`);

        this._device.addEventListener("gattserverdisconnected", () => {
          logger.warn("Device disconnected");
          this._connected = false;
        });

        logger.info("Connecting to GATT server...");
        this._server = await this._device.gatt.connect();
        
        // Get services and characteristics
        logger.info("Getting services...");
        const services = await this._server.getPrimaryServices();
        
        for (const service of services) {
          logger.debug(`Found service: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            const uuid = char.uuid.toLowerCase();
            this._characteristics.set(uuid, char);
            logger.trace(`Registered characteristic: ${uuid}`);
            
            // Start notifications for input characteristics
            if (
              uuid.includes("1527") || // Attached IO
              uuid.includes("1560") || // Input Values
              uuid.includes("1526")    // Button
            ) {
              logger.debug(`Starting notifications for: ${uuid}`);
              await char.startNotifications();
              
              char.addEventListener("characteristicvaluechanged", (event) => {
                const data = new Uint8Array(event.target.value.buffer);
                logger.trace(`BLE notification from ${uuid}:`, Array.from(data));
                if (this._onMessageCallback) {
                  this._onMessageCallback(uuid, data);
                }
              });
            }
          }
        }

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
      this._characteristics.clear();
      logger.info("✓ BLE disconnected");
    }

    async send(characteristic, data) {
      if (!this._connected) {
        logger.error("Cannot send: not connected");
        throw new Error("Not connected");
      }
      
      const uuid = characteristic.toLowerCase();
      const char = this._characteristics.get(uuid);
      
      if (!char) {
        logger.error(`Characteristic not found: ${uuid}`);
        throw new Error(`Characteristic not found: ${uuid}`);
      }
      
      logger.trace(`Sending to ${uuid}:`, Array.from(data));
      await char.writeValue(data);
    }

    async read(characteristic) {
      if (!this._connected) {
        logger.error("Cannot read: not connected");
        throw new Error("Not connected");
      }
      
      const uuid = characteristic.toLowerCase();
      const char = this._characteristics.get(uuid);
      
      if (!char) {
        logger.error(`Characteristic not found: ${uuid}`);
        throw new Error(`Characteristic not found: ${uuid}`);
      }
      
      const value = await char.readValue();
      const data = new Uint8Array(value.buffer);
      logger.trace(`Read from ${uuid}:`, Array.from(data));
      return data;
    }
  }

  class ScratchLinkAdapter extends ConnectionAdapter {
    constructor(runtime, extensionId) {
      super();
      this._runtime = runtime;
      this._extensionId = extensionId;
      this._socket = null;
      this._requestId = 0;
      this._requests = new Map();
      this._connectResolve = null;
      this._connectReject = null;
      logger.info("Scratch Link Adapter initialized");
    }

    async connect() {
      logger.group("Scratch Link Connection");
      try {
        logger.info("Getting Scratch Link socket from runtime...");
        
        if (this._runtime && this._runtime.getScratchLinkSocket) {
          this._socket = this._runtime.getScratchLinkSocket("BLE");
          logger.info("✓ Got socket from runtime");
          
          this._socket.setOnOpen(this._onOpen.bind(this));
          this._socket.setOnClose(this._onClose.bind(this));
          this._socket.setOnError(this._onError.bind(this));
          this._socket.setHandleMessage(this._handleMessage.bind(this));
          
          logger.info("Opening socket...");
          this._socket.open();
          
          return new Promise((resolve, reject) => {
            this._connectResolve = resolve;
            this._connectReject = reject;
          });
        } else {
          throw new Error("Runtime does not support Scratch Link");
        }
      } catch (error) {
        logger.error("Scratch Link connection failed:", error);
        throw error;
      } finally {
        logger.groupEnd();
      }
    }

    _onOpen() {
      logger.info("✓ Socket opened, discovering devices...");
      
      this._sendRequest("discover", {
        filters: [
          {
            services: [WeDo2BLE.advertisementService],
          },
        ],
      })
        .then((device) => {
          logger.info(`Device discovered: ${device.name || "WeDo 2.0"}`);
          
          if (this._runtime) {
            this._runtime.emit(
              this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
              { [device.peripheralId]: device }
            );
          }
          
          return this._sendRequest("connect", { 
            peripheralId: device.peripheralId 
          });
        })
        .then(() => {
          logger.info("✓ Connected to device");
          
          // Start notifications for all input characteristics
          const notifications = [
            { serviceId: WeDo2BLE.ioService, characteristicId: WeDo2BLE.attachedIO },
            { serviceId: WeDo2BLE.ioService, characteristicId: WeDo2BLE.inputValues },
            { serviceId: WeDo2BLE.advertisementService, characteristicId: WeDo2BLE.button },
          ];
          
          return Promise.all(
            notifications.map(n => this._sendRequest("startNotifications", n))
          );
        })
        .then(() => {
          logger.info("✓ Notifications started");
          this._connected = true;
          
          if (this._runtime) {
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
          }
          
          if (this._connectResolve) {
            this._connectResolve(true);
            this._connectResolve = null;
          }
        })
        .catch((error) => {
          logger.error("Connection sequence failed:", error);
          if (this._connectReject) {
            this._connectReject(error);
            this._connectReject = null;
          }
        });
    }

    _onClose() {
      logger.warn("Socket closed");
      this._connected = false;
      
      if (this._runtime) {
        this._runtime.emit(
          this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR,
          {
            message: "Scratch lost connection to LEGO WeDo 2.0",
            extensionId: this._extensionId,
          }
        );
      }
    }

    _onError(error) {
      logger.error("Socket error:", error);
      
      if (this._runtime) {
        this._runtime.emit(
          this._runtime.constructor.PERIPHERAL_REQUEST_ERROR,
          {
            message: "Scratch lost connection to LEGO WeDo 2.0",
            extensionId: this._extensionId,
          }
        );
      }
      
      if (this._connectReject) {
        this._connectReject(error);
        this._connectReject = null;
      }
    }

    _handleMessage(message) {
      try {
        const json = typeof message === 'string' ? JSON.parse(message) : message;
        logger.trace("Scratch Link message:", json);

        if (json.jsonrpc === "2.0") {
          if (json.method === "characteristicDidChange") {
            const data = Base64Util.base64ToUint8Array(json.params.message);
            const uuid = json.params.characteristicId.toLowerCase();
            logger.trace(`Data received on ${uuid}:`, Array.from(data));
            if (this._onMessageCallback) {
              this._onMessageCallback(uuid, data);
            }
          } else if (json.id !== undefined) {
            const request = this._requests.get(json.id);
            if (request) {
              this._requests.delete(json.id);
              if (json.error) {
                request.reject(new Error(json.error.message));
              } else {
                request.resolve(json.result);
              }
            }
          }
        }
      } catch (error) {
        logger.error("Error handling message:", error);
      }
    }

    async disconnect() {
      logger.info("Disconnecting Scratch Link...");
      if (this._socket && this._socket.isOpen && this._socket.isOpen()) {
        this._socket.close();
      }
      this._socket = null;
      this._connected = false;
      this._requests.clear();
      logger.info("✓ Scratch Link disconnected");
    }

    async send(characteristic, data) {
      if (!this._connected || !this._socket) {
        logger.error("Cannot send: not connected");
        throw new Error("Not connected");
      }

      logger.trace(`Sending to ${characteristic}:`, Array.from(data));
      
      const base64 = Base64Util.uint8ArrayToBase64(data);
      
      // Determine service based on characteristic
      let serviceId = WeDo2BLE.ioService;
      if (characteristic.toLowerCase().includes("152")) {
        serviceId = WeDo2BLE.advertisementService;
      }
      
      return this._sendRequest("write", {
        serviceId: serviceId,
        characteristicId: characteristic,
        message: base64,
        encoding: "base64",
      });
    }

    async read(characteristic) {
      if (!this._connected || !this._socket) {
        logger.error("Cannot read: not connected");
        throw new Error("Not connected");
      }

      logger.trace(`Reading from ${characteristic}`);
      
      let serviceId = WeDo2BLE.batteryService;
      if (characteristic.toLowerCase().includes("152")) {
        serviceId = WeDo2BLE.advertisementService;
      }
      
      const result = await this._sendRequest("read", {
        serviceId: serviceId,
        characteristicId: characteristic,
      });
      
      const data = Base64Util.base64ToUint8Array(result.message);
      logger.trace(`Read from ${characteristic}:`, Array.from(data));
      return data;
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
        
        if (this._socket && this._socket.sendMessage) {
          this._socket.sendMessage(request);
        } else {
          reject(new Error("Socket not available"));
        }
      });
    }
  }

  // ============================================================================
  // WEDO 2.0 HUB
  // ============================================================================

  class WeDo2Hub {
    constructor(runtime, extensionId, connectionType) {
      logger.info(`Initializing WeDo 2.0 Hub with connection type: ${connectionType}`);
      
      this._runtime = runtime;
      this._extensionId = extensionId;
      this._connectionType = connectionType;
      
      this._connection = null;
      this._devices = {};
      this._ports = {};
      this._rateLimiter = new RateLimiter(WeDo2BLE.sendRateMax);
      this._heartbeatInterval = null;

      // Hub status
      this.hubStatus = {
        buttonPressed: false,
        batteryLevel: 100,
        lowVoltage: false,
      };

      // Sensor values (for quick access)
      this.tiltX = 0;
      this.tiltY = 0;
      this.distance = 0;

      // Bind methods
      this.reset = this.reset.bind(this);
      this._onConnect = this._onConnect.bind(this);
      
      // Register as peripheral extension
      if (this._runtime) {
        try {
          this._runtime.registerPeripheralExtension(extensionId, this);
          this._runtime.on("PROJECT_STOP_ALL", this.stopAll.bind(this));
          logger.info("✓ Registered as peripheral extension");
        } catch (error) {
          logger.warn("Could not register peripheral extension:", error);
        }
      }

      logger.info("WeDo 2.0 Hub initialized (waiting for scan)");
    }

    scan() {
      logger.info("============ SCAN CALLED ============");
      
      if (this._connection) {
        logger.info("Disconnecting existing connection");
        this._connection.disconnect();
      }

      switch (this._connectionType) {
        case ConnectionType.BLE:
          logger.info("Creating BLE adapter");
          this._connection = new BLEAdapter();
          break;
          
        case ConnectionType.SCRATCH_LINK:
          logger.info("Creating Scratch Link adapter");
          this._connection = new ScratchLinkAdapter(this._runtime, this._extensionId);
          break;
          
        default:
          throw new Error(`Invalid connection type: ${this._connectionType}`);
      }

      this._connection.onMessage((uuid, data) => this._onMessage(uuid, data));
      
      logger.info("Calling connection.connect()");
      return this.connect();
    }

    async connect() {
      logger.info("Connecting WeDo 2.0 Hub...");
      
      if (!this._connection) {
        throw new Error("No connection adapter - call scan() first");
      }
      
      await this._connection.connect();
      await this._initialize();
      logger.info("✓ WeDo 2.0 Hub connected and initialized");
    }

    async _initialize() {
        logger.group("Initializing Hub");
        try {
            // Set LED to RGB mode FIRST
            logger.info("Setting LED to RGB mode...");
            const ledCmd = new Uint8Array([
            1,                      // Command type
            2,                      // Setup single
            Port.LED,               // Port 6
            DeviceType.RGB_LED,     // Type 23 (0x17)
            1,                      // Mode 1 = RGB
            0, 0, 0, 0,            // Delta
            0,                      // Units
            0                       // Notifications disabled for LED
            ]);
            await this.send(WeDo2BLE.inputCommand, ledCmd);
            await this._delay(100);
            
            // Set LED to blue to indicate connected
            logger.info("Setting LED to blue...");
            await this.setLED(0x0000FF);
            await this._delay(100);

            // Start heartbeat for battery monitoring
            logger.info("Starting heartbeat...");
            this._startHeartbeat();

            logger.info("✓ Hub initialization complete");
        } catch (error) {
            logger.error("Hub initialization failed:", error);
            throw error;
        } finally {
            logger.groupEnd();
        }
        }

    async disconnect() {
      logger.info("Disconnecting WeDo 2.0 Hub...");
      
      if (this._heartbeatInterval) {
        clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = null;
      }

      // Send disconnect command
      try {
        const cmd = new Uint8Array([1]);
        await this.send(WeDo2BLE.disconnect, cmd);
      } catch (error) {
        logger.warn("Could not send disconnect command:", error);
      }

      if (this._connection) {
        await this._connection.disconnect();
      }
      
      this._devices = {};
      this._ports = {};
      
      logger.info("✓ WeDo 2.0 Hub disconnected");
    }

    isConnected() {
      return this._connection && this._connection.isConnected();
    }

    getDevice(portId) {
      return this._devices[portId];
    }

    getMotor(portId) {
      const device = this._devices[portId];
      return device instanceof WeDo2Motor ? device : null;
    }

    getSensor(portId) {
      const device = this._devices[portId];
      return device instanceof WeDo2Sensor ? device : null;
    }

    send(characteristic, data) {
      if (!this._rateLimiter.okayToSend()) {
        logger.trace("Rate limiter: message queued");
        // For critical commands, we might want to queue rather than drop
        // For now, we'll just drop non-critical messages
      }
      
      return this._connection.send(characteristic, data);
    }

    async setLED(rgb) {
      const r = (rgb >> 16) & 0xFF;
      const g = (rgb >> 8) & 0xFF;
      const b = rgb & 0xFF;
      
      logger.debug(`Setting LED to RGB(${r}, ${g}, ${b})`);
      
      const cmd = new Uint8Array([Port.LED, 4, 3, r, g, b]);
      await this.send(WeDo2BLE.outputCommand, cmd);
    }

    async playTone(frequency, duration) {
      logger.debug(`Playing tone: ${frequency}Hz for ${duration}ms`);
      
      const freqBytes = new Uint16Array([frequency]);
      const durBytes = new Uint16Array([duration]);
      
      const cmd = new Uint8Array([
        Port.PIEZO,
        2,
        4,
        freqBytes[0] & 0xFF,
        (freqBytes[0] >> 8) & 0xFF,
        durBytes[0] & 0xFF,
        (durBytes[0] >> 8) & 0xFF,
      ]);
      
      await this.send(WeDo2BLE.outputCommand, cmd);
    }

    stopAll() {
      if (!this.isConnected()) return;
      logger.info("Stopping all motors");
      
      Object.values(this._devices).forEach(device => {
        if (device instanceof WeDo2Motor) {
          device.turnOff();
        }
      });
    }

    getPeripheralIsConnected() {
      return this.isConnected();
    }

    reset() {
      logger.info("Resetting hub state");
      this._devices = {};
      this._ports = {};
      
      if (this._heartbeatInterval) {
        clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = null;
      }
      
      this.hubStatus = {
        buttonPressed: false,
        batteryLevel: 100,
      };
      this.tiltX = 0;
      this.tiltY = 0;
      this.distance = 0;
    }

    _startHeartbeat() {
        // Use 5 seconds like official Scratch extension
        this._heartbeatInterval = setInterval(async () => {
            if (this.isConnected()) {
            try {
                const batteryData = await this._connection.read(WeDo2BLE.battery);
                if (batteryData && batteryData.length > 0) {
                this.hubStatus.batteryLevel = batteryData[0];
                logger.trace(`Battery level: ${this.hubStatus.batteryLevel}%`);
                }
            } catch (error) {
                // Don't spam logs with heartbeat errors, just log once
                if (!this._heartbeatErrorLogged) {
                logger.warn("Heartbeat failed, will retry silently:", error);
                this._heartbeatErrorLogged = true;
                }
            }
            }
        }, 5000); // 5 seconds instead of 10
        
        logger.debug("Heartbeat started (5s interval)");
        }

    _onMessage(uuid, data) {
        logger.trace(`Processing message from ${uuid}:`, Array.from(data));
        
        const uuidLower = uuid.toLowerCase();
        
        // Attached IO - device connection/disconnection
        if (uuidLower.includes("1527")) {
            this._handleAttachedIO(data);
        }
        // Input Values - sensor data
        else if (uuidLower.includes("1560")) {
            this._handleInputValues(data);
        }
        // Button
        else if (uuidLower.includes("1526")) {
            this.hubStatus.buttonPressed = data[0] === 1;
            logger.debug(`Button pressed: ${this.hubStatus.buttonPressed}`);
        }
        // Low Voltage Alert - ADD THIS
        else if (uuidLower.includes("1528")) {
            this.hubStatus.lowVoltage = data[0] !== 0;
            if (this.hubStatus.lowVoltage) {
            logger.warn("Low voltage alert!");
            }
        }
        }

    _handleAttachedIO(data) {
      const portId = data[0];
      const event = data[1]; // 0 = detached, 1 = attached
      const deviceType = event === 0 ? null : data[3];

      logger.group(`Device event on port ${portId}`);
      logger.debug(`Event: ${event === 0 ? 'detached' : 'attached'}, Device type: ${deviceType}`);

      if (event === 1) {
        // Device attached
        this._ports[portId] = deviceType;

        if (deviceType === DeviceType.MOTOR) {
          logger.info(`Motor attached on port ${portId}`);
          this._devices[portId] = new WeDo2Motor(this, portId, deviceType);
        } else if (deviceType === DeviceType.TILT_SENSOR) {
          logger.info(`Tilt sensor attached on port ${portId}`);
          this._devices[portId] = new WeDo2Sensor(this, portId, deviceType);
          this._setupSensor(portId, deviceType);
        } else if (deviceType === DeviceType.MOTION_SENSOR) {
          logger.info(`Motion sensor attached on port ${portId}`);
          this._devices[portId] = new WeDo2Sensor(this, portId, deviceType);
          this._setupSensor(portId, deviceType);
        } else if (deviceType === DeviceType.RGB_LED) {
          logger.info(`RGB LED attached on port ${portId}`);
          this._devices[portId] = new WeDo2Device(this, portId, deviceType);
        } else {
          logger.debug(`Unknown device type: ${deviceType}`);
          this._devices[portId] = new WeDo2Device(this, portId, deviceType);
        }
      } else {
        // Device detached
        logger.info(`Device detached from port ${portId}`);
        delete this._devices[portId];
        delete this._ports[portId];
      }

      logger.groupEnd();
    }

    _handleInputValues(data) {
        const portId = data[1];
        const deviceType = this._ports[portId];

        if (!deviceType) {
            return;
        }

        const device = this._devices[portId];

        if (deviceType === DeviceType.TILT_SENSOR) {
            // WeDo 2.0 tilt sensor reports angles in range -45 to 45 (as 0-255)
            // Values > 45 are negative angles (256 - value)
            const rawX = data[2];
            const rawY = data[3];
            
            this.tiltX = rawX > 45 ? rawX - 256 : rawX;
            this.tiltY = rawY > 45 ? rawY - 256 : rawY;
            
            logger.trace(`Tilt: X=${this.tiltX}, Y=${this.tiltY}`);
            
            if (device) {
            device.setValue("tiltX", this.tiltX);
            device.setValue("tiltY", this.tiltY);
            }
        } else if (deviceType === DeviceType.MOTION_SENSOR) {
            // Enhanced distance with sub-unit precision
            let distance = data[2];
            
            // Check if there's a partial distance byte (for more precision)
            if (data.length > 3 && data[3] > 0) {
            distance += 1.0 / data[3];
            }
            
            this.distance = distance;
            logger.trace(`Distance: ${this.distance}`);
            
            if (device) {
            device.setValue("distance", this.distance);
            }
        }
        }

    async _setupSensor(portId, deviceType) {
      logger.debug(`Setting up sensor on port ${portId}, type ${deviceType}`);
      
      // Input format setup command
      // [length, command, port, type, mode, delta(4 bytes), units, notifications]
      const cmd = new Uint8Array([
        1,                    // Command type
        2,                    // Setup single
        portId,               // Port
        deviceType,           // Device type
        InputMode.TILT,       // Mode (0 for both tilt and motion)
        1, 0, 0, 0,          // Delta (1 = report all changes)
        0,                    // Units
        1,                    // Enable notifications
      ]);
      
      await this.send(WeDo2BLE.inputCommand, cmd);
      await this._delay(100);
    }

    _delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  // ============================================================================
  // EXTENSION CLASS
  // ============================================================================

  class LEGOWeDo2Extension {
    constructor(runtime) {
      logger.info("=".repeat(60));
      logger.info("LEGO WeDo 2.0 Unified Extension");
      logger.info("=".repeat(60));
      
      // Get runtime
      this._runtime = runtime;
      
      if (!this._runtime && typeof Scratch !== "undefined" && Scratch.vm) {
        this._runtime = Scratch.vm.runtime;
        logger.info("Got runtime from Scratch.vm.runtime");
      }
      
      if (!this._runtime && typeof vm !== "undefined") {
        this._runtime = vm.runtime;
        logger.info("Got runtime from vm.runtime");
      }
      
      logger.info("Runtime available:", !!this._runtime);
      
      this._hub = null;
      this._connectionType = ConnectionType.SCRATCH_LINK;
      
      logger.info("Extension initialized");
    }

    whenBatteryLow() {
        if (!this._ensureConnected()) return false;
        return this._hub.hubStatus.lowVoltage || this._hub.hubStatus.batteryLevel < 10;
        }

    getInfo() {
      return {
        id: "wedo2unified",
        name: "LEGO WeDo 2.0",
        color1: "#005595",
        color2: "#004577",
        color3: "#003559",
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
                defaultValue: ConnectionType.SCRATCH_LINK,
              },
            },
          },
          {
            opcode: "connect",
            blockType: BlockType.COMMAND,
            text: "connect to WeDo 2.0",
          },
          {
            opcode: "disconnect",
            blockType: BlockType.COMMAND,
            text: "disconnect from WeDo 2.0",
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

          "---",

          // Motor blocks
          {
            opcode: "motorOn",
            blockType: BlockType.COMMAND,
            text: "turn motor [PORT] on",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "motorPort",
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
                menu: "motorPort",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "setMotorPower",
            blockType: BlockType.COMMAND,
            text: "set motor [PORT] power to [POWER]%",
            arguments: {
              PORT: {
                type: ArgumentType.STRING,
                menu: "motorPort",
                defaultValue: "A",
              },
              POWER: {
                type: ArgumentType.NUMBER,
                defaultValue: 100,
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
                menu: "motorPort",
                defaultValue: "A",
              },
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "direction",
                defaultValue: "forward",
              },
            },
          },

          "---",

          // Sensor blocks
          {
            opcode: "getDistance",
            blockType: BlockType.REPORTER,
            text: "distance",
          },
          {
            opcode: "getTiltAngle",
            blockType: BlockType.REPORTER,
            text: "tilt angle [DIRECTION]",
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirection",
                defaultValue: "up",
              },
            },
          },
          {
            opcode: "whenTilted",
            blockType: BlockType.HAT,
            text: "when tilted [DIRECTION]",
            arguments: {
              DIRECTION: {
                type: ArgumentType.STRING,
                menu: "tiltDirectionAny",
                defaultValue: "any",
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
                defaultValue: "any",
              },
            },
          },

          "---",

          // LED and Sound blocks
          {
            opcode: "setLED",
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
            opcode: "playNote",
            blockType: BlockType.COMMAND,
            text: "play note [NOTE] for [DURATION] seconds",
            arguments: {
              NOTE: {
                type: ArgumentType.NUMBER,
                defaultValue: 60,
              },
              DURATION: {
                type: ArgumentType.NUMBER,
                defaultValue: 0.5,
              },
            },
          },

          "---",

          // Status blocks
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
        ],
        menus: {
          connectionType: {
            acceptReporters: false,
            items: [
              { text: "Web Bluetooth (Direct)", value: ConnectionType.BLE },
              { text: "Scratch Link", value: ConnectionType.SCRATCH_LINK },
            ],
          },
          debugLevel: {
            acceptReporters: false,
            items: ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"],
          },
          motorPort: {
            acceptReporters: false,
            items: [
              { text: "A", value: "A" },
              { text: "B", value: "B" },
              { text: "Both", value: "ALL" },
            ],
          },
          direction: {
            acceptReporters: false,
            items: ["forward", "backward", "reverse"],
          },
          tiltDirection: {
            acceptReporters: false,
            items: ["up", "down", "left", "right"],
          },
          tiltDirectionAny: {
            acceptReporters: false,
            items: ["any", "up", "down", "left", "right"],
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

    async connect() {
      logger.group("=== CONNECT ===");
      try {
        if (!this._hub) {
          logger.info(`Creating hub with connection type: ${this._connectionType}`);
          this._hub = new WeDo2Hub(
            this._runtime,
            "wedo2unified",
            this._connectionType
          );
        }
        
        if (!this._hub.isConnected()) {
          await this._hub.scan();
        }
        
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
    // DEBUG BLOCKS
    // ========================================================================

    setDebugLevel(args) {
      logger.setLevel(args.LEVEL);
      logger.info(`Debug level set to: ${args.LEVEL}`);
    }

    // ========================================================================
    // MOTOR BLOCKS
    // ========================================================================

    motorOn(args) {
        if (!this._ensureConnected()) return Promise.resolve();
        
        this._forEachMotor(args.PORT, (motor) => {
            motor.turnOn();
        });

        return new Promise((resolve) => {
            setTimeout(() => resolve(), WeDo2BLE.sendInterval);
        });
        }

        motorOff(args) {
        if (!this._ensureConnected()) return Promise.resolve();
        
        this._forEachMotor(args.PORT, (motor) => {
            motor.turnOff();
        });

        return new Promise((resolve) => {
            setTimeout(() => resolve(), WeDo2BLE.sendInterval);
        });
        }

    setMotorPower(args) {
      if (!this._ensureConnected()) return;
      
      const power = Cast.toNumber(args.POWER);
      
      this._forEachMotor(args.PORT, (motor) => {
        motor.power = power;
        motor.turnOn();
      });

      return new Promise((resolve) => {
        setTimeout(() => resolve(), WeDo2BLE.sendInterval);
      });
    }

    setMotorDirection(args) {
      if (!this._ensureConnected()) return;
      
      this._forEachMotor(args.PORT, (motor) => {
        switch (args.DIRECTION) {
          case "forward":
            motor.direction = 1;
            break;
          case "backward":
            motor.direction = -1;
            break;
          case "reverse":
            motor.direction = -motor.direction;
            break;
        }
      });
    }

    // ========================================================================
    // SENSOR BLOCKS
    // ========================================================================

    getDistance() {
      if (!this._ensureConnected()) return 0;
      return this._hub.distance;
    }

    getTiltAngle(args) {
      if (!this._ensureConnected()) return 0;
      return this._getTiltAngle(args.DIRECTION);
    }

    whenTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.DIRECTION);
    }

    isTilted(args) {
      if (!this._ensureConnected()) return false;
      return this._isTilted(args.DIRECTION);
    }

    // ========================================================================
    // LED AND SOUND BLOCKS
    // ========================================================================

    setLED(args) {
      if (!this._ensureConnected()) return;
      
      const hue = Cast.toNumber(args.HUE);
      const normalizedHue = ((hue % 100) + 100) % 100; // Wrap to 0-100
      const hueAngle = (normalizedHue * 360) / 100;

      // Convert HSV to RGB
      const h = hueAngle;
      const s = 1;
      const v = 1;
      
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

      const rgb = 
        (Math.round((r + m) * 255) << 16) |
        (Math.round((g + m) * 255) << 8) |
        Math.round((b + m) * 255);

      this._hub.setLED(rgb);

      return new Promise((resolve) => {
        setTimeout(() => resolve(), WeDo2BLE.sendInterval);
      });
    }

    playNote(args) {
      if (!this._ensureConnected()) return;
      
      const note = Cast.toNumber(args.NOTE);
      const duration = Cast.toNumber(args.DURATION) * 1000; // Convert to ms
      
      // Convert MIDI note to frequency
      const frequency = Math.round(440 * Math.pow(2, (note - 69) / 12));
      
      this._hub.playTone(frequency, duration);

      return new Promise((resolve) => {
        setTimeout(() => resolve(), duration + WeDo2BLE.sendInterval);
      });
    }

    // ========================================================================
    // STATUS BLOCKS
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

    _forEachMotor(portLabel, callback) {
      let ports = [];
      
      switch (portLabel) {
        case "A":
          ports = [Port.A];
          break;
        case "B":
          ports = [Port.B];
          break;
        case "ALL":
          ports = [Port.A, Port.B];
          break;
        default:
          logger.warn(`Invalid port label: ${portLabel}`);
          return;
      }

      for (const portId of ports) {
        const motor = this._hub.getMotor(portId);
        if (motor) {
          callback(motor);
        }
      }
    }

    _isTilted(direction) {
      const TILT_THRESHOLD = 15;
      
      switch (direction) {
        case "any":
          return (
            Math.abs(this._hub.tiltX) >= TILT_THRESHOLD ||
            Math.abs(this._hub.tiltY) >= TILT_THRESHOLD
          );
        default:
          return Math.abs(this._getTiltAngle(direction)) >= TILT_THRESHOLD;
      }
    }

    _getTiltAngle(direction) {
      switch (direction) {
        case "up":
          return -this._hub.tiltY;
        case "down":
          return this._hub.tiltY;
        case "left":
          return -this._hub.tiltX;
        case "right":
          return this._hub.tiltX;
        default:
          return 0;
      }
    }
  }

  Scratch.extensions.register(new LEGOWeDo2Extension());
  
  logger.info("🎉 LEGO WeDo 2.0 Unified Extension loaded successfully!");
})(Scratch);