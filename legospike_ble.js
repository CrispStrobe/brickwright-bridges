// Name: LEGO Spike Prime (BLE)
// ID: CrispStrobe/legospike_ble
// Description: Control Spike Prime via Bluetooth Low Energy (New Firmware).
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // Debug flag - set to true for extensive logging
  const DEBUG = false;

  // SPIKE Prime Protocol Constants
  const HUB_CONSTANTS = {
    SERVICE_UUID: "0000fd02-0000-1000-8000-00805f9b34fb",
    RX_UUID: "0000fd02-0001-1000-8000-00805f9b34fb",
    TX_UUID: "0000fd02-0002-1000-8000-00805f9b34fb",

    // Message types
    MSG_INFO_REQUEST: 0x00,
    MSG_INFO_RESPONSE: 0x01,
    MSG_TUNNEL: 0x32,
    MSG_DEVICE_NOTIFICATION_REQUEST: 0x28,
    MSG_DEVICE_NOTIFICATION_RESPONSE: 0x29,
    MSG_DEVICE_NOTIFICATION: 0x3c,

    // Device types
    DEVICE_BATTERY: 0x00,
    DEVICE_IMU: 0x01,
    DEVICE_MOTOR: 0x0a,
    DEVICE_FORCE_SENSOR: 0x0b,
    DEVICE_COLOR_SENSOR: 0x0c,
    DEVICE_DISTANCE_SENSOR: 0x0d,
    DEVICE_3X3_COLOR_MATRIX: 0x0e,

    // COBS constants
    MAX_BLOCK_SIZE: 84,
    COBS_CODE_OFFSET: 2,
  };

  const PORT_MAP = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
  const PORT_ID_TO_NAME = ["A", "B", "C", "D", "E", "F"];

  class SpikePrimeExtension {
    constructor() {
      console.log("🔧 [SPIKE Prime] Extension initialized");

      // Web Bluetooth connection
      this.device = null;
      this.server = null;
      this.rxCharacteristic = null;
      this.txCharacteristic = null;
      this.connected = false;

      // Hub state
      this.maxPacketSize = 20;
      this.maxChunkSize = 100;
      this.batteryLevel = 100;

      // Port data
      this.ports = {};
      PORT_ID_TO_NAME.forEach((p) => {
        this.ports[p] = {
          value: {
            position: 0,
            distance: 0,
            color: 255,
            force: 0,
            isPressed: false,
          },
        };
      });

      // IMU data
      this.imu = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        accX: 0,
        accY: 0,
        accZ: 0,
        faceUp: 0,
      };
    }

    getInfo() {
      return {
        id: "spikeprimeble",
        name: "SPIKE Prime",
        color1: "#FFD700",
        color2: "#D4AF37",
        blocks: [
          {
            opcode: "connectHub",
            blockType: Scratch.BlockType.COMMAND,
            text: "connect to SPIKE Prime",
          },
          {
            opcode: "disconnectHub",
            blockType: Scratch.BlockType.COMMAND,
            text: "disconnect",
          },
          {
            opcode: "isConnected",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "connected?",
          },
          "---",
          {
            opcode: "startMotor",
            blockType: Scratch.BlockType.COMMAND,
            text: "start motor [PORT] at [SPEED]%",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              SPEED: { type: Scratch.ArgumentType.NUMBER, defaultValue: 75 },
            },
          },
          {
            opcode: "stopMotor",
            blockType: Scratch.BlockType.COMMAND,
            text: "stop motor [PORT] with [ACTION]",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "STOP_ACTION",
                defaultValue: "brake",
              },
            },
          },
          {
            opcode: "getMotorPosition",
            blockType: Scratch.BlockType.REPORTER,
            text: "motor [PORT] position",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "A",
              },
            },
          },
          "---",
          {
            opcode: "setLightMatrixPixel",
            blockType: Scratch.BlockType.COMMAND,
            text: "set 3x3 light [PORT] pixel x:[X] y:[Y] brightness [BRIGHTNESS]%",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "C",
              },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              BRIGHTNESS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100,
              },
            },
          },
          "---",
          {
            opcode: "getDistance",
            blockType: Scratch.BlockType.REPORTER,
            text: "distance sensor [PORT] (mm)",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "B",
              },
            },
          },
          {
            opcode: "isForceSensorPressed",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "force sensor [PORT] pressed?",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "D",
              },
            },
          },
          {
            opcode: "getForceSensorValue",
            blockType: Scratch.BlockType.REPORTER,
            text: "force sensor [PORT] value (%)",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "D",
              },
            },
          },
          {
            opcode: "getColor",
            blockType: Scratch.BlockType.REPORTER,
            text: "color sensor [PORT] color",
            arguments: {
              PORT: {
                type: Scratch.ArgumentType.STRING,
                menu: "PORT",
                defaultValue: "E",
              },
            },
          },
          "---",
          {
            opcode: "getOrientation",
            blockType: Scratch.BlockType.REPORTER,
            text: "hub orientation [AXIS]",
            arguments: {
              AXIS: {
                type: Scratch.ArgumentType.STRING,
                menu: "ORIENTATION_AXIS",
                defaultValue: "yaw",
              },
            },
          },
          {
            opcode: "getAcceleration",
            blockType: Scratch.BlockType.REPORTER,
            text: "hub acceleration [AXIS]",
            arguments: {
              AXIS: {
                type: Scratch.ArgumentType.STRING,
                menu: "XYZ_AXIS",
                defaultValue: "x",
              },
            },
          },
          {
            opcode: "getFaceUp",
            blockType: Scratch.BlockType.REPORTER,
            text: "hub face up",
          },
          "---",
          {
            opcode: "getBatteryLevel",
            blockType: Scratch.BlockType.REPORTER,
            text: "battery level",
          },
        ],
        menus: {
          PORT: {
            acceptReporters: true,
            items: ["A", "B", "C", "D", "E", "F"],
          },
          STOP_ACTION: {
            acceptReporters: false,
            items: ["coast", "brake", "hold"],
          },
          ORIENTATION_AXIS: {
            acceptReporters: false,
            items: ["yaw", "pitch", "roll"],
          },
          XYZ_AXIS: { acceptReporters: false, items: ["x", "y", "z"] },
        },
      };
    }

    // ==================== CONNECTION ====================

    async connectHub() {
      console.log("🔌 [SPIKE Prime] Connect requested");

      if (!navigator.bluetooth) {
        alert(
          "Web Bluetooth not supported!\n\nMake sure you are:\n- Using TurboWarp Desktop\n- Running with --disable-sandbox flag",
        );
        return;
      }

      try {
        console.log("📱 [SPIKE Prime] Requesting device...");

        this.device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [HUB_CONSTANTS.SERVICE_UUID] }],
          optionalServices: [HUB_CONSTANTS.SERVICE_UUID],
        });

        console.log("✅ [SPIKE Prime] Device selected:", this.device.name);

        this.device.addEventListener("gattserverdisconnected", () => {
          console.log("🔌 [SPIKE Prime] Device disconnected");
          this.reset();
        });

        console.log("🔗 [SPIKE Prime] Connecting to GATT server...");
        this.server = await this.device.gatt.connect();
        console.log("✅ [SPIKE Prime] GATT connected");

        console.log("🔍 [SPIKE Prime] Getting service...");
        const service = await this.server.getPrimaryService(
          HUB_CONSTANTS.SERVICE_UUID,
        );
        console.log("✅ [SPIKE Prime] Service found");

        console.log("🔍 [SPIKE Prime] Getting characteristics...");
        this.rxCharacteristic = await service.getCharacteristic(
          HUB_CONSTANTS.RX_UUID,
        );
        this.txCharacteristic = await service.getCharacteristic(
          HUB_CONSTANTS.TX_UUID,
        );
        console.log("✅ [SPIKE Prime] Characteristics found");

        console.log("🔔 [SPIKE Prime] Starting notifications...");
        await this.txCharacteristic.startNotifications();
        this.txCharacteristic.addEventListener(
          "characteristicvaluechanged",
          this._onMessage.bind(this),
        );
        console.log("✅ [SPIKE Prime] Notifications started");

        this.connected = true;

        // Initialize hub
        await this._initializeHub();

        console.log("🎉 [SPIKE Prime] Fully connected!");
        alert("✅ Connected to SPIKE Prime!");
      } catch (error) {
        console.error("❌ [SPIKE Prime] Connection error:", error);
        if (error.name === "NotFoundError") {
          console.log("ℹ️  User cancelled");
        } else {
          alert("Connection failed: " + error.message);
        }
        this.reset();
      }
    }

    disconnectHub() {
      console.log("👋 [SPIKE Prime] Disconnecting...");
      if (this.device && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
      this.reset();
    }

    isConnected() {
      return this.connected && this.device && this.device.gatt.connected;
    }

    reset() {
      this.connected = false;
      this.device = null;
      this.server = null;
      this.rxCharacteristic = null;
      this.txCharacteristic = null;

      PORT_ID_TO_NAME.forEach((p) => {
        this.ports[p] = {
          value: {
            position: 0,
            distance: 0,
            color: 255,
            force: 0,
            isPressed: false,
          },
        };
      });

      this.batteryLevel = 100;
      this.imu = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        accX: 0,
        accY: 0,
        accZ: 0,
        faceUp: 0,
      };
    }

    async _initializeHub() {
      console.log("⚙️  [SPIKE Prime] Initializing hub...");

      await this._sleep(200);
      await this._sendMessage([HUB_CONSTANTS.MSG_INFO_REQUEST]);
      console.log("📤 [SPIKE Prime] InfoRequest sent");

      await this._sleep(200);
      await this._startSensorStreaming();
      console.log("📡 [SPIKE Prime] Sensor streaming enabled");
    }

    async _startSensorStreaming() {
      const message = new Uint8Array(3);
      message[0] = HUB_CONSTANTS.MSG_DEVICE_NOTIFICATION_REQUEST;
      message[1] = 100 & 0xff;
      message[2] = (100 >> 8) & 0xff;

      await this._sendMessage(Array.from(message));
    }

    // ==================== MESSAGE HANDLING ====================

    _onMessage(event) {
      try {
        const value = event.target.value;
        const data = this._unpack(new Uint8Array(value.buffer));

        if (!data || data.length === 0) return;

        const msgType = data[0];
        if (DEBUG)
          console.log(
            "📨 [SPIKE Prime] Message type:",
            "0x" + msgType.toString(16),
          );

        switch (msgType) {
          case HUB_CONSTANTS.MSG_INFO_RESPONSE:
            this._handleInfoResponse(data);
            break;
          case HUB_CONSTANTS.MSG_DEVICE_NOTIFICATION:
            this._parseDeviceNotification(data);
            break;
          case HUB_CONSTANTS.MSG_DEVICE_NOTIFICATION_RESPONSE:
            if (DEBUG)
              console.log("✅ [SPIKE Prime] Notification request acknowledged");
            break;
          default:
            if (DEBUG)
              console.warn(
                "❓ [SPIKE Prime] Unknown message type:",
                "0x" + msgType.toString(16),
              );
            break;
        }
      } catch (error) {
        console.error("❌ [SPIKE Prime] Error handling message:", error);
      }
    }

    _handleInfoResponse(data) {
      if (data.length < 15) return;

      const view = new DataView(data.buffer, data.byteOffset);
      this.maxPacketSize = view.getUint16(9, true);
      this.maxChunkSize = view.getUint16(13, true);

      console.log(
        "ℹ️  [SPIKE Prime] Hub info - Packet size:",
        this.maxPacketSize,
        "Chunk size:",
        this.maxChunkSize,
      );
    }

    _parseDeviceNotification(data) {
      if (data.length < 3) return;

      const view = new DataView(data.buffer, data.byteOffset);
      const payloadSize = view.getUint16(1, true);

      if (3 + payloadSize > data.length) return;

      const payload = data.slice(3, 3 + payloadSize);
      let offset = 0;

      while (offset < payload.length) {
        const deviceType = payload[offset];
        const remaining = payload.length - offset;

        switch (deviceType) {
          case HUB_CONSTANTS.DEVICE_BATTERY:
            if (remaining >= 2) {
              this.batteryLevel = payload[offset + 1];
              if (DEBUG) console.log("🔋 Battery:", this.batteryLevel + "%");
              offset += 2;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_IMU:
            if (remaining >= 21) {
              const imuView = new DataView(
                payload.buffer,
                payload.byteOffset + offset,
              );
              this.imu.faceUp = imuView.getUint8(1);
              this.imu.yaw = imuView.getInt16(3, true);
              this.imu.pitch = imuView.getInt16(5, true);
              this.imu.roll = imuView.getInt16(7, true);
              this.imu.accX = imuView.getInt16(9, true);
              this.imu.accY = imuView.getInt16(11, true);
              this.imu.accZ = imuView.getInt16(13, true);
              if (DEBUG)
                console.log(
                  "🧭 IMU:",
                  this.imu.yaw,
                  this.imu.pitch,
                  this.imu.roll,
                );
              offset += 21;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_MOTOR:
            if (remaining >= 11) {
              const portId = payload[offset + 1];
              const portName = PORT_ID_TO_NAME[portId];
              if (portName) {
                const motorView = new DataView(
                  payload.buffer,
                  payload.byteOffset + offset,
                );
                this.ports[portName].value.position = motorView.getInt32(
                  8,
                  true,
                );
                if (DEBUG)
                  console.log(
                    "⚙️  Motor",
                    portName,
                    "position:",
                    this.ports[portName].value.position,
                  );
              }
              offset += 11;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_FORCE_SENSOR:
            if (remaining >= 4) {
              const portId = payload[offset + 1];
              const portName = PORT_ID_TO_NAME[portId];
              if (portName) {
                this.ports[portName].value.force = payload[offset + 2];
                this.ports[portName].value.isPressed =
                  payload[offset + 3] === 1;
                if (DEBUG)
                  console.log(
                    "👆 Force",
                    portName + ":",
                    this.ports[portName].value.force + "%",
                  );
              }
              offset += 4;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_COLOR_SENSOR:
            if (remaining >= 9) {
              const portId = payload[offset + 1];
              const portName = PORT_ID_TO_NAME[portId];
              if (portName) {
                this.ports[portName].value.color = payload[offset + 2];
                if (DEBUG)
                  console.log(
                    "🎨 Color",
                    portName + ":",
                    this.ports[portName].value.color,
                  );
              }
              offset += 9;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_DISTANCE_SENSOR:
            if (remaining >= 4) {
              const portId = payload[offset + 1];
              const portName = PORT_ID_TO_NAME[portId];
              if (portName) {
                const distView = new DataView(
                  payload.buffer,
                  payload.byteOffset + offset,
                );
                this.ports[portName].value.distance = distView.getInt16(
                  2,
                  true,
                );
                if (DEBUG)
                  console.log(
                    "📏 Distance",
                    portName + ":",
                    this.ports[portName].value.distance + "mm",
                  );
              }
              offset += 4;
            } else offset = payload.length;
            break;

          case HUB_CONSTANTS.DEVICE_3X3_COLOR_MATRIX:
            offset += remaining >= 11 ? 11 : payload.length;
            break;

          default:
            if (DEBUG)
              console.warn(
                "❓ Unknown device type:",
                "0x" + deviceType.toString(16),
              );
            offset = payload.length;
            break;
        }
      }
    }

    // ==================== MOTOR CONTROL ====================

    async startMotor(args) {
      const portId = PORT_MAP[args.PORT];
      if (portId === undefined) return;

      const speed = Math.max(-100, Math.min(100, Math.round(args.SPEED)));
      console.log("⚙️  [SPIKE Prime] Motor", args.PORT, "speed:", speed + "%");

      const json = `{"m":"motor","p":{"port":${portId},"speed":${speed}}}`;
      await this._sendTunnelCommand(json);
    }

    async stopMotor(args) {
      const portId = PORT_MAP[args.PORT];
      if (portId === undefined) return;

      const endStateMap = { coast: 0, brake: 1, hold: 2 };
      const endState = endStateMap[args.ACTION] || 1;
      console.log(
        "🛑 [SPIKE Prime] Stop motor",
        args.PORT,
        "action:",
        args.ACTION,
      );

      const json = `{"m":"motor","p":{"port":${portId},"speed":0,"end_state":${endState}}}`;
      await this._sendTunnelCommand(json);
    }

    getMotorPosition(args) {
      return this.ports[args.PORT]?.value?.position || 0;
    }

    // ==================== LIGHT MATRIX ====================

    async setLightMatrixPixel(args) {
      const portId = PORT_MAP[args.PORT];
      if (portId === undefined) return;

      const x = Math.max(0, Math.min(2, Math.round(args.X)));
      const y = Math.max(0, Math.min(2, Math.round(args.Y)));
      const brightness = Math.round(
        Math.max(0, Math.min(100, args.BRIGHTNESS)) / 10,
      );

      console.log(
        "💡 [SPIKE Prime] Light",
        args.PORT,
        "pixel (" + x + "," + y + ") brightness:",
        args.BRIGHTNESS + "%",
      );

      const pixelValue = (brightness << 4) | 9; // Red color
      const pixelIndex = y * 3 + x;
      const pixels = Array(9).fill(0);
      pixels[pixelIndex] = pixelValue;

      const json = `{"m":"display_3x3","p":{"port":${portId},"data":${JSON.stringify(pixels)}}}`;
      await this._sendTunnelCommand(json);
    }

    // ==================== SENSORS ====================

    getDistance(args) {
      return this.ports[args.PORT]?.value?.distance || 0;
    }

    isForceSensorPressed(args) {
      return this.ports[args.PORT]?.value?.isPressed || false;
    }

    getForceSensorValue(args) {
      return this.ports[args.PORT]?.value?.force || 0;
    }

    getColor(args) {
      const colorId = this.ports[args.PORT]?.value?.color || 255;
      const colors = {
        0: "black",
        1: "magenta",
        2: "purple",
        3: "blue",
        4: "azure",
        5: "turquoise",
        6: "green",
        7: "yellow",
        8: "orange",
        9: "red",
        10: "white",
        255: "unknown",
      };
      return colors[colorId] || "unknown";
    }

    // ==================== IMU ====================

    getOrientation(args) {
      return this.imu[args.AXIS] || 0;
    }

    getAcceleration(args) {
      const axisKey = "acc" + args.AXIS.toUpperCase();
      return this.imu[axisKey] || 0;
    }

    getFaceUp() {
      const faces = {
        0: "top",
        1: "front",
        2: "right",
        3: "bottom",
        4: "back",
        5: "left",
      };
      return faces[this.imu.faceUp] || "unknown";
    }

    getBatteryLevel() {
      return this.batteryLevel;
    }

    // ==================== PROTOCOL ====================

    async _sendTunnelCommand(command) {
      if (DEBUG) console.log("📤 [SPIKE Prime] Tunnel command:", command);

      const commandBytes = new TextEncoder().encode(command);
      const message = new Uint8Array(3 + commandBytes.length);
      message[0] = HUB_CONSTANTS.MSG_TUNNEL;

      const view = new DataView(message.buffer);
      view.setUint16(1, commandBytes.length, true);
      message.set(commandBytes, 3);

      await this._sendMessage(Array.from(message));
    }

    async _sendMessage(payloadArray) {
      if (!this.isConnected()) return;

      const packed = this._pack(new Uint8Array(payloadArray));
      await this.rxCharacteristic.writeValue(packed);
    }

    _pack(data) {
      const cobsEncoded = this._cobsEncode(data);
      const xorEncoded = new Uint8Array(cobsEncoded.length);
      for (let i = 0; i < cobsEncoded.length; i++) {
        xorEncoded[i] = cobsEncoded[i] ^ 0x03;
      }
      const final = new Uint8Array(xorEncoded.length + 1);
      final.set(xorEncoded, 0);
      final[final.length - 1] = 0x02;
      return final;
    }

    _unpack(buffer) {
      const frame = new Uint8Array(buffer);
      if (frame.length === 0 || frame[frame.length - 1] !== 0x02) return null;

      const start = frame[0] === 0x01 ? 1 : 0;
      const unframed = frame.slice(start, -1);

      const xorDecoded = new Uint8Array(unframed.length);
      for (let i = 0; i < unframed.length; i++) {
        xorDecoded[i] = unframed[i] ^ 0x03;
      }

      return this._cobsDecode(xorDecoded);
    }

    _cobsEncode(data) {
      const buffer = [0];
      let code_index = 0;

      for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        if (byte <= 2) {
          const delimiter_base = byte * HUB_CONSTANTS.MAX_BLOCK_SIZE;
          const block_offset =
            buffer.length - code_index + HUB_CONSTANTS.COBS_CODE_OFFSET;
          buffer[code_index] = delimiter_base + block_offset;
          code_index = buffer.length;
          buffer.push(0);
        } else {
          buffer.push(byte);
          if (buffer.length - code_index >= HUB_CONSTANTS.MAX_BLOCK_SIZE) {
            buffer[code_index] =
              buffer.length - code_index + HUB_CONSTANTS.COBS_CODE_OFFSET;
            code_index = buffer.length;
            buffer.push(0);
          }
        }
      }

      buffer[code_index] =
        buffer.length - code_index + HUB_CONSTANTS.COBS_CODE_OFFSET;
      return new Uint8Array(buffer);
    }

    _cobsDecode(data) {
      const result = [];
      let i = 0;

      while (i < data.length) {
        const code = data[i] - HUB_CONSTANTS.COBS_CODE_OFFSET;
        const delimiter = Math.floor(code / HUB_CONSTANTS.MAX_BLOCK_SIZE);
        const len = code % HUB_CONSTANTS.MAX_BLOCK_SIZE;

        for (let j = 1; j < len; j++) {
          if (i + j < data.length) {
            result.push(data[i + j]);
          }
        }

        if (delimiter <= 2 && i + len < data.length) {
          result.push(delimiter);
        }

        i += len;
      }

      return new Uint8Array(result);
    }

    _sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  Scratch.extensions.register(new SpikePrimeExtension());
  console.log("🎉 [SPIKE Prime] Extension registered successfully!");
})(Scratch);
