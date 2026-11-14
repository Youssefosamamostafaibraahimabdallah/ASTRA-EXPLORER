
"use client";

import { useState } from "react";
import type { EarthLocation } from "@/components/EarthGlobe";

type MoonRegionId = "haworth" | "malapert" | "degerlache";

type MoonRegion = {
  id: MoonRegionId;
  name: string;
  featureName: string;
  description: string;
  latitude: number;
  longitude: number;
  bounds: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  earthAnalog: EarthLocation;
  analogReason: string;
  comparisonFocus: string;
};

const MOON_REGIONS: Record<MoonRegionId, MoonRegion> = {
  haworth: {
    id: "haworth",
    name: "Haworth",
    featureName: "Haworth Crater",
    description:
      "A crater in the lunar south polar region. Its permanently shadowed terrain makes it relevant to studies of extremely cold environments and potential volatile deposits.",
    latitude: -86.9,
    longitude: -4.0,
    bounds: {
      west: -16,
      east: 8,
      south: -90,
      north: -83.5,
    },
    earthAnalog: {
      id: "mcmurdo",
      name: "McMurdo Dry Valleys",
      description: "Cold polar desert · Antarctica",
      latitude: -77.5,
      longitude: 161.5,
    },
    analogReason:
      "A useful comparison for cold, dry polar terrain, exposed rock, and environmental extremes. It does not reproduce lunar vacuum or permanent shadow.",
    comparisonFocus:
      "Polar environment · cold terrain · dry surface materials",
  },

  malapert: {
    id: "malapert",
    name: "Malapert Massif",
    featureName: "Malapert Crater reference point",
    description:
      "A mountainous area near the lunar south pole. Elevated terrain is important when investigating regional topography, illumination, and possible surface operations.",
    latitude: -85.0,
    longitude: 11.4,
    bounds: {
      west: -1,
      east: 23,
      south: -90,
      north: -82.5,
    },
    earthAnalog: {
      id: "hawaii",
      name: "Hawaii Volcanic Fields",
      description: "Volcanic highlands · USA",
      latitude: 19.5,
      longitude: -155.5,
    },
    analogReason:
      "A useful comparison for rugged volcanic terrain and elevation-related surface morphology. The geological history and composition are not identical.",
    comparisonFocus:
      "Elevated terrain · slopes · volcanic surface morphology",
  },

  degerlache: {
    id: "degerlache",
    name: "de Gerlache Rim 2",
    featureName: "de Gerlache Crater reference point",
    description:
      "An updated Artemis III candidate region near the lunar south pole, associated with the rugged terrain surrounding de Gerlache.",
    latitude: -88.48,
    longitude: -88.34,
    bounds: {
      west: -100,
      east: -76,
      south: -90,
      north: -84,
    },
    earthAnalog: {
      id: "iceland",
      name: "Iceland Highlands",
      description: "Volcanic and glacial terrain · Iceland",
      latitude: 64.5,
      longitude: -18.5,
    },
    analogReason:
      "A useful comparison for rugged volcanic and glacially modified terrain. It does not reproduce the Moon's impact history or illumination conditions.",
    comparisonFocus:
      "Rugged terrain · volcanic morphology · surface geology",
  },
};

const ARTEMIS_CANDIDATE_REGIONS = [
  "Peak near Cabeus B",
  "Haworth",
  "Malapert Massif",
  "Mons Mouton Plateau",
  "Mons Mouton",
  "Nobile Rim 1",
  "Nobile Rim 2",
  "de Gerlache Rim 2",
  "Slater Plain",
];

const MOON_TREK_BASE =
  "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02";

const MOON_ZOOM = 3;

type MoonTile = {
  row: number;
  col: number;
  url: string;
  markerX: number;
  markerY: number;
};

/**
 * Select one NASA Moon Trek tile containing the reference coordinates.
 *
 * The global equirectangular tile matrix has:
 * - 2^(zoom + 1) columns
 * - 2^zoom rows
 *
 * This component deliberately loads one tile per region instead of
 * stitching several adjacent tiles into a single image.
 */
function getMoonTile(region: MoonRegion): MoonTile {
  const matrixWidth = 2 ** (MOON_ZOOM + 1);
  const matrixHeight = 2 ** MOON_ZOOM;

  const latitude = Math.max(
    -89.999,
    Math.min(89.999, region.latitude)
  );

  const longitude = Math.max(
    -180,
    Math.min(180, region.longitude)
  );

  const x = ((longitude + 180) / 360) * matrixWidth;
  const y = ((90 - latitude) / 180) * matrixHeight;

  const col = Math.max(
    0,
    Math.min(matrixWidth - 1, Math.floor(x))
  );

  const row = Math.max(
    0,
    Math.min(matrixHeight - 1, Math.floor(y))
  );

  const markerX = (x - col) * 100;
  const markerY = (y - row) * 100;

  const url =
    `${MOON_TREK_BASE}/1.0.0/` +
    `default/default028mm/` +
    `${MOON_ZOOM}/${row}/${col}.jpg`;

  return {
    row,
    col,
    url,
    markerX,
    markerY,
  };
}

export default function MoonExplorer() {
  const [selectedId, setSelectedId] =
    useState<MoonRegionId>("haworth");

  const [failedTile, setFailedTile] = useState<string | null>(
    null
  );

  const region = MOON_REGIONS[selectedId];

  const tile = getMoonTile(region);

  function selectRegion(nextId: MoonRegionId) {
    setSelectedId(nextId);
    setFailedTile(null);
  }

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-slate-400/20 bg-[#101522]">
      {/* Header */}

      <div className="border-b border-white/10 bg-gradient-to-r from-[#171d2c] to-[#111827] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-slate-300">
              LUNAR SOUTH POLE EXPLORATION
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Moon Base Analog Discovery
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Explore NASA&apos;s updated Artemis III candidate regions
              and compare selected lunar terrain with proposed
              terrestrial analog environments.
            </p>
          </div>

          <span className="rounded-full border border-slate-400/20 bg-white/5 px-3 py-2 text-xs text-slate-300">
            NASA LRO · Moon Trek
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Lunar region selector and imagery */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-wider text-slate-400">
                SELECT LUNAR REGION
              </p>

              <h3 className="mt-1 text-xl font-bold text-white">
                {region.name}
              </h3>
            </div>

            <select
              value={selectedId}
              onChange={(event) =>
                selectRegion(event.target.value as MoonRegionId)
              }
              className="min-w-[190px] rounded-xl border border-slate-500/40 bg-[#202838] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="haworth">Haworth</option>
              <option value="malapert">Malapert Massif</option>
              <option value="degerlache">de Gerlache Rim 2</option>
            </select>
          </div>

          {/* One image tile per lunar region */}

          <div className="relative mt-4 aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#080c16]">
            {failedTile !== tile.url ? (
              <>
                <img
                  key={tile.url}
                  src={tile.url}
                  alt={`NASA LRO lunar surface imagery near ${region.name}`}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 block h-full w-full object-contain"
                  onError={() => {
                    console.error(
                      "Moon Trek tile failed:",
                      tile.url
                    );
                    setFailedTile(tile.url);
                  }}
                />

                {/* Reference-coordinate marker */}

                <div
                  className="pointer-events-none absolute z-10"
                  style={{
                    left: `${tile.markerX}%`,
                    top: `${tile.markerY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative flex h-7 w-7 items-center justify-center">
                    <span className="absolute h-7 w-7 animate-ping rounded-full bg-cyan-400/40" />

                    <span className="relative h-3 w-3 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                  </div>
                </div>

                <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-cyan-400/30 bg-black/75 px-3 py-2">
                  <p className="text-[10px] font-semibold tracking-wider text-cyan-300">
                    REFERENCE LOCATION
                  </p>

                  <p className="mt-1 text-xs text-white">
                    {region.name}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                  <span className="text-2xl text-amber-300">
                    !
                  </span>
                </div>

                <h4 className="mt-4 text-base font-semibold text-white">
                  Image unavailable
                </h4>

                <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
                  NASA Moon Trek did not return this image tile.
                  This may indicate missing image coverage or a
                  temporary service issue.
                </p>

                <button
                  type="button"
                  onClick={() => setFailedTile(null)}
                  className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  Retry image
                </button>
              </div>
            )}

            {/* Image information */}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-black/75 px-3 py-2">
              <span className="text-[10px] text-white">
                NASA LRO · WAC Global Mosaic
              </span>

              <span className="text-[10px] text-slate-300">
                WMTS Z{MOON_ZOOM}
              </span>
            </div>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            Imagery: NASA Lunar Reconnaissance Orbiter Wide Angle
            Camera global mosaic, served through NASA Moon Trek.
            The image shows the tile containing the reference
            coordinates. The marker indicates the approximate
            reference position within that tile. This is not a
            live illumination or elevation map.
          </p>

          {/* Tile diagnostics */}

          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] text-slate-500">
              IMAGE TILE INFORMATION
            </p>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[9px] text-slate-500">Zoom</p>
                <p className="mt-1 text-xs text-slate-300">
                  {MOON_ZOOM}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-500">Tile row</p>
                <p className="mt-1 text-xs text-slate-300">
                  {tile.row}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-500">Tile column</p>
                <p className="mt-1 text-xs text-slate-300">
                  {tile.col}
                </p>
              </div>
            </div>
          </div>

          {/* Location information */}

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs tracking-wider text-slate-400">
              LUNAR REFERENCE LOCATION
            </p>

            <h4 className="mt-2 text-lg font-semibold text-white">
              {region.featureName}
            </h4>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {region.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/20 p-3">
                <p className="text-[10px] text-slate-500">
                  Latitude
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {Math.abs(region.latitude).toFixed(3)}° S
                </p>
              </div>

              <div className="rounded-lg bg-black/20 p-3">
                <p className="text-[10px] text-slate-500">
                  Longitude
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {Math.abs(region.longitude).toFixed(3)}°{" "}
                  {region.longitude < 0 ? "W" : "E"}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-amber-300/80">
              Coordinate note: these are reference-feature center
              coordinates from the USGS Gazetteer, not surveyed
              centroids of the Artemis candidate-region boundaries.
            </p>
          </div>
        </div>

        {/* Earth analog comparison */}

        <div className="min-w-0">
          <p className="text-xs tracking-[0.25em] text-cyan-400">
            PROPOSED EARTH ANALOG
          </p>

          <h3 className="mt-2 text-xl font-bold text-white">
            {region.earthAnalog.name}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {region.earthAnalog.description}
          </p>

          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
            <p className="text-xs font-semibold text-cyan-300">
              WHY THIS COMPARISON?
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {region.analogReason}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">
              COMPARISON DIMENSIONS
            </p>

            <p className="mt-2 text-sm font-medium leading-relaxed text-white">
              {region.comparisonFocus}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-500">
                  Earth latitude
                </p>

                <p className="mt-1 text-sm text-white">
                  {Math.abs(region.earthAnalog.latitude).toFixed(3)}°{" "}
                  {region.earthAnalog.latitude < 0 ? "S" : "N"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-500">
                  Earth longitude
                </p>

                <p className="mt-1 text-sm text-white">
                  {Math.abs(region.earthAnalog.longitude).toFixed(3)}°{" "}
                  {region.earthAnalog.longitude < 0 ? "W" : "E"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
            <p className="text-xs font-semibold text-amber-300">
              SCIENTIFIC LIMITATION
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              No Earth environment reproduces the Moon&apos;s vacuum,
              gravity, radiation exposure, impact history, or
              polar illumination cycle. This is a comparison of
              selected terrain and environmental characteristics,
              not a claim of complete equivalence.
            </p>
          </div>
        </div>
      </div>

      {/* Updated NASA candidate list */}

      <div className="border-t border-white/10 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-wider text-white">
            NASA ARTEMIS III · UPDATED CANDIDATE REGIONS
          </h3>

          <span className="text-[10px] text-slate-500">
            October 2024 update
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ARTEMIS_CANDIDATE_REGIONS.map((name) => {
            const isDetailed =
              (name === "Haworth" && selectedId === "haworth") ||
              (name === "Malapert Massif" &&
                selectedId === "malapert") ||
              (name === "de Gerlache Rim 2" &&
                selectedId === "degerlache");

            return (
              <div
                key={name}
                className={`rounded-lg border p-3 text-xs ${
                  isDetailed
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.02] text-slate-400"
                }`}
              >
                {name}

                {isDetailed && (
                  <span className="mt-1 block text-[9px] text-cyan-400">
                    CURRENTLY VIEWING
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
          NASA identifies these as candidate landing regions, not
          confirmed permanent-base locations. Three regions currently
          have detailed reference-feature comparisons in this module.
        </p>
      </div>
    </section>
  );
}
