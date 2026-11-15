# Lunar Heuristics — submission draft

## Published links

- Project demo (seven-slide PDF): https://lunar-heuristics.vercel.app/Lunar-Heuristics.pdf
- Final project: https://lunar-heuristics.vercel.app
- Source code: https://github.com/medeeam/lunar-heuristics

## Short summary

Lunar Heuristics turns NASA/JPL ephemerides into an interactive comparison of lunar lighting and Earth visibility. Choose a location and date, move through time, and compare how long the Sun and Earth remain above the horizon together. It helps explain why a small change in location, schedule, or horizon clearance can change a mission's operating opportunities.

## Problem

Lunar site selection involves a trade-off between scientific interest, solar access, and communication. Raw ephemerides can describe the environment precisely, but they are difficult to compare quickly. The south pole makes this especially challenging because shallow elevation angles make local horizons consequential.

## Our solution

We built a browser-based scenario explorer with a hosted JavaScript API and a dependency-free Python service for local use. The interface brings site coordinates, date selection, a local-sky diagram, an elevation timeline, and a comparison table into one workflow. Users can scrub time, explore a uniform horizon obstruction, inspect joint visibility windows, and export the numerical results.

## NASA data used

The application uses actual NASA/JPL Horizons observer ephemerides for the Sun and Earth, as viewed from user-selected coordinates on the Moon. Each result preserves its original API parameters and raw source response. Three illustrative coordinate sets have a bundled 30-day dataset for a reliable offline demonstration. Custom coordinates and dates query Horizons through the hosted API or local service.

## What makes the approach useful

The comparison uses identical dates and visibility assumptions for every location. It highlights simultaneous sunlight and Earth visibility, rather than leaving the user to reconcile separate outputs. A clearance sensitivity control demonstrates how marginal visibility changes when the horizon is raised. Explicit provenance and visible limitations make the analysis inspectable.

## Current limitations and next steps

This prototype uses a geometric reference-surface horizon and hourly sampling. It does not yet ingest LOLA terrain, model disk/limb effects or eclipses, compute electrical power, or assess a radio link budget. The next step is to derive azimuth-dependent horizons from LOLA elevation data, increase temporal resolution around crossings, and validate results with an independent SPICE implementation. The current product is for exploration and education, not flight operations.

## Technology

Python standard library, curl, JavaScript ES modules, HTML, CSS and SVG. No proprietary API key or frontend package installation is required.

## Seven-slide project demo

Use `docs/presentation/Lunar-Heuristics.pdf` as the slide demo. The editable PowerPoint is `docs/presentation/Lunar-Heuristics.pptx`. The deck has seven slides including the title and sources; no video is needed for this format.

1. Title and purpose
2. The lunar visibility problem
3. Working application screenshot and workflow
4. NASA data and calculation method
5. Site comparison results
6. Benefits, limitations and next steps
7. Team, sources and project links

Host the PDF at a publicly accessible URL and put that URL in the project demo field. The working application URL goes in the separate final-project field.

## Before final submission

- Copy the published source and demo URLs above into the project submission form.
- Publish the seven-slide PDF and add its public URL to the project demo field.
- Review the narrative against the final implementation and list actual team contributions.
- Cite the data and tools required by the competition's submission rules; do not claim ingestion of LOLA or Moon Trek data.
- Review the official submission fields and requirements before submitting.

Source links are listed in README.md. This draft has not been posted to the Space Apps website.
