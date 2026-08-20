"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OmniSearch } from "@/components/omni/OmniSearch";
import {
  mockSearchResults,
  steelBeamSearchResults,
} from "@/data/mockSearchResults";
import {
  SearchResultFile,
  SearchResultProject,
  SearchSuggestion,
  SearchResults,
} from "@/types/search";
import { format } from "date-fns";
import {
  FileIcon,
  FolderIcon,
  ClockIcon,
  SearchIcon,
  XIcon,
  FileTextIcon,
  Table2Icon,
  ImageIcon,
  FileCode2Icon,
  Building2Icon,
  FileSpreadsheetIcon,
  FileTypeIcon,
  ArrowLeft,
  Loader2,
  DownloadIcon,
  NetworkIcon,
  ShareIcon,
  Copy,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchNetworkGraph } from "@/components/SearchNetworkGraph";
import ShareDataDialog from "@/components/Share";
import { useToast } from "@/hooks/use-toast";

interface MatchingFile {
  id: string;
  name: string;
  type: string;
  path: string;
}

interface ProjectMatchingFiles {
  [key: string]: MatchingFile[];
}

// Add this mock data at the top with other constants
const mockMatchingFiles: ProjectMatchingFiles = {
  p1: [
    {
      id: "mf1",
      name: "North Facade Panel.skp",
      type: "sketchup",
      path: "/facades/north",
    },
    { id: "mf2", name: "Glass Panel Details.pdf", type: "pdf", path: "/specs" },
    {
      id: "mf3",
      name: "Blue Glass Specification.xlsx",
      type: "excel",
      path: "/specs",
    },
    {
      id: "mf4",
      name: "Panel Assembly.dwg",
      type: "autocad",
      path: "/drawings",
    },
    { id: "mf5", name: "Installation Guide.pdf", type: "pdf", path: "/docs" },
    { id: "mf6", name: "Material List.xlsx", type: "excel", path: "/bom" },
    { id: "mf7", name: "Panel Renders.png", type: "image", path: "/renders" },
    { id: "mf8", name: "Quality Check.pdf", type: "pdf", path: "/qa" },
  ],
  p2: [
    {
      id: "mf9",
      name: "South Facade Model.skp",
      type: "sketchup",
      path: "/facades/south",
    },
    { id: "mf10", name: "Glass Details.pdf", type: "pdf", path: "/specs" },
    {
      id: "mf11",
      name: "Assembly Drawing.dwg",
      type: "autocad",
      path: "/drawings",
    },
    { id: "mf12", name: "Material Specs.xlsx", type: "excel", path: "/bom" },
  ],
  // Steel beam project matching files
  sb_p1: [
    {
      id: "sbf1",
      name: "Structural_Steel_Model.ifc",
      type: "tekla",
      path: "/Commercial Tower/Structural/",
    },
    {
      id: "sbf2",
      name: "First_Floor_Framing.ifc",
      type: "connect",
      path: "/Commercial Tower/Structural/Floors/",
    },
    {
      id: "sbf3",
      name: "Steel_Columns_and_Beams.ifc",
      type: "tekla",
      path: "/Commercial Tower/Structural/Elements/",
    },
    {
      id: "sbf4",
      name: "First_Floor_Framing_Plan.pdf",
      type: "pdf",
      path: "/Commercial Tower/Drawings/Structural/",
    },
    {
      id: "sbf5",
      name: "Structural_Steel_Schedule.xlsx",
      type: "excel",
      path: "/Commercial Tower/Specifications/",
    },
    {
      id: "sbf6",
      name: "Steel_Beam_Details.pdf",
      type: "pdf",
      path: "/Commercial Tower/Details/Structural/",
    },
    {
      id: "sbf7",
      name: "Connection_Detail_W14x90.jpg",
      type: "image",
      path: "/Commercial Tower/Photos/Construction/",
    },
    {
      id: "sbf8",
      name: "W14x90_Beam_Installation_Guide.pdf",
      type: "pdf",
      path: "/Commercial Tower/Documentation/",
    },
    {
      id: "sbf9",
      name: "Steel_Beam_Quantities.xlsx",
      type: "excel",
      path: "/Commercial Tower/Quantities/",
    },
    {
      id: "sbf10",
      name: "First_Floor_Steel_Layout.jpg",
      type: "image",
      path: "/Commercial Tower/Images/",
    },
    {
      id: "sbf11",
      name: "Structural_Calculations_First_Floor.pdf",
      type: "pdf",
      path: "/Commercial Tower/Engineering/",
    },
    {
      id: "sbf12",
      name: "First_Floor_Steel_3D_View.ifc",
      type: "connect",
      path: "/Commercial Tower/Views/",
    },
  ],
  sb_p2: [
    {
      id: "sbf13",
      name: "First_Floor_Framing.ifc",
      type: "connect",
      path: "/Urban Development/Structural/Floors/",
    },
    {
      id: "sbf14",
      name: "First_Floor_Framing_Plan.pdf",
      type: "pdf",
      path: "/Urban Development/Drawings/Structural/",
    },
    {
      id: "sbf15",
      name: "Connection_Detail_W14x90.jpg",
      type: "image",
      path: "/Urban Development/Photos/Construction/",
    },
    {
      id: "sbf16",
      name: "First_Floor_Steel_Layout.jpg",
      type: "image",
      path: "/Urban Development/Images/",
    },
    {
      id: "sbf17",
      name: "First_Floor_Steel_3D_View.ifc",
      type: "connect",
      path: "/Urban Development/Views/",
    },
  ],
};

// Update the product logos mapping
const productLogos: Record<string, string> = {
  sketchup: "/logos/sketchup.svg",
  tekla: "/logos/tekla.svg",
  connect: "/logos/connect-light.svg",
  pdf: "/logos/projectsight.svg",
  excel: "/logos/connect-light.svg",
  autocad: "/logos/connect-light.svg",
  image: "/logos/connect-light.svg",
  ifc: "/logos/connect-light.svg", // Use connect logo for IFC files
};

// Update the product names mapping
const productNames: Record<string, string> = {
  sketchup: "SketchUp",
  tekla: "Tekla",
  connect: "Trimble Connect",
  pdf: "ProjectSight",
  excel: "Trimble Connect",
  autocad: "Trimble Connect",
  image: "Trimble Connect",
  ifc: "Trimble Connect",
};

// Add icon mapping for file types
const fileTypeIcons: Record<string, React.ElementType> = {
  pdf: FileTextIcon,
  excel: FileSpreadsheetIcon,
  sketchup: Building2Icon,
  tekla: Building2Icon,
  autocad: FileCode2Icon,
  image: ImageIcon,
  connect: Building2Icon,
  ifc: Building2Icon,
};

// Loading component for Suspense fallback
function SearchLoading() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-md text-muted-foreground">Loading results...</p>
      </div>
    </div>
  );
}

// Main search results component
function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<
    SearchResultFile | SearchResultProject | null
  >(null);
  const [searchResults, setSearchResults] =
    useState<SearchResults>(mockSearchResults);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareContext, setShareContext] = useState<{
    type: "results" | "file" | "project";
    name?: string;
    count?: number;
    fileIds: string[];
  }>({
    type: "results",
    fileIds: [],
  });
  const { toast } = useToast();
  const [isGraphFullScreen, setIsGraphFullScreen] = useState(false);

  // Add effect to select first result when results change
  useEffect(() => {
    // Select the first file or project if available
    const firstResult =
      searchResults.files[0] || searchResults.projects[0] || null;
    setSelectedItem(firstResult);
  }, [searchResults]);

  // This effect ensures selection is maintained when switching view modes
  useEffect(() => {
    // Nothing to do if we don't have a selected item
    if (!selectedItem) return;

    // After viewMode changes, we force a re-render to ensure the details pane shows correctly
    const timer = setTimeout(() => {
      setSelectedItem({ ...selectedItem });
    }, 50);

    return () => clearTimeout(timer);
  }, [viewMode]);

  // Add effect to log when selectedItem changes
  useEffect(() => {
    console.log("selectedItem changed:", selectedItem?.id);
  }, [selectedItem]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update results when query parameter changes
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      // Show loading state
      setIsLoading(true);

      // Simulate API delay
      const timer = setTimeout(() => {
        // Check for steel beam related queries
        if (
          query.toLowerCase().includes("steel beam") &&
          (query.toLowerCase().includes("w14x90") ||
            query.toLowerCase().includes("cross-section") ||
            query.toLowerCase().includes("1st floor") ||
            query.toLowerCase().includes("first floor"))
        ) {
          setSearchResults({
            ...steelBeamSearchResults,
            query: query,
          });
        } else if (
          query.toLowerCase().includes("facade") &&
          query.toLowerCase().includes("glass") &&
          query.toLowerCase().includes("blue") &&
          query.toLowerCase().includes("north")
        ) {
          setSearchResults({
            ...mockSearchResults,
            query: query,
          });
        } else {
          // Show empty results for other queries
          setSearchResults({
            query: query,
            totalResults: 0,
            files: [],
            projects: [],
            suggestions: [
              {
                id: "r1",
                type: "recommendation",
                query: "Find all Glass panels",
              },
              {
                id: "r2",
                type: "recommendation",
                query: "Show all blue facades",
              },
            ],
          });
        }
        // Hide loading state
        setIsLoading(false);
      }, 1500); // 1.5 second delay

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleItemClick = (item: SearchResultFile | SearchResultProject) => {
    console.log(
      "Item clicked:",
      item.id,
      "Current selected:",
      selectedItem?.id,
      "View mode:",
      viewMode
    );

    // For graph view, always set the selected item regardless if it's the same
    if (viewMode === "graph") {
      console.log("Graph view - always set selected item");
      // Force new reference to ensure React detects the change
      const itemCopy = { ...item };
      setSelectedItem(itemCopy);
      return;
    }

    // In list view, toggle as before
    console.log("List view - toggle selection");
    setSelectedItem(item === selectedItem ? null : item);
  };

  const getProductLogo = (type: string) => {
    return productLogos[type] || null;
  };

  const getProductName = (type: string) => {
    return productNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleViewItem = (
    item: SearchResultFile | SearchResultProject | MatchingFile
  ) => {
    // In a real app, this would navigate to the item or open it
    if ("type" in item && "path" in item) {
      // Handle MatchingFile or SearchResultFile
      console.log("Viewing file:", item);
    } else {
      // Handle SearchResultProject
      console.log("Opening project:", item);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/");
    }
  };

  // Function to generate and download CSV file
  const handleExportCSV = () => {
    if (!searchResults || searchResults.totalResults === 0) return;

    // Define CSV headers
    const headers = [
      "Name",
      "Type",
      "Location",
      "Last Modified",
      "Size",
      "Source",
      "Match Type",
      "Match Details",
    ];

    // Convert files to CSV rows
    const fileRows = searchResults.files.map((file) => [
      file.name,
      getProductName(file.type),
      file.path,
      format(new Date(file.lastModified), "yyyy-MM-dd"),
      file.size,
      file.source || "",
      file.matchType,
      file.matchDetails
        ? file.matchDetails.propertyName
          ? `${file.matchDetails.propertyName}: ${file.matchDetails.propertyValue}`
          : file.matchDetails.contentSnippet || ""
        : "",
    ]);

    // Convert projects to CSV rows
    const projectRows = searchResults.projects.map((project) => [
      project.name,
      "Project",
      "",
      format(new Date(project.lastAccessed), "yyyy-MM-dd"),
      `${project.matchingFiles} files`,
      "Trimble Connect",
      "",
      project.description || "",
    ]);

    // Combine all rows
    const allRows = [headers, ...fileRows, ...projectRows];

    // Generate CSV content
    const csvContent = allRows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Set link properties
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `search-results-${searchResults.query
        .slice(0, 30)
        .replace(/[^a-z0-9]/gi, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`
    );

    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate a shareable URL with current search results
  const getShareableUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/search?q=${encodeURIComponent(searchResults.query)}`;
  };

  // Copy search URL to clipboard
  const handleCopyUrl = () => {
    const shareableUrl = getShareableUrl();
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "URL Copied",
        description: "Search results URL has been copied to clipboard",
        className: "bg-green-800 text-background dark:text-white",
        duration: 2000,
      });
    });
  };

  // Function to open share dialog with appropriate context
  const handleShareClick = (
    context: "results" | "file" | "project",
    item?: SearchResultFile | SearchResultProject
  ) => {
    let shareData = {
      type: context,
      name: "",
      count: 0,
      fileIds: [] as string[],
    };

    if (context === "results") {
      // Sharing all search results
      shareData = {
        type: "results",
        name: `Search results for "${searchResults.query}"`,
        count: searchResults.totalResults,
        fileIds: searchResults.files.map((file) => file.id),
      };
    } else if (context === "file" && item && "type" in item) {
      // Sharing a single file from details pane
      shareData = {
        type: "file",
        name: item.name,
        count: 1,
        fileIds: [item.id],
      };
    } else if (context === "project" && item && !("type" in item)) {
      // Sharing a project and its files from details pane
      shareData = {
        type: "project",
        name: item.name,
        count: item.matchingFiles,
        fileIds: item.fileIds,
      };
    }

    setShareContext(shareData);
    setIsShareOpen(true);
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8 bg-background/50 p-2 rounded-full backdrop-blur-sm shadow-sm w-full relative z-[45]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-10 h-10 shrink-0"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go Back</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex-1 w-full pr-2">
            <OmniSearch
              className="w-full"
              initialValue=""
              defaultEnabled={true}
              disableAutoFocus={true}
              onSearch={(query) =>
                router.push(`/search?q=${encodeURIComponent(query.trim())}`)
              }
            />
          </div>
        </div>

        {isLoading ? (
          <SearchLoading />
        ) : (
          <>
            <div className="mb-8 relative ">
              <div className="flex flex-col gap-4">
                <div className="bg-background/50 p-4 rounded-lg border backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                      {searchResults.totalResults > 0 ? (
                        <>
                          <span className="text-primary">
                            {searchResults.totalResults}
                          </span>{" "}
                          results found
                          <span className="text-sm text-muted-foreground font-normal">
                            for &quot;{searchResults.query}&quot;
                          </span>
                        </>
                      ) : (
                        <>
                          No results found
                          <span className="text-sm text-muted-foreground font-normal">
                            for &quot;{searchResults.query}&quot;
                          </span>
                        </>
                      )}
                    </h1>
                    <div className="flex items-center">
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        className="rounded-l-lg border-r-0"
                        onClick={() => {
                          console.log(
                            "Switching to list view, selectedItem:",
                            selectedItem?.id
                          );
                          setViewMode("list");
                        }}
                      >
                        <Table2Icon className="w-4 h-4 mr-2" />
                        List
                      </Button>
                      <Button
                        variant={viewMode === "graph" ? "default" : "outline"}
                        size="sm"
                        className="rounded-r-lg"
                        onClick={() => {
                          console.log(
                            "Switching to graph view, selectedItem:",
                            selectedItem?.id
                          );
                          setViewMode("graph");
                        }}
                      >
                        <NetworkIcon className="w-4 h-4 mr-2" />
                        Graph
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg bg-background/50 backdrop-blur-sm border shadow-sm hover:bg-background/80"
                          onClick={handleExportCSV}
                          disabled={searchResults.totalResults === 0}
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Download search results as CSV file
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg bg-background/50 backdrop-blur-sm border shadow-sm hover:bg-background/80"
                          onClick={handleCopyUrl}
                          disabled={searchResults.totalResults === 0}
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Copy URL
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Copy search results URL to clipboard
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg bg-background/50 backdrop-blur-sm border shadow-sm hover:bg-background/80"
                          onClick={() => handleShareClick("results")}
                          disabled={searchResults.totalResults === 0}
                        >
                          <ShareIcon className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Share search results with others
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <div
                className={cn(
                  "flex-1 transition-all duration-300",
                  selectedItem && viewMode === "list"
                    ? "lg:max-w-[60%]"
                    : selectedItem && viewMode === "graph" && !isGraphFullScreen
                    ? "lg:max-w-[75%]"
                    : "lg:max-w-full"
                )}
              >
                {viewMode === "graph" ? (
                  <div className="relative">
                    <SearchNetworkGraph
                      data={searchResults}
                      onNodeClick={handleItemClick}
                      height={500}
                      selectedItem={selectedItem}
                      onFullScreenChange={setIsGraphFullScreen}
                    />
                    {selectedItem && isGraphFullScreen && (
                      <div className="hidden lg:block fixed top-4 right-4 w-[300px] z-[10000]">
                        <div className="rounded-xl border bg-background/50 backdrop-blur-sm shadow-lg overflow-auto max-h-[calc(100vh-2rem)]">
                          <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center relative">
                                {"type" in selectedItem ? (
                                  fileTypeIcons[selectedItem.type] ? (
                                    React.createElement(
                                      fileTypeIcons[selectedItem.type],
                                      {
                                        className:
                                          "w-5 h-5 text-muted-foreground",
                                      }
                                    )
                                  ) : (
                                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                                  )
                                ) : (
                                  <FolderIcon className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold">
                                  Details
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                  {"type" in selectedItem
                                    ? getProductName(selectedItem.type)
                                    : "Trimble Connect Project"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedItem(null)}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="p-4 space-y-6">
                            {"type" in selectedItem ? (
                              // File Details
                              <>
                                <div>
                                  <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                    File Information
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Name
                                      </p>
                                      <p className="text-sm font-medium">
                                        {selectedItem.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Source
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem.source}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Size
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem.size}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Last Modified
                                      </p>
                                      <p className="text-sm">
                                        {format(
                                          new Date(selectedItem.lastModified),
                                          "PPP"
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Path
                                      </p>
                                      <p className="text-sm break-all">
                                        {selectedItem.path}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {selectedItem.matchDetails && (
                                  <div>
                                    <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                      Match Details
                                    </h3>
                                    <div className="space-y-4">
                                      {selectedItem.matchDetails
                                        .propertyName && (
                                        <>
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                              Property
                                            </p>
                                            <p className="text-sm">
                                              {
                                                selectedItem.matchDetails
                                                  .propertyName
                                              }
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                              Value
                                            </p>
                                            <p className="text-sm font-medium">
                                              {
                                                selectedItem.matchDetails
                                                  .propertyValue
                                              }
                                            </p>
                                          </div>
                                        </>
                                      )}
                                      {selectedItem.matchDetails
                                        .contentSnippet && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">
                                            Content Match
                                          </p>
                                          <div className="bg-muted/50 p-3 rounded text-sm">
                                            {
                                              selectedItem.matchDetails
                                                .contentSnippet
                                            }
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-4 space-y-2">
                                  <Button
                                    className="w-full"
                                    onClick={() => handleViewItem(selectedItem)}
                                  >
                                    View in {getProductName(selectedItem.type)}
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={handleCopyUrl}
                                      size="sm"
                                    >
                                      <Link className="w-4 h-4 mr-2" />
                                      Copy URL
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() =>
                                        handleShareClick("file", selectedItem)
                                      }
                                      size="sm"
                                    >
                                      <ShareIcon className="w-4 h-4 mr-2" />
                                      Share
                                    </Button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              // Project Details
                              <>
                                <div>
                                  <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                    Project Information
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Name
                                      </p>
                                      <p className="text-sm font-medium">
                                        {selectedItem.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Last Accessed
                                      </p>
                                      <p className="text-sm">
                                        {format(
                                          new Date(selectedItem.lastAccessed),
                                          "PPP"
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Matching Files
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem.matchingFiles}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {selectedItem.description && (
                                  <div>
                                    <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                      Description
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedItem.description}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                    Matching Files
                                  </h3>
                                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                                    {mockMatchingFiles[selectedItem.id]?.map(
                                      (file) => (
                                        <div
                                          key={file.id}
                                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                                        >
                                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center relative shrink-0">
                                            {fileTypeIcons[file.type] ? (
                                              React.createElement(
                                                fileTypeIcons[file.type],
                                                {
                                                  className:
                                                    "w-3 h-3 text-muted-foreground",
                                                }
                                              )
                                            ) : (
                                              <FileIcon className="w-3 h-3 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                              {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {file.path}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div className="pt-4 space-y-2">
                                  <Button
                                    className="w-full"
                                    onClick={() => handleViewItem(selectedItem)}
                                  >
                                    Open in Trimble Connect
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={handleCopyUrl}
                                      size="sm"
                                    >
                                      <Link className="w-4 h-4 mr-2" />
                                      Copy URL
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() =>
                                        handleShareClick(
                                          "project",
                                          selectedItem
                                        )
                                      }
                                      size="sm"
                                    >
                                      <ShareIcon className="w-4 h-4 mr-2" />
                                      Share
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {searchResults.files.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Files</h2>
                        <div className="grid gap-4">
                          {searchResults.files.map((file) => (
                            <div
                              key={file.id}
                              className={cn(
                                "p-4 rounded-xl border bg-background/50 hover:bg-background/80 cursor-pointer transition-all duration-200 ",
                                "hover:shadow-md hover:scale-[1.02]",
                                selectedItem?.id === file.id &&
                                  "ring-2 ring-primary/20 shadow-lg"
                              )}
                              onClick={() => handleItemClick(file)}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center relative">
                                  {getProductLogo(file.type) ? (
                                    <Image
                                      src={getProductLogo(file.type)!}
                                      alt={file.source || ""}
                                      fill
                                      className="p-2 object-contain"
                                    />
                                  ) : fileTypeIcons[file.type] ? (
                                    React.createElement(
                                      fileTypeIcons[file.type],
                                      {
                                        className:
                                          "w-6 h-6 text-muted-foreground",
                                      }
                                    )
                                  ) : (
                                    <FileIcon className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">{file.name}</h3>
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {file.source || getProductName(file.type)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {file.path}
                                  </p>
                                  {file.matchDetails && (
                                    <div className="text-sm bg-muted/50 p-2 rounded">
                                      {file.matchDetails.propertyName && (
                                        <span>
                                          {file.matchDetails.propertyName}:{" "}
                                          {file.matchDetails.propertyValue}
                                        </span>
                                      )}
                                      {file.matchDetails.contentSnippet && (
                                        <span>
                                          {file.matchDetails.contentSnippet}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(file.lastModified),
                                    "MMM d, yyyy"
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.projects.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Projects</h2>
                        <div className="grid gap-4">
                          {searchResults.projects.map((project) => (
                            <div
                              key={project.id}
                              className={cn(
                                "p-4 rounded-xl border bg-background/50 hover:bg-background/80 cursor-pointer transition-all duration-200 ",
                                "hover:shadow-md hover:scale-[1.02]",
                                selectedItem?.id === project.id &&
                                  "ring-2 ring-primary/20 shadow-lg"
                              )}
                              onClick={() => handleItemClick(project)}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center relative">
                                  <Image
                                    src="/logos/connect-light.svg"
                                    alt="Trimble Connect"
                                    fill
                                    className="p-2 object-contain"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {project.name}
                                    </h3>
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Trimble Connect Project
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {project.description}
                                  </p>
                                  <div className="text-sm">
                                    <span className="text-primary">
                                      {project.matchingFiles} matching files
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.suggestions.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold mb-4">
                          {searchResults.totalResults === 0
                            ? "Suggestions"
                            : "Related Searches"}
                        </h2>
                        <div className="grid gap-3">
                          {searchResults.suggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="p-4 rounded-xl border bg-background/50 hover:bg-background/80 cursor-pointer transition-all duration-200 backdrop-blur-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-4">
                                {suggestion.type === "history" ? (
                                  <ClockIcon className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <SearchIcon className="w-5 h-5 text-muted-foreground" />
                                )}
                                <span>{suggestion.query}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedItem && viewMode === "list" && (
                <div className="hidden lg:block w-[40%]">
                  <div className="sticky top-8 rounded-xl border bg-background/50 backdrop-blur-sm shadow-lg overflow-auto max-h-[calc(100vh-200px)]">
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center relative">
                          {"type" in selectedItem ? (
                            fileTypeIcons[selectedItem.type] ? (
                              React.createElement(
                                fileTypeIcons[selectedItem.type],
                                {
                                  className: "w-5 h-5 text-muted-foreground",
                                }
                              )
                            ) : (
                              <FileIcon className="w-5 h-5 text-muted-foreground" />
                            )
                          ) : (
                            <FolderIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Details</h2>
                          <p className="text-xs text-muted-foreground">
                            {"type" in selectedItem
                              ? getProductName(selectedItem.type)
                              : "Trimble Connect Project"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedItem(null)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-6">
                      {"type" in selectedItem ? (
                        // File Details
                        <>
                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              File Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Name
                                </p>
                                <p className="text-sm font-medium">
                                  {selectedItem.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Source
                                </p>
                                <p className="text-sm">{selectedItem.source}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Size
                                </p>
                                <p className="text-sm">{selectedItem.size}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Last Modified
                                </p>
                                <p className="text-sm">
                                  {format(
                                    new Date(selectedItem.lastModified),
                                    "PPP"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Path
                                </p>
                                <p className="text-sm break-all">
                                  {selectedItem.path}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedItem.matchDetails && (
                            <div>
                              <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                Match Details
                              </h3>
                              <div className="space-y-4">
                                {selectedItem.matchDetails.propertyName && (
                                  <>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Property
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem.matchDetails.propertyName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Value
                                      </p>
                                      <p className="text-sm font-medium">
                                        {
                                          selectedItem.matchDetails
                                            .propertyValue
                                        }
                                      </p>
                                    </div>
                                  </>
                                )}
                                {selectedItem.matchDetails.contentSnippet && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Content Match
                                    </p>
                                    <div className="bg-muted/50 p-3 rounded text-sm">
                                      {selectedItem.matchDetails.contentSnippet}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-4 space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => handleViewItem(selectedItem)}
                            >
                              View in {getProductName(selectedItem.type)}
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCopyUrl}
                                size="sm"
                              >
                                <Link className="w-4 h-4 mr-2" />
                                Copy URL
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleShareClick("file", selectedItem)
                                }
                                size="sm"
                              >
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Project Details
                        <>
                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              Project Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Name
                                </p>
                                <p className="text-sm font-medium">
                                  {selectedItem.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Last Accessed
                                </p>
                                <p className="text-sm">
                                  {format(
                                    new Date(selectedItem.lastAccessed),
                                    "PPP"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Matching Files
                                </p>
                                <p className="text-sm">
                                  {selectedItem.matchingFiles}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedItem.description && (
                            <div>
                              <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                Description
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedItem.description}
                              </p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              Matching Files
                            </h3>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                              {mockMatchingFiles[selectedItem.id]?.map(
                                (file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                                  >
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center relative shrink-0">
                                      {fileTypeIcons[file.type] ? (
                                        React.createElement(
                                          fileTypeIcons[file.type],
                                          {
                                            className:
                                              "w-3 h-3 text-muted-foreground",
                                          }
                                        )
                                      ) : (
                                        <FileIcon className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {file.path}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="pt-4 space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => handleViewItem(selectedItem)}
                            >
                              Open in Trimble Connect
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCopyUrl}
                                size="sm"
                              >
                                <Link className="w-4 h-4 mr-2" />
                                Copy URL
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleShareClick("project", selectedItem)
                                }
                                size="sm"
                              >
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedItem && viewMode === "graph" && !isGraphFullScreen && (
                <div className="hidden lg:block w-[300px]">
                  <div className="sticky top-8 rounded-xl border bg-background/50 backdrop-blur-sm shadow-lg overflow-auto max-h-[calc(100vh-200px)]">
                    <div className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center relative">
                          {"type" in selectedItem ? (
                            fileTypeIcons[selectedItem.type] ? (
                              React.createElement(
                                fileTypeIcons[selectedItem.type],
                                {
                                  className: "w-5 h-5 text-muted-foreground",
                                }
                              )
                            ) : (
                              <FileIcon className="w-5 h-5 text-muted-foreground" />
                            )
                          ) : (
                            <FolderIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Details</h2>
                          <p className="text-xs text-muted-foreground">
                            {"type" in selectedItem
                              ? getProductName(selectedItem.type)
                              : "Trimble Connect Project"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedItem(null)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-6">
                      {"type" in selectedItem ? (
                        // File Details
                        <>
                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              File Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Name
                                </p>
                                <p className="text-sm font-medium">
                                  {selectedItem.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Source
                                </p>
                                <p className="text-sm">{selectedItem.source}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Size
                                </p>
                                <p className="text-sm">{selectedItem.size}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Last Modified
                                </p>
                                <p className="text-sm">
                                  {format(
                                    new Date(selectedItem.lastModified),
                                    "PPP"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Path
                                </p>
                                <p className="text-sm break-all">
                                  {selectedItem.path}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedItem.matchDetails && (
                            <div>
                              <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                Match Details
                              </h3>
                              <div className="space-y-4">
                                {selectedItem.matchDetails.propertyName && (
                                  <>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Property
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem.matchDetails.propertyName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Value
                                      </p>
                                      <p className="text-sm font-medium">
                                        {
                                          selectedItem.matchDetails
                                            .propertyValue
                                        }
                                      </p>
                                    </div>
                                  </>
                                )}
                                {selectedItem.matchDetails.contentSnippet && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Content Match
                                    </p>
                                    <div className="bg-muted/50 p-3 rounded text-sm">
                                      {selectedItem.matchDetails.contentSnippet}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-4 space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => handleViewItem(selectedItem)}
                            >
                              View in {getProductName(selectedItem.type)}
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCopyUrl}
                                size="sm"
                              >
                                <Link className="w-4 h-4 mr-2" />
                                Copy URL
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleShareClick("file", selectedItem)
                                }
                                size="sm"
                              >
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Project Details
                        <>
                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              Project Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Name
                                </p>
                                <p className="text-sm font-medium">
                                  {selectedItem.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Last Accessed
                                </p>
                                <p className="text-sm">
                                  {format(
                                    new Date(selectedItem.lastAccessed),
                                    "PPP"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Matching Files
                                </p>
                                <p className="text-sm">
                                  {selectedItem.matchingFiles}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedItem.description && (
                            <div>
                              <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                                Description
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedItem.description}
                              </p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-medium mb-3 pb-1 border-b">
                              Matching Files
                            </h3>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                              {mockMatchingFiles[selectedItem.id]?.map(
                                (file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                                  >
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center relative shrink-0">
                                      {fileTypeIcons[file.type] ? (
                                        React.createElement(
                                          fileTypeIcons[file.type],
                                          {
                                            className:
                                              "w-3 h-3 text-muted-foreground",
                                          }
                                        )
                                      ) : (
                                        <FileIcon className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {file.path}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="pt-4 space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => handleViewItem(selectedItem)}
                            >
                              Open in Trimble Connect
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCopyUrl}
                                size="sm"
                              >
                                <Link className="w-4 h-4 mr-2" />
                                Copy URL
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  handleShareClick("project", selectedItem)
                                }
                                size="sm"
                              >
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Details Sheet */}
            <Sheet
              open={selectedItem !== null && isMobile}
              onOpenChange={(open) => !open && setSelectedItem(null)}
            >
              <SheetContent side="bottom" className="h-[80vh] p-0">
                {/* ... existing mobile sheet content ... */}
              </SheetContent>
            </Sheet>

            {/* Share dialog */}
            <ShareDataDialog
              open={isShareOpen}
              onOpenChange={setIsShareOpen}
              itemName={shareContext.name}
              itemCount={shareContext.count}
              itemType={shareContext.type as "file" | "folder" | "results"}
              fileId={shareContext.fileIds}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchResultsContent />
    </Suspense>
  );
}
