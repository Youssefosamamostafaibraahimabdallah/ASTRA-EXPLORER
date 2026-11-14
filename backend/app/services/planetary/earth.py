from app.services.earth_dem import (
    inspect_earth_raster,
    sample_earth_elevation,
    extract_earth_elevation_grid,
)

from app.services.analysis.terrain import calculate_terrain_metrics

from app.services.planetary.base import (
    ElevationSample,
    PlanetaryDataProvider,
)


class EarthDataProvider(PlanetaryDataProvider):
    planetary_body = "earth"

    def sample(
        self,
        site: str,
        latitude: float,
        longitude: float,
    ) -> ElevationSample:

        self.validate_geographic_coordinates(latitude, longitude)

        site = site.lower()

        result = sample_earth_elevation(
            site=site,
            latitude=latitude,
            longitude=longitude,
        )

        raster_info = inspect_earth_raster(
            site=site,
            dataset="elevation",
        )

        resolution = raster_info["resolution_degrees"]

        return ElevationSample(
            planetary_body=self.planetary_body,
            latitude=latitude,
            longitude=longitude,
            elevation_m=result.get("elevation_m"),
            available=result.get("available", False),
            coordinate_system="geographic",
            crs=result.get("crs"),
            dataset=result.get("dataset", "NASADEM HGT"),
            source=result.get("source", "NASA/JPL NASADEM"),
            resolution=(
                f"{abs(resolution[0])} x "
                f"{abs(resolution[1])} degrees per pixel"
            ),
            message=result.get("message"),
        )

    def analyze_terrain(
        self,
        site: str,
        latitude: float,
        longitude: float,
        radius_pixels: int = 5,
    ) -> dict:
        """
        Analyze an Earth terrain neighborhood using NASADEM.

        Horizontal pixel dimensions are calculated geodesically
        at the center of the selected neighborhood.
        """

        self.validate_geographic_coordinates(latitude, longitude)

        site = site.lower()

        grid_data = extract_earth_elevation_grid(
            site=site,
            latitude=latitude,
            longitude=longitude,
            radius_pixels=radius_pixels,
        )

        cell_size_x_m, cell_size_y_m = grid_data["resolution_m"]

        calculated_metrics = calculate_terrain_metrics(
            elevation_grid=grid_data["grid"],
            cell_size_x_m=cell_size_x_m,
            cell_size_y_m=cell_size_y_m,
        )

        # Keep the temporary per-pixel slope grid internal.
        calculated_metrics.pop("slope_grid_degrees")

        center_sample = self.sample(
            site=site,
            latitude=latitude,
            longitude=longitude,
        )

        raster_info = inspect_earth_raster(
            site=site,
            dataset="elevation",
        )

        return {
            "planetary_body": "earth",
            "site": site,
            "dataset": "NASADEM HGT",
            "source": "NASA/JPL NASADEM",
            "coordinate_system": "geographic",
            "crs": grid_data["crs"],
            "vertical_reference": grid_data["vertical_reference"],
            "native_resolution_degrees": grid_data["resolution_degrees"],
            "local_pixel_dimensions_m": {
                "x": cell_size_x_m,
                "y": cell_size_y_m,
            },
            "center": {
                "latitude": latitude,
                "longitude": longitude,
                "elevation_m": center_sample.elevation_m,
                "row": grid_data["center"]["row"],
                "column": grid_data["center"]["column"],
            },
            "neighborhood": {
                "radius_pixels": radius_pixels,
                "width": grid_data["width"],
                "height": grid_data["height"],
                "total_cells": (
                    grid_data["width"] * grid_data["height"]
                ),
            },
            "calculated_terrain_metrics": calculated_metrics,
            "raster_metadata": {
                "width": raster_info["width"],
                "height": raster_info["height"],
                "data_type": raster_info["data_type"],
                "nodata": raster_info["nodata"],
            },
        }
