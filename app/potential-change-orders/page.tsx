"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIEstimateTab } from "./components/AIEstimateTab";
import { ConfidenceIndicator } from "./components/ConfidenceIndicator";
import { mockEnhancedAISuggestions } from "./components/mock-data";
import {
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Eye,
  Calendar,
  User,
  CheckCircle,
  Clock,
  LayoutGrid,
  FileText,
  Printer,
  AlertCircle,
  Plus,
  Info,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Save,
  Users,
  MessageCircle,
  HelpCircle,
  X,
  DollarSign,
  Sparkles,
  TrendingUp,
  History,
  Zap,
  ArrowRight,
  Check,
  Brain,
  Database,
  FileOutput,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CloudOff,
} from "lucide-react";

// ──────────────────────────────────────────────
// Feature Flags
// ──────────────────────────────────────────────
const SHOW_LEGACY_AI_TAB = false;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PCOLineItem {
  id: number;
  itemNo: string;
  description: string;
  uom: string;
  estimate: number;
  proposed: number;
  approved: number;
  applied: number;
  appliedHours: number;
  budgetCode: string;
  allocation: string;
}

interface PCO {
  id: number;
  number: string;
  title: string;
  category: string;
  reason: string;
  status: "Ready for Review" | "Approved" | "Approved (Locked)" | "Rejected";
  budgetEstimate: number;
  costEstimate: number;
  proposedAmount: number;
  approvedAmount: number;
  appliedAmount: number;
  notes: string;
  createDate: string;
  dueDate: string;
  approvedForBudget: boolean;
  requestedDays: number;
  approvedDays: number;
  importance: string;
  reference: string;
  location: string;
  linkedSpecifications: string;
  author: string;
  authorCompany: string;
  lineItems: PCOLineItem[];
}

interface AISuggestion {
  costCode: string;
  description: string;
  laborRate: number;
  laborHours: number;
  materialCost: number;
  equipmentCost: number;
  total: number;
  confidence: number;
  source: string;
}

interface HistoricalProject {
  name: string;
  date: string;
  similarItem: string;
  actualCost: number;
  variance: string;
}

type SidePanelType = "search" | "info" | "add";

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const mockPCOs: PCO[] = [
  {
    id: 1,
    number: "001",
    title: "Foundation Wall Change",
    category: "Change Order",
    reason: "Design Change",
    status: "Approved",
    budgetEstimate: 20000,
    costEstimate: 20000,
    proposedAmount: 20000,
    approvedAmount: 20000,
    appliedAmount: 20000,
    notes: "The architectural and structural drawings differ in the thickness of the foundation wall at the two stairwells. The structural calls for a 14\" wall while the architectural calls for a 12\" wall.",
    createDate: "2024-09-15",
    dueDate: "2024-10-01",
    approvedForBudget: true,
    requestedDays: 3,
    approvedDays: 3,
    importance: "Normal",
    reference: "ASI-012",
    location: "Building A - Foundation",
    linkedSpecifications: "03 30 00 - Cast-in-Place Concrete",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Additional concrete for foundation wall", uom: "CY", estimate: 12000, proposed: 12000, approved: 12000, applied: 12000, appliedHours: 0, budgetCode: "03.210000.SC.DC", allocation: "Pending" },
      { id: 2, itemNo: "002", description: "Additional rebar and formwork", uom: "LS", estimate: 8000, proposed: 8000, approved: 8000, applied: 8000, appliedHours: 0, budgetCode: "03.210000.SC.DC", allocation: "Pending" },
    ],
  },
  {
    id: 2,
    number: "002",
    title: "Electrical Line Replacement",
    category: "Change Order",
    reason: "Field Condition",
    status: "Approved (Locked)",
    budgetEstimate: 34000,
    costEstimate: 34000,
    proposedAmount: 34000,
    approvedAmount: 34000,
    appliedAmount: 34000,
    notes: "The civil utility drawings indicate connecting to an existing 8\" fire water line at the existing curb. When this location was excavated, the existing line was only 6\". Please advise.",
    createDate: "2024-09-20",
    dueDate: "2024-10-05",
    approvedForBudget: true,
    requestedDays: 5,
    approvedDays: 5,
    importance: "High",
    reference: "FCN-003",
    location: "Site - East Utility Corridor",
    linkedSpecifications: "26 05 00 - Common Work Results for Electrical",
    author: "Mike Davis",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Remove existing 6\" line", uom: "LF", estimate: 14000, proposed: 14000, approved: 14000, applied: 14000, appliedHours: 0, budgetCode: "33.110000.SC.FC", allocation: "Approved" },
      { id: 2, itemNo: "002", description: "Install new 8\" fire water line", uom: "LF", estimate: 20000, proposed: 20000, approved: 20000, applied: 20000, appliedHours: 0, budgetCode: "33.110000.SC.FC", allocation: "Approved" },
    ],
  },
  {
    id: 3,
    number: "003",
    title: "Fire Caulking",
    category: "Change Order",
    reason: "Inspection Result",
    status: "Ready for Review",
    budgetEstimate: 40000,
    costEstimate: 40000,
    proposedAmount: 40000,
    approvedAmount: 40000,
    appliedAmount: 40000,
    notes: "Fire caulk all firewall penetrations regardless of gap size. Plans call for 1/4\" or greater gaps to be caulked. RCDD inspector requires all.",
    createDate: "2024-10-05",
    dueDate: "2024-10-12",
    approvedForBudget: true,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "INS-007",
    location: "Building A - All Floors",
    linkedSpecifications: "07 84 00 - Firestopping",
    author: "Sarah Johnson",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Fire Protection", uom: "", estimate: 20000, proposed: 20000, approved: 20000, applied: 20000, appliedHours: 0, budgetCode: "03.210000.SC.DC", allocation: "Pend rev" },
      { id: 2, itemNo: "002", description: "Fire Caulk All Firewall Penetrations", uom: "", estimate: 20000, proposed: 20000, approved: 20000, applied: 20000, appliedHours: 0, budgetCode: "03.210000.SC.DC", allocation: "Pend rev" },
    ],
  },
  {
    id: 4,
    number: "004",
    title: "Duct shaft beam re-location",
    category: "Change Order",
    reason: "Field Condition",
    status: "Ready for Review",
    budgetEstimate: 4900,
    costEstimate: 4900,
    proposedAmount: 4900,
    approvedAmount: 4900,
    appliedAmount: 0,
    notes: "Mechanical penetrations at second and third floor decks do not provide enough clear space for minimum volume air-flow. Must move Cast beams 18\" out.",
    createDate: "2024-10-08",
    dueDate: "2024-10-20",
    approvedForBudget: false,
    requestedDays: 2,
    approvedDays: 0,
    importance: "High",
    reference: "FCN-009",
    location: "Building A - 2nd & 3rd Floor",
    linkedSpecifications: "05 12 00 - Structural Steel Framing",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Relocate cast beams at 2nd floor", uom: "EA", estimate: 2450, proposed: 2450, approved: 2450, applied: 0, appliedHours: 0, budgetCode: "05.120000.SC.FC", allocation: "Pending" },
      { id: 2, itemNo: "002", description: "Relocate cast beams at 3rd floor", uom: "EA", estimate: 2450, proposed: 2450, approved: 2450, applied: 0, appliedHours: 0, budgetCode: "05.120000.SC.FC", allocation: "Pending" },
    ],
  },
  {
    id: 5,
    number: "005",
    title: "CO for Unit Price Contract",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 5000,
    costEstimate: 5000,
    proposedAmount: 5000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "Unit price adjustment for concrete work per contract terms.",
    createDate: "2024-10-10",
    dueDate: "2024-10-25",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Unit price adjustment", uom: "LS", estimate: 5000, proposed: 5000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "01.100000.GC", allocation: "Pending" },
    ],
  },
  {
    id: 6,
    number: "006",
    title: "Additional Concrete",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 60000,
    costEstimate: 60000,
    proposedAmount: 60000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "Additional concrete required for enlarged footings per revised structural drawings.",
    createDate: "2024-10-12",
    dueDate: "2024-10-28",
    approvedForBudget: false,
    requestedDays: 5,
    approvedDays: 0,
    importance: "High",
    reference: "RFI-042",
    location: "Building B - Foundation",
    linkedSpecifications: "03 30 00 - Cast-in-Place Concrete",
    author: "Mike Davis",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Additional concrete - enlarged footings", uom: "CY", estimate: 35000, proposed: 35000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "03.300000.SC.DC", allocation: "Pending" },
      { id: 2, itemNo: "002", description: "Additional rebar for enlarged footings", uom: "TN", estimate: 25000, proposed: 25000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "03.200000.SC.DC", allocation: "Pending" },
    ],
  },
  {
    id: 7,
    number: "007",
    title: "Test",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 1050,
    costEstimate: 1050,
    proposedAmount: 1050,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "",
    createDate: "2024-10-14",
    dueDate: "2024-10-30",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Test item", uom: "LS", estimate: 1050, proposed: 1050, approved: 0, applied: 0, appliedHours: 0, budgetCode: "", allocation: "Pending" },
    ],
  },
  {
    id: 8,
    number: "008",
    title: "Test 2",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 1000,
    costEstimate: 1000,
    proposedAmount: 1000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "",
    createDate: "2024-10-15",
    dueDate: "2024-10-31",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Test item 2", uom: "LS", estimate: 1000, proposed: 1000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "", allocation: "Pending" },
    ],
  },
  {
    id: 9,
    number: "009",
    title: "Test 3",
    category: "Category",
    reason: "",
    status: "Rejected",
    budgetEstimate: 1000,
    costEstimate: 1000,
    proposedAmount: 1000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "",
    createDate: "2024-10-16",
    dueDate: "2024-11-01",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Test item 3", uom: "LS", estimate: 1000, proposed: 1000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "", allocation: "Rejected" },
    ],
  },
  {
    id: 10,
    number: "010",
    title: "Test 5",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 1000,
    costEstimate: 1000,
    proposedAmount: 1000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "",
    createDate: "2024-10-17",
    dueDate: "2024-11-02",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Test item 5", uom: "LS", estimate: 1000, proposed: 1000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "", allocation: "Pending" },
    ],
  },
  {
    id: 11,
    number: "011",
    title: "Test 6",
    category: "Category",
    reason: "",
    status: "Ready for Review",
    budgetEstimate: 1000,
    costEstimate: 1000,
    proposedAmount: 1000,
    approvedAmount: 0,
    appliedAmount: 0,
    notes: "",
    createDate: "2024-10-18",
    dueDate: "2024-11-03",
    approvedForBudget: false,
    requestedDays: 0,
    approvedDays: 0,
    importance: "Normal",
    reference: "",
    location: "",
    linkedSpecifications: "",
    author: "Jesse Lavine",
    authorCompany: "GC Construction",
    lineItems: [
      { id: 1, itemNo: "001", description: "Test item 6", uom: "LS", estimate: 1000, proposed: 1000, approved: 0, applied: 0, appliedHours: 0, budgetCode: "", allocation: "Pending" },
    ],
  },
];

const mockAISuggestions: Record<number, AISuggestion[]> = {
  1: [
    { costCode: "03 11 13", description: "Structural concrete formwork", laborRate: 68.00, laborHours: 80, materialCost: 3200, equipmentCost: 800, total: 9440, confidence: 91, source: "6 similar projects" },
    { costCode: "03 30 53", description: "Cast-in-place concrete - wall upgrade", laborRate: 65.00, laborHours: 60, materialCost: 4800, equipmentCost: 600, total: 9300, confidence: 93, source: "6 similar projects" },
  ],
  2: [
    { costCode: "26 05 19", description: "Low-voltage electrical power conductors", laborRate: 78.00, laborHours: 120, materialCost: 9600, equipmentCost: 1400, total: 20360, confidence: 90, source: "5 similar projects" },
    { costCode: "26 05 33", description: "Raceway and conduit replacement", laborRate: 78.00, laborHours: 80, materialCost: 4200, equipmentCost: 600, total: 11040, confidence: 86, source: "5 similar projects" },
    { costCode: "26 05 53", description: "Identification and testing", laborRate: 72.00, laborHours: 16, materialCost: 450, equipmentCost: 0, total: 1602, confidence: 84, source: "3 similar projects" },
  ],
  3: [
    { costCode: "07 84 13", description: "Penetration firestopping - caulk application", laborRate: 72.50, laborHours: 160, materialCost: 8400, equipmentCost: 1200, total: 21200, confidence: 94, source: "3 similar projects" },
    { costCode: "07 84 13", description: "Penetration firestopping - collar installation", laborRate: 72.50, laborHours: 120, materialCost: 6200, equipmentCost: 800, total: 15700, confidence: 91, source: "3 similar projects" },
    { costCode: "07 84 46", description: "Fire-resistive joint sealant", laborRate: 68.00, laborHours: 24, materialCost: 1800, equipmentCost: 200, total: 3632, confidence: 87, source: "2 similar projects" },
  ],
  4: [
    { costCode: "05 12 23", description: "Structural steel beam relocation - labor", laborRate: 85.00, laborHours: 32, materialCost: 0, equipmentCost: 1200, total: 3920, confidence: 88, source: "4 similar projects" },
    { costCode: "05 05 23", description: "Welding and connections", laborRate: 92.00, laborHours: 8, materialCost: 450, equipmentCost: 0, total: 1186, confidence: 82, source: "4 similar projects" },
  ],
  5: [
    { costCode: "03 30 00", description: "Unit price concrete adjustment", laborRate: 65.00, laborHours: 40, materialCost: 2200, equipmentCost: 400, total: 5200, confidence: 85, source: "7 similar projects" },
  ],
  6: [
    { costCode: "03 30 53", description: "Concrete placement - enlarged footings", laborRate: 65.00, laborHours: 200, materialCost: 18500, equipmentCost: 3200, total: 34700, confidence: 92, source: "5 similar projects" },
    { costCode: "03 20 00", description: "Concrete reinforcing - additional rebar", laborRate: 70.00, laborHours: 160, materialCost: 12800, equipmentCost: 800, total: 24800, confidence: 89, source: "5 similar projects" },
  ],
  7: [
    { costCode: "01 50 00", description: "General conditions - temporary facilities", laborRate: 55.00, laborHours: 12, materialCost: 350, equipmentCost: 0, total: 1010, confidence: 79, source: "8 similar projects" },
  ],
  8: [
    { costCode: "01 50 00", description: "General conditions - miscellaneous", laborRate: 55.00, laborHours: 10, materialCost: 400, equipmentCost: 50, total: 1000, confidence: 76, source: "4 similar projects" },
  ],
  9: [
    { costCode: "01 50 00", description: "General conditions - testing allowance", laborRate: 55.00, laborHours: 10, materialCost: 400, equipmentCost: 50, total: 1000, confidence: 74, source: "3 similar projects" },
  ],
  10: [
    { costCode: "01 50 00", description: "General conditions - site cleanup", laborRate: 55.00, laborHours: 12, materialCost: 300, equipmentCost: 40, total: 1000, confidence: 77, source: "5 similar projects" },
  ],
  11: [
    { costCode: "01 50 00", description: "General conditions - project closeout", laborRate: 55.00, laborHours: 12, materialCost: 300, equipmentCost: 40, total: 1000, confidence: 75, source: "4 similar projects" },
  ],
};

const mockHistoricalByPCO: Record<number, HistoricalProject[]> = {
  1: [
    { name: "Harbor View Tower", date: "2024-01", similarItem: "Foundation wall thickness change", actualCost: 18900, variance: "-5.5%" },
    { name: "Lakeshore Condos Phase 2", date: "2023-09", similarItem: "Foundation wall redesign", actualCost: 21400, variance: "+7.0%" },
    { name: "Central Business Hub", date: "2023-05", similarItem: "Concrete wall modification", actualCost: 19600, variance: "-2.0%" },
  ],
  2: [
    { name: "Tech Campus Building C", date: "2024-02", similarItem: "Electrical utility line replacement", actualCost: 31200, variance: "-8.2%" },
    { name: "Downtown Medical Center", date: "2023-10", similarItem: "Fire water line upgrade 6\" to 8\"", actualCost: 36100, variance: "+6.2%" },
    { name: "Greenfield Industrial Park", date: "2023-06", similarItem: "Underground utility reroute", actualCost: 33800, variance: "-0.6%" },
  ],
  3: [
    { name: "Riverside Office Park", date: "2024-03", similarItem: "Fire caulking - full building", actualCost: 38500, variance: "-3.8%" },
    { name: "Metro Hospital Wing B", date: "2023-11", similarItem: "Firewall penetration sealing", actualCost: 42200, variance: "+5.5%" },
    { name: "Westside Mall Renovation", date: "2023-08", similarItem: "Fire protection caulking", actualCost: 36800, variance: "-8.0%" },
  ],
  4: [
    { name: "Skyline Tower", date: "2024-04", similarItem: "Steel beam relocation - HVAC clearance", actualCost: 5200, variance: "+6.1%" },
    { name: "Commerce Park Building D", date: "2023-12", similarItem: "Duct shaft structural modification", actualCost: 4650, variance: "-5.1%" },
  ],
  5: [
    { name: "Eastgate Shopping Center", date: "2024-02", similarItem: "Unit price concrete adjustment", actualCost: 4800, variance: "-4.0%" },
    { name: "Northpoint Logistics Hub", date: "2023-07", similarItem: "Concrete unit rate change order", actualCost: 5300, variance: "+6.0%" },
  ],
  6: [
    { name: "Harbor View Tower", date: "2024-01", similarItem: "Enlarged footing concrete pour", actualCost: 57400, variance: "-4.3%" },
    { name: "Airport Terminal Expansion", date: "2023-10", similarItem: "Additional concrete for revised footings", actualCost: 63200, variance: "+5.3%" },
    { name: "University Science Center", date: "2023-04", similarItem: "Foundation enlargement - structural", actualCost: 55800, variance: "-7.0%" },
  ],
  7: [
    { name: "Midtown Lofts", date: "2024-03", similarItem: "General conditions adjustment", actualCost: 980, variance: "-6.7%" },
  ],
  8: [
    { name: "Riverdale Senior Living", date: "2024-01", similarItem: "Misc general conditions", actualCost: 1050, variance: "+5.0%" },
  ],
  9: [
    { name: "Parkside Elementary School", date: "2023-11", similarItem: "Testing allowance adjustment", actualCost: 1100, variance: "+10.0%" },
  ],
  10: [
    { name: "Sunrise Business Park", date: "2024-02", similarItem: "Site cleanup allowance", actualCost: 950, variance: "-5.0%" },
  ],
  11: [
    { name: "Valley Medical Office", date: "2023-12", similarItem: "Project closeout costs", actualCost: 1080, variance: "+8.0%" },
  ],
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case "Ready for Review": return "bg-blue-500";
    case "Approved": return "bg-green-500";
    case "Approved (Locked)": return "bg-green-700";
    case "Rejected": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case "Ready for Review": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Approved": return "bg-green-50 text-green-700 border-green-200";
    case "Approved (Locked)": return "bg-green-50 text-green-800 border-green-300";
    case "Rejected": return "bg-red-50 text-red-700 border-red-200";
    default: return "";
  }
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getConfidenceColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-yellow-600";
  return "text-red-600";
};

const getConfidenceBarColor = (score: number) => {
  if (score >= 90) return "bg-green-500";
  if (score >= 80) return "bg-yellow-500";
  return "bg-red-500";
};

// ──────────────────────────────────────────────
// AI Pricing Panel Component
// ──────────────────────────────────────────────

function AIPricingPanel({ pco }: { pco: PCO }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());

  const suggestions = mockAISuggestions[pco.id] || [];
  const historicalProjects = mockHistoricalByPCO[pco.id] || [];
  const aiTotal = suggestions.reduce((sum, s) => sum + s.total, 0);
  const avgConfidence = suggestions.length > 0
    ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length)
    : 0;

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAcceptedSuggestions(new Set());
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2000);
  };

  const toggleAccept = (idx: number) => {
    setAcceptedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm leading-tight">AI Pricing Assistant</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">Powered by historical project data</p>
        </div>
      </div>

      {/* Analyze Button */}
      {!analysisComplete && !isAnalyzing && (
        <div className="pt-4">
          <Button
            onClick={handleAnalyze}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Brain className="h-4 w-4 mr-2" />
            <span>Generate AI Price Estimate</span>
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div key="loading" className="space-y-2">
          <Button disabled className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" size="sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Analyzing {pco.title}...</span>
          </Button>
          <div className="space-y-1.5 animate-pulse pl-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>Searching historical project data...</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Analyzing market rates...</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              <span>Mapping cost codes...</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {analysisComplete && suggestions.length > 0 && (
        <div className="space-y-3">
          {/* Confidence Score */}
          <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Overall Confidence</span>
              <span className={`text-base font-bold ${getConfidenceColor(avgConfidence)}`}>{avgConfidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getConfidenceBarColor(avgConfidence)}`}
                style={{ width: `${avgConfidence}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">Based on {suggestions[0]?.source}</span>
              <span className="text-xs font-medium">
                AI Total: <span className="text-blue-600 dark:text-blue-400">${formatCurrency(aiTotal)}</span>
              </span>
            </div>
            {Math.abs(aiTotal - pco.budgetEstimate) > 0 && (
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                <span className={aiTotal > pco.budgetEstimate ? "text-red-600" : "text-green-600"}>
                  {aiTotal > pco.budgetEstimate ? "+" : ""}{formatCurrency(aiTotal - pco.budgetEstimate)} vs. current estimate
                  ({aiTotal > pco.budgetEstimate ? "over" : "under"} by {Math.abs(((aiTotal - pco.budgetEstimate) / pco.budgetEstimate) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Cost Code Suggestions */}
          <div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Suggested Line Items</h4>
            <div className="space-y-1.5">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border transition-all ${
                    acceptedSuggestions.has(idx)
                      ? "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800"
                      : "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50"
                  }`}
                >
                  <button
                    className="w-full px-3 py-2 text-left"
                    onClick={() => setExpandedSuggestion(expandedSuggestion === idx ? null : idx)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0">{suggestion.costCode}</Badge>
                        <span className="text-xs font-medium truncate">{suggestion.description}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[11px] font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}%
                        </span>
                        {expandedSuggestion === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{suggestion.source}</span>
                      <span className="text-xs font-semibold">${formatCurrency(suggestion.total)}</span>
                    </div>
                  </button>

                  {expandedSuggestion === idx && (
                    <div className="px-3 pb-2 border-t">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5">
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Labor Rate:</span>
                          <span className="ml-1 font-medium">${suggestion.laborRate}/hr</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Hours:</span>
                          <span className="ml-1 font-medium">{suggestion.laborHours}</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Materials:</span>
                          <span className="ml-1 font-medium">${formatCurrency(suggestion.materialCost)}</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Equipment:</span>
                          <span className="ml-1 font-medium">${formatCurrency(suggestion.equipmentCost)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1.5">
                        <Button
                          size="sm"
                          variant={acceptedSuggestions.has(idx) ? "default" : "outline"}
                          className="flex-1 h-6 text-[11px]"
                          onClick={(e) => { e.stopPropagation(); toggleAccept(idx); }}
                        >
                          {acceptedSuggestions.has(idx) ? (
                            <><Check className="h-3 w-3 mr-1" /><span>Accepted</span></>
                          ) : (
                            <><ThumbsUp className="h-3 w-3 mr-1" /><span>Accept</span></>
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={(e) => e.stopPropagation()}>
                          <ThumbsDown className="h-3 w-3 mr-1" /><span>Reject</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Historical Comparisons */}
          <div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Historical Comparisons</h4>
            <div className="space-y-1.5">
              {historicalProjects.map((project, idx) => (
                <div key={idx} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{project.name}</span>
                    <span className="text-[11px] text-muted-foreground">{project.date}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{project.similarItem}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">${formatCurrency(project.actualCost)}</span>
                      <span className={`text-[11px] font-medium ${
                        project.variance.startsWith("-") ? "text-green-600" : "text-red-600"
                      }`}>
                        {project.variance}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply All */}
          <Button className="w-full" size="sm" disabled={acceptedSuggestions.size === 0}>
            <Zap className="h-4 w-4 mr-2" />
            <span>Apply {acceptedSuggestions.size} Accepted Suggestion{acceptedSuggestions.size !== 1 ? "s" : ""} to Estimate</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {analysisComplete && suggestions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <CloudOff className="h-7 w-7 mx-auto mb-1.5 opacity-50" />
          <p className="text-sm">Insufficient historical data for this item type.</p>
          <p className="text-[11px] mt-0.5">AI pricing improves as more projects are completed.</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// PCO Form View Component
// ──────────────────────────────────────────────

function PCOFormView({
  pco,
  pcoIndex,
  totalPCOs,
  onClose,
  onNavigate,
}: {
  pco: PCO;
  pcoIndex: number;
  totalPCOs: number;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}) {
  const [activeTab, setActiveTab] = useState("pco");
  const [formStatus, setFormStatus] = useState(pco.status);
  const [showAIEstimate, setShowAIEstimate] = useState(false);

  const totalBudgetEstimate = pco.lineItems.reduce((sum, li) => sum + li.estimate, 0);
  const totalBudgetProposed = pco.lineItems.reduce((sum, li) => sum + li.proposed, 0);
  const totalBudgetApproved = pco.lineItems.reduce((sum, li) => sum + li.approved, 0);
  const totalBudgetApplied = pco.lineItems.reduce((sum, li) => sum + li.applied, 0);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            <span>Done</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Save className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Potential Change Order - {pco.number}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("prev")} disabled={pcoIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{pcoIndex + 1} of {totalPCOs}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("next")} disabled={pcoIndex === totalPCOs - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MessageCircle className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Form Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-4 pb-2">
            <input
              defaultValue={pco.title}
              className="w-full text-lg font-medium bg-transparent border-0 border-b border-input rounded-none px-0 py-1 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
              <TabsList className="bg-transparent h-auto p-0 gap-4">
                <TabsTrigger value="pco" className="rounded-none px-1 pb-2">
                  POTENTIAL CHANGE ORDER
                </TabsTrigger>
                {SHOW_LEGACY_AI_TAB && (
                  <TabsTrigger value="ai-pricing" className="rounded-none px-1 pb-2 gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI PRICING
                  </TabsTrigger>
                )}
                <TabsTrigger value="comments" className="rounded-none px-1 pb-2">
                  COMMENTS
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none px-1 pb-2">
                  HISTORY
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pco" className="flex-1 overflow-auto mt-0">
              {/* Financial Summary Bar */}
              <div className="mx-6 mt-4 rounded-lg border pco-light-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 pco-light-border">
                      <th className="text-left p-3 w-24"></th>
                      <th className="text-right p-3 font-medium">estimate</th>
                      <th className="text-right p-3 font-medium">proposed</th>
                      <th className="text-right p-3 font-medium">approved</th>
                      <th className="text-right p-3 font-medium">applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b pco-light-border">
                      <td className="p-3 font-medium">Budget</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetEstimate)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetProposed)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetApproved)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetApplied)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Cost</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetEstimate)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetProposed)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetApproved)}</td>
                      <td className="text-right p-3">{formatCurrency(totalBudgetApplied)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mx-6 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronDown className="h-4 w-4" />
                  <h3 className="font-medium text-sm">Notes</h3>
                </div>
                <div className="border rounded-lg p-3 pco-light-border">
                  <textarea
                    defaultValue={pco.notes}
                    className="w-full min-h-[80px] text-sm bg-transparent resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Estimate Button */}
              <div className="mx-6 mt-4">
                <button
                  onClick={() => setShowAIEstimate(true)}
                  className="w-full flex items-center justify-between rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 px-4 py-3 transition-colors hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-950 dark:hover:to-blue-950"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm">AI Pricing Estimate</span>
                      <span className="block text-xs text-muted-foreground">Review AI-generated pricing suggestions for this change order</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* AI Estimate Modal */}
              <Dialog open={showAIEstimate} onOpenChange={setShowAIEstimate}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
                  <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      AI Pricing Estimate — {pco.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto">
                    <AIEstimateTab pco={pco} />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Line Items */}
              <div className="mx-6 mt-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Potential change order items</h3>
                  <div className="flex items-center gap-1">
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">VERTICAL MARKUPS</Button>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">ADD</Button>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">REMOVE</Button>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">INSERT</Button>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">DOWN</Button>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs h-7">UP</Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden pco-light-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b pco-light-border">
                        <th className="p-2 w-8"><input type="checkbox" className="rounded" /></th>
                        <th className="text-left p-2 text-xs font-medium">Item no. *</th>
                        <th className="text-left p-2 text-xs font-medium">Description</th>
                        <th className="text-left p-2 text-xs font-medium">UOM</th>
                        <th className="text-right p-2 text-xs font-medium">
                          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded text-center flex items-center justify-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Estimate
                          </div>
                        </th>
                        <th className="text-right p-2 text-xs font-medium" colSpan={2}>
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-center">Budget</div>
                        </th>
                        <th className="text-right p-2 text-xs font-medium">Applied hours</th>
                        <th className="text-right p-2 text-xs font-medium">Budget code *</th>
                        <th className="text-right p-2 text-xs font-medium">Allocation *</th>
                      </tr>
                      <tr className="bg-muted/20 border-b text-xs text-muted-foreground pco-light-border">
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="text-right p-1">Estimate</th>
                        <th className="text-right p-1">Proposed</th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                        <th className="p-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pco.lineItems.map((item, idx) => {
                        const aiSuggestion = mockEnhancedAISuggestions[pco.id]?.[idx];
                        return (
                          <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20 pco-light-row-border">
                            <td className="p-2"><input type="checkbox" className="rounded" /></td>
                            <td className="p-2">{item.itemNo}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.uom}</td>
                            <td className="text-right p-2">
                              {aiSuggestion ? (
                                <span className="inline-flex items-center gap-1.5 justify-end">
                                  <ConfidenceIndicator score={aiSuggestion.confidence} />
                                  <span
                                    className="text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline"
                                    onClick={() => setShowAIEstimate(true)}
                                  >
                                    {formatCurrency(aiSuggestion.total)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="text-right p-2">{formatCurrency(item.estimate)}</td>
                            <td className="text-right p-2">{formatCurrency(item.proposed)}</td>
                            <td className="text-right p-2">{item.appliedHours.toFixed(2)}</td>
                            <td className="text-right p-2 font-mono text-xs">{item.budgetCode}</td>
                            <td className="text-right p-2">
                              <Badge variant="outline" className="text-xs">{item.allocation}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Legacy AI Pricing Tab (hidden behind feature flag) */}
            {SHOW_LEGACY_AI_TAB && (
              <TabsContent value="ai-pricing" className="flex-1 overflow-auto mt-0">
                <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
                  <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">AI-Assisted Change Order Pricing</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          Analyzes historical data, market rates, and CSI cost codes to generate estimates. Suggestions require PM review.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[11px]">Estimation Time</span>
                      </div>
                      <div className="text-xl font-bold text-blue-600 leading-tight mt-0.5">~15s</div>
                      <div className="text-[11px] text-muted-foreground">vs. 1-3 days manual</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <span className="text-[11px]">Projects Analyzed</span>
                      </div>
                      <div className="text-xl font-bold text-purple-600 leading-tight mt-0.5">147</div>
                      <div className="text-[11px] text-muted-foreground">in your portfolio</div>
                    </div>
                    <div className="rounded-lg border px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-[11px]">Acceptance Rate</span>
                      </div>
                      <div className="text-xl font-bold text-green-600 leading-tight mt-0.5">87%</div>
                      <div className="text-[11px] text-muted-foreground">accepted without changes</div>
                    </div>
                  </div>
                  <Separator />
                  <AIPricingPanel pco={pco} />
                </div>
              </TabsContent>
            )}

            <TabsContent value="comments" className="flex-1 overflow-auto mt-0 p-6">
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No comments yet</p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto mt-0 p-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pco.author}</span>
                      <span className="text-xs text-muted-foreground">{pco.createDate}</span>
                    </div>
                    <p className="text-muted-foreground">Created potential change order</p>
                  </div>
                </div>
                {pco.status === "Approved" || pco.status === "Approved (Locked)" ? (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">System</span>
                        <span className="text-xs text-muted-foreground">{pco.dueDate}</span>
                      </div>
                      <p className="text-muted-foreground">Status changed to {pco.status}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l bg-muted/30 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Number *</label>
            <Input defaultValue={pco.number} className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Status *</label>
            <Select defaultValue={formStatus} onValueChange={(v) => setFormStatus(v as PCO["status"])}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ready for Review">Ready for Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Approved (Locked)">Approved (Locked)</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Approved for budget</label>
            <Switch defaultChecked={pco.approvedForBudget} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Create date *</label>
            <input type="date" defaultValue={pco.createDate} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Category</label>
            <Select defaultValue={pco.category}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Change Order">Change Order</SelectItem>
                <SelectItem value="Category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Due date</label>
            <input type="date" defaultValue={pco.dueDate} className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Reason</label>
            <Select defaultValue={pco.reason || undefined}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Design Change">Design Change</SelectItem>
                <SelectItem value="Field Condition">Field Condition</SelectItem>
                <SelectItem value="Inspection Result">Inspection Result</SelectItem>
                <SelectItem value="Owner Request">Owner Request</SelectItem>
                <SelectItem value="Code Compliance">Code Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Requested days</label>
            <Input type="number" defaultValue={pco.requestedDays} className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Importance</label>
            <Select defaultValue={pco.importance}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Approved days</label>
            <Input type="number" defaultValue={pco.approvedDays} className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Reference</label>
            <Input defaultValue={pco.reference} className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Location</label>
            <Input defaultValue={pco.location} className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Linked Specifications</label>
            <Select defaultValue={pco.linkedSpecifications || undefined}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select specification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="03 30 00 - Cast-in-Place Concrete">03 30 00 - Cast-in-Place Concrete</SelectItem>
                <SelectItem value="05 12 00 - Structural Steel Framing">05 12 00 - Structural Steel Framing</SelectItem>
                <SelectItem value="07 84 00 - Firestopping">07 84 00 - Firestopping</SelectItem>
                <SelectItem value="26 05 00 - Common Work Results for Electrical">26 05 00 - Electrical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-xs font-medium">Author</label>
            <Input defaultValue={pco.author} className="h-8 text-sm" readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Author company</label>
            <Input defaultValue={pco.authorCompany} className="h-8 text-sm" readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function PotentialChangeOrdersPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedView, setSelectedView] = useState("Default view");
  const [selectedGroup, setSelectedGroup] = useState("None");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPanel, setSelectedPanel] = useState<SidePanelType>("search");
  const [selectedPCOId, setSelectedPCOId] = useState<number | null>(null);
  const [aiEstimatePCOId, setAiEstimatePCOId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    assignedToMe: false,
    assignedToMyCompany: false,
    readyForReview: false,
    approved: false,
    approvedLocked: false,
    rejected: false,
    location: "",
    dueDateFrom: "",
    dueDateTo: "",
    linkedSpecifications: "",
    approvedForBudget: "",
    assignedToContact: "",
    assignedToCompany: "",
    author: "",
    authorCompany: "",
  });

  const handleFilterChange = (key: string, value: boolean | string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getAIEstimateTotal = (pcoId: number): number | null => {
    const suggestions = mockEnhancedAISuggestions[pcoId];
    if (!suggestions) return null;
    return suggestions.reduce((sum, s) => sum + s.total, 0);
  };

  const getAIAvgConfidence = (pcoId: number): number | null => {
    const suggestions = mockEnhancedAISuggestions[pcoId];
    if (!suggestions || suggestions.length === 0) return null;
    return Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length);
  };

  const aiEstimatePCO = aiEstimatePCOId ? mockPCOs.find((p) => p.id === aiEstimatePCOId) : null;

  const resetSearch = () => {
    setSearchQuery("");
    setFilters({
      assignedToMe: false,
      assignedToMyCompany: false,
      readyForReview: false,
      approved: false,
      approvedLocked: false,
      rejected: false,
      location: "",
      dueDateFrom: "",
      dueDateTo: "",
      linkedSpecifications: "",
      approvedForBudget: "",
      assignedToContact: "",
      assignedToCompany: "",
      author: "",
      authorCompany: "",
    });
  };

  const selectedPCO = selectedPCOId !== null ? mockPCOs.find((p) => p.id === selectedPCOId) : null;
  const selectedPCOIndex = selectedPCO ? mockPCOs.indexOf(selectedPCO) : -1;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedPCOIndex === -1) return;
    const nextIndex = direction === "prev" ? selectedPCOIndex - 1 : selectedPCOIndex + 1;
    if (nextIndex >= 0 && nextIndex < mockPCOs.length) {
      setSelectedPCOId(mockPCOs[nextIndex].id);
    }
  };

  // ── Form overlay ──
  if (selectedPCO) {
    return (
      <PCOFormView
        pco={selectedPCO}
        pcoIndex={selectedPCOIndex}
        totalPCOs={mockPCOs.length}
        onClose={() => setSelectedPCOId(null)}
        onNavigate={handleNavigate}
      />
    );
  }

  // ── Tile / List view ──
  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Main Application Toolbar */}
        <div className="flex justify-end items-center gap-2 p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><AlertCircle className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        {/* Record Toolbar */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-blue-700">
                Viewing {mockPCOs.length} Potential change orders
              </h1>
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-44">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default view">Default view</SelectItem>
                  <SelectItem value="All PCOs">All PCOs</SelectItem>
                  <SelectItem value="My PCOs">My PCOs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">Group</SelectItem>
                  <SelectItem value="Status">Status</SelectItem>
                  <SelectItem value="Category">Category</SelectItem>
                  <SelectItem value="Reason">Reason</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Number</SelectItem>
                  <SelectItem value="Ascending">Ascending</SelectItem>
                  <SelectItem value="Descending">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} className="h-8 w-8">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Data View */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockPCOs.map((pco) => (
                <Card
                  key={pco.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedPCOId(pco.id)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                        <span className="font-medium text-sm">{pco.number} - {pco.title}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                      <Badge variant="outline" className={`text-xs ${getStatusBadgeClasses(pco.status)}`}>
                        <div className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor(pco.status)}`} />
                        {pco.status}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <Info className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-xs text-muted-foreground">Category</span>
                        </div>
                        <span className="text-xs font-medium">{pco.category}</span>
                      </div>
                      {getAIEstimateTotal(pco.id) !== null && (
                        <div
                          className="flex items-center justify-between rounded-md px-2 py-1 -mx-1 cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          onClick={(e) => { e.stopPropagation(); setAiEstimatePCOId(pco.id); }}
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">AI estimate</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ConfidenceIndicator score={getAIAvgConfidence(pco.id)!} />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">${formatCurrency(getAIEstimateTotal(pco.id)!)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground ml-6">Budget estimate</span>
                        <span className="text-xs font-medium">{formatCurrency(pco.budgetEstimate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground ml-6">Reason</span>
                        <span className="text-xs font-medium">{pco.reason || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground ml-6">Cost estimate</span>
                        <span className="text-xs font-medium">{formatCurrency(pco.costEstimate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mockPCOs.map((pco) => (
                <Card
                  key={pco.id}
                  className="hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => setSelectedPCOId(pco.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                        <span className="font-medium text-sm w-32">{pco.number} - {pco.title}</span>
                        <Badge variant="outline" className={`text-xs ${getStatusBadgeClasses(pco.status)}`}>
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor(pco.status)}`} />
                          {pco.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{pco.category}</span>
                        <span className="text-sm text-muted-foreground">{pco.reason || "—"}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getAIEstimateTotal(pco.id) !== null && (
                          <span
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setAiEstimatePCOId(pco.id); }}
                          >
                            <ConfidenceIndicator score={getAIAvgConfidence(pco.id)!} />
                            <span className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                              <Sparkles className="h-3.5 w-3.5" />
                              ${formatCurrency(getAIEstimateTotal(pco.id)!)}
                            </span>
                          </span>
                        )}
                        <span className="text-sm font-medium">${formatCurrency(pco.budgetEstimate)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {/* AI Estimate Modal (page-level for grid/list views) */}
      {aiEstimatePCO && (
        <Dialog open={aiEstimatePCOId !== null} onOpenChange={(open) => { if (!open) setAiEstimatePCOId(null); }}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                AI Pricing Estimate — {aiEstimatePCO.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <AIEstimateTab pco={aiEstimatePCO} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Right Sidebar */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
        <div className="flex justify-end items-center p-2 border-b bg-background">
          <div className="flex items-center gap-1">
            <Button variant={selectedPanel === "search" ? "default" : "ghost"} size="icon" onClick={() => setSelectedPanel("search")} className="h-8 w-8" title="Search">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant={selectedPanel === "info" ? "default" : "ghost"} size="icon" onClick={() => setSelectedPanel("info")} className="h-8 w-8" title="Info">
              <Info className="h-4 w-4" />
            </Button>
            <Button variant={selectedPanel === "add" ? "default" : "ghost"} onClick={() => setSelectedPanel("add")} className="h-8 px-3" title="Add">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {selectedPanel === "search" && (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm">Assignments</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned to me</span>
                    <Switch checked={filters.assignedToMe} onCheckedChange={(checked) => handleFilterChange("assignedToMe", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned to my company</span>
                    <Switch checked={filters.assignedToMyCompany} onCheckedChange={(checked) => handleFilterChange("assignedToMyCompany", checked)} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Ready for Review</span>
                    </div>
                    <Switch checked={filters.readyForReview} onCheckedChange={(checked) => handleFilterChange("readyForReview", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Approved</span>
                    </div>
                    <Switch checked={filters.approved} onCheckedChange={(checked) => handleFilterChange("approved", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-700" />
                      <span className="text-sm">Approved (Locked)</span>
                    </div>
                    <Switch checked={filters.approvedLocked} onCheckedChange={(checked) => handleFilterChange("approvedLocked", checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Rejected</span>
                    </div>
                    <Switch checked={filters.rejected} onCheckedChange={(checked) => handleFilterChange("rejected", checked)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Location</h3>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building-a">Building A</SelectItem>
                    <SelectItem value="building-b">Building B</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Due date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={filters.dueDateFrom} onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  <input type="date" value={filters.dueDateTo} onChange={(e) => handleFilterChange("dueDateTo", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Linked Specifications</h3>
                <Select value={filters.linkedSpecifications} onValueChange={(value) => handleFilterChange("linkedSpecifications", value)}>
                  <SelectTrigger><SelectValue placeholder="Linked Specifications" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concrete">03 30 00 - Cast-in-Place Concrete</SelectItem>
                    <SelectItem value="steel">05 12 00 - Structural Steel</SelectItem>
                    <SelectItem value="firestop">07 84 00 - Firestopping</SelectItem>
                    <SelectItem value="electrical">26 05 00 - Electrical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium text-sm">By</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Approved for budget</span>
                    <Select value={filters.approvedForBudget} onValueChange={(value) => handleFilterChange("approvedForBudget", value)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Assigned to contact</span>
                    <Select value={filters.assignedToContact} onValueChange={(value) => handleFilterChange("assignedToContact", value)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select contact" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jesse-lavine">Jesse Lavine</SelectItem>
                        <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="mike-davis">Mike Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Assigned to company</span>
                    <Select value={filters.assignedToCompany} onValueChange={(value) => handleFilterChange("assignedToCompany", value)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gc-construction">GC Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">CCed to contact</span>
                    <Select><SelectTrigger className="h-8"><SelectValue placeholder="Select contact" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">CCed to company</span>
                    <Select><SelectTrigger className="h-8"><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Author</span>
                    <Select value={filters.author} onValueChange={(value) => handleFilterChange("author", value)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select author" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jesse-lavine">Jesse Lavine</SelectItem>
                        <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="mike-davis">Mike Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Author company</span>
                    <Select value={filters.authorCompany} onValueChange={(value) => handleFilterChange("authorCompany", value)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gc-construction">GC Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={resetSearch} className="w-full">
                Reset search
              </Button>
            </>
          )}

          {selectedPanel === "info" && (
            <div className="text-center text-muted-foreground py-8">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a PCO to view its information</p>
            </div>
          )}

          {selectedPanel === "add" && (
            <div className="text-center text-muted-foreground py-8">
              <FilePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Add new PCO functionality coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
