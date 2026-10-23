# Cabinets

`build.mjs` builds cabinet signs: a rectangular aluminium box on the wall, the artwork in or on its front. The root `CLAUDE.md` rules apply; shared code lives in `core/` (the lit acrylic face and its glow plane are `core/litface.mjs`, shared with face-lit channel letters).

Marked **ASSUMED** = a guess, check it. Marked **ASK** = a real dimension we do not have.

## Built: push-through

From the Estimator drawings `references/cabinet/push-thru/section.png` (face-lit) and `push-thru-face-halo/section.png` (halo). Registry rows: Push-Through Signage · Face-lit → `push-thru`, · Halo-lit → `push-thru-halo` (`VARIANTS`). `CONFIGS` has one switch, `halo`.

Construction (front → wall):

- **Letters**: 3/4″ acrylic (drawing), routed to the artwork, pushed through the front so they stand proud by 3/4″ − the front. Front caps: `acrylicFaceMaterial` (Face select: vinyl or tinted); sides: lit acrylic edges in the LED colour (`EDGE_GLOW`, diffuse to 25% when lit).
- **Aluminium front**: the cabinet rectangle with every letter routed out (outline grown by a 1/32″ clearance, **ASSUMED**); letter counters stay as aluminium islands. Finish = Cabinet finish (black default, white, brushed silver, brushed bronze); never lit.
- **Cabinet**: the artwork plus `cabinetmargin` all round (3″ **ASSUMED**, editable), square corners. Overall width stays the lettering. Returns 0.063″, front 1/8″, back 0.1019″: **ASSUMED** (not called out; returns and back from the cabinet face-lit PARTS).
- **Face-lit**: translucent acrylic backing behind the front (3/16″ **ASSUMED**), LEDs on the removable aluminium back facing forward, flush on the wall, studs through the back.
- **Halo-lit**: PVC sheet mid-depth with LEDs both sides (1/8″ **ASSUMED**), frosted acrylic back that glows (`BACK_GLOW`, 3/16″ **ASSUMED**), ¼″ studs on **1.5″ spacers** (drawing). Light planes: the cabinet halo on the wall (a rectangle blurred as halo-lit's halo for a 1.5″ gap) + the letters' face glow.
- **Studs**: a grid 3″ in from the corners, at most ~24″ apart (**ASSUMED**). **Power supply box** with on/off switch inside (drawing; position illustrative). **Drain hole** in the bottom return.
- **Mountings**: none (`MOUNTING_SETS.cabinet` is empty); the Mounting and Mounts-per-letter controls hide.
- **Defaults**: 3″ depth (2–10″, registry), 50% intensity, black cabinet. Screenshots 29–32.
- **Registry**: both Push-Through rows set to `done` by hand on 2026-10-23 at the user's request, as the channel-letter variants: the source generator must mark them done too, or the next regeneration reverts it.
- **ASK** the shop: front, back and backing gauges, letter projection, routing clearance, margin and corner radius, stud layout, stock cabinet colours.

## Not built yet

Lightbox / face-lit cabinet (PARTS `cabinet-face-lit`: part-for-part face-lit with the PSU inside), double-sided, routed & backed-up acrylic, non-lit, blade, pylon, monument. All drawings are in `references/cabinet/`.

## Tests

`tests/signs/cabinet/build-check.mjs`: parts, cabinet = artwork + margin, letters' projection, wall and standoff gap, studs reach the wall, only letters (and the halo back) glow, unlit dark, light planes, margin control, registry rows.
