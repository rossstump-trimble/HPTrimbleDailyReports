"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Import THREE namespace directly but don't import the examples yet
import * as THREE from "three";

// TypeScript types for the dynamic imports
type OrbitControlsType = any;

import {
  Loader2,
  MoveHorizontal,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  Image,
  Share2,
  Maximize2,
  Pin,
  Camera,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { LoadingScreen } from "@/components/3d-viewer/LoadingScreen";

interface PanoramaViewerProps {
  imageUrl: string;
  className?: string;
  onAddIssue?: (position: { x: number; y: number }) => void;
}

/**
 * A component that renders a 360-degree panorama image using Three.js
 * The user can pan around the image by dragging
 */
export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  imageUrl,
  className = "",
  onAddIssue,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import Three.js modules on the client side only
    let OrbitControls: OrbitControlsType;

    // Async function to load modules
    async function loadModules() {
      const OrbitControlsModule = await import(
        "three/examples/jsm/controls/OrbitControls"
      );
      OrbitControls = OrbitControlsModule.OrbitControls;

      initScene();
    }

    // Function to initialize the scene after modules are loaded
    function initScene() {
      // Capture the current value of the ref
      const container = containerRef.current;
      if (!container) return;

      setIsLoading(true);

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75, // Field of view
        container.clientWidth / container.clientHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
      );
      camera.position.set(0, 0, 0.01); // Small offset to avoid rendering issues
      cameraRef.current = camera;

      // Create renderer with preserveDrawingBuffer to prevent flashing
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Apply styles directly to the renderer's domElement to prevent flashing
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create controls for panning
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true; // Enable mouse wheel zoom
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.rotateSpeed = -0.25;
      controlsRef.current = controls;

      // Load the panorama texture
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;

          // Create a sphere geometry to project the panorama onto
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          // Invert the geometry so that the image is on the inside
          geometry.scale(1, 1, -1);

          // Create material with the loaded texture
          const material = new THREE.MeshBasicMaterial({
            map: texture,
          });

          // Create a mesh with the geometry and material
          const sphere = new THREE.Mesh(geometry, material);

          // Add the sphere to the scene
          scene.add(sphere);

          // Mark as loaded
          setIsLoading(false);
        },
        // Progress callback
        (xhr) => {
          console.log(`${Math.round((xhr.loaded / xhr.total) * 100)}% loaded`);
        },
        (error) => {
          console.error("Error loading panorama texture:", error);
          setIsLoading(false);
        }
      );

      // Animation loop
      const animate = () => {
        if (
          !rendererRef.current ||
          !sceneRef.current ||
          !cameraRef.current ||
          !controlsRef.current
        )
          return;

        frameIdRef.current = requestAnimationFrame(animate);
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      animate();

      // Debounce timer reference
      let resizeTimeout: number | null = null;

      // Handle resize of container
      const handleResize = () => {
        if (!container || !rendererRef.current || !cameraRef.current) return;

        // Clear existing timeout
        if (resizeTimeout !== null) {
          window.clearTimeout(resizeTimeout);
        }

        // Debounce the resize operation
        resizeTimeout = window.setTimeout(() => {
          const width = container.clientWidth;
          const height = container.clientHeight;

          // Only update if dimensions are non-zero
          if (width > 0 && height > 0) {
            if (cameraRef.current) {
              cameraRef.current.aspect = width / height;
              cameraRef.current.updateProjectionMatrix();
            }
            if (rendererRef.current) {
              rendererRef.current.setSize(width, height, false); // false to maintain size without reallocation
            }
          }

          // Force an immediate render to update the view without waiting for the next animation frame
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        }, 100); // 100ms debounce
      };

      // Use ResizeObserver to detect container size changes
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(container);

      // Also listen to window resize events
      window.addEventListener("resize", handleResize);

      // Clean up function reference for later use
      cleanupRef.current = () => {
        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();

        if (resizeTimeout !== null) {
          window.clearTimeout(resizeTimeout);
        }

        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }

        if (rendererRef.current && container) {
          container.removeChild(rendererRef.current.domElement);
        }

        if (controlsRef.current) {
          controlsRef.current.dispose();
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    }

    // Start loading modules
    loadModules();

    // Clean up on component unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    // Keep loading state true to let LoadingScreen handle the timing
    const timer = setTimeout(() => {
      // Deliberately leave this commented - we want LoadingScreen to control timing
      // setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Function to handle zoom in
  const handleZoomIn = () => {
    if (controlsRef.current) {
      const newFov = Math.max(cameraRef.current?.fov || 75 - 10, 30);
      if (cameraRef.current) {
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  // Function to handle zoom out
  const handleZoomOut = () => {
    if (controlsRef.current) {
      const newFov = Math.min(cameraRef.current?.fov || 75 + 10, 100);
      if (cameraRef.current) {
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  // Function to handle download panorama
  const handleDownloadPanorama = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `panorama-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to handle add issue at current view position
  const handleAddIssue = () => {
    if (contextMenuPosition && onAddIssue) {
      onAddIssue(contextMenuPosition);
    }
  };

  // Function to handle take snapshot of current view
  const handleTakeSnapshot = () => {
    if (rendererRef.current && rendererRef.current.domElement) {
      const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `panorama-snapshot-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to handle copy view link
  const handleCopyViewLink = () => {
    if (cameraRef.current) {
      // Get the current camera rotation
      const rotation = cameraRef.current.rotation;
      // Create a shareable URL with the current view parameters
      const viewParams = `?x=${rotation.x.toFixed(4)}&y=${rotation.y.toFixed(
        4
      )}&z=${rotation.z.toFixed(4)}&fov=${cameraRef.current.fov}`;
      const url = `${window.location.href.split("?")[0]}${viewParams}`;

      navigator.clipboard
        .writeText(url)
        .then(() => {
          // You could add a toast notification here
          console.log("View link copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy view link", err);
        });
    }
  };

  // Function to handle full screen mode
  const handleFullScreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message}`
          );
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative h-full w-full">
      {loading && <LoadingScreen message="Loading panorama view..." />}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{ position: "relative" }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onContextMenu={(e) => {
              // Store the position where the context menu was triggered
              setContextMenuPosition({ x: e.clientX, y: e.clientY });
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mt-2 text-sm font-medium">
                    Loading panorama...
                  </span>
                </div>
              </div>
            )}

            {showControls && !isLoading && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-full p-2 flex items-center gap-2 z-10 transition-opacity">
                <button
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-5 w-5 text-white" />
                </button>
                <div className="px-2 text-white/80">
                  <MoveHorizontal className="h-5 w-5 inline-block mr-1" />
                  <span className="text-xs">Drag to pan</span>
                </div>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handleAddIssue}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Add Issue at This Point
          </ContextMenuItem>
          <ContextMenuItem onClick={handleTakeSnapshot}>
            <Camera className="h-4 w-4 mr-2" />
            Take Snapshot
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDownloadPanorama}>
            <Download className="h-4 w-4 mr-2" />
            Download 360° Image
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyViewLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Copy View Link
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleFullScreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Toggle Fullscreen
            <ContextMenuShortcut>F</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.reset();
              }
            }}
          >
            <Pin className="h-4 w-4 mr-2" />
            Reset View
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default PanoramaViewer;
