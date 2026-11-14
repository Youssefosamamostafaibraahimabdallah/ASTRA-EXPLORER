
from pathlib import Path
from functools import lru_cache
import struct
import math

MOLA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "megt90n000cb.img"
)

# Global Mars topography raster
PIXELS_PER_DEGREE = 4
WIDTH = 1440
HEIGHT = 720
EXPECTED_SIZE = WIDTH * HEIGHT * 2


@lru_cache(maxsize=1)
def load_mola_data() -> bytes:
    if not MOLA_FILE.exists():
        raise FileNotFoundError(
            f"MOLA dataset not found: {MOLA_FILE}"
        )

    data = MOLA_FILE.read_bytes()

    if len(data) != EXPECTED_SIZE:
        raise ValueError(
            f"Invalid MOLA file size: {len(data)} bytes. "
            f"Expected {EXPECTED_SIZE} bytes."
        )

    return data


def get_mars_elevation(
    latitude: float,
    longitude: float,
):
    if not math.isfinite(latitude) or not math.isfinite(longitude):
        raise ValueError("Coordinates must be finite numbers.")

    if not -90 <= latitude <= 90:
        raise ValueError("Latitude must be between -90 and 90.")

    if not math.isfinite(longitude):
        raise ValueError("Longitude must be finite.")

    # Normalize longitude to [-180, 180)
    longitude = ((longitude + 180) % 360) - 180

    # Convert geographic coordinates to raster indices.
    column = int((longitude + 180) * PIXELS_PER_DEGREE)
    row = int((90 - latitude) * PIXELS_PER_DEGREE)

    # Keep indices inside the raster.
    column = max(0, min(WIDTH - 1, column))
    row = max(0, min(HEIGHT - 1, row))

    data = load_mola_data()

    # Each elevation sample occupies 2 bytes.
    offset = (row * WIDTH + column) * 2

    # MOLA uses signed, big-endian 16-bit integers.
    elevation = struct.unpack_from(">h", data, offset)[0]

    # Missing-data sentinel.
    if elevation == -32768:
        return {
            "latitude": latitude,
            "longitude": longitude,
            "elevation_m": None,
            "message": "No elevation value available at this grid cell."
        }

    return {
        "latitude": latitude,
        "longitude": longitude,
        "elevation_m": elevation,
        "unit": "meters",
        "dataset": "MOLA MEGDR",
        "resolution": "4 pixels per degree",
        "source": "NASA Planetary Data System"
    }
