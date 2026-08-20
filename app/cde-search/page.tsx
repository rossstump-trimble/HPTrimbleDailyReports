"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  source: "Connect" | "ProjectSight" | "Quadri" | "Tekla" | "eSubcontractor";
  url: string;
  type: string;
  date: string;
}

export default function CDESearchPage() {
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("Auto");

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.length > 2) {
      setIsLoading(true);

      // Simulate search delay
      setTimeout(() => {
        // Check for specific search term
        if (value.includes("Building_C_Full.ifc")) {
          // Special hardcoded results for Building_C_Full.ifc
          setResults([
            {
              id: "1",
              title: "Building_C_Full.ifc",
              description:
                "Complete BIM model for Building C including structural elements, MEP systems and architectural details.",
              source: "Connect",
              url: "https://main.d2cuh4jrvh6jip.amplifyapp.com/ifcs",
              type: "IFC Model",
              date: "2023-11-15",
            },
            {
              id: "2",
              title: "Building_C_Full.ifc - Foundation Analysis",
              description:
                "Foundation load analysis based on the Building C IFC model with detailed structural calculations.",
              source: "ProjectSight",
              url: "#",
              type: "Analysis Report",
              date: "2023-12-02",
            },
            {
              id: "3",
              title: "Building_C_Full.ifc - Site Integration",
              description:
                "Site context model showing Building C integration with surrounding terrain and infrastructure.",
              source: "Quadri",
              url: "#",
              type: "Site Model",
              date: "2023-11-28",
            },
          ]);
        } else {
          // Original mock results for other searches
          setResults([
            {
              id: "1",
              title: "Foundation Design Document",
              description:
                "Technical specifications for foundation design including load calculations and material requirements.",
              source: "Connect",
              url: "#",
              type: "Document",
              date: "2023-09-15",
            },
            {
              id: "2",
              title: "Site Survey Report",
              description:
                "Comprehensive site analysis including topography, soil conditions, and existing structures.",
              source: "ProjectSight",
              url: "#",
              type: "Report",
              date: "2023-10-02",
            },
            {
              id: "3",
              title: "Structural Analysis Model",
              description:
                "3D model with structural calculations for the main building framework.",
              source: "Tekla",
              url: "#",
              type: "Model",
              date: "2023-11-12",
            },
            {
              id: "4",
              title: "Road Intersection Design",
              description:
                "Detailed design for the access road intersection including traffic flow analysis.",
              source: "Quadri",
              url: "#",
              type: "Design",
              date: "2023-10-22",
            },
            {
              id: "5",
              title: "Electrical Systems Quote",
              description:
                "Cost breakdown for electrical installation including materials and labor.",
              source: "eSubcontractor",
              url: "#",
              type: "Quote",
              date: "2023-12-05",
            },
          ]);
        }
        setIsLoading(false);
      }, 1500);
    } else {
      setResults([]);
    }
  };

  const filteredResults =
    activeTab === "all"
      ? results
      : results.filter((result) => result.source.toLowerCase() === activeTab);

  const sources = [
    "Connect",
    "ProjectSight",
    "Quadri",
    "Tekla",
    "eSubcontractor",
  ];

  // Map to get the correct logo path for each source
  const logoMap: Record<string, string> = {
    Connect: "/logos/connect-light.svg",
    ProjectSight: "/logos/projectsight.svg",
    Tekla: "/logos/tekla.svg",
    Quadri: "/logos/analytics.svg", // Using analytics as a substitute for Quadri
    eSubcontractor: "/logos/marketplace-new.svg", // Using marketplace as a substitute
  };

  // Function to handle card click
  const handleCardClick = (result: SearchResult) => {
    if (result.source === "Connect" && result.url !== "#") {
      window.open(result.url, "_blank");
    }
  };

  return (
    <div className="container mx-auto py-2 px-4 max-w-6xl">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gradient-to-b from-blue-50 to-white py-4 px-8 rounded-xl shadow-sm flex flex-col items-center w-full">
          <div className="w-[350px] h-[160px] relative mb-2">
            <Image
              src="/cde-search.svg"
              alt="CDE Search"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <h2 className="text-2xl text-blue-700 font-semibold mt-1">
            Search across all Trimble applications in one place
          </h2>
        </div>
      </div>

      <div className="mb-10 relative max-w-4xl mx-auto">
        <div className="rounded-full border border-gray-200 bg-white shadow-md overflow-hidden flex items-center hover:border-blue-300 transition-all">
          <div className="flex items-center pl-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center h-7 px-2 mr-1 rounded-md bg-gray-100 text-gray-700 text-sm cursor-pointer hover:bg-gray-200">
                <svg
                  className="mr-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 10L8 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 8V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                {selectedFilter}
                <svg
                  className="ml-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedFilter("Auto")}>
                  <svg
                    className="mr-2 h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 10L8 16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 12V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 8V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Auto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 bg-gray-50">
                  FILE FORMATS
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedFilter("PDF")}>
                  <svg
                    className="mr-2 h-4 w-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("CAD")}>
                  <svg
                    className="mr-2 h-4 w-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9.88L11.28 5L22 9.88L11.28 15L2 9.88Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 9.88V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 12V17.67C6 17.67 8.27 20 11.28 20C14.29 20 16.56 17.67 16.56 17.67V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  CAD
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Excel")}>
                  <svg
                    className="mr-2 h-4 w-4 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="3"
                      y1="9"
                      x2="21"
                      y2="9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="3"
                      y1="15"
                      x2="21"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="9"
                      y1="3"
                      x2="9"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="15"
                      y1="3"
                      x2="15"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-500 bg-gray-50">
                  CONTENT TYPES
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedFilter("Models")}>
                  <svg
                    className="mr-2 h-4 w-4 text-purple-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.27002 6.96002L12 12.01L20.73 6.96002"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22.08V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Models
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Reports")}>
                  <svg
                    className="mr-2 h-4 w-4 text-orange-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 13H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9H9H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <input
            type="text"
            placeholder="Ask anything..."
            className="h-16 flex-1 px-4 text-base focus:outline-none"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className="flex items-center pr-4 space-x-3">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12H22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 10L12 15L17 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 5L19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center my-12 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">
            Searching across Trimble applications...
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div>
          <Tabs
            defaultValue="all"
            className="mb-6"
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full flex justify-start mb-8 overflow-x-auto bg-transparent space-x-2">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-full px-6"
              >
                All Results ({results.length})
              </TabsTrigger>
              {sources.map((source) => (
                <TabsTrigger
                  key={source}
                  value={source.toLowerCase()}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-full px-6"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 relative">
                      <Image
                        src={logoMap[source]}
                        alt={source}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span>{source}</span>
                  </div>
                  <span className="ml-2">
                    ({results.filter((r) => r.source === source).length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredResults.map((result) => (
                <Card
                  key={result.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer border border-gray-100 overflow-hidden shadow-sm rounded-xl"
                  onClick={() => handleCardClick(result)}
                >
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 relative mt-1">
                        <Image
                          src={logoMap[result.source]}
                          alt={result.source}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-800 hover:text-blue-600">
                          {result.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {result.type} • Last updated: {result.date}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {result.source}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{result.description}</p>
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-gray-50">
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {result.type}
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!isLoading && query.length > 2 && results.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-xl text-gray-500 font-medium">
            No results found for &quot;{query}&quot;
          </p>
          <p className="text-gray-400 mt-2">
            Try different keywords or broadening your search
          </p>
        </div>
      )}

      {!isLoading && query.length <= 2 && (
        <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50 rounded-xl border border-gray-100">
          <p className="text-xl text-gray-600 font-medium">
            Start typing to search across all Trimble applications
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {sources.map((source) => (
              <div
                key={source}
                className="flex flex-col items-center gap-2 w-32"
              >
                <div className="w-12 h-12 relative">
                  <Image
                    src={logoMap[source]}
                    alt={source}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-sm text-gray-600">{source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
