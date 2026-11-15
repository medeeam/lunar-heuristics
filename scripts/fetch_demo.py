"""Fetch and preserve real, reproducible NASA JPL demonstration data."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import ROOT, SITES, scenario

out = ROOT / "public" / "data"
out.mkdir(parents=True, exist_ok=True)
for site in SITES:
    print(f"Fetching {site['name']}…", flush=True)
    data = scenario(site["lat"], site["lon"], "2026-11-15", 30)
    data["site"] = site
    (out / f"{site['id']}.json").write_text(json.dumps(data))
    print(f"Saved {len(data['samples'])} paired hourly samples", flush=True)
