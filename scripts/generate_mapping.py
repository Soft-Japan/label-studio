"""Build an AS-IS → TO-BE mapping JSON from a gold-standard Excel file.

The gold Excel must contain both AS-IS and TO-BE columns on each sheet.
The output is a JSON dict keyed by a delimited AS-IS string, with TO-BE
values as the dict value.  This mapping is later consumed by
excel_to_labelstudio_json.py to enrich real-world data that only has
AS-IS columns.

Usage:
    PYTHONPATH=. python scripts/build_mapping.py
    PYTHONPATH=. python scripts/build_mapping.py --file data/raw/other.xlsx --sheets S1 S2
"""

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

from scripts.config import load_settings, make_key, safe_str

# Load settings from config/settings.yaml
cfg = load_settings()
mcfg = cfg.mapping  # shorthand for the mapping section


def build_mapping_json(
    file_path: str = mcfg.file,
    sheets: list[str] | None = None,
    output_path: str = mcfg.output,
) -> None:
    """
    Read the gold Excel and write a mapping JSON file.
    Args:
        file_path: Path to the gold Excel file.
        sheets: List of sheet names to process; if None, defaults to config.
        output_path: Path to write the output mapping JSON file.
    """
    if sheets is None:
        sheets = list(mcfg.sheets)

    as_is = mcfg.columns.as_is
    to_be = mcfg.columns.to_be
    delimiter = cfg.key_delimiter

    mapping: dict[str, dict[str, str]] = {}
    conflicts: list[dict] = []

    for sheet in sheets:
        try:
            df = pd.read_excel(file_path, sheet_name=sheet)
        except FileNotFoundError:
            print(f"Error: File not found — {file_path}")
            sys.exit(1)
        except ValueError as e:
            print(f"Error: Could not read sheet '{sheet}' — {e}")
            continue

        missing_cols = [c for c in (as_is + to_be) if c not in df.columns]
        if missing_cols:
            print(f"Warning: Sheet '{sheet}' is missing columns: {missing_cols}. Skipping.")
            continue

        for _, row in df.iterrows():
            k = make_key(row, as_is, delimiter)
            v = {c: safe_str(row[c]) for c in to_be}

            if k in mapping and mapping[k] != v:
                conflicts.append(
                    {
                        "sheet": sheet,
                        "as_is_key": k,
                        "existing_to_be": mapping[k],
                        "new_to_be": v,
                    }
                )
            else:
                mapping[k] = v

    if not mapping:
        print("No mapping data found. Output file was not created.")
        sys.exit(1)

    if conflicts:
        print(f"Error: Found {len(conflicts)} conflicting mappings. Fix the gold Excel.")
        print("Example conflict:")
        print(json.dumps(conflicts[0], ensure_ascii=False, indent=2))
        sys.exit(1)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"Mapping created: {len(mapping)} keys → {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build AS-IS → TO-BE mapping JSON.")
    parser.add_argument("--file", default=mcfg.file, help="Path to the gold Excel file.")
    parser.add_argument("--sheets", nargs="+", default=mcfg.sheets, help="Sheet names to read.")
    parser.add_argument("--output", default=mcfg.output, help="Output mapping JSON path.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    build_mapping_json(
        file_path=args.file,
        sheets=args.sheets,
        output_path=args.output,
    )
