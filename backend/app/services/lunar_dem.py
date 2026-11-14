from pathlib import Path
import math
from typing import Optional

import numpy as np
import rasterio
from rasterio.windows import Window


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MOON_DATA_DIR = PROJECT_ROOT / "data" / "moon"


def get_lunar_raster_path(
    site: str,
    dataset: str = "elevation",
) -> Path:

    allowed_sites = {"haworth", "site01"}

    allowed_datasets = {
        "elevation",
        "elevation_uncertainty",
        "slope",
        "slope_uncertainty",
    }

    site = site.lower()
    dataset = dataset.lower()

    if site not in allowed_sites:
        raise ValueError(f"Unsupported lunar site: {site}")

    if dataset not in allowed_datasets:
        raise ValueError(f"Unsupported dataset: {dataset}")

    path = MOON_DATA_DIR / site / f"{dataset}.tif"

    if not path.is_file():
        raise FileNotFoundError(f"Dataset not found: {path}")

    return path


def inspect_lunar_raster(
    site: str,
    dataset: str = "elevation",
) -> dict:

    path = get_lunar_raster_path(site, dataset)

    with rasterio.open(path) as raster:

        return {
            "site": site,
            "dataset": dataset,
            "path": str(path),
            "crs": str(raster.crs),
            "width": raster.width,
            "height": raster.height,
            "bands": raster.count,
            "data_type": list(raster.dtypes),
            "nodata": (
                str(raster.nodata)
                if raster.nodata is not None
                else None
            ),
            "bounds": {
                "left": raster.bounds.left,
                "bottom": raster.bounds.bottom,
                "right": raster.bounds.right,
                "top": raster.bounds.top,
            },
            "resolution": list(raster.res),
            "transform": list(raster.transform),
        }


def sample_lunar_elevation(
    site: str,
    x: float,
    y: float,
) -> dict:

    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError("Coordinates must be finite numbers.")

    path = get_lunar_raster_path(site, "elevation")

    with rasterio.open(path) as raster:

        row, col = raster.index(x, y)

        if not (
            0 <= row < raster.height
            and 0 <= col < raster.width
        ):
            return {
                "site": site,
                "available": False,
                "elevation_m": None,
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
            "row": row,
            "column": col,
            "x": x,
            "y": y,
            "crs": str(raster.crs),
            "dataset": "NASA LOLA elevation",
            "source": "NASA Planetary Geosciences Data Archive",
        }


def extract_lunar_elevation_grid(
    site: str,
    x: float,
    y: float,
    radius_pixels: int = 5,
) -> dict:

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

    path = get_lunar_raster_path(site, "elevation")

    with rasterio.open(path) as raster:

        row, col = raster.index(x, y)

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

        return {
            "site": site,
            "grid": grid,
            "width": size,
            "height": size,
            "center": {
                "row": row,
                "column": col,
                "x": x,
                "y": y,
            },
            "resolution_m": [
                abs(raster.res[0]),
                abs(raster.res[1]),
            ],
            "crs": str(raster.crs),
            "dataset": "NASA LOLA elevation",
        }
