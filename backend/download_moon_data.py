
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from http.client import IncompleteRead
import shutil
import time

BASE_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp"

DATASETS = {
    "haworth": "Haworth",
    "de_gerlache": "Site11",
    "malapert": "Site23",
}

PRODUCTS = {
    "surf": "elevation.tif",
    "slp": "slope.tif",
    "toterr": "elevation_uncertainty.tif",
    "slperr": "slope_uncertainty.tif",
}

ROOT = Path("data/moon")

CHUNK_SIZE = 256 * 1024
MAX_RETRIES = 15
TIMEOUT = 120


def download_file(url: str, destination: Path):
    destination.parent.mkdir(parents=True, exist_ok=True)

    partial = destination.with_suffix(destination.suffix + ".part")

    if destination.exists():
        print(f"Already exists: {destination}")
        return

    for attempt in range(1, MAX_RETRIES + 1):

        downloaded = partial.stat().st_size if partial.exists() else 0

        headers = {
            "User-Agent": "ASTRA-EXPLORER/1.0",
        }

        if downloaded > 0:
            headers["Range"] = f"bytes={downloaded}-"

        request = Request(url, headers=headers)

        try:
            print(
                f"\nAttempt {attempt}/{MAX_RETRIES} | "
                f"Already downloaded: {downloaded / 1024 / 1024:.2f} MB"
            )

            with urlopen(request, timeout=TIMEOUT) as response:

                status = response.status
                content_type = response.headers.get("Content-Type", "")

                if "text/html" in content_type.lower():
                    raise ValueError("Server returned HTML, not a TIFF.")

                if downloaded > 0 and status == 206:
                    content_range = response.headers.get("Content-Range", "")
                    expected_prefix = f"bytes {downloaded}-"

                    if not content_range.startswith(expected_prefix):
                        raise ValueError(
                            f"Unexpected Content-Range: {content_range}"
                        )

                    mode = "ab"

                else:
                    # Server did not resume; restart this file safely.
                    mode = "wb"
                    downloaded = 0

                content_length = response.headers.get("Content-Length")
                expected_response_bytes = (
                    int(content_length) if content_length else None
                )

                received = 0
                last_report = time.monotonic()

                with open(partial, mode) as output:

                    while True:
                        chunk = response.read(CHUNK_SIZE)

                        if not chunk:
                            break

                        output.write(chunk)
                        received += len(chunk)

                        now = time.monotonic()

                        if now - last_report >= 2:
                            total = partial.stat().st_size

                            print(
                                f"\rDownloaded: {total / 1024 / 1024:.2f} MB",
                                end="",
                                flush=True,
                            )

                            last_report = now

                print()

                if (
                    expected_response_bytes is not None
                    and received != expected_response_bytes
                ):
                    raise ConnectionError(
                        f"Incomplete response: received {received} bytes, "
                        f"expected {expected_response_bytes}"
                    )

            if partial.stat().st_size < 100_000:
                raise ValueError("Downloaded file is suspiciously small.")

            # Verify that the downloaded file is a readable GeoTIFF.
            import rasterio

            with rasterio.open(partial) as dataset:
                print("GeoTIFF validation:")
                print("Dimensions:", dataset.width, "x", dataset.height)
                print("CRS:", dataset.crs)

            partial.replace(destination)

            print(f"SUCCESS: {destination}")
            print(f"Final size: {destination.stat().st_size:,} bytes")
            return

        except (
            HTTPError,
            URLError,
            TimeoutError,
            OSError,
            IncompleteRead,
            ConnectionError,
        ) as error:

            print(f"\nConnection/download error: {error}")

        except Exception as error:
            print(f"\nValidation or download error: {error}")
            raise

        if attempt < MAX_RETRIES:
            wait = min(attempt * 5, 60)
            print(f"Retrying in {wait} seconds...")
            time.sleep(wait)

    raise RuntimeError(
        f"Could not complete download after {MAX_RETRIES} attempts: {url}"
    )


def main():

    for folder, site in DATASETS.items():

        print("\n" + "=" * 60)
        print(f"DATASET: {folder} ({site})")
        print("=" * 60)

        for suffix, output_name in PRODUCTS.items():

            filename = f"{site}_final_adj_5mpp_{suffix}.tif"

            url = f"{BASE_URL}/{site}/{filename}"
            destination = ROOT / folder / output_name

            print(f"\nDownloading: {filename}")

            download_file(url, destination)

    print("\nAll requested datasets downloaded and validated!")


if __name__ == "__main__":
    main()
