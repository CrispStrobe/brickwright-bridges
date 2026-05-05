# LEGO extensions audit — plan

Audit roadmap for the LEGO extensions in `CrispStrobe/extensions`. Running
notes go in `LEARNINGS.md`.

## Repo layout

After the **2026-05-02 sandbox collapse**, the LEGO extension `.js` files
no longer live here. The canonical copies are in the gallery at
[`CrispStrobe/extensions/extensions/CrispStrobe/`](https://github.com/CrispStrobe/extensions/tree/main/extensions/CrispStrobe).

The four transpiler `.js` files at the moment of the collapse are preserved
on the
[`wip-pre-collapse`](https://github.com/CrispStrobe/turbowarp-lego/tree/wip-pre-collapse)
branch — these are the **completed Phase 2 + Phase 4 audit deliverables**
described in `LEARNINGS.md` (operators / lists / procedures / keypress
wiring / `control_wait_until` / repeat_until yield, across `ev3dev_py`,
`legospike`, `legonxt`, and `ev3_lms`). They pass `node --check` and as of
**2026-05-05 are hardware-validated for ev3dev** (44/44 emitted-pattern
smoke-test cases pass on a real brick — see
[`LEARNINGS.md` § Hardware validation](./LEARNINGS.md#hardware-validation-on-the-brick--three-bridge-bugs-found-2026-05-05)).
Spike Prime / NXT / LMS hardware validation is still deferred. Porting
into the gallery still needs a 3-way merge (gallery main + sandbox-base
+ WIP) per file.

```bash
# rough porting recipe per file
git -C turbowarp-lego show wip-pre-collapse:<file>.js > /tmp/<file>.wip
git -C turbowarp-lego show <pre-audit-commit>:<file>.js > /tmp/<file>.base   # see git log
cp extensions/extensions/CrispStrobe/<file>.js /tmp/<file>.gallery
git merge-file --diff3 /tmp/<file>.gallery /tmp/<file>.base /tmp/<file>.wip
# resolve any conflicts; node --check; test on the actual brick; commit.
```

What stayed here:

| Category | What lives here |
|----------|-----------------|
| **EV3 host bridges** | `ev3dev_ondevice.py` (~2940 LOC, v2.3.1 as of 2026-05-05), `ev3_local_bridge.py` (~790 LOC) |
| **EV3 compile service** | `ev3-compiler-service/` — Flask app + bundled `lmsasm-binary` (3.7 MB) used by the gallery's `ev3_lms_transpile.js` |
| **NXT bridges + tools** | `nxt_bridge.py` (~673 LOC), `nxt-pybluez-bridge.py` (~335 LOC), `nxt-diag.py` (~127 LOC), `test_bt.py`, `reset_nxt.sh` |
| **Generic bridges** | `lego_bridge.py` (~1000 LOC), `lego_bridge_unified.py` (~318 LOC), `universal_bridge.py` (~774 LOC), `universal_lego_bridge.py` (~1851 LOC) |
| **Top-level docs** | `README.md`, `README_bridges.md`, `README_ev3_local_bridge.md`, `README_ev3dev_bridge.md` |
| **Audit notes** | `PLAN.md` (this file), `LEARNINGS.md` |
| **`bkp/`** | Historical/experimental versions. Not loaded. Do not audit. |

Note: `ev3dev_ondevice.py` (here) and `ev3_bridge.py` (gallery) are two
versions of the same on-device bridge that have drifted independently.
Reconciling them is a separate task from this audit.

## Audit target

`extensions/CrispStrobe/ev3dev_py_transpile.js` in the gallery
(<https://github.com/CrispStrobe/extensions/blob/main/extensions/CrispStrobe/ev3dev_py_transpile.js>).
Other transpilers (`ev3_lms_transpile.js`, `legonxt_transpile_universal.js`,
`legospike_turbowarp_transpile.js`) share the same gaps and got the same
checklist applied.

## Audit phases

### Phase 1 — Coverage audit ✅
Built a canonical Scratch generic-flow opcode list from
`scratch-vm/src/blocks/` (control / event / operators / data / procedures
/ sensing). Grepped each transpiler for each. Output: gap table. **Done
for all four transpilers.**

### Phase 2 — Semantic audit + initial fixes (ev3dev) ✅
For each handled-but-risky block, traced end-to-end:

- `event_broadcast` vs `event_broadcastandwait` (must wait!)
- `control_wait_until`, `control_repeat_until` yield
- `procedures_definition` "run without screen refresh" (warp)
- `control_stop` (this script / other scripts in sprite / all)
- `control_start_as_clone`, `control_create_clone_of`,
  `control_delete_this_clone`
- Variable / list scope (sprite-local vs. global)
- Yields inside loops (does emitted Python actually let other scripts run?)
- Hat blocks beyond `event_whenflagclicked` /
  `event_whenbroadcastreceived`

**ev3dev fixes landed** (operators round/mod/mathop/letter_of/length/
contains, lists with helpers, procedures with arg_*, keypress wired to
brick buttons, control_wait_until, repeat_until yield, unknown-hat warning).

### Phase 3 — Coverage audit of Spike / NXT / LMS ✅
Same Phase 1 checklist applied to the three siblings. Each has the same
broad gaps; only operator menus and hat-dispatch differ. **Done.**

### Phase 4 — Targeted fixes for Spike / NXT / LMS ✅
- **Spike** got the full Phase-2 mirror in MicroPython idioms (lists,
  procedures, missing operators, control_wait_until, repeat_until yield;
  keypress emits an honest warning since Spike's runtime is
  single-threaded).
- **LMS** got `control_wait_until` (loop with `TIMER_WAIT`); other gaps
  deferred until a real user need surfaces (LMS bytecode has no native
  callable-function abstraction).
- **NXT** got `control_wait_until` (NXC `while(!cond) Wait(10);`).
  Pre-existing `pendingRequests` FIFO bug picked up from upstream sync.

All four files pass `node --check` and were on the
`wip-pre-collapse` branch awaiting hardware validation.

### Phase 5 — Hardware validation ✅ (ev3dev only) / ⏳ (others)

**ev3dev (2026-05-05):** 44/44 audit-fix smoke-test cases PASS on a real
brick at `192.168.178.57`. The smoke test reproduced the **exact** Python
the WIP transpiler emits (`_list_*` helpers, `int(math.floor(float(x) +
0.5))` for round, `math.sin(math.radians(x))` for trig, the
procedure-as-Python-def pattern with `arg_<sanitized>` parameters, the
busy-loop with `time.sleep(0.01)` yield) and uploaded it via the bridge's
`upload_script` + `run_script` API. Surfaced three latent bugs in the
bridge itself (f-strings on a Python 3.5.3 host, ASCII codec on
upload_script, locale crash in cert-gen log lines) which were fixed +
landed as bridge v2.3.1. See `LEARNINGS.md` for the full picture.

**Spike Prime:** still deferred until a hub is plugged in.
**NXT:** still deferred until a brick is paired up.
**LMS:** still deferred (mostly relevant when the
`legacy-lego-compiler` REST API is exercised end-to-end).

### Phase 6 — Port WIP into the gallery ⏳

Once hardware validation is done for the relevant target, run the 3-way
merge recipe at the top of this file to land the WIP transpiler into
`CrispStrobe/extensions:main`. ev3dev is unblocked; the other three are
not.

## Out-of-band fixes deferred for later

- Reconcile `ev3dev_ondevice.py` (here) ↔ `ev3_bridge.py` (gallery).
- Auto-regenerate the bridge's self-signed cert when the brick's IP is
  no longer in the SAN list.
- Reap `running_scripts` dict entries when their subprocess exits.
- A shared "scratch-vm-flow" core to replace the four near-copy
  transpilers (cuts surface area to ~25%, but a lot of churn).
- Python 3.5 lint job in CI to catch f-string regressions in the bridge
  (the existing ruff job runs on a 3.10+ runner).
