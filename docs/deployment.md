# Published deployment

- Demo: https://lunar-heuristics-medeeam.quirkybarracuda3.chatgpt.site
- Public source: https://github.com/medeeam/lunar-heuristics
- Hosted with Sites on Cloudflare Workers; no sign-in required.
- Published version: 2, on 15 November 2026.
- Runtime source corresponds to GitHub commit `87cee12` (later documentation-only commits add these links).

## Verification

The public page loaded in an isolated browser context with all three reference comparisons. A live request for latitude −88°, longitude +15°, starting 16 November 2026 for 7 days returned HTTP 200 and 169 paired NASA/JPL samples. No login was required. Thirteen automated tests passed, including a regression for the restricted platform cache.

The first deployment exposed a platform restriction on `caches.default`; version 2 uses a bounded in-memory cache instead. Sun/Earth requests remain sequential per scenario. Memory caching is best-effort and may be reset whenever a worker isolate is retired.

## Build and update

`npm run build` produces a self-contained ES module at `dist/server/index.js`. It embeds the public assets and exports a fetch handler. The Python server remains the local development entry point.

The local hosting checkout is kept separately under ignored `.deployment/lunar-heuristics/`. Its `.openai/hosting.json` identifies the existing Site. Reuse that identity when updating; do not create another Site. Use Sites' source workflow to build, push, package, save and deploy a new version. Never commit hosting credentials or the deployment staging directory to GitHub.

The application does not yet include measured terrain horizons. NASA upstream outages may prevent custom calculations; bundled reference data remains available.
