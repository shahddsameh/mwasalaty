"""
Adds frequencies.txt to cairo-gtfs.zip so metro and bus lines
repeat throughout the day instead of running at one or two fixed times.

Metro lines: every 5 minutes, 05:00-24:00
Bus lines:   every 15 minutes, 06:00-22:00 (using the 06:30 base trip)
"""
import zipfile
import csv
import io
import os

GTFS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'cairo', 'cairo-gtfs.zip')
GTFS_PATH = os.path.normpath(GTFS_PATH)

METRO_FREQUENCIES = [
    ("T_L1_N", "05:00:00", "24:00:00", 300),
    ("T_L1_S", "05:00:00", "24:00:00", 300),
    ("T_L2_N", "05:00:00", "24:00:00", 300),
    ("T_L2_S", "05:00:00", "24:00:00", 300),
    ("T_L3_E", "05:00:00", "24:00:00", 300),
    ("T_L3_W", "05:00:00", "24:00:00", 300),
]


def get_bus_trip_ids(z):
    routes = {r['route_id']: r for r in csv.DictReader(io.TextIOWrapper(z.open('routes.txt')))}
    trips = list(csv.DictReader(io.TextIOWrapper(z.open('trips.txt'))))
    return [
        t['trip_id'] for t in trips
        if routes.get(t['route_id'], {}).get('route_type') == '3'
        and '06-30' in t['trip_id']
    ]


def build_frequencies_csv(bus_trip_ids):
    rows = [("trip_id", "start_time", "end_time", "headway_secs", "exact_times")]
    for trip_id, start, end, headway in METRO_FREQUENCIES:
        rows.append((trip_id, start, end, headway, 0))
    for trip_id in bus_trip_ids:
        rows.append((trip_id, "06:00:00", "22:00:00", 900, 0))

    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerows(rows)
    return out.getvalue().encode("utf-8")


def main():
    with zipfile.ZipFile(GTFS_PATH, 'r') as zin:
        entries = {name: zin.read(name) for name in zin.namelist()}
        bus_trip_ids = get_bus_trip_ids(zin)

    entries['frequencies.txt'] = build_frequencies_csv(bus_trip_ids)

    tmp_path = GTFS_PATH + '.tmp'
    with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name, data in entries.items():
            zout.writestr(name, data)

    os.replace(tmp_path, GTFS_PATH)
    print(f"Done. frequencies.txt updated in {GTFS_PATH}")
    print(f"Metro: 6 lines every 5 min, 05:00-24:00")
    print(f"Bus:   {len(bus_trip_ids)} routes every 15 min, 06:00-22:00")
    print("Restart OTP to rebuild the graph: docker-compose restart")


if __name__ == '__main__':
    main()
