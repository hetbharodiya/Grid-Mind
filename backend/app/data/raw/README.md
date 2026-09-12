# Raw Energy Data Directory

## Purpose
This directory is strictly reserved for **original, immutable source data** (e.g. historical electricity load CSVs, weather timeseries).

## Critical Rules
1. **Never modify or overwrite original files** in this directory.
2. The data processing pipeline reads from this directory, validates schema and integrity, and writes clean standardized outputs into `backend/app/data/processed/`.
3. Datasets placed here may use external column naming conventions; configure a `ColumnMapping` in the preprocessor service accordingly.

## Usage
Place your historical electricity consumption dataset (CSV format) directly into this folder.
The data architecture will inspect its columns, datetime formats, and value distributions automatically without hardcoded assumptions.
