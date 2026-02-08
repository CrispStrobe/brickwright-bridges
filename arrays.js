// Name: Arrays & Vectors
// ID: CrispStrobe/arrays
// Description: Advanced manipulation of arrays, vectors, and tensors.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // Storage for arrays (keyed by name)
  const arrays = {};
  let nextTempId = 0;

  class ArrayExtension {
    getInfo() {
      return {
        id: "arrays",
        name: "Arrays & Tensors",
        color1: "#FF6680",
        color2: "#FF4D6A",
        color3: "#FF3355",
        blocks: [
          {
            opcode: "create1D",
            blockType: Scratch.BlockType.COMMAND,
            text: "create 1D array [NAME] from JSON [JSON]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              JSON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[1,2,3,4,5]",
              },
            },
          },
          {
            opcode: "create2D",
            blockType: Scratch.BlockType.COMMAND,
            text: "create 2D array [NAME] from JSON [JSON]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              JSON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[[1,2],[3,4]]",
              },
            },
          },
          {
            opcode: "createEmpty",
            blockType: Scratch.BlockType.COMMAND,
            text: "create empty array [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "createZeros",
            blockType: Scratch.BlockType.COMMAND,
            text: "create array [NAME] of zeros with shape [SHAPE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "zeros",
              },
              SHAPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[3,3]",
              },
            },
          },
          {
            opcode: "createRange",
            blockType: Scratch.BlockType.COMMAND,
            text: "create array [NAME] from [START] to [END]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "range",
              },
              START: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              END: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
            },
          },
          "---",
          {
            opcode: "get",
            blockType: Scratch.BlockType.REPORTER,
            text: "get [NAME] at [INDEX]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
            },
          },
          {
            opcode: "get2D",
            blockType: Scratch.BlockType.REPORTER,
            text: "get [NAME] at row [ROW] col [COL]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "getMulti",
            blockType: Scratch.BlockType.REPORTER,
            text: "get [NAME] at indices [INDICES]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tensor",
              },
              INDICES: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[0,1,2]",
              },
            },
          },
          "---",
          {
            opcode: "set",
            blockType: Scratch.BlockType.COMMAND,
            text: "set [NAME] at [INDEX] to [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "set2D",
            blockType: Scratch.BlockType.COMMAND,
            text: "set [NAME] at row [ROW] col [COL] to [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "setMulti",
            blockType: Scratch.BlockType.COMMAND,
            text: "set [NAME] at indices [INDICES] to [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tensor",
              },
              INDICES: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[0,1,2]",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          "---",
          {
            opcode: "push",
            blockType: Scratch.BlockType.COMMAND,
            text: "push [VALUE] to [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "pop",
            blockType: Scratch.BlockType.REPORTER,
            text: "pop from [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "insert",
            blockType: Scratch.BlockType.COMMAND,
            text: "insert [VALUE] at [INDEX] in [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "remove",
            blockType: Scratch.BlockType.COMMAND,
            text: "remove at [INDEX] from [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          "---",
          {
            opcode: "length",
            blockType: Scratch.BlockType.REPORTER,
            text: "length of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "shape",
            blockType: Scratch.BlockType.REPORTER,
            text: "shape of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "contains",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "[NAME] contains [VALUE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "5" },
            },
          },
          {
            opcode: "indexOf",
            blockType: Scratch.BlockType.REPORTER,
            text: "index of [VALUE] in [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "5" },
            },
          },
          "---",
          {
            opcode: "slice",
            blockType: Scratch.BlockType.REPORTER,
            text: "slice [NAME] from [START] to [END]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              START: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              END: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
            },
          },
          {
            opcode: "getRow",
            blockType: Scratch.BlockType.REPORTER,
            text: "get row [ROW] from [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "getColumn",
            blockType: Scratch.BlockType.REPORTER,
            text: "get column [COL] from [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          "---",
          {
            opcode: "map",
            blockType: Scratch.BlockType.REPORTER,
            text: "map [NAME] with function [FUNC]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x => x * 2",
              },
            },
          },
          {
            opcode: "filter",
            blockType: Scratch.BlockType.REPORTER,
            text: "filter [NAME] with function [FUNC]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x => x > 5",
              },
            },
          },
          {
            opcode: "reduce",
            blockType: Scratch.BlockType.REPORTER,
            text: "reduce [NAME] with function [FUNC] initial [INIT]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "(acc,x) => acc+x",
              },
              INIT: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
            },
          },
          {
            opcode: "sort",
            blockType: Scratch.BlockType.REPORTER,
            text: "sort [NAME] [ORDER]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              ORDER: { type: Scratch.ArgumentType.STRING, menu: "sortOrder" },
            },
          },
          {
            opcode: "reverse",
            blockType: Scratch.BlockType.REPORTER,
            text: "reverse [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          "---",
          {
            opcode: "sum",
            blockType: Scratch.BlockType.REPORTER,
            text: "sum of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "mean",
            blockType: Scratch.BlockType.REPORTER,
            text: "mean of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "min",
            blockType: Scratch.BlockType.REPORTER,
            text: "min of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "max",
            blockType: Scratch.BlockType.REPORTER,
            text: "max of [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          "---",
          {
            opcode: "transpose",
            blockType: Scratch.BlockType.REPORTER,
            text: "transpose [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "flatten",
            blockType: Scratch.BlockType.REPORTER,
            text: "flatten [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "reshape",
            blockType: Scratch.BlockType.REPORTER,
            text: "reshape [NAME] to [SHAPE]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              SHAPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[3,3]",
              },
            },
          },
          "---",
          {
            opcode: "toJSON",
            blockType: Scratch.BlockType.REPORTER,
            text: "convert [NAME] to JSON",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "toString",
            blockType: Scratch.BlockType.REPORTER,
            text: "convert [NAME] to string",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "delete",
            blockType: Scratch.BlockType.COMMAND,
            text: "delete array [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "listAll",
            blockType: Scratch.BlockType.REPORTER,
            text: "list all arrays",
          },
        ],
        menus: {
          sortOrder: {
            acceptReporters: true,
            items: ["ascending", "descending"],
          },
        },
      };
    }

    // Helper to parse value (try number, then JSON, then string)
    parseValue(val) {
      if (val === "") return "";
      const num = Number(val);
      if (!isNaN(num)) return num;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    // Create arrays
    create1D(args) {
      try {
        arrays[args.NAME] = JSON.parse(args.JSON);
      } catch (e) {
        arrays[args.NAME] = [];
      }
    }

    create2D(args) {
      try {
        arrays[args.NAME] = JSON.parse(args.JSON);
      } catch (e) {
        arrays[args.NAME] = [[]];
      }
    }

    createEmpty(args) {
      arrays[args.NAME] = [];
    }

    createZeros(args) {
      try {
        const shape = JSON.parse(args.SHAPE);
        const createNDArray = (dims, index = 0) => {
          if (index === dims.length - 1) {
            return new Array(dims[index]).fill(0);
          }
          return new Array(dims[index])
            .fill(null)
            .map(() => createNDArray(dims, index + 1));
        };
        arrays[args.NAME] = createNDArray(shape);
      } catch (e) {
        arrays[args.NAME] = [];
      }
    }

    createRange(args) {
      const start = Number(args.START);
      const end = Number(args.END);
      const arr = [];
      for (let i = start; i <= end; i++) {
        arr.push(i);
      }
      arrays[args.NAME] = arr;
    }

    // Get/Set operations
    get(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      const idx = Number(args.INDEX);
      return JSON.stringify(arr[idx]);
    }

    get2D(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[args.ROW]) return "";
      return arr[args.ROW][args.COL];
    }

    getMulti(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      try {
        const indices = JSON.parse(args.INDICES);
        let result = arr;
        for (const idx of indices) {
          result = result[idx];
        }
        return typeof result === "object" ? JSON.stringify(result) : result;
      } catch (e) {
        return "";
      }
    }

    set(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      const idx = Number(args.INDEX);
      arr[idx] = this.parseValue(args.VALUE);
    }

    set2D(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      if (!arr[args.ROW]) arr[args.ROW] = [];
      arr[args.ROW][args.COL] = this.parseValue(args.VALUE);
    }

    setMulti(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      try {
        const indices = JSON.parse(args.INDICES);
        let target = arr;
        for (let i = 0; i < indices.length - 1; i++) {
          target = target[indices[i]];
        }
        target[indices[indices.length - 1]] = this.parseValue(args.VALUE);
      } catch (e) {
        // ignore
      }
    }

    // Array operations
    push(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.push(this.parseValue(args.VALUE));
    }

    pop(args) {
      const arr = arrays[args.NAME];
      if (!arr || arr.length === 0) return "";
      return arr.pop();
    }

    insert(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.splice(Number(args.INDEX), 0, this.parseValue(args.VALUE));
    }

    remove(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.splice(Number(args.INDEX), 1);
    }

    // Info operations
    length(args) {
      const arr = arrays[args.NAME];
      return arr ? arr.length : 0;
    }

    shape(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";

      const getShape = (a) => {
        if (!Array.isArray(a)) return [];
        const shape = [a.length];
        if (a.length > 0 && Array.isArray(a[0])) {
          return shape.concat(getShape(a[0]));
        }
        return shape;
      };

      return JSON.stringify(getShape(arr));
    }

    contains(args) {
      const arr = arrays[args.NAME];
      if (!arr) return false;
      const val = this.parseValue(args.VALUE);
      return arr.includes(val);
    }

    indexOf(args) {
      const arr = arrays[args.NAME];
      if (!arr) return -1;
      const val = this.parseValue(args.VALUE);
      return arr.indexOf(val);
    }

    // Slicing and selection
    slice(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const result = arr.slice(Number(args.START), Number(args.END));
      return JSON.stringify(result);
    }

    getRow(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[args.ROW]) return "[]";
      return JSON.stringify(arr[args.ROW]);
    }

    getColumn(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const col = Number(args.COL);
      const result = arr.map((row) => row[col]);
      return JSON.stringify(result);
    }

    // Functional operations
    map(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        const func = eval(`(${args.FUNC})`);
        const result = arr.map(func);
        return JSON.stringify(result);
      } catch (e) {
        return "[]";
      }
    }

    filter(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        const func = eval(`(${args.FUNC})`);
        const result = arr.filter(func);
        return JSON.stringify(result);
      } catch (e) {
        return "[]";
      }
    }

    reduce(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      try {
        const func = eval(`(${args.FUNC})`);
        const init = this.parseValue(args.INIT);
        return arr.reduce(func, init);
      } catch (e) {
        return "";
      }
    }

    sort(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const sorted = [...arr].sort((a, b) => {
        if (args.ORDER === "ascending") return a - b;
        return b - a;
      });
      return JSON.stringify(sorted);
    }

    reverse(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      return JSON.stringify([...arr].reverse());
    }

    // Math operations
    sum(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return flatten(arr).reduce((sum, x) => sum + Number(x || 0), 0);
    }

    mean(args) {
      const arr = arrays[args.NAME];
      if (!arr || arr.length === 0) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      const flat = flatten(arr);
      return flat.reduce((sum, x) => sum + Number(x || 0), 0) / flat.length;
    }

    min(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return Math.min(...flatten(arr).map(Number));
    }

    max(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return Math.max(...flatten(arr).map(Number));
    }

    // Advanced operations
    transpose(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[0]) return "[]";
      const result = arr[0].map((_, i) => arr.map((row) => row[i]));
      return JSON.stringify(result);
    }

    flatten(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return JSON.stringify(flatten(arr));
    }

    reshape(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        const shape = JSON.parse(args.SHAPE);
        const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
        const flat = flatten(arr);

        const reshape = (data, dims, index = 0) => {
          if (index === dims.length - 1) {
            return data.splice(0, dims[index]);
          }
          const result = [];
          for (let i = 0; i < dims[index]; i++) {
            result.push(reshape(data, dims, index + 1));
          }
          return result;
        };

        return JSON.stringify(reshape([...flat], shape));
      } catch (e) {
        return "[]";
      }
    }

    // Utility
    toJSON(args) {
      const arr = arrays[args.NAME];
      return arr ? JSON.stringify(arr) : "[]";
    }

    toString(args) {
      const arr = arrays[args.NAME];
      return arr ? arr.toString() : "";
    }

    delete(args) {
      delete arrays[args.NAME];
    }

    listAll() {
      return JSON.stringify(Object.keys(arrays));
    }
  }

  Scratch.extensions.register(new ArrayExtension());
})(Scratch);
