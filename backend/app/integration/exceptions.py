"""Domain-Specific Exceptions for Forecast and Dispatch Integration.

Provides clear, actionable exceptions for the integration layer without
leaking low-level solver or modeling details.
"""


class IntegrationError(Exception):
    """Base exception for all integration and orchestration failures."""
    pass


class InsufficientHistoryError(IntegrationError):
    """Raised when historical demand buffer contains fewer than 168 hours required by ML forecaster."""
    pass


class ForecastingPipelineError(IntegrationError):
    """Raised when ML feature extraction or model inference fails."""
    pass


class OptimizationDispatchError(IntegrationError):
    """Raised when the PuLP optimization solver fails or produces an invalid state."""
    pass
