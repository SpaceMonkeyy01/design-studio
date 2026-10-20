# Halo-lit (reverse) channel letters

`build.mjs` builds one sign from the traced artwork. The root `CLAUDE.md` rules apply. Shared code lives in `core/` and is never copied here.

## Construction (front → wall)

- **Face**: opaque metal, 0.045″ thick with a small bevel. It takes the selected finish. "Match artwork" uses each letter's own colour, and patterned faces keep the artwork texture.
- **Returns**: metal sidewalls at the full sign depth. Wall thickness is the smaller of 0.04″ and 22% of the letter's largest mount clearance. Built by Clipper offsetting so thin strokes and sharp corners stay closed.
- **LED modules**: rear-facing (towards the acrylic), each module has 3 lenses. Placed by `layoutModules` and scaled down to fit narrow strokes.
- **Wiring**: red and white runs between modules, routed by A* inside the letter. Shown as 18 AWG (illustrative).
- **Acrylic back**: 3/16″, cut to the letter contour. Clear, frosted or opal.
- **Mounts**: 3–4 per letter (Auto, or a forced 3 or 4). Each mount is a hollow spacer as long as the wall gap, with a threaded stud through its bore and a rivnut. Hardware scales to the stroke width.
- **L-clamps**: one per mount, so at least 3 per letter. Each has 2 screws: one through the return, one through the acrylic back. Hidden in the Assembled view.
- **Drain**: one marker at the lowest point of each letter that has LEDs (illustrative).
- **Tiny pieces** (area under 8 px² or under 0.2% of the largest piece, measured in the 960 px mask) get a face, returns and acrylic, but no LEDs, wiring, mounts, clamps or drain.
- **Not modelled**: power supply and junction box (behind the wall).

## What is lit

Light leaves through the back only. The face and returns never glow.

- **Acrylic**: emissive in the LED colour. Strength = intensity × face/edge factor: clear .12/.65, frosted .75/.95, opal 1.15/1.2.
- **LED lenses**: emissive 0.7.
- **Halo**: the artwork mask blurred by 8 + 5 × gap (inches) px, tinted with the LED colour, drawn on an additive plane just in front of the wall. Opacity = intensity × 1.15. This is not simulated light.
- **Unlit mode**: every emissive is 0 and the halo is hidden.

## Defaults (UI ranges)

| Setting | Default | Range |
|---|---|---|
| Width | 48″ | 4–240″ |
| Depth | 1″ standard | custom 0.5–8″ |
| Wall gap | ¼″ | 0.25–6″ |
| LEDs | 6500K | presets, 1800–12000K, RGB, colours |
| Intensity | 75% | 0–100% |
| Acrylic | clear 3/16″ | clear, frosted, opal |
| Mounts | Auto (3–4) | 3, 4 |

## Exploded view

Each part group moves along z by `explodedOffsets`: face +.9, LEDs +.6, wires +.4, returns and drain +.2, clamps −.35, acrylic −.55, studs −.7 (world units).

## Tests

- `tests/runtime-smoke.mjs` checks this build on the `halo-halo-mask.json` fixture: 27 pieces and at least 81 clamp assemblies.
- `tests/visual-smoke.mjs` takes the screenshots. There is no `tests/signs/halo-lit/` folder yet.
