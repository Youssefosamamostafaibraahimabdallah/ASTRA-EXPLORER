from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
import math
from typing import Optional


@dataclass(frozen=True)
class ElevationSample:
    planetary_body: str
    elevation_m: Optional[float]
    available: bool
    dataset: str
    source: str

    # Geographic coordinates
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Projected coordinates
    x: Optional[float] = None
    y: Optional[float] = None

    coordinate_system: str = "geographic"
    crs: Optional[str] = None
    resolution: Optional[str] = None
    message: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


class PlanetaryDataProvider(ABC):
    """
    Common interface for planetary elevation providers.

    Providers may use geographic or projected coordinates.
    """

    planetary_body: str

    @staticmethod
    def validate_geographic_coordinates(
        latitude: float,
        longitude: float,
    ) -> None:

        if not math.isfinite(latitude) or not math.isfinite(longitude):
            raise ValueError("Coordinates must be finite numbers.")

        if not -90 <= latitude <= 90:
            raise ValueError("Latitude must be between -90 and 90.")

        if not -180 <= longitude <= 180:
            raise ValueError("Longitude must be between -180 and 180.")

    @staticmethod
    def validate_projected_coordinates(
        x: float,
        y: float,
    ) -> None:

        if not math.isfinite(x) or not math.isfinite(y):
            raise ValueError("Projected coordinates must be finite numbers.")

    @abstractmethod
    def sample(self, **coordinates) -> ElevationSample:
        """Retrieve an elevation sample using the provider's coordinate system."""
        raise NotImplementedError
