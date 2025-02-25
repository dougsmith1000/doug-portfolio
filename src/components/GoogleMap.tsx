/// <reference types="@types/google.maps" />
import { createSignal, onCleanup, createEffect, Accessor } from "solid-js";
import { Loader } from "@googlemaps/js-api-loader";
import { isServer } from "solid-js/web";

const GOOGLE_MAPS_API_KEY = "AIzaSyCyQ5Of2emlPznbtusylADSFxErcMPjjRI";

// Define consistent types for Google Maps objects
type GoogleMap = google.maps.Map;
type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;
type MapTypeStyle = google.maps.MapTypeStyle;
type MapsEventListener = google.maps.MapsEventListener;
type Marker = google.maps.Marker;

// Props interface for the component
interface GoogleMapProps {
  onLoad?: () => void;
  latLng?: LatLngLiteral;
  markerPosition?: Accessor<LatLngLiteral | null>;
}

// Location coordinates
const START_LOCATION: LatLngLiteral = { lat: 41.0437, lng: -74.2156 };
const DEFAULT_END_LOCATION: LatLngLiteral = { lat: 34.0598, lng: -84.2456 };

// US country width approximation (longitude span)
const US_WIDTH = 58; // Approximate longitude span of continental US (125°W to 67°W)
const ONE_THIRD_US_WIDTH = US_WIDTH / 3;

// Style with all roads and labels visible (for initial view)
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

// Simplified map style with town and state labels always visible
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

// Style with roads visible (for after panning)
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

/**
 * Calculate the distance between two points (simplified to longitude difference)
 */
function calculateDistance(start: LatLngLiteral, end: LatLngLiteral): number {
  // Calculate the absolute longitude difference
  const lngDiff = Math.abs(end.lng - start.lng);
  return lngDiff;
}

// Create a loader instance with our API key - but only on the client
const loader = !isServer
  ? new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["maps", "marker"],
    })
  : null;

/**
 * Smoothly zoom the map to a target zoom level
 */
function smoothZoom(map: GoogleMap, targetZoom: number, currentZoom: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (currentZoom === targetZoom) {
      resolve();
      return;
    }

    // Determine if we're zooming in or out
    const zoomingIn = currentZoom < targetZoom;
    const nextZoom = zoomingIn ? currentZoom + 1 : currentZoom - 1;

    // Add a listener for the zoom_changed event
    const zoomListener: MapsEventListener = google.maps.event.addListener(map, "zoom_changed", () => {
      // Remove the listener once the zoom has changed
      google.maps.event.removeListener(zoomListener);

      // Continue with the next zoom level
      smoothZoom(map, targetZoom, nextZoom).then(resolve);
    });

    // Set the next zoom level after a short delay
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
  const [isScriptLoading, setIsScriptLoading] = createSignal(false);
  const [map, setMap] = createSignal<GoogleMap | undefined>();
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);
  const [startLocation, setStartLocation] = createSignal<LatLngLiteral>(START_LOCATION);
  const [currentMarker, setCurrentMarker] = createSignal<Marker | null>(null);
  const [previousMarkerPosition, setPreviousMarkerPosition] = createSignal<LatLngLiteral | null>(null);
  const [initialAnimationComplete, setInitialAnimationComplete] = createSignal(false);
  const [lastAnimatedPosition, setLastAnimatedPosition] = createSignal<LatLngLiteral | null>(null);

  // Initialize map when component mounts
  createEffect(() => {
    if (mapContainer && !isServer) {
      initializeMap();
    }
  });

  // Effect to handle job selection and map animation
  createEffect(() => {
    const currentMap = map();
    const position = props.markerPosition && props.markerPosition();

    if (currentMap && position && initialAnimationComplete()) {
      // Check if we've already animated to this position to prevent loops
      const lastPosition = lastAnimatedPosition();
      if (lastPosition && lastPosition.lat === position.lat && lastPosition.lng === position.lng) {
        return; // Skip if we've already animated to this position
      }

      // If we have a map, position, and initial animation is done, animate to the new position
      animateToLocation(position);
    }
  });

  /**
   * Animate the map to a specific location
   */
  async function animateToLocation(destination: LatLngLiteral): Promise<void> {
    const currentMap = map();
    if (!currentMap || isAnimating() || isServer) {
      return;
    }

    // Store this position as the last one we animated to
    setLastAnimatedPosition(destination);
    setIsAnimating(true);

    try {
      // Calculate distance to determine zoom levels
      const currentCenter = currentMap.getCenter();
      if (!currentCenter) {
        throw new Error("Map center is undefined");
      }

      const distance = calculateDistance(currentCenter.toJSON(), destination);
      const isLongDistance = distance > ONE_THIRD_US_WIDTH / 2;

      if (distance < 0.02) {
        currentMap.panTo(destination);
        await new Promise<void>((resolve) => setTimeout(resolve, 500));

        dropMarkerOnMap(destination);

        setIsAnimating(false);
        return;
      }

      const maxZoom = 16;
      const minZoom = isLongDistance ? 5 : 7;

      const currentZoom = currentMap.getZoom() || maxZoom;

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
      setIsScriptLoading(true);

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

      // Call the onLoad callback if provided
      if (props.onLoad) {
        props.onLoad();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    } finally {
      setIsScriptLoading(false);
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
      let destination = DEFAULT_END_LOCATION;
      if (props.markerPosition) {
        const markerPos = props.markerPosition();
        if (markerPos) {
          destination = markerPos;
        }
      }

      setLastAnimatedPosition(destination);

      const distance = calculateDistance(startLocation(), destination);
      const isLongDistance = distance > ONE_THIRD_US_WIDTH;

      // Define zoom levels
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

      // Step 2: Now show both cities before panning
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(startLocation().lat, startLocation().lng));
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));

      // Fit bounds to show both cities
      currentMap.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });

      // Pan to the destination
      currentMap.panTo(destination);

      // Wait for the pan to complete
      await new Promise<void>((resolve) => setTimeout(resolve, 1100));

      // Step 3: Apply road styles for better detail
      currentMap.setOptions({
        styles: ROAD_VISIBLE_STYLES,
      });

      // Step 4: Zoom in smoothly to maximum zoom level
      await smoothZoom(currentMap, maxZoom, minZoom);

      // Re-enable user interaction
      currentMap.setOptions({
        gestureHandling: "cooperative",
      });

      // Drop the marker after the initial animation is complete
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
      // Handle the async function
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

    // Clean up marker
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
