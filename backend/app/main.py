
import os
from datetime import datetime

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services.nasa_power import get_daily_temperature
from app.services.mola import get_mars_elevation


# Load environment variables from backend/.env
load_dotenv()

# Read NASA API key from .env
NASA_API_KEY = os.getenv("NASA_API_KEY")


# Initialize FastAPI
app = FastAPI(
    title="Earth-Moon-Mars Analog Explorer API",
    description="Geospatial research and planetary analog discovery.",
    version="0.3.0",
)


# Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    return {
        "project": "Earth-Moon-Mars Analog Explorer",
        "status": "running",
        "version": "0.3.0",
    }


# Health check
@app.get("/api/v1/health")
async def health():
    return {
        "status": "healthy",
        "services": {
            "backend": "online",
            "earth_data": "NASA POWER available",
            "moon_data": "not_connected",
            "mars_data": "MOLA elevation available",
        },
    }


# Available planets
@app.get("/api/v1/planets")
async def get_planets():
    return {
        "planets": [
            {
                "id": "earth",
                "name": "Earth",
                "type": "home_planet",
            },
            {
                "id": "moon",
                "name": "Moon",
                "type": "natural_satellite",
            },
            {
                "id": "mars",
                "name": "Mars",
                "type": "planet",
            },
        ]
    }


# Test NASA API key configuration
@app.get("/api/v1/test-nasa-key")
async def test_nasa_key():
    return {
        "configured": bool(NASA_API_KEY)
    }


# Validate date format and chronological order
def validate_dates(start: str, end: str):
    try:
        start_date = datetime.strptime(start, "%Y%m%d")
        end_date = datetime.strptime(end, "%Y%m%d")

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must be valid YYYYMMDD dates."
        )

    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before or equal to end date."
        )


# Shared NASA POWER temperature service
async def fetch_location_temperature(
    latitude: float,
    longitude: float,
    location: str,
    start: str,
    end: str,
):
    validate_dates(start, end)

    try:
        # Request data from NASA POWER
        raw_data = await get_daily_temperature(
            latitude=latitude,
            longitude=longitude,
            start=start,
            end=end,
        )

        # Extract daily temperature measurements
        temperatures = (
            raw_data["properties"]["parameter"]["T2M"]
        )

        # Remove missing measurements (-999)
        daily_data = [
            {
                "date": date,
                "temperature": round(float(value), 2),
            }
            for date, value in sorted(temperatures.items())
            if float(value) != -999
        ]

        if not daily_data:
            raise HTTPException(
                status_code=404,
                detail="No temperature data available."
            )

        # Calculate statistics
        values = [
            item["temperature"]
            for item in daily_data
        ]

        average = sum(values) / len(values)

        # Extract elevation if provided
        geometry_coordinates = (
            raw_data.get("geometry", {})
            .get("coordinates", [])
        )

        elevation = (
            geometry_coordinates[2]
            if len(geometry_coordinates) >= 3
            else None
        )

        return {
            "location": location,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "parameter": "T2M",
            "parameter_description": "Air temperature at 2 meters",
            "unit": "°C",
            "source": "NASA POWER / MERRA-2",
            "elevation_m": elevation,
            "statistics": {
                "average": round(average, 2),
                "minimum": round(min(values), 2),
                "maximum": round(max(values), 2),
                "number_of_days": len(values),
            },
            "daily_data": daily_data,
        }

    except HTTPException:
        raise

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"NASA POWER request failed: {str(error)}",
        )

    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected NASA POWER response: {str(error)}",
        )


# General NASA POWER endpoint: any Earth location
@app.get("/api/v1/earth/temperature")
async def get_earth_temperature(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    location: str = Query(
        default="Selected location",
        max_length=100
    ),
    start: str = Query(
        default="20240101",
        pattern=r"^\d{8}$"
    ),
    end: str = Query(
        default="20240107",
        pattern=r"^\d{8}$"
    ),
):
    return await fetch_location_temperature(
        latitude=latitude,
        longitude=longitude,
        location=location,
        start=start,
        end=end,
    )


# Backward-compatible Atacama endpoint
@app.get("/api/v1/earth/atacama/temperature")
async def get_atacama_temperature(
    start: str = Query(
        default="20240101",
        pattern=r"^\d{8}$"
    ),
    end: str = Query(
        default="20240107",
        pattern=r"^\d{8}$"
    ),
):
    return await fetch_location_temperature(
        latitude=-24.5,
        longitude=-69.25,
        location="Atacama Desert",
        start=start,
        end=end,
    )


# ==========================================
# MARS DATA — MOLA ELEVATION
# ==========================================

@app.get("/api/v1/mars/elevation")
async def mars_elevation(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
):
    try:
        result = get_mars_elevation(
            latitude=latitude,
            longitude=longitude,
        )

        return result

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
