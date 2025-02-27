/// <reference types="@types/google.maps" />
import { createSignal, onCleanup, createEffect, Accessor } from "solid-js";
import { Loader } from "@googlemaps/js-api-loader";
import { isServer } from "solid-js/web";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

type GoogleMap = google.maps.Map;
type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;
type MapTypeStyle = google.maps.MapTypeStyle;
type MapsEventListener = google.maps.MapsEventListener;
type Marker = google.maps.Marker;

interface GoogleMapProps {
  onLoad?: () => void;
  latLng?: LatLngLiteral;
  markerPosition?: Accessor<LatLngLiteral | null>;
}

const START_LOCATION: LatLngLiteral = { lat: 41.0437, lng: -74.2156 };

const US_WIDTH = 58;
const ONE_THIRD_US_WIDTH = US_WIDTH / 3;

const INITIAL_MAP_STYLES: MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
];

const MINIMAL_MAP_STYLES: MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.province",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
];

const ROAD_VISIBLE_STYLES: MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.province",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
];

function calculateDistance(start: LatLngLiteral, end: LatLngLiteral): number {
  const lngDiff = Math.abs(end.lng - start.lng);
  return lngDiff;
}

const loader = !isServer
  ? new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["maps", "marker"],
    })
  : null;

function smoothZoom(map: GoogleMap, targetZoom: number, currentZoom: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (currentZoom === targetZoom) {
      resolve();
      return;
    }

    const zoomingIn = currentZoom < targetZoom;
    const nextZoom = zoomingIn ? currentZoom + 1 : currentZoom - 1;

    const zoomListener: MapsEventListener = google.maps.event.addListener(map, "zoom_changed", () => {
      google.maps.event.removeListener(zoomListener);

      smoothZoom(map, targetZoom, nextZoom).then(resolve);
    });

    setTimeout(() => {
      map.setZoom(nextZoom);
    }, 80);
  });
}

export default function GoogleMap(props: GoogleMapProps) {
  if (isServer) {
    return null;
  }

  let mapContainer: HTMLDivElement | undefined;
  const [map, setMap] = createSignal<GoogleMap | undefined>();
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);
  const [startLocation, setStartLocation] = createSignal<LatLngLiteral>(START_LOCATION);
  const [currentMarker, setCurrentMarker] = createSignal<Marker | null>(null);
  const [previousMarkerPosition, setPreviousMarkerPosition] = createSignal<LatLngLiteral | null>(null);
  const [initialAnimationComplete, setInitialAnimationComplete] = createSignal(false);
  const [lastAnimatedPosition, setLastAnimatedPosition] = createSignal<LatLngLiteral | null>(null);

  createEffect(() => {
    if (mapContainer && !isServer) {
      initializeMap();
    }
  });

  createEffect(() => {
    const currentMap = map();
    const position = props.markerPosition && props.markerPosition();

    if (currentMap && position && initialAnimationComplete()) {
      const lastPosition = lastAnimatedPosition();
      if (lastPosition && lastPosition.lat === position.lat && lastPosition.lng === position.lng) {
        return;
      }

      animateToLocation(position);
    }
  });

  async function animateToLocation(destination: LatLngLiteral): Promise<void> {
    const currentMap = map();
    if (!currentMap || isAnimating() || isServer) {
      return;
    }

    setLastAnimatedPosition(destination);
    setIsAnimating(true);

    try {
      const currentCenter = currentMap.getCenter();
      if (!currentCenter) {
        throw new Error("Map center is undefined");
      }

      const distance = calculateDistance(currentCenter.toJSON(), destination);
      const isLongDistance = distance > ONE_THIRD_US_WIDTH / 2;

      if (distance < 0.1) {
        currentMap.panTo(destination);
        await new Promise<void>((resolve) => setTimeout(resolve, 500));

        dropMarkerOnMap(destination);

        setIsAnimating(false);
        return;
      }

      const maxZoom = 16;
      const minZoom = isLongDistance ? 5 : 7;

      const currentZoom = currentMap.getZoom() || maxZoom;

      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      if (currentZoom > minZoom + 2) {
        currentMap.setOptions({
          styles: MINIMAL_MAP_STYLES,
          gestureHandling: "none",
        });

        await smoothZoom(currentMap, minZoom, currentZoom);

        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }

      currentMap.panTo(destination);

      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      currentMap.setOptions({
        styles: ROAD_VISIBLE_STYLES,
      });

      await smoothZoom(currentMap, maxZoom, minZoom);

      currentMap.setOptions({
        gestureHandling: "cooperative",
      });

      dropMarkerOnMap(destination);
    } catch (error) {
      console.error("Animation error:", error);
    } finally {
      setIsAnimating(false);
    }
  }

  function dropMarkerOnMap(position: LatLngLiteral): void {
    const currentMap = map();
    if (!currentMap || isServer) return;

    const marker = currentMarker();
    if (marker) {
      marker.setMap(null);
    }

    const prevPosition = previousMarkerPosition();
    if (prevPosition && prevPosition.lat === position.lat && prevPosition.lng === position.lng) {
      if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 2100);
      }
      return;
    }

    const newMarker = new google.maps.Marker({
      position,
      map: currentMap,
      animation: google.maps.Animation.DROP,
      icon: null,
    });

    setCurrentMarker(newMarker);
    setPreviousMarkerPosition(position);

    setTimeout(() => {
      newMarker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        newMarker.setAnimation(null);
      }, 2100);
    }, 1000);
  }

  async function initializeMap(): Promise<void> {
    if (!mapContainer || isServer || !loader) {
      return;
    }

    try {
      await loader.load();

      setStartLocation(START_LOCATION);

      const mapOptions: MapOptions = {
        center: START_LOCATION,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true,
        styles: INITIAL_MAP_STYLES,
        tilt: 45,
        maxZoom: 16,
        minZoom: 3,
        backgroundColor: "transparent",
      };

      const mapInstance = new google.maps.Map(mapContainer, mapOptions);
      setMap(mapInstance);

      if (props.onLoad) {
        props.onLoad();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  async function startAnimation(): Promise<void> {
    const currentMap = map();
    if (!currentMap || isAnimating() || !mapContainer || hasAnimated() || isServer) {
      return;
    }

    setIsAnimating(true);
    setHasAnimated(true);

    try {
      let destination: LatLngLiteral;
      if (props.markerPosition) {
        const markerPos = props.markerPosition();
        if (markerPos) {
          destination = markerPos;
        } else {
          destination = START_LOCATION;
        }
      } else {
        destination = START_LOCATION;
      }

      setLastAnimatedPosition(destination);

      const distance = calculateDistance(startLocation(), destination);
      const isLongDistance = distance > ONE_THIRD_US_WIDTH;

      const maxZoom = 16;
      const minZoom = isLongDistance ? 5 : 6;

      currentMap.setCenter(startLocation());
      currentMap.setZoom(maxZoom);

      currentMap.setOptions({
        styles: INITIAL_MAP_STYLES,
        gestureHandling: "none",
        mapTypeId: google.maps.MapTypeId.HYBRID,
        tilt: 45,
      });

      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      const currentZoom = currentMap.getZoom() || maxZoom;

      const midZoom = Math.floor((currentZoom + minZoom) / 2);

      await smoothZoom(currentMap, midZoom, currentZoom);

      currentMap.setOptions({
        styles: MINIMAL_MAP_STYLES,
      });

      await smoothZoom(currentMap, minZoom, midZoom);

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(startLocation().lat, startLocation().lng));
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));

      currentMap.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });

      currentMap.panTo(destination);

      await new Promise<void>((resolve) => setTimeout(resolve, 1100));

      currentMap.setOptions({
        styles: ROAD_VISIBLE_STYLES,
      });

      await smoothZoom(currentMap, maxZoom, minZoom);

      currentMap.setOptions({
        gestureHandling: "cooperative",
      });

      dropMarkerOnMap(destination);

      setIsAnimating(false);
      setInitialAnimationComplete(true);
    } catch (error) {
      console.error("Animation error:", error);
      setIsAnimating(false);
      setInitialAnimationComplete(true);
    }
  }

  createEffect(() => {
    if (map() && !isAnimating() && !hasAnimated() && !isServer) {
      startAnimation().catch(() => {
        setIsAnimating(false);
        setInitialAnimationComplete(true);
      });
    }
  });

  onCleanup(() => {
    if (isServer) return;

    const currentMap = map();
    if (currentMap) {
      google.maps.event.clearInstanceListeners(currentMap);
    }

    const marker = currentMarker();
    if (marker) {
      marker.setMap(null);
    }
  });

  return (
    <div
      ref={mapContainer}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "transparent",
      }}
    />
  );
}
