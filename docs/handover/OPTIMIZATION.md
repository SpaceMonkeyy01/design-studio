# Optimization and quality plan

This is a suggested work order grounded in current code, not benchmarked conclusions about a particular GPU. User priorities are premium visual fidelity, <=5 seconds and preservation of all live features, without paid render APIs.

## 1. Establish measurable baseline and upload reliability

Instrument file selection -> decode -> mask -> tracing -> cleanup -> geometry -> GPU compilation/upload -> first stable frame. Record CPU timings separately from first-frame and export timing. Capture renderer.info draw calls, triangles, textures/geometries, canvas resolution, GPU/browser/device and artwork complexity. Use cold/warm cache and fresh/repeated uploads. Current Node tests do not measure these GPU stages.

The last reported issue was an upload click/selection producing no response. Version9 added a real transparent native file-input overlay, persistent loading/error feedback, same-file reselection, versioned module requests, and startup exception reporting. CPU mocks passed but the user's real browser fix has not been confirmed in this handover. First reproduce on their Chrome/Windows setup. Check developer console, network import errors, WebGL2 initialization, native picker, supported format, decoded pixels, thresholds and file size before optimizing speculative bottlenecks.

## 2. Preserve original curves

For SVG, parse original vector paths, transforms, viewBox, fill rules and nested counters directly. Convert strokes to outlines where needed; handle or explicitly reject text, external resources, clipping/masks and embedded raster elements. Keep original curves as authoritative artwork and build display/offset polygon approximations with a bounded geometric error. Do not apply arbitrary smoothing to precise vector input.

For bitmap input, improve segmentation and fit curves with controlled deviation while preserving sharp corners, counters, small gaps and separate letters. Current 960px mask and fixed tolerance can visibly distort small lettering. Offer a shape-preserving quality/tolerance strategy rather than only adding vertices to a degraded outline. A library must be selected by supported geometry operations and measured results; no 'best library' has been chosen/integrated for this upgrade.

## 3. Separate performance costs from quality

- Move segmentation/tracing/offset preparation into workers, with cancellable jobs and transferable buffers. Keep GPU object creation on its required thread.
- Cache normalized artwork, contours, offsets and topology independently of lighting/material changes. Preserve the existing fast lighting/finish update paths.
- Instance repeating LEDs/screw heads/spacers where feasible; share primitive geometry with explicit ownership. The current helical thread and many individual meshes can be expensive when letters/mounts increase.
- Build costly hidden internal detail lazily or use internal-detail LOD, while keeping inspection available and accurate. Do not discard live features to meet a timing target.
- Replace always-on rendering with on-demand rendering plus active loops for camera damping, rotation, animation and exports.
- Update shadow maps only when necessary; measure the 4096 map cost. Avoid reducing precision until it is shown to be the bottleneck.
- Dispose temporary raw geometries used before toCreasedNormals and audit cloned/shared texture/material lifetime. Monitor repeated uploads/switches for growth.
- Decouple screen preview pixel ratio from export resolution. Current min1.75/max2.5 pixel ratio can impose heavy GPU cost even on a low-DPI screen.
- Avoid long synchronous 4K/base64 export batches. Use progress/cancel and Blob outputs; set a separate export performance budget with the user.

## 4. Make geometry and assemblies robust

Protect true corners, adaptive curve tessellation, valid triangulation, watertight returns and appropriately split normals. Current scaling before creased-normal generation helps numerical issues but is not a replacement for a consistent geometry pipeline.

Decouple at least3 clamps from stud count; place clamps along feasible continuous interior return boundaries with footprint containment, screw directions and acrylic thickness checked. Use per-component/stroke-aware mounting layouts with minimum distance, load/clearance constraints and designer override. Raster components are not semantic letters; model compound letters and disconnected details intentionally.

Verify LED full footprints (including rotations/lenses), wire tube radii and bracket/screw volumes, not only center points. A route omitted because it failed must be surfaced to the user. Do not present complete assembly if electrical connections are absent.

## 5. Lighting/material quality

Separate geometry silhouette QA from material/illumination QA. Improve calibrated scene scale, reflection environment, bevel highlights, brushed anisotropy, mirror reflections, color/tone mapping and wall material response. Replace or refine the 2D halo mask approach if oblique views/gaps expose inaccuracies. Acrylic currently glows by emissive material; it does not physically diffuse discrete LEDs.

Evaluate improvements with fixed artwork, camera and lighting. No paid external service is needed to improve browser PBR, but a free library alone does not establish Blender-like realism or universal five-second speed.

## Acceptance matrix

Test Windows Chrome (user environment), other supported browsers, integrated/discrete GPUs and at least one weaker device. Agree the supported hardware/artwork envelope rather than hiding a missed limit. Include:

- Vector circle/cubic/script with counters; tiny lettering; narrow strokes; joined letters; dot/compound letter; multi-color logo; transparent white art; JPEG HALO HALO test; malformed/large SVG.
- Assembled/exploded/internal/inspector, lit/unlit, all finishes, LED presets/custom CCT/RGB, wall upload/clear/scale, project round trip, 4K PNG and 12-view capture.
- Repeated uploads of the same file and different files; refresh/cache upgrade; renderer failure; invalid input; cancellation and failed load without destroying the previous project.
- Shape deviation, gaps/counters, manifold edges, continuous returns, component counts/containment, uniform LED coverage, no visible power/junction boxes.
- <=5 seconds to agreed first usable frame on the defined matrix; log actual misses. No test here certifies it.
