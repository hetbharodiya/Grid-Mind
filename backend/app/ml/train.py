"""Model Training, Validation, and Serialization Pipeline for Electricity Demand Forecasting.

Usage:
    python -m app.ml.train
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.ml.features import FeaturePipeline


def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculate Mean Absolute Percentage Error (MAPE)."""
    # Guard against zero or near-zero division
    epsilon = 1e-4
    return float(np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, epsilon))) * 100.0)


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Compute standard regression metrics: MAE, RMSE, and MAPE."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    mape = calculate_mape(y_true, y_pred)
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape_pct": round(mape, 2)
    }


def train_pipeline(
    data_path: Path,
    output_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15
) -> Dict[str, Any]:
    """Execute end-to-end ML demand forecasting pipeline with chronological validation."""
    print("=" * 70)
    print("GRIDMIND AI — PHASE 5 MACHINE LEARNING DEMAND TRAINING PIPELINE")
    print("=" * 70)

    # 1. Load Processed Dataset
    print(f"Step 1: Loading processed dataset from {data_path.name}...")
    df_raw = pd.read_csv(data_path)
    print(f"Loaded {len(df_raw):,} hourly records.")
    print(f"Date Range: {df_raw['timestamp'].iloc[0]} to {df_raw['timestamp'].iloc[-1]}")
    print("-" * 70)

    # 2. Feature Engineering
    print("Step 2: Generating features with strict anti-data-leakage shifting...")
    feature_pipe = FeaturePipeline()
    df_features = feature_pipe.transform(df_raw, drop_na=True)
    feature_cols = feature_pipe.get_feature_columns()
    target_col = feature_pipe.TARGET_COL

    print(f"Features created ({len(feature_cols)} total):")
    print(f"  • Calendar: {['hour', 'day_of_week', 'day_of_month', 'month', 'is_weekend']}")
    print(f"  • Cyclical: {['sin_hour', 'cos_hour', 'sin_dow', 'cos_dow', 'sin_month', 'cos_month']}")
    print(f"  • Lags:     {[f'lag_{l}' for l in FeaturePipeline.LAG_HOURS]}")
    print(f"  • Rolling:  {[f'rolling_{stat}_{w}h' for w in FeaturePipeline.ROLLING_WINDOWS for stat in ['mean', 'std', 'max', 'min']]}")
    print(f"Usable records after lag initialization: {len(df_features):,}")
    print("-" * 70)

    # 3. Chronological Train / Validation / Test Split (NO SHUFFLING)
    print("Step 3: Performing strictly chronological train/val/test split...")
    n_total = len(df_features)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)
    n_test = n_total - n_train - n_val

    train_df = df_features.iloc[:n_train]
    val_df = df_features.iloc[n_train:n_train + n_val]
    test_df = df_features.iloc[n_train + n_val:]

    print(f"  • Train Set:      {len(train_df):,} records ({train_ratio*100:.0f}%) | {train_df['timestamp'].iloc[0]} -> {train_df['timestamp'].iloc[-1]}")
    print(f"  • Validation Set: {len(val_df):,} records ({val_ratio*100:.0f}%) | {val_df['timestamp'].iloc[0]} -> {val_df['timestamp'].iloc[-1]}")
    print(f"  • Test Set:       {len(test_df):,} records ({(1-train_ratio-val_ratio)*100:.0f}%) | {test_df['timestamp'].iloc[0]} -> {test_df['timestamp'].iloc[-1]}")
    print("-" * 70)

    X_train, y_train = train_df[feature_cols].values, train_df[target_col].values
    X_val, y_val = val_df[feature_cols].values, val_df[target_col].values
    X_test, y_test = test_df[feature_cols].values, test_df[target_col].values

    # 4. Baselines Evaluation
    print("Step 4: Evaluating Baseline Models...")
    # Baseline 1: Naive (predict lag_1)
    y_pred_naive_val = val_df["lag_1"].values
    y_pred_naive_test = test_df["lag_1"].values
    metrics_naive_val = evaluate_predictions(y_val, y_pred_naive_val)
    metrics_naive_test = evaluate_predictions(y_test, y_pred_naive_test)

    # Baseline 2: Seasonal 24h Persistence (predict lag_24)
    y_pred_s24_val = val_df["lag_24"].values
    y_pred_s24_test = test_df["lag_24"].values
    metrics_s24_val = evaluate_predictions(y_val, y_pred_s24_val)
    metrics_s24_test = evaluate_predictions(y_test, y_pred_s24_test)

    print(f"  [Baseline 1: Naive Lag-1]       Validation: MAE={metrics_naive_val['mae']}, RMSE={metrics_naive_val['rmse']} | Test: MAE={metrics_naive_test['mae']}, RMSE={metrics_naive_test['rmse']}")
    print(f"  [Baseline 2: Seasonal Lag-24]   Validation: MAE={metrics_s24_val['mae']}, RMSE={metrics_s24_val['rmse']} | Test: MAE={metrics_s24_test['mae']}, RMSE={metrics_s24_test['rmse']}")
    print("-" * 70)

    # 5. Train & Compare Machine Learning Models on Validation Set
    print("Step 5: Training and evaluating Candidate ML Models...")
    models = {
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=100,
            max_depth=14,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        ),
        "HistGradientBoostingRegressor": HistGradientBoostingRegressor(
            max_iter=150,
            max_depth=10,
            learning_rate=0.08,
            random_state=42
        )
    }

    model_val_metrics = {}
    fitted_models = {}

    for name, model in models.items():
        t0 = time.time()
        print(f"  Training {name}...")
        model.fit(X_train, y_train)
        train_time = time.time() - t0
        y_val_pred = model.predict(X_val)
        m = evaluate_predictions(y_val, y_val_pred)
        m["training_time_sec"] = round(train_time, 2)
        model_val_metrics[name] = m
        fitted_models[name] = model
        print(f"    Validation Result: MAE={m['mae']}, RMSE={m['rmse']}, MAPE={m['mape_pct']}% (trained in {train_time:.2f}s)")

    # 6. Model Selection
    # Pick model with lowest Validation RMSE
    best_model_name = min(model_val_metrics, key=lambda k: model_val_metrics[k]["rmse"])
    best_model = fitted_models[best_model_name]
    print("-" * 70)
    print(f"Step 6: Model Selection -> Selected '{best_model_name}' based on superior Validation RMSE.")
    print("-" * 70)

    # 7. Final Evaluation on Held-out Test Set
    print("Step 7: Evaluating Selected Model on Held-out Final Test Set...")
    y_test_pred = best_model.predict(X_test)
    metrics_test = evaluate_predictions(y_test, y_test_pred)

    mae_improvement_pct = round(((metrics_s24_test["mae"] - metrics_test["mae"]) / metrics_s24_test["mae"]) * 100, 2)
    rmse_improvement_pct = round(((metrics_s24_test["rmse"] - metrics_test["rmse"]) / metrics_s24_test["rmse"]) * 100, 2)

    print(f"  • Test MAE:  {metrics_test['mae']:.4f} kWh (Baseline Lag-24: {metrics_s24_test['mae']:.4f} kWh -> {mae_improvement_pct}% improvement)")
    print(f"  • Test RMSE: {metrics_test['rmse']:.4f} kWh (Baseline Lag-24: {metrics_s24_test['rmse']:.4f} kWh -> {rmse_improvement_pct}% improvement)")
    print(f"  • Test MAPE: {metrics_test['mape_pct']:.2f}%")
    print("-" * 70)

    # 8. Feature Importance Analysis
    feature_importances = {}
    importances = None
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
    elif "RandomForestRegressor" in fitted_models and hasattr(fitted_models["RandomForestRegressor"], "feature_importances_"):
        importances = fitted_models["RandomForestRegressor"].feature_importances_

    if importances is not None:
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices:
            feature_importances[feature_cols[idx]] = round(float(importances[idx]), 4)

        print("Step 8: Top 10 Most Important Predictive Features:")
        for feat, imp in list(feature_importances.items())[:10]:
            bar = "#" * int(imp * 50)
            print(f"  - {feat:<18}: {imp:.4f} {bar}")
        print("-" * 70)

    # 9. Save Artifacts
    output_dir.mkdir(parents=True, exist_ok=True)
    model_artifact_path = output_dir / "demand_model.joblib"
    metadata_path = output_dir / "model_metadata.json"

    print(f"Step 9: Saving model artifacts to {output_dir}...")
    joblib.dump(best_model, model_artifact_path, compress=3)
    print(f"  • Model saved: {model_artifact_path.name} ({model_artifact_path.stat().st_size / (1024 * 1024):.2f} MB)")

    metadata = {
        "model_type": best_model_name,
        "algorithm": best_model.__class__.__name__,
        "dataset_used": data_path.name,
        "target_column": target_col,
        "feature_columns": feature_cols,
        "total_records_trained_on": len(train_df),
        "split_ratios": {"train": train_ratio, "val": val_ratio, "test": round(1 - train_ratio - val_ratio, 2)},
        "date_ranges": {
            "train": {"start": str(train_df["timestamp"].iloc[0]), "end": str(train_df["timestamp"].iloc[-1])},
            "val": {"start": str(val_df["timestamp"].iloc[0]), "end": str(val_df["timestamp"].iloc[-1])},
            "test": {"start": str(test_df["timestamp"].iloc[0]), "end": str(test_df["timestamp"].iloc[-1])}
        },
        "metrics": {
            "baseline_naive_test": metrics_naive_test,
            "baseline_seasonal24_test": metrics_s24_test,
            "validation_metrics": model_val_metrics[best_model_name],
            "final_test_metrics": metrics_test,
            "mae_improvement_pct_over_baseline": mae_improvement_pct,
            "rmse_improvement_pct_over_baseline": rmse_improvement_pct
        },
        "feature_importances": feature_importances,
        "created_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  • Metadata saved: {metadata_path.name}")
    print("-" * 70)

    # 10. Demonstration 24-Hour Forecast
    print("Step 10: Generating Real 24-Hour Demonstration Forecast on Test Data:")
    demo_slice = test_df.iloc[24:48]
    demo_actual = demo_slice[target_col].values
    demo_preds = best_model.predict(demo_slice[feature_cols].values)
    demo_timestamps = demo_slice["timestamp"].values

    print(f"{'Timestamp':<20} | {'Actual (kWh)':<14} | {'Predicted (kWh)':<16} | {'Abs Error':<10}")
    print("-" * 68)
    for ts, act, pred in zip(demo_timestamps, demo_actual, demo_preds):
        err = abs(act - pred)
        print(f"{str(ts):<20} | {act:<14.4f} | {pred:<16.4f} | {err:<10.4f}")
    print("=" * 70)
    print("PHASE 5 MODEL TRAINING & SERIALIZATION COMPLETED SUCCESSFULLY.")
    print("=" * 70)

    return metadata


def main():
    backend_dir = Path(__file__).resolve().parent.parent.parent
    data_path = backend_dir / "app" / "data" / "processed" / "processed_energy_demand.csv"
    output_dir = backend_dir / "app" / "models"

    train_pipeline(data_path=data_path, output_dir=output_dir)


if __name__ == "__main__":
    main()
