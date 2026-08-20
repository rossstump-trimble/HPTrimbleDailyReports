import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  SearchResults,
  SearchResultFile,
  SearchResultProject,
} from "@/types/search";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Extend Node interface with D3 force simulation properties
interface Node {
  id: string;
  name: string;
  type: "file" | "project";
  thumbnail?: string;
  source?: string;
  data?: SearchResultFile | SearchResultProject; // Store the original data
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: "file-project" | "file-file" | "project-project";
}

interface SearchNetworkGraphProps {
  data: SearchResults;
  width?: number;
  height?: number;
  onNodeClick?: (item: SearchResultFile | SearchResultProject) => void;
  selectedItem?: SearchResultFile | SearchResultProject | null;
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

// Link styles with colors
type LinkStyles = {
  [K in Link["type"]]: string;
};

export function SearchNetworkGraph({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  selectedItem,
  onFullScreenChange,
}: SearchNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef =
    useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const simulationRef = useRef<d3.Simulation<Node, undefined>>();
  const nodesRef = useRef<d3.Selection<any, Node, any, unknown>>();
  const [isLoading, setIsLoading] = useState(true);
  const initialRender = useRef(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Transform the search results into graph data
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [
      // Create nodes for files
      ...data.files.map((file: SearchResultFile) => ({
        id: file.id,
        name: file.name,
        type: "file" as const,
        thumbnail: file.thumbnail,
        source: file.source,
        data: file,
      })),
      // Create nodes for projects
      ...data.projects.map((project: SearchResultProject) => ({
        id: project.id,
        name: project.name,
        type: "project" as const,
        thumbnail: project.thumbnail,
        data: project,
      })),
    ];

    const links: Link[] = [
      // Create file-project links
      ...data.files.flatMap(
        (file) =>
          file.projectIds?.map((projectId) => ({
            source: file.id,
            target: projectId,
            type: "file-project" as const,
          })) || []
      ),
      // Create file-file links
      ...data.files.flatMap((file) =>
        (file.relatedFileIds || []).map((relatedId) => ({
          source: file.id,
          target: relatedId,
          type: "file-file" as const,
        }))
      ),
      // Create project-project links
      ...data.projects.flatMap((project) =>
        (project.relatedProjectIds || []).map((relatedId) => ({
          source: project.id,
          target: relatedId,
          type: "project-project" as const,
        }))
      ),
    ];

    return { nodes, links };
  }, [data]);

  // Define drag functions outside the effect to avoid strict mode issues
  const dragstarted = useCallback(
    (event: d3.D3DragEvent<SVGGElement, Node, Node>) => {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    []
  );

  const dragged = useCallback(
    (event: d3.D3DragEvent<SVGGElement, Node, Node>) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    []
  );

  const dragended = useCallback(
    (event: d3.D3DragEvent<SVGGElement, Node, Node>) => {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    },
    []
  );

  // Handle node click without causing graph refresh
  const handleNodeClick = useCallback(
    (event: MouseEvent, d: Node) => {
      if (onNodeClick && d.data) {
        console.log("Node clicked in graph:", d.id, "Data:", d.data.id);

        // Always call the external click handler, let parent component handle toggle logic
        onNodeClick(d.data);

        // Since we're manipulating the DOM directly, we need to use d3 to select the node
        if (nodesRef.current) {
          // Clear previous highlights
          nodesRef.current.classed("highlighted", false);

          // Highlight the clicked node with transition
          const clickedNode = d3.select(event.currentTarget as Element);
          console.log("Highlighting node:", d.id);
          clickedNode
            .classed("highlighted", true)
            .select(".node-circle")
            .transition()
            .duration(300)
            .attr("r", 24)
            .transition()
            .duration(300)
            .attr("r", d.type === "file" ? 20 : 24);
        }

        event.stopPropagation(); // Prevent triggering other click events
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    // Only rebuild the entire graph on initial render or when data changes significantly
    if (initialRender.current || !simulationRef.current) {
      setIsLoading(true);
      initialRender.current = false;

      // Define type-safe d3 event handlers
      type DragEvent = d3.D3DragEvent<SVGGElement, Node, Node>;

      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();

      // Create the SVG container before the simulation
      const svg = d3
        .select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height);

      // Create a container for all elements to enable zooming
      const container = svg.append("g");
      containerRef.current = container;

      // Create the force simulation with improved physics
      const simulation = d3
        .forceSimulation<Node>(nodes)
        .alpha(1) // Start with maximum alpha for better initial layout
        .alphaTarget(0)
        .alphaDecay(0.01) // Slower decay for more simulation steps
        .alphaMin(0.001) // Lower min alpha to ensure better stabilization
        .velocityDecay(0.3) // Lower decay for more momentum in initial layout
        .force(
          "link",
          d3
            .forceLink<Node, Link>(links)
            .id((d: Node) => d.id)
            .distance((d) => {
              // Type casting to Link to access type property
              const link = d as Link;
              return link.type === "file-project" ? 130 : 180;
            })
            .strength((d) => {
              // Type casting to Link to access type property
              const link = d as Link;
              return link.type === "file-project" ? 1 : 0.5; // Stronger initial force
            })
        )
        .force(
          "charge",
          d3
            .forceManyBody<Node>()
            .strength(-1200) // Even stronger initial repulsion
            .distanceMax(300)
            .theta(0.9)
        )
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.3)) // Stronger centering
        .force(
          "collision",
          d3
            .forceCollide<Node>()
            .radius((d) => (d.type === "file" ? 80 : 90)) // Increased radius to accommodate full labels
            .strength(1) // Maximum collision strength
        )
        .force("x", d3.forceX<Node>(width / 2).strength(0.2))
        .force("y", d3.forceY<Node>(height / 2).strength(0.2));

      // CRITICAL: Ensure nodes are visible and properly positioned from the start
      // First separate files and projects
      const fileNodes = nodes.filter((node) => node.type === "file");
      const projectNodes = nodes.filter((node) => node.type === "project");

      // Position project nodes in a central circle
      projectNodes.forEach((node, i) => {
        const angle = (i / Math.max(projectNodes.length, 1)) * 2 * Math.PI;
        // Small radius for the project circle - project nodes will be central
        const radius = Math.min(width, height) * 0.15;
        node.x = width / 2 + radius * Math.cos(angle);
        node.y = height / 2 + radius * Math.sin(angle);
      });

      // Position file nodes in several concentric rings
      fileNodes.forEach((node, i) => {
        // Distribute nodes across multiple rings to prevent overlap
        const nodesPerRing = Math.min(12, Math.ceil(fileNodes.length / 3));
        const ringIndex = Math.floor(i / nodesPerRing) + 1; // +1 to start outside project circle
        const positionInRing = i % nodesPerRing;

        // Each ring gets progressively larger
        const ringRadius = Math.min(width, height) * (0.25 + ringIndex * 0.1);

        // Stagger positions within each ring and offset each ring
        const angle =
          (positionInRing / nodesPerRing) * 2 * Math.PI +
          (ringIndex * Math.PI) / (nodesPerRing * 0.8);

        node.x = width / 2 + ringRadius * Math.cos(angle);
        node.y = height / 2 + ringRadius * Math.sin(angle);
      });

      // Check one last time to ensure all nodes have valid positions
      nodes.forEach((node, i) => {
        if (!node.x || !node.y || isNaN(node.x) || isNaN(node.y)) {
          // Fallback positioning if node coordinates are invalid
          const angle = (i / nodes.length) * 2 * Math.PI;
          const radius = Math.min(width, height) / 4;
          node.x = width / 2 + radius * Math.cos(angle);
          node.y = height / 2 + radius * Math.sin(angle);
        }
      });

      // Strongly pre-warm the simulation
      for (let i = 0; i < 500; i++) {
        simulation.tick();
      }

      // After warm-up, apply cooling to stabilize the layout
      simulation
        .alpha(0.1) // Lower alpha after warm-up
        .alphaDecay(0.02)
        .velocityDecay(0.6); // Higher decay to stabilize

      // Define link styles with specific colors for each relationship type
      const linkStyles: LinkStyles = {
        "file-project": "#64748b", // Slate 500
        "file-file": "#94a3b8", // Slate 400
        "project-project": "#334155", // Slate 700
      };

      // Create the links AFTER the simulation has warmed up
      const link = container
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", (d: Link) => linkStyles[d.type])
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.6)
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!)
        .attr("stroke-dasharray", (d: Link) =>
          d.type === "project-project" ? "5,5" : null
        );

      // Create the nodes with fixed initial positions
      const node = container
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("cursor", "pointer")
        .attr("class", "node")
        // Set the initial position explicitly before any animation
        .attr("transform", (d: Node) => {
          // Ensure nodes have valid coordinates
          if (!d.x || !d.y || isNaN(d.x) || isNaN(d.y)) {
            d.x = width / 2;
            d.y = height / 2;
          }
          return `translate(${d.x},${d.y})`;
        })
        .call(
          d3
            .drag<SVGGElement, Node>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended) as any
        )
        .on("click", handleNodeClick);

      nodesRef.current = node;

      // Add a background for the node to help with hover/click
      node.append("circle").attr("r", 24).attr("fill", "transparent");

      // Add circles for nodes with nice colors and animated entrance
      node
        .append("circle")
        .attr("class", "node-circle")
        .attr("r", 0) // Start with radius 0 for animation
        .attr(
          "fill",
          (d: Node) =>
            d.type === "file"
              ? "#3b82f6" // Blue for files
              : "#10b981" // Green for projects
        )
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        // Animate the entrance with staggered timing
        .transition()
        .duration(800)
        .delay((d, i) => {
          // Projects appear first, files later
          return d.type === "project" ? i * 50 : 400 + i * 30;
        })
        .attr("r", (d) => (d.type === "file" ? 20 : 24)) // Projects slightly larger
        .ease(d3.easeBounceOut); // Add a bounce effect for more visual appeal

      // Add smaller circles for visual interest with staggered animation
      node
        .append("circle")
        .attr("r", 0) // Start with radius 0 for animation
        .attr(
          "fill",
          (d: Node) =>
            d.type === "file"
              ? "#60a5fa" // Lighter blue for files
              : "#34d399" // Lighter green for projects
        )
        .attr("opacity", 0.7)
        // Animate the entrance with staggered timing and different ease function
        .transition()
        .duration(800)
        .delay((d, i) => {
          // Projects appear first, files later
          return d.type === "project" ? 100 + i * 50 : 500 + i * 30;
        })
        .attr("r", (d) => (d.type === "file" ? 15 : 18)) // Projects slightly larger
        .ease(d3.easeElasticOut.amplitude(1).period(0.5)); // Add elastic effect

      // Add icons with fade-in using staggered timing
      node
        .append("text")
        .attr("class", "node-icon")
        .text((d: Node) => (d.type === "file" ? "📄" : "📁"))
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", (d) => (d.type === "file" ? "12px" : "14px")) // Projects slightly larger
        .style("opacity", 0) // Start invisible
        .transition()
        .duration(500)
        .delay((d, i) => {
          // Projects appear first, files later
          return d.type === "project" ? 200 + i * 50 : 600 + i * 30;
        })
        .style("opacity", 1) // Fade in
        .ease(d3.easeQuadOut); // Smooth acceleration

      // Add hover tooltip with full name
      node.append("title").text((d: Node) => d.name);

      // Add full labels beneath nodes with fade-in
      node
        .append("text")
        .attr("class", "node-label")
        .text((d: Node) => {
          // For very long names, add line breaks
          if (d.name.length > 20) {
            // Try to find a space to break at
            const midPoint = Math.floor(d.name.length / 2);
            let breakPoint = d.name.lastIndexOf(" ", midPoint);

            // If no space found near midpoint, try first space after midpoint
            if (breakPoint < 0 || breakPoint < midPoint - 10) {
              breakPoint = d.name.indexOf(" ", midPoint);
            }

            // If still no good break point, just break at midpoint
            if (breakPoint < 0) {
              breakPoint = midPoint;
            }

            return (
              d.name.substring(0, breakPoint) +
              "\n" +
              d.name.substring(breakPoint + 1)
            );
          }
          return d.name;
        })
        .attr("x", 0)
        .attr("y", (d) => {
          // Adjust y position based on whether text has a line break
          const hasLineBreak = d.name.length > 20;
          return d.type === "file"
            ? hasLineBreak
              ? 30
              : 35
            : hasLineBreak
            ? 35
            : 40;
        })
        .attr("dy", (d) => (d.name.length > 20 ? "-0.2em" : "0")) // Adjust for multi-line text
        .attr("text-anchor", "middle")
        .attr("font-size", (d) => (d.type === "file" ? "8px" : "9px")) // Slightly smaller font to fit longer text
        .attr("font-weight", (d) => (d.type === "project" ? "bold" : "normal")) // Bold for projects
        .style("line-height", "1.2em") // Add line height for multi-line text
        .attr("fill", "#1e293b") // Slate 900
        .attr("pointer-events", "none") // Prevent labels from interfering with clicks
        .style("opacity", 0) // Start invisible
        .transition()
        .duration(500)
        .delay((d, i) => {
          // Projects appear first, files later for consistent animation
          return d.type === "project" ? 300 + i * 50 : 700 + i * 30;
        })
        .style("opacity", 1) // Fade in
        .ease(d3.easeCubicOut);

      // Add CSS styles for hover and active states
      const style = document.createElement("style");
      style.textContent = `
        .node:hover .node-circle {
          stroke: #0284c7;
          stroke-width: 3px;
          filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
        }
        .node.highlighted .node-circle {
          stroke: #f43f5e; /* Pink 600 */
          stroke-width: 4px;
          filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.1)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.1));
        }
        .node-label {
          text-shadow: 0 0 3px white, 0 0 2px white, 0 0 1px white;
        }
        .node:hover .node-label {
          font-weight: bold;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
        }
        .node.highlighted .node-label {
          font-weight: bold;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          color: #111827;
        }
      `;
      document.head.appendChild(style);

      // Handle SVG background click to clear selection
      svg.on("click", () => {
        if (nodesRef.current) {
          nodesRef.current.classed("highlighted", false);
        }
      });

      // Add a subtle pulse animation to highlighted nodes
      const highlightAnimation = () => {
        d3.selectAll(".node.highlighted .node-circle")
          .transition()
          .duration(1000)
          .attr("stroke-opacity", 0.6)
          .transition()
          .duration(1000)
          .attr("stroke-opacity", 1)
          .on("end", highlightAnimation);
      };

      highlightAnimation();

      // Update positions on each tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: Link) => (d.source as Node).x!)
          .attr("y1", (d: Link) => (d.source as Node).y!)
          .attr("x2", (d: Link) => (d.target as Node).x!)
          .attr("y2", (d: Link) => (d.target as Node).y!);

        node.attr("transform", (d: Node) => `translate(${d.x},${d.y})`);
      });

      // Hide loading indicator after simulation stabilizes
      simulation.on("end", () => {
        setIsLoading(false);
      });

      // Add legend
      const legend = svg
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(20, ${height - 80})`);

      // File legend item
      const fileLegend = legend.append("g");
      fileLegend.append("circle").attr("r", 7).attr("fill", "#3b82f6");
      fileLegend
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .text("File")
        .attr("font-size", "10px");

      // Project legend item
      const projectLegend = legend
        .append("g")
        .attr("transform", "translate(0, 20)");
      projectLegend.append("circle").attr("r", 7).attr("fill", "#10b981");
      projectLegend
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .text("Project")
        .attr("font-size", "10px");

      // Connection legend item
      const connectionLegend = legend
        .append("g")
        .attr("transform", "translate(0, 40)");
      connectionLegend
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 10)
        .attr("y2", 0)
        .attr("stroke", "#64748b")
        .attr("stroke-width", 1.5);
      connectionLegend
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .text("Connection")
        .attr("font-size", "10px");

      // Add zoom functionality
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          if (containerRef.current) {
            containerRef.current.attr("transform", event.transform);
          }
        });

      // Need to use 'as any' for compatibility with D3's typing
      svg.call(zoom as any);

      // Add double-click to reset zoom
      svg.on("dblclick.zoom", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

      // Add boundary force to keep nodes within viewable area
      simulation.force("boundary", (alpha: number) => {
        const padding = 50;
        const visualRadius = Math.min(width, height) * 0.45;
        const centerX = width / 2;
        const centerY = height / 2;

        nodes.forEach((node) => {
          if (!node.x || !node.y) return;

          // Check if node is too far from center
          const distanceFromCenter = Math.sqrt(
            Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2)
          );

          // If too far, gradually pull back toward center
          if (distanceFromCenter > visualRadius) {
            const angle = Math.atan2(node.y - centerY, node.x - centerX);
            const targetX = centerX + (visualRadius - 10) * Math.cos(angle);
            const targetY = centerY + (visualRadius - 10) * Math.sin(angle);
            node.vx = (node.vx || 0) + (targetX - node.x) * alpha * 0.3;
            node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.3;
          }

          // Keep nodes within screen bounds (with padding)
          if (node.x < padding) node.x = padding;
          if (node.x > width - padding) node.x = width - padding;
          if (node.y < padding) node.y = padding;
          if (node.y > height - padding) node.y = height - padding;
        });
      });

      simulationRef.current = simulation;

      // Cleanup
      return () => {
        if (simulationRef.current) {
          simulationRef.current.stop();
        }
        document.head.removeChild(style);
      };
    } else {
      // Just update existing nodes with new positions if needed
      // but don't recreate the entire visualization
    }
  }, [
    nodes,
    links,
    width,
    height,
    handleNodeClick,
    dragstarted,
    dragged,
    dragended,
  ]);

  // Add useEffect to hide loading indicator after the initial animation is complete
  useEffect(() => {
    // Keep loading state active for a bit longer to ensure proper positioning
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Reduced timeout since we're doing more pre-warming now

    return () => clearTimeout(timer);
  }, []); // Empty dependency array for one-time effect

  // Add an effect to restart simulation when container is resized
  useEffect(() => {
    if (simulationRef.current && !isLoading) {
      // Gently reheat the simulation when dimensions change
      simulationRef.current.alpha(0.3).restart();
    }
  }, [width, height, isLoading]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const bbox = svgRef.current.getBoundingClientRect();
        if (bbox.width > 0 && bbox.height > 0) {
          // Center the graph when window is resized
          if (simulationRef.current) {
            const centerX = bbox.width / 2;
            const centerY = bbox.height / 2;

            simulationRef.current
              .force("center", d3.forceCenter(centerX, centerY).strength(0.3))
              .force("x", d3.forceX<Node>(centerX).strength(0.2))
              .force("y", d3.forceY<Node>(centerY).strength(0.2))
              .alpha(0.3)
              .restart();
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update the selectedItemRef when the selectedItem prop changes
  useEffect(() => {
    if (selectedItem) {
      selectedItemRef.current = { id: selectedItem.id };
    }
  }, [selectedItem]);

  // Find and highlight initially selected node from props
  useEffect(() => {
    // Check if we have a selected node (from the parent component)
    if (nodesRef.current && selectedItem?.id) {
      // Find the node in the DOM
      const selectedNodeElement = nodesRef.current
        .filter((d: Node) => d.id === selectedItem.id)
        .node();

      if (selectedNodeElement) {
        // Highlight it
        const selectedNode = d3.select(selectedNodeElement);
        nodesRef.current.classed("highlighted", false);
        selectedNode
          .classed("highlighted", true)
          .select(".node-circle")
          .transition()
          .duration(300)
          .attr("r", function () {
            // Use function context to access datum
            const d = d3.select(this).datum() as Node;
            return d.type === "file" ? 22 : 26;
          })
          .transition()
          .duration(300)
          .attr("r", function () {
            // Use function context to access datum
            const d = d3.select(this).datum() as Node;
            return d.type === "file" ? 20 : 24;
          });
      }
    }
  }, [isLoading, selectedItem]);

  // Add a ref to track the selected item
  const selectedItemRef = useRef<{ id: string } | null>(null);

  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    onFullScreenChange?.(newFullScreenState);
    // Restart simulation when toggling fullscreen to adjust layout
    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
    }
  };

  return (
    <div
      className={cn(
        "relative w-full bg-background/30 backdrop-blur-sm p-4 rounded-xl border mb-8 shadow-sm transition-all duration-300",
        isFullScreen &&
          "fixed inset-4 z-[9999] m-0 mb-0 h-[calc(100vh-2rem)] overflow-hidden"
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold">Network Visualization</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Explore connections between files and projects. Click on nodes to
            view details.
          </p>
          {data.query && (
            <p className="text-xs text-primary mt-1">
              Showing connections for: &ldquo;
              {data.query.length > 60
                ? data.query.substring(0, 60) + "..."
                : data.query}
              &rdquo;
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center bg-background/80 px-3 py-1 rounded-full shadow-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
              <span className="text-xs">Optimizing layout...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={toggleFullScreen}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "relative w-full",
          isFullScreen ? "h-[calc(100%-6rem)]" : "h-[500px]"
        )}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full rounded-lg"
        />
      </div>
      <div className="flex justify-center mt-2 text-xs text-muted-foreground">
        Drag nodes to reposition · Scroll to zoom · Double-click background to
        reset view
      </div>
    </div>
  );
}
