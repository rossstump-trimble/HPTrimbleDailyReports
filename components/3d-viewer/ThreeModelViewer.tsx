"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/3d-viewer/LoadingScreen";

// Import THREE namespace directly but don't import the examples yet
import * as THREE from "three";

// Dynamically import the examples modules (client-side only)
// TypeScript types for the dynamic imports
type OrbitControlsType = any;
type GLTFLoaderType = any;

// Skip the imports of OrbitControls and GLTFLoader from here
// They'll be dynamically imported in the useEffect

interface ThreeModelViewerProps {
  modelUrl?: string; // Optional URL to a GLB/GLTF model
  className?: string;
  showGrid?: boolean; // Option to show/hide grid
}

/**
 * A component that renders a 3D model using Three.js
 * Includes a grid and a sample cube if no model is provided
 */
export const ThreeModelViewer: React.FC<ThreeModelViewerProps> = ({
  modelUrl,
  className = "",
  showGrid = true, // Default to true for backward compatibility
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingSampleCube, setIsShowingSampleCube] = useState(false);
  const cleanupRef = useRef<() => void>(() => {});
  const [loading, setLoading] = useState(true);

  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import Three.js modules on the client side only
    let OrbitControls: OrbitControlsType;
    let GLTFLoader: GLTFLoaderType;

    // Async function to load modules
    async function loadModules() {
      const OrbitControlsModule = await import(
        "three/examples/jsm/controls/OrbitControls"
      );
      const GLTFLoaderModule = await import(
        "three/examples/jsm/loaders/GLTFLoader"
      );

      OrbitControls = OrbitControlsModule.OrbitControls;
      GLTFLoader = GLTFLoaderModule.GLTFLoader;

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
      camera.position.set(5, 5, 5); // Set camera position
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Apply styles directly to the renderer's domElement
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create controls for panning and zooming
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableDamping = true;
      controlsRef.current = controls;

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);

      // Add grid helper only if showGrid is true
      if (showGrid) {
        const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x999999);
        scene.add(gridHelper);
      }

      // Add axes helper
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // If model URL is provided, load the model
      if (modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf: { scene: THREE.Scene }) => {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Calculate scale to fit model in view
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim; // Scale to fit within a 5-unit space

            // Apply scale
            gltf.scene.scale.set(scale, scale, scale);

            // Position the model at the center of the scene
            gltf.scene.position.x = -center.x * scale;
            gltf.scene.position.y = -center.y * scale;
            gltf.scene.position.z = -center.z * scale;

            // Add model to scene
            scene.add(gltf.scene);

            // Set camera position based on model's bounding box
            const boundingBox = new THREE.Box3().setFromObject(gltf.scene);
            const boundingCenter = boundingBox.getCenter(new THREE.Vector3());
            const boundingSize = boundingBox.getSize(new THREE.Vector3());
            const maxBoundingDim = Math.max(
              boundingSize.x,
              boundingSize.y,
              boundingSize.z
            );

            camera.position.set(
              boundingCenter.x + maxBoundingDim * 1.5,
              boundingCenter.y + maxBoundingDim * 1.5,
              boundingCenter.z + maxBoundingDim * 1.5
            );
            camera.lookAt(boundingCenter);

            // Update controls target to model center
            if (controlsRef.current) {
              controlsRef.current.target.copy(boundingCenter);
              controlsRef.current.update();
            }

            setIsLoading(false);
          },
          (xhr: { loaded: number; total: number }) => {
            console.log(
              `${Math.round((xhr.loaded / xhr.total) * 100)}% loaded`
            );
          },
          (error: Error) => {
            console.error("Error loading 3D model:", error);
            setIsLoading(false);
            // If model loading fails, add a sample cube as fallback
            addSampleCube(scene);
            setIsShowingSampleCube(true);
          }
        );
      } else {
        // If no model URL is provided, add a sample cube
        addSampleCube(scene);
        setIsShowingSampleCube(true);
        setIsLoading(false);
      }

      // Animation loop
      const animate = () => {
        if (
          !rendererRef.current ||
          !sceneRef.current ||
          !cameraRef.current ||
          !controlsRef.current
        )
          return;

        animationFrameRef.current = requestAnimationFrame(animate);
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      animate();

      // Handle resize of container
      const handleResize = () => {
        if (!container || !rendererRef.current || !cameraRef.current) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Only update if dimensions are non-zero
        if (width > 0 && height > 0) {
          if (cameraRef.current) {
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
          }
          if (rendererRef.current) {
            rendererRef.current.setSize(width, height, false);
          }
        }

        // Force an immediate render to update the view
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
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

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
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

    // Function to add a sample cube
    function addSampleCube(scene: THREE.Scene) {
      // Create a cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x3080ff,
        metalness: 0.3,
        roughness: 0.4,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.position.set(0, 0.5, 0);
      scene.add(cube);

      // Create a ground plane
      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2;
      plane.receiveShadow = true;
      scene.add(plane);
    }

    // Start loading modules
    loadModules();

    // Clean up on component unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [modelUrl, showGrid]);

  useEffect(() => {
    // Keep loading state true to let LoadingScreen handle the timing
    const timer = setTimeout(() => {
      // Deliberately leave this commented - we want LoadingScreen to control timing
      // setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-full w-full">
      {loading && <LoadingScreen message="Loading 3D model..." />}
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden ${className}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="text-lg font-medium">Loading 3D Model...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeModelViewer;
