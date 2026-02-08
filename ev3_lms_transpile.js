// Name: LEGO EV3 LMS Transpiler
// ID: CrispStrobe/ev3_lms_transpile
// Description: Supports both Live Streaming and transpiling to LMS bytecode for original EV3 firmware.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // INTERNATIONALIZATION (i18n)
  // ============================================================================

  const translations = {
    en: {
      // Extension Info
      extensionName: "EV3 LMS (Original Firmware)",

      // Connection
      connection: "Connection",
      setEV3IP: "set EV3 IP to [IP]",
      setLMSApiUrl: "set LMS compiler API to [URL]:[PORT]",
      enableStreaming: "enable streaming mode",
      disableStreaming: "disable streaming mode",
      testConnection: "test EV3 connection",
      testCompiler: "test LMS compiler connection",

      // Transpilation & Compilation
      transpilation: "Code Generation & Compilation",
      transpileToLMS: "generate LMS assembly code",
      showLMSCode: "show generated LMS code",
      downloadLMSCode: "download as .lms file",
      compileToRBF: "compile to RBF bytecode",
      showRBFCode: "show RBF bytecode (hex)",
      downloadRBF: "download as .rbf file",
      uploadAndRun: "upload RBF to EV3 and run",

      // Script Management
      scriptManagement: "Script Management",
      uploadRBF: "upload RBF as [NAME]",
      runScript: "run script [NAME]",
      stopScript: "stop script [NAME]",
      deleteScript: "delete script [NAME]",
      listScripts: "list of scripts (JSON)",

      // Motors
      motors: "EV3 Motors",
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
      sensors: "EV3 Sensors",
      touchSensor: "touch sensor [PORT] pressed?",
      touchSensorBumped: "touch sensor [PORT] bumped?",
      colorSensor: "color sensor [PORT] [MODE]",
      colorSensorRGB: "color sensor [PORT] RGB [COMPONENT]",
      ultrasonicSensor: "ultrasonic sensor [PORT] distance [UNIT]",
      ultrasonicListen: "ultrasonic sensor [PORT] detect?",
      gyroSensor: "gyro sensor [PORT] [MODE]",
      gyroReset: "reset gyro sensor [PORT]",

      // Infrared
      infrared: "Infrared Sensor",
      irProximity: "infrared [PORT] proximity",
      irBeaconHeading: "infrared [PORT] beacon heading ch[CHANNEL]",
      irBeaconDistance: "infrared [PORT] beacon distance ch[CHANNEL]",
      irRemoteButton: "infrared [PORT] ch[CHANNEL] button [BUTTON] pressed?",

      // Buttons
      buttons: "EV3 Buttons",
      buttonPressed: "button [BUTTON] pressed?",
      waitForButton: "wait for button [BUTTON]",

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
      playSong: "play song [SONG]",
      beep: "beep",
      setVolume: "set volume to [VOLUME]%",
      getVolume: "volume %",
      stopSound: "stop all sounds",

      // LEDs
      leds: "LEDs",
      setLED: "set LED to [COLOR]",
      setLEDSide: "set LED [SIDE] to [COLOR]",
      ledPattern: "LED pattern [PATTERN] speed [SPEED]",
      ledAllOff: "turn all LEDs off",

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
      noCodeGenerated: "No LMS code generated yet!",
      generateFirst: "Generate LMS code first!",
      compileFirst: "Compile to RBF first!",
      downloaded: "Downloaded",
      connected: "Connected",
      notConnected: "Not connected",
      compilationSuccess: "✅ Compilation successful!",
      compilationFailed: "❌ Compilation failed",
      uploadSuccess: "✅ Upload successful!",
      uploadFailed: "❌ Upload failed",

      // Modal
      generatedCode: "Generated LMS Assembly Code",
      rbfBytecode: "RBF Bytecode (Hex)",
      close: "Close",
    },

    de: {
      // Extension Info
      extensionName: "EV3 LMS (Original Firmware)",

      // Connection
      connection: "Verbindung",
      setEV3IP: "setze EV3 IP auf [IP]",
      setLMSApiUrl: "setze LMS Compiler API auf [URL]:[PORT]",
      enableStreaming: "Streaming-Modus aktivieren",
      disableStreaming: "Streaming-Modus deaktivieren",
      testConnection: "EV3 Verbindung testen",
      testCompiler: "LMS Compiler Verbindung testen",

      // Transpilation & Compilation
      transpilation: "Code-Generierung & Kompilierung",
      transpileToLMS: "generiere LMS Assembly Code",
      showLMSCode: "zeige generierten LMS Code",
      downloadLMSCode: "als .lms Datei herunterladen",
      compileToRBF: "zu RBF Bytecode kompilieren",
      showRBFCode: "zeige RBF Bytecode (Hex)",
      downloadRBF: "als .rbf Datei herunterladen",
      uploadAndRun: "RBF zu EV3 hochladen und ausführen",

      // Script Management
      scriptManagement: "Skript-Verwaltung",
      uploadRBF: "RBF hochladen als [NAME]",
      runScript: "Skript ausführen [NAME]",
      stopScript: "Skript stoppen [NAME]",
      deleteScript: "Skript löschen [NAME]",
      listScripts: "Liste der Skripte (JSON)",

      // Motors
      motors: "EV3 Motoren",
      motorRun: "Motor [PORT] läuft mit [POWER]%",
      motorRunTime: "Motor [PORT] läuft für [TIME] Sekunden mit [POWER]%",
      motorRunRotations:
        "Motor [PORT] läuft [ROTATIONS] Umdrehungen mit [POWER]%",
      motorRunDegrees: "Motor [PORT] läuft [DEGREES] Grad mit [POWER]%",
      motorStop: "Motor [PORT] stopp [BRAKE]",
      motorReset: "Motor [PORT] zurücksetzen",
      motorPolarity: "setze Motor [PORT] Polarität [POLARITY]",
      tankDrive: "Kettenantrieb L:[LEFT] R:[RIGHT] für [VALUE] [UNIT]",
      steerDrive: "Lenken [STEERING] Geschw. [SPEED]% für [VALUE] [UNIT]",
      motorPosition: "Motor [PORT] Position",
      motorSpeed: "Motor [PORT] Geschwindigkeit",

      // Sensors
      sensors: "EV3 Sensoren",
      touchSensor: "Berührungssensor [PORT] gedrückt?",
      touchSensorBumped: "Berührungssensor [PORT] gestoßen?",
      colorSensor: "Farbsensor [PORT] [MODE]",
      colorSensorRGB: "Farbsensor [PORT] RGB [COMPONENT]",
      ultrasonicSensor: "Ultraschallsensor [PORT] Entfernung [UNIT]",
      ultrasonicListen: "Ultraschallsensor [PORT] erkennt?",
      gyroSensor: "Gyrosensor [PORT] [MODE]",
      gyroReset: "Gyrosensor [PORT] zurücksetzen",

      // Infrared
      infrared: "Infrarotsensor",
      irProximity: "Infrarot [PORT] Nähe",
      irBeaconHeading: "Infrarot [PORT] Bake Richtung Kanal[CHANNEL]",
      irBeaconDistance: "Infrarot [PORT] Bake Entfernung Kanal[CHANNEL]",
      irRemoteButton: "Infrarot [PORT] Kanal[CHANNEL] Taste [BUTTON] gedrückt?",

      // Buttons
      buttons: "EV3 Tasten",
      buttonPressed: "Taste [BUTTON] gedrückt?",
      waitForButton: "warte auf Taste [BUTTON]",

      // Display
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

      // Sound
      sound: "Sound",
      playTone: "spiele Ton [FREQ] Hz für [DURATION] ms",
      playNote: "spiele Note [NOTE] für [DURATION] Takte",
      playSong: "spiele Lied [SONG]",
      beep: "piep",
      setVolume: "setze Lautstärke auf [VOLUME]%",
      getVolume: "Lautstärke %",
      stopSound: "alle Sounds stoppen",

      // LEDs
      leds: "LEDs",
      setLED: "setze LED auf [COLOR]",
      setLEDSide: "setze LED [SIDE] auf [COLOR]",
      ledPattern: "LED Muster [PATTERN] Geschw. [SPEED]",
      ledAllOff: "alle LEDs ausschalten",

      // System
      system: "System",
      batteryLevel: "Batteriestand %",
      batteryCurrent: "Batteriestrom mA",
      batteryVoltage: "Batteriespannung V",
      freeMemory: "freier Speicher KB",

      // Timers
      timers: "Timer",
      resetTimer: "Timer [TIMER] zurücksetzen",
      timerValue: "Timer [TIMER]",
      waitSeconds: "warte [TIME] Sekunden",
      waitMillis: "warte [TIME] Millisekunden",

      // Messages
      noCodeGenerated: "Noch kein LMS Code generiert!",
      generateFirst: "Generiere zuerst LMS Code!",
      compileFirst: "Kompiliere zuerst zu RBF!",
      downloaded: "Heruntergeladen",
      connected: "Verbunden",
      notConnected: "Nicht verbunden",
      compilationSuccess: "✅ Kompilierung erfolgreich!",
      compilationFailed: "❌ Kompilierung fehlgeschlagen",
      uploadSuccess: "✅ Upload erfolgreich!",
      uploadFailed: "❌ Upload fehlgeschlagen",

      // Modal
      generatedCode: "Generierter LMS Assembly Code",
      rbfBytecode: "RBF Bytecode (Hex)",
      close: "Schließen",
    },
  };

  // Language detection
  function detectLanguage() {
    let finalLanguage = "en";

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

    return finalLanguage;
  }

  let currentLang = detectLanguage();

  function t(key) {
    return translations[currentLang][key] || translations["en"][key] || key;
  }

  // ============================================================================
  // LMS ASSEMBLY TRANSPILER
  // ============================================================================

  class LMSTranspiler {
    constructor() {
      this.lmsCode = "";
      this.indentLevel = 0;
      this.variableCounter = 0;
      this.labelCounter = 0;
      this.threadCounter = 0;
      this.arrayCounter = 0;
      this.variables = new Map(); // Maps Scratch variable names to LMS variable info
      this.globalVars = []; // Track global variables
      this.localVars = []; // Track local variables in current scope
      this.timerVars = new Map(); // Maps timer IDs to LMS variables
      this.broadcastHandlers = new Map(); // Maps broadcast names to label names
      this.debugLog = [];
      this.currentThread = "MAIN";
      this.spriteStates = {};
      this.errors = [];
      this.warnings = [];

      // LMS opcode constants (WITHOUT "op" prefix per documentation)
      this.opcodes = {
        // Motor opcodes
        OUTPUT_POWER: "OUTPUT_POWER",
        OUTPUT_START: "OUTPUT_START",
        OUTPUT_STOP: "OUTPUT_STOP",
        OUTPUT_SPEED: "OUTPUT_SPEED",
        OUTPUT_TIME_POWER: "OUTPUT_TIME_POWER",
        OUTPUT_TIME_SPEED: "OUTPUT_TIME_SPEED",
        OUTPUT_STEP_POWER: "OUTPUT_STEP_POWER",
        OUTPUT_STEP_SPEED: "OUTPUT_STEP_SPEED",
        OUTPUT_READ: "OUTPUT_READ",
        OUTPUT_RESET: "OUTPUT_RESET",
        OUTPUT_CLR_COUNT: "OUTPUT_CLR_COUNT",
        OUTPUT_GET_COUNT: "OUTPUT_GET_COUNT",
        OUTPUT_POLARITY: "OUTPUT_POLARITY",
        OUTPUT_READY: "OUTPUT_READY",

        // Sensor opcodes
        INPUT_DEVICE: "INPUT_DEVICE",
        INPUT_READ: "INPUT_READ",
        INPUT_READSI: "INPUT_READSI",
        INPUT_READY: "INPUT_READY",
        INPUT_TEST: "INPUT_TEST",

        // Display opcodes
        UI_DRAW: "UI_DRAW",
        UI_WRITE: "UI_WRITE",
        UI_READ: "UI_READ",
        UI_BUTTON: "UI_BUTTON",

        // Sound opcodes
        SOUND: "SOUND",
        SOUND_READY: "SOUND_READY",
        SOUND_TEST: "SOUND_TEST",

        // Timer opcodes
        TIMER_WAIT: "TIMER_WAIT",
        TIMER_READY: "TIMER_READY",
        TIMER_READ: "TIMER_READ",
        TIMER_READ_US: "TIMER_READ_US",

        // System opcodes
        INFO: "INFO",

        // Program flow
        JR: "JR",
        JR_FALSE: "JR_FALSE",
        JR_TRUE: "JR_TRUE",
        JR_NAN: "JR_NAN",
        CALL: "CALL",
        RETURN: "RETURN",
        OBJECT_END: "OBJECT_END",

        // Math operations
        ADD8: "ADD8",
        ADD16: "ADD16",
        ADD32: "ADD32",
        ADDF: "ADDF",
        SUB8: "SUB8",
        SUB16: "SUB16",
        SUB32: "SUB32",
        SUBF: "SUBF",
        MUL8: "MUL8",
        MUL16: "MUL16",
        MUL32: "MUL32",
        MULF: "MULF",
        DIV8: "DIV8",
        DIV16: "DIV16",
        DIV32: "DIV32",
        DIVF: "DIVF",
        OR8: "OR8",
        OR16: "OR16",
        OR32: "OR32",
        AND8: "AND8",
        AND16: "AND16",
        AND32: "AND32",
        XOR8: "XOR8",
        XOR16: "XOR16",
        XOR32: "XOR32",
        RL8: "RL8",
        RL16: "RL16",
        RL32: "RL32",

        // Comparison
        CP_LT8: "CP_LT8",
        CP_LT16: "CP_LT16",
        CP_LT32: "CP_LT32",
        CP_LTF: "CP_LTF",
        CP_GT8: "CP_GT8",
        CP_GT16: "CP_GT16",
        CP_GT32: "CP_GT32",
        CP_GTF: "CP_GTF",
        CP_EQ8: "CP_EQ8",
        CP_EQ16: "CP_EQ16",
        CP_EQ32: "CP_EQ32",
        CP_EQF: "CP_EQF",
        CP_NEQ8: "CP_NEQ8",
        CP_NEQ16: "CP_NEQ16",
        CP_NEQ32: "CP_NEQ32",
        CP_NEQF: "CP_NEQF",
        CP_LTEQ8: "CP_LTEQ8",
        CP_LTEQ16: "CP_LTEQ16",
        CP_LTEQ32: "CP_LTEQ32",
        CP_LTEQF: "CP_LTEQF",
        CP_GTEQ8: "CP_GTEQ8",
        CP_GTEQ16: "CP_GTEQ16",
        CP_GTEQ32: "CP_GTEQ32",
        CP_GTEQF: "CP_GTEQF",

        // Move operations
        MOVE8_8: "MOVE8_8",
        MOVE8_16: "MOVE8_16",
        MOVE8_32: "MOVE8_32",
        MOVE8_F: "MOVE8_F",
        MOVE16_8: "MOVE16_8",
        MOVE16_16: "MOVE16_16",
        MOVE16_32: "MOVE16_32",
        MOVE16_F: "MOVE16_F",
        MOVE32_8: "MOVE32_8",
        MOVE32_16: "MOVE32_16",
        MOVE32_32: "MOVE32_32",
        MOVE32_F: "MOVE32_F",
        MOVEF_8: "MOVEF_8",
        MOVEF_16: "MOVEF_16",
        MOVEF_32: "MOVEF_32",
        MOVEF_F: "MOVEF_F",

        // Jump operations
        JR_LT8: "JR_LT8",
        JR_LT16: "JR_LT16",
        JR_LT32: "JR_LT32",
        JR_LTF: "JR_LTF",
        JR_GT8: "JR_GT8",
        JR_GT16: "JR_GT16",
        JR_GT32: "JR_GT32",
        JR_GTF: "JR_GTF",
        JR_EQ8: "JR_EQ8",
        JR_EQ16: "JR_EQ16",
        JR_EQ32: "JR_EQ32",
        JR_EQF: "JR_EQF",
        JR_NEQ8: "JR_NEQ8",
        JR_NEQ16: "JR_NEQ16",
        JR_NEQ32: "JR_NEQ32",
        JR_NEQF: "JR_NEQF",
        JR_LTEQ8: "JR_LTEQ8",
        JR_LTEQ16: "JR_LTEQ16",
        JR_LTEQ32: "JR_LTEQ32",
        JR_LTEQF: "JR_LTEQF",
        JR_GTEQ8: "JR_GTEQ8",
        JR_GTEQ16: "JR_GTEQ16",
        JR_GTEQ32: "JR_GTEQ32",
        JR_GTEQF: "JR_GTEQF",

        // String operations
        STRINGS: "STRINGS",

        // Array operations
        ARRAY: "ARRAY",
        ARRAY_READ: "ARRAY_READ",
        ARRAY_WRITE: "ARRAY_WRITE",

        // Math operations
        MATH: "MATH",

        // Random
        RANDOM: "RANDOM",
      };

      // UI_DRAW subcodes
      this.UI_DRAW = {
        UPDATE: "UPDATE",
        CLEAN: "CLEAN",
        PIXEL: "PIXEL",
        LINE: "LINE",
        CIRCLE: "CIRCLE",
        TEXT: "TEXT",
        ICON: "ICON",
        PICTURE: "PICTURE",
        VALUE: "VALUE",
        FILLRECT: "FILLRECT",
        RECT: "RECT",
        NOTIFICATION: "NOTIFICATION",
        QUESTION: "QUESTION",
        KEYBOARD: "KEYBOARD",
        BROWSE: "BROWSE",
        VERTBAR: "VERTBAR",
        INVERSERECT: "INVERSERECT",
        SELECT_FONT: "SELECT_FONT",
        TOPLINE: "TOPLINE",
        FILLWINDOW: "FILLWINDOW",
        SCROLL: "SCROLL",
        DOTLINE: "DOTLINE",
        VIEW_VALUE: "VIEW_VALUE",
        VIEW_UNIT: "VIEW_UNIT",
        FILLCIRCLE: "FILLCIRCLE",
        STORE: "STORE",
        RESTORE: "RESTORE",
        ICON_QUESTION: "ICON_QUESTION",
        BMPFILE: "BMPFILE",
        POPUP: "POPUP",
        GRAPH_SETUP: "GRAPH_SETUP",
        GRAPH_DRAW: "GRAPH_DRAW",
        TEXTBOX: "TEXTBOX",
      };

      // SOUND subcodes
      this.SOUND_CMD = {
        BREAK: "BREAK",
        TONE: "TONE",
        PLAY: "PLAY",
        REPEAT: "REPEAT",
        SERVICE: "SERVICE",
      };

      // UI_BUTTON subcodes
      this.UI_BUTTON_CMD = {
        SHORTPRESS: "SHORTPRESS",
        LONGPRESS: "LONGPRESS",
        WAIT_FOR_PRESS: "WAIT_FOR_PRESS",
        FLUSH: "FLUSH",
        PRESS: "PRESS",
        RELEASE: "RELEASE",
        GET_HORZ: "GET_HORZ",
        GET_VERT: "GET_VERT",
        PRESSED: "PRESSED",
        SET_BACK_BLOCK: "SET_BACK_BLOCK",
        GET_BACK_BLOCK: "GET_BACK_BLOCK",
        TESTSHORTPRESS: "TESTSHORTPRESS",
        TESTLONGPRESS: "TESTLONGPRESS",
        GET_BUMPED: "GET_BUMPED",
        GET_CLICK: "GET_CLICK",
      };

      // Button constants
      this.BUTTONS = {
        UP: "UP_BUTTON",
        DOWN: "DOWN_BUTTON",
        LEFT: "LEFT_BUTTON",
        RIGHT: "RIGHT_BUTTON",
        ENTER: "ENTER_BUTTON",
        BACK: "BACK_BUTTON",
      };

      // UI_READ subcodes
      this.UI_READ_CMD = {
        GET_VBATT: "GET_VBATT",
        GET_IBATT: "GET_IBATT",
        GET_LBATT: "GET_LBATT",
        GET_VOLUME: "GET_VOLUME",
      };

      // UI_WRITE subcodes
      this.UI_WRITE_CMD = {
        LED: "LED",
        SET_VOLUME: "SET_VOLUME",
      };

      // INFO subcodes
      this.INFO_CMD = {
        GET_FREE: "GET_FREE",
      };

      // STRINGS subcodes
      this.STRINGS_CMD = {
        DUPLICATE: "DUPLICATE",
      };

      // ARRAY subcodes
      this.ARRAY_CMD = {
        CREATE8: "CREATE8",
        CREATE16: "CREATE16",
        CREATE32: "CREATE32",
        CREATEF: "CREATEF",
      };

      // Port definitions
      this.OUTPUT_PORTS = {
        A: "0x01",
        B: "0x02",
        C: "0x04",
        D: "0x08",
        ALL: "0x0F",
      };

      this.INPUT_PORTS = {
        1: "0",
        2: "1",
        3: "2",
        4: "3",
      };

      // Sensor types (from typedata.rcf)
      this.SENSOR_TYPE = {
        NONE: "0",
        NXT_TOUCH: "1",
        NXT_LIGHT: "2",
        NXT_SOUND: "3",
        NXT_COLOR: "4",
        NXT_ULTRASONIC: "5",
        NXT_TEMP: "6",
        LARGE_MOTOR: "7",
        MEDIUM_MOTOR: "8",
        EV3_TOUCH: "16",
        EV3_COLOR: "29",
        EV3_ULTRASONIC: "30",
        EV3_GYRO: "32",
        EV3_IR: "33",
        I2C: "100",
      };

      // Sensor modes
      this.SENSOR_MODE = {
        // Touch
        TOUCH: "0",
        BUMP: "1",
        // Color
        COLOR_REFLECTED: "0",
        COLOR_AMBIENT: "1",
        COLOR_COLOR: "2",
        COLOR_REFLECTED_RAW: "3",
        COLOR_RGB_RAW: "4",
        COLOR_CALIBRATION: "5",
        // Ultrasonic
        US_DIST_CM: "0",
        US_DIST_IN: "1",
        US_LISTEN: "2",
        US_SI_CM: "3",
        US_SI_IN: "4",
        US_DC_CM: "5",
        US_DC_IN: "6",
        // Gyro
        GYRO_ANGLE: "0",
        GYRO_RATE: "1",
        GYRO_FAS: "2",
        GYRO_G_AND_A: "3",
        GYRO_CALIBRATE: "4",
        // IR
        IR_PROX: "0",
        IR_SEEK: "1",
        IR_REMOTE: "2",
        IR_REMOTE_ADV: "3",
        IR_SEEK_ALT: "4",
        IR_CALIBRATE: "5",
        // Light
        LIGHT_REFLECTED: "0",
        LIGHT_AMBIENT: "1",
        // Sound
        SOUND_DB: "0",
        SOUND_DBA: "1",
        // Temperature
        TEMP_C: "0",
        TEMP_F: "1",
        // Motor
        MOTOR_DEGREE: "0",
        MOTOR_ROTATION: "1",
        MOTOR_SPEED: "2",
      };

      // LED colors
      this.LED_COLOR = {
        OFF: "0",
        GREEN: "1",
        RED: "2",
        ORANGE: "3",
        GREEN_FLASH: "4",
        RED_FLASH: "5",
        ORANGE_FLASH: "6",
        GREEN_PULSE: "7",
        RED_PULSE: "8",
        ORANGE_PULSE: "9",
      };

      // Math functions
      this.MATH_FUNC = {
        ABS: "ABS",
        NEGATE: "NEGATE",
        SQRT: "SQRT",
        ROUND: "ROUND",
        FLOOR: "FLOOR",
        CEIL: "CEIL",
        EXP: "EXP",
        LOG: "LOG",
        LN: "LN",
        SIN: "SIN",
        COS: "COS",
        TAN: "TAN",
        ASIN: "ASIN",
        ACOS: "ACOS",
        ATAN: "ATAN",
        POW: "POW",
        TRUNC: "TRUNC",
        MOD8: "MOD8",
        MOD16: "MOD16",
        MOD32: "MOD32",
        MOD: "MOD",
      };
    }

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

      this.log(
        `Allocated variable: ${varName} (${fullType})`,
        { isGlobal },
        "DEBUG",
      );
      return varName;
    }

    getDataType(type) {
      const types = {
        8: "DATA8",
        16: "DATA16",
        32: "DATA32",
        F: "DATAF",
        S: "DATAS",
      };
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

        // Collect sprite states
        for (const target of targets) {
          if (!target.isStage) {
            this.spriteStates[target.sprite.name] = {
              x: target.x || 0,
              y: target.y || 0,
              direction: target.direction || 90,
              size: target.size || 100,
              visible: target.visible !== false,
            };
          }
        }

        this.log("Sprite states collected", this.spriteStates);

        // Generate LMS header
        this.generateHeader();

        // Process each sprite/stage
        for (const target of targets) {
          this.log(`Processing ${target.isStage ? "stage" : "sprite"}`, {
            name: target.sprite.name,
          });
          this.processTarget(target);
        }

        // Generate broadcast handlers as subcalls
        this.generateBroadcastSubcalls();

        // Add program end
        this.addComment("End of program");
        this.addLine("OBJECT_END()");

        // Close main thread
        this.indentLevel--;
        this.addLine("}");

        this.log("=== LMS Transpilation Complete ===", {
          codeLength: this.lmsCode.length,
          lines: this.lmsCode.split("\n").length,
          errors: this.errors.length,
          warnings: this.warnings.length,
        });

        if (this.errors.length > 0) {
          this.log("ERRORS DETECTED", this.errors, "ERROR");
        }

        if (this.warnings.length > 0) {
          this.log("WARNINGS DETECTED", this.warnings, "WARN");
        }

        console.log("=== GENERATED LMS CODE ===\n" + this.lmsCode);

        return this.lmsCode;
      } catch (error) {
        this.log(
          "CRITICAL ERROR during transpilation",
          {
            error: error.message,
            stack: error.stack,
          },
          "ERROR",
        );
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
      this.addComment("by TurboWarp EV3 LMS Extension v2.1");
      this.addComment(`Language: ${currentLang}`);
      this.addComment(`Generated: ${new Date().toISOString()}`);
      this.addLine("");

      this.addLine("vmthread MAIN");
      this.addLine("{");
      this.indentLevel++;

      // Declare global variables
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

      // Initialize layer to 0
      this.addComment("Initialize layer");
      this.addLine("MOVE8_8(0, layer)");
      this.addLine("");

      // Initialize default ramp times (100ms)
      this.addComment("Initialize default motor ramp times");
      this.addLine("MOVE32_32(100, ramp_up)");
      this.addLine("MOVE32_32(100, ramp_down)");
      this.addLine("");
    }

    processTarget(target) {
      const blocks = target.blocks;
      const blockArray = blocks._blocks;
      const blockKeys = Object.keys(blockArray);

      // Find hat blocks (entry points)
      const hatBlocks = [];
      for (const blockKey of blockKeys) {
        const block = blockArray[blockKey];
        if (block.opcode && block.opcode.startsWith("event_when")) {
          hatBlocks.push(block);
        }
      }

      this.log("Found hat blocks", { count: hatBlocks.length });

      // Process hat blocks
      for (const hatBlock of hatBlocks) {
        this.processHatBlock(hatBlock, blocks);
      }
    }

    processHatBlock(hatBlock, blocks) {
      const opcode = hatBlock.opcode;
      this.addComment(`Event: ${opcode}`);

      if (opcode === "event_whenflagclicked") {
        // Process directly in main thread
        this.addComment("When green flag clicked");
        this.processBlockChain(hatBlock.next, blocks);
      } else if (opcode === "event_whenbroadcastreceived") {
        const broadcastName = this.getFieldValue(hatBlock, "BROADCAST_OPTION");
        const labelName = this.generateLabel(
          `ON_${this.sanitizeName(broadcastName)}`,
        );

        this.broadcastHandlers.set(broadcastName, {
          label: labelName,
          startBlock: hatBlock.next,
        });

        this.log(
          `Registered broadcast handler: ${broadcastName} -> ${labelName}`,
        );
      } else if (opcode === "event_whenkeypressed") {
        // Key pressed events not supported in LMS - log warning
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
          this.log(
            "Block not found, ending chain",
            { blockId: currentId },
            "WARN",
          );
          break;
        }

        chainLength++;
        if (chainLength > maxChainLength) {
          this.log(
            "WARNING: Block chain too long, stopping",
            { chainLength },
            "WARN",
          );
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
        // Motor blocks
        if (opcode === "ev3lms_motorRun") {
          this.transpileMotorRun(block, blocks);
        } else if (opcode === "ev3lms_motorRunTime") {
          this.transpileMotorRunTime(block, blocks);
        } else if (opcode === "ev3lms_motorRunRotations") {
          this.transpileMotorRunRotations(block, blocks);
        } else if (opcode === "ev3lms_motorRunDegrees") {
          this.transpileMotorRunDegrees(block, blocks);
        } else if (opcode === "ev3lms_motorStop") {
          this.transpileMotorStop(block, blocks);
        } else if (opcode === "ev3lms_motorReset") {
          this.transpileMotorReset(block, blocks);
        } else if (opcode === "ev3lms_motorPolarity") {
          this.transpileMotorPolarity(block, blocks);
        } else if (opcode === "ev3lms_tankDrive") {
          this.transpileTankDrive(block, blocks);
        } else if (opcode === "ev3lms_steerDrive") {
          this.transpileSteerDrive(block, blocks);
        }

        // Display blocks
        else if (opcode === "ev3lms_screenClear") {
          this.transpileScreenClear(block, blocks);
        } else if (opcode === "ev3lms_screenText") {
          this.transpileScreenText(block, blocks);
        } else if (opcode === "ev3lms_screenTextLarge") {
          this.transpileScreenTextLarge(block, blocks);
        } else if (opcode === "ev3lms_drawPixel") {
          this.transpileDrawPixel(block, blocks);
        } else if (opcode === "ev3lms_drawLine") {
          this.transpileDrawLine(block, blocks);
        } else if (opcode === "ev3lms_drawCircle") {
          this.transpileDrawCircle(block, blocks);
        } else if (opcode === "ev3lms_drawRectangle") {
          this.transpileDrawRectangle(block, blocks);
        } else if (opcode === "ev3lms_screenUpdate") {
          this.transpileScreenUpdate(block, blocks);
        } else if (opcode === "ev3lms_screenInvert") {
          this.transpileScreenInvert(block, blocks);
        }

        // Sound blocks
        else if (opcode === "ev3lms_playTone") {
          this.transpilePlayTone(block, blocks);
        } else if (opcode === "ev3lms_playNote") {
          this.transpilePlayNote(block, blocks);
        } else if (opcode === "ev3lms_beep") {
          this.transpileBeep(block, blocks);
        } else if (opcode === "ev3lms_setVolume") {
          this.transpileSetVolume(block, blocks);
        } else if (opcode === "ev3lms_stopSound") {
          this.transpileStopSound(block, blocks);
        }

        // LED blocks
        else if (opcode === "ev3lms_setLED") {
          this.transpileSetLED(block, blocks);
        } else if (opcode === "ev3lms_ledAllOff") {
          this.transpileLEDAllOff(block, blocks);
        }

        // Button blocks
        else if (opcode === "ev3lms_buttonPressed") {
          this.transpileButtonPressed(block, blocks);
        } else if (opcode === "ev3lms_waitForButton") {
          this.transpileWaitForButton(block, blocks);
        }

        // Sensor blocks
        else if (opcode === "ev3lms_touchSensor") {
          this.transpileTouchSensor(block, blocks);
        } else if (opcode === "ev3lms_touchSensorBumped") {
          this.transpileTouchSensorBumped(block, blocks);
        } else if (opcode === "ev3lms_colorSensor") {
          this.transpileColorSensor(block, blocks);
        } else if (opcode === "ev3lms_colorSensorRGB") {
          this.transpileColorSensorRGB(block, blocks);
        } else if (opcode === "ev3lms_ultrasonicSensor") {
          this.transpileUltrasonicSensor(block, blocks);
        } else if (opcode === "ev3lms_ultrasonicListen") {
          this.transpileUltrasonicListen(block, blocks);
        } else if (opcode === "ev3lms_gyroSensor") {
          this.transpileGyroSensor(block, blocks);
        } else if (opcode === "ev3lms_gyroReset") {
          this.transpileGyroReset(block, blocks);
        } else if (opcode === "ev3lms_irProximity") {
          this.transpileIRProximity(block, blocks);
        } else if (opcode === "ev3lms_irBeaconHeading") {
          this.transpileIRBeaconHeading(block, blocks);
        } else if (opcode === "ev3lms_irBeaconDistance") {
          this.transpileIRBeaconDistance(block, blocks);
        } else if (opcode === "ev3lms_irRemoteButton") {
          this.transpileIRRemoteButton(block, blocks);
        }

        // Control blocks
        else if (opcode === "control_wait") {
          this.transpileWait(block, blocks);
        } else if (opcode === "ev3lms_waitSeconds") {
          this.transpileWaitSeconds(block, blocks);
        } else if (opcode === "ev3lms_waitMillis") {
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
        }

        // Event blocks
        else if (opcode === "event_broadcast") {
          this.transpileBroadcast(block, blocks);
        } else if (opcode === "event_broadcastandwait") {
          this.transpileBroadcastAndWait(block, blocks);
        }

        // Motion blocks (simplified for EV3)
        else if (opcode === "motion_movesteps") {
          this.transpileMoveSteps(block, blocks);
        } else if (opcode === "motion_turnright") {
          this.transpileTurnRight(block, blocks);
        } else if (opcode === "motion_turnleft") {
          this.transpileTurnLeft(block, blocks);
        }

        // Data blocks
        else if (opcode === "data_setvariableto") {
          this.transpileSetVariable(block, blocks);
        } else if (opcode === "data_changevariableby") {
          this.transpileChangeVariable(block, blocks);
        }

        // Looks blocks (use display/sound)
        else if (opcode === "looks_say" || opcode === "looks_sayforsecs") {
          this.transpileSay(block, blocks);
        }

        // Sound blocks (play sound)
        else if (opcode === "sound_play" || opcode === "sound_playuntildone") {
          this.transpilePlaySound(block, blocks);
        }

        // Timer blocks
        else if (opcode === "ev3lms_resetTimer") {
          this.transpileResetTimer(block, blocks);
        } else if (opcode === "ev3lms_timerValue") {
          this.transpileTimerValue(block, blocks);
        }

        // System blocks
        else if (opcode === "ev3lms_batteryLevel") {
          this.transpileBatteryLevel(block, blocks);
        } else if (opcode === "ev3lms_batteryVoltage") {
          this.transpileBatteryVoltage(block, blocks);
        } else if (opcode === "ev3lms_batteryCurrent") {
          this.transpileBatteryCurrent(block, blocks);
        } else if (opcode === "ev3lms_freeMemory") {
          this.transpileFreeMemory(block, blocks);
        }

        // Default - unsupported block
        else {
          this.addComment(`TODO: Unsupported block: ${opcode}`);
          this.log(`WARNING: Unsupported block: ${opcode}`, null, "WARN");
        }
      } catch (error) {
        this.log(
          `ERROR processing block ${opcode}`,
          {
            error: error.message,
            stack: error.stack,
          },
          "ERROR",
        );
        this.addComment(`ERROR: ${opcode} - ${error.message}`);
      }
    }

    // ============================================================================
    // MOTOR TRANSPILERS
    // ============================================================================

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

      // Calculate time_ms (time * 1000)
      const timeMs = this.evaluateExpression(time, "*", 1000, 32);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);

      // Parameters: layer, motors, power, ramp_up_ms, run_ms, ramp_down_ms, brake
      this.addLine(
        `OUTPUT_TIME_POWER(0, port, power, ramp_up, time_ms, ramp_down, 1)`,
      );
    }

    transpileMotorRunRotations(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const rotations = this.getInputValue(block, "ROTATIONS", blocks);
      const power = this.getInputValue(block, "POWER", blocks);

      this.addComment(`Motor ${port} run ${rotations} rotations at ${power}%`);
      this.addLine(`MOVE8_8(${this.getPortMask(port)}, port)`);
      this.addLine(`MOVE8_8(${power}, power)`);

      // Calculate degrees (rotations * 360)
      const degreesValue = this.evaluateExpression(rotations, "*", 360, 32);
      this.addLine(`MOVE32_32(${degreesValue}, degrees)`);

      // Parameters: layer, motors, power, ramp_up_degrees, run_degrees, ramp_down_degrees, brake
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
      // Parameters: layer, motors, power, ramp_up_degrees, run_degrees, ramp_down_degrees, brake
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

      // Assume B=left, C=right
      const leftPort = this.OUTPUT_PORTS.B;
      const rightPort = this.OUTPUT_PORTS.C;

      if (unit === '"seconds"' || unit === "seconds" || unit === "'seconds'") {
        // Time-based - calculate value * 1000
        const timeMs = this.evaluateExpression(value, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(
          `OUTPUT_TIME_POWER(0, port, ${left}, ramp_up, time_ms, ramp_down, 0)`,
        );
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(
          `OUTPUT_TIME_POWER(0, port, ${right}, ramp_up, time_ms, ramp_down, 1)`,
        );
      } else if (
        unit === '"rotations"' ||
        unit === "rotations" ||
        unit === "'rotations'"
      ) {
        // Rotation-based - calculate value * 360
        const degreesValue = this.evaluateExpression(value, "*", 360, 32);
        this.addLine(`MOVE32_32(${degreesValue}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${left}, 30, degrees, 30, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(
          `OUTPUT_STEP_POWER(0, port, ${right}, 30, degrees, 30, 1)`,
        );
      } else {
        // Degrees - no calculation needed
        this.addLine(`MOVE32_32(${value}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(`OUTPUT_STEP_POWER(0, port, ${left}, 10, degrees, 10, 0)`);
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(
          `OUTPUT_STEP_POWER(0, port, ${right}, 10, degrees, 10, 1)`,
        );
      }
    }

    transpileSteerDrive(block, blocks) {
      const steering = this.getInputValue(block, "STEERING", blocks);
      const speed = this.getInputValue(block, "SPEED", blocks);
      const value = this.getInputValue(block, "VALUE", blocks);
      const unit = this.getInputValue(block, "UNIT", blocks);

      this.addComment(
        `Steer drive steering:${steering} speed:${speed} for ${value} ${unit}`,
      );

      // Calculate left and right power from steering
      const leftVar = this.allocateVariable(8, "steer_left");
      const rightVar = this.allocateVariable(8, "steer_right");
      const steerVal = this.allocateVariable(8, "steer_val");

      // Steering calculation
      this.addLine(`MOVE8_8(${steering}, ${steerVal})`);
      this.addLine(`MOVE8_8(${speed}, ${leftVar})`);
      this.addLine(`MOVE8_8(${speed}, ${rightVar})`);

      // If steering > 0: reduce right motor proportionally
      // If steering < 0: reduce left motor proportionally
      const skipLeft = this.generateLabel("SKIP_LEFT_ADJUST");
      const skipRight = this.generateLabel("SKIP_RIGHT_ADJUST");
      const continueSteer = this.generateLabel("CONTINUE_STEER");

      this.addLine(`JR_LT8(${steerVal}, 0, ${skipRight})`);
      // Positive steering - reduce right
      this.addLine(`MUL8(${speed}, ${steerVal}, temp16)`);
      this.addLine(`DIV16(temp16, 100, temp16)`);
      this.addLine(`SUB16(${speed}, temp16, temp16)`);
      this.addLine(`MOVE16_8(temp16, ${rightVar})`);
      this.addLine(`JR(${continueSteer})`);

      this.addLine(`${skipRight}:`);
      this.addLine(`JR_GT8(${steerVal}, 0, ${skipLeft})`);
      // Negative steering - reduce left
      this.addLine(`MUL8(${speed}, ${steerVal}, temp16)`);
      this.addLine(`DIV16(temp16, -100, temp16)`);
      this.addLine(`SUB16(${speed}, temp16, temp16)`);
      this.addLine(`MOVE16_8(temp16, ${leftVar})`);

      this.addLine(`${skipLeft}:`);
      this.addLine(`${continueSteer}:`);

      // Apply to motors
      const leftPort = this.OUTPUT_PORTS.B;
      const rightPort = this.OUTPUT_PORTS.C;

      if (unit === '"seconds"' || unit === "seconds" || unit === "'seconds'") {
        const timeMs = this.evaluateExpression(value, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(
          `OUTPUT_TIME_POWER(0, port, ${leftVar}, ramp_up, time_ms, ramp_down, 0)`,
        );
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(
          `OUTPUT_TIME_POWER(0, port, ${rightVar}, ramp_up, time_ms, ramp_down, 1)`,
        );
      } else {
        const degreesValue = this.evaluateExpression(value, "*", 360, 32);
        this.addLine(`MOVE32_32(${degreesValue}, degrees)`);
        this.addLine(`MOVE8_8(${leftPort}, port)`);
        this.addLine(
          `OUTPUT_STEP_POWER(0, port, ${leftVar}, 30, degrees, 30, 0)`,
        );
        this.addLine(`MOVE8_8(${rightPort}, port)`);
        this.addLine(
          `OUTPUT_STEP_POWER(0, port, ${rightVar}, 30, degrees, 30, 1)`,
        );
      }
    }

    // ============================================================================
    // DISPLAY TRANSPILERS
    // ============================================================================

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
      this.addLine(`UI_DRAW(SELECT_FONT, 1)`); // Large font
      this.addLine(`UI_DRAW(TEXT, 0, ${x}, ${y}, ${text})`);
      this.addLine(`UI_DRAW(SELECT_FONT, 0)`); // Back to normal
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

    // ============================================================================
    // SOUND TRANSPILERS
    // ============================================================================

    transpilePlayTone(block, blocks) {
      const freq = this.getInputValue(block, "FREQ", blocks);
      const duration = this.getInputValue(block, "DURATION", blocks);

      this.addComment(`Play tone ${freq} Hz for ${duration} ms`);

      // Validate frequency (EV3 cannot synthesize tones below 250 Hz)
      const skipLabel = this.generateLabel("SKIP_TONE");

      this.addLine(`MOVE16_16(${freq}, frequency)`);
      this.addLine(`JR_LT16(frequency, 250, ${skipLabel})`);

      this.addLine(`MOVE16_16(${duration}, duration)`);
      this.addLine(`SOUND(TONE, 100, frequency, duration)`);

      // Wait for sound to finish
      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(duration, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);

      this.addLine(`${skipLabel}:`);
    }

    transpilePlayNote(block, blocks) {
      const note = this.getInputValue(block, "NOTE", blocks);
      const duration = this.getInputValue(block, "DURATION", blocks);

      this.addComment(`Play note ${note} for ${duration} beats`);

      // Convert note to frequency
      const noteToFreq = {
        '"C4"': 262,
        '"D4"': 294,
        '"E4"': 330,
        '"F4"': 349,
        '"G4"': 392,
        '"A4"': 440,
        '"B4"': 494,
        '"C5"': 523,
        C4: 262,
        D4: 294,
        E4: 330,
        F4: 349,
        G4: 392,
        A4: 440,
        B4: 494,
        C5: 523,
        "'C4'": 262,
        "'D4'": 294,
        "'E4'": 330,
        "'F4'": 349,
        "'G4'": 392,
        "'A4'": 440,
        "'B4'": 494,
        "'C5'": 523,
      };

      const freq = noteToFreq[note] || 440;

      // Calculate duration * 500 (assuming 120 BPM, quarter = 500ms)
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
      this.addComment(
        "NOTE: Sound file playback requires file name - using beep instead",
      );
      this.addLine(`SOUND(TONE, 100, 1000, 200)`);
    }

    // ============================================================================
    // LED TRANSPILERS
    // ============================================================================

    transpileSetLED(block, blocks) {
      const color = this.getInputValue(block, "COLOR", blocks);

      // Map color names to LED patterns
      const colorMap = {
        '"OFF"': this.LED_COLOR.OFF,
        '"GREEN"': this.LED_COLOR.GREEN,
        '"RED"': this.LED_COLOR.RED,
        '"ORANGE"': this.LED_COLOR.ORANGE,
        OFF: this.LED_COLOR.OFF,
        GREEN: this.LED_COLOR.GREEN,
        RED: this.LED_COLOR.RED,
        ORANGE: this.LED_COLOR.ORANGE,
      };

      const ledColor = colorMap[color] || this.LED_COLOR.GREEN;

      this.addComment(`Set LED to ${color}`);
      this.addLine(`UI_WRITE(LED, ${ledColor})`);
    }

    transpileLEDAllOff(block, blocks) {
      this.addComment("Turn all LEDs off");
      this.addLine(`UI_WRITE(LED, ${this.LED_COLOR.OFF})`);
    }

    // ============================================================================
    // BUTTON TRANSPILERS
    // ============================================================================

    transpileButtonPressed(block, blocks) {
      const button = this.getInputValue(block, "BUTTON", blocks);
      const resultVar = this.allocateVariable(8, "button_pressed");

      const buttonMap = {
        '"up"': this.BUTTONS.UP,
        '"down"': this.BUTTONS.DOWN,
        '"left"': this.BUTTONS.LEFT,
        '"right"': this.BUTTONS.RIGHT,
        '"enter"': this.BUTTONS.ENTER,
        '"back"': this.BUTTONS.BACK,
        up: this.BUTTONS.UP,
        down: this.BUTTONS.DOWN,
        left: this.BUTTONS.LEFT,
        right: this.BUTTONS.RIGHT,
        enter: this.BUTTONS.ENTER,
        back: this.BUTTONS.BACK,
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
      this.addLine(`UI_BUTTON(FLUSH)`); // Clear button state
    }

    // ============================================================================
    // SENSOR TRANSPILERS
    // ============================================================================

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
        '"reflected"': this.SENSOR_MODE.COLOR_REFLECTED,
        '"ambient"': this.SENSOR_MODE.COLOR_AMBIENT,
        '"color"': this.SENSOR_MODE.COLOR_COLOR,
        '"raw"': this.SENSOR_MODE.COLOR_REFLECTED_RAW,
        reflected: this.SENSOR_MODE.COLOR_REFLECTED,
        ambient: this.SENSOR_MODE.COLOR_AMBIENT,
        color: this.SENSOR_MODE.COLOR_COLOR,
        raw: this.SENSOR_MODE.COLOR_REFLECTED_RAW,
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

      this.addComment(
        `Read color sensor RGB on port ${port} component ${component}`,
      );
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_COLOR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.COLOR_RGB_RAW}, mode)`);

      // RGB mode returns 3 values - need array
      const arrayName = `rgb_array_${this.arrayCounter++}`;
      this.addLine(`DATA16 ${arrayName}[3]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 3, ${arrayName})`);

      // Get specific component (0=R, 1=G, 2=B)
      const componentMap = {
        '"red"': 0,
        '"green"': 1,
        '"blue"': 2,
        red: 0,
        green: 1,
        blue: 2,
      };
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
        '"cm"': this.SENSOR_MODE.US_DIST_CM,
        '"inch"': this.SENSOR_MODE.US_DIST_IN,
        '"cm_si"': this.SENSOR_MODE.US_SI_CM,
        '"inch_si"': this.SENSOR_MODE.US_SI_IN,
        cm: this.SENSOR_MODE.US_DIST_CM,
        inch: this.SENSOR_MODE.US_DIST_IN,
        cm_si: this.SENSOR_MODE.US_SI_CM,
        inch_si: this.SENSOR_MODE.US_SI_IN,
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
        '"angle"': this.SENSOR_MODE.GYRO_ANGLE,
        '"rate"': this.SENSOR_MODE.GYRO_RATE,
        '"fast"': this.SENSOR_MODE.GYRO_FAS,
        '"angle_rate"': this.SENSOR_MODE.GYRO_G_AND_A,
        angle: this.SENSOR_MODE.GYRO_ANGLE,
        rate: this.SENSOR_MODE.GYRO_RATE,
        fast: this.SENSOR_MODE.GYRO_FAS,
        angle_rate: this.SENSOR_MODE.GYRO_G_AND_A,
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

      this.addComment(
        `Read IR beacon heading on port ${port} channel ${channel}`,
      );
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_SEEK}, mode)`);

      // Seeker mode returns 8 values (heading & distance for 4 channels)
      const arrayName = `ir_seek_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[8]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 8, ${arrayName})`);

      // Heading is at index (channel-1)*2
      const headingIndex = `((${channel} - 1) * 2)`;
      this.addLine(`ARRAY_READ(${arrayName}, ${headingIndex}, ${resultVar})`);

      return resultVar;
    }

    transpileIRBeaconDistance(block, blocks) {
      const port = this.getInputValue(block, "PORT", blocks);
      const channel = this.getInputValue(block, "CHANNEL", blocks);
      const portNum = this.INPUT_PORTS[port.replace(/"/g, "")] || "0";
      const resultVar = this.allocateVariable(8, "ir_distance");

      this.addComment(
        `Read IR beacon distance on port ${port} channel ${channel}`,
      );
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_SEEK}, mode)`);

      // Seeker mode returns 8 values (heading & distance for 4 channels)
      const arrayName = `ir_seek_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[8]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 8, ${arrayName})`);

      // Distance is at index (channel-1)*2 + 1
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

      this.addComment(
        `Check IR remote button on port ${port} channel ${channel} button ${button}`,
      );
      this.addLine(`MOVE8_8(${portNum}, port)`);
      this.addLine(`MOVE8_8(${this.SENSOR_TYPE.EV3_IR}, type)`);
      this.addLine(`MOVE8_8(${this.SENSOR_MODE.IR_REMOTE}, mode)`);

      // Remote mode returns 4 values (one per channel)
      const arrayName = `ir_remote_${this.arrayCounter++}`;
      this.addLine(`DATA8 ${arrayName}[4]`);
      this.addLine(`INPUT_READSI(0, port, type, mode, 4, ${arrayName})`);

      // Get channel value
      const channelIndex = `(${channel} - 1)`;
      const channelValue = this.allocateVariable(8, "ir_chan_val");
      this.addLine(
        `ARRAY_READ(${arrayName}, ${channelIndex}, ${channelValue})`,
      );

      // Check if specific button is pressed (button codes: 0=none, 1-11=buttons)
      const buttonMap = {
        '"1"': 1,
        '"2"': 2,
        '"3"': 3,
        '"4"': 4,
        '"5"': 5,
        '"6"': 6,
        '"7"': 7,
        '"8"': 8,
        '"9"': 9,
        '"10"': 10,
        '"11"': 11,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        11: 11,
      };
      const buttonCode = buttonMap[button] || 1;

      this.addLine(`CP_EQ8(${channelValue}, ${buttonCode}, ${resultVar})`);

      return resultVar;
    }

    // ============================================================================
    // CONTROL TRANSPILERS
    // ============================================================================

    transpileWait(block, blocks) {
      const duration = this.getInputValue(block, "DURATION", blocks);

      this.addComment(`Wait ${duration} seconds`);

      // Calculate time_ms (duration * 1000)
      const timeMs = this.evaluateExpression(duration, "*", 1000, 32);
      this.addLine(`MOVE32_32(${timeMs}, time_ms)`);

      const timerVar = this.getOrCreateTimer(0);
      this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
      this.addLine(`TIMER_READY(${timerVar})`);
    }

    transpileWaitSeconds(block, blocks) {
      const time = this.getInputValue(block, "TIME", blocks);

      this.addComment(`Wait ${time} seconds`);

      // Calculate time_ms (time * 1000)
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

      // Check condition
      this.addLine(`JR_GTEQ32(${counterVar}, ${times}, ${loopEnd})`);

      // Process substack
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) {
        this.processBlockChain(substackId, blocks);
      }

      // Increment counter
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

      // Process substack
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) {
        this.processBlockChain(substackId, blocks);
      }

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
      if (substackId) {
        this.processBlockChain(substackId, blocks);
      }
      this.indentLevel--;

      this.addLine(`${endLabel}:`);
    }

    transpileIfElse(block, blocks) {
      const condition = this.evaluateCondition(block, "CONDITION", blocks);
      const elseLabel = this.generateLabel("ELSE");
      const endLabel = this.generateLabel("IF_END");

      this.addComment("If-else condition");
      this.addLine(`JR_FALSE(${condition}, ${elseLabel})`);

      // If branch
      this.indentLevel++;
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) {
        this.processBlockChain(substackId, blocks);
      }
      this.addLine(`JR(${endLabel})`);
      this.indentLevel--;

      // Else branch
      this.addLine(`${elseLabel}:`);
      this.indentLevel++;
      const substack2Id = this.getSubstackId(block, "SUBSTACK2");
      if (substack2Id) {
        this.processBlockChain(substack2Id, blocks);
      }
      this.indentLevel--;

      this.addLine(`${endLabel}:`);
    }

    transpileRepeatUntil(block, blocks) {
      const loopStart = this.generateLabel("UNTIL_START");
      const loopEnd = this.generateLabel("UNTIL_END");

      this.addComment("Repeat until");
      this.addLine(`${loopStart}:`);
      this.indentLevel++;

      // Check condition
      const condition = this.evaluateCondition(block, "CONDITION", blocks);
      this.addLine(`JR_TRUE(${condition}, ${loopEnd})`);

      // Process substack
      const substackId = this.getSubstackId(block, "SUBSTACK");
      if (substackId) {
        this.processBlockChain(substackId, blocks);
      }

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

    // ============================================================================
    // EVENT TRANSPILERS
    // ============================================================================

    transpileBroadcast(block, blocks) {
      const broadcastInput = this.getInputValue(
        block,
        "BROADCAST_INPUT",
        blocks,
      );
      const broadcastName = broadcastInput.replace(/'/g, "").replace(/"/g, "");

      const handler = this.broadcastHandlers.get(broadcastName);
      if (handler) {
        this.addComment(`Broadcast: ${broadcastName}`);
        this.addLine(`CALL(${handler.label})`);
      } else {
        this.addComment(`WARNING: No handler for broadcast: ${broadcastName}`);
        this.log(
          `WARNING: No handler for broadcast: ${broadcastName}`,
          null,
          "WARN",
        );
      }
    }

    transpileBroadcastAndWait(block, blocks) {
      // Same as broadcast in LMS (no true threading)
      this.transpileBroadcast(block, blocks);
    }

    // ============================================================================
    // MOTION TRANSPILERS (Simplified)
    // ============================================================================

    transpileMoveSteps(block, blocks) {
      const steps = this.getInputValue(block, "STEPS", blocks);

      this.addComment(`Move ${steps} steps`);

      // Use tank drive on B & C
      const ports = `(${this.OUTPUT_PORTS.B} | ${this.OUTPUT_PORTS.C})`;
      this.addLine(`MOVE8_8(${ports}, ports)`);

      // Calculate steps * 10
      const scaledSteps = this.evaluateExpression(steps, "*", 10, 32);
      this.addLine(`MOVE32_32(${scaledSteps}, degrees)`);

      this.addLine(`OUTPUT_STEP_POWER(0, ports, 50, 10, degrees, 10, 1)`);
    }

    transpileTurnRight(block, blocks) {
      const degrees = this.getInputValue(block, "DEGREES", blocks);

      this.addComment(`Turn right ${degrees} degrees`);

      // Left motor forward, right motor backward
      // Calculate degrees * 2
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

      // Left motor backward, right motor forward
      // Calculate degrees * 2
      const scaledDegrees = this.evaluateExpression(degrees, "*", 2, 32);
      this.addLine(`MOVE32_32(${scaledDegrees}, degrees)`);

      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.B}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, -50, 10, degrees, 10, 0)`);
      this.addLine(`MOVE8_8(${this.OUTPUT_PORTS.C}, port)`);
      this.addLine(`OUTPUT_STEP_POWER(0, port, 50, 10, degrees, 10, 1)`);
    }

    // ============================================================================
    // DATA TRANSPILERS
    // ============================================================================

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
        // Initialize to 0
        this.addLine(`MOVE32_32(0, ${lmsVar})`);
      }

      this.addComment(`Change ${varName} by ${value}`);
      this.addLine(`ADD32(${varInfo.lmsVar}, ${value}, ${varInfo.lmsVar})`);
    }

    // ============================================================================
    // TIMER TRANSPILERS
    // ============================================================================

    transpileResetTimer(block, blocks) {
      const timer = this.getInputValue(block, "TIMER", blocks);
      const timerVar = this.getOrCreateTimer(timer);

      this.addComment(`Reset timer ${timer}`);
      this.addLine(`MOVE32_32(0, ${timerVar})`);
      this.addLine(`TIMER_READ(${timerVar})`); // Read to reset
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

    // ============================================================================
    // SYSTEM TRANSPILERS
    // ============================================================================

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

    // ============================================================================
    // LOOKS TRANSPILERS
    // ============================================================================

    transpileSay(block, blocks) {
      const message = this.getInputValue(block, "MESSAGE", blocks);

      this.addComment(`Say: ${message}`);
      // Display on screen
      this.addLine(`UI_DRAW(TEXT, 0, 0, 50, ${message})`);
      this.addLine(`UI_DRAW(UPDATE)`);

      if (block.opcode === "looks_sayforsecs") {
        const secs = this.getInputValue(block, "SECS", blocks);

        // Calculate secs * 1000
        const timeMs = this.evaluateExpression(secs, "*", 1000, 32);
        this.addLine(`MOVE32_32(${timeMs}, time_ms)`);

        const timerVar = this.getOrCreateTimer(0);
        this.addLine(`TIMER_WAIT(time_ms, ${timerVar})`);
        this.addLine(`TIMER_READY(${timerVar})`);
        this.addLine(`UI_DRAW(FILLWINDOW, 0, 0, 0)`);
        this.addLine(`UI_DRAW(UPDATE)`);
      }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

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
            // String value - use SINGLE QUOTES per documentation
            if (typeof primitiveValue === "number") {
              return String(primitiveValue);
            }
            return `'${primitiveValue}'`; // SINGLE QUOTES for LMS strings
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

            if (primitiveType >= 4 && primitiveType <= 8) {
              return String(primitiveValue);
            } else if (primitiveType === 10) {
              if (typeof primitiveValue === "number") {
                return String(primitiveValue);
              }
              return `'${primitiveValue}'`; // SINGLE QUOTES for LMS strings
            }
          }
        }
      }

      return "0";
    }

    /**
     *< Evaluates arithmetic expressions at transpile time if possible
     * Returns either a calculated value or generates LMS math operations
     */
    evaluateExpression(value, operation, operand, resultType = 32) {
      // Check if value is a pure number (not a variable)
      const numValue = parseFloat(value);

      if (
        !isNaN(numValue) &&
        !value.includes("var") &&
        !value.includes("timer") &&
        !value.includes("_") &&
        /^-?\d+\.?\d*$/.test(String(value).trim())
      ) {
        // It's a literal number - calculate at transpile time
        let result;
        switch (operation) {
          case "*":
            result = numValue * operand;
            break;
          case "/":
            result = numValue / operand;
            break;
          case "+":
            result = numValue + operand;
            break;
          case "-":
            result = numValue - operand;
            break;
          default:
            result = numValue;
        }

        // Return integer or float based on result type
        if (resultType === "F" || resultType === "DATAF") {
          return result.toFixed(1) + "F";
        }
        return Math.round(result).toString();
      } else {
        // It's a variable - generate LMS math operations
        const resultVar = this.allocateVariable(resultType, `calc_result`);
        const operandConst = operand.toString();

        switch (operation) {
          case "*":
            if (resultType === 32) {
              this.addLine(`MUL32(${value}, ${operandConst}, ${resultVar})`);
            } else if (resultType === 16) {
              this.addLine(`MUL16(${value}, ${operandConst}, ${resultVar})`);
            } else if (resultType === "F") {
              this.addLine(`MULF(${value}, ${operandConst}, ${resultVar})`);
            }
            break;
          case "/":
            if (resultType === 32) {
              this.addLine(`DIV32(${value}, ${operandConst}, ${resultVar})`);
            } else if (resultType === 16) {
              this.addLine(`DIV16(${value}, ${operandConst}, ${resultVar})`);
            }
            break;
          case "+":
            if (resultType === 32) {
              this.addLine(`ADD32(${value}, ${operandConst}, ${resultVar})`);
            } else if (resultType === 16) {
              this.addLine(`ADD16(${value}, ${operandConst}, ${resultVar})`);
            }
            break;
          case "-":
            if (resultType === 32) {
              this.addLine(`SUB32(${value}, ${operandConst}, ${resultVar})`);
            } else if (resultType === 16) {
              this.addLine(`SUB16(${value}, ${operandConst}, ${resultVar})`);
            }
            break;
        }

        return resultVar;
      }
    }

    evaluateBlock(block, blocks) {
      const opcode = block.opcode;

      // Number blocks
      if (
        opcode === "math_number" ||
        opcode === "math_whole_number" ||
        opcode === "math_positive_number" ||
        opcode === "math_integer"
      ) {
        const num = this.getFieldValue(block, "NUM");
        return num || "0";
      }

      // Text blocks
      else if (opcode === "text") {
        const text = this.getFieldValue(block, "TEXT");
        if (typeof text === "number" || !isNaN(text)) {
          return String(text);
        }
        return `'${text || ""}'`; // SINGLE QUOTES for LMS strings
      }

      // Variable blocks
      else if (opcode === "data_variable") {
        const varName = this.getFieldValue(block, "VARIABLE");
        let varInfo = this.variables.get(varName);
        if (!varInfo) {
          const lmsVar = this.allocateVariable(32, this.sanitizeName(varName));
          varInfo = { lmsVar, type: 32 };
          this.variables.set(varName, varInfo);
          this.addLine(`MOVE32_32(0, ${lmsVar})`);
        }
        return varInfo.lmsVar;
      }

      // Math operators
      else if (opcode === "operator_add") {
        return this.evaluateBinaryOp(block, blocks, "ADD32");
      } else if (opcode === "operator_subtract") {
        return this.evaluateBinaryOp(block, blocks, "SUB32");
      } else if (opcode === "operator_multiply") {
        return this.evaluateBinaryOp(block, blocks, "MUL32");
      } else if (opcode === "operator_divide") {
        return this.evaluateBinaryOp(block, blocks, "DIV32");
      } else if (opcode === "operator_mod") {
        // LMS: a mod b = a - (a/b)*b
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
          abs: "ABS",
          floor: "FLOOR",
          ceiling: "CEIL",
          sqrt: "SQRT",
          sin: "SIN",
          cos: "COS",
          tan: "TAN",
          asin: "ASIN",
          acos: "ACOS",
          atan: "ATAN",
          ln: "LN",
          log: "LOG",
          "e ^": "EXP",
          "10 ^": "POW", // Special case
        };

        const mathFunc = mathFuncMap[operator];
        if (mathFunc === "POW") {
          this.addLine(`MATH(POW, 10, ${num}, ${resultVar})`);
        } else if (mathFunc) {
          this.addLine(`MATH(${mathFunc}, ${num}, ${resultVar})`);
        } else {
          this.log(
            `WARNING: Unsupported math operation: ${operator}`,
            null,
            "WARN",
          );
          return num;
        }
        return resultVar;
      }

      // String operators
      else if (opcode === "operator_join") {
        // String concatenation not directly supported in LMS
        const str1 = this.getInputValue(block, "STRING1", blocks);
        this.log("WARNING: String join not fully supported", null, "WARN");
        return str1;
      } else if (opcode === "operator_letter_of") {
        this.log("WARNING: String indexing not supported", null, "WARN");
        return "''";
      } else if (opcode === "operator_length") {
        this.log("WARNING: String length not supported", null, "WARN");
        return "0";
      }

      // Comparison operators
      else if (
        opcode === "operator_gt" ||
        opcode === "operator_lt" ||
        opcode === "operator_equals"
      ) {
        return this.evaluateComparison(block, blocks);
      }

      // Sensor reporters
      else if (opcode === "ev3lms_motorPosition") {
        return this.evaluateMotorPosition(block, blocks);
      } else if (opcode === "ev3lms_motorSpeed") {
        return this.evaluateMotorSpeed(block, blocks);
      } else if (opcode === "ev3lms_touchSensor") {
        return this.transpileTouchSensor(block, blocks);
      } else if (opcode === "ev3lms_touchSensorBumped") {
        return this.transpileTouchSensorBumped(block, blocks);
      } else if (opcode === "ev3lms_colorSensor") {
        return this.transpileColorSensor(block, blocks);
      } else if (opcode === "ev3lms_colorSensorRGB") {
        return this.transpileColorSensorRGB(block, blocks);
      } else if (opcode === "ev3lms_ultrasonicSensor") {
        return this.transpileUltrasonicSensor(block, blocks);
      } else if (opcode === "ev3lms_ultrasonicListen") {
        return this.transpileUltrasonicListen(block, blocks);
      } else if (opcode === "ev3lms_gyroSensor") {
        return this.transpileGyroSensor(block, blocks);
      } else if (opcode === "ev3lms_irProximity") {
        return this.transpileIRProximity(block, blocks);
      } else if (opcode === "ev3lms_irBeaconHeading") {
        return this.transpileIRBeaconHeading(block, blocks);
      } else if (opcode === "ev3lms_irBeaconDistance") {
        return this.transpileIRBeaconDistance(block, blocks);
      } else if (opcode === "ev3lms_irRemoteButton") {
        return this.transpileIRRemoteButton(block, blocks);
      } else if (opcode === "ev3lms_buttonPressed") {
        return this.transpileButtonPressed(block, blocks);
      } else if (opcode === "ev3lms_timerValue") {
        return this.transpileTimerValue(block, blocks);
      } else if (opcode === "ev3lms_batteryLevel") {
        return this.transpileBatteryLevel(block, blocks);
      } else if (opcode === "ev3lms_batteryVoltage") {
        return this.transpileBatteryVoltage(block, blocks);
      } else if (opcode === "ev3lms_batteryCurrent") {
        return this.transpileBatteryCurrent(block, blocks);
      } else if (opcode === "ev3lms_freeMemory") {
        return this.transpileFreeMemory(block, blocks);
      }

      // Motor port menu
      else if (
        opcode === "ev3lms_menu_motorPorts" ||
        opcode === "ev3lms_motorPorts_menu"
      ) {
        const value =
          this.getFieldValue(block, "motorPorts") ||
          this.getFieldValue(block, "PORT");
        this.log(`Motor port menu: ${value}`, null, "DEBUG");
        return value || "A"; // Return raw port letter
      }

      // Sensor port menu
      else if (
        opcode === "ev3lms_menu_sensorPorts" ||
        opcode === "ev3lms_sensorPorts_menu"
      ) {
        const value =
          this.getFieldValue(block, "sensorPorts") ||
          this.getFieldValue(block, "PORT");
        this.log(`Sensor port menu: ${value}`, null, "DEBUG");
        return value || "1"; // Return raw port number
      }

      // Generic menu blocks
      else if (opcode.endsWith("_menu") || opcode.includes("menu_")) {
        const fieldNames = Object.keys(block.fields);
        if (fieldNames.length > 0) {
          const value = this.getFieldValue(block, fieldNames[0]);
          this.log(`Menu block evaluated: ${opcode} = ${value}`, null, "DEBUG");
          return `'${value}'`; // SINGLE QUOTES
        }
        this.log(
          `Menu block ${opcode} has no fields, using empty string`,
          null,
          "DEBUG",
        );
        return "''";
      }

      // Default
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
        // No condition - return true
        const trueVar = this.allocateVariable(8);
        this.addLine(`MOVE8_8(1, ${trueVar})`);
        return trueVar;
      }

      // Get the condition block
      let conditionBlock = null;
      if (typeof input === "object" && !Array.isArray(input)) {
        if (input.block) {
          conditionBlock = blocks._blocks[input.block];
        }
      } else if (Array.isArray(input) && input.length >= 2) {
        if (typeof input[1] === "string") {
          conditionBlock = blocks._blocks[input[1]];
        }
      }

      if (!conditionBlock) {
        const trueVar = this.allocateVariable(8);
        this.addLine(`MOVE8_8(1, ${trueVar})`);
        return trueVar;
      }

      // Evaluate the condition block
      const opcode = conditionBlock.opcode;

      if (
        opcode === "operator_gt" ||
        opcode === "operator_lt" ||
        opcode === "operator_equals"
      ) {
        return this.evaluateComparison(conditionBlock, blocks);
      } else if (opcode === "operator_and") {
        const cond1 = this.evaluateCondition(
          conditionBlock,
          "OPERAND1",
          blocks,
        );
        const cond2 = this.evaluateCondition(
          conditionBlock,
          "OPERAND2",
          blocks,
        );
        const resultVar = this.allocateVariable(8);
        this.addLine(`AND8(${cond1}, ${cond2}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_or") {
        const cond1 = this.evaluateCondition(
          conditionBlock,
          "OPERAND1",
          blocks,
        );
        const cond2 = this.evaluateCondition(
          conditionBlock,
          "OPERAND2",
          blocks,
        );
        const resultVar = this.allocateVariable(8);
        this.addLine(`OR8(${cond1}, ${cond2}, ${resultVar})`);
        return resultVar;
      } else if (opcode === "operator_not") {
        const cond = this.evaluateCondition(conditionBlock, "OPERAND", blocks);
        const resultVar = this.allocateVariable(8);
        this.addLine(`XOR8(${cond}, 1, ${resultVar})`); // NOT via XOR with 1
        return resultVar;
      } else {
        // Try to evaluate as a boolean reporter
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
      // Convert motor port (A-D) to input port number (0-3)
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
  // MAIN EXTENSION CLASS
  // ============================================================================

  class EV3LMSExtension {
    constructor() {
      // Configuration
      this.ev3IP = "192.168.178.50";
      this.ev3Port = 8080;
      this.lmsApiUrl = "http://127.0.0.1";
      this.lmsApiPort = 7860;

      // State
      this.streamingMode = false;
      this.lmsCode = "";
      this.rbfBytecode = null;
      this.rbfBase64 = "";

      // Components
      this.transpiler = new LMSTranspiler();

      // Timeouts
      this.REQUEST_TIMEOUT_MS = 5000;
      this.LONG_TIMEOUT_MS = 60000;
      this.COMPILE_TIMEOUT_MS = 30000;

      this.log("Extension initialized", {
        lang: currentLang,
        version: "2.1.0",
      });
    }

    log(message, data = null, level = "INFO") {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [EV3-LMS-${level}] ${message}`;

      if (level === "ERROR") {
        console.error(logEntry, data || "");
      } else if (level === "WARN") {
        console.warn(logEntry, data || "");
      } else {
        console.log(logEntry, data || "");
      }
    }

    getInfo() {
      return {
        id: "ev3lms",
        name: t("extensionName"),
        color1: "#7C3A9A",
        color2: "#5C2A7A",
        color3: "#4C1A6A",
        blocks: [
          // Connection
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("connection"),
          },
          {
            opcode: "setEV3IP",
            blockType: Scratch.BlockType.COMMAND,
            text: t("setEV3IP"),
            arguments: {
              IP: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "192.168.178.50",
              },
            },
          },
          {
            opcode: "setLMSApiUrl",
            blockType: Scratch.BlockType.COMMAND,
            text: t("setLMSApiUrl"),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "http://127.0.0.1",
              },
              PORT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 7860,
              },
            },
          },
          {
            opcode: "enableStreaming",
            blockType: Scratch.BlockType.COMMAND,
            text: t("enableStreaming"),
          },
          {
            opcode: "disableStreaming",
            blockType: Scratch.BlockType.COMMAND,
            text: t("disableStreaming"),
          },
          {
            opcode: "testConnection",
            blockType: Scratch.BlockType.REPORTER,
            text: t("testConnection"),
          },
          {
            opcode: "testCompiler",
            blockType: Scratch.BlockType.REPORTER,
            text: t("testCompiler"),
          },

          "---",

          // Transpilation & Compilation
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("transpilation"),
          },
          {
            opcode: "transpileToLMS",
            blockType: Scratch.BlockType.COMMAND,
            text: t("transpileToLMS"),
          },
          {
            opcode: "showLMSCode",
            blockType: Scratch.BlockType.COMMAND,
            text: t("showLMSCode"),
          },
          {
            opcode: "downloadLMSCode",
            blockType: Scratch.BlockType.COMMAND,
            text: t("downloadLMSCode"),
          },
          {
            opcode: "compileToRBF",
            blockType: Scratch.BlockType.COMMAND,
            text: t("compileToRBF"),
          },
          {
            opcode: "showRBFCode",
            blockType: Scratch.BlockType.COMMAND,
            text: t("showRBFCode"),
          },
          {
            opcode: "downloadRBF",
            blockType: Scratch.BlockType.COMMAND,
            text: t("downloadRBF"),
          },
          {
            opcode: "showDebugLog",
            blockType: Scratch.BlockType.COMMAND,
            text: "show transpilation diagnostics",
          },
          {
            opcode: "testDiagnostics",
            blockType: Scratch.BlockType.COMMAND,
            text: "🔧 Show full transpilation diagnostics",
          },

          "---",

          // Motors
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("motors"),
          },
          {
            opcode: "motorRun",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorRun"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "motorRunTime",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorRunTime"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "motorRunRotations",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorRunRotations"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              ROTATIONS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "motorRunDegrees",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorRunDegrees"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              DEGREES: { type: Scratch.ArgumentType.NUMBER, defaultValue: 90 },
              POWER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "motorStop",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorStop"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              BRAKE: { type: Scratch.ArgumentType.STRING, menu: "brakeMode" },
            },
          },
          {
            opcode: "motorReset",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorReset"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
            },
          },
          {
            opcode: "motorPolarity",
            blockType: Scratch.BlockType.COMMAND,
            text: t("motorPolarity"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
              POLARITY: {
                type: Scratch.ArgumentType.STRING,
                menu: "motorPolarity",
              },
            },
          },
          {
            opcode: "tankDrive",
            blockType: Scratch.BlockType.COMMAND,
            text: t("tankDrive"),
            arguments: {
              LEFT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              RIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              UNIT: { type: Scratch.ArgumentType.STRING, menu: "driveUnit" },
            },
          },
          {
            opcode: "steerDrive",
            blockType: Scratch.BlockType.COMMAND,
            text: t("steerDrive"),
            arguments: {
              STEERING: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              SPEED: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              UNIT: { type: Scratch.ArgumentType.STRING, menu: "driveUnit" },
            },
          },
          {
            opcode: "motorPosition",
            blockType: Scratch.BlockType.REPORTER,
            text: t("motorPosition"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
            },
          },
          {
            opcode: "motorSpeed",
            blockType: Scratch.BlockType.REPORTER,
            text: t("motorSpeed"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "motorPorts" },
            },
          },

          "---",

          // Sensors
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("sensors"),
          },
          {
            opcode: "touchSensor",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("touchSensor"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
            },
          },
          {
            opcode: "touchSensorBumped",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("touchSensorBumped"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
            },
          },
          {
            opcode: "colorSensor",
            blockType: Scratch.BlockType.REPORTER,
            text: t("colorSensor"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              MODE: { type: Scratch.ArgumentType.STRING, menu: "colorModes" },
            },
          },
          {
            opcode: "colorSensorRGB",
            blockType: Scratch.BlockType.REPORTER,
            text: t("colorSensorRGB"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              COMPONENT: {
                type: Scratch.ArgumentType.STRING,
                menu: "rgbComponents",
              },
            },
          },
          {
            opcode: "ultrasonicSensor",
            blockType: Scratch.BlockType.REPORTER,
            text: t("ultrasonicSensor"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: "distanceUnits",
              },
            },
          },
          {
            opcode: "ultrasonicListen",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("ultrasonicListen"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
            },
          },
          {
            opcode: "gyroSensor",
            blockType: Scratch.BlockType.REPORTER,
            text: t("gyroSensor"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              MODE: { type: Scratch.ArgumentType.STRING, menu: "gyroModes" },
            },
          },
          {
            opcode: "gyroReset",
            blockType: Scratch.BlockType.COMMAND,
            text: t("gyroReset"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
            },
          },

          "---",

          // Infrared
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("infrared"),
          },
          {
            opcode: "irProximity",
            blockType: Scratch.BlockType.REPORTER,
            text: t("irProximity"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
            },
          },
          {
            opcode: "irBeaconHeading",
            blockType: Scratch.BlockType.REPORTER,
            text: t("irBeaconHeading"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "irBeaconDistance",
            blockType: Scratch.BlockType.REPORTER,
            text: t("irBeaconDistance"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "irRemoteButton",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("irRemoteButton"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "sensorPorts" },
              CHANNEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: "irButtons" },
            },
          },

          "---",

          // Buttons
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("buttons"),
          },
          {
            opcode: "buttonPressed",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("buttonPressed"),
            arguments: {
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: "buttons" },
            },
          },
          {
            opcode: "waitForButton",
            blockType: Scratch.BlockType.COMMAND,
            text: t("waitForButton"),
            arguments: {
              BUTTON: { type: Scratch.ArgumentType.STRING, menu: "buttons" },
            },
          },

          "---",

          // Display
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("display"),
          },
          {
            opcode: "screenClear",
            blockType: Scratch.BlockType.COMMAND,
            text: t("screenClear"),
          },
          {
            opcode: "screenText",
            blockType: Scratch.BlockType.COMMAND,
            text: t("screenText"),
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello",
              },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "screenTextLarge",
            blockType: Scratch.BlockType.COMMAND,
            text: t("screenTextLarge"),
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello",
              },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "drawPixel",
            blockType: Scratch.BlockType.COMMAND,
            text: t("drawPixel"),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "drawLine",
            blockType: Scratch.BlockType.COMMAND,
            text: t("drawLine"),
            arguments: {
              X1: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y1: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              X2: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y2: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "drawCircle",
            blockType: Scratch.BlockType.COMMAND,
            text: t("drawCircle"),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              R: { type: Scratch.ArgumentType.NUMBER, defaultValue: 20 },
              FILL: { type: Scratch.ArgumentType.STRING, menu: "fillMode" },
            },
          },
          {
            opcode: "drawRectangle",
            blockType: Scratch.BlockType.COMMAND,
            text: t("drawRectangle"),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
              W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
              H: { type: Scratch.ArgumentType.NUMBER, defaultValue: 30 },
              FILL: { type: Scratch.ArgumentType.STRING, menu: "fillMode" },
            },
          },
          {
            opcode: "screenUpdate",
            blockType: Scratch.BlockType.COMMAND,
            text: t("screenUpdate"),
          },
          {
            opcode: "screenInvert",
            blockType: Scratch.BlockType.COMMAND,
            text: t("screenInvert"),
          },

          "---",

          // Sound
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("sound"),
          },
          {
            opcode: "playTone",
            blockType: Scratch.BlockType.COMMAND,
            text: t("playTone"),
            arguments: {
              FREQ: { type: Scratch.ArgumentType.NUMBER, defaultValue: 440 },
              DURATION: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 500,
              },
            },
          },
          {
            opcode: "playNote",
            blockType: Scratch.BlockType.COMMAND,
            text: t("playNote"),
            arguments: {
              NOTE: { type: Scratch.ArgumentType.STRING, menu: "notes" },
              DURATION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "beep",
            blockType: Scratch.BlockType.COMMAND,
            text: t("beep"),
          },
          {
            opcode: "setVolume",
            blockType: Scratch.BlockType.COMMAND,
            text: t("setVolume"),
            arguments: {
              VOLUME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 80 },
            },
          },
          {
            opcode: "getVolume",
            blockType: Scratch.BlockType.REPORTER,
            text: t("getVolume"),
          },
          {
            opcode: "stopSound",
            blockType: Scratch.BlockType.COMMAND,
            text: t("stopSound"),
          },

          "---",

          // LEDs
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("leds"),
          },
          {
            opcode: "setLED",
            blockType: Scratch.BlockType.COMMAND,
            text: t("setLED"),
            arguments: {
              COLOR: { type: Scratch.ArgumentType.STRING, menu: "ledColors" },
            },
          },
          {
            opcode: "ledAllOff",
            blockType: Scratch.BlockType.COMMAND,
            text: t("ledAllOff"),
          },

          "---",

          // System
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("system"),
          },
          {
            opcode: "batteryLevel",
            blockType: Scratch.BlockType.REPORTER,
            text: t("batteryLevel"),
          },
          {
            opcode: "batteryCurrent",
            blockType: Scratch.BlockType.REPORTER,
            text: t("batteryCurrent"),
          },
          {
            opcode: "batteryVoltage",
            blockType: Scratch.BlockType.REPORTER,
            text: t("batteryVoltage"),
          },
          {
            opcode: "freeMemory",
            blockType: Scratch.BlockType.REPORTER,
            text: t("freeMemory"),
          },

          "---",

          // Timers
          {
            blockType: Scratch.BlockType.LABEL,
            text: t("timers"),
          },
          {
            opcode: "resetTimer",
            blockType: Scratch.BlockType.COMMAND,
            text: t("resetTimer"),
            arguments: {
              TIMER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "timerValue",
            blockType: Scratch.BlockType.REPORTER,
            text: t("timerValue"),
            arguments: {
              TIMER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "waitSeconds",
            blockType: Scratch.BlockType.COMMAND,
            text: t("waitSeconds"),
            arguments: {
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "waitMillis",
            blockType: Scratch.BlockType.COMMAND,
            text: t("waitMillis"),
            arguments: {
              TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1000 },
            },
          },
        ],
        menus: {
          motorPorts: {
            acceptReporters: true,
            items: ["A", "B", "C", "D"],
          },
          sensorPorts: {
            acceptReporters: true,
            items: ["1", "2", "3", "4"],
          },
          brakeMode: {
            items: ["brake", "coast"],
          },
          motorPolarity: {
            items: [
              { text: "forward (+1)", value: "1" },
              { text: "reverse (-1)", value: "-1" },
              { text: "toggle (0)", value: "0" },
            ],
          },
          driveUnit: {
            items: ["seconds", "rotations", "degrees"],
          },
          fillMode: {
            items: ["outline", "filled"],
          },
          ledColors: {
            items: ["OFF", "GREEN", "RED", "ORANGE"],
          },
          notes: {
            items: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
          },
          buttons: {
            items: ["up", "down", "left", "right", "enter", "back"],
          },
          colorModes: {
            items: ["reflected", "ambient", "color", "raw"],
          },
          rgbComponents: {
            items: ["red", "green", "blue"],
          },
          distanceUnits: {
            items: ["cm", "inch"],
          },
          gyroModes: {
            items: ["angle", "rate", "fast", "angle_rate"],
          },
          irButtons: {
            items: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
          },
        },
      };
    }

    // ============================================================================
    // CONNECTION
    // ============================================================================

    setEV3IP(args) {
      this.ev3IP = args.IP;
      this.log("EV3 IP configured", { ip: this.ev3IP });
    }

    setLMSApiUrl(args) {
      this.lmsApiUrl = args.URL;
      this.lmsApiPort = args.PORT;
      this.log("LMS API configured", {
        url: this.lmsApiUrl,
        port: this.lmsApiPort,
      });
    }

    enableStreaming() {
      this.streamingMode = true;
      this.log("Streaming mode enabled");
    }

    disableStreaming() {
      this.streamingMode = false;
      this.log("Streaming mode disabled");
    }

    async testConnection() {
      try {
        const url = `http://${this.ev3IP}:${this.ev3Port}/`;
        const response = await this.fetchWithTimeout(
          url,
          { method: "GET" },
          2000,
        );

        if (response.ok) {
          this.log("EV3 connection test successful");
          return t("connected");
        } else {
          this.log(
            "EV3 connection test failed",
            { status: response.status },
            "WARN",
          );
          return t("notConnected");
        }
      } catch (error) {
        this.log(
          "EV3 connection test error",
          { error: error.message },
          "ERROR",
        );
        return t("notConnected");
      }
    }

    async testCompiler() {
      try {
        const url = `${this.lmsApiUrl}:${this.lmsApiPort}/`;
        const response = await this.fetchWithTimeout(
          url,
          { method: "GET" },
          2000,
        );

        if (response.ok) {
          this.log("Compiler connection test successful");
          return t("connected");
        } else {
          this.log(
            "Compiler connection test failed",
            { status: response.status },
            "WARN",
          );
          return t("notConnected");
        }
      } catch (error) {
        this.log(
          "Compiler connection test error",
          { error: error.message },
          "ERROR",
        );
        return t("notConnected");
      }
    }

    // ============================================================================
    // TRANSPILATION & COMPILATION
    // ============================================================================

    transpileToLMS() {
      try {
        this.lmsCode = this.transpiler.transpile();
        this.log("LMS transpilation complete", {
          length: this.lmsCode.length,
          errors: this.transpiler.errors.length,
          warnings: this.transpiler.warnings.length,
        });

        let message = "✅ LMS code generated!";

        // Add errors with details
        if (this.transpiler.errors.length > 0) {
          message += `\n\n❌ ${this.transpiler.errors.length} ERROR(S):\n`;
          message += this.transpiler.errors
            .map((err, i) => `${i + 1}. ${err.message}`)
            .join("\n");
        }

        // Add warnings with details
        if (this.transpiler.warnings.length > 0) {
          message += `\n\n⚠️ ${this.transpiler.warnings.length} WARNING(S):\n`;
          message += this.transpiler.warnings
            .map((warn, i) => `${i + 1}. ${warn.message}`)
            .join("\n");
        }

        // Show modal instead of alert if there are errors/warnings
        if (
          this.transpiler.errors.length > 0 ||
          this.transpiler.warnings.length > 0
        ) {
          this.showDiagnosticsModal(message);
        } else {
          alert(message);
        }
      } catch (error) {
        this.log(
          "Transpilation error",
          {
            error: error.message,
            stack: error.stack,
          },
          "ERROR",
        );
        alert("❌ Transpilation failed:\n" + error.message);
      }
    }

    testDiagnostics() {
      console.log("Test diagnostics called");
      console.log("Transpiler exists:", !!this.transpiler);
      console.log("Errors:", this.transpiler?.errors);
      console.log("Warnings:", this.transpiler?.warnings);
      console.log(
        "showFullDiagnostics method exists:",
        typeof this.showFullDiagnostics,
      );

      if (typeof this.showFullDiagnostics === "function") {
        this.showFullDiagnostics();
      } else {
        alert("showFullDiagnostics method not found!");
      }
    }

    showDebugLog() {
      if (!this.lmsCode) {
        alert("No code has been generated yet. Generate LMS code first.");
        return;
      }
      this.showFullDiagnostics();
    }

    showLMSCode() {
      if (!this.lmsCode) {
        alert(t("noCodeGenerated"));
        return;
      }

      this.showModal(t("generatedCode"), this.lmsCode);
    }

    downloadLMSCode() {
      if (!this.lmsCode) {
        alert(t("generateFirst"));
        return;
      }

      this.downloadFile("program.lms", this.lmsCode, "text/plain");
      alert(t("downloaded") + " program.lms");
    }

    showFullDiagnostics() {
      console.log("showFullDiagnostics called"); // Debug log

      let fullReport = "=== TRANSPILATION DIAGNOSTICS ===\n\n";

      fullReport += `Generated Code Length: ${this.lmsCode.length} characters\n`;
      fullReport += `Total Lines: ${this.lmsCode.split("\n").length}\n`;
      fullReport += `Errors: ${this.transpiler.errors.length}\n`;
      fullReport += `Warnings: ${this.transpiler.warnings.length}\n\n`;

      if (this.transpiler.errors.length > 0) {
        fullReport += "=== ERRORS ===\n";
        this.transpiler.errors.forEach((err, i) => {
          fullReport += `\nError ${i + 1}:\n`;
          fullReport += `  Time: ${err.timestamp}\n`;
          fullReport += `  Message: ${err.message}\n`;
          if (err.data) {
            fullReport += `  Details: ${JSON.stringify(err.data, null, 2)}\n`;
          }
        });
        fullReport += "\n";
      }

      if (this.transpiler.warnings.length > 0) {
        fullReport += "=== WARNINGS ===\n";
        this.transpiler.warnings.forEach((warn, i) => {
          fullReport += `\nWarning ${i + 1}:\n`;
          fullReport += `  Time: ${warn.timestamp}\n`;
          fullReport += `  Message: ${warn.message}\n`;
          if (warn.data) {
            fullReport += `  Details: ${JSON.stringify(warn.data, null, 2)}\n`;
          }
        });
        fullReport += "\n";
      }

      if (this.transpiler.debugLog && this.transpiler.debugLog.length > 0) {
        fullReport += "=== DEBUG LOG (Last 100 entries) ===\n";
        const recentLogs = this.transpiler.debugLog.slice(-100);
        recentLogs.forEach((log) => {
          fullReport += `[${log.timestamp}] [${log.level}] ${log.message}\n`;
          if (log.data) {
            fullReport += `  Data: ${JSON.stringify(log.data)}\n`;
          }
        });
      } else {
        fullReport += "=== DEBUG LOG ===\nNo debug entries available.\n";
      }

      console.log(
        "Full report generated:",
        fullReport.substring(0, 200) + "...",
      ); // Debug
      this.showModal("Full Diagnostic Report", fullReport);
    }

    showDiagnosticsModal(message) {
      const modal = document.createElement("div");
      modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 25px;
    border: 3px solid #7C3A9A;
    border-radius: 10px;
    max-width: 700px;
    max-height: 80%;
    overflow: auto;
    z-index: 10000;
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
    color: black;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

      const titleEl = document.createElement("h3");
      titleEl.textContent = "Transpilation Results";
      titleEl.style.cssText = "margin-top: 0; color: #7C3A9A; font-size: 20px;";

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = `
    background: #f9f9f9;
    border: 1px solid #ddd;
    padding: 15px;
    border-radius: 5px;
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.6;
  `;

      // Format the message with colors
      const formattedMessage = message
        .replace(
          /✅/g,
          '<span style="color: green; font-weight: bold;">✅</span>',
        )
        .replace(
          /❌/g,
          '<span style="color: red; font-weight: bold;">❌</span>',
        )
        .replace(
          /⚠️/g,
          '<span style="color: orange; font-weight: bold;">⚠️</span>',
        )
        .replace(
          /ERROR\(S\):/g,
          '<span style="color: red; font-weight: bold;">ERROR(S):</span>',
        )
        .replace(
          /WARNING\(S\):/g,
          '<span style="color: orange; font-weight: bold;">WARNING(S):</span>',
        );

      contentDiv.innerHTML = formattedMessage;

      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText =
        "margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;";

      // View Details button (opens full log)
      const detailsBtn = document.createElement("button");
      detailsBtn.textContent = "View Full Log";
      detailsBtn.style.cssText =
        "padding: 10px 20px; background: #5C2A7A; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;";

      // CRITICAL: Bind 'this' context properly
      const self = this; // Store reference to extension instance
      detailsBtn.onclick = function () {
        console.log("View Full Log clicked"); // Debug
        self.showFullDiagnostics(); // Call on the correct context
      };

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.style.cssText =
        "padding: 10px 20px; background: #7C3A9A; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;";
      closeBtn.onclick = () => {
        console.log("Close clicked"); // Debug
        document.body.removeChild(modal);
      };

      buttonContainer.appendChild(detailsBtn);
      buttonContainer.appendChild(closeBtn);

      modal.appendChild(titleEl);
      modal.appendChild(contentDiv);
      modal.appendChild(buttonContainer);

      document.body.appendChild(modal);
    }

    copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            alert("✅ Copied to clipboard!");
          })
          .catch((err) => {
            this.log(
              "Failed to copy to clipboard",
              { error: err.message },
              "ERROR",
            );
            // Fallback method
            this.fallbackCopyToClipboard(text);
          });
      } else {
        this.fallbackCopyToClipboard(text);
      }
    }

    fallbackCopyToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("✅ Copied to clipboard!");
      } catch (err) {
        alert("❌ Failed to copy to clipboard");
      }
      document.body.removeChild(textArea);
    }

    async compileToRBF() {
      if (!this.lmsCode) {
        alert(t("generateFirst"));
        return;
      }

      try {
        this.log("Starting RBF compilation");

        const url = `${this.lmsApiUrl}:${this.lmsApiPort}/compile`;

        const response = await this.fetchWithTimeout(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: this.lmsCode }),
          },
          this.COMPILE_TIMEOUT_MS,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        this.log("Compilation response received", { result });

        if (result.success) {
          this.rbfBase64 = result.base64;

          // Decode base64 to binary
          const binaryString = atob(this.rbfBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          this.rbfBytecode = bytes;

          this.log("RBF bytecode stored", { size: bytes.length });

          let message = t("compilationSuccess");
          if (result.message) {
            message += "\n\n" + result.message;
          }
          alert(message);
        } else {
          throw new Error(result.error || "Unknown compilation error");
        }
      } catch (error) {
        this.log("Compilation error", { error: error.message }, "ERROR");

        // Show detailed error modal instead of simple alert
        let errorMessage = t("compilationFailed") + "\n\n";
        errorMessage += "Error: " + error.message;

        // Try to parse compiler errors if available
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.errors) {
            errorMessage += "\n\nCompiler Errors:\n";
            errorData.errors.forEach((err, i) => {
              errorMessage += `${i + 1}. Line ${err.line || "?"}: ${err.message}\n`;
            });
          }
        } catch (e) {
          // Not JSON, just show plain message
        }

        this.showModal("Compilation Failed", errorMessage);
      }
    }

    showRBFCode() {
      if (!this.rbfBytecode) {
        alert(t("compileFirst"));
        return;
      }

      // Convert to hex string
      const hexStr = Array.from(this.rbfBytecode)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");

      this.showModal(t("rbfBytecode"), hexStr);
    }

    downloadRBF() {
      if (!this.rbfBytecode) {
        alert(t("compileFirst"));
        return;
      }

      this.downloadFile(
        "program.rbf",
        this.rbfBytecode,
        "application/octet-stream",
      );
      alert(t("downloaded") + " program.rbf");
    }

    // ============================================================================
    // BLOCK IMPLEMENTATIONS (Streaming Mode - No-ops in transpile mode)
    // ============================================================================

    motorRun(args) {
      // No-op in transpile mode
      this.log("motorRun called (no-op in transpile mode)", args, "DEBUG");
    }

    motorRunTime(args) {
      this.log("motorRunTime called (no-op in transpile mode)", args, "DEBUG");
    }

    motorRunRotations(args) {
      this.log(
        "motorRunRotations called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
    }

    motorRunDegrees(args) {
      this.log(
        "motorRunDegrees called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
    }

    motorStop(args) {
      this.log("motorStop called (no-op in transpile mode)", args, "DEBUG");
    }

    motorReset(args) {
      this.log("motorReset called (no-op in transpile mode)", args, "DEBUG");
    }

    motorPolarity(args) {
      this.log("motorPolarity called (no-op in transpile mode)", args, "DEBUG");
    }

    tankDrive(args) {
      this.log("tankDrive called (no-op in transpile mode)", args, "DEBUG");
    }

    steerDrive(args) {
      this.log("steerDrive called (no-op in transpile mode)", args, "DEBUG");
    }

    motorPosition(args) {
      this.log("motorPosition called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    motorSpeed(args) {
      this.log("motorSpeed called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    touchSensor(args) {
      this.log("touchSensor called (no-op in transpile mode)", args, "DEBUG");
      return false;
    }

    touchSensorBumped(args) {
      this.log(
        "touchSensorBumped called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return false;
    }

    colorSensor(args) {
      this.log("colorSensor called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    colorSensorRGB(args) {
      this.log(
        "colorSensorRGB called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return 0;
    }

    ultrasonicSensor(args) {
      this.log(
        "ultrasonicSensor called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return 0;
    }

    ultrasonicListen(args) {
      this.log(
        "ultrasonicListen called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return false;
    }

    gyroSensor(args) {
      this.log("gyroSensor called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    gyroReset(args) {
      this.log("gyroReset called (no-op in transpile mode)", args, "DEBUG");
    }

    irProximity(args) {
      this.log("irProximity called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    irBeaconHeading(args) {
      this.log(
        "irBeaconHeading called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return 0;
    }

    irBeaconDistance(args) {
      this.log(
        "irBeaconDistance called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return 0;
    }

    irRemoteButton(args) {
      this.log(
        "irRemoteButton called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
      return false;
    }

    buttonPressed(args) {
      this.log("buttonPressed called (no-op in transpile mode)", args, "DEBUG");
      return false;
    }

    waitForButton(args) {
      this.log("waitForButton called (no-op in transpile mode)", args, "DEBUG");
    }

    screenClear() {
      this.log("screenClear called (no-op in transpile mode)", null, "DEBUG");
    }

    screenText(args) {
      this.log("screenText called (no-op in transpile mode)", args, "DEBUG");
    }

    screenTextLarge(args) {
      this.log(
        "screenTextLarge called (no-op in transpile mode)",
        args,
        "DEBUG",
      );
    }

    drawPixel(args) {
      this.log("drawPixel called (no-op in transpile mode)", args, "DEBUG");
    }

    drawLine(args) {
      this.log("drawLine called (no-op in transpile mode)", args, "DEBUG");
    }

    drawCircle(args) {
      this.log("drawCircle called (no-op in transpile mode)", args, "DEBUG");
    }

    drawRectangle(args) {
      this.log("drawRectangle called (no-op in transpile mode)", args, "DEBUG");
    }

    screenUpdate() {
      this.log("screenUpdate called (no-op in transpile mode)", null, "DEBUG");
    }

    screenInvert() {
      this.log("screenInvert called (no-op in transpile mode)", null, "DEBUG");
    }

    playTone(args) {
      this.log("playTone called (no-op in transpile mode)", args, "DEBUG");
    }

    playNote(args) {
      this.log("playNote called (no-op in transpile mode)", args, "DEBUG");
    }

    beep() {
      this.log("beep called (no-op in transpile mode)", null, "DEBUG");
    }

    setVolume(args) {
      this.log("setVolume called (no-op in transpile mode)", args, "DEBUG");
    }

    getVolume() {
      this.log("getVolume called (no-op in transpile mode)", null, "DEBUG");
      return 80;
    }

    stopSound() {
      this.log("stopSound called (no-op in transpile mode)", null, "DEBUG");
    }

    setLED(args) {
      this.log("setLED called (no-op in transpile mode)", args, "DEBUG");
    }

    ledAllOff() {
      this.log("ledAllOff called (no-op in transpile mode)", null, "DEBUG");
    }

    batteryLevel() {
      this.log("batteryLevel called (no-op in transpile mode)", null, "DEBUG");
      return 100;
    }

    batteryCurrent() {
      this.log(
        "batteryCurrent called (no-op in transpile mode)",
        null,
        "DEBUG",
      );
      return 0;
    }

    batteryVoltage() {
      this.log(
        "batteryVoltage called (no-op in transpile mode)",
        null,
        "DEBUG",
      );
      return 9.0;
    }

    freeMemory() {
      this.log("freeMemory called (no-op in transpile mode)", null, "DEBUG");
      return 0;
    }

    resetTimer(args) {
      this.log("resetTimer called (no-op in transpile mode)", args, "DEBUG");
    }

    timerValue(args) {
      this.log("timerValue called (no-op in transpile mode)", args, "DEBUG");
      return 0;
    }

    waitSeconds(args) {
      this.log("waitSeconds called (no-op in transpile mode)", args, "DEBUG");
    }

    waitMillis(args) {
      this.log("waitMillis called (no-op in transpile mode)", args, "DEBUG");
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    async fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
      }
    }

    showModal(title, content) {
      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border: 2px solid #7C3A9A;
        border-radius: 8px;
        max-width: 80%;
        max-height: 80%;
        overflow: auto;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        color: black;
      `;

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      titleEl.style.cssText = "margin-top: 0; color: #7C3A9A;";

      const pre = document.createElement("pre");
      pre.style.cssText =
        "background: #f5f5f5; color: black; border: 1px solid #ccc; padding: 10px; overflow: auto; max-height: 500px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;";
      pre.textContent = content;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = t("close");
      closeBtn.style.cssText =
        "margin-top: 10px; padding: 8px 16px; background: #7C3A9A; color: white; border: none; border-radius: 4px; cursor: pointer;";
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
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  Scratch.extensions.register(new EV3LMSExtension());
})(Scratch);
