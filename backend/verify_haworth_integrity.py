
from pathlib import Path

import rasterio
import numpy as np

path = Path("data/moon/haworth/elevation.tif.part")

print("FILE:", path)
print("FILE SIZE:", f"{path.stat().st_size:,}", "bytes")

try:
    with rasterio.open(path) as dataset:
        total_blocks = 0
        valid_pixels = 0
        invalid_pixels = 0
        minimum = float("inf")
        maximum = float("-inf")

        print("\nReading raster blocks...")

        for _, window in dataset.block_windows(1):
            block = dataset.read(1, window=window, masked=True)

            values = block.compressed()

            total_blocks += 1
            valid_pixels += values.size
            invalid_pixels += block.size - values.size

            if values.size:
                minimum = min(minimum, float(values.min()))
                maximum = max(maximum, float(values.max()))

        print("\n========== INTEGRITY REPORT ==========")
        print("Dimensions:", dataset.width, "x", dataset.height)
        print("Total pixels:", dataset.width * dataset.height)
        print("Blocks successfully read:", total_blocks)
        print("Valid pixels:", valid_pixels)
        print("NoData pixels:", invalid_pixels)

        if valid_pixels:
            print("Actual minimum:", minimum)
            print("Actual maximum:", maximum)

        print("\nRaster block reading completed successfully.")

except Exception as error:
    print("\nRASTER VALIDATION FAILED")
    print(type(error).__name__ + ":", error)
