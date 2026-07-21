<script lang="ts">
  import "leaflet/dist/leaflet.css";
  import type { Map as LeafletMap, Marker as LeafletMarker, Polygon as LeafletPolygon } from "leaflet";
  import markerIconUrl from "leaflet/dist/images/marker-icon.png";
  import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
  import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
  import { onMount } from "svelte";
  import eastBoundIcon from "$lib/assets/icons/east-bound.svg";
  import northBoundIcon from "$lib/assets/icons/north-bound.svg";
  import southBoundIcon from "$lib/assets/icons/south-bound.svg";
  import westBoundIcon from "$lib/assets/icons/west-bound.svg";
  import { type Coordinate, type Extremes, type ParsedPolygon, type ParsedPolygonFile, swapXY, transformCoordinates } from "$lib/polyparser/polyparser";
  import Loading from "./Loading.svelte";

  type Props = {
    polygons?: ParsedPolygonFile;
    height?: string;
    center?: Coordinate;
    lineColor?: string;
    fillColor?: string;
    zoom?: number;
  };

  let { polygons, height = "400px", center = [59.2654381, 10.4159352], lineColor = "#007ACC", fillColor = "#007ACC", zoom = 14 }: Props = $props();

  let mapContainer: HTMLDivElement | undefined = $state();
  let isMapReady = $state(false);
  let map: LeafletMap | undefined;
  let polygonLayers: LeafletPolygon[] = [];
  let extremeMarkers: LeafletMarker[] = [];

  type ParsedPolygonsForMap = {
    polygons: Array<{ vertices: Coordinate[] }>;
    extremes: Extremes;
  };

  const parsePolygonsForMap = (input: ParsedPolygonFile): ParsedPolygonsForMap => {
    const transformedPolygons = input.polygons.map((polygon: ParsedPolygon) => ({
      vertices: polygon.vertices.map((vertice: Coordinate) => swapXY(transformCoordinates(polygon.EPSG, undefined, vertice)))
    }));

    const extremes: Extremes = {
      north: swapXY(transformCoordinates(input.EPSG, undefined, input.extremes.north)),
      west: swapXY(transformCoordinates(input.EPSG, undefined, input.extremes.west)),
      east: swapXY(transformCoordinates(input.EPSG, undefined, input.extremes.east)),
      south: swapXY(transformCoordinates(input.EPSG, undefined, input.extremes.south))
    };

    return { polygons: transformedPolygons, extremes };
  };

  const invalidateMapSize = (extremes: Extremes | undefined): void => {
    if (!map) {
      return;
    }
    if (extremes) {
      map.fitBounds([extremes.north, extremes.west, extremes.east, extremes.south], { padding: [-20, -20] });
    }
    map.invalidateSize();
  };

  const renderLayers = async (): Promise<void> => {
    if (!map || !polygons) {
      return;
    }

    const L = await import("leaflet");

    for (const layer of polygonLayers) {
      layer.remove();
    }
    for (const marker of extremeMarkers) {
      marker.remove();
    }
    polygonLayers = [];
    extremeMarkers = [];

    const parsed = parsePolygonsForMap(polygons);

    for (const polygon of parsed.polygons) {
      polygonLayers.push(L.polygon(polygon.vertices, { color: lineColor, fillColor }).addTo(map));
    }

    const BOUND_ICON_SIZE: [number, number] = [30, 30];
    const boundIcons: Array<{ position: Coordinate; iconUrl: string; iconAnchor: [number, number] }> = [
      { position: parsed.extremes.north, iconUrl: northBoundIcon, iconAnchor: [15, 35] },
      { position: parsed.extremes.south, iconUrl: southBoundIcon, iconAnchor: [15, -5] },
      { position: parsed.extremes.east, iconUrl: eastBoundIcon, iconAnchor: [-5, 15] },
      { position: parsed.extremes.west, iconUrl: westBoundIcon, iconAnchor: [35, 15] }
    ];

    for (const { position, iconUrl, iconAnchor } of boundIcons) {
      extremeMarkers.push(L.marker(position, { icon: L.icon({ iconUrl, iconSize: BOUND_ICON_SIZE, iconAnchor }) }).addTo(map));
    }

    invalidateMapSize(parsed.extremes);
  };

  onMount(() => {
    let disposed = false;

    (async () => {
      const L = await import("leaflet");

      // Bundlers break Leaflet's default icon URL lookup - point it at the bundled asset URLs instead.
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIconRetinaUrl,
        iconUrl: markerIconUrl,
        shadowUrl: markerShadowUrl
      });

      if (disposed || !mapContainer) {
        return;
      }

      map = L.map(mapContainer, { center, zoom });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a target="_blank" href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      isMapReady = true;
      setTimeout(() => invalidateMapSize(undefined), 100);
    })();

    return () => {
      disposed = true;
      map?.remove();
    };
  });

  $effect(() => {
    if (!isMapReady) {
      return;
    }
    polygons;
    lineColor;
    fillColor;
    void renderLayers();
  });
</script>

<div class="map-wrapper" style="height: 100%; min-height: {height}; width: 100%;">
  <div bind:this={mapContainer} class="map-container"></div>
  {#if !isMapReady}
    <div class="loading-overlay">
      <Loading title="Forbereder kart" />
    </div>
  {/if}
</div>

<style>
  .map-wrapper {
    position: relative;
    box-shadow: 0 1px 5px 1px #888888;
  }

  .map-container {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.75);
    z-index: 2;
  }
</style>
