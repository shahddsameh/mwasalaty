"""
Snaps GTFS stop coordinates to the nearest walkable OSM highway node.

Why: The 2018 GTFS stop positions no longer align with the current OSM
street network. OTP links each stop to the nearest street edge, but many
2018 coordinates land on small disconnected fragments that get pruned,
leaving 524 stops unreachable by walking. Snapping each stop to an actual
OSM highway node guarantees OTP can link it to the main walkable graph.

Usage:
    pip install osmium scipy numpy
    python snap_stops_to_streets.py
    docker-compose restart   (rebuilds the OTP graph)
"""

import osmium
import zipfile
import csv
import io
import os
import numpy as np
from scipy.spatial import KDTree

OSM_PATH  = os.path.join(os.path.dirname(__file__), '..', 'data', 'cairo', 'cairo.osm.pbf')
GTFS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'cairo', 'cairo-gtfs.zip')
OSM_PATH  = os.path.normpath(OSM_PATH)
GTFS_PATH = os.path.normpath(GTFS_PATH)

MAX_SNAP_DISTANCE_M = 300   # skip snapping if nearest node is farther than this

# Highway types OTP treats as walkable by default
WALKABLE_HIGHWAY = {
    'pedestrian', 'footway', 'path', 'steps', 'living_street',
    'residential', 'service', 'unclassified',
    'primary', 'secondary', 'tertiary',
    'primary_link', 'secondary_link', 'tertiary_link',
    'trunk', 'trunk_link',
    'track', 'road', 'construction',
}


class WalkableNodeCollector(osmium.SimpleHandler):
    """Two-pass collector: first builds node-id → coords, then collects
    node IDs that belong to walkable ways (foot != no/private)."""

    def __init__(self):
        super().__init__()
        self.walkable_ids: set[int] = set()

    def way(self, w):
        hw = w.tags.get('highway', '')
        if hw not in WALKABLE_HIGHWAY:
            return
        if w.tags.get('foot') in ('no', 'private'):
            return
        if w.tags.get('access') in ('no', 'private'):
            return
        for ref in w.nodes:
            self.walkable_ids.add(ref.ref)


class NodeCoordCollector(osmium.SimpleHandler):
    def __init__(self, keep_ids: set[int]):
        super().__init__()
        self.keep = keep_ids
        self.coords: list[tuple[float, float]] = []   # (lat, lon)

    def node(self, n):
        if n.id in self.keep:
            self.coords.append((n.location.lat, n.location.lon))


def build_metric_tree(lat_lon_list, lat_ref, lon_ref):
    """Project (lat, lon) to approximate metres around a reference point."""
    R = 6_371_000.0
    cos_lat = np.cos(np.radians(lat_ref))
    arr = np.array(lat_lon_list, dtype=np.float64)
    metric = np.column_stack([
        np.radians(arr[:, 0] - lat_ref) * R,
        np.radians(arr[:, 1] - lon_ref) * R * cos_lat,
    ])
    return KDTree(metric), arr, lat_ref, lon_ref, R, cos_lat


def to_metric(lat, lon, lat_ref, lon_ref, R, cos_lat):
    mx = np.radians(lat - lat_ref) * R
    my = np.radians(lon - lon_ref) * R * cos_lat
    return mx, my


def main():
    # ── 1. Collect walkable node IDs from OSM ways ──────────────────────
    print("Pass 1: scanning OSM ways for walkable node IDs…")
    way_handler = WalkableNodeCollector()
    way_handler.apply_file(OSM_PATH)
    print(f"  {len(way_handler.walkable_ids):,} walkable node IDs found")

    # ── 2. Collect coordinates for those node IDs ────────────────────────
    print("Pass 2: reading node coordinates…")
    node_handler = NodeCoordCollector(way_handler.walkable_ids)
    node_handler.apply_file(OSM_PATH, locations=True)
    coords = node_handler.coords
    print(f"  {len(coords):,} walkable nodes with coordinates")

    if not coords:
        print("ERROR: no walkable nodes found — check OSM file path")
        return

    # ── 3. Build KD-tree in metric space ────────────────────────────────
    lat_ref = np.mean([c[0] for c in coords])
    lon_ref = np.mean([c[1] for c in coords])
    tree, coord_arr, lat_ref, lon_ref, R, cos_lat = build_metric_tree(
        coords, lat_ref, lon_ref
    )

    # ── 4. Read GTFS stops ───────────────────────────────────────────────
    print("Reading GTFS…")
    with zipfile.ZipFile(GTFS_PATH, 'r') as zin:
        entries = {name: zin.read(name) for name in zin.namelist()}

    stops_text = entries['stops.txt'].decode('utf-8-sig')
    reader    = csv.DictReader(io.StringIO(stops_text))
    fieldnames = reader.fieldnames
    rows = list(reader)

    # ── 5. Snap each stop ────────────────────────────────────────────────
    snapped = skipped = 0
    for row in rows:
        try:
            lat = float(row['stop_lat'])
            lon = float(row['stop_lon'])
        except (ValueError, KeyError):
            skipped += 1
            continue

        mx, my = to_metric(lat, lon, lat_ref, lon_ref, R, cos_lat)
        dist_m, idx = tree.query([mx, my])

        if dist_m > MAX_SNAP_DISTANCE_M:
            skipped += 1
            continue

        new_lat, new_lon = coord_arr[idx]
        row['stop_lat'] = f"{new_lat:.7f}"
        row['stop_lon'] = f"{new_lon:.7f}"
        snapped += 1

    print(f"  Snapped {snapped} stops  |  skipped {skipped} (no walkable node within {MAX_SNAP_DISTANCE_M}m)")

    # ── 6. Write updated GTFS ────────────────────────────────────────────
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    entries['stops.txt'] = buf.getvalue().encode('utf-8')

    tmp = GTFS_PATH + '.snap.tmp'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name, data in entries.items():
            zout.writestr(name, data)
    os.replace(tmp, GTFS_PATH)

    print(f"Saved updated GTFS -> {GTFS_PATH}")
    print("Next: cd otp-cairo && docker-compose restart")


if __name__ == '__main__':
    main()
