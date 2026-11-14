
from app.services.lunar_dem import (
    inspect_lunar_raster,
    sample_lunar_elevation,
    extract_lunar_elevation_grid,
)

from app.services.lunar_products import analyze_lunar_products

from app.services.analysis.terrain import calculate_terrain_metrics

from app.services.planetary.base import (
    ElevationSample,
    PlanetaryDataProvider,
)


class MoonDataProvider(PlanetaryDataProvider):
    planetary_body = "moon"

    def sample(
        self,
        site: str,
        x: float,
        y: float,
    ) -> ElevationSample:

        self.validate_projected_coordinates(x, y)

        site = site.lower()

        result = sample_lunar_elevation(
            site=site,
            x=x,
            y=y,
        )

        raster_info = inspect_lunar_raster(
            site=site,
            dataset="elevation",
        )

        resolution_values = raster_info["resolution"]

        resolution = (
            f"{abs(resolution_values[0])} x "
            f"{abs(resolution_values[1])} metres per pixel"
        )

        elevation = result.get("elevation_m")

        return ElevationSample(
            planetary_body=self.planetary_body,
            x=x,
            y=y,
            elevation_m=elevation,
            available=result.get("available", False),
            coordinate_system="projected",
            crs=result.get("crs"),
            dataset=result.get(
                "dataset",
                "NASA LOLA elevation",
            ),
            source=result.get(
                "source",
                "NASA Planetary Geosciences Data Archive",
            ),
            resolution=resolution,
            message=result.get("message"),
        )

    def analyze_terrain(
        self,
        site: str,
        x: float,
        y: float,
        radius_pixels: int = 5,
    ) -> dict:
        """
        Analyze lunar terrain using elevation and NASA LOLA
        uncertainty and slope products.

        NASA slope and calculated Horn slope are compared using
        the same valid interior pixels.
        """

        self.validate_projected_coordinates(x, y)

        site = site.lower()

        grid_data = extract_lunar_elevation_grid(
            site=site,
            x=x,
            y=y,
            radius_pixels=radius_pixels,
        )

        resolution_x, resolution_y = grid_data["resolution_m"]

        calculated_metrics = calculate_terrain_metrics(
            elevation_grid=grid_data["grid"],
            cell_size_x_m=abs(resolution_x),
            cell_size_y_m=abs(resolution_y),
        )

        # Keep individual Horn slope values for pixel-by-pixel
        # comparison, but do not expose the temporary grid in
        # the final API response.
        calculated_slope_grid = calculated_metrics.pop(
            "slope_grid_degrees"
        )

        nasa_products = analyze_lunar_products(
            site=site,
            x=x,
            y=y,
            radius_pixels=radius_pixels,
            calculated_slope_grid=calculated_slope_grid,
        )

        center_sample = self.sample(
            site=site,
            x=x,
            y=y,
        )

        return {
            "planetary_body": "moon",
            "site": site,
            "dataset": "NASA LOLA 5m/pixel",
            "source": "NASA Planetary Geosciences Data Archive",
            "coordinate_system": "projected",
            "reference_frame": "MOON_ME / DE421",
            "crs": grid_data["crs"],
            "center": {
                "x": x,
                "y": y,
                "elevation_m": center_sample.elevation_m,
                "row": grid_data["center"]["row"],
                "column": grid_data["center"]["column"],
            },
            "neighborhood": nasa_products["neighborhood"],
            "calculated_terrain_metrics": calculated_metrics,
            "nasa_products": nasa_products["products"],
            "slope_comparison": nasa_products["slope_comparison"],
        }
