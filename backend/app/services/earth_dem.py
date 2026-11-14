from pathlib import Path
import math
from typing import Optional

import numpy as np
import rasterio
from pyproj import Geod
from rasterio.windows import Window


PROJECT_ROOT = Path(__file__).resolve().parents[2]
EARTH_DATA_DIR = PROJECT_ROOT / "data" / "earth"

EARTH_SITES = {
    "atacama": EARTH_DATA_DIR / "atacama" / "elevation.tif",
}

WGS84_GEOD = Geod(ellps="WGS84")


def validate_coordinates(latitude: float, longitude: float) -> None:
    if not math.isfinite(latitude) or not math.isfinite(longitude):
        raise ValueError("Coordinates must be finite numbers.")

    if not -90 <= latitude <= 90:
        raise ValueError("Latitude must be between -90 and 90.")

    if not -180 <= longitude <= 180:
        raise ValueError("Longitude must be between -180 and 180.")


def validate_radius(radius_pixels: int) -> None:
    if (
        not isinstance(radius_pixels, int)
        or isinstance(radius_pixels, bool)
        or not 1 <= radius_pixels <= 100
    ):
        raise ValueError(
            "radius_pixels must be an integer from 1 to 100."
        )


def get_earth_raster_path(
    site: str,
    dataset: str = "elevation",
) -> Path:
    site = site.lower()
    dataset = dataset.lower()

    if dataset != "elevation":
        raise ValueError(f"Unsupported Earth dataset: {dataset}")

    if site not in EARTH_SITES:
        raise ValueError(f"Unsupported Earth site: {site}")

    path = EARTH_SITES[site]

    if not path.is_file():
        raise FileNotFoundError(f"Earth DEM not found: {path}")

    return path


def inspect_earth_raster(
    site: str,
    dataset: str = "elevation",
) -> dict:
    path = get_earth_raster_path(site, dataset)

    with rasterio.open(path) as raster:
        return {
            "site": site,
            "dataset": "NASADEM HGT",
            "path": str(path),
            "crs": str(raster.crs),
            "width": raster.width,
            "height": raster.height,
            "bands": raster.count,
            "data_type": list(raster.dtypes),
            "nodata": raster.nodata,
            "bounds": {
                "left": raster.bounds.left,
                "bottom": raster.bounds.bottom,
                "right": raster.bounds.right,
                "top": raster.bounds.top,
            },
            "resolution_degrees": list(raster.res),
            "transform": list(raster.transform),
            "tags": raster.tags(),
            "vertical_reference": (
                "Not independently verified from the local raster metadata."
            ),
        }


def sample_earth_elevation(
    site: str,
    latitude: float,
    longitude: float,
) -> dict:
    validate_coordinates(latitude, longitude)

    path = get_earth_raster_path(site, "elevation")

    with rasterio.open(path) as raster:
        if raster.crs is None or not raster.crs.is_geographic:
            raise ValueError(
                "Earth DEM must use a geographic coordinate system."
            )

        row, col = raster.index(longitude, latitude)

        if not (
            0 <= row < raster.height
            and 0 <= col < raster.width
        ):
            return {
                "site": site,
                "available": False,
                "elevation_m": None,
                "latitude": latitude,
                "longitude": longitude,
                "message": "Coordinate outside raster coverage.",
            }

        value = raster.read(
            1,
            window=Window(col, row, 1, 1),
            masked=True,
        )[0, 0]

        if np.ma.is_masked(value) or not np.isfinite(value):
            elevation = None
        else:
            elevation = float(value)

        return {
            "site": site,
            "available": elevation is not None,
            "elevation_m": elevation,
            "latitude": latitude,
            "longitude": longitude,
            "row": row,
            "column": col,
            "crs": str(raster.crs),
            "dataset": "NASADEM HGT",
            "source": "NASA/JPL NASADEM",
            "message": (
                None if elevation is not None
                else "NoData at requested coordinate."
            ),
        }


def extract_earth_elevation_grid(
    site: str,
    latitude: float,
    longitude: float,
    radius_pixels: int = 5,
) -> dict:
    validate_coordinates(latitude, longitude)
    validate_radius(radius_pixels)

    path = get_earth_raster_path(site, "elevation")

    with rasterio.open(path) as raster:
        if raster.crs is None or not raster.crs.is_geographic:
            raise ValueError(
                "Earth DEM must use a geographic coordinate system."
            )

        row, col = raster.index(longitude, latitude)

        if not (
            0 <= row < raster.height
            and 0 <= col < raster.width
        ):
            raise ValueError(
                "Requested coordinate is outside raster coverage."
            )

        size = radius_pixels * 2 + 1

        row_start = row - radius_pixels
        col_start = col - radius_pixels
        row_end = row + radius_pixels + 1
        col_end = col + radius_pixels + 1

        if (
            row_start < 0
            or col_start < 0
            or row_end > raster.height
            or col_end > raster.width
        ):
            raise ValueError(
                "Requested grid extends beyond raster coverage."
            )

        window = Window(
            col_start,
            row_start,
            size,
            size,
        )

        data = raster.read(
            1,
            window=window,
            masked=True,
        )

        grid: list[list[Optional[float]]] = []

        for raster_row in data:
            grid_row = []

            for value in raster_row:
                if np.ma.is_masked(value) or not np.isfinite(value):
                    grid_row.append(None)
                else:
                    grid_row.append(float(value))

            grid.append(grid_row)

        # Calculate local ground dimensions in metres using
        # the WGS84 ellipsoid, rather than treating degrees as metres.
        center_x, center_y = raster.xy(row, col)

        west_x, west_y = raster.xy(row, col - 1)
        east_x, east_y = raster.xy(row, col + 1)

        north_x, north_y = raster.xy(row - 1, col)
        south_x, south_y = raster.xy(row + 1, col)

        _, _, horizontal_distance = WGS84_GEOD.inv(
            west_x, west_y, east_x, east_y
        )

        _, _, vertical_distance = WGS84_GEOD.inv(
            north_x, north_y, south_x, south_y
        )

        # The measurements span two pixels, so divide by two
        # to obtain the approximate size of one pixel.
        cell_size_x_m = abs(horizontal_distance) / 2
        cell_size_y_m = abs(vertical_distance) / 2

        if (
            not math.isfinite(cell_size_x_m)
            or not math.isfinite(cell_size_y_m)
            or cell_size_x_m <= 0
            or cell_size_y_m <= 0
        ):
            raise ValueError(
                "Could not calculate valid local pixel dimensions."
            )

        return {
            "site": site,
            "grid": grid,
            "width": size,
            "height": size,
            "center": {
                "row": row,
                "column": col,
                "latitude": latitude,
                "longitude": longitude,
                "pixel_center_latitude": center_y,
                "pixel_center_longitude": center_x,
            },
            "resolution_m": [
                cell_size_x_m,
                cell_size_y_m,
            ],
            "resolution_degrees": list(raster.res),
            "crs": str(raster.crs),
            "dataset": "NASADEM HGT",
            "source": "NASA/JPL NASADEM",
            "vertical_reference": (
                "Not independently verified from the local raster metadata."
            ),
        }
