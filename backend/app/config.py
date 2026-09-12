"""GridMind AI Centralized Configuration Module.

Maintains clean separation between:
1. Application Settings (FastAPI server, CORS, debug modes)
2. Microgrid Asset Defaults (Battery, Diesel, Renewables)
3. Machine Learning Settings (Forecast horizon, random state, split ratios)
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """FastAPI application and environment runtime settings."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "GridMind AI Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v


class MicrogridSettings(BaseSettings):
    """Physical asset baselines and default economic parameters."""
    model_config = SettingsConfigDict(extra="ignore")

    # Battery Energy Storage System (BESS)
    DEFAULT_BATTERY_CAPACITY_KWH: float = 200.0
    DEFAULT_BATTERY_INITIAL_SOC: float = 0.50
    DEFAULT_BATTERY_MIN_SOC: float = 0.20
    DEFAULT_BATTERY_MAX_SOC: float = 0.95
    DEFAULT_BATTERY_MAX_CHARGE_RATE_KW: float = 60.0
    DEFAULT_BATTERY_MAX_DISCHARGE_RATE_KW: float = 60.0
    DEFAULT_BATTERY_EFFICIENCY: float = 0.90
    DEFAULT_BATTERY_DEGRADATION_COST_PER_KWH: float = 0.025

    # Diesel Generator Parameters
    DEFAULT_DIESEL_MAX_GENERATION_KW: float = 75.0
    DEFAULT_DIESEL_MIN_LOAD_RATIO: float = 0.30
    DEFAULT_DIESEL_FUEL_SLOPE: float = 0.24  # Liters per kWh
    DEFAULT_DIESEL_FUEL_INTERCEPT: float = 2.5  # Liters per hour fixed idling
    DEFAULT_DIESEL_COST_PER_LITER: float = 1.65  # USD per Liter
    DEFAULT_DIESEL_CO2_PER_KWH: float = 0.72  # kg CO2 per generated kWh

    # Renewable Energy Specifications
    DEFAULT_SOLAR_CAPACITY_KW: float = 120.0
    DEFAULT_WIND_CAPACITY_KW: float = 60.0
    DEFAULT_SOLAR_COST_PER_KWH: float = 0.00
    DEFAULT_WIND_COST_PER_KWH: float = 0.00


class MLSettings(BaseSettings):
    """Machine Learning pipeline and forecasting configurations."""
    model_config = SettingsConfigDict(extra="ignore")

    FORECAST_HORIZON_HOURS: int = 24
    MODEL_RANDOM_STATE: int = 42
    DEFAULT_TEST_SIZE: float = 0.20
    MIN_HISTORICAL_HOURS: int = 168  # 1 full week minimum required for seasonal features


class Settings:
    """Consolidated settings container for GridMind AI."""
    app: AppSettings = AppSettings()
    microgrid: MicrogridSettings = MicrogridSettings()
    ml: MLSettings = MLSettings()


settings = Settings()
