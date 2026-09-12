"""Executable Script to Run Dataset Inspection and Preprocessing Pipeline.

Usage:
    python -m app.services.run_preprocessing
"""

import sys
import time
from pathlib import Path
import pandas as pd

from app.services.data_preprocessor import DataPreprocessor, ColumnMapping


def main():
    backend_dir = Path(__file__).resolve().parent.parent.parent
    raw_dir = backend_dir / "app" / "data" / "raw"
    processed_dir = backend_dir / "app" / "data" / "processed"
    output_file = processed_dir / "processed_energy_demand.csv"

    print("=" * 70)
    print("GRIDMIND AI — PHASE 4 DATASET PREPROCESSING RUNNER")
    print("=" * 70)

    # 1. Locate dataset
    raw_files = [f for f in raw_dir.iterdir() if f.is_file() and not f.name.startswith(".") and f.name != "README.md"]
    if not raw_files:
        print(f"ERROR: No dataset files found in {raw_dir}")
        sys.exit(1)

    dataset_path = raw_files[0]
    print(f"Discovered Dataset: {dataset_path.name}")
    print(f"File Size:          {dataset_path.stat().st_size / (1024 * 1024):.2f} MB")
    print("-" * 70)

    # 2. Inspect Dataset
    print("Step 1: Inspecting dataset structure...")
    report = DataPreprocessor.inspect(dataset_path)
    print(report.summary())
    print("-" * 70)

    # 3. Execute Preprocessing Pipeline
    print("Step 2: Executing full preprocessing pipeline...")
    start_time = time.time()
    
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.process(dataset_path)
    
    elapsed = time.time() - start_time
    print(f"Pipeline executed successfully in {elapsed:.2f} seconds.")
    print("-" * 70)

    # 4. Save Processed Dataset
    print(f"Step 3: Saving processed data to {output_file}...")
    saved_path = preprocessor.save_processed(df_processed, output_file)
    print(f"Saved: {saved_path.name} ({saved_path.stat().st_size / (1024 * 1024):.2f} MB)")
    print("-" * 70)

    # 5. Output Verification Statistics
    print("Step 4: Processed Data Verification Statistics:")
    print(f"  • Total Hourly Records: {len(df_processed):,}")
    print(f"  • Start Timestamp:      {df_processed['timestamp'].min()}")
    print(f"  • End Timestamp:        {df_processed['timestamp'].max()}")
    print(f"  • Missing Values:       {df_processed['energy_demand_kwh'].isna().sum()}")
    print(f"  • Min Demand (kWh):     {df_processed['energy_demand_kwh'].min():.4f}")
    print(f"  • Max Demand (kWh):     {df_processed['energy_demand_kwh'].max():.4f}")
    print(f"  • Mean Demand (kWh):    {df_processed['energy_demand_kwh'].mean():.4f}")
    print(f"  • Std Demand (kWh):     {df_processed['energy_demand_kwh'].std():.4f}")
    print(f"  • Columns:              {list(df_processed.columns)}")
    print("=" * 70)
    print("PHASE 4 DATA PREPROCESSING COMPLETE AND READY FOR ML PHASE 5.")
    print("=" * 70)


if __name__ == "__main__":
    main()
