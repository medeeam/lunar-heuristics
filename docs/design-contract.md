# Lunar Heuristics design contract

Surface: a working mission comparison tool, not a marketing page. Audience: Space Apps judges, educators, and exploratory mission planners. Primary action: select lunar coordinates and an interval, then compare Sun/Earth visibility.

Visual direction: restrained observatory instrument. Ink background, warm white type, solar amber, Earth blue, and mint overlap windows. A panoramic azimuth/elevation diagram is the memorable detail. It is a quantitative sky plot, never fabricated terrain. First screen: site selector, selected date, current angles, and horizon; lower screen: time series and comparison.

Evidence/reference: official challenge requires location/date comparison, Sun/Earth relative to horizon, temporal dynamics, and clear communication of limitations. JPL observer quantity 4 supplies airless topocentric azimuth and elevation. Do not claim NASA affiliation or terrain corrections.

Targets: 1440x900 and 390x844. Mobile stacks controls and visualization; comparison table scrolls inside its container. All controls have labels, visible keyboard focus, 44px minimum interactive targets. SVG charts have text descriptions and metrics offer nonvisual equivalents. Respect reduced motion.

States: loading uses stable panels plus a status message; initial data failure shows retry/demo recovery; partial comparison reports failed sites independently; empty visibility displays no window rather than an invented time; success shows data source and active scenario; permission not applicable (no account required). Inputs are validated before network calls. New results replace the active scenario only after success.
