# Halo Studio — developer handover

Prepared 19 October 2026. Start here.

This archive contains the complete editable source of the current halo-lit channel-letter tool, its available Git history, user reference images, portable regression checks, and a technical/product handover. The application is a prototype to be developed into a full signage system. Do not treat it as a production-ready CAD or manufacturing engine.

Current live application: https://sign-studio-3d-fa.blue-cascade-7123.chatgpt.site

Source snapshot: `00204b2bcc1461331a1a59cb1e8596d90b6cfd55`, branch `main`, published version 9. Source was clean when exported. The `source/` files are byte-for-byte copies of the tracked files at that commit; handover documentation and tests are separate additions. The live site may change after this handover.

## Run locally

Install Python 3. From this handover directory:

```sh
python -m http.server 8080 --directory source/dist --bind 127.0.0.1
```

Open http://localhost:8080 in a current browser with WebGL2 and hardware acceleration. Do not open index.html through `file://`; the ES modules require HTTP. All runtime libraries are included locally. There is no npm install, build, API key, database, or paid render service required for the current app. `source/package.json` declares ESM but has no scripts or dependency manifest. Python is only the development server, not an application backend.

## Restore the actual Git repository

Git must be installed. The bundle contains the 10 available commits on main and all their source objects:

```sh
git clone history/halo-studio.bundle halo-studio-repo
cd halo-studio-repo
git log --oneline
python -m http.server 8080 --directory dist --bind 127.0.0.1
```

The clone initially uses the local bundle as its origin. To move it to a repository owned by your team, create an empty repository in your chosen Git provider, then:

```sh
git remote remove origin
git remote add origin <YOUR_NEW_REPOSITORY_URL>
git push -u origin main
```

Replace the angle-bracket placeholder. No GitHub repository was created for this handover. The original checkout is managed by the current hosting service and has no configured remote URL in the exported local checkout. The bundle is a portable copy of the actual available history; it is not a deployment credential. Hosting ownership/access is separate from source ownership.

## Read next

1. `docs/HANDOVER.md` — architecture, source map, rendering pipeline and state.
2. `docs/REQUIREMENTS.md` — user requirements, current behavior, gaps and future types.
3. `docs/OPTIMIZATION.md` — prioritized work and device-based acceptance checks.
4. `docs/OPERATIONS.md` — deployment, troubleshooting, assets and licenses.
5. `docs/VALIDATION.md` — what was tested and what remains unverified.

## Package contents

| Folder/file | Purpose |
| --- | --- |
| source/ | Complete current application, vendored dependencies and hosting configuration |
| history/halo-studio.bundle | Restorable Git repository with all 10 main-branch commits |
| history/commits.txt | Full commit hashes and timestamps |
| docs/ | Developer and product handover |
| tests/ | Portable CPU tests; no browser/GPU claim |
| references/ | All 19 available original user-uploaded artwork/reference screenshots |
| docs/REFERENCE_INDEX.json | Reference filenames, sizes and checksums |
| MANIFEST.sha256 | Checksums for every supplied file except this manifest |

No credentials, account cookies, tokens, or private Git configuration are included. There are no Blender scenes, native CAD assemblies, server code, AI models or original CorelDRAW files: those were never part of the implementation. The original reference demo at auric-bench.vercel.app is a separate project; its source was not supplied and is not in this archive.

## Run portable checks

With Node.js 22+ (tested here on Node 24) and Python 3:

```sh
python tests/verify_snapshot.py
node tests/geometry-regression.mjs
node tests/runtime-smoke.mjs
```

The runtime smoke test mocks browser DOM/canvas and renderer objects; it checks CPU assembly and upload control flow, not image decoding, the native file picker or actual GPU rendering. See VALIDATION.md before interpreting results.
