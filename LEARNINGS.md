# LEGO extensions audit — learnings

Running notebook of cross-cutting findings worth remembering. Specific to a
single file and not generalizable? Goes in a code comment, not here.

---

## Drift: local sandbox vs. remote `CrispStrobe/extensions/main`

**Date:** 2026-05-02

The local `turbowarp-lego/*.js` files are slightly behind the public gallery.
Spot-checked `ev3dev_py_transpile.js`: local 5671 LOC, remote 5684 LOC.
Diffs found:

1. **Missing TurboWarp gallery banner** at the top of the local file:
   ```
   // ID: scratchtoev3
   // Description: Control EV3Dev via Live Streaming or generate/run Python code on the brick.
   // By: CrispStrobe <https://github.com/CrispStrobe>
   // License: MPL-2.0
   // Name: LEGO EV3Dev Python
   ```
   Without this header the file can't be auto-discovered by the gallery.

2. **`streamingMode` default flip** — *behavioral fix, present remote-only.*
   Local: `this.streamingMode = false;` (line 771).
   Remote: `this.streamingMode = true;` (line 775), with comment explaining
   why and reference to symptom: command blocks (beep, motor_run, set_led)
   silently drop while `testConnection` still reports "Connected".
   When `setConnection` block runs, remote also flips `streamingMode = true`
   as an explicit opt-in to direct mode.

3. **Loud `console.warn`** when a command is dropped because streaming is
   disabled, telling user to call `set connection` or `enable streaming`.
   Local: silent drop. This is what made (2) so painful.

4. **Per-protocol port auto-correction** in `setConnection`: if user enters
   8443 with `http://`, remote rewrites to 8080 (and vice versa). Local does
   not.

5. **Cosmetic rename** `opcode` → `block.opcode` inside `processBlock`.
   Local has `const opcode = block.opcode;` at line 4494, so the bare
   `opcode` references in the same function are valid — **not a bug**, just
   stylistic noise in the diff.

6. **Removed duplicate else-if** for `scratchtoev3_ev3ColorRGB` at local
   lines 5279–5298 (dead branch — first occurrence at line 5241 is in scope).

**Implication for the audit:** work from the remote file
(`/tmp/ev3dev_py_transpile_remote.js`, fetched 2026-05-02), not the local
copy. After audit, decide whether to:
(a) point the sandbox at the gallery as upstream, or
(b) merge gallery main into `turbowarp-lego` periodically.

---

## Phase 1 — Coverage audit of `ev3dev_py_transpile.js` (remote)

**Audit basis:** `CrispStrobe/extensions/main/extensions/CrispStrobe/ev3dev_py_transpile.js` (5684 LOC, fetched 2026-05-02). The transpiler emits ev3dev-lang-python that runs on the brick under `ev3dev_ondevice.py`'s server.

**Reference checklist:** primitive opcodes from `scratch-vm/src/blocks/scratch3_{control,event,operators,data,procedures,sensing}.js` plus standard hat opcodes.

### Generic Scratch logic-flow opcodes — gap table

Legend: ✅ handled · ⚠️ partial / risky semantics · ❌ missing.

#### Control
| Opcode | Status | Notes |
|---|---|---|
| `control_wait` | ✅ | `sleep(duration)`. |
| `control_repeat` | ✅ | `for i in range(int(N))` with `if stop_all: break`. **No yield sleep at end** — concurrent threads may starve if loop body is tight. Compare with `control_forever` which adds `sleep(0.01)`. |
| `control_forever` | ✅ | `while not stop_all` + trailing `sleep(0.01)`. |
| `control_if` / `control_if_else` | ✅ | Standard. |
| `control_repeat_until` | ⚠️ | `while not (cond) and not stop_all` — **no yield sleep**, busy-loop. Should mirror `control_forever`'s `sleep(0.01)`. |
| `control_stop` | ⚠️ | Only `all` has dedicated semantics (`stop_all=True; sys.exit(0)`). `this script` falls into the `else: return` branch (correct by accident, since each script is a function). **`other scripts in sprite` is silently treated as `return`** — should set per-thread cancel flags, but doesn't. |
| `control_wait_until` | ❌ | Missing. Common block (sensor-gated waits). User hits this and the transpiler skips it silently. |
| `control_while` | ❌ | TurboWarp-extension, but worth supporting. |
| `control_create_clone_of` | ❌ | No clone support at all. |
| `control_delete_this_clone` | ❌ | — |
| `control_start_as_clone` (hat) | ❌ | — |
| `control_for_each` | ❌ | Rare (Scratch 2-era). |
| `control_all_at_once` | ❌ | Rare. |

#### Event hats
| Opcode | Status | Notes |
|---|---|---|
| `event_whenflagclicked` | ✅ | Pushed to `mainScripts`, each gets a `threading.Thread`. |
| `event_whenbroadcastreceived` | ✅ | Appended to `broadcasts[name]` dict. |
| `event_whenkeypressed` | ⚠️ **BUG** | A `def on_key_<key>_<n>():` function is generated (line 4483–4486) **but never registered**. Dispatch at lines 4515–4523 only handles `event_whenflagclicked` and `event_whenbroadcastreceived`. The keypress hat compiles to dead code. Workaround: user must use the EV3 button/sensor blocks instead. Fix: either drop the hat from the menu or wire it into a `monitor_keys` thread on the brick (likely tied to brick buttons since the EV3 has no keyboard). |
| `event_whenthisspriteclicked` | ❌ | Falls through to generic `on_event_<n>` func — also never registered (same fall-through bug). |
| `event_whenstageclicked` | ❌ | Same. |
| `event_whenbackdropswitchesto` | ❌ | Same. |
| `event_whengreaterthan` | ❌ | Loudness/timer threshold hat — would need a polling thread. |

#### Event reporters
| Opcode | Status | Notes |
|---|---|---|
| `event_broadcast` | ⚠️ | Generates `trigger_broadcast(name)`. Runtime `running_broadcasts` dedup **silently skips re-fire while previous run is alive** (line 4368–4371). Scratch semantics: re-broadcasting *restarts* the handler. This will swallow rapid-fire broadcasts. |
| `event_broadcastandwait` | ⚠️ | Generates `trigger_broadcast_wait(name)` which spawns + joins threads. **Inconsistent with plain broadcast**: `_wait` does *not* consult `running_broadcasts`, so if the handler is already running async from a prior `event_broadcast`, the wait variant double-fires it. |
| `event_broadcast_menu` | ✅ | Shadow handled. |

#### Operators
| Opcode | Status | Notes |
|---|---|---|
| `operator_add` / `subtract` / `multiply` / `divide` | ✅ | |
| `operator_random` | ✅ | |
| `operator_lt` / `gt` / `equals` | ✅ | |
| `operator_and` / `or` / `not` | ✅ | |
| `operator_join` | ✅ | |
| `operator_letter_of` | ❌ | |
| `operator_length` | ❌ | |
| `operator_contains` | ❌ | |
| `operator_mod` | ❌ | |
| `operator_round` | ❌ | |
| `operator_mathop` | ❌ | The "`abs / floor / ceiling / sqrt / sin / cos / tan / asin / acos / atan / ln / log / e^ / 10^`" reporter — entire math menu unsupported. Big gap for any maths-heavy project. |

#### Data — variables
| Opcode | Status | Notes |
|---|---|---|
| `data_variable` | ✅ | (reporter) |
| `data_setvariableto` | ✅ | |
| `data_changevariableby` | ✅ | |
| `data_showvariable` / `data_hidevariable` | ❌ | Cosmetic on EV3 (no stage), can be no-ops, but should be recognized so they don't crash the transpiler. |

#### Data — lists (entirely missing)
`data_addtolist`, `data_deleteoflist`, `data_deletealloflist`, `data_insertatlist`, `data_replaceitemoflist`, `data_itemoflist`, `data_itemnumoflist`, `data_lengthoflist`, `data_listcontainsitem`, `data_listcontents`, `data_showlist`, `data_hidelist` — **all ❌**. Lists are core in Scratch projects (sensor logs, pattern playback, songs). Big gap.

#### Procedures (custom blocks) — entirely missing
`procedures_definition`, `procedures_call`, `argument_reporter_string_number`, `argument_reporter_boolean` — **all ❌**. Without these, *any project that defines a custom block* will silently lose all calls. This is arguably the single biggest functional gap.

Also missing: handling for the procedure flag *"run without screen refresh"* (warp / atomicity).

#### Sensing — almost entirely missing
| Opcode | Status |
|---|---|
| `sensing_keypressed` | ❌ |
| `sensing_mousedown` / `mousex` / `mousey` | ❌ |
| `sensing_timer` / `sensing_resettimer` | ❌ — useful (built-in Scratch timer). |
| `sensing_current` | ❌ — date/time reporter. |
| `sensing_askandwait` / `sensing_answer` | ❌ — could map to brick button input. |
| `sensing_loudness` / `sensing_loud` | ❌ — could map to EV3 sound sensor port. |
| `sensing_of` | ❌ |

#### Shadow / literal blocks
| Opcode | Status |
|---|---|
| `math_number` / `math_whole_number` / `math_positive_number` / `math_integer` | ✅ |
| `text` | ✅ |
| `math_angle` | ❌ — used by Boost/Spike-style blocks if user drops one in. |
| `colour_picker` | ❌ — needed for `ev3SetLED` color args from a color picker shadow. |

#### Motion / Looks / Sound (incidental but handled)
- `motion_movesteps`, `motion_turnleft`, `motion_turnright`, `motion_gotoxy` ✅ (mapped to sprite-state vars)
- `looks_say`, `looks_sayforsecs` ✅ (mapped to `sound.speak`)
- `sound_play`, `sound_playuntildone`, `sound_sounds_menu` ✅

### Severity ranking

1. **Critical (silent breakage of working projects):**
   - `event_whenkeypressed` and any non-flag/non-broadcast hat: dead-code emission.
   - `procedures_definition` / `procedures_call`: any custom-block project loses calls.
   - `event_broadcast` re-fire dedup vs Scratch restart semantics; inconsistency with `_wait`.
2. **High (common blocks missing entirely):**
   - All list operations.
   - `control_wait_until`.
   - `operator_mathop`, `operator_mod`, `operator_round`, `operator_letter_of`, `operator_length`, `operator_contains`.
   - `sensing_timer` / `sensing_resettimer`.
3. **Medium (concurrency correctness):**
   - `control_repeat_until` busy-loop without `sleep(0.01)` yield.
   - `control_stop` "other scripts in sprite" silently no-op (returns instead of cancelling siblings).
4. **Low (cosmetic / rare):**
   - `data_showvariable` / `data_hidevariable` no-op recognition.
   - `colour_picker`, `math_angle` shadows.
   - `control_for_each`, `control_all_at_once`, `control_while`.

### Architectural observations

- **Threading model:** one Python thread per `whenflagclicked` and per broadcast invocation. Cooperative cancellation via global `stop_all`. Workable, but means cancellation latency is "next loop iteration" — and any block without a yield (esp. `repeat_until`) holds up the cancel.
- **No "warp" / atomicity concept.** All scripts are interleaved at OS thread granularity. If a user expects "run without screen refresh"-style atomic execution of a custom block body, they won't get it.
- **No clones, no sprite-local state isolation.** Sprite vars live in module-global `sprite_state` — everyone shares.
- **Hat dispatch is opcode-specific, not generic.** Adding a new hat requires touching three places (function-name generation, dispatch wiring, brick-side runtime). The fall-through to `on_event_<n>` for unknown hats is a footgun: it generates a function nothing calls.

### Recommended next steps (Phase 2 / 3 ordering)

1. Fix `event_whenkeypressed` — either remove the menu entry or wire it to a brick-button monitor thread.
2. Add `procedures_definition` / `procedures_call` / argument reporters. This unlocks a whole class of projects.
3. Add `control_wait_until` (loop with `sleep(0.01)` until cond) — trivial.
4. Add `sleep(0.01)` to `control_repeat_until` body.
5. Add list ops (Python lists in `sprite_state` or a dedicated `lists` dict).
6. Add `operator_mathop` (dispatch on `OPERATOR` field to math.* / abs / round-half-even).
7. Then revisit broadcast semantics (decide: restart-on-re-fire, or document current behavior as intentional).

The same checklist should be re-run against `ev3_lms_transpile.js`, `legonxt_transpile_universal.js`, and `legospike_turbowarp_transpile.js` — they were written by the same author with the same template, so they likely share most of these gaps.

---

## Phase 2 — Initial fixes landed

**Date:** 2026-05-02
**File:** `ev3dev_py_transpile.js` (synced from `CrispStrobe/extensions/main`, +103 / −64 vs. local sandbox baseline; combines upstream sync + below fixes).

### Changes from this audit pass

1. **`control_wait_until` added.** New else-if branch after `control_repeat_until`. Emits `while not (cond) and not stop_all: sleep(0.01)`. Closes a high-priority gap; trivial.
2. **`control_repeat_until` yield-sleep.** Added `sleep(0.01)` at the end of the loop body so concurrent threads get a slice and `stop_all` can take effect promptly. Mirrors the existing `control_forever` pattern.
3. **Unknown-hat warning.** The hat-dispatch in `processHat` previously had only `if/else if` for `event_whenflagclicked` and `event_whenbroadcastreceived`; everything else fell through silently. Added an `else` branch that:
   - logs `console.warn` from the editor side, naming the unsupported opcode and the dead function name,
   - emits a `# WARNING: hat '<opcode>' is not supported on the brick` comment in the generated Python.
   This converts the worst class of silent failure (drag a `when key pressed` hat → nothing happens, no error) into a visible diagnostic.

### What this pass deliberately does **not** do
- Procedures (`procedures_definition` / `procedures_call` / argument reporters). Bigger design (function generation, arg scoping, recursion, "warp"). Next major item.
- List ops, `operator_mathop`, `sensing_timer` family. Next medium items.
- Broadcast restart-on-re-fire semantics. Pending decision (fix or document).

### Drift status
Local `turbowarp-lego/ev3dev_py_transpile.js` is now **ahead of** remote `CrispStrobe/extensions/main` by the three fixes above (and even with remote on everything else). When pushing back, copy the file 1:1 — there is no separate gallery clone to merge into.

---

## Phase 2 (continued) — operators, lists, keypress, procedures

**Date:** 2026-05-02
**File grew:** 5684 → 6102 LOC. `node --check` clean.

### Operators (in `evaluateBlock`)
Added 6 reporters. Notes on Scratch-vs-Python semantics:
- `operator_mod` → Python `%`. Same non-negative-result semantics for both languages with positive divisor.
- `operator_round` → emits `int(math.floor(float(x) + 0.5))` to get Scratch's half-away-from-zero, sidestepping Python's banker's-rounding `round()`.
- `operator_letter_of` → 1-indexed; out-of-range returns `""` (Scratch behavior).
- `operator_length` → `len(str(x))`.
- `operator_contains` → **case-insensitive** (matches Scratch).
- `operator_mathop` → dispatches on the `OPERATOR` field. Trig functions wrap with `math.radians` / `math.degrees` because **Scratch trig is in degrees**, Python's is in radians. `log` = log10, `ln` = natural log. `e ^` and `10 ^` (note the spaces — that's the literal field value).

### Lists
Variables already use a global `variables = {}` dict, so lists mirror with `lists = {}`. Helper functions emitted once into the script header in a new `generateListHelpers()`:
- `_list_index(lst, idx)` — central place for Scratch's 1-indexed semantics + the special tokens `"first" / "last" / "any" / "random"`.
- `_list_delete`, `_list_insert`, `_list_replace`, `_list_item`, `_list_itemnum`, `_list_contains`, `_list_length`, `_list_contents`.

Statement handlers: `data_addtolist`, `data_deleteoflist`, `data_deletealloflist`, `data_insertatlist`, `data_replaceitemoflist`. Reporter handlers: `data_itemoflist`, `data_itemnumoflist`, `data_lengthoflist`, `data_listcontainsitem`, `data_listcontents`. `data_showlist` / `data_hidelist` (and the variable show/hide siblings) are accepted as no-ops with a comment, since the EV3 has no Scratch stage.

`_list_contents` mimics Scratch's quirk: join with `""` if every item is a single character, otherwise join with `" "`.

`data_deleteoflist` accepts `"all"` as the index (Scratch reuses the same block for "delete N of list" and "delete all of list" depending on the value).

### Keypress hat — wired to brick buttons
Mapped `KEY_OPTION` → ev3dev `Button` attributes:
- `up arrow / down arrow / left arrow / right arrow` → `up / down / left / right`
- `space / enter` → `enter` (the brick's centre button)
- `any` → fires on any of the above
- letters / digits → unmapped, runtime prints a one-time warning at startup so the user understands why their hat isn't firing

Implementation: hat dispatch registers handlers into a `key_handlers` dict. When at least one keypress hat exists, a `monitor_keys` daemon thread is emitted that polls `Button()` at 20 Hz with edge-trigger (fires on press transition, not while held) and starts each handler in a fresh thread (Scratch lets multiple instances of the same hat run concurrently).

### Procedures (custom blocks)
End-to-end:
1. New `processProcedureDefinitions(target)` runs *before* the regular hat pass on each target, so all `def proc_*` are emitted at module top before anything calls them.
2. `parseProcMutation(block)` reads `block.mutation` defensively — `argumentnames` / `argumentids` / `argumentdefaults` arrive as JSON strings; we tolerate already-parsed objects too. `warp` is read but **not enforced**; threaded model can't replicate "run without screen refresh" atomicity, so we just emit a comment.
3. Function name = `proc_` + sanitized head of the proccode (everything before the first `%` placeholder). Scratch enforces unique proccodes per project, so this is collision-free.
4. Arguments named `arg_` + `sanitizeName(originalName)` so they're valid Python identifiers and won't shadow the global `variables` / `lists` dicts.
5. `procedures_call`: looks up the proc by `proccode`, pulls each arg by argumentid via `getInputValue(block, id, blocks)` (which reads `block.inputs[id]` — Scratch keys call inputs by argumentid). Missing inputs default to `"0"` (safe).
6. `argument_reporter_string_number` / `argument_reporter_boolean` (in `evaluateBlock`): emits `arg_<sanitized>` directly. No scope tracking needed because Python's lexical scope handles it for free — each procedure is just a Python `def`.

Edge cases handled:
- Defined-elsewhere proc never registered: emits `# UNRESOLVED custom block call: <proccode>` comment instead of crashing.
- Empty body: emits `pass`.
- Argument name with non-alphanum chars (`my arg!`) → `arg_my_arg_`.

### Architectural notes worth carrying forward
- Helper-function emission is the right pattern for per-block inline complexity (cf. `_list_index`). Avoid building deeply nested string concat in JS — push it to runtime helpers when the rule is non-trivial.
- The hat-discovery loop only matches `block.opcode.startsWith("event_when")`. Any new hat opcode that lives outside that prefix needs its own discovery pass (procedures hit this; clones would too).
- Block inputs are keyed by either:
  - a stable name (`SUBSTACK`, `CONDITION`, `OPERAND1`) for built-in blocks, or
  - a per-call argumentid for custom blocks.
  `getInputValue` works for both because it just does `block.inputs[name]`.
- Python identifier safety: prefix-then-sanitize. `sanitizeName("foo bar") = "foo_bar"`, but `arg_foo_bar` is unambiguous.
- **What we still owe the runtime**: nothing ev3dev_ondevice.py-side. All of the above lives in the generated Python that runs on the brick — the on-device script keeps doing its job.

---

## Phase 3 — Coverage audit of the three sibling transpilers

**Date:** 2026-05-02

Same checklist as Phase 1, applied to the other three transpile-style extensions. Coverage-only — fixes don't transfer 1:1 because each emits a different target (LMS bytecode, NXT-G, MicroPython for Spike). Audited against the remote `CrispStrobe/extensions/main` versions.

### Drift vs remote main (per file)

| File | Δ | What's in remote that's missing locally |
|------|---|------------------------------------------|
| `ev3_lms_transpile.js` | trivial | Only the gallery `// ID:` line differs (`CrispStrobe/ev3_lms_transpile` → `ev3lms`). No code drift. |
| `legonxt_transpile_universal.js` | **real bug fix** | Two places (~line 892 & 4128) where the local code iterates `pendingRequests.entries()`, resolves the first entry, then `break`s — but **never deletes the resolved entry from the map**. Remote rewrites both to `entries().next().value` + explicit FIFO removal (cleaner intent; verify the delete is actually performed). Remote also drops a dead `sleep(ms)` helper and a dead `connect()` method. |
| `legospike_turbowarp_transpile.js` | safety polish | `vm` → `globalThis.vm`; multiple `obj.hasOwnProperty(x)` → `Object.prototype.hasOwnProperty.call(obj, x)` (defensive against null-prototype objects / shadowed methods). |

For all three, sync the remote ID-line at minimum; for NXT, sync the pendingRequests fix.

### Generic-flow opcode coverage (delta vs original ev3dev pre-fix)

Same picture as ev3dev: control / event / operators / data-vars are partially handled; **lists, procedures, sensing, control_wait_until, clones — entirely missing in all three.**

Operator menu is the one area where they diverge:

| Operator | LMS | NXT | Spike | ev3dev (pre-fix) |
|----------|-----|-----|-------|------------------|
| `letter_of` | ✅ | ✅ | ❌ | ❌ |
| `length` | ✅ | ✅ | ❌ | ❌ |
| `contains` | ❌ | ❌ | ❌ | ❌ |
| `mod` | ✅ | ✅ | ✅ | ❌ |
| `round` | ✅ | ✅ | ✅ | ❌ |
| `mathop` | ✅ | ❌ | ✅ | ❌ |
| `random` | ❌ | ✅ | ✅ | ✅ |

(LMS has no `random` because the LMS opcode set doesn't expose RNG cleanly; NXT has no `mathop` because NXT-G has no trig/log primitives; Spike has no `letter_of`/`length` because the author hadn't reached strings.)

Motion menu: NXT alone exposes the full set (`xposition`, `yposition`, `direction`, `gotoxy`); LMS and Spike only have the three basic move/turn blocks.

### Hat-dispatch behavior (this is where bugs hide)

| | discovery filter | unsupported-hat behavior |
|---|---|---|
| **LMS** | `startsWith("event_when")` | Recognises `event_whenkeypressed` and **emits an explicit `; WARNING: Key press events not supported in LMS` comment in the bytecode** — best behavior of the four. No silent dead code. |
| **NXT** | **explicit allowlist**: `event_whenflagclicked` ‖ `event_whenbroadcastreceived` only | Unknown hats are dropped at discovery — no function generated, no warning, no dead code. Quiet but at least no false promise. |
| **Spike** | `startsWith("event_when")` | **Same dead-code bug ev3dev had**: generates `def on_key_<key>_<n>():` for keypress, but dispatch only wires up flag and broadcast → never invoked. Same fall-through hits other hats. |
| **ev3dev** (post-Phase-2) | `startsWith("event_when")` | Keypress wired to brick buttons; other unknown hats now log `console.warn` + emit `# WARNING:` comment. |

**Spike has a duplicate of the ev3dev keypress bug — top priority if a Spike fix pass happens.**

### `control_repeat_until` busy-loop (concurrency)

| | yield in body? | cancel mechanism |
|---|---|---|
| **LMS** | N/A — LMS bytecode is single-threaded by design; no concurrent scripts to starve. | Stop opcode in bytecode. |
| **NXT** | N/A — NXT-G compiled output is single-task per emitted unit. | Hardware stop. |
| **Spike** | ❌ no `time.sleep_ms(10)`-equivalent inside the body — `check_stop()` is just a flag check + raise. **Same busy-loop concern as ev3dev had.** Easy fix: append a `time.sleep_ms(10)` (MicroPython idiom) inside the loop body, mirroring `control_forever`. | `check_stop()` raises `SystemExit`. |
| **ev3dev** (post-Phase-2) | ✅ `sleep(0.01)` added. | `if stop_all: break`. |

### Recommended next actions, prioritised

The fix templates from the ev3dev work transfer best to **Spike**, since both target Python-family runtimes:

1. **Spike: keypress hat dispatch** — same fall-through fix as ev3dev. Spike Prime hub has its own button(s) and a 5×5 LED grid; keypress could map to the centre button or the front button. Need to check the Spike hub button API. 
2. **Spike: `control_repeat_until` yield** — append `time.sleep_ms(10)` in the body. One-line.
3. **Spike: procedures** — the def/call/argument-reporter pattern transfers wholesale; just emit MicroPython instead of CPython. Same warp-ignore comment.
4. **Spike: lists** — same helper-function pattern; MicroPython has `random` but check `random.randint` availability.
5. **Spike + LMS + NXT: `control_wait_until`** — trivial loop emit per target.
6. **NXT: pendingRequests FIFO bug** — sync from remote, then verify delete is actually performed.

LMS and NXT need a different design for procedures (they don't naturally have callable functions in their target language — would need inlining or label-based jumps). Defer until a real user need surfaces.

### Cross-cutting observation
All four transpilers were stamped from the same template — same hat-discovery pattern, same processBlock/evaluateBlock split, same naming conventions. **Maintaining four near-copies is the underlying problem.** A shared "scratch-vm-flow" core (canonical opcode handlers that emit to a target-specific `addLine`) would cut the surface area to ~25%. Worth a future consolidation pass; out of scope for this audit.

---

## Phase 4 — Fixes landed across the three siblings

**Date:** 2026-05-02
**Files synced from remote first** (the LMS / NXT / Spike sandbox copies were stale; NXT in particular had a real `pendingRequests` FIFO bug fixed upstream).

### Spike (`legospike_turbowarp_transpile.js`) — full Phase-2 mirror
+297 / −7 vs synced baseline. Same template as ev3dev got, with MicroPython idioms:

| Fix | Notes |
|---|---|
| `lists = {}` + `_list_*` helpers | Same module-level dict + helper-function approach as ev3dev. `del lst[:]` instead of `.clear()` for MicroPython compatibility. |
| List statement + reporter handlers | Identical opcode set to ev3dev. |
| `data_show/hidevariable` + `data_show/hidelist` | Recognised as no-ops with comment (no stage on the hub). |
| Procedures (`procedures_definition` / `procedures_call` / `argument_reporter_*`) | Same `processProcedureDefinitions` discovery pass; same `proc_<sanitized>` / `arg_<sanitized>` naming. `warp` parsed but not enforced. |
| `operator_letter_of` / `operator_length` / `operator_contains` | Were missing entirely on Spike. Added with same Scratch semantics (1-indexed letter_of, case-insensitive contains). |
| `operator_round` | Replaced Python `round()` (banker's) with `int(math.floor(float(x) + 0.5))` for half-away-from-zero, matching Scratch and ev3dev. |
| `control_repeat_until` yield | Added `utime.sleep_ms(10)` at end of body. Spike runtime is single-threaded, but the yield still keeps sensor / BLE callbacks responsive. |
| `control_wait_until` | New handler (`while not cond: check_stop(); utime.sleep_ms(10)`). |
| Hat dispatch — keypress + unknown | Spike's runtime is single-threaded (broadcasts call handlers synchronously) so a polling thread for keypress isn't viable without rearchitecting. Match LMS's honest approach: `console.warn` + `# WARNING: hat 'event_whenkeypressed' is not wired up (Spike runtime is single-threaded — no concurrent button poll)` inside the dead function body. Other unknown hats get the same treatment with reason "not implemented for Spike". Replaces the silent dead-code emission. |

**Spike-specific deviation from Scratch semantics worth knowing about**: Spike's `trigger_broadcast` and `trigger_broadcast_wait` *both* call handlers synchronously — so `event_broadcast` (fire-and-forget) is currently identical to `event_broadcastandwait`. Multiple `whenflagclicked` hats also run sequentially, not in parallel. This is a Spike-design choice (MicroPython on the hub is effectively single-threaded for our purposes) and is **out of scope** for this audit — flagging here so future work knows the constraint.

### LMS (`ev3_lms_transpile.js`)
+25 / −1 vs synced baseline. Single targeted fix:
- **`control_wait_until`** added as a new `transpileWaitUntil` method, modelled on `transpileRepeatUntil` (label + `JR_TRUE` jump-out + body-less + `TIMER_WAIT(10, …)` to avoid hammering the EV3 VM, then `JR` back to start). Uses LMS's existing timer-allocation helper.

LMS already has a richer operator set than ev3dev had (`letter_of`, `length`, `mathop`, `mod`, `round`) and is honest about unsupported hats. The other gaps (lists, procedures) would require a different design — LMS bytecode has no native callable-function abstraction beyond the existing label/jump approach, so procedures would need inlining or a per-call label scheme. Deferred.

### NXT (`legonxt_transpile_universal.js`)
+26 / −1 vs synced baseline.
- **`control_wait_until`** added inline in the NXC emitter (`while(!(condition)) { Wait(10); }`).

NXT-G's hat-discovery is already an explicit allowlist (only `event_whenflagclicked` / `event_whenbroadcastreceived`), so the dead-code class of bug doesn't exist here. Lists / procedures are the same deferred design problem as LMS.

### Aggregate stats across the audit
| File | Δ | Final LOC |
|---|---|---|
| `ev3dev_py_transpile.js` | +495 / −64 | 6102 |
| `legospike_turbowarp_transpile.js` | +297 / −7 | 5051 |
| `legonxt_transpile_universal.js` | +26 / −1 | 7124 |
| `ev3_lms_transpile.js` | +25 / −1 | 4515 |
| **Total across all four** | **+843 / −73** | |

All four pass `node --check`. Untested on hardware — the user-facing changes need to be validated with real projects on EV3 brick / NXT brick / Spike Prime hub.

### What's still deferred
- ev3dev / Spike: broadcast restart-on-re-fire semantics (Scratch restarts a handler on re-broadcast; current code skips silently or double-fires inconsistently).
- ev3dev / Spike: `control_stop` "other scripts in sprite" silently behaves like "this script".
- ev3dev / Spike: `sensing_*` family (timer/reset_timer would be cheap; key_pressed reporter + answer/askandwait need design).
- All four: clones (`control_create_clone_of` / `control_delete_this_clone` / `control_start_as_clone`).
- LMS / NXT: lists and procedures — different target-language design, defer until user need.
- Cross-cutting: shared "scratch-vm-flow" core to stop the four-way copy-paste drift. Significant refactor.

---

## Sandbox collapse 2026-05-02

The Phase 2 + Phase 4 audit fixes above were finished in the local sandbox
but never committed; they sat as 829 lines of uncommitted working-tree
delta across the four transpiler files. To stop the local sandbox drifting
further from the gallery, the four `.js` files (and the other 13 mirrored
extension `.js` files that had no local edits) were removed from
`turbowarp-lego` main and their last working state preserved on the
[`wip-pre-collapse`](https://github.com/CrispStrobe/turbowarp-lego/tree/wip-pre-collapse)
branch (commit `948c32d`). LOC matches the Phase 4 stats above to within ±4
LOC, so the WIP is the completed audit work, not a half-finished port.

**Open task: port the audit fixes from `wip-pre-collapse` into the gallery,
once a brick is available for hardware validation.** The WIP was authored
against an older sandbox baseline that lagged the gallery's own fixes
(streamingMode default, port autocorrect, etc.), so a straight copy would
revert those. Use `git merge-file --diff3 <gallery-current> <sandbox-base>
<wip>` per file (see PLAN.md for the recipe), then `node --check`, then
test on the brick, then commit per phase to `CrispStrobe/extensions:main`.

The sandbox now carries only the Python bridges and protocol notes — see
`README.md` for what stayed.

---

## Upstream sync 2026-05-02

Brought all three forks current with their TurboWarp upstreams in the same
session as the sandbox collapse:

| Fork | Behind → up to date | Conflicts |
|------|---|---|
| `CrispStrobe/extensions` (main) | 13 commits | 0 — upstream only touched non-CrispStrobe extensions |
| `CrispStrobe/scratch-gui` (develop) | 8 commits | 0 |
| `CrispStrobe/turbowarp-desktop` (master) | 16 commits | 1 in `package.json` — kept our `"@turbowarp/extensions": "file:../extensions"` (the wiring that bundles our gallery into the desktop build), took upstream's `@electron/fuses ^2.1.1` |

Each fork has a `pre-upstream-sync-2026-05-02` tag pointing at the
pre-merge commit, in case any of the merges turn out badly.
`turbowarp-android` and `turbowarp-ios` are not forks — nothing to sync.

The desktop fork's `package.json` divergence is the load-bearing part of
the custom distribution: `file:../extensions` means our Electron build
includes-by-relative-path the *sibling* `CrispStrobe/extensions` checkout
when it builds. Anyone building the desktop fork needs both repos checked
out side-by-side.

---

## Gallery-side validation debt

`npm run validate` + `npm run lint` in the gallery surface **371
pre-existing errors** in our LEGO additions, untouched by the upstream
sync:

- Multiple `extensions/CrispStrobe/*.js` have `By: <https://github.com/CrispStrobe>` — the gallery validator requires the link point to a Scratch user, not GitHub.
- 8 SVGs in `images/CrispStrobe/` aren't 2:1 aspect ratio (256×256 / 40×40 / 512×512 squares).
- Lint findings: `no-unused-vars`, `no-case-declarations`, `extension/should-translate`.

Not blockers for our fork (we don't enforce them), but they would block any
attempt to upstream our extensions to TurboWarp/extensions:master. Worth a
focused cleanup pass before considering an upstream PR.

