# Validation and confidence boundaries

## Included executable checks

Run from the handover root with Python3 and Node22+:

```sh
python tests/verify_snapshot.py
node tests/geometry-regression.mjs
node tests/runtime-smoke.mjs
```

- Snapshot check hashes every file in `source/` against the exact original Git-tree blob ID recorded in `docs/SOURCE_SNAPSHOT.json` (Git SHA-1 blob hashing), verifies MANIFEST.sha256, and runs Node syntax checks on the authored app/modules.
- Geometry regression cleans the supplied HALO HALO bitmap mask, expects27 components and8 counters, verifies3–4 mounting candidates per component on this fixture, and checks extruded return-ring triangle edges for closed/manifold adjacency and finite coordinates. It records CPU elapsed time only.
- Runtime smoke evaluates current app code with actual Three.js CPU geometry and mocked DOM/canvas/renderer. It builds the fixture, verifies finite object transforms, exercises two sequential uploads of the same PNG, unsupported-format feedback and renderer-unavailable feedback. It does not decode a real PNG or display a native file picker. It does not render through WebGL.
- A separate bundle restore check clones the archive into a temporary directory, verifies its HEAD, tree and commit count, then removes the temporary clone.

Results from the packaging run are recorded in TEST_RESULTS.txt. Scripts and fixtures are handover additions, not existing production test infrastructure. No npm test or browser test suite existed in the source repository.

## Previous observations

Earlier CPU contour tests found27 cleaned components,8 counters,35 closed return rings and no failed manifold rings on the supplied HALO HALO artwork mask. Source checks and mocked repeated-upload flow passed. This is numerical geometry evidence only.

The available preview/browser environment did not provide usable WebGL for a full visual GPU review. Consequently premium-quality rendering, real-browser upload fix, true antialiasing/material behavior, repeated GPU memory release and the <=5-second user requirement remain unverified. The user reported artwork acceptance problems; version9 attempted a repair but no subsequent user confirmation is recorded.

## Known concerns for developer review

- SVG is rasterized; exact source curves are lost.960px mask/fixed smoothing can change small details.
- Native PDF/CDR/AI/EPS inputs and new sign types are absent.
- Main-thread tracing/mesh construction and many individual high-detail internal meshes may scale poorly.
- At least3 clamps is a requested rule, not a universal code invariant. Counts depend on mounts, skipped small pieces and candidate availability.
- Clamp boundary selection, hidden hardware containment, LED coverage and omitted wire routes need comprehensive geometry/visual validation.
- Current acrylic thickness and all hardware sizes are illustrative; reconcile with actual manufacturing specifications.
- Halo is a blurred additive mask, acrylic emission is approximate, mirrors use synthetic reflections.
- Project imports need stronger enum/schema validation and transactional restore; failed load can partially change state/settings.
- Shared material/texture disposal and temporary geometry lifetime need a GPU-memory audit.
- The 4K export process can consume substantial memory and does not prove source fidelity. Multi-view capture is sequential and unbenchmarked.
- Stale comment in app.js still says 'Exactly two mounting assemblies' even though implementation now requests3–4. Follow code/product requirements, not that old comment.

Suggested acceptance checks and refactor priorities are in OPTIMIZATION.md. Keep this source snapshot reproducible before making changes.
