
from pathlib import Path

import rasterio
from pyproj import CRS, Transformer

raster_path = Path("data/moon/site01/elevation.tif")

# Lunar coordinates, using the Moon's reference sphere.
lunar_geographic = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs +type=crs"
)

locations = {
    "Haworth Crater": (-86.9, -4.0),
    "Malapert Massif": (-85.0, 11.4),
    "de Gerlache Rim 2": (-88.48, -88.34),
}

with rasterio.open(raster_path) as dataset:

    lunar_polar = dataset.crs

    transformer = Transformer.from_crs(
        lunar_geographic,
        lunar_polar,
        always_xy=True,
    )

    print("SITE01 COVERAGE TEST")
    print("=" * 60)
    print("Raster bounds:", dataset.bounds)
    print()

    for name, (latitude, longitude) in locations.items():

        x, y = transformer.transform(longitude, latitude)

        inside = (
            dataset.bounds.left <= x <= dataset.bounds.right
            and dataset.bounds.bottom <= y <= dataset.bounds.top
        )

        print(name)
        print(f"  Latitude: {latitude}")
        print(f"  Longitude: {longitude}")
        print(f"  Projected X: {x:.2f} m")
        print(f"  Projected Y: {y:.2f} m")
        print(f"  Inside Site01: {'YES' if inside else 'NO'}")

        if inside:
            row, col = dataset.index(x, y)
            print(f"  Pixel row: {row}")
            print(f"  Pixel column: {col}")

        print("-" * 60)
