"""Local, dependency-free Horizons proxy and static application server."""
import argparse
import csv
import hashlib
import io
import json
import math
import subprocess
import threading
from datetime import date, timedelta, datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode, urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
LOCK = threading.Lock()
SITES = [
    {"id": "polar-a", "name": "Polar site A", "lat": -89.5, "lon": 0, "note": "Near-pole reference · 0° E"},
    {"id": "polar-b", "name": "Polar site B", "lat": -85, "lon": 30, "note": "Southern reference · 30° E"},
    {"id": "equator", "name": "Equatorial reference", "lat": 0, "lon": 0, "note": "Near-side reference · 0° E"},
]

def validate(lat, lon, start, days):
    lat, lon, days = float(lat), float(lon), int(days)
    if not math.isfinite(lat) or not math.isfinite(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
        raise ValueError("Latitude must be −90…90° and longitude −180…180°.")
    begin = date.fromisoformat(start)
    if not 2000 <= begin.year <= 2100 or days not in (7, 14, 30):
        raise ValueError("Choose a date from 2000–2100 and a 7, 14, or 30 day window.")
    return lat, lon, begin, days

def parse_horizons(payload):
    if payload.get("error"):
        raise ValueError("Horizons could not calculate this scenario.")
    raw = payload.get("result", "")
    if "$$SOE" not in raw or "$$EOE" not in raw:
        raise ValueError("Horizons returned no ephemeris table.")
    rows = []
    for row in csv.reader(io.StringIO(raw.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip())):
        jd, az, el = float(row[0]), float(row[3]), float(row[4])
        if not all(math.isfinite(x) for x in (jd, az, el)) or not 0 <= az <= 360 or not -90 <= el <= 90:
            raise ValueError("Invalid ephemeris values.")
        rows.append({"time": round((jd - 2440587.5) * 86400000), "az": az, "el": el})
    if len(rows) < 2 or any(b["time"] <= a["time"] for a, b in zip(rows, rows[1:])):
        raise ValueError("Incomplete ephemeris table.")
    return rows

def fetch_body(body, lat, lon, begin, days):
    params = {"format": "json", "COMMAND": str(body), "OBJ_DATA": "NO", "MAKE_EPHEM": "YES",
              "EPHEM_TYPE": "OBSERVER", "CENTER": "coord@301", "COORD_TYPE": "GEODETIC",
              "SITE_COORD": f"{lon},{lat},0", "START_TIME": begin.isoformat(),
              "STOP_TIME": (begin + timedelta(days=days)).isoformat(), "STEP_SIZE": "1 h",
              "QUANTITIES": "4", "CSV_FORMAT": "YES", "CAL_FORMAT": "JD", "APPARENT": "AIRLESS"}
    url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urlencode({k: v if k == "format" else f"'{v}'" for k, v in params.items()})
    result = subprocess.run(["curl", "--silent", "--show-error", "--fail", "--max-time", "40", url], capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError("NASA JPL is unreachable. Try again or open the bundled demo.")
    payload = json.loads(result.stdout)
    return parse_horizons(payload), {"url": url, "parameters": params, "raw": payload["result"]}

def scenario(lat, lon, start, days):
    lat, lon, begin, days = validate(lat, lon, start, days)
    key = hashlib.sha256(f"{lat},{lon},{begin},{days}".encode()).hexdigest()
    cache = ROOT / ".cache" / f"{key}.json"
    with LOCK:  # JPL requests are deliberately serialized.
        if cache.exists():
            return json.loads(cache.read_text())
        sun, sun_source = fetch_body(10, lat, lon, begin, days)
        earth, earth_source = fetch_body(399, lat, lon, begin, days)
        if len(sun) != len(earth) or any(s["time"] != e["time"] for s, e in zip(sun, earth)):
            raise ValueError("Sun and Earth sample times do not match.")
        expected = days * 24 + 1
        if len(sun) != expected:
            raise ValueError("Horizons returned an incomplete time window.")
        data = {"lat": lat, "lon": lon, "start": begin.isoformat(), "days": days,
                "retrievedAt": datetime.now(timezone.utc).isoformat(), "source": "NASA/JPL Horizons",
                "stepMinutes": 60, "altitudeKm": 0, "terrain": False,
                "samples": [{"time": s["time"], "sunAz": s["az"], "sunEl": s["el"], "earthAz": e["az"], "earthEl": e["el"]} for s, e in zip(sun, earth)],
                "provenance": {"sun": sun_source, "earth": earth_source}}
        cache.parent.mkdir(exist_ok=True)
        cache.write_text(json.dumps(data))
        return data

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "public"), **kwargs)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path != "/api/scenario":
            return super().do_GET()
        query = parse_qs(url.query)
        try:
            data = scenario(query["lat"][0], query["lon"][0], query["start"][0], query["days"][0])
            self.respond(200, data)
        except (ValueError, KeyError) as exc:
            self.respond(400, {"error": str(exc)})
        except Exception:
            self.respond(502, {"error": "Could not reach NASA JPL. Retry, or use the bundled demo dates."})

    def respond(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    print(f"Lunar Heuristics → http://localhost:{args.port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
