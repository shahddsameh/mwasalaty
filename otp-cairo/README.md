# OTP Cairo

OpenTripPlanner 2.6.0 instance for Cairo, Egypt, using OpenStreetMap road/walk network and the TfC Digital Cairo 2017 GTFS transit feed.

## Prerequisites

- Docker + Docker Compose v2
- Python 3.8+ (for the date-fix script)
- ~6 GB free disk space

---

## Step 1 — Download Egypt OSM PBF (Geofabrik)

```bash
curl -L -o data/cairo/egypt-latest.osm.pbf \
  https://download.geofabrik.de/africa/egypt-latest.osm.pbf
```

> **Tip:** For faster graph builds during development you can clip to Greater Cairo
> with [osmium-tool](https://osmcode.org/osmium-tool/):
> ```bash
> osmium extract --bbox 30.8,29.7,32.1,30.5 \
>   data/cairo/egypt-latest.osm.pbf \
>   -o data/cairo/cairo-clipped.osm.pbf
> ```
> Then delete `egypt-latest.osm.pbf` so OTP only sees the clipped file.

---

## Step 2 — Download and repackage the TfC Digital Cairo GTFS

The feed lives in the GitHub repo
[transportforcairo/Transit---GCR-Digital-Cairo-2017-](https://github.com/transportforcairo/Transit---GCR-Digital-Cairo-2017-).
The repo root **is** the GTFS — you need to zip its contents yourself.

```bash
# Clone (shallow is fine)
git clone --depth 1 \
  https://github.com/transportforcairo/Transit---GCR-Digital-Cairo-2017-.git \
  /tmp/cairo-gtfs

# Zip only the GTFS text files (no .git, no README)
cd /tmp/cairo-gtfs
zip -j cairo-gtfs.zip \
  agency.txt routes.txt trips.txt stop_times.txt stops.txt \
  calendar.txt calendar_dates.txt shapes.txt feed_info.txt

# Move the zip into the data directory
mv cairo-gtfs.zip /path/to/otp-cairo/data/cairo/cairo-gtfs.zip
```

> Replace `/path/to/otp-cairo` with the absolute path to this repo on your machine.

---

## Step 3 — Fix the expired GTFS dates

The 2017 feed ships with `feed_end_date` in the past, which causes OTP to
reject it. The script patches `feed_info.txt` inside the zip in-place and
leaves a `.bak` backup beside it.

```bash
python scripts/fix_gtfs_dates.py data/cairo/cairo-gtfs.zip
```

Expected output:

```
Backup written to data/cairo/cairo-gtfs.zip.bak
Patched feed_info.txt: set start=20200101, end=20301231
Copied  agency.txt
...
Done. Updated zip saved to data/cairo/cairo-gtfs.zip
```

---

## Step 4 — Build the graph and serve

```bash
docker compose up
```

OTP will:
1. Detect the `.osm.pbf` and `.zip` files in `/var/opentripplanner` (= `./data/cairo`).
2. Build a routing graph (`Graph.obj` + `streetGraph.obj`) — this takes **5–15 minutes**
   the first time depending on your machine.
3. Start the REST + GraphQL API on **http://localhost:8080**.

Open the debug UI at **http://localhost:8080** to verify routing is working.

On subsequent starts the pre-built graph is loaded from disk (much faster).
To force a rebuild, delete `data/cairo/Graph.obj` and re-run `docker compose up`.

---

## Directory layout after setup

```
otp-cairo/
├── docker-compose.yml
├── data/cairo/
│   ├── egypt-latest.osm.pbf   (or cairo-clipped.osm.pbf)
│   ├── cairo-gtfs.zip
│   ├── cairo-gtfs.zip.bak     (created by fix script)
│   ├── Graph.obj              (created by OTP on first run)
│   └── streetGraph.obj        (created by OTP on first run)
├── scripts/
│   └── fix_gtfs_dates.py
└── README.md
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| OTP exits immediately | Not enough memory | Increase `-Xmx4G` in `docker-compose.yml` |
| "No transit data" in planner | GTFS zip not found or still expired | Re-run `fix_gtfs_dates.py`; confirm zip is in `data/cairo/` |
| Very slow graph build | Full Egypt PBF | Clip to Cairo bounding box (see Step 1 tip) |
| Port 8080 already in use | Another service on 8080 | Change host port: `"8081:8080"` in `docker-compose.yml` |
