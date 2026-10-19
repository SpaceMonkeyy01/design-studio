# Halo Studio

Browser 3D visualizer for halo-lit channel letters. Logo in, 3D sign out (exploded/inside views, finishes, LED colours, 4K export). Free and static: no backend, no API keys.

```sh
npm start          # http://127.0.0.1:8080
npm test           # CPU tests
npm run test:visual  # real-browser render + timing (after: npm install && npx playwright install chromium)
```

- `dist/`: the app (edit here)
- `tests/`: CPU regression, mocked runtime, visual smoke; `tests/fixtures/` holds test logos
- `docs/handover/`: original ChatGPT handover docs (architecture, requirements, optimisation plan)
- `references/`: the original requester's reference screenshots
- `CLAUDE.md`: architecture diagram, hard requirements, backlog
