"""Convert an Excel file into Label Studio JSON using a pre-built mapping.

Real-world Excel files may have different column names than the mapping.
The ``column_mapping`` in settings.yaml translates input columns to the
standard AS-IS names so they can be looked up in the mapping JSON
(produced by build_mapping.py).

Usage:
    PYTHONPATH=. python scripts/excel_to_labelstudio_json.py
    PYTHONPATH=. python scripts/excel_to_labelstudio_json.py --on-missing skip
    PYTHONPATH=. python scripts/excel_to_labelstudio_json.py --file data/raw/other.xlsx
"""

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

from scripts.config import load_settings, make_key_from_values, safe_str

# Load settings from config/settings.yaml
cfg = load_settings()
ccfg = cfg.conversion  # shorthand for the conversion section

ON_MISSING_CHOICES = ("blank", "skip", "error")

def convert_excel_to_json(
    file_path: str = ccfg.file,
    sheets: list[str] | None = None,
    mapping_path: str = cfg.mapping.output,
    output_path: str = ccfg.output,
    on_missing: str = ccfg.on_missing,
) -> None:
    """
    Read Excel, enrich with mapping, and write Label Studio JSON.
    Args:
        file_path: Path to the input Excel file.
        sheets: List of sheet names to process; if None, defaults to config.
        mapping_path: Path to the mapping JSON file.
        output_path: Path to write the output JSON file.
        on_missing: Strategy when a row has no mapping (blank | skip | error).
    """
    if sheets is None:
        sheets = list(ccfg.sheets)

    # input_col → standard as_is name  (e.g. NewName1 → as_is_lv1)
    col_map = ccfg.column_mapping
    input_cols = list(col_map.keys())       # columns in the Excel file
    as_is_names = list(col_map.values())    # standard names in the mapping key

    to_be = cfg.mapping.columns.to_be
    columns_out = as_is_names + to_be
    delimiter = cfg.key_delimiter

    # Load mapping 
    try:
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping: dict[str, dict[str, str]] = json.load(f)
    except FileNotFoundError:
        print(f"Error: Mapping file not found — {mapping_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Mapping file is not valid JSON — {e}")
        sys.exit(1)

    all_tasks: list[dict] = []
    missing_count = 0

    for sheet in sheets:
        try:
            df = pd.read_excel(file_path, sheet_name=sheet)
        except FileNotFoundError:
            print(f"Error: File not found — {file_path}")
            sys.exit(1)
        except ValueError as e:
            print(f"Error: Could not read sheet '{sheet}' — {e}")
            continue

        missing_cols = [c for c in input_cols if c not in df.columns]
        if missing_cols:
            print(f"Warning: Sheet '{sheet}' is missing columns: {missing_cols}. Skipping.")
            continue

        for _, row in df.iterrows():
            # Read input columns → translate to standard as_is names
            as_is_values = {
                col_map[in_col]: safe_str(row[in_col]) for in_col in input_cols
            }
            k = make_key_from_values(*as_is_values.values(), delimiter=delimiter)

            to_be_match = mapping.get(k)

            if to_be_match is None:
                missing_count += 1
                if on_missing == "skip":
                    continue
                if on_missing == "error":
                    print(f"Error: Missing mapping for key: {k}")
                    sys.exit(1)
                to_be_values = {c: "" for c in to_be}
            else:
                to_be_values = {c: safe_str(to_be_match.get(c, "")) for c in to_be}

            data = {**as_is_values, **to_be_values}
            task = {"data": {col: data[col] for col in columns_out}}
            all_tasks.append(task)

    if not all_tasks:
        print("No data found. Output file was not created.")
        sys.exit(1)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_tasks, f, ensure_ascii=False, indent=2)

    print(f"Converted {len(all_tasks)} tasks → {output_path}")
    if missing_count:
        print(f"Warning: {missing_count} rows had no mapping (on_missing={on_missing}).")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Excel → Label Studio JSON using a mapping file.",
    )
    parser.add_argument("--file", default=ccfg.file, help="Path to the Excel file.")
    parser.add_argument("--sheets", nargs="+", default=ccfg.sheets, help="Sheet names to read.")
    parser.add_argument("--mapping", default=cfg.mapping.output, help="Path to the mapping JSON.")
    parser.add_argument("--output", default=ccfg.output, help="Output JSON path.")
    parser.add_argument(
        "--on-missing",
        choices=ON_MISSING_CHOICES,
        default=ccfg.on_missing,
        help="Strategy when a row has no mapping (default: blank).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    convert_excel_to_json(
        file_path=args.file,
        sheets=args.sheets,
        mapping_path=args.mapping,
        output_path=args.output,
        on_missing=args.on_missing,
    )
