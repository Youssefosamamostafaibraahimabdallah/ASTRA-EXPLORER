
import httpx

NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)


async def get_daily_temperature(
    latitude: float,
    longitude: float,
    start: str,
    end: str,
):
    params = {
        "parameters": "T2M",
        "community": "SB",
        "longitude": longitude,
        "latitude": latitude,
        "start": start,
        "end": end,
        "format": "JSON",
        "time-standard": "UTC",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            NASA_POWER_URL,
            params=params,
        )

        response.raise_for_status()

        return response.json()
