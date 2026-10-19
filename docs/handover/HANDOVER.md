# Technical handover

## Implementation and scope

The current application is plain HTML/CSS/JavaScript ES modules with Three.js r186 and Clipper 6.4.2. No React, backend, database, authentication layer, AI image service, Blender render process or server-side rendering is used. The hosting service controls access separately; the current published site is public. Files remain in browser memory unless the user explicitly downloads a project or output.

Only halo-lit reverse channel letters are implemented. Additional sign types are planned, not implemented. It is an interactive visualizer with approximate components, not a fabrication-ready engineering tool.

## Source map

| File | Responsibilities |
| --- | --- |
| dist/index.html | All controls, viewer canvas, gallery, modal; import map for local Three.js and addons |
| dist/style.css | Responsive UI, file input overlay, viewer and inspector layout |
| dist/app.js | UI state, image upload, scene setup, geometry assembly, materials, lighting, inspection, exports, project JSON |
| dist/geometry.mjs | Raster contour tracing, loop orientation/grouping, point containment, simplification/smoothing, Kelvin-to-RGB helper; also older shell/inset utilities |
| dist/artwork.mjs | Raster dust/pinhole cleanup and Clipper polygon difference/offset for continuous return rings |
| dist/routing.mjs | Connected-component labels, distance field, mounting candidates, LED layout and safe-grid wire routing |
| dist/vendor/ | Local Three.js core/module/addons plus Clipper; preserve licenses |
| dist/sample.png | West sample artwork |
| dist/halo-halo-test.jpg | Supplied HALO HALO MARKETPLACE image used for regression |
| dist/construction.png | Existing construction reference shown in the application |
| .openai/hosting.json | Current host identity and static dist deployment directory |
| package.json | ESM declaration only |

`dist/` is the editable source, despite its name. There is no separate src-to-dist build pipeline or hidden source map. app.js is dense and mixes domains; split it before extending significantly.

## Input to geometry

1. `upload(file)` validates extension/MIME and the 15 MB limit, reports status, reads a data URL, and calls `readImage`.
2. `readImage(src,name)` decodes through Image, rasterizes to a canvas limited to 2048 pixels on its largest dimension and creates the in-memory art object. `loadSerial` prevents an older decode from replacing a newer one.
3. `processArt()` removes the chosen background, crops occupied bounds and builds an alpha mask limited to 960 pixels on its largest dimension. Auto mode removes near-white pixels (min RGB >=225); dark mode removes pixels whose max RGB <=35; alpha mode preserves colors using alpha. Alpha visibility thresholds also apply.
4. `cleanArtworkMask()` removes tiny islands and fills some small/nested holes. It deliberately avoids global morphological closing because that previously merged neighboring JPEG letters.
5. `traceMask()` extracts boundaries; `smoothLoops()` performs simplification/Chaikin-style smoothing; `groupLoops()` assigns inner counters to outer shapes. Topology still depends on raster quality and threshold choices.
6. `distanceField()` estimates interior clearance; `componentLabels()` gives component membership. `artworkColour()` samples each region for dominant color/pattern handling.
7. `build()` creates face, return and acrylic meshes and internal assembly groups, then wall/halo.

Important: SVG is currently decoded and rasterized like a bitmap. The original SVG Bézier geometry is NOT preserved. Native SVG path ingestion was discussed but not implemented. CDR/PDF/EPS/AI are not accepted natively. Users must export a supported format.

## Coordinate system

The artwork has mask coordinates x-right/y-down. World coordinates center the artwork, flip y upward, and normalize total width to 4 world units:

```js
worldX = (pixelX / art.w - 0.5) * 4;
worldY = (art.h / 2 - pixelY) / art.w * 4;
worldUnitsPerInch = 4 / settings.width;
```

The face is near z=0. Returns extend toward negative z by the requested depth. Acrylic sits behind the returns; wall and studs extend farther back. Exploded mode adds group-level z offsets; it does not regenerate engineering joints. Keep mask-space, world-space and real inches explicit when refactoring.

## Mesh assembly

`parts` holds face, returns, acrylic, leds, studs, wires, drain and clamps groups under `root`.

- Face: extruded contours with small bevels; scaled for stable creased-normal generation, then scaled back. Text/logo details can still be altered by raster smoothing.
- Returns: robust Clipper inward offset and polygon difference makes continuous wall rings, including inner counters. ExtrudeGeometry and creased normals create the visible sidewalls. This is polygonal approximation, not a CAD surface kernel.
- Acrylic: currently 3/16 inch thick, same outline/counters, selectable clear/frosted/opal. Emissive face/edge materials respond to LED color/intensity.
- LEDs: automatically fitted small module bodies with three lenses, placed by interior clearance/coverage logic. Module placement and lens geometry are illustrative.
- Wires: interior grid routing uses clearance tests, direct segment checks and A*; successful routes become red/white tube meshes. Some connections may be omitted if no valid route exists. There is no electrical circuit validation.
- Studs: 3–4 requested candidates per component (auto generally 3 for slender pieces, otherwise 4), fitted to local clearance; hollow spacer, stud/rivnut approximation and explicit helical thread geometry. An insufficient candidate pool can yield fewer mounts.
- Clamps: one L-bracket assembly per generated mount. A bracket has orthogonal return/back screw shafts and heads/slots. The requirement is at least 3 per letter; current coupling to mount candidates means this is not a guaranteed invariant for tiny shapes. Nearest outer-vertex attachment and bracket containment need improvement, especially around counters and narrow strokes.
- Drain: illustrative bottom marker, not a validated hole/cutout.

A raster connected component is treated as a piece, not a semantically recognized letter. Joined letters remain joined; i dots and disconnected logo parts become independent pieces. Very small pieces are skipped for internals by an area threshold. These assumptions must change for full production use.

## Rendering and materials

`init()` creates a WebGLRenderer with antialiasing and preserveDrawingBuffer, pixel ratio clamped to 1.75–2.5, ACES tone mapping, a hemisphere light and two directional studio lights. Main shadow-map size is 4096. A generated studio canvas is converted to a reflection environment with PMREM.

`material()` builds MeshPhysicalMaterial presets: artwork colors, brushed/mirror silver/gold/bronze, black/white/custom paint and matte/satin/gloss sheen. Brushed grain is a procedural canvas bump/roughness texture. Mirrors reflect the synthetic studio environment; there is no captured HDRI or path tracing. `artworkMaterial()` assigns per-piece color or texture behavior.

`buildWall()` creates a textured/photo wall and the halo. The halo is a blurred 2D mask on an additive plane near the wall; it is not simulated LED light transport through acrylic. Acrylic emission is an appearance approximation, not physical diffusion.

`animate()` renders continuously, including when idle. Auto-rotation, camera damping and wall visibility are updated here. Actual antialiasing, export resolution, mesh quality and lighting all affect perceived quality independently.

## UI changes and resource lifetime

`state()` reads settings directly from DOM controls. `builtState` determines whether a change needs full geometry reconstruction. Width/depth/gap/mount count/acrylic type rebuild; finish/sheen/paint call `refreshSurfaces`; LED/color/wall changes call `refreshWall`; lighting calls `refreshLighting`. Halo slider input updates shader/material values directly.

`dispose()` and related refresh functions release geometry/material/texture resources. Shared material/texture ownership is informal; audit reference sharing and disposal before adding caching. Scene/inspector clones may share geometry/materials. Use explicit ownership/reference counting if needed.

There is no worker or centralized reactive store. Processing, tracing, component construction and exports run on the main thread. Cache versions in current source are explicit query strings (`?v=9`); replace with content hashes in a future build system.

## Inspection and export

`setMode()` applies assembled/exploded/internal visibility and offsets. `inspectPart()` clones a representative component or picked mesh into a focused inspector with independent camera fit; `exitFocus()` restores scene state. Hardware inspector defaults to representative pieces rather than displaying every component at once.

`imagePNG()` temporarily changes render dimensions, renders to the existing canvas, then resamples to a 3840-pixel-wide PNG. It attempts supersampling subject to MAX_RENDERBUFFER_SIZE. A 4K output file does not certify underlying geometric or optical quality. `capture()` loops six camera presets in lit and unlit states (12 images); `contactSheet()` composes them into one image. The five-second requirement has not been verified for this multi-export batch.

## Saved project format

`saveproject` downloads JSON with `version:1`, settings, background mode, customDepth, optional wallPhoto `{src,name}`, artwork data URL or a built-in asset path, and name. `loadproject` checks size (25 MB), basic dimensions/settings and allowed source patterns before restoring controls and reloading the artwork. See `tests/fixtures/project-v1-example.json` for a minimal built-in-art example.

There are no server projects, accounts, autosave or team permissions. Current base64 storage can produce large JSON files. Validate settings with a schema, migrate versioned projects, separate assets from configurations, and preserve backwards compatibility when adding sign types.
