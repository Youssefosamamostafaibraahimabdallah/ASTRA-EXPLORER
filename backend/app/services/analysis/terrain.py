
import math
import statistics
from typing import Optional


def calculate_terrain_metrics(
    elevation_grid: list[list[Optional[float]]],
    cell_size_x_m: float,
    cell_size_y_m: Optional[float] = None,
) -> dict:
    """
    Calculate terrain statistics from a rectangular elevation grid.

    None represents missing or NoData measurements.

    Slope:
        Horn's 3x3 finite-difference method.

    Ruggedness:
        Riley Terrain Ruggedness Index (TRI).

    Cell sizes must be expressed in meters.

    slope_grid_degrees preserves individual Horn slope values.
    Boundary cells and cells with incomplete neighborhoods are None.
    """

    if cell_size_y_m is None:
        cell_size_y_m = cell_size_x_m

    if not math.isfinite(cell_size_x_m) or cell_size_x_m <= 0:
        raise ValueError("X cell size must be a positive finite number.")

    if not math.isfinite(cell_size_y_m) or cell_size_y_m <= 0:
        raise ValueError("Y cell size must be a positive finite number.")

    if not elevation_grid:
        raise ValueError("Elevation grid cannot be empty.")

    width = len(elevation_grid[0])

    if width == 0 or any(len(row) != width for row in elevation_grid):
        raise ValueError("Elevation grid must be rectangular.")

    def valid(value):
        return (
            value is not None
            and isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
        )

    total_cells = len(elevation_grid) * width

    values = [
        float(value)
        for row in elevation_grid
        for value in row
        if valid(value)
    ]

    if not values:
        raise ValueError("Elevation grid contains no valid measurements.")

    minimum = min(values)
    maximum = max(values)
    mean = statistics.fmean(values)

    slopes = []
    ruggedness_values = []

    height = len(elevation_grid)

    # Keep the same dimensions as the elevation grid.
    # None represents a location where Horn slope is unavailable.
    slope_grid_degrees = [
        [None for _ in range(width)]
        for _ in range(height)
    ]

    # A 3x3 neighborhood is required for Horn's method.
    if height >= 3 and width >= 3:

        for row in range(1, height - 1):
            for col in range(1, width - 1):

                neighborhood = [
                    elevation_grid[row - 1][col - 1],
                    elevation_grid[row - 1][col],
                    elevation_grid[row - 1][col + 1],
                    elevation_grid[row][col - 1],
                    elevation_grid[row][col],
                    elevation_grid[row][col + 1],
                    elevation_grid[row + 1][col - 1],
                    elevation_grid[row + 1][col],
                    elevation_grid[row + 1][col + 1],
                ]

                if not all(valid(v) for v in neighborhood):
                    continue

                z1, z2, z3, z4, z5, z6, z7, z8, z9 = (
                    float(v) for v in neighborhood
                )

                dz_dx = (
                    (z3 + 2 * z6 + z9)
                    - (z1 + 2 * z4 + z7)
                ) / (8 * cell_size_x_m)

                dz_dy = (
                    (z7 + 2 * z8 + z9)
                    - (z1 + 2 * z2 + z3)
                ) / (8 * cell_size_y_m)

                gradient = math.sqrt(dz_dx ** 2 + dz_dy ** 2)

                slope_degrees = math.degrees(
                    math.atan(gradient)
                )

                slopes.append(slope_degrees)
                slope_grid_degrees[row][col] = slope_degrees

                neighbors = [z1, z2, z3, z4, z6, z7, z8, z9]

                tri = math.sqrt(
                    sum((neighbor - z5) ** 2 for neighbor in neighbors)
                )

                ruggedness_values.append(tri)

    return {
        "elevation": {
            "mean_m": round(mean, 4),
            "minimum_m": round(minimum, 4),
            "maximum_m": round(maximum, 4),
            "range_m": round(maximum - minimum, 4),
            "standard_deviation_m": round(
                statistics.pstdev(values), 4
            ),
        },
        "slope": {
            "mean_degrees": (
                round(statistics.fmean(slopes), 4)
                if slopes else None
            ),
            "maximum_degrees": (
                round(max(slopes), 4)
                if slopes else None
            ),
            "valid_cells": len(slopes),
            "method": "Horn 3x3",
        },
        "slope_grid_degrees": slope_grid_degrees,
        "roughness": {
            "mean_tri_m": (
                round(statistics.fmean(ruggedness_values), 4)
                if ruggedness_values else None
            ),
            "valid_cells": len(ruggedness_values),
            "method": "Riley Terrain Ruggedness Index",
        },
        "data_quality": {
            "total_cells": total_cells,
            "valid_cells": len(values),
            "missing_cells": total_cells - len(values),
            "coverage_percent": round(
                len(values) / total_cells * 100, 2
            ),
        },
        "analysis": {
            "cell_size_x_m": cell_size_x_m,
            "cell_size_y_m": cell_size_y_m,
            "unit": "meters",
        },
    }
