import { useEffect, useRef, useState, useCallback } from "react";
import { useThemeAwareMapStyle } from "@/hooks/useThemeAwareMapStyle";
import { loader, isGoogleMapsAvailable } from "@/utils/googleMapsLoader";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MapComponentProjectSettingsProps {
  center: { lat: number; lng: number };
  onError: (error: string) => void;
  zoom?: number;
  onBoundaryChange?: (boundary: google.maps.LatLngLiteral[]) => void;
  onMapChange?: (center: google.maps.LatLng, zoom: number) => void;
}

export function MapComponentProjectSettings({
  center,
  onError,
  zoom = 5,
  onBoundaryChange,
  onMapChange,
}: MapComponentProjectSettingsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );
  const [currentPolygon, setCurrentPolygon] =
    useState<google.maps.Polygon | null>(null);
  const { mapStyle } = useThemeAwareMapStyle();
  const initializationCompleteRef = useRef(false);

  // Initialize the map only once
  const initializeMap = useCallback(() => {
    if (!mapRef.current || initializationCompleteRef.current) return;

    // Check if Google Maps is available
    if (!isGoogleMapsAvailable() || !loader) {
      onError("Google Maps API key is not configured. Please check your environment variables.");
      return;
    }

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            styles: mapStyle,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          mapInstanceRef.current = newMap;

          const manager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
              fillColor: "#45b6fe",
              fillOpacity: 0.3,
              strokeWeight: 2,
              strokeColor: "#45b6fe",
              editable: true,
              draggable: true,
            },
          });

          manager.setMap(newMap);
          drawingManagerRef.current = manager;
          initializationCompleteRef.current = true;

          setupDrawingListeners(manager);

          // Setup listeners to track map state changes
          if (onMapChange) {
            // Track center and zoom changes
            google.maps.event.addListener(newMap, "idle", () => {
              const currentCenter = newMap.getCenter();
              const currentZoom = newMap.getZoom();
              if (currentCenter && currentZoom !== undefined) {
                onMapChange(currentCenter, currentZoom);
              }
            });
          }
        }
      })
      .catch((error) => {
        console.error("Error loading Google Maps API:", error);
        onError("Failed to load Google Maps. Please try again later.");
      });
  }, [center, zoom, mapStyle, onError, onMapChange]);

  // Setup drawing listeners once the manager is created
  const setupDrawingListeners = useCallback(
    (manager: google.maps.drawing.DrawingManager) => {
      google.maps.event.addListener(
        manager,
        "polygoncomplete",
        (polygon: google.maps.Polygon) => {
          if (currentPolygon) {
            currentPolygon.setMap(null);
          }
          setCurrentPolygon(polygon);

          const updatePolygonPath = () => {
            const path = polygon.getPath();
            const coordinates: google.maps.LatLngLiteral[] = [];
            for (let i = 0; i < path.getLength(); i++) {
              const point = path.getAt(i);
              coordinates.push({ lat: point.lat(), lng: point.lng() });
            }
            onBoundaryChange?.(coordinates);
          };

          google.maps.event.addListener(
            polygon.getPath(),
            "set_at",
            updatePolygonPath
          );
          google.maps.event.addListener(
            polygon.getPath(),
            "insert_at",
            updatePolygonPath
          );
          google.maps.event.addListener(polygon, "dragend", updatePolygonPath);

          updatePolygonPath();
        }
      );
    },
    [currentPolygon, onBoundaryChange]
  );

  // Initialize the map once on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update the map when center changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  // Update map styles when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({ styles: mapStyle });
    }
  }, [mapStyle]);

  const deletePolygon = useCallback(() => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
      onBoundaryChange?.([]); // Notify parent that boundary is cleared
    }
  }, [currentPolygon, onBoundaryChange]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {currentPolygon && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-4 right-4 z-10"
          onClick={deletePolygon}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Area
        </Button>
      )}
    </div>
  );
}
