"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MoreHorizontal,
  Grid3X3,
  List,
  Eye,
  LayoutGrid,
  FileText,
  Printer,
  AlertCircle,
  Info,
  FilePlus,
  TrendingUp,
  BarChart3,
  Building2,
  MapPin,
  DollarSign,
  ClipboardCheck,
  Package,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Zap,
  Wrench,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Lightbulb,
  ArrowUpRight,
  Truck,
  HardHat,
  Ruler,
  ScanLine,
} from "lucide-react";

// ---- Types ----

type SidePanelType = "search" | "info" | "add";
type MainTab = "dashboard" | "items" | "field-work" | "property-sets" | "templates";
type ViewMode = "grid" | "list";

interface TrackingItem {
  id: number;
  name: string;
  category: string;
  floor: string;
  zone: string;
  contract: string;
  sovItem: string;
  planned: number;
  actual: number;
  unit: string;
  status: "on-track" | "behind" | "complete" | "not-started";
  lastUpdated: string;
  assignee: string;
}

interface FieldWorkItem {
  id: number;
  name: string;
  type: "layout-survey" | "qa-qc" | "survey-request" | "general";
  floor: string;
  zone: string;
  status: "complete" | "in-progress" | "pending" | "overdue";
  completedDate: string | null;
  dueDate: string;
  assignee: string;
  tflxLinked: boolean;
  percentComplete: number;
}

interface PropertySetItem {
  id: number;
  component: string;
  discipline: string;
  floor: string;
  zone: string;
  fabricationStatus: "in-design" | "in-development" | "loaded-on-truck" | "delivered-to-site";
  installStatus: "arrived-on-site" | "install-in-progress" | "inspection" | "complete" | "not-started";
  model: string;
  lastSync: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  tags: string[];
  setupSteps: string[];
}

// ---- Mock Data ----

const mockTrackingItems: TrackingItem[] = [
  { id: 1, name: "Fire Stopping Doors", category: "Discrete Items", floor: "L1", zone: "Zone A", contract: "MEP-001", sovItem: "Fire Protection", planned: 48, actual: 36, unit: "EA", status: "behind", lastUpdated: "2025-03-08", assignee: "Jesse Lavine" },
  { id: 2, name: "Electrical Outlets", category: "Discrete Items", floor: "L1", zone: "Zone B", contract: "ELEC-002", sovItem: "Electrical Rough-In", planned: 240, actual: 240, unit: "EA", status: "complete", lastUpdated: "2025-03-07", assignee: "Mike Davis" },
  { id: 3, name: "Sprinkler Heads", category: "Discrete Items", floor: "L2", zone: "Zone A", contract: "MEP-001", sovItem: "Fire Protection", planned: 120, actual: 98, unit: "EA", status: "on-track", lastUpdated: "2025-03-09", assignee: "Sarah Johnson" },
  { id: 4, name: "HVAC Diffusers", category: "Discrete Items", floor: "L2", zone: "Zone C", contract: "HVAC-003", sovItem: "HVAC Install", planned: 64, actual: 20, unit: "EA", status: "behind", lastUpdated: "2025-03-06", assignee: "Tom Lee" },
  { id: 5, name: "Plumbing Fixtures", category: "Discrete Items", floor: "L3", zone: "Zone A", contract: "PLMB-004", sovItem: "Plumbing Fixtures", planned: 32, actual: 0, unit: "EA", status: "not-started", lastUpdated: "2025-03-01", assignee: "Sarah Johnson" },
  { id: 6, name: "Data Outlets", category: "Discrete Items", floor: "L1", zone: "Zone A", contract: "ELEC-002", sovItem: "Low Voltage", planned: 180, actual: 175, unit: "EA", status: "on-track", lastUpdated: "2025-03-09", assignee: "Jesse Lavine" },
  { id: 7, name: "Light Fixtures", category: "Discrete Items", floor: "L2", zone: "Zone B", contract: "ELEC-002", sovItem: "Lighting", planned: 96, actual: 40, unit: "EA", status: "behind", lastUpdated: "2025-03-08", assignee: "Mike Davis" },
  { id: 8, name: "Smoke Detectors", category: "Discrete Items", floor: "L3", zone: "Zone C", contract: "MEP-001", sovItem: "Fire Alarm", planned: 56, actual: 0, unit: "EA", status: "not-started", lastUpdated: "2025-03-01", assignee: "Tom Lee" },
];

const mockFieldWork: FieldWorkItem[] = [
  { id: 1, name: "Level 1 Layout Survey", type: "layout-survey", floor: "L1", zone: "All Zones", status: "complete", completedDate: "2025-03-05", dueDate: "2025-03-05", assignee: "Jesse Lavine", tflxLinked: true, percentComplete: 100 },
  { id: 2, name: "Level 2 Layout Survey", type: "layout-survey", floor: "L2", zone: "All Zones", status: "in-progress", completedDate: null, dueDate: "2025-03-12", assignee: "Jesse Lavine", tflxLinked: true, percentComplete: 65 },
  { id: 3, name: "MEP QA/QC Round 1", type: "qa-qc", floor: "L1", zone: "Zone A", status: "complete", completedDate: "2025-03-06", dueDate: "2025-03-06", assignee: "Sarah Johnson", tflxLinked: false, percentComplete: 100 },
  { id: 4, name: "Structural QA/QC", type: "qa-qc", floor: "L2", zone: "Zone B", status: "in-progress", completedDate: null, dueDate: "2025-03-14", assignee: "Mike Davis", tflxLinked: false, percentComplete: 40 },
  { id: 5, name: "General Survey Request - Owner", type: "survey-request", floor: "L1", zone: "All Zones", status: "pending", completedDate: null, dueDate: "2025-03-18", assignee: "Tom Lee", tflxLinked: false, percentComplete: 0 },
  { id: 6, name: "Level 3 Layout Survey", type: "layout-survey", floor: "L3", zone: "All Zones", status: "pending", completedDate: null, dueDate: "2025-03-22", assignee: "Jesse Lavine", tflxLinked: false, percentComplete: 0 },
  { id: 7, name: "Fire Protection QA/QC", type: "qa-qc", floor: "L1", zone: "Zone C", status: "overdue", completedDate: null, dueDate: "2025-03-04", assignee: "Sarah Johnson", tflxLinked: false, percentComplete: 80 },
];

const mockPropertySets: PropertySetItem[] = [
  { id: 1, component: "Air Handler Unit AHU-01", discipline: "HVAC", floor: "Roof", zone: "Mechanical Room", fabricationStatus: "delivered-to-site", installStatus: "install-in-progress", model: "MEP-Model-v3.ifc", lastSync: "2025-03-09 14:23" },
  { id: 2, component: "Electrical Panel EP-L1-A", discipline: "Electrical", floor: "L1", zone: "Electrical Room", fabricationStatus: "loaded-on-truck", installStatus: "arrived-on-site", model: "ELEC-Model-v2.ifc", lastSync: "2025-03-08 09:15" },
  { id: 3, component: "Chiller Unit CH-01", discipline: "HVAC", floor: "Basement", zone: "Mechanical Room", fabricationStatus: "in-development", installStatus: "not-started", model: "MEP-Model-v3.ifc", lastSync: "2025-03-07 16:45" },
  { id: 4, component: "Fire Pump FP-01", discipline: "Fire Protection", floor: "Basement", zone: "Fire Pump Room", fabricationStatus: "delivered-to-site", installStatus: "inspection", model: "FP-Model-v1.ifc", lastSync: "2025-03-09 11:00" },
  { id: 5, component: "Structural Steel Frame W-12x40", discipline: "Structural", floor: "L2", zone: "Zone A", fabricationStatus: "delivered-to-site", installStatus: "complete", model: "STRUCT-Model-v4.ifc", lastSync: "2025-03-06 13:30" },
  { id: 6, component: "Plumbing Manifold PM-B1", discipline: "Plumbing", floor: "Basement", zone: "Plumbing Room", fabricationStatus: "in-design", installStatus: "not-started", model: "PLMB-Model-v1.ifc", lastSync: "2025-03-05 08:20" },
];

const mockTemplates: Template[] = [
  {
    id: 1,
    name: "MEP Item Count Tracking",
    description: "Track installation progress of mechanical, electrical, and plumbing components by floor and zone with automatic count-based progress.",
    category: "Discrete Items",
    icon: Zap,
    tags: ["MEP", "Item Count", "Floor Tracking"],
    setupSteps: [
      "Import component list from drawings or Connect model",
      "Assign floors and zones to each item category",
      "Link to contract SOV line items",
      "Enable 360 Imagery integration for visual verification"
    ]
  },
  {
    id: 2,
    name: "Layout Survey Progress",
    description: "Monitor layout survey completion across floors with TFLX file integration from Trimble Connect to show real-time layout progress.",
    category: "Field Work",
    icon: Ruler,
    tags: ["Layout", "Survey", "TFLX", "Connect"],
    setupSteps: [
      "Connect to Trimble Connect project",
      "Configure TFLX file monitoring per floor",
      "Set up floor-by-floor completion thresholds",
      "Assign survey crews and due dates"
    ]
  },
  {
    id: 3,
    name: "Fabrication Shop Status",
    description: "Track components from design through fabrication and delivery using Trimble Connect Property Sets for real-time shop-to-site visibility.",
    category: "Property Sets",
    icon: Package,
    tags: ["Fabrication", "Property Sets", "Connect", "Shop"],
    setupSteps: [
      "Configure Property Set schema in Trimble Connect",
      "Map status values to fabrication workflow stages",
      "Enable model sync for automatic status updates",
      "Set up delivery notifications"
    ]
  },
  {
    id: 4,
    name: "SOV % Complete Tracking",
    description: "Track Schedule of Values completion against contract milestones to enable accurate pay application preparation and financial forecasting.",
    category: "Financials",
    icon: DollarSign,
    tags: ["SOV", "Financial", "Pay App", "Billing"],
    setupSteps: [
      "Import SOV from contract",
      "Link tracking items to SOV line items",
      "Configure billing period schedule",
      "Set approval workflows for % complete updates"
    ]
  },
  {
    id: 5,
    name: "Fire Stopping Inspection Tracker",
    description: "Track fire stopping installation and inspection status by floor, zone, and opening type with QA/QC checklists and photo verification.",
    category: "Discrete Items",
    icon: ClipboardCheck,
    tags: ["Fire Stopping", "QA/QC", "Inspection", "Life Safety"],
    setupSteps: [
      "Define fire stopping opening categories",
      "Map openings by floor and zone from drawings",
      "Attach inspection checklist template",
      "Link to 360 Imagery for documentation"
    ]
  },
  {
    id: 6,
    name: "Installation Status via Property Sets",
    description: "Use Trimble Connect model Property Sets to track install status (Arrived, In Progress, Inspection, Complete) directly from model updates.",
    category: "Property Sets",
    icon: ScanLine,
    tags: ["Install Status", "Property Sets", "Model", "Connect"],
    setupSteps: [
      "Define install status Property Set in Connect",
      "Configure model sync schedule",
      "Set up status progression rules",
      "Enable dashboard roll-up by floor and zone"
    ]
  },
];

// ---- Helper Functions ----

const getStatusColor = (status: string) => {
  switch (status) {
    case "complete": return "bg-green-500";
    case "on-track": return "bg-blue-500";
    case "behind": return "bg-yellow-500";
    case "not-started": return "bg-gray-400";
    case "overdue": return "bg-red-500";
    case "in-progress": return "bg-blue-500";
    case "pending": return "bg-gray-400";
    default: return "bg-gray-400";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "complete": return "Complete";
    case "on-track": return "On Track";
    case "behind": return "Behind";
    case "not-started": return "Not Started";
    case "overdue": return "Overdue";
    case "in-progress": return "In Progress";
    case "pending": return "Pending";
    default: return status;
  }
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "complete": return "default";
    case "on-track": return "default";
    case "behind": return "secondary";
    case "overdue": return "destructive";
    default: return "outline";
  }
};

const getFabricationStatusLabel = (status: string) => {
  switch (status) {
    case "in-design": return "In Design";
    case "in-development": return "In Development";
    case "loaded-on-truck": return "Loaded on Truck";
    case "delivered-to-site": return "Delivered to Site";
    default: return status;
  }
};

const getInstallStatusLabel = (status: string) => {
  switch (status) {
    case "not-started": return "Not Started";
    case "arrived-on-site": return "Arrived on Site";
    case "install-in-progress": return "Install In Progress";
    case "inspection": return "Inspection";
    case "complete": return "Complete";
    default: return status;
  }
};

const getFabricationColor = (status: string) => {
  switch (status) {
    case "in-design": return "bg-gray-400";
    case "in-development": return "bg-purple-500";
    case "loaded-on-truck": return "bg-yellow-500";
    case "delivered-to-site": return "bg-blue-500";
    default: return "bg-gray-400";
  }
};

const getInstallColor = (status: string) => {
  switch (status) {
    case "not-started": return "bg-gray-300";
    case "arrived-on-site": return "bg-blue-300";
    case "install-in-progress": return "bg-yellow-500";
    case "inspection": return "bg-orange-500";
    case "complete": return "bg-green-500";
    default: return "bg-gray-400";
  }
};

const getFieldWorkTypeLabel = (type: string) => {
  switch (type) {
    case "layout-survey": return "Layout Survey";
    case "qa-qc": return "QA/QC";
    case "survey-request": return "Survey Request";
    case "general": return "General";
    default: return type;
  }
};

const getFieldWorkTypeColor = (type: string) => {
  switch (type) {
    case "layout-survey": return "bg-blue-500";
    case "qa-qc": return "bg-purple-500";
    case "survey-request": return "bg-orange-500";
    case "general": return "bg-gray-500";
    default: return "bg-gray-400";
  }
};

// ---- Summary Stats ----

const overallStats = {
  totalItems: mockTrackingItems.length,
  complete: mockTrackingItems.filter(i => i.status === "complete").length,
  onTrack: mockTrackingItems.filter(i => i.status === "on-track").length,
  behind: mockTrackingItems.filter(i => i.status === "behind").length,
  notStarted: mockTrackingItems.filter(i => i.status === "not-started").length,
  overallProgress: Math.round(
    mockTrackingItems.reduce((sum, i) => sum + (i.actual / i.planned) * 100, 0) / mockTrackingItems.length
  ),
};

const floorSummary = [
  { floor: "L1", progress: 84, items: 3, complete: 2, behind: 0 },
  { floor: "L2", progress: 52, items: 3, complete: 1, behind: 2 },
  { floor: "L3", progress: 6, items: 2, complete: 0, behind: 0 },
  { floor: "Roof", progress: 0, items: 0, complete: 0, behind: 0 },
];

const zoneSummary = [
  { zone: "Zone A", progress: 76, items: 3, complete: 1, behind: 1 },
  { zone: "Zone B", progress: 55, items: 2, complete: 1, behind: 1 },
  { zone: "Zone C", progress: 22, items: 2, complete: 0, behind: 1 },
];

const contractSummary = [
  { contract: "MEP-001 – Fire Protection", sovItem: "Fire Protection", budgeted: 120000, earned: 75000, percentBilled: 62 },
  { contract: "ELEC-002 – Electrical", sovItem: "Electrical Rough-In", budgeted: 340000, earned: 285000, percentBilled: 84 },
  { contract: "HVAC-003 – HVAC", sovItem: "HVAC Install", budgeted: 210000, earned: 65000, percentBilled: 31 },
  { contract: "PLMB-004 – Plumbing", sovItem: "Plumbing Fixtures", budgeted: 95000, earned: 0, percentBilled: 0 },
];

// ---- Main Component ----

export default function ProgressTrackingPage() {
  const [mainTab, setMainTab] = useState<MainTab>("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPanel, setSelectedPanel] = useState<SidePanelType>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedView, setSelectedView] = useState("All Items");
  const [filters, setFilters] = useState({
    showComplete: true,
    showOnTrack: true,
    showBehind: true,
    showNotStarted: true,
    floor: "",
    zone: "",
    contract: "",
    discipline: "",
  });

  const handleFilterChange = (key: string, value: boolean | string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetSearch = () => {
    setSearchQuery("");
    setFilters({
      showComplete: true,
      showOnTrack: true,
      showBehind: true,
      showNotStarted: true,
      floor: "",
      zone: "",
      contract: "",
      discipline: "",
    });
  };

  // ---- Dashboard Tab ----
  const renderDashboard = () => (
    <div className="p-6 space-y-6 overflow-auto flex-1">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallStats.overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
            <Progress value={overallStats.overallProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Complete</p>
                <p className="text-2xl font-bold">{overallStats.complete}</p>
                <p className="text-xs text-muted-foreground">of {overallStats.totalItems} items</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Behind</p>
                <p className="text-2xl font-bold">{overallStats.behind}</p>
                <p className="text-xs text-muted-foreground">need attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Not Started</p>
                <p className="text-2xl font-bold">{overallStats.notStarted}</p>
                <p className="text-xs text-muted-foreground">items pending</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Floor & Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Progress by Floor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {floorSummary.map((floor) => (
              <div key={floor.floor} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{floor.floor}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">{floor.items} items</span>
                    {floor.behind > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {floor.behind} behind
                      </Badge>
                    )}
                    <span className="font-medium w-8 text-right">{floor.progress}%</span>
                  </div>
                </div>
                <Progress value={floor.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Progress by Zone / Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zoneSummary.map((zone) => (
              <div key={zone.zone} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{zone.zone}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">{zone.items} items</span>
                    {zone.behind > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {zone.behind} behind
                      </Badge>
                    )}
                    <span className="font-medium w-8 text-right">{zone.progress}%</span>
                  </div>
                </div>
                <Progress value={zone.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Contract / SOV Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Contract &amp; Schedule of Values Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contractSummary.map((c) => (
              <div key={c.contract} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.contract}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.sovItem}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Budgeted: <span className="font-medium text-foreground">${c.budgeted.toLocaleString()}</span></span>
                    <span>Earned: <span className="font-medium text-foreground">${c.earned.toLocaleString()}</span></span>
                    <span className="font-semibold text-foreground w-8 text-right">{c.percentBilled}%</span>
                  </div>
                </div>
                <Progress value={c.percentBilled} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Work Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Field Work Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockFieldWork.slice(0, 4).map((fw) => (
                <div key={fw.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(fw.status)}`} />
                    <span className="text-sm font-medium">{fw.name}</span>
                    {fw.tflxLinked && (
                      <Badge variant="outline" className="text-xs px-1 py-0 text-blue-600 border-blue-300">
                        TFLX
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fw.floor}</span>
                    <span className="text-xs font-medium w-8 text-right">{fw.percentComplete}%</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setMainTab("field-work")}>
                View all field work <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Fabrication &amp; Delivery Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockPropertySets.slice(0, 4).map((ps) => (
                <div key={ps.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getInstallColor(ps.installStatus)}`} />
                    <span className="text-sm font-medium truncate max-w-40">{ps.component}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getFabricationStatusLabel(ps.fabricationStatus)}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setMainTab("property-sets")}>
                View all components <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ---- Items Tab ----
  const renderItems = () => (
    <div className="flex-1 p-6 overflow-auto">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTrackingItems.map((item) => (
            <Card key={item.id} className="border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: item.status === "complete" ? "#22c55e" : item.status === "on-track" ? "#3b82f6" : item.status === "behind" ? "#eab308" : "#9ca3af" }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">{item.floor}</Badge>
                  <Badge variant="outline" className="text-xs">{item.zone}</Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{item.category}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.actual} / {item.planned} {item.unit}</span>
                    <span className="font-medium text-foreground">{Math.round((item.actual / item.planned) * 100)}%</span>
                  </div>
                  <Progress value={(item.actual / item.planned) * 100} className="h-1.5" />
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Contract</span>
                    <span className="text-foreground">{item.contract}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SOV Item</span>
                    <span className="text-foreground">{item.sovItem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignee</span>
                    <span className="text-foreground">{item.assignee}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)}`} />
                  <span className="text-xs text-muted-foreground">{getStatusLabel(item.status)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{item.lastUpdated}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium px-4 py-1.5 border-b">
            <span className="col-span-3">Item</span>
            <span className="col-span-1">Floor</span>
            <span className="col-span-1">Zone</span>
            <span className="col-span-2">Contract</span>
            <span className="col-span-2">SOV Item</span>
            <span className="col-span-2">Progress</span>
            <span className="col-span-1">Status</span>
          </div>
          {mockTrackingItems.map((item) => (
            <Card key={item.id} className="border-l-4"
              style={{ borderLeftColor: item.status === "complete" ? "#22c55e" : item.status === "on-track" ? "#3b82f6" : item.status === "behind" ? "#eab308" : "#9ca3af" }}>
              <CardContent className="p-3">
                <div className="grid grid-cols-12 items-center gap-1 text-sm">
                  <div className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                  <span className="col-span-1 text-muted-foreground text-xs">{item.floor}</span>
                  <span className="col-span-1 text-muted-foreground text-xs">{item.zone}</span>
                  <span className="col-span-2 text-xs truncate">{item.contract}</span>
                  <span className="col-span-2 text-xs truncate text-muted-foreground">{item.sovItem}</span>
                  <div className="col-span-2 space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.actual}/{item.planned} {item.unit}</span>
                      <span>{Math.round((item.actual / item.planned) * 100)}%</span>
                    </div>
                    <Progress value={(item.actual / item.planned) * 100} className="h-1" />
                  </div>
                  <div className="col-span-1 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                    <span className="text-xs">{getStatusLabel(item.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Field Work Tab ----
  const renderFieldWork = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-300">
          Layout Survey items marked with <Badge variant="outline" className="text-xs px-1 py-0 text-blue-600 border-blue-300 mx-1">TFLX</Badge> are automatically synced from Trimble Connect TFLX files. Progress updates when field crews upload survey data.
        </p>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockFieldWork.map((fw) => (
            <Card key={fw.id} className="border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: fw.status === "complete" ? "#22c55e" : fw.status === "in-progress" ? "#3b82f6" : fw.status === "overdue" ? "#ef4444" : "#9ca3af" }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{fw.name}</span>
                    {fw.tflxLinked && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-600 border-blue-300">
                        TFLX
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className={`text-xs text-white px-2 py-0.5 rounded-full ${getFieldWorkTypeColor(fw.type)}`}>
                    {getFieldWorkTypeLabel(fw.type)}
                  </div>
                  <Badge variant="outline" className="text-xs">{fw.floor}</Badge>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{fw.percentComplete}%</span>
                  </div>
                  <Progress value={fw.percentComplete} className="h-1.5" />
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Zone</span>
                    <span className="text-foreground">{fw.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due</span>
                    <span className={fw.status === "overdue" ? "text-red-600 font-medium" : "text-foreground"}>{fw.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignee</span>
                    <span className="text-foreground">{fw.assignee}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(fw.status)}`} />
                  <span className="text-xs text-muted-foreground">{getStatusLabel(fw.status)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {mockFieldWork.map((fw) => (
            <Card key={fw.id} className="border-l-4"
              style={{ borderLeftColor: fw.status === "complete" ? "#22c55e" : fw.status === "in-progress" ? "#3b82f6" : fw.status === "overdue" ? "#ef4444" : "#9ca3af" }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" className="rounded shrink-0" />
                    <span className="font-medium truncate">{fw.name}</span>
                    {fw.tflxLinked && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-600 border-blue-300 shrink-0">
                        TFLX
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className={`text-white px-1.5 py-0.5 rounded-full text-xs ${getFieldWorkTypeColor(fw.type)}`}>{getFieldWorkTypeLabel(fw.type)}</span>
                    <span className="text-muted-foreground w-6">{fw.floor}</span>
                    <span className="text-muted-foreground">{fw.zone}</span>
                    <span className={fw.status === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"}>Due: {fw.dueDate}</span>
                    <div className="w-24 space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{fw.percentComplete}%</span>
                      </div>
                      <Progress value={fw.percentComplete} className="h-1" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(fw.status)}`} />
                      <span>{getStatusLabel(fw.status)}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Property Sets Tab ----
  const renderPropertySets = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
        <Layers className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-xs text-purple-800 dark:text-purple-300">
          Property Sets are synced from Trimble Connect model files. Fabrication status tracks shop progress; Install status tracks site progress. Updates appear automatically when models are synced.
        </p>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPropertySets.map((ps) => (
            <Card key={ps.id} className="border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: ps.installStatus === "complete" ? "#22c55e" : ps.installStatus === "not-started" ? "#9ca3af" : "#3b82f6" }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm leading-tight">{ps.component}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <Badge variant="outline" className="text-xs">{ps.discipline}</Badge>
                  <Badge variant="outline" className="text-xs">{ps.floor}</Badge>
                  <Badge variant="outline" className="text-xs">{ps.zone}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fabrication</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${getFabricationColor(ps.fabricationStatus)}`} />
                      <span className="font-medium">{getFabricationStatusLabel(ps.fabricationStatus)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Install</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${getInstallColor(ps.installStatus)}`} />
                      <span className="font-medium">{getInstallStatusLabel(ps.installStatus)}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{ps.model}</span>
                  <span className="shrink-0 ml-2">Synced: {ps.lastSync.split(" ")[0]}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium px-4 py-1.5 border-b">
            <span className="col-span-3">Component</span>
            <span className="col-span-1">Discipline</span>
            <span className="col-span-1">Floor</span>
            <span className="col-span-1">Zone</span>
            <span className="col-span-2">Fabrication Status</span>
            <span className="col-span-2">Install Status</span>
            <span className="col-span-2">Model / Last Sync</span>
          </div>
          {mockPropertySets.map((ps) => (
            <Card key={ps.id} className="border-l-4"
              style={{ borderLeftColor: ps.installStatus === "complete" ? "#22c55e" : ps.installStatus === "not-started" ? "#9ca3af" : "#3b82f6" }}>
              <CardContent className="p-3">
                <div className="grid grid-cols-12 items-center gap-1 text-sm">
                  <div className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="font-medium text-xs truncate">{ps.component}</span>
                  </div>
                  <span className="col-span-1 text-xs text-muted-foreground">{ps.discipline}</span>
                  <span className="col-span-1 text-xs text-muted-foreground">{ps.floor}</span>
                  <span className="col-span-1 text-xs text-muted-foreground">{ps.zone}</span>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getFabricationColor(ps.fabricationStatus)}`} />
                    <span className="text-xs">{getFabricationStatusLabel(ps.fabricationStatus)}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getInstallColor(ps.installStatus)}`} />
                    <span className="text-xs">{getInstallStatusLabel(ps.installStatus)}</span>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    <div className="truncate">{ps.model}</div>
                    <div>{ps.lastSync}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Templates Tab ----
  const renderTemplates = () => (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-base font-semibold">Getting Started with Progress Tracking</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use these templates to quickly configure Progress Tracking for your project. Each template includes a pre-built setup with suggested items, workflows, and integration guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <template.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-0.5">{template.category}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{template.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-muted-foreground">Setup steps:</p>
                {template.setupSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <Button size="sm" className="w-full mt-2 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Workflow Suggestions */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Connected Workflow Suggestions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: "Property Sets + 360 Imagery",
              description: "Link Property Set status updates to 360° photo captures for visual verification of install progress.",
              icon: ScanLine,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/40",
              border: "border-blue-200 dark:border-blue-800"
            },
            {
              title: "Item Count + Maya Viewer",
              description: "View installed item counts overlaid directly on your 2D drawings in the Maya Viewer for spatial context.",
              icon: Layers,
              color: "text-purple-600",
              bg: "bg-purple-50 dark:bg-purple-950/40",
              border: "border-purple-200 dark:border-purple-800"
            },
            {
              title: "TFLX Files + Layout Progress",
              description: "Automatically update layout survey progress from TFLX uploads in Trimble Connect without manual entry.",
              icon: Ruler,
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-950/40",
              border: "border-green-200 dark:border-green-800"
            },
          ].map((suggestion) => (
            <div key={suggestion.title} className={`p-4 rounded-lg border ${suggestion.bg} ${suggestion.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                <span className={`text-sm font-medium ${suggestion.color}`}>{suggestion.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
              <Button variant="ghost" size="sm" className={`mt-2 h-7 text-xs p-0 ${suggestion.color}`}>
                Learn more <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---- Side Panel ----
  const renderSidePanel = () => (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      {/* Right Sidebar Toolbar */}
      <div className="flex justify-end items-center p-2 border-b bg-background">
        <div className="flex items-center gap-1">
          <Button
            variant={selectedPanel === "search" ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedPanel("search")}
            className="h-8 w-8"
            title="Search & Filter"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedPanel === "info" ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedPanel("info")}
            className="h-8 w-8"
            title="Info"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedPanel === "add" ? "default" : "ghost"}
            onClick={() => setSelectedPanel("add")}
            className="h-8 px-3"
            title="Add Tracking Item"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {selectedPanel === "search" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm">Status</h3>
              <div className="space-y-2">
                {[
                  { key: "showComplete", label: "Complete", color: "bg-green-500" },
                  { key: "showOnTrack", label: "On Track", color: "bg-blue-500" },
                  { key: "showBehind", label: "Behind", color: "bg-yellow-500" },
                  { key: "showNotStarted", label: "Not Started", color: "bg-gray-400" },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                    <Switch
                      checked={filters[key as keyof typeof filters] as boolean}
                      onCheckedChange={(val) => handleFilterChange(key, val)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Floor</h3>
              <Select value={filters.floor} onValueChange={(v) => handleFilterChange("floor", v)}>
                <SelectTrigger><SelectValue placeholder="All floors" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All floors</SelectItem>
                  <SelectItem value="L1">Level 1</SelectItem>
                  <SelectItem value="L2">Level 2</SelectItem>
                  <SelectItem value="L3">Level 3</SelectItem>
                  <SelectItem value="Roof">Roof</SelectItem>
                  <SelectItem value="Basement">Basement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Zone / Location</h3>
              <Select value={filters.zone} onValueChange={(v) => handleFilterChange("zone", v)}>
                <SelectTrigger><SelectValue placeholder="All zones" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All zones</SelectItem>
                  <SelectItem value="Zone A">Zone A</SelectItem>
                  <SelectItem value="Zone B">Zone B</SelectItem>
                  <SelectItem value="Zone C">Zone C</SelectItem>
                  <SelectItem value="All Zones">All Zones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Contract</h3>
              <Select value={filters.contract} onValueChange={(v) => handleFilterChange("contract", v)}>
                <SelectTrigger><SelectValue placeholder="All contracts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contracts</SelectItem>
                  <SelectItem value="MEP-001">MEP-001</SelectItem>
                  <SelectItem value="ELEC-002">ELEC-002</SelectItem>
                  <SelectItem value="HVAC-003">HVAC-003</SelectItem>
                  <SelectItem value="PLMB-004">PLMB-004</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Discipline</h3>
              <Select value={filters.discipline} onValueChange={(v) => handleFilterChange("discipline", v)}>
                <SelectTrigger><SelectValue placeholder="All disciplines" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All disciplines</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Fire Protection">Fire Protection</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Structural">Structural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={resetSearch} className="w-full">
              Reset search
            </Button>
          </>
        )}

        {selectedPanel === "info" && (
          <div className="text-center text-muted-foreground py-8">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select an item to view its details</p>
          </div>
        )}

        {selectedPanel === "add" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-1">Add Tracking Item</h3>
              <p className="text-xs text-muted-foreground">Create a new item to track progress on site.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Item Name</label>
                <Input placeholder="e.g. Fire Stopping Doors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discrete">Discrete Items</SelectItem>
                    <SelectItem value="field-work">Field Work</SelectItem>
                    <SelectItem value="property-sets">Property Sets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Floor</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select floor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">Level 1</SelectItem>
                    <SelectItem value="L2">Level 2</SelectItem>
                    <SelectItem value="L3">Level 3</SelectItem>
                    <SelectItem value="Roof">Roof</SelectItem>
                    <SelectItem value="Basement">Basement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Zone</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zone A">Zone A</SelectItem>
                    <SelectItem value="Zone B">Zone B</SelectItem>
                    <SelectItem value="Zone C">Zone C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Planned Qty</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Unit</label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="EA" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EA">EA</SelectItem>
                      <SelectItem value="LF">LF</SelectItem>
                      <SelectItem value="SF">SF</SelectItem>
                      <SelectItem value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Item
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Or use a <button className="underline text-primary" onClick={() => setMainTab("templates")}>template</button> to get started faster
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Application Toolbar */}
        <div className="flex justify-end items-center gap-2 p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Dashboard">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Export">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Print">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Record Toolbar */}
        <div className="border-b bg-background px-4 pt-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">Progress Tracking</h1>
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-44">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Items">All Items</SelectItem>
                  <SelectItem value="My Items">My Items</SelectItem>
                  <SelectItem value="By Floor">By Floor</SelectItem>
                  <SelectItem value="By Zone">By Zone</SelectItem>
                  <SelectItem value="By Contract">By Contract</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Floor</SelectItem>
                  <SelectItem value="L1">Level 1</SelectItem>
                  <SelectItem value="L2">Level 2</SelectItem>
                  <SelectItem value="L3">Level 3</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="behind">Behind</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mainTab !== "dashboard" && mainTab !== "templates" && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
            <TabsList className="h-8 bg-transparent border-b-0 p-0 gap-0">
              {[
                { value: "dashboard", label: "Dashboard", icon: BarChart3 },
                { value: "items", label: "Tracking Items", icon: ClipboardCheck },
                { value: "field-work", label: "Field Work", icon: HardHat },
                { value: "property-sets", label: "Property Sets", icon: Layers },
                { value: "templates", label: "Templates", icon: BookOpen },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-8 px-4 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard" className="mt-0 flex-1">
              {renderDashboard()}
            </TabsContent>
            <TabsContent value="items" className="mt-0 flex-1">
              {renderItems()}
            </TabsContent>
            <TabsContent value="field-work" className="mt-0 flex-1">
              {renderFieldWork()}
            </TabsContent>
            <TabsContent value="property-sets" className="mt-0 flex-1">
              {renderPropertySets()}
            </TabsContent>
            <TabsContent value="templates" className="mt-0 flex-1">
              {renderTemplates()}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {renderSidePanel()}
    </div>
  );
}
