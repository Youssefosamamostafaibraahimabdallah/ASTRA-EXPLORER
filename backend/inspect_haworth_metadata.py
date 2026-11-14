
import rasterio
from pathlib import Path

path = Path("data/moon/haworth/elevation.tif.part")

with rasterio.open(path) as ds:
    print("FILE:", path)
    print("WIDTH:", ds.width)
    print("HEIGHT:", ds.height)
    print("BOUNDS:", ds.bounds)
    print("RESOLUTION:", ds.res)
    print("TRANSFORM:", ds.transform)
    print("NODATA:", ds.nodata)
    print("\nDATASET TAGS:")
    for key, value in ds.tags().items():
        print(f"{key}: {value}")

    print("\nBAND 1 TAGS:")
    for key, value in ds.tags(1).items():
        print(f"{key}: {value}")
