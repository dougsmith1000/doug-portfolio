/// <reference types="@types/google.maps" />
import { createSignal, onCleanup, createEffect } from "solid-js";
import { Loader } from "@googlemaps/js-api-loader";
import { isServer } from "solid-js/web";

const GOOGLE_MAPS_API_KEY = "AIzaSyCyQ5Of2emlPznbtusylADSFxErcMPjjRI";

// Define consistent types for Google Maps objects
type GoogleMap = google.maps.Map;
type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;
type MapTypeStyle = google.maps.MapTypeStyle;
type MapsEventListener = google.maps.MapsEventListener;

// Props interface for the component
interface GoogleMapProps {
  onLoad?: () => void;
  latLng?: LatLngLiteral;
}

// Location coordinates
const START_LOCATION: LatLngLiteral = { lat: 41.0437, lng: -74.2156 };
const END_LOCATION: LatLngLiteral = { lat: 34.0598, lng: -84.2456 };

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

/**
 * Get the user location (always returns START_LOCATION for now)
 */
async function getUserLocation(): Promise<LatLngLiteral> {
  // Always return San Francisco as the starting point
  return START_LOCATION;
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

  // Initialize map when component mounts
  createEffect(() => {
    if (mapContainer && !isServer) {
      initializeMap();
    }
  });

  /**
   * Initialize the Google Map
   */
  async function initializeMap(): Promise<void> {
    if (!mapContainer || isServer || !loader) {
      return;
    }

    try {
      setIsScriptLoading(true);

      // Load the Maps JavaScript API using the loader
      await loader.load();

      // Get user's location before initializing the map
      const userLocation = await getUserLocation();
      setStartLocation(userLocation);

      const mapOptions: MapOptions = {
        center: userLocation,
        zoom: 16, // Start fully zoomed in
        mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true,
        styles: INITIAL_MAP_STYLES, // Start with all roads and labels visible
        tilt: 45, // Start with tilt already applied
        maxZoom: 16,
        minZoom: 3,
        backgroundColor: "transparent", // Dark background to avoid white flash
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

  /**
   * Start the map animation sequence
   */
  async function startAnimation(): Promise<void> {
    const currentMap = map();
    if (!currentMap || isAnimating() || !mapContainer || hasAnimated() || isServer) {
      return;
    }

    setIsAnimating(true);
    setHasAnimated(true);

    try {
      // Calculate distance and determine zoom levels
      const distance = calculateDistance(startLocation(), END_LOCATION);
      const isLongDistance = distance > ONE_THIRD_US_WIDTH;

      // Define zoom levels
      const maxZoom = 16; // Zoom in as far as possible (initial and final zoom)
      const minZoom = isLongDistance ? 5 : 6; // Lower min zoom for better overview

      // Make sure we start at San Francisco with maximum zoom
      currentMap.setCenter(startLocation());
      currentMap.setZoom(maxZoom);

      // Set initial styles with all labels visible
      currentMap.setOptions({
        styles: INITIAL_MAP_STYLES,
        gestureHandling: "none", // Disable user interaction during animation
        mapTypeId: google.maps.MapTypeId.HYBRID,
        tilt: 45, // Apply 3D tilt from the beginning
      });

      // Give a moment to appreciate the starting location
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));

      // Step 1: Zoom out smoothly to country level
      const currentZoom = currentMap.getZoom() || maxZoom;

      // Apply minimal styles halfway through zoom out
      const midZoom = Math.floor((currentZoom + minZoom) / 2);

      // First half of zoom out with all labels
      await smoothZoom(currentMap, midZoom, currentZoom);

      // Switch to minimal styles
      currentMap.setOptions({
        styles: MINIMAL_MAP_STYLES,
      });

      // Complete the zoom out
      await smoothZoom(currentMap, minZoom, midZoom);

      // Give a brief pause after zoom is complete
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // Step 2: Now show both cities before panning
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(startLocation().lat, startLocation().lng));
      bounds.extend(new google.maps.LatLng(END_LOCATION.lat, END_LOCATION.lng));

      // Fit bounds to show both cities
      currentMap.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });

      // Small delay
      // await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      currentMap.panTo(END_LOCATION);

      // Wait for the pan to complete
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

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

      setIsAnimating(false);
    } catch (error) {
      console.error("Animation error:", error);
      setIsAnimating(false);
    }
  }

  createEffect(() => {
    if (map() && !isAnimating() && !hasAnimated() && !isServer) {
      // Handle the async function
      startAnimation().catch(() => {
        setIsAnimating(false);
      });
    }
  });

  onCleanup(() => {
    if (isServer) return;

    const currentMap = map();
    if (currentMap) {
      google.maps.event.clearInstanceListeners(currentMap);
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
