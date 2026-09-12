"""Model Information API Endpoint.

Safely exposes model architecture, feature descriptions, training dataset metrics,
and feature importances from model_metadata.json.
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.schemas.api import ModelInfoResponse, ErrorResponse

router = APIRouter()


@router.get(
    "/model/info",
    response_model=ModelInfoResponse,
    tags=["AI Model"],
    responses={
        503: {"model": ErrorResponse, "description": "Model metadata or artifact unavailable"},
    },
)
def get_model_info() -> ModelInfoResponse:
    """Retrieve verified ML forecasting model metadata and evaluation metrics."""
    # Resolve metadata path dynamically relative to backend/app/
    app_dir = Path(__file__).resolve().parents[3]
    metadata_path = app_dir / "models" / "model_metadata.json"

    if not metadata_path.is_file():
        raise HTTPException(status_code=503, detail="Model metadata is unavailable.")

    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read model metadata: {str(e)}")

    feature_columns = data.get("feature_columns", [])
    feature_count = len(feature_columns)

    # Sort feature importances in descending order and extract top 5 features
    raw_importances = data.get("feature_importances", {})
    sorted_importances = dict(
        sorted(raw_importances.items(), key=lambda item: item[1], reverse=True)[:5]
    )

    return ModelInfoResponse(
        model_type=data.get("model_type", "Unknown"),
        algorithm=data.get("algorithm", "Unknown"),
        dataset_used=data.get("dataset_used", "Unknown"),
        target_column=data.get("target_column", "Unknown"),
        feature_count=feature_count,
        feature_columns=feature_columns,
        total_records_trained_on=data.get("total_records_trained_on", 0),
        split_ratios=data.get("split_ratios"),
        date_ranges=data.get("date_ranges"),
        metrics=data.get("metrics"),
        top_feature_importances=sorted_importances,
    )
