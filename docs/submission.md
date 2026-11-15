# Lunar Heuristics — submission draft

## Short summary

Lunar Heuristics turns NASA/JPL ephemerides into an interactive comparison of lunar lighting and Earth visibility. Choose a location and date, move through time, and compare how long the Sun and Earth remain above the horizon together. It helps explain why a small change in location, schedule, or horizon clearance can change a mission's operating opportunities.

## Problem

Lunar site selection involves a trade-off between scientific interest, solar access, and communication. Raw ephemerides can describe the environment precisely, but they are difficult to compare quickly. The south pole makes this especially challenging because shallow elevation angles make local horizons consequential.

## Our solution

We built a browser-based scenario explorer with a dependency-free Python data service. The interface brings site coordinates, date selection, a local-sky diagram, an elevation timeline, and a comparison table into one workflow. Users can scrub time, explore a uniform horizon obstruction, inspect joint visibility windows, and export the numerical results.

## NASA data used

The application uses actual NASA/JPL Horizons observer ephemerides for the Sun and Earth, as viewed from user-selected coordinates on the Moon. Each result preserves its original API parameters and raw source response. Three illustrative coordinate sets have a bundled 30-day dataset for a reliable offline demonstration. Custom coordinates and dates query Horizons through the local service.

## What makes the approach useful

The comparison uses identical dates and visibility assumptions for every location. It highlights simultaneous sunlight and Earth visibility, rather than leaving the user to reconcile separate outputs. A clearance sensitivity control demonstrates how marginal visibility changes when the horizon is raised. Explicit provenance and visible limitations make the analysis inspectable.

## Current limitations and next steps

This prototype uses a geometric reference-surface horizon and hourly sampling. It does not yet ingest LOLA terrain, model disk/limb effects or eclipses, compute electrical power, or assess a radio link budget. The next step is to derive azimuth-dependent horizons from LOLA elevation data, increase temporal resolution around crossings, and validate results with an independent SPICE implementation. The current product is for exploration and education, not flight operations.

## Technology and assistance

Python standard library, curl, JavaScript ES modules, HTML, CSS and SVG. No proprietary API key or frontend package installation is required. OpenAI Codex assisted with research, implementation, documentation and tests. The team should review the final scientific claims and credit all contributions accurately.

## 90-second demonstration script

1. **0–15 seconds:** “At the lunar south pole, seeing the Sun and seeing Earth are two different constraints. Lunar Heuristics makes that trade-off visible.”
2. **15–35 seconds:** Show Polar site A, explain the real JPL source, and scrub the timeline. Point to the two elevation values and the geometric horizon.
3. **35–50 seconds:** Raise clearance from 0° to 2°. Explain that this is a sensitivity experiment, not measured terrain. Show the changed joint windows.
4. **50–70 seconds:** Compare the reference sites and open the equatorial reference. Explain that the same date window makes the trade-offs comparable.
5. **70–85 seconds:** Download a CSV and open the methodology/provenance section. State the terrain and hourly-sampling limitations.
6. **85–90 seconds:** “Our next step is adding LOLA-derived terrain horizons so local topography becomes part of every comparison.”

## Before final submission

- Add the public source repository URL and a reachable demo URL (neither has been published yet).
- Record a short demo and add its link if the submission form requests one.
- Review the narrative against the final implementation and list actual team contributions.
- Cite JPL Horizons, the official challenge, and AI assistance; do not claim ingestion of LOLA or Moon Trek data.
- Review the official submission fields and requirements before submitting.

Source links are listed in README.md. This draft has not been posted to the Space Apps website.
