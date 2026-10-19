# Operations, dependencies and transfer

## Hosting

The present site is public at https://sign-studio-3d-fa.blue-cascade-7123.chatgpt.site . Source snapshot is published version9. The tracked `.openai/hosting.json` points to `dist/` and identifies the existing hosted project. It is metadata, not a secret or an access credential.

For a new independent system, deploy `source/dist/` on a static host serving ES modules with JavaScript MIME types and relative asset paths. There are no environment variables required by the runtime. If moving to a new host/repository, treat the existing hosting identity as reference metadata; do not assume it gives your new developer control of the old site. Keep the import map paths and local vendor paths intact until you introduce a bundler.

The current host's publication workflow is managed by ChatGPT Sites. Direct publishing/editing of that hosted instance needs separately authorized account/editor access. This archive does not transfer that access, create a GitHub remote, or change the live site. Your developer can run and modify the standalone copy immediately and host it independently.

Current source explicitly versions app/local module/style requests with `?v=9`. Use a build pipeline with hashed asset names for reliable cache invalidation during a full-system refactor. Keep project import compatibility across releases.

## Dependencies and licensing

- Three.js r186 (local files); MIT license in `source/dist/vendor/LICENSE`. OrbitControls, RoundedBoxGeometry and BufferGeometryUtils are included from the same distribution.
- JavaScript Clipper6.4.2, license/attribution in `source/dist/vendor/clipper.js`; upstream header states Boost Software License1.0 and additional port attribution. Preserve all included notices and verify obligations before redistribution.
- Runtime dependencies are vendored, not pulled from CDNs. `package.json` does not list them. If adopting npm dependencies, pin versions and add a lockfile.
- System fonts only. User supplied images include artwork/logos/screenshots; their usage rights are not reassigned or certified by this package.
- No proprietary-license determination is made for the application code by this handover; the developer receives the project source requested by the user. Third-party notices remain applicable.

## Inputs / outputs / privacy

Artwork and wall image data are read locally through browser APIs; the source has no API upload or telemetry backend. Downloaded project JSON may embed the full original image/wall as data URLs; handle those files as customer material. Images are not automatically persisted server-side. There is no accounts database, customer list, production storage or API secrets to migrate.

PNG/JPG/WebP/SVG: max15 MB artwork; SVG text should be converted to paths before export even though current ingestion is rasterized. Wall photo: PNG/JPG/WebP, max15 MB. Project JSON: max25 MB. CDR/PDF/EPS/AI are not native upload formats. Current project output is PNG/contact sheet and version1 JSON, not CAD/STL/GLB or BOM.

## Debugging first steps

1. Serve over HTTP and inspect browser console/network before interpreting a blank canvas as an artwork problem.
2. Confirm WebGL2/graphics acceleration and that the import map/modules load from local paths.
3. Read persistent message below Upload and current renderer fallback. Load sample and supplied HALO HALO separately.
4. Try alpha mode for white/transparent artwork; auto mode intentionally removes near-white pixels. Empty visible art is a user-facing error in version9.
5. Observe processing cost at 2048px input canvas and960px mask; failures may happen after selection, during CPU assembly or GPU allocation.
6. Confirm no browser extension/policy blocks the file picker; retry the same file (input is reset in version9).
7. Use a real GPU-enabled browser for visual QA. The handover smoke tests do not replace this.

## Repository and history

`history/halo-studio.bundle` contains main and10 commits. `history/commits.txt` lists their exact IDs; commit messages are generic ('Update Site source'), so use diffs to inspect changes. Bundle object integrity is checked in validation. No `.git/config`, authorization headers, credentials or transient build directories are copied.

Latest history landmarks: version9 upload repair (`00204b2`); version8 clamp/mount/lighting update (`97bf720`); earlier geometry/material work (`d9dee9e` and preceding commits). Native curves and new sign types are future work.
