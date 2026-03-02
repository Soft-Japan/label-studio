"""
Apply LS JSON mapping to Excel (Option A) and overwrite NewName1-4.

Match:
  Excel (NewName1, NewName2, NewName3)
    == JSON (as_is_lv1, as_is_lv2, as_is_lv3)

Overwrite:
  Excel NewName1..4 = JSON to_be_lv1..4

Output: Excel with the same structure as input.
"""

import json
import sys
from pathlib import Path

import pandas as pd

from scripts.config import load_settings, safe_str, make_key_from_values


cfg = load_settings()
acfg = cfg.apply_mapping


def load_ls_json_mapping(
    json_path: str,
    json_key_cols: list[str],
    json_value_cols: list[str],
    delimiter: str,
) -> dict[str, list[str]]:
    """Build dict: key -> [to_be_lv1..4]. Conflicts raise error."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON not found - {json_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: JSON invalid - {e}")
        sys.exit(1)

    df = pd.DataFrame(data)
    required = json_key_cols + json_value_cols
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"Error: JSON missing columns: {missing}")
        sys.exit(1)

    for c in required:
        df[c] = df[c].apply(safe_str)

    # conflict check: same key -> different values
    nunq = df.groupby(json_key_cols, dropna=False)[json_value_cols].nunique()
    ambiguous = nunq[(nunq > 1).any(axis=1)]
    if len(ambiguous) > 0:
        print("Error: JSON has conflicting to_be values for the same as_is key.")
        sys.exit(1)

    df = df.drop_duplicates(subset=json_key_cols, keep="first")

    mapping: dict[str, list[str]] = {}
    for _, row in df.iterrows():
        key_vals = [row[c] for c in json_key_cols]  # already safe_str'ed
        key = make_key_from_values(*key_vals, delimiter=delimiter)
        vals = [row[c] for c in json_value_cols]  # already safe_str'ed
        mapping[key] = vals

    return mapping


def apply_mapping_to_excel() -> None:
    delimiter = cfg.key_delimiter

    excel_in = acfg.excel_in
    excel_out = acfg.excel_out
    sheets = list(acfg.sheets)

    excel_key_cols = list(acfg.excel_key_columns)
    excel_target_cols = list(acfg.excel_target_columns)

    json_path = acfg.source_json
    json_key_cols = list(acfg.json_key_columns)
    json_value_cols = list(acfg.json_value_columns)

    on_missing = str(acfg.on_missing).lower()
    if on_missing not in ("keep", "blank", "error"):
        print("Error: apply_mapping.on_missing must be keep | blank | error")
        sys.exit(1)

    if len(excel_target_cols) != len(json_value_cols):
        print("Error: excel_target_columns and json_value_columns must have the same length/order.")
        sys.exit(1)

    # Load mapping once
    mapping = load_ls_json_mapping(
        json_path=json_path,
        json_key_cols=json_key_cols,
        json_value_cols=json_value_cols,
        delimiter=delimiter,
    )

    try:
        pd.ExcelFile(excel_in)  # validate readable
    except FileNotFoundError:
        print(f"Error: Excel not found - {excel_in}")
        sys.exit(1)

    Path(excel_out).parent.mkdir(parents=True, exist_ok=True)

    total_rows = 0
    missing_rows = 0
    written_any = False

    with pd.ExcelWriter(excel_out, engine="openpyxl") as writer:
        for sheet in sheets:
            try:
                df = pd.read_excel(excel_in, sheet_name=sheet)
            except ValueError as e:
                print(f"Warning: Could not read sheet '{sheet}' — {e}. Skipping.")
                continue

            missing = [c for c in excel_key_cols if c not in df.columns]
            if missing:
                print(f"Warning: Sheet '{sheet}' missing key columns: {missing}. Skipping.")
                continue

            # Ensure targets exist, and force dtype to object so strings can be assigned
            for c in excel_target_cols:
                if c not in df.columns:
                    df[c] = ""
                # IMPORTANT: prevent float64 dtype (from NaNs) causing LossySetitemError
                df[c] = df[c].astype("object")

            # Normalize key cols (string)
            for c in excel_key_cols:
                df[c] = df[c].apply(safe_str)

            # Apply mapping row by row (simple)
            for idx, row in df.iterrows():
                key_vals = [row[c] for c in excel_key_cols]  # already safe_str'ed
                key = make_key_from_values(*key_vals, delimiter=delimiter)
                vals = mapping.get(key)

                if vals is None:
                    missing_rows += 1
                    if on_missing == "error":
                        print(f"Error: Missing mapping for key: {key}")
                        sys.exit(1)
                    if on_missing == "blank":
                        for col in excel_target_cols:
                            df.at[idx, col] = ""
                    # keep => do nothing
                else:
                    for col, v in zip(excel_target_cols, vals):
                        df.at[idx, col] = v

            total_rows += len(df)
            df.to_excel(writer, sheet_name=sheet, index=False)
            written_any = True

    if not written_any:
        print("Error: No sheets were written. Check sheet names and required columns.")
        sys.exit(1)

    print(f"Saved Excel → {excel_out}")
    print(f"Rows processed: {total_rows}")
    if missing_rows:
        print(f"Rows without mapping: {missing_rows} (on_missing={on_missing})")


if __name__ == "__main__":
    apply_mapping_to_excel()
