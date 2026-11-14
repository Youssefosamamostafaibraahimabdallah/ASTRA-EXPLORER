
from pathlib import Path
import rasterio

folder = Path("data/moon/site01")

files = {
    "Elevation": "elevation.tif",
    "Slope": "slope.tif",
    "Elevation uncertainty": "elevation_uncertainty.tif",
    "Slope uncertainty": "slope_uncertainty.tif",
}

for label, filename in files.items():
    path = folder / filename

    print(f"\n{'=' * 55}")
    print(label)
    print(f"{'=' * 55}")

    if not path.exists():
        print("FILE NOT FOUND:", path)
        continue

    try:
        with rasterio.open(path) as dataset:
            print("CRS:", dataset.crs)
            print("Bounds:", dataset.bounds)
            print("Dimensions:", dataset.width, "x", dataset.height)
            print("Resolution:", dataset.res)
            print("NoData:", dataset.nodata)
            print("Data types:", dataset.dtypes)
            print("Transform:", dataset.transform)
            print("Tags:", dataset.tags())

    except Exception as error:
        print("ERROR:", error)
