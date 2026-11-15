# Published deployment

- Demo: https://lunar-heuristics.vercel.app
- Public source: https://github.com/medeeam/lunar-heuristics
- Hosted on Vercel; no sign-in required.
- Verified on 15 November 2026, with runtime source at commit `a753841`.

## Verification

The production page loaded in an isolated browser context with all three reference comparisons. A live request for latitude −88°, longitude +15°, starting 16 November 2026 for 7 days returned HTTP 200 and 169 paired NASA/JPL samples. No login was required. Fourteen automated tests passed before deployment, including the Vercel adapter and bounded-cache regression.

## Build and update

Vercel imports `medeeam/lunar-heuristics` and deploys the `main` branch. The project uses the Other framework preset. `vercel.json` sets `npm run build` as the build command and `public` as the output directory.

The build produces `dist/server/index.js`, a self-contained fetch handler. `api/scenario.js` exposes the live endpoint as a Vercel Node function with a 60-second maximum duration. The Python server remains the local development entry point.

Sun/Earth requests are sequential per scenario. Successful queries use a bounded, best-effort memory cache and a 24-hour browser cache policy. Runtime restarts may reset the memory cache. No API keys or environment secrets are required. Never commit hosting credentials.

The application does not yet include measured terrain horizons. NASA upstream outages may prevent custom calculations; bundled reference data remains available.
