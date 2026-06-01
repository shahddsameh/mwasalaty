#!/usr/bin/env python3
"""
Patch expired GTFS dates so OTP 2.x accepts the feed.

Patched files:
  feed_info.txt  — feed_start_date / feed_end_date
  calendar.txt   — start_date / end_date  (all rows)

Dates are shifted to 2025-01-01 / 2030-12-31 so they fall inside OTP's
default transit service window without requiring a custom build-config.json.

Usage:
    python fix_gtfs_dates.py <path/to/gtfs.zip>

The original zip is overwritten in-place; a .bak copy is kept beside it.
"""

import csv
import io
import shutil
import sys
import zipfile
from pathlib import Path

NEW_START = "20250101"
NEW_END   = "20301231"


def patch_csv(content: str, column_replacements: dict) -> str:
    """Return CSV text with specific columns replaced by fixed values."""
    reader = csv.DictReader(io.StringIO(content))
    if reader.fieldnames is None:
        return content

    rows = list(reader)
    for row in rows:
        for col, val in column_replacements.items():
            if col in row:
                row[col] = val

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return out.getvalue()


PATCHES = {
    "feed_info.txt": {
        "feed_start_date": NEW_START,
        "feed_end_date":   NEW_END,
    },
    "calendar.txt": {
        "start_date": NEW_START,
        "end_date":   NEW_END,
    },
}


def fix_gtfs_zip(zip_path: Path) -> None:
    backup = zip_path.with_suffix(".zip.bak")
    shutil.copy2(zip_path, backup)
    print(f"Backup  -> {backup}")

    tmp_path = zip_path.with_suffix(".zip.tmp")

    with zipfile.ZipFile(zip_path, "r") as zin, \
         zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:

        for item in zin.infolist():
            fname = item.filename
            data = zin.read(fname)

            if fname in PATCHES:
                original = data.decode("utf-8-sig")
                patched  = patch_csv(original, PATCHES[fname])
                data     = patched.encode("utf-8")
                cols     = ", ".join(f"{k}={v}" for k, v in PATCHES[fname].items())
                print(f"Patched {fname}: {cols}")
            else:
                print(f"Copied  {fname}")

            zout.writestr(item, data)

    tmp_path.replace(zip_path)
    print(f"\nDone. Updated zip -> {zip_path}")


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <path/to/gtfs.zip>", file=sys.stderr)
        sys.exit(1)

    zip_path = Path(sys.argv[1])
    if not zip_path.exists():
        print(f"Error: file not found: {zip_path}", file=sys.stderr)
        sys.exit(1)
    if not zipfile.is_zipfile(zip_path):
        print(f"Error: not a valid zip file: {zip_path}", file=sys.stderr)
        sys.exit(1)

    fix_gtfs_zip(zip_path)


if __name__ == "__main__":
    main()
