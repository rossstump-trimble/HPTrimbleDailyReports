"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { MapComponentProjectSettings } from "@/components/MapComponentProjectSettings";
import { LoadingScreen } from "@/components/3d-viewer/LoadingScreen";

interface GoogleMapViewportProps {
  className?: string;
  mapId?: string; // Optional ID to identify which map configuration to use
  isActive?: boolean; // Add isActive prop to control re-renders
}

/**
 * A component that renders a Google Map in a viewport
 * Uses the simplified MapComponentProjectSettings without unnecessary UI
 */
const GoogleMapViewportComponent: React.FC<GoogleMapViewportProps> = ({
  className = "",
  mapId,
  isActive = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref to store last map state
  const mapStateRef = useRef<{
    center?: { lat: number; lng: number };
    zoom?: number;
    boundary?: google.maps.LatLngLiteral[];
  }>({});

  // Default center location (can be customized based on mapId)
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco

  // Handle map errors
  const handleMapError = (errorMessage: string) => {
    setError(errorMessage);
    console.error("Google Maps error:", errorMessage);
  };

  // Optional callback for boundary changes
  const handleBoundaryChange = (boundary: google.maps.LatLngLiteral[]) => {
    console.log("Map boundary changed:", boundary);
    // Store boundary in ref to persist across renders
    mapStateRef.current.boundary = boundary;
  };

  // You could implement a function to get different map configurations based on mapId
  const getMapConfig = (id: string | undefined) => {
    // If we have a stored state, use that first
    if (mapStateRef.current.center && mapStateRef.current.zoom) {
      return {
        center: mapStateRef.current.center,
        zoom: mapStateRef.current.zoom,
      };
    }

    // Default configuration
    const config = {
      center: defaultCenter,
      zoom: 10,
    };

    // Can be extended to handle different map configurations
    if (id === "city-map") {
      return {
        center: { lat: 40.7128, lng: -74.006 }, // New York
        zoom: 12,
      };
    }

    return config;
  };

  // Memoize the map configuration to prevent unnecessary recalculations
  const mapConfig = useMemo(() => getMapConfig(mapId), [mapId]);

  // Callback to update center and zoom when map moves
  const handleMapChange = (center: google.maps.LatLng, zoom: number) => {
    // Store the current state in our ref
    mapStateRef.current.center = { lat: center.lat(), lng: center.lng() };
    mapStateRef.current.zoom = zoom;
  };

  useEffect(() => {
    // Keep loading state true to let LoadingScreen handle the timing
    // This ensures the LoadingScreen component can control its own visibility
    const timer = setTimeout(() => {
      // Deliberately leave this commented - we want LoadingScreen to control timing
      // setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-red-500">Error loading map: {error}</p>
      </div>
    );
  }

  // Make a unique key for the MapComponentProjectSettings based only on the mapId
  // We removed isActive from the key so the component doesn't remount when switching viewports
  const mapKey = `${mapId || "default"}`;

  return (
    <div className="relative h-full w-full">
      {loading && <LoadingScreen message="Loading map view..." />}
      <div className={`h-full w-full ${className}`}>
        <MapComponentProjectSettings
          key={mapKey}
          center={mapConfig.center}
          zoom={mapConfig.zoom}
          onError={handleMapError}
          onBoundaryChange={handleBoundaryChange}
          onMapChange={handleMapChange}
        />
      </div>
    </div>
  );
};

// Wrap the component with React.memo to prevent unnecessary re-renders
export const GoogleMapViewport = React.memo(GoogleMapViewportComponent);
