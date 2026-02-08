// Name: CSP Solver
// ID: CrispStrobe/csp
// Description: Simple Constraint-Satisfaction-Problem solver.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // Embed the CSP solver
  var CSP = {},
    FAILURE = "FAILURE",
    stepCounter = 0;

  CSP.solve = function solve(csp) {
    csp = normalizeProblem(csp);
    validateProblem(csp);
    csp._naryIndex = buildNaryIndex(csp.naryConstraints);
    const result = backtrack({}, cloneVars(csp.variables), csp);
    if (result === FAILURE) return result;
    for (var key in result) {
      const v = result[key];
      result[key] = Array.isArray(v) ? v[0] : v;
    }
    return result;
  };

  function backtrack(_assigned, unassigned, csp) {
    const assigned = cloneAssignment(_assigned);
    if (finished(unassigned)) return assigned;
    const nextKey = selectUnassignedVariable(unassigned);
    if (nextKey == null) return FAILURE;
    const values = orderValues(nextKey, assigned, unassigned, csp);
    const savedDom = unassigned[nextKey];
    delete unassigned[nextKey];
    for (let i = 0; i < values.length; i++) {
      stepCounter++;
      assigned[nextKey] = [values[i]];
      const consistent = enforceConsistency(assigned, unassigned, csp);
      if (consistent === FAILURE) {
        delete assigned[nextKey];
        continue;
      }
      const newAssigned = {};
      const newUnassigned = {};
      for (const key in consistent) {
        if (assigned[key]) newAssigned[key] = consistent[key].slice();
        else newUnassigned[key] = consistent[key].slice();
      }
      if (anyEmpty(consistent)) {
        delete assigned[nextKey];
        continue;
      }
      const result = backtrack(newAssigned, newUnassigned, csp);
      if (result !== FAILURE) return result;
      delete assigned[nextKey];
    }
    unassigned[nextKey] = savedDom;
    return FAILURE;
  }

  function cloneVars(variables) {
    const out = {};
    for (const k in variables) out[k] = variables[k].slice();
    return out;
  }
  function cloneAssignment(assigned) {
    const out = {};
    for (const k in assigned) out[k] = assigned[k].slice();
    return out;
  }
  function finished(unassigned) {
    return Object.keys(unassigned).length === 0;
  }
  function anyEmpty(vars) {
    for (const k in vars) if (!vars[k] || vars[k].length === 0) return true;
    return false;
  }
  function partialAssignment(assigned, unassigned) {
    const partial = {};
    for (const key in unassigned) partial[key] = unassigned[key].slice();
    for (const key in assigned) partial[key] = assigned[key].slice();
    return partial;
  }

  function enforceConsistency(assigned, unassigned, csp) {
    const variables = partialAssignment(assigned, unassigned);
    if (csp.constraints.length) {
      const ok = runAC3(variables, csp.constraints);
      if (!ok) return FAILURE;
    }
    if (csp.naryConstraints.length) {
      const ok = runGAC(variables, csp);
      if (!ok) return FAILURE;
    }
    return variables;
  }

  function runAC3(variables, constraints) {
    function incomingConstraints(node) {
      return constraints.filter((c) => c[0] === node);
    }
    function removeInconsistentValues(head, tail, predicate, vars) {
      const hv = vars[head],
        tv = vars[tail];
      if (!hv || !tv) return false;
      const validTailValues = tv.filter((t) => hv.some((h) => predicate(h, t)));
      const removed = validTailValues.length !== tv.length;
      vars[tail] = validTailValues;
      return removed;
    }
    let queue = constraints.slice();
    while (queue.length) {
      const [head, tail, predicate] = queue.shift();
      if (!variables[head] || !variables[tail]) continue;
      if (removeInconsistentValues(head, tail, predicate, variables)) {
        if (!variables[tail] || variables[tail].length === 0) return false;
        queue = queue.concat(incomingConstraints(tail));
      }
    }
    return true;
  }

  function buildNaryIndex(naryConstraints) {
    const index = {};
    for (let i = 0; i < naryConstraints.length; i++) {
      const C = naryConstraints[i];
      if (!C || !Array.isArray(C.vars)) continue;
      for (let j = 0; j < C.vars.length; j++) {
        const v = C.vars[j];
        (index[v] = index[v] || []).push(C);
      }
    }
    return index;
  }

  function runGAC(variables, csp) {
    const queue = csp.naryConstraints.slice();
    const index = csp._naryIndex || buildNaryIndex(csp.naryConstraints);
    while (queue.length) {
      const C = queue.shift();
      if (!C || !Array.isArray(C.vars) || typeof C.predicate !== "function")
        continue;
      let changedAny = false;
      for (let vi = 0; vi < C.vars.length; vi++) {
        const varName = C.vars[vi];
        const dom = variables[varName];
        if (!Array.isArray(dom)) continue;
        const newDom = [];
        for (let di = 0; di < dom.length; di++) {
          const val = dom[di];
          if (hasSupport(varName, val, C, variables)) newDom.push(val);
        }
        if (newDom.length !== dom.length) {
          variables[varName] = newDom;
          if (newDom.length === 0) return false;
          changedAny = true;
        }
      }
      if (changedAny) {
        for (let vi2 = 0; vi2 < C.vars.length; vi2++) {
          const v2 = C.vars[vi2];
          const related = index[v2] || [];
          for (let r = 0; r < related.length; r++) {
            const Rc = related[r];
            if (queue.indexOf(Rc) === -1) queue.push(Rc);
          }
        }
      }
    }
    return true;
  }

  function hasSupport(focusVar, focusVal, C, variables) {
    const others = [];
    for (let i = 0; i < C.vars.length; i++) {
      const v = C.vars[i];
      if (v === focusVar) continue;
      const dom = variables[v];
      if (!Array.isArray(dom)) return false;
      if (dom.length === 0) return false;
      others.push(v);
    }
    others.sort((a, b) => {
      const da = variables[a] ? variables[a].length : Infinity;
      const db = variables[b] ? variables[b].length : Infinity;
      return da - db;
    });
    const order = [focusVar].concat(others);
    const domains = [[focusVal]].concat(others.map((v) => variables[v]));
    const assign = {};
    function dfs(i) {
      if (i === order.length) {
        try {
          return !!C.predicate(assign);
        } catch (e) {
          return false;
        }
      }
      const vname = order[i];
      const dom = domains[i] || [];
      for (let k = 0; k < dom.length; k++) {
        assign[vname] = dom[k];
        if (dfs(i + 1)) return true;
      }
      delete assign[vname];
      return false;
    }
    return dfs(0);
  }

  function selectUnassignedVariable(unassigned) {
    let minKey = null,
      minLen = Infinity;
    for (const key in unassigned) {
      const dom = unassigned[key];
      const len = Array.isArray(dom) ? dom.length : Infinity;
      if (len < minLen) {
        minKey = key;
        minLen = len;
        if (len === 1) break;
      }
    }
    return minKey;
  }

  function orderValues(nextKey, assigned, unassigned, csp) {
    const baseValues = (unassigned[nextKey] || []).slice();
    if (baseValues.length <= 1) return baseValues;
    function countValues(vars) {
      let sum = 0;
      for (const k in vars) {
        const d = vars[k];
        sum += Array.isArray(d) ? d.length : 0;
      }
      return sum;
    }
    const score = Object.create(null);
    for (let i = 0; i < baseValues.length; i++) {
      const val = baseValues[i];
      const A = cloneAssignment(assigned);
      const U = cloneVars(unassigned);
      A[nextKey] = [val];
      delete U[nextKey];
      const res = enforceConsistency(A, U, csp);
      if (res === FAILURE || anyEmpty(res)) {
        score[val] = -Infinity;
      } else {
        score[val] = countValues(res);
      }
    }
    baseValues.sort((a, b) => score[b] - score[a]);
    return baseValues;
  }

  function normalizeProblem(csp) {
    const out = {
      variables: {},
      constraints: [],
      naryConstraints: [],
      timeStep: csp.timeStep || 1,
      cb: csp.cb,
    };
    for (const k in csp.variables || {}) {
      const dom = csp.variables[k];
      out.variables[k] = Array.isArray(dom) ? dom.slice() : [];
    }
    if (Array.isArray(csp.constraints)) {
      out.constraints = csp.constraints
        .slice()
        .filter(
          (c) =>
            Array.isArray(c) && c.length >= 3 && typeof c[2] === "function",
        );
    }
    if (Array.isArray(csp.naryConstraints)) {
      out.naryConstraints = csp.naryConstraints
        .slice()
        .filter(
          (C) =>
            C && Array.isArray(C.vars) && typeof C.predicate === "function",
        );
    }
    return out;
  }

  function validateProblem(csp) {
    const varsSet = new Set(Object.keys(csp.variables));
    for (const v in csp.variables) {
      if (!Array.isArray(csp.variables[v])) {
        throw new Error('Variable "' + v + '" domain is not an array');
      }
    }
    for (let i = 0; i < csp.constraints.length; i++) {
      const c = csp.constraints[i];
      const head = c[0],
        tail = c[1],
        pred = c[2];
      if (!varsSet.has(head))
        throw new Error(
          'Binary constraint references unknown variable "' + head + '"',
        );
      if (!varsSet.has(tail))
        throw new Error(
          'Binary constraint references unknown variable "' + tail + '"',
        );
      if (typeof pred !== "function")
        throw new Error("Binary constraint missing predicate function");
    }
    for (let i = 0; i < csp.naryConstraints.length; i++) {
      const C = csp.naryConstraints[i];
      if (!Array.isArray(C.vars) || C.vars.length === 0) {
        throw new Error("N-ary constraint missing vars array");
      }
      for (let j = 0; j < C.vars.length; j++) {
        const v = C.vars[j];
        if (!varsSet.has(v)) {
          throw new Error(
            'N-ary constraint references unknown variable "' + v + '"',
          );
        }
      }
      if (typeof C.predicate !== "function") {
        throw new Error("N-ary constraint missing predicate function");
      }
    }
  }

  // Extension-specific storage
  let currentProblem = {
    variables: {},
    constraints: [],
  };

  class CSPExtension {
    getInfo() {
      return {
        id: "cspSolver",
        name: "CSP Solver",
        blocks: [
          {
            opcode: "clearProblem",
            blockType: Scratch.BlockType.COMMAND,
            text: "clear CSP problem",
          },
          {
            opcode: "addVariable",
            blockType: Scratch.BlockType.COMMAND,
            text: "add variable [NAME] with domain [DOMAIN]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x",
              },
              DOMAIN: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[1,2,3,4,5,6,7,8,9]",
              },
            },
          },
          {
            opcode: "addConstraint",
            blockType: Scratch.BlockType.COMMAND,
            text: "add constraint [VAR1] != [VAR2]",
            arguments: {
              VAR1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x",
              },
              VAR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "y",
              },
            },
          },
          {
            opcode: "solve",
            blockType: Scratch.BlockType.REPORTER,
            text: "solve CSP",
          },
          {
            opcode: "getVarValue",
            blockType: Scratch.BlockType.REPORTER,
            text: "solution value of [VAR]",
            arguments: {
              VAR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x",
              },
            },
          },
          {
            opcode: "solveSudoku",
            blockType: Scratch.BlockType.REPORTER,
            text: "solve sudoku [PUZZLE]",
            arguments: {
              PUZZLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"1,1":5,"1,2":3}',
              },
            },
          },
        ],
      };
    }

    clearProblem() {
      currentProblem = {
        variables: {},
        constraints: [],
        solution: null,
      };
    }

    addVariable(args) {
      try {
        const domain = JSON.parse(args.DOMAIN);
        currentProblem.variables[args.NAME] = domain;
      } catch (e) {
        console.error("Invalid domain JSON:", e);
      }
    }

    addConstraint(args) {
      const neq = function (x, y) {
        return x !== y;
      };
      currentProblem.constraints.push([args.VAR1, args.VAR2, neq]);
    }

    solve() {
      try {
        const result = CSP.solve(currentProblem);
        if (result === FAILURE) {
          return "FAILURE";
        }
        currentProblem.solution = result;
        return JSON.stringify(result);
      } catch (e) {
        return "ERROR: " + e.message;
      }
    }

    getVarValue(args) {
      if (!currentProblem.solution) return "";
      return currentProblem.solution[args.VAR] || "";
    }

    solveSudoku(args) {
      try {
        const filledIn = JSON.parse(args.PUZZLE);
        const SIZE = 9;
        const BLOCK_SIZE = 3;
        const domain = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const variables = {};
        const constraints = [];

        function neq(x, y) {
          return x !== y;
        }

        // Create variables
        for (let i = 1; i <= SIZE; i++) {
          for (let j = 1; j <= SIZE; j++) {
            const key = i + "," + j;
            const filled = filledIn[key];
            variables[key] = filled ? [filled] : domain.slice();
          }
        }

        // Add constraints
        for (let i = 1; i <= SIZE; i++) {
          for (let j = 1; j <= SIZE; j++) {
            // Row and column constraints
            for (let k = 1; k <= SIZE; k++) {
              if (k !== j) {
                constraints.push([i + "," + k, i + "," + j, neq]);
              }
              if (k !== i) {
                constraints.push([k + "," + j, i + "," + j, neq]);
              }
            }

            // Block constraints
            const blockRow = Math.floor((i - 1) / BLOCK_SIZE);
            const blockCol = Math.floor((j - 1) / BLOCK_SIZE);
            for (let bi = 0; bi < BLOCK_SIZE; bi++) {
              for (let bj = 0; bj < BLOCK_SIZE; bj++) {
                const ni = blockRow * BLOCK_SIZE + bi + 1;
                const nj = blockCol * BLOCK_SIZE + bj + 1;
                if (ni !== i || nj !== j) {
                  constraints.push([ni + "," + nj, i + "," + j, neq]);
                }
              }
            }
          }
        }

        const result = CSP.solve({ variables, constraints });
        if (result === FAILURE) return "FAILURE";

        // Format output
        let output = "";
        const divider = "|" + "-".repeat(35) + "|\n";
        output += divider;
        for (let i = 1; i <= SIZE; i++) {
          let row = "| ";
          for (let j = 1; j <= SIZE; j++) {
            row += result[i + "," + j];
            row += j % BLOCK_SIZE !== 0 ? "   " : " | ";
          }
          output += row + "\n";
          if (i % BLOCK_SIZE === 0) output += divider;
        }
        return output;
      } catch (e) {
        return "ERROR: " + e.message;
      }
    }
  }

  Scratch.extensions.register(new CSPExtension());
})(Scratch);
