"""Shared utilities and config loader for the annotation-tooling scripts."""

from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd
from omegaconf import OmegaConf


# Path to the YAML config
_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "settings.yaml"


# =========================
# Dataclasses (schema)
# =========================
@dataclass
class MappingColumnsConfig:
    as_is: list[str] = field(default_factory=list)
    to_be: list[str] = field(default_factory=list)


@dataclass
class MappingConfig:
    file: str = ""
    sheets: list[str] = field(default_factory=list)
    columns: MappingColumnsConfig = field(default_factory=MappingColumnsConfig)
    output: str = ""


@dataclass
class ConversionConfig:
    file: str = ""
    sheets: list[str] = field(default_factory=list)
    column_mapping: dict[str, str] = field(default_factory=dict)  # input_col -> as_is_col
    output: str = ""
    on_missing: str = "blank"  # blank | skip | error


@dataclass
class ApplyMappingConfig:
    excel_in: str = ""
    sheets: list[str] = field(default_factory=list)
    excel_key_columns: list[str] = field(default_factory=list)

    source_json: str = ""
    json_key_columns: list[str] = field(default_factory=list)
    json_value_columns: list[str] = field(default_factory=list)

    excel_target_columns: list[str] = field(default_factory=list)
    excel_out: str = ""
    on_missing: str = "keep"  # keep | blank | error


@dataclass
class Settings:
    mapping: MappingConfig = field(default_factory=MappingConfig)
    conversion: ConversionConfig = field(default_factory=ConversionConfig)
    apply_mapping: ApplyMappingConfig = field(default_factory=ApplyMappingConfig)
    key_delimiter: str = "||"


# =========================
# Load config
# =========================
def load_settings(path: Path = _CONFIG_PATH) -> Settings:
    """
    Load settings.yaml into strongly-typed Settings dataclass.

    Uses OmegaConf structured config so we don't manually index dicts.
    Missing fields fall back to dataclass defaults.
    """
    schema = OmegaConf.structured(Settings)
    raw = OmegaConf.load(path)
    merged = OmegaConf.merge(schema, raw)  # raw overrides defaults
    return OmegaConf.to_object(merged)  # -> Settings


# =========================
# Utilities
# =========================
def safe_str(value: object) -> str:
    """Convert a value to a stripped string; NaN/None become ''."""
    try:
        if pd.isna(value):  # type: ignore[arg-type]
            return ""
    except (TypeError, ValueError):
        pass
    return str(value).strip()


def make_key(row: pd.Series, cols: list[str], delimiter: str = "||") -> str:
    """Build a mapping key from the given columns of a row."""
    return delimiter.join(safe_str(row[c]) for c in cols)


def make_key_from_values(*values: str, delimiter: str = "||") -> str:
    """Build a mapping key from explicit values."""
    return delimiter.join(values)