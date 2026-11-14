
import rasterio
from pyproj import CRS, Transformer

RASTER = "data/moon/haworth/elevation.tif.part"

TARGETS = {
    "USGS Haworth crater center": (-86.9000, -4.0000),
    "NASA Haworth site reference": (-86.7639, -22.7770),
}

with rasterio.open(RASTER) as ds:

    geographic_crs = CRS.from_proj4(
        "+proj=longlat +R=1737400 +no_defs"
    )

    transformer = Transformer.from_crs(
        geographic_crs,
        ds.crs,
        always_xy=True,
    )

    print("RASTER BOUNDS:", ds.bounds)

    for name, (latitude, longitude) in TARGETS.items():

        x, y = transformer.transform(longitude, latitude)

        inside = (
            ds.bounds.left <= x <= ds.bounds.right
            and ds.bounds.bottom <= y <= ds.bounds.top
        )

        print("\n" + "=" * 55)
        print(name)
        print("Latitude:", latitude)
        print("Longitude:", longitude)
        print(f"Projected X: {x:.3f} m")
        print(f"Projected Y: {y:.3f} m")
        print("Inside raster:", inside)
