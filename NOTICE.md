# Third-Party Notices & Attribution

`turbowarp-lego` is distributed under **GPL-3.0** (see [`LICENSE`](LICENSE)).

## Original work in this repository

This repository is **primarily first-party code** by **CrispStrobe**, © 2025–2026
CrispStrobe, licensed GPL-3.0:

- the Python bridges (Bluetooth Classic / BLE / WebSocket / serial),
- the NXC and LMSASM transpilation helpers,
- the protocol notes, setup guides and documentation.

## Components it interoperates with (not vendored here)

| Component | Author(s) | License | Relationship |
|---|---|---|---|
| TurboWarp / scratch-gui | Scratch Foundation + TurboWarp | BSD-3-Clause (base) + GPL-3.0 (TurboWarp modifications) | The editor these bridges target; maintained in `CrispStrobe/scratch-gui` (external) |
| LEGO extensions | CrispStrobe | GPL-3.0 | Maintained in `CrispStrobe/extensions` (external gallery) |

This repository targets the TurboWarp/Scratch ecosystem but does **not** vendor
the editor source. GPL-3.0 is used to stay consistent with the TurboWarp editor
fork it is built for.

LEGO® is a trademark of the LEGO Group, which does not sponsor or endorse this software.
