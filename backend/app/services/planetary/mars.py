from app.services.mola import get_mars_elevation

from app.services.planetary.base import (
    ElevationSample,
    PlanetaryDataProvider,
)


class MarsDataProvider(PlanetaryDataProvider):
    planetary_body = "mars"

    def sample(
        self,
        latitude: float,
        longitude: float,
    ) -> ElevationSample:

        self.validate_geographic_coordinates(
            latitude,
            longitude,
        )

        result = get_mars_elevation(
            latitude=latitude,
            longitude=longitude,
        )

        elevation = result.get("elevation_m")

        return ElevationSample(
            planetary_body=self.planetary_body,
            latitude=latitude,
            longitude=longitude,
            elevation_m=elevation,
            available=elevation is not None,
            coordinate_system="geographic",
            dataset=result.get("dataset", "MOLA MEGDR"),
            source=result.get(
                "source",
                "NASA Planetary Data System",
            ),
            resolution=result.get("resolution"),
            message=result.get("message"),
        )
