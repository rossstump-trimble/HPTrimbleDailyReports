import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Database,
  FileText,
  BarChart4,
  Calendar,
  MessageSquare,
  Building2,
  Box,
  Map,
  Users,
  DollarSign,
  Briefcase,
  CloudUpload,
  Layers,
  FolderOpen,
  Files,
  FileSpreadsheet,
  Globe,
  Image as ImageIcon,
  Table,
  Check,
  PlusCircle,
  Laptop,
  FileCode,
  Cloud,
  Mail,
} from "lucide-react";
import {
  SiAutodesk,
  SiGoogle,
  SiDropbox,
  SiSlack,
  SiAsana,
  SiBitbucket,
  SiTrello,
} from "react-icons/si";
import {
  FaJira,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileWord,
  FaMicrosoft,
} from "react-icons/fa";

interface PSIntegrationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIntegration?: (
    category: string,
    integration: string,
    id: string
  ) => void;
}

// Define integration category type
type IntegrationCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
};

// Define integration item type
type IntegrationItem = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status?: "connected" | "available" | "coming-soon";
  category: string;
  url?: string;
};

export function PSIntegrations({
  open,
  onOpenChange,
  onSelectIntegration,
}: PSIntegrationsProps) {
  // State for active category
  const [activeCategory, setActiveCategory] = useState("document-management");
  // State for search filter
  const [searchQuery, setSearchQuery] = useState("");
  // State for hovering over item
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // Reset search when changing category
  useEffect(() => {
    setSearchQuery("");
  }, [activeCategory]);

  // Define categories
  const categories: IntegrationCategory[] = [
    { id: "document-management", label: "Document Management", icon: Files },
    { id: "project-management", label: "Project Management", icon: Briefcase },
    { id: "bim", label: "BIM & 3D", icon: Box },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "field-management", label: "Field Management", icon: Map },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "scheduling", label: "Scheduling", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart4 },
    { id: "all-integrations", label: "All Integrations", icon: Database },
  ];

  // Define integrations
  const integrationsByCategory: Record<string, IntegrationItem[]> = {
    "document-management": [
      {
        id: "onedrive",
        name: "Microsoft OneDrive",
        description: "Access and sync your files from OneDrive",
        icon: Cloud,
        status: "coming-soon",
        category: "document-management",
        url: "https://onedrive.live.com",
      },
      {
        id: "trimble-connect",
        name: "Trimble Connect",
        description: "Access and sync your files from Trimble Connect",
        icon: Cloud,
        status: "connected",
        category: "document-management",
        url: "https://trimble.com/connect",
      },
      {
        id: "autodeskdocs",
        name: "Autodesk Docs",
        description: "Access and sync your files from Autodesk Docs",
        icon: Cloud,
        status: "connected",
        category: "document-management",
        url: "https://autodesk.com/docs",
      },
      {
        id: "dropbox",
        name: "Dropbox",
        description: "Share and store files in the cloud",
        icon: Cloud,
        status: "available",
        category: "document-management",
        url: "https://dropbox.com",
      },
      {
        id: "google-drive",
        name: "Google Drive",
        description: "Store, access, and share your files in one place",
        icon: Cloud,
        status: "connected",
        category: "document-management",
        url: "https://drive.google.com",
      },
      {
        id: "sharepoint",
        name: "SharePoint",
        description: "Collaboration platform for document management",
        icon: Cloud,
        status: "available",
        category: "document-management",
        url: "https://sharepoint.com",
      },
      {
        id: "box",
        name: "Box",
        description: "Secure content management and collaboration",
        icon: FolderOpen,
        status: "coming-soon",
        category: "document-management",
        url: "https://box.com",
      },
    ],
    "project-management": [
      {
        id: "procore",
        name: "Procore",
        description: "Construction project management software",
        icon: Briefcase,
        status: "available",
        category: "project-management",
        url: "https://procore.com",
      },
      {
        id: "asana",
        name: "Asana",
        description: "Work management platform for teams",
        icon: Briefcase,
        status: "available",
        category: "project-management",
        url: "https://asana.com",
      },

      {
        id: "trello",
        name: "Trello",
        description: "Visual collaboration tool for workflow",
        icon: Briefcase,
        status: "coming-soon",
        category: "project-management",
        url: "https://trello.com",
      },
    ],
    bim: [
      {
        id: "autodesk-bim360",
        name: "Autodesk BIM 360",
        description: "Connect, organize and optimize BIM projects",
        icon: Box,
        status: "connected",
        category: "bim",
        url: "https://www.autodesk.com/bim-360",
      },
      {
        id: "navisworks",
        name: "Navisworks",
        description: "3D model review and coordination",
        icon: Box,
        status: "available",
        category: "bim",
        url: "https://www.autodesk.com/navisworks",
      },
      {
        id: "revit",
        name: "Revit",
        description:
          "BIM software for architecture, engineering and construction",
        icon: Building2,
        status: "available",
        category: "bim",
        url: "https://www.autodesk.com/revit",
      },
    ],
    communication: [
      {
        id: "microsoft-teams",
        name: "Microsoft Teams",
        description: "Communication and collaboration platform",
        icon: MessageSquare,
        status: "connected",
        category: "communication",
        url: "https://teams.microsoft.com",
      },
      {
        id: "slack",
        name: "Slack",
        description: "Business communication platform",
        icon: MessageSquare,
        status: "available",
        category: "communication",
        url: "https://slack.com",
      },
      {
        id: "outlook",
        name: "Microsoft Outlook",
        description: "Email and calendar integration",
        icon: Mail,
        status: "connected",
        category: "communication",
        url: "https://outlook.office.com",
      },
    ],
    "field-management": [
      {
        id: "fieldwire",
        name: "Fieldwire",
        description: "Field management for construction teams",
        icon: Map,
        status: "available",
        category: "field-management",
        url: "https://fieldwire.com",
      },
      {
        id: "planrad",
        name: "PlanRadar",
        description: "Construction and real estate field management",
        icon: Map,
        status: "coming-soon",
        category: "field-management",
        url: "https://planradar.com",
      },
    ],
    financial: [
      {
        id: "quickbooks",
        name: "QuickBooks",
        description: "Accounting and financial management",
        icon: DollarSign,
        status: "available",
        category: "financial",
        url: "https://quickbooks.intuit.com",
      },
      {
        id: "sage",
        name: "Sage",
        description: "Business and financial management software",
        icon: DollarSign,
        status: "coming-soon",
        category: "financial",
        url: "https://sage.com",
      },
      {
        id: "excel",
        name: "Microsoft Excel",
        description: "Spreadsheet software for financial analysis",
        icon: FileText,
        status: "connected",
        category: "financial",
        url: "https://office.microsoft.com/excel",
      },
    ],
    scheduling: [
      {
        id: "ms-project",
        name: "Microsoft Project",
        description: "Project management and scheduling",
        icon: Calendar,
        status: "available",
        category: "scheduling",
        url: "https://microsoft.com/project",
      },
      {
        id: "primavera",
        name: "Oracle Primavera P6",
        description: "Enterprise project portfolio management",
        icon: Calendar,
        status: "coming-soon",
        category: "scheduling",
        url: "https://oracle.com/primavera",
      },
    ],
    analytics: [
      {
        id: "power-bi",
        name: "Microsoft Power BI",
        description: "Business analytics and data visualization",
        icon: BarChart4,
        status: "available",
        category: "analytics",
        url: "https://powerbi.microsoft.com",
      },
      {
        id: "tableau",
        name: "Tableau",
        description: "Interactive data visualization software",
        icon: BarChart4,
        status: "coming-soon",
        category: "analytics",
        url: "https://tableau.com",
      },
    ],
  };

  // Create the "all-integrations" category
  integrationsByCategory["all-integrations"] = Object.values(
    integrationsByCategory
  ).flat();

  // Get current category's integrations
  const currentCategoryItems = integrationsByCategory[activeCategory] || [];

  // Filter integrations based on search query
  const filteredItems = currentCategoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle selection of an integration
  const handleSelectIntegration = (integration: IntegrationItem) => {
    if (integration.status === "coming-soon") {
      alert("This integration is coming soon!");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      if (onSelectIntegration) {
        onSelectIntegration(
          integration.category,
          integration.name,
          integration.id
        );
      }
      setIsLoading(false);
      onOpenChange(false);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] h-[80vh] bg-secondary dark:bg-slate-900 ring-1 dark:ring-slate-800 p-0 gap-0 flex">
        <div className="flex flex-1 h-full">
          {/* Left sidebar - categories */}
          <ScrollArea className="w-[220px] border-r dark:border-slate-800 h-full bg-muted/40 dark:bg-slate-950/40">
            <div className="py-8">
              <h3 className="px-4 text-sm font-medium mb-2">Categories</h3>
              <div className="space-y-1 px-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      activeCategory === category.id ? "ghost2" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start text-sm font-normal",
                      activeCategory === category.id
                        ? "bg-foreground/10 dark:bg-blue-600/20 dark:text-white"
                        : "dark:hover:bg-slate-800/80"
                    )}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <category.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeCategory === category.id
                          ? "text-primary dark:text-blue-400"
                          : ""
                      )}
                    />
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Right content - integration items list */}
          <div className="flex-1 flex flex-col h-full">
            <DialogHeader className="px-6 py-6 border-b dark:border-slate-800">
              <DialogTitle className="text-lg pb-4">
                Connect Your Third-Party Apps
              </DialogTitle>
              <div className="mt-4">
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 dark:border-slate-700"
                />
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 pl-6 pr-6 pt-4 pb-4 bg-background dark:bg-slate-950">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p>No integrations found</p>
                  <p className="text-sm">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "border rounded-md p-4 cursor-pointer transition-colors",
                        item.status === "connected"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                          : item.status === "coming-soon"
                          ? "border-gray-300 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700 opacity-70"
                          : "hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:border-slate-600",
                        hoveredItem === item.id &&
                          "border-primary dark:border-blue-500"
                      )}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleSelectIntegration(item)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-primary/10 dark:bg-slate-800 p-2">
                          <item.icon className="h-5 w-5 text-primary dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>

                        {item.status === "connected" ? (
                          <span className="flex items-center text-green-600 dark:text-green-400 text-xs gap-1">
                            <Check className="h-4 w-4" />
                            Connected
                          </span>
                        ) : item.status === "coming-soon" ? (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="flex items-center text-primary dark:text-blue-400 text-xs gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Connect
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="p-4 border-t dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="dark:border-slate-700 dark:hover:bg-slate-800"
                disabled={isLoading}
              >
                Cancel
              </Button>
              {isLoading ? (
                <Button disabled className="relative min-w-[100px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                  <span className="opacity-0">Done</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => onOpenChange(false)}
                  className="min-w-[100px]"
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
