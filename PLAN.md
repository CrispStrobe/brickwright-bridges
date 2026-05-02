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
`legospike`, `legonxt`, and `ev3_lms`). They pass `node --check` but are
**untested on hardware**. They were authored against an older sandbox copy
that lagged the gallery — porting needs a 3-way merge (gallery main +
sandbox-base + WIP) per file, then hardware validation, before the audit
fixes can land in the gallery.

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
| **EV3 host bridges** | `ev3dev_ondevice.py` (2865), `ev3_local_bridge.py` (788) |
| **EV3 compile service** | `ev3-compiler-service/` — Flask app + bundled `lmsasm-binary` (3.7 MB) used by the gallery's `ev3_lms_transpile.js` |
| **NXT bridges + tools** | `nxt_bridge.py` (673), `nxt-pybluez-bridge.py` (335), `nxt-diag.py` (127), `test_bt.py`, `reset_nxt.sh` |
| **Generic bridges** | `lego_bridge.py` (1002), `lego_bridge_unified.py` (318), `universal_bridge.py` (774), `universal_lego_bridge.py` (1851) |
| **Top-level docs** | `README.md`, `README_bridges.md`, `README_ev3_local_bridge.md`, `README_ev3dev_bridge.md` |
| **Audit notes** | `PLAN.md` (this file), `LEARNINGS.md` |
| **`bkp/`** | Historical/experimental versions. Not loaded. Do not audit. |

Note: `ev3dev_ondevice.py` (here) and `ev3_bridge.py` (gallery) are two
versions of the same on-device bridge that have drifted independently —
2865 vs 2074 lines, both have unique content. Reconciling them is a
separate task from this audit.

## Audit target

`extensions/CrispStrobe/ev3dev_py_transpile.js` in the gallery
(<https://github.com/CrispStrobe/extensions/blob/main/extensions/CrispStrobe/ev3dev_py_transpile.js>).
Other transpilers (`ev3_lms_transpile.js`, `legonxt_transpile_universal.js`,
`legospike_turbowarp_transpile.js`) likely share the same gaps and will be
worth a follow-up audit using the same checklist.

## Audit phases

### Phase 1 — Coverage audit (current)
Build a canonical Scratch generic-flow opcode list from `scratch-vm/src/blocks/`
(control / event / operators / data / procedures / sensing). Grep the EV3dev
transpiler for each. Output: gap table — opcode, presence, partial, semantics.

### Phase 2 — Semantic audit
For each handled-but-risky block, trace it end-to-end through the transpiler:

- `event_broadcast` vs `event_broadcastandwait` (must wait!)
- `control_wait_until`, `control_repeat_until`
- `procedures_definition` "run without screen refresh" (warp)
- `control_stop` (this script / other scripts in sprite / all)
- `control_start_as_clone`, `control_create_clone_of`, `control_delete_this_clone`
- Variable / list scope (sprite-local vs. global) — Python output must reflect this
- Yields inside loops (does emitted Python actually let other scripts run?)
- Hat blocks beyond `event_whenflagclicked` / `event_whenbroadcastreceived`

### Phase 3 — Targeted fixes
Address gaps and inconsistencies surfaced in 1+2. One PR-shaped change at a
time, against `CrispStrobe/extensions:main`.
