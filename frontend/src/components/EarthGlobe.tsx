
"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Cartesian2,
  Entity,
  Viewer,
  ScreenSpaceEventHandler,
} from "cesium";

export type EarthLocation = {
  id: string;
  name: string;
  description: string;
  longitude: number;
  latitude: number;
};

const locations: EarthLocation[] = [
  {
    id: "atacama",
    name: "Atacama Desert",
    description: "Arid volcanic terrain · Chile",
    longitude: -69.25,
    latitude: -24.5,
  },
  {
    id: "iceland",
    name: "Iceland Highlands",
    description: "Volcanic and glacial terrain · Iceland",
    longitude: -18.5,
    latitude: 64.5,
  },
  {
    id: "hawaii",
    name: "Hawaii Volcanic Fields",
    description: "Basaltic volcanic terrain · USA",
    longitude: -155.5,
    latitude: 19.5,
  },
  {
  id: "mcmurdo",
  name: "McMurdo Dry Valleys",
  description: "Cold polar desert · Antarctica",
  longitude: 161.5,
  latitude: -77.5,
},
];

type EarthGlobeProps = {
  onLocationSelect?: (location: EarthLocation) => void;
};

export default function EarthGlobe({
  onLocationSelect,
}: EarthGlobeProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onLocationSelect);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    let viewer: Viewer | undefined;
    let handler: ScreenSpaceEventHandler | undefined;
    let cancelled = false;

    async function initializeGlobe() {
      try {
        if (!globeRef.current) return;

        // Configure Cesium static assets.
        (
          window as unknown as {
            CESIUM_BASE_URL: string;
          }
        ).CESIUM_BASE_URL = "/cesium/";

        // Import Cesium only in the browser.
        const Cesium = await import("cesium");

        if (cancelled || !globeRef.current) return;

        // Create the Earth viewer.
        viewer = new Cesium.Viewer(globeRef.current, {
          baseLayer: false,

          terrainProvider: new Cesium.EllipsoidTerrainProvider(),

          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,

          skyBox: false,
          skyAtmosphere: false,

          contextOptions: {
            webgl: {
              alpha: true,
            },
          },
        });

        // NASA GIBS Blue Marble imagery.
        const imageryProvider =
          new Cesium.WebMapTileServiceImageryProvider({
            url:
              "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/" +
              "BlueMarble_NextGeneration/default/" +
              "{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",

            layer: "BlueMarble_NextGeneration",
            style: "default",

            tileMatrixSetID: "GoogleMapsCompatible_Level8",

            format: "image/jpeg",

            tilingScheme: new Cesium.WebMercatorTilingScheme(),

            tileMatrixLabels: [
              "0",
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
            ],

            maximumLevel: 8,

            credit: "NASA GIBS - Blue Marble",
          });

        // Imagery error diagnostics.
        imageryProvider.errorEvent.addEventListener((imageryError) => {
          console.error("NASA GIBS imagery error:", imageryError);

          console.table({
            message: imageryError.message,
            url: imageryError.url,
            timesRetried: imageryError.timesRetried,
            retry: imageryError.retry,
          });
        });

        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(imageryProvider);

        // Globe appearance.
        viewer.scene.backgroundColor =
          Cesium.Color.fromCssColorString("#050816");

        viewer.scene.globe.enableLighting = false;

        viewer.scene.globe.baseColor =
          Cesium.Color.fromCssColorString("#101c32");

        viewer.scene.globe.showGroundAtmosphere = false;

        // Initial camera position.
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            15,
            20,
            22000000
          ),
        });

        // Add research markers.
        locations.forEach((location) => {
          viewer!.entities.add({
            id: location.id,

            position: Cesium.Cartesian3.fromDegrees(
              location.longitude,
              location.latitude
            ),

            properties: {
              locationId: location.id,
            },

            point: {
              pixelSize: 15,

              color: Cesium.Color.fromCssColorString("#22d3ee"),

              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,

              disableDepthTestDistance:
                Number.POSITIVE_INFINITY,
            },

            label: {
              text: location.name,
              font: "13px sans-serif",

              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,

              style: Cesium.LabelStyle.FILL_AND_OUTLINE,

              pixelOffset: new Cesium.Cartesian2(0, -24),

              disableDepthTestDistance:
                Number.POSITIVE_INFINITY,
            },
          });
        });

        // Handle marker clicks.
        handler = new Cesium.ScreenSpaceEventHandler(
          viewer.scene.canvas
        );

        handler.setInputAction(
          (movement: { position: Cartesian2 }) => {
            if (!viewer || viewer.isDestroyed()) return;

            const picked = viewer.scene.pick(movement.position);

            if (!Cesium.defined(picked)) {
              return;
            }

            const pickedObject = picked.id as
              | Entity
              | string
              | undefined;

            const selectedId =
              typeof pickedObject === "string"
                ? pickedObject
                : pickedObject?.id;

            const selectedLocation = locations.find(
              (location) => location.id === selectedId
            );

            if (!selectedLocation) {
              return;
            }

            // Fly toward the selected region.
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                selectedLocation.longitude,
                selectedLocation.latitude,
                2800000
              ),
              duration: 1.5,
            });

            // Notify the homepage.
            onSelectRef.current?.(selectedLocation);
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        if (!cancelled) {
          setLoading(false);
          setError("");
        }
      } catch (err) {
        console.error("Cesium initialization failed:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not initialize the Earth globe."
          );

          setLoading(false);
        }
      }
    }

    initializeGlobe();

    return () => {
      cancelled = true;

      handler?.destroy();

      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div
        ref={globeRef}
        className="absolute inset-0"
      />

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050816] text-cyan-400">
          Initializing Earth...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050816] p-6 text-center text-red-400">
          {error}
        </div>
      )}

      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <p className="text-xs tracking-[0.3em] text-cyan-400">
          PLANETARY EXPLORATION
        </p>

        <h2 className="mt-2 text-xl font-bold text-white">
          EARTH
        </h2>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-xs text-slate-400">
        Select a glowing marker to explore a candidate region
      </div>
    </div>
  );
}
