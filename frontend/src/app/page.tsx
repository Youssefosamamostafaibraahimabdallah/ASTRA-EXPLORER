
"use client";

import { useEffect, useState } from "react";
import MoonExplorer from "@/components/MoonExplorer";
import EarthGlobe, {
  type EarthLocation,
} from "@/components/EarthGlobe";

type Planet = "earth" | "mars";

type MarsRegionId = "gale" | "jezero" | "olympus";

type MarsImageMode = "color" | "regional";

type GeographicBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type MarsRegion = {
  id: MarsRegionId;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageryLayer: string;
  imageryDescription: string;
  zoom: number;
  bounds: GeographicBounds;
  viewBounds: GeographicBounds;
};

const MARS_REGIONS: Record<MarsRegionId, MarsRegion> = {
  gale: {
    id: "gale",
    name: "Gale Crater",
    description:
      "A large impact crater explored by NASA's Curiosity rover.",
    latitude: -5.4,
    longitude: 137.8,
    imageryLayer: "Gale_CTX_BlockAdj_dd",
    imageryDescription: "NASA CTX regional mosaic",
    zoom: 8,
    bounds: {
      west: 135.1842593,
      south: -6.5732988,
      east: 139.2413012,
      north: -2.8077809,
    },
    viewBounds: {
      west: 136.2,
      south: -6.5,
      east: 139.2,
      north: -4.1,
    },
  },

  jezero: {
    id: "jezero",
    name: "Jezero Crater",
    description:
      "An ancient lake basin explored by NASA's Perseverance rover.",
    latitude: 18.4,
    longitude: 77.6,
    imageryLayer:
      "JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd",
    imageryDescription: "NASA HiRISE regional mosaic · 25 cm/pixel source",
    zoom: 11,
    bounds: {
      west: 77.2229331,
      south: 18.3067994,
      east: 77.583964,
      north: 18.669315,
    },
    viewBounds: {
      west: 77.30,
      south: 18.33,
      east: 77.57,
      north: 18.62,
    },
  },

  olympus: {
    id: "olympus",
    name: "Olympus Mons",
    description: "A giant shield volcano on Mars.",
    latitude: 18.65,
    longitude: -133.8,
    imageryLayer: "olympus_mons.eq",
    imageryDescription: "NASA CTX regional mosaic",
    zoom: 6,
    bounds: {
      west: -136,
      south: 12,
      east: -124,
      north: 24,
    },
    viewBounds: {
      west: -136,
      south: 16,
      east: -131,
      north: 21,
    },
  },
};

// ---------------------------------------------------------------------
// NASA Mars Trek regional imagery WMTS
// ---------------------------------------------------------------------

const NASA_MARS_WMTS_BASE =
  "https://trek.nasa.gov/tiles/Mars/EQ";

const WMTS_STYLE = "default";
const WMTS_MATRIX_SET = "default028mm";
const WMTS_TILE_SIZE = 256;

type MarsTile = {
  row: number;
  col: number;
  url: string;
};

function getMarsRegionTiles(region: MarsRegion): MarsTile[] {
  const matrixWidth = 2 ** (region.zoom + 1);
  const matrixHeight = 2 ** region.zoom;

  const { west, south, east, north } = region.viewBounds;

  const minCol = Math.max(
    0,
    Math.min(
      matrixWidth - 1,
      Math.floor(((west + 180) / 360) * matrixWidth)
    )
  );

  const maxCol = Math.max(
    0,
    Math.min(
      matrixWidth - 1,
      Math.floor(((east + 180) / 360) * matrixWidth)
    )
  );

  const minRow = Math.max(
    0,
    Math.min(
      matrixHeight - 1,
      Math.floor(((90 - north) / 180) * matrixHeight)
    )
  );

  const maxRow = Math.max(
    0,
    Math.min(
      matrixHeight - 1,
      Math.floor(((90 - south) / 180) * matrixHeight)
    )
  );

  const tiles: MarsTile[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const url =
        `${NASA_MARS_WMTS_BASE}/` +
        `${region.imageryLayer}/` +
        `1.0.0//${WMTS_STYLE}/` +
        `${WMTS_MATRIX_SET}/` +
        `${region.zoom}/` +
        `${row}/${col}.png`;

      tiles.push({ row, col, url });
    }
  }

  return tiles;
}

// ---------------------------------------------------------------------
// NASA Viking global color mosaic WMTS
// ---------------------------------------------------------------------

const NASA_VIKING_WMTS_BASE =
  "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m";

const VIKING_STYLE = "default";
const VIKING_MATRIX_SET = "default028mm";
const VIKING_TILE_SIZE = 256;
const VIKING_ZOOM = 6;

type VikingTile = {
  row: number;
  col: number;
  zoom: number;
  url: string;
};

function getVikingRegionTiles(region: MarsRegion): VikingTile[] {
  const zoom = VIKING_ZOOM;

  const matrixWidth = 2 ** (zoom + 1);
  const matrixHeight = 2 ** zoom;

  const { west, south, east, north } = region.viewBounds;

  const minCol = Math.max(
    0,
    Math.min(
      matrixWidth - 1,
      Math.floor(((west + 180) / 360) * matrixWidth)
    )
  );

  const maxCol = Math.max(
    0,
    Math.min(
      matrixWidth - 1,
      Math.floor(((east + 180) / 360) * matrixWidth)
    )
  );

  const minRow = Math.max(
    0,
    Math.min(
      matrixHeight - 1,
      Math.floor(((90 - north) / 180) * matrixHeight)
    )
  );

  const maxRow = Math.max(
    0,
    Math.min(
      matrixHeight - 1,
      Math.floor(((90 - south) / 180) * matrixHeight)
    )
  );

  const tiles: VikingTile[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const url =
        `${NASA_VIKING_WMTS_BASE}/1.0.0/` +
        `${VIKING_STYLE}/${VIKING_MATRIX_SET}/` +
        `${zoom}/${row}/${col}.jpg`;

      tiles.push({
        row,
        col,
        zoom,
        url,
      });
    }
  }

  return tiles;
}

// ---------------------------------------------------------------------
// Shared tile-grid calculations
// ---------------------------------------------------------------------

type TileGridMetrics = {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  columns: number;
  rows: number;
};

function getTileGridMetrics(
  tiles: { row: number; col: number }[]
): TileGridMetrics {
  if (tiles.length === 0) {
    return {
      minCol: 0,
      maxCol: 0,
      minRow: 0,
      maxRow: 0,
      columns: 1,
      rows: 1,
    };
  }

  const minCol = Math.min(...tiles.map((tile) => tile.col));
  const maxCol = Math.max(...tiles.map((tile) => tile.col));
  const minRow = Math.min(...tiles.map((tile) => tile.row));
  const maxRow = Math.max(...tiles.map((tile) => tile.row));

  return {
    minCol,
    maxCol,
    minRow,
    maxRow,
    columns: Math.max(1, maxCol - minCol + 1),
    rows: Math.max(1, maxRow - minRow + 1),
  };
}

// ---------------------------------------------------------------------
// Earth-Mars analog matching
// ---------------------------------------------------------------------

function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const EARTH_MARS_PAIRS: Record<string, MarsRegionId> = {
  atacama: "gale",
  atacamadesert: "gale",
  dhofar: "gale",

  icelandichighlands: "olympus",
  icelandhighlands: "olympus",
  iceland: "olympus",
  hawaii: "olympus",
  maunakea: "olympus",

  mcmurdodryvalleys: "gale",
  mcmurdo: "gale",
  dryvalleys: "gale",
  svalbard: "gale",

  meteorcrater: "gale",
  riotinto: "jezero",
  salardeluyuni: "jezero",
  salar: "jezero",
};

function getMarsAnalogForEarthLocation(
  location: EarthLocation
): MarsRegionId | undefined {
  const normalizedId = normalizeLocation(location.id);
  const normalizedName = normalizeLocation(location.name);

  return (
    EARTH_MARS_PAIRS[normalizedId] ??
    EARTH_MARS_PAIRS[normalizedName]
  );
}

// ---------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------

type TemperatureResponse = {
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  parameter: string;
  parameter_description: string;
  unit: string;
  source: string;
  elevation_m: number | null;
  statistics: {
    average: number;
    minimum: number;
    maximum: number;
    number_of_days: number;
  };
  daily_data: {
    date: string;
    temperature: number;
  }[];
};

type MarsElevationResponse = {
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  unit?: string;
  dataset?: string;
  resolution?: string;
  source?: string;
  message?: string;
};

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------

export default function Home() {
  const [selectedLocation, setSelectedLocation] =
    useState<EarthLocation | null>(null);

  const [expandedPlanet, setExpandedPlanet] =
    useState<Planet | null>(null);

  const [selectedMarsRegion, setSelectedMarsRegion] =
    useState<MarsRegionId>("olympus");

  const [marsImageMode, setMarsImageMode] =
    useState<MarsImageMode>("color");

  const marsRegion = MARS_REGIONS[selectedMarsRegion];

  const marsTiles = getMarsRegionTiles(marsRegion);
  const vikingTiles = getVikingRegionTiles(marsRegion);

  const marsGrid = getTileGridMetrics(marsTiles);
  const vikingGrid = getTileGridMetrics(vikingTiles);

  const [temperatureData, setTemperatureData] =
    useState<TemperatureResponse | null>(null);

  const [temperatureLoading, setTemperatureLoading] =
    useState(false);

  const [temperatureError, setTemperatureError] =
    useState<string | null>(null);

  const [marsElevationData, setMarsElevationData] =
    useState<MarsElevationResponse | null>(null);

  const [marsLoading, setMarsLoading] = useState(false);

  const [marsError, setMarsError] =
    useState<string | null>(null);

  const [failedVikingTiles, setFailedVikingTiles] =
    useState<string[]>([]);

  const [failedRegionalTiles, setFailedRegionalTiles] =
    useState<string[]>([]);

  const isComparing = selectedLocation !== null;

  // -------------------------------------------------------------------
  // Event handlers for Mars selectors
  // -------------------------------------------------------------------

  function handleMarsRegionChange(regionId: MarsRegionId) {
    setSelectedMarsRegion(regionId);
    setFailedVikingTiles([]);
    setFailedRegionalTiles([]);
  }

  function handleMarsImageModeChange(mode: MarsImageMode) {
    setMarsImageMode(mode);
    setFailedVikingTiles([]);
    setFailedRegionalTiles([]);
  }

  // -------------------------------------------------------------------
  // NASA POWER temperature data
  // -------------------------------------------------------------------

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    const location = selectedLocation;
    const controller = new AbortController();

    async function fetchTemperature() {
      setTemperatureLoading(true);
      setTemperatureData(null);
      setTemperatureError(null);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8000";

        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          location: location.name,
          start: "20240101",
          end: "20240107",
        });

        const response = await fetch(
          `${apiUrl}/api/v1/earth/temperature?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.detail ||
              `Backend returned HTTP ${response.status}`
          );
        }

        const result: TemperatureResponse =
          await response.json();

        if (
          !result.statistics ||
          !Array.isArray(result.daily_data) ||
          result.daily_data.length === 0
        ) {
          throw new Error(
            "NASA POWER returned an unexpected or empty response."
          );
        }

        console.log("NASA POWER response:", result);
        setTemperatureData(result);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setTemperatureError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve NASA data."
        );
      } finally {
        if (!controller.signal.aborted) {
          setTemperatureLoading(false);
        }
      }
    }

    fetchTemperature();

    return () => controller.abort();
  }, [selectedLocation]);

  // -------------------------------------------------------------------
  // MOLA elevation data for the selected Mars region
  // -------------------------------------------------------------------

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    const controller = new AbortController();

    async function fetchMarsElevation() {
      setMarsLoading(true);
      setMarsElevationData(null);
      setMarsError(null);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8000";

        const params = new URLSearchParams({
          latitude: String(marsRegion.latitude),
          longitude: String(marsRegion.longitude),
        });

        const response = await fetch(
          `${apiUrl}/api/v1/mars/elevation?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.detail ||
              `Backend returned HTTP ${response.status}`
          );
        }

        const result: MarsElevationResponse =
          await response.json();

        if (
          typeof result.elevation_m !== "number" &&
          result.elevation_m !== null
        ) {
          throw new Error(
            "MOLA returned an unexpected elevation value."
          );
        }

        console.log("MOLA response:", result);
        setMarsElevationData(result);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setMarsError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve Mars elevation data."
        );
      } finally {
        if (!controller.signal.aborted) {
          setMarsLoading(false);
        }
      }
    }

    fetchMarsElevation();

    return () => controller.abort();
  }, [
    selectedLocation,
    selectedMarsRegion,
    marsRegion.latitude,
    marsRegion.longitude,
  ]);

  // -------------------------------------------------------------------
  // NASA GIBS Earth satellite imagery
  // -------------------------------------------------------------------

  function getEarthImageUrl() {
    if (!selectedLocation) return "";

    const isHawaii =
      normalizeLocation(selectedLocation.id) === "hawaii" ||
      normalizeLocation(selectedLocation.name) === "hawaii";

    const latitude = isHawaii
      ? 19.45
      : selectedLocation.latitude;

    const longitude = isHawaii
      ? -155.45
      : selectedLocation.longitude;

    const latitudeSpan = isHawaii ? 0.65 : 1.5;

    const imageWidth = 1200;
    const imageHeight = 700;

    const cosLatitude = Math.max(
      Math.cos((latitude * Math.PI) / 180),
      0.15
    );

    const longitudeSpan =
      (latitudeSpan * (imageWidth / imageHeight)) /
      cosLatitude;

    const west = Math.max(-180, longitude - longitudeSpan);
    const east = Math.min(180, longitude + longitudeSpan);
    const south = Math.max(-90, latitude - latitudeSpan);
    const north = Math.min(90, latitude + latitudeSpan);

    const bbox = [west, south, east, north].join(",");

    const params = new URLSearchParams({
      SERVICE: "WMS",
      REQUEST: "GetMap",
      VERSION: "1.1.1",
      LAYERS: "MODIS_Terra_CorrectedReflectance_TrueColor",
      STYLES: "",
      FORMAT: "image/jpeg",
      SRS: "EPSG:4326",
      BBOX: bbox,
      WIDTH: String(imageWidth),
      HEIGHT: String(imageHeight),
      TIME: "2024-07-15",
    });

    return (
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?" +
      params.toString()
    );
  }

  // -------------------------------------------------------------------
  // Planet data
  // -------------------------------------------------------------------

  const planetData = {
    earth: {
      name: selectedLocation?.name ?? "Earth Location",
      subtitle: "Earth reference location",
      background: "bg-[#101c32]",
      description:
        selectedLocation?.description ?? "Earth reference region.",
      coordinates: selectedLocation
        ? `${selectedLocation.latitude.toFixed(3)}°, ${selectedLocation.longitude.toFixed(3)}°`
        : "Awaiting location",
      imageLabel: "NASA Earth satellite imagery",
    },

    mars: {
      name: marsRegion.name,
      subtitle:
        marsImageMode === "color"
          ? "NASA Viking global color mosaic"
          : "NASA regional imagery · MOLA topography",
      background: "bg-[#211512]",
      description: marsRegion.description,
      coordinates: `${marsRegion.latitude.toFixed(3)}°, ${marsRegion.longitude.toFixed(3)}°`,
      imageLabel:
        marsImageMode === "color"
          ? "NASA Viking color mosaic"
          : "NASA Mars Trek regional imagery",
    },
  };

  const planets: Planet[] = ["earth", "mars"];

  // -------------------------------------------------------------------
  // Planet card renderer
  // -------------------------------------------------------------------

  function renderPlanet(planet: Planet, large = false) {
    const data = planetData[planet];

    const colorClasses = {
      earth: "border-cyan-400/30 text-cyan-400",
      mars: "border-red-400/30 text-red-400",
    };

    return (
      <div
        key={planet}
        className={`group min-w-0 w-full overflow-hidden rounded-2xl border bg-white/[0.03] text-left transition-all duration-500 hover:border-cyan-400/60 hover:bg-white/[0.06] ${
          colorClasses[planet].split(" ")[0]
        }`}
      >
        <button
          type="button"
          onClick={() => setExpandedPlanet(planet)}
          aria-label={`Expand ${planet} details`}
          className="flex w-full items-center justify-between gap-2 p-3 text-left transition hover:bg-white/[0.03] md:p-4"
        >
          <div>
            <h3
              className={`text-sm font-bold tracking-wider md:text-base ${
                colorClasses[planet].split(" ")[1]
              }`}
            >
              {planet.toUpperCase()}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {data.subtitle}
            </p>
          </div>

          <span className="text-xs text-slate-500 transition group-hover:text-cyan-400">
            EXPAND ↗
          </span>
        </button>

        <div
          className={`relative overflow-hidden ${
            large
              ? "h-[320px] md:h-[420px]"
              : "h-[150px] md:h-[190px]"
          } ${data.background}`}
        >
          {planet === "earth" ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-center text-xs text-slate-500">
                  {data.imageLabel}
                </p>
              </div>

              {selectedLocation && (
                <img
                  src={getEarthImageUrl()}
                  alt={`NASA satellite imagery of ${selectedLocation.name}`}
                  loading={large ? "eager" : "lazy"}
                  decoding="async"
                  className="relative z-10 h-full w-full object-cover"
                  onError={(event) => {
                    console.error(
                      "NASA GIBS Earth image failed:",
                      event.currentTarget.src
                    );

                    event.currentTarget.style.display = "none";
                  }}
                  onLoad={(event) => {
                    console.log(
                      "NASA GIBS Earth image loaded:",
                      event.currentTarget.naturalWidth,
                      event.currentTarget.naturalHeight
                    );
                  }}
                />
              )}

              <div className="absolute bottom-2 left-2 z-20 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                NASA GIBS · MODIS Terra · 2024-07-15
              </div>
            </>
          ) : (
            <>
              {marsImageMode === "color" ? (
                <div
                  className="absolute inset-0 grid h-full w-full overflow-hidden bg-[#211512]"
                  style={{
                    gridTemplateColumns: `repeat(${vikingGrid.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${vikingGrid.rows}, minmax(0, 1fr))`,
                  }}
                >
                  {vikingTiles.map((tile) => (
                    <img
                      key={`viking-${selectedMarsRegion}-${tile.row}-${tile.col}`}
                      src={tile.url}
                      alt={`NASA Viking color mosaic tile for ${marsRegion.name}, row ${tile.row}, column ${tile.col}`}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="block h-full w-full object-fill"
                      style={{
                        gridColumn:
                          tile.col - vikingGrid.minCol + 1,
                        gridRow:
                          tile.row - vikingGrid.minRow + 1,
                        minWidth: 0,
                        minHeight: 0,
                      }}
                      onError={() => {
                        setFailedVikingTiles((previous) =>
                          previous.includes(tile.url)
                            ? previous
                            : [...previous, tile.url]
                        );

                        console.error(
                          "Viking tile failed to load:",
                          tile.url
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="absolute inset-0 grid h-full w-full overflow-hidden bg-[#211512]"
                  style={{
                    gridTemplateColumns: `repeat(${marsGrid.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${marsGrid.rows}, minmax(0, 1fr))`,
                  }}
                >
                  {marsTiles.map((tile) => (
                    <img
                      key={`regional-${selectedMarsRegion}-${tile.row}-${tile.col}`}
                      src={tile.url}
                      alt={`${marsRegion.name} NASA regional tile, row ${tile.row}, column ${tile.col}`}
                      loading={large ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="block h-full w-full object-fill"
                      style={{
                        gridColumn:
                          tile.col - marsGrid.minCol + 1,
                        gridRow:
                          tile.row - marsGrid.minRow + 1,
                        minWidth: 0,
                        minHeight: 0,
                      }}
                      onError={() => {
                        setFailedRegionalTiles((previous) =>
                          previous.includes(tile.url)
                            ? previous
                            : [...previous, tile.url]
                        );

                        console.error(
                          "Regional Mars tile failed to load:",
                          tile.url
                        );
                      }}
                    />
                  ))}
                </div>
              )}

              {marsImageMode === "color" &&
                failedVikingTiles.length > 0 && (
                  <div className="absolute left-2 top-2 z-30 max-w-[90%] rounded-lg border border-red-400/40 bg-black/85 p-2 text-[10px] text-red-300">
                    {failedVikingTiles.length} Viking tile(s) failed.
                    Check the browser console for their URLs.
                  </div>
                )}

              {marsImageMode === "regional" &&
                failedRegionalTiles.length > 0 && (
                  <div className="absolute left-2 top-2 z-30 max-w-[90%] rounded-lg border border-red-400/40 bg-black/85 p-2 text-[10px] text-red-300">
                    {failedRegionalTiles.length} regional tile(s) failed.
                    Check the browser console for their URLs.
                  </div>
                )}

              <div className="absolute bottom-2 left-2 z-20 rounded bg-black/75 px-2 py-1 text-[10px] text-white">
                {marsImageMode === "color"
                  ? "NASA Viking MDIM 2.1 · Global color mosaic"
                  : `NASA Mars Trek · ${marsRegion.imageryDescription}`}
              </div>

              <div className="absolute right-2 top-2 z-20 rounded bg-black/75 px-2 py-1 text-[10px] text-white">
                WMTS Z
                {marsImageMode === "color"
                  ? VIKING_ZOOM
                  : marsRegion.zoom}
              </div>
            </>
          )}
        </div>

        <div className="p-3 md:p-4">
          <h4 className="font-semibold text-white">
            {data.name}
          </h4>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {data.description}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Coordinates: {data.coordinates}
          </p>

          {planet === "mars" && (
            <>
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs tracking-wider text-red-300">
                    MOLA ELEVATION
                  </p>

                  <span className="text-[10px] text-slate-500">
                    NASA PDS
                  </span>
                </div>

                {marsLoading ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />

                    <p className="text-xs text-slate-400">
                      Loading Mars topography...
                    </p>
                  </div>
                ) : marsError ? (
                  <p className="mt-3 text-xs text-red-300">
                    {marsError}
                  </p>
                ) : marsElevationData ? (
                  <>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {marsElevationData.elevation_m !== null
                        ? `${marsElevationData.elevation_m.toLocaleString()} m`
                        : "N/A"}
                    </p>

                    <p className="mt-2 text-[10px] text-slate-500">
                      Dataset: {marsElevationData.dataset}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Resolution: {marsElevationData.resolution}
                    </p>

                    {marsElevationData.message && (
                      <p className="mt-2 text-xs text-slate-400">
                        {marsElevationData.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Waiting for MOLA data...
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-slate-300">
                  Imagery information
                </p>

                <p className="mt-2 text-[10px] text-slate-400">
                  {marsImageMode === "color"
                    ? "NASA Viking MDIM 2.1 global color mosaic"
                    : marsRegion.imageryLayer}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <p>
                    Imagery mode:{" "}
                    <span className="text-white">
                      {marsImageMode === "color"
                        ? "Color overview"
                        : "Regional detail"}
                    </span>
                  </p>

                  <p>
                    Zoom level:{" "}
                    <span className="text-white">
                      {marsImageMode === "color"
                        ? VIKING_ZOOM
                        : marsRegion.zoom}
                    </span>
                  </p>

                  <p>
                    Tile size:{" "}
                    <span className="text-white">
                      {marsImageMode === "color"
                        ? `${VIKING_TILE_SIZE} × ${VIKING_TILE_SIZE}`
                        : `${WMTS_TILE_SIZE} × ${WMTS_TILE_SIZE}`}
                    </span>
                  </p>

                  <p>
                    Image format:{" "}
                    <span className="text-white">
                      {marsImageMode === "color" ? "JPG" : "PNG"}
                    </span>
                  </p>

                  <p>
                    Tiles requested:{" "}
                    <span className="text-white">
                      {marsImageMode === "color"
                        ? vikingTiles.length
                        : marsTiles.length}
                    </span>
                  </p>

                  <p>
                    Matrix set:{" "}
                    <span className="text-white">
                      default028mm
                    </span>
                  </p>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  {marsImageMode === "color"
                    ? "The Viking mosaic provides a global color overview. Its source resolution is approximately 232 metres per pixel; it is not a high-resolution regional image."
                    : "Regional imagery uses the selected CTX or HiRISE layer. These datasets provide regional detail and are separate from the Viking global mosaic."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Temperature chart calculations
  // -------------------------------------------------------------------

  const chartValues =
    temperatureData?.daily_data.map(
      (item) => item.temperature
    ) ?? [];

  const chartMin =
    chartValues.length > 0 ? Math.min(...chartValues) : 0;

  const chartMax =
    chartValues.length > 0 ? Math.max(...chartValues) : 0;

  const chartRange = chartMax - chartMin || 1;

  const dateRange = temperatureData?.daily_data.length
    ? `${temperatureData.daily_data[0].date} – ${
        temperatureData.daily_data[
          temperatureData.daily_data.length - 1
        ].date
      }`
    : "Selected period";

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-8">
        <h1 className="text-xl font-bold tracking-wider">
          <span className="text-cyan-400">ASTRA</span> EXPLORER
        </h1>

        <span className="text-xs tracking-widest text-slate-400">
          EARTH · MOON · MARS
        </span>
      </nav>

      <section className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        {!isComparing && (
          <div className="mb-8">
            <p className="text-xs tracking-[0.35em] text-cyan-400">
              PLANETARY ANALOG DISCOVERY
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-6xl">
              Explore the{" "}
              <span className="text-cyan-400">Unknown.</span>
            </h2>

            <p className="mt-4 max-w-2xl text-slate-400">
              Discover Earth environments that may resemble
              geological and environmental conditions on the
              Moon and Mars.
            </p>
          </div>
        )}

        <div
          className={`grid gap-6 transition-all duration-700 ease-in-out ${
            isComparing
              ? "grid-cols-1 lg:grid-cols-[0.85fr_2fr]"
              : "grid-cols-1"
          }`}
        >
          <div
            className={`overflow-hidden rounded-2xl border border-white/10 bg-[#050816] transition-all duration-700 ${
              isComparing
                ? "h-[420px] lg:sticky lg:top-6 lg:h-[calc(100vh-100px)]"
                : "h-[620px]"
            }`}
          >
            <EarthGlobe
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                setExpandedPlanet(null);

                const matchingMarsRegion =
                  getMarsAnalogForEarthLocation(location);

                if (matchingMarsRegion) {
                  handleMarsRegionChange(matchingMarsRegion);
                }
              }}
            />
          </div>

          {isComparing && selectedLocation && (
            <div className="min-w-0 animate-[fadeIn_0.7s_ease-out]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.3em] text-cyan-400">
                    PLANETARY ANALOG COMPARISON
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {selectedLocation.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {selectedLocation.description}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Earth coordinates:{" "}
                    {selectedLocation.latitude.toFixed(3)}°,{" "}
                    {selectedLocation.longitude.toFixed(3)}°
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(null);
                    setExpandedPlanet(null);

                    setTemperatureData(null);
                    setTemperatureError(null);
                    setTemperatureLoading(false);

                    setMarsElevationData(null);
                    setMarsError(null);
                    setMarsLoading(false);
                  }}
                  aria-label="Close comparison"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl transition hover:border-cyan-400 hover:bg-cyan-400/10"
                >
                  ×
                </button>
              </div>

              {/* Mars region and imagery controls */}

              <section className="mb-6 rounded-2xl border border-red-400/20 bg-[#170f13] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-[0.25em] text-red-300">
                      MARS REFERENCE REGION
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      Select a Mars location
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Changing the region retrieves a new MOLA
                      elevation sample and location-specific imagery.
                    </p>
                  </div>

                  <select
                    value={selectedMarsRegion}
                    onChange={(event) =>
                      handleMarsRegionChange(
                        event.target.value as MarsRegionId
                      )
                    }
                    className="min-w-[190px] rounded-xl border border-red-400/30 bg-[#24151b] px-4 py-3 text-sm text-white outline-none transition focus:border-red-300"
                  >
                    <option value="gale">Gale Crater</option>
                    <option value="jezero">Jezero Crater</option>
                    <option value="olympus">Olympus Mons</option>
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {Object.values(MARS_REGIONS).map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() =>
                        handleMarsRegionChange(region.id)
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedMarsRegion === region.id
                          ? "border-red-400 bg-red-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-red-400/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        {region.name}
                      </p>

                      <p className="mt-2 text-[10px] text-slate-400">
                        {region.latitude.toFixed(3)}°,{" "}
                        {region.longitude.toFixed(3)}°
                      </p>

                      {selectedMarsRegion === region.id && (
                        <p className="mt-2 text-[10px] text-red-300">
                          SELECTED
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {/* Imagery mode selector */}

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold tracking-wider text-slate-300">
                    MARS IMAGERY MODE
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleMarsImageModeChange("color")
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        marsImageMode === "color"
                          ? "border-orange-400 bg-orange-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-orange-400/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        Color overview
                      </p>

                      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                        NASA Viking global color mosaic
                      </p>

                      {marsImageMode === "color" && (
                        <p className="mt-2 text-[10px] text-orange-300">
                          ACTIVE
                        </p>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleMarsImageModeChange("regional")
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        marsImageMode === "regional"
                          ? "border-red-400 bg-red-400/10"
                          : "border-white/10 bg-white/[0.03] hover:border-red-400/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        Regional detail
                      </p>

                      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                        CTX / HiRISE regional imagery
                      </p>

                      {marsImageMode === "regional" && (
                        <p className="mt-2 text-[10px] text-red-300">
                          ACTIVE
                        </p>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                    The Viking mosaic is a global color overview
                    at approximately 232 m/pixel source resolution.
                    CTX and HiRISE provide separate regional datasets.
                    These are different datasets and should not be
                    interpreted as having the same resolution.
                  </p>
                </div>
              </section>

              {expandedPlanet !== null ? (
                <div className="animate-[fadeIn_0.4s_ease-out]">
                  <div className="mb-5">
                    {renderPlanet(expandedPlanet, true)}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-wider text-slate-400">
                      OTHER PLANETARY LOCATIONS
                    </h3>

                    <button
                      type="button"
                      onClick={() => setExpandedPlanet(null)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Show all
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {planets
                      .filter(
                        (planet) => planet !== expandedPlanet
                      )
                      .map((planet) => renderPlanet(planet))}
                  </div>
                </div>
              ) : (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                  <div className="grid grid-cols-2 gap-4">
                    {renderPlanet("earth")}
                    {renderPlanet("mars")}
                  </div>
                </div>
              )}

              {/* NASA POWER environmental data */}

              <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-[#0b1224] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-[0.25em] text-cyan-400">
                      NASA POWER · ENVIRONMENTAL DATA
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-white">
                      Surface Environment
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Daily air temperature · 2 metres above surface
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    T2M · Celsius
                  </span>
                </div>

                {temperatureLoading ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />

                    <p className="mt-4 text-sm text-slate-400">
                      Retrieving NASA POWER data for{" "}
                      {selectedLocation.name}...
                    </p>
                  </div>
                ) : temperatureError ? (
                  <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm font-semibold text-red-400">
                      Unable to retrieve environmental data
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {temperatureError}
                    </p>
                  </div>
                ) : temperatureData ? (
                  <>
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-xl bg-white/[0.04] p-4">
                        <p className="text-xs text-slate-500">
                          Average
                        </p>

                        <p className="mt-2 text-2xl font-bold text-cyan-400">
                          {temperatureData.statistics.average}°C
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] p-4">
                        <p className="text-xs text-slate-500">
                          Minimum
                        </p>

                        <p className="mt-2 text-2xl font-bold text-blue-400">
                          {temperatureData.statistics.minimum}°C
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] p-4">
                        <p className="text-xs text-slate-500">
                          Maximum
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-400">
                          {temperatureData.statistics.maximum}°C
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.04] p-4">
                        <p className="text-xs text-slate-500">
                          Elevation
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                          {temperatureData.elevation_m?.toFixed(0) ??
                            "N/A"}{" "}
                          m
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="mb-5 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          Daily Temperature
                        </h4>

                        <span className="text-xs text-slate-500">
                          {dateRange}
                        </span>
                      </div>

                      <div className="flex h-48 items-end gap-2 border-b border-white/10 pb-2">
                        {temperatureData.daily_data.map((item) => {
                          const height =
                            30 +
                            ((item.temperature - chartMin) /
                              chartRange) *
                              70;

                          return (
                            <div
                              key={item.date}
                              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                            >
                              <span className="text-[10px] text-slate-300">
                                {item.temperature.toFixed(1)}°
                              </span>

                              <div
                                className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500 hover:brightness-125"
                                style={{ height: `${height}%` }}
                                title={`${item.date}: ${item.temperature}°C`}
                              />

                              <span className="text-[9px] text-slate-500">
                                {item.date.slice(6, 8)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="mt-3 text-center text-[10px] text-slate-500">
                        Daily measurements · Temperature in °C
                      </p>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-xs text-slate-400">
                        Data source: {temperatureData.source}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Parameter:{" "}
                        {temperatureData.parameter_description}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Coordinates:{" "}
                        {temperatureData.coordinates.latitude}°,{" "}
                        {temperatureData.coordinates.longitude}°
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        T2M represents air temperature at 2 metres,
                        not surface temperature. NASA POWER data
                        are based on gridded environmental datasets.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="mt-6 text-center text-sm text-slate-500">
                    Waiting for environmental data...
                  </p>
                )}
              </section>

              <p className="mt-6 text-center text-xs text-slate-600">
                Select a planetary image to explore its location.
              </p>
            </div>
          )}
        </div>

        {/* ============================================================
            MOON EXPLORER
            Independent of Earth location selection.
        ============================================================ */}

        <div
          id="moon-explorer"
          className="mt-16 border-t border-white/10 pt-12"
        >
          <MoonExplorer />
        </div>
      </section>
    </main>
  );
}
