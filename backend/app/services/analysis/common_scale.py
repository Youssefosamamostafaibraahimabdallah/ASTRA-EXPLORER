from pathlib import Path
import math

import numpy as np
import rasterio

from pyproj import CRS, Transformer

from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject, transform_bounds
from rasterio.windows import Window, from_bounds


def get_local_utm_crs(
    latitude: float,
    longitude: float,
) -> CRS:
    """
    Select the local UTM CRS for an Earth location.

    UTM is appropriate for local metric analysis between
    latitudes 80°S and 84°N.
    """

    if not math.isfinite(latitude) or not math.isfinite(longitude):
        raise ValueError("Coordinates must be finite.")

    if not -80 <= latitude <= 84:
        raise ValueError(
            "This local UTM implementation supports latitudes "
            "between 80°S and 84°N."
        )

    if not -180 <= longitude <= 180:
        raise ValueError("Longitude must be between -180 and 180.")

    zone = min(60, max(1, int((longitude + 180) // 6) + 1))
    epsg = (32600 if latitude >= 0 else 32700) + zone

    return CRS.from_epsg(epsg)


def extract_common_scale_grid(
    raster_path: str | Path,
    center_x: float,
    center_y: float,
    target_crs: CRS | str | None = None,
    grid_spacing_m: float = 30.0,
    grid_size: int = 11,
) -> dict:
    """
    Extract an elevation grid at a common physical scale.

    center_x and center_y must use the source raster CRS.

    The output grid uses square cells in a projected metric CRS.
    Resampling uses area averaging.

    The default grid contains 11 x 11 cells at 30 m spacing,
    giving a nominal 330 x 330 m footprint.
    """

    if not math.isfinite(center_x) or not math.isfinite(center_y):
        raise ValueError("Center coordinates must be finite.")

    if not math.isfinite(grid_spacing_m) or grid_spacing_m <= 0:
        raise ValueError("Grid spacing must be positive and finite.")

    if (
        not isinstance(grid_size, int)
        or isinstance(grid_size, bool)
        or grid_size < 3
        or grid_size % 2 == 0
        or grid_size > 101
    ):
        raise ValueError(
            "grid_size must be an odd integer from 3 to 101."
        )

    raster_path = Path(raster_path)

    if not raster_path.is_file():
        raise FileNotFoundError(
            f"Elevation raster not found: {raster_path}"
        )

    with rasterio.open(raster_path) as raster:
        if raster.crs is None:
            raise ValueError("Source raster has no CRS.")

        source_crs = CRS.from_user_input(raster.crs)
        destination_crs = (
            source_crs
            if target_crs is None
            else CRS.from_user_input(target_crs)
        )

        center_transformer = Transformer.from_crs(
            source_crs,
            destination_crs,
            always_xy=True,
        )

        destination_center_x, destination_center_y = (
            center_transformer.transform(center_x, center_y)
        )

        if (
            not math.isfinite(destination_center_x)
            or not math.isfinite(destination_center_y)
        ):
            raise ValueError(
                "Could not transform the analysis center."
            )

        footprint_m = grid_size * grid_spacing_m
        half_footprint = footprint_m / 2

        west = destination_center_x - half_footprint
        north = destination_center_y + half_footprint

        destination_transform = from_origin(
            west,
            north,
            grid_spacing_m,
            grid_spacing_m,
        )

        destination_array = np.full(
            (grid_size, grid_size),
            np.nan,
            dtype=np.float32,
        )

        destination_bounds = (
            west,
            destination_center_y - half_footprint,
            west + footprint_m,
            north,
        )

        source_bounds = transform_bounds(
            destination_crs,
            source_crs,
            *destination_bounds,
            densify_pts=21,
        )

        floating_window = from_bounds(
            *source_bounds,
            transform=raster.transform,
        )

        col_start = max(
            0,
            math.floor(floating_window.col_off) - 3,
        )
        row_start = max(
            0,
            math.floor(floating_window.row_off) - 3,
        )

        col_end = min(
            raster.width,
            math.ceil(
                floating_window.col_off + floating_window.width
            ) + 3,
        )
        row_end = min(
            raster.height,
            math.ceil(
                floating_window.row_off + floating_window.height
            ) + 3,
        )

        if col_end <= col_start or row_end <= row_start:
            raise ValueError(
                "Requested footprint does not overlap the source raster."
            )

        source_window = Window(
            col_start,
            row_start,
            col_end - col_start,
            row_end - row_start,
        )

        source_data = raster.read(
            1,
            window=source_window,
            masked=True,
        )

        source_array = source_data.astype(
            np.float32
        ).filled(np.nan)

        reproject(
            source=source_array,
            destination=destination_array,
            src_transform=raster.window_transform(source_window),
            src_crs=source_crs,
            src_nodata=np.nan,
            dst_transform=destination_transform,
            dst_crs=destination_crs,
            dst_nodata=np.nan,
            resampling=Resampling.average,
            init_dest_nodata=True,
        )

        grid = [
            [
                float(value) if np.isfinite(value) else None
                for value in row
            ]
            for row in destination_array
        ]

        valid_cells = int(np.isfinite(destination_array).sum())
        total_cells = grid_size * grid_size

        return {
            "grid": grid,
            "grid_size": grid_size,
            "grid_spacing_m": grid_spacing_m,
            "footprint_width_m": footprint_m,
            "footprint_height_m": footprint_m,
            "center": {
                "x": destination_center_x,
                "y": destination_center_y,
            },
            "source_crs": str(source_crs),
            "analysis_crs": destination_crs.to_string(),
            "resampling_method": "area_average",
            "data_quality": {
                "total_cells": total_cells,
                "valid_cells": valid_cells,
                "missing_cells": total_cells - valid_cells,
                "coverage_percent": round(
                    valid_cells / total_cells * 100,
                    2,
                ),
            },
        }
