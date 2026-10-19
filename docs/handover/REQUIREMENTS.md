# Product requirements and current gaps

These are requirements from the visible project conversation, not a declaration that every requirement is satisfied. Current source remains a halo-only prototype. Reference screenshots include examples of failed/poor results; they are not all visual targets.

## Preserve throughout development

| Topic | User requirement | Current implementation / gap |
| --- | --- | --- |
| Cost | No paid rendering service | Browser-local rendering, vendored free libraries; future hosting/storage/compute costs are separate |
| Latency | Maximum 5 seconds; non-negotiable user requirement | Not demonstrated or guaranteed; define supported device/artwork envelope and measure actual upload-to-first-frame |
| Interaction | All live controls must continue working | Orbit/pan/zoom, view presets, materials, LEDs, wall, modes and inspection exist; device/browser QA required |
| Quality | Premium customer-facing, Blender-like, HD, smooth curves and continuous returns | Raster tracing + mesh rendering; no certified premium-quality acceptance |
| Artwork | Preserve exact shapes, counters and colors | Current thresholds/smoothing can lose or alter details; native SVG vector path support pending |
| Sign scope | Halo first, later all sign types | Halo only; other construction profiles not specified/implemented |
| Depth | Standard 1 inch; optional custom depth | Implemented; UI custom range 0.5–8 inches |
| Wall gap | Default 0.25 inch | Implemented; do not silently replace this with other earlier gap suggestions |
| LED | Default 6500K; all shade controls easy to access | White presets, custom 1800–12000K, color presets and RGB |
| Finishes | Artwork matched paint with matte/satin/gloss; rich brushed/mirror silver/gold etc. | Controls/procedural materials exist; optical realism remains to improve |
| Wall | Built-in walls and customer's own photo | Photo upload/scale exists; no perspective calibration or real scene reconstruction |
| Back | Acrylic cut to letter, lit/diffusing correctly | Clear/frosted/opal approximate materials; current thickness is 3/16 inch, not validated against every physical construction reference |
| LED placement | Cover letter interiors without overcrowding | Automatic illustrative layout; narrow strokes and coverage gaps need acceptance tests |
| Wires | Stay inside the sign/letter outline | Clearance routing exists; unsuccessful routes may be missing, so electrical completeness is not guaranteed |
| Studs | Latest explicit instruction: 3–4 per letter, small/proportional and spread uniformly | Auto3–4 or explicit3/4; fewer possible in tiny candidate pools; older two-stud wording in a code comment is stale |
| Spacers | Hollow spacer with threaded stud inside | Visual assembly exists; physical dimensions/attachment require confirmation |
| Clamps | At least3 small L clamps per letter, 2 screws each: one on return, one on acrylic | Assemblies implemented, coupled to mounting candidates; universal minimum/containment not guaranteed |
| Hidden services | Power supply and junction boxes behind wall, excluded from sign render | No visible power/junction components modeled |
| Inspection | High-quality exploded/internal view and click-to-zoom parts | Implemented illustrative group separation and inspector |
| Output | HD views, lit/unlit, angles | 3840px-wide PNG,12 preset images/contact sheet; visual quality not implied by output dimensions |

## Reference material

`references/` contains all available original uploads (19 files), including:

- `imgo.jpg`: HALO HALO MARKETPLACE test artwork; runtime copy is `source/dist/halo-halo-test.jpg`.
- `image(20261013-054920).png` and `image(20261013-054950).png`: latest L-clamp / two-screw construction references.
- `image(20261012-101604).png`: earlier L-clamp construction discussion.
- Other dated screenshots document broken curves, sidewalls, component size/placement and halo concerns. Use their filenames and source discussion context to distinguish complaints from desired appearance.
- `source/dist/construction.png`: existing in-app construction reference.

File integrity/size index is in REFERENCE_INDEX.json. No native CDR/CAD/vector master was supplied in this project snapshot.

## Next system: decisions and extension contract

The user intends a full system with additional sign types. The following is a proposed developer architecture, not existing code or confirmed manufacturing specifications:

- Separate artwork ingestion from manufacturing construction and render representation.
- Model a project with units, artwork source, exact vector paths where available, per-piece identity/colors, signType, construction parameters, material assignments, wall and lighting settings.
- Give each sign type a profile defining defaults, allowed fields, layer stack, geometry builder, attachment rules, electrical component rules and inspection/explosion behavior.
- Reuse renderer, camera, scene controls, material catalog, component inspector and export pipeline across profiles.
- Candidate future profiles include face-lit channel, front+halo, non-illuminated dimensional, flat-cut, acrylic/edge-lit, faux-neon, cabinet/pillbox and blade signs. This list is a planning suggestion; the user has not supplied fabrication details for all of them.
- Ask for actual cross-sections, face/return/back materials and thicknesses, trim-cap rules, minimum strokes, hardware, LED/module catalog, drainage and service access per type before implementing engineering rules. Face-lit references were offered earlier but not delivered as a complete validated specification.
- Add stable component IDs, geometry/material reuse, schema validation and migrations before adding accounts/persistence or quoting. Production fabrication and electrical/structural certification are separate workstreams.

## Must not be silently promised

No guaranteed five-second render on arbitrary hardware/artwork. No claim that 4K output is path-traced or Blender-equivalent. No universal LED/stud/clamp containment/count certification. No fabrication-ready CAD/BOM/electrical design is currently generated.
