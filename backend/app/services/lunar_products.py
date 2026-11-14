
import math
from pathlib import Path
from typing import Optional

import numpy as np
import rasterio
from rasterio.windows import Window

from app.services.lunar_dem import get_lunar_raster_path


def analyze_lunar_products(
    site: str,
    x: float,
    y: float,
    radius_pixels: int = 5,
    calculated_slope_grid: Optional[list[list[Optional[float]]]] = None,
) -> dict:
    """
    Analyze aligned NASA LOLA elevation, elevation uncertainty,
    slope, and slope uncertainty products.

    Optionally compare NASA slope with a locally calculated Horn
    slope grid using only pixels valid in both datasets.

    Units:
        Elevation: metres
        Elevation uncertainty: metres (RMS error)
        Slope: degrees
        Slope uncertainty: degrees (RMS error)
    """

    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError("Coordinates must be finite numbers.")

    if (
        not isinstance(radius_pixels, int)
        or isinstance(radius_pixels, bool)
        or not 1 <= radius_pixels <= 100
    ):
        raise ValueError(
            "radius_pixels must be an integer from 1 to 100."
        )

    site = site.lower()

    datasets = {
        "elevation": {
            "unit": "m",
            "meaning": "Surface-interpolated elevation",
        },
        "elevation_uncertainty": {
            "unit": "m RMS",
            "meaning": "Total elevation uncertainty",
        },
        "slope": {
            "unit": "degrees",
            "meaning": "NASA-provided surface slope",
        },
        "slope_uncertainty": {
            "unit": "degrees RMS",
            "meaning": "Slope uncertainty",
        },
    }

    paths = {
        name: get_lunar_raster_path(site, name)
        for name in datasets
    }

    reference_path = paths["elevation"]

    with rasterio.open(reference_path) as reference:
        row, col = reference.index(x, y)

        size = radius_pixels * 2 + 1

        row_start = row - radius_pixels
        col_start = col - radius_pixels
        row_end = row + radius_pixels + 1
        col_end = col + radius_pixels + 1

        if (
            row_start < 0
            or col_start < 0
            or row_end > reference.height
            or col_end > reference.width
        ):
            raise ValueError(
                "Requested window extends beyond raster coverage."
            )

        window = Window(
            col_start,
            row_start,
            size,
            size,
        )

        reference_transform = reference.transform
        reference_crs = reference.crs
        reference_shape = (reference.height, reference.width)

        resolution_x = abs(reference.res[0])
        resolution_y = abs(reference.res[1])

        results = {}
        nasa_slope_grid = None

        for name, metadata in datasets.items():
            path: Path = paths[name]

            with rasterio.open(path) as raster:

                if (
                    raster.transform != reference_transform
                    or raster.crs != reference_crs
                    or (raster.height, raster.width) != reference_shape
                ):
                    raise ValueError(
                        f"{name} is not aligned with the elevation raster."
                    )

                masked_data = raster.read(
                    1,
                    window=window,
                    masked=True,
                )

                if name == "slope":
                    nasa_slope_grid = np.asarray(
                        masked_data.filled(np.nan),
                        dtype=float,
                    )

                values = masked_data.compressed()
                values = values[np.isfinite(values)]

                if values.size == 0:
                    raise ValueError(
                        f"No valid measurements found in {name}."
                    )

                results[name] = {
                    "meaning": metadata["meaning"],
                    "unit": metadata["unit"],
                    "valid_pixels": int(values.size),
                    "total_pixels": size * size,
                    "coverage_percent": round(
                        values.size / (size * size) * 100,
                        2,
                    ),
                    "statistics": {
                        "minimum": round(float(np.min(values)), 4),
                        "maximum": round(float(np.max(values)), 4),
                        "mean": round(float(np.mean(values)), 4),
                        "median": round(float(np.median(values)), 4),
                        "standard_deviation": round(
                            float(np.std(values)),
                            4,
                        ),
                        "percentile_95": round(
                            float(np.percentile(values, 95)),
                            4,
                        ),
                    },
                }

    slope_comparison = None

    if calculated_slope_grid is not None:

        if (
            len(calculated_slope_grid) != size
            or any(len(grid_row) != size for grid_row in calculated_slope_grid)
        ):
            raise ValueError(
                "Calculated slope grid dimensions must match "
                "the NASA slope window."
            )

        if nasa_slope_grid is None:
            raise ValueError("NASA slope grid was not loaded.")

        nasa_matching_values = []
        horn_matching_values = []

        # Compare only the interior cells.
        # Horn's 3x3 method cannot calculate the outer boundary.
        for grid_row in range(1, size - 1):
            for grid_col in range(1, size - 1):

                nasa_value = nasa_slope_grid[grid_row, grid_col]
                horn_value = calculated_slope_grid[grid_row][grid_col]

                if horn_value is None:
                    continue

                if not math.isfinite(float(horn_value)):
                    continue

                if not np.isfinite(nasa_value):
                    continue

                nasa_matching_values.append(float(nasa_value))
                horn_matching_values.append(float(horn_value))

        total_comparison_cells = max((size - 2) * (size - 2), 0)
        valid_comparison_cells = len(nasa_matching_values)

        if valid_comparison_cells:
            nasa_matching_mean = float(np.mean(nasa_matching_values))
            horn_matching_mean = float(np.mean(horn_matching_values))

            difference = nasa_matching_mean - horn_matching_mean
        else:
            nasa_matching_mean = None
            horn_matching_mean = None
            difference = None

        slope_comparison = {
            "comparison_scope": (
                "Matching interior pixels valid in both NASA slope "
                "and locally calculated Horn slope grids"
            ),
            "nasa_slope_mean_degrees": (
                round(nasa_matching_mean, 4)
                if nasa_matching_mean is not None else None
            ),
            "calculated_horn_slope_mean_degrees": (
                round(horn_matching_mean, 4)
                if horn_matching_mean is not None else None
            ),
            "difference_degrees": (
                round(difference, 4)
                if difference is not None else None
            ),
            "valid_comparison_pixels": valid_comparison_cells,
            "total_comparison_pixels": total_comparison_cells,
            "coverage_percent": (
                round(
                    valid_comparison_cells / total_comparison_cells * 100,
                    2,
                )
                if total_comparison_cells else 0.0
            ),
            "difference_definition": (
                "NASA slope mean minus calculated Horn slope mean"
            ),
            "note": (
                "Both means use the same valid pixel locations. "
                "The NASA slope product and Horn calculation may "
                "still differ in their processing methods."
            ),
        }

    return {
        "site": site,
        "dataset": "NASA LOLA 5m/pixel",
        "coordinate_system": "South Polar Stereographic",
        "reference_frame": "MOON_ME / DE421",
        "center": {
            "x": x,
            "y": y,
            "row": row,
            "column": col,
        },
        "neighborhood": {
            "radius_pixels": radius_pixels,
            "width_pixels": size,
            "height_pixels": size,
            "cell_size_x_m": resolution_x,
            "cell_size_y_m": resolution_y,
            "approximate_width_m": size * resolution_x,
            "approximate_height_m": size * resolution_y,
        },
        "products": results,
        "slope_comparison": slope_comparison,
    }
