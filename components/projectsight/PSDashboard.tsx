"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import IssueAlertWidget, { CreateIssuePanel } from "@/components/projectsight/IssueAlertWidget";
import type { IssueAlert } from "@/types/issue-alerts";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Bell,
  Building,
  Building2,
  FileText,
  Users,
  Edit,
  FileBarChart,
  User,
  X,
  Printer,
  List,
  LayoutGrid,
  FolderOpen,
  FileSymlink,
  GripVertical,
  Expand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const mentionsData = [
  { month: "Dec", mentions: 65, resolved: 45 },
  { month: "Nov", mentions: 45, resolved: 38 },
  { month: "Oct", mentions: 58, resolved: 52 },
  { month: "Sep", mentions: 42, resolved: 35 },
  { month: "Aug", mentions: 38, resolved: 30 },
  { month: "Jul", mentions: 25, resolved: 22 },
];

const projectActivityData = [
  { name: "Design Review", value: 35 },
  { name: "MEP Coordination", value: 25 },
  { name: "Site Inspections", value: 20 },
  { name: "Safety Reports", value: 15 },
  { name: "Quality Control", value: 5 },
];

// Define dark mode chart colors based on CSS variables
const DARK_MODE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Keep the original colors for light mode
const LIGHT_MODE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
];

const buildingData = {
  address: "123 Construction Ave, Seattle, WA 98101",
  buildingType: "Commercial Office",
  constructionType: "Steel Frame",
  owner: "Trimble Development Corp.",
};

// Chart data for cards with realistic values
const noticesData = [
  { name: "Open", value: 12, total: 32 },
  { name: "Closed", value: 18, total: 32 },
  { name: "On Hold", value: 2, total: 32 },
];

const rfisData = [
  { name: "Open", value: 8, total: 45 },
  { name: "Closed", value: 37, total: 45 },
];

const submittalsData = [
  { name: "Submitted", value: 25, total: 64 },
  { name: "Rejected", value: 14, total: 64 },
  { name: "Approved", value: 25, total: 64 },
];

const punchItemsData = [
  { name: "Open", value: 42, total: 118 },
  { name: "Pending Reinspection", value: 35, total: 118 },
  { name: "Closed", value: 41, total: 118 },
];

const overdueItemsData = [
  { name: "Design Documents", value: 12 },
  { name: "RFIs", value: 8 },
  { name: "Submittals", value: 5 },
];

const dueTodayItemsData = [
  { name: "Design Review", value: 4 },
  { name: "Material Approval", value: 7 },
  { name: "Site Inspection", value: 3 },
];

const dueNext7DaysData = [
  { name: "Meetings", value: 12 },
  { name: "Submittals", value: 15 },
  { name: "Inspections", value: 8 },
];

const drawingsData = {
  current: 141,
  total: 141,
  notCurrent: 0,
};

const workProgressData = {
  progress: 65, // percentage
  startDate: "2023-03-15",
  endDate: "2024-11-30",
};

// Ball-in-Court workflows data
const ballInCourtData = [
  {
    name: "RFIs",
    open: 8,
    inProgress: 12,
    closed: 25,
    total: 45,
  },
  {
    name: "Submittals",
    open: 15,
    inProgress: 8,
    closed: 41,
    total: 64,
  },
  {
    name: "Issues",
    open: 6,
    inProgress: 9,
    closed: 18,
    total: 33,
  },
];

// Detailed records for expanded view
const ballInCourtRecords = {
  rfis: [
    { number: "RFI-001", description: "Clarification needed for electrical panel specifications", status: "Open", assignedTo: "John Smith", dueDate: "2024-12-15", recordType: "RFI" },
    { number: "RFI-002", description: "Request for structural beam connection details", status: "In Progress", assignedTo: "Sarah Johnson", dueDate: "2024-12-18", recordType: "RFI" },
    { number: "RFI-003", description: "HVAC ductwork routing through structural members", status: "Closed", assignedTo: "John Smith", dueDate: "2024-12-10", recordType: "RFI" },
    { number: "RFI-004", description: "Fire protection system integration with MEP", status: "Open", assignedTo: "Sarah Johnson", dueDate: "2024-12-20", recordType: "RFI" },
    { number: "RFI-005", description: "Elevator shaft construction sequence", status: "In Progress", assignedTo: "Mike Davis", dueDate: "2024-12-22", recordType: "RFI" },
    { number: "RFI-006", description: "Foundation waterproofing details", status: "Open", assignedTo: "Mike Davis", dueDate: "2024-12-25", recordType: "RFI" },
    { number: "RFI-007", description: "Overdue: Structural inspection report", status: "Open", assignedTo: "John Smith", dueDate: "2024-11-30", recordType: "RFI" },
    { number: "RFI-008", description: "Due today: Electrical panel review", status: "Open", assignedTo: "Sarah Johnson", dueDate: new Date().toISOString().split('T')[0], recordType: "RFI" },
  ],
  submittals: [
    { number: "SUB-001", description: "Structural steel shop drawings for main frame", status: "Open", assignedTo: "John Smith", dueDate: "2024-12-16", recordType: "Submittal" },
    { number: "SUB-002", description: "Mechanical equipment specifications and data", status: "In Progress", assignedTo: "Sarah Johnson", dueDate: "2024-12-19", recordType: "Submittal" },
    { number: "SUB-003", description: "Electrical panel schedules and load calculations", status: "Closed", assignedTo: "John Smith", dueDate: "2024-12-12", recordType: "Submittal" },
    { number: "SUB-004", description: "Plumbing fixture specifications and rough-in details", status: "Open", assignedTo: "Sarah Johnson", dueDate: "2024-12-21", recordType: "Submittal" },
    { number: "SUB-005", description: "Fire alarm system design and equipment", status: "In Progress", assignedTo: "Mike Davis", dueDate: "2024-12-25", recordType: "Submittal" },
    { number: "SUB-006", description: "Roofing material specifications", status: "Closed", assignedTo: "Mike Davis", dueDate: "2024-12-14", recordType: "Submittal" },
    { number: "SUB-007", description: "Overdue: HVAC equipment specs", status: "Open", assignedTo: "Mike Davis", dueDate: "2024-11-28", recordType: "Submittal" },
    { number: "SUB-008", description: "Due this week: Fire safety drawings", status: "Open", assignedTo: "John Smith", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], recordType: "Submittal" },
  ],
  issues: [
    { number: "ISS-001", description: "Water infiltration at basement level", status: "Open", assignedTo: "John Smith", dueDate: "2024-12-17", recordType: "Issue" },
    { number: "ISS-002", description: "Structural crack in foundation wall", status: "In Progress", assignedTo: "Sarah Johnson", dueDate: "2024-12-20", recordType: "Issue" },
    { number: "ISS-003", description: "HVAC system noise and vibration concerns", status: "Closed", assignedTo: "Mike Davis", dueDate: "2024-12-14", recordType: "Issue" },
    { number: "ISS-004", description: "Electrical panel clearance requirements", status: "Open", assignedTo: "John Smith", dueDate: "2024-12-23", recordType: "Issue" },
    { number: "ISS-005", description: "Plumbing fixture accessibility compliance", status: "In Progress", assignedTo: "Sarah Johnson", dueDate: "2024-12-26", recordType: "Issue" },
    { number: "ISS-006", description: "Fire safety equipment placement", status: "Open", assignedTo: "Mike Davis", dueDate: "2024-12-28", recordType: "Issue" },
    { number: "ISS-007", description: "Overdue: Safety inspection report", status: "Open", assignedTo: "Sarah Johnson", dueDate: "2024-11-25", recordType: "Issue" },
    { number: "ISS-008", description: "Due this month: Final inspection", status: "Open", assignedTo: "Mike Davis", dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], recordType: "Issue" },
  ],
};

// Define types for Widgets and WidgetRows
interface Widget {
  id: string;
  title: string;
  content: JSX.Element;
  className?: string; // For grid span etc.
  icon?: React.ElementType; // For stat cards
}

type WidgetRow = Widget[]; // An array of widgets

interface WidgetRows { // Defines the structure of the dashboard rows
  buildingInfo: WidgetRow;
  stats: WidgetRow;
  chartsRow1: WidgetRow;
  chartsRow2: WidgetRow;
}

interface DraggableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ElementType;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ id, title, children, className, icon: Icon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined, // Ensure dragging card is on top
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={className}>
      <Card className={cn("h-full flex flex-col relative", isDragging ? "opacity-50 shadow-2xl" : "")}>
        {/* Drag Handle - Top Right Corner */}
        <Button 
          variant="ghost" 
          size="icon" 
          {...listeners} 
          className="absolute top-0 right-0 cursor-grab hover:bg-muted/80 transition-colors z-10 h-7 w-7 rounded-bl-md border-l border-b border-border/50 bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col space-y-0.5">
            <div className="w-3 h-0.5 bg-gray-600 rounded-full"></div>
            <div className="w-3 h-0.5 bg-gray-600 rounded-full"></div>
            <div className="w-3 h-0.5 bg-gray-600 rounded-full"></div>
          </div>
        </Button>
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-8">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent className="flex-grow">{children}</CardContent>
      </Card>
    </div>
  );
};

// Separate component for the ball-in-court widget content
const BallInCourtWidgetContent: React.FC<{
  myAssignmentsOnly: boolean;
  setMyAssignmentsOnly: (value: boolean) => void;
}> = ({ myAssignmentsOnly, setMyAssignmentsOnly }) => {
  // Filter data based on myAssignmentsOnly state
  const filteredData = React.useMemo(() => {
    if (!myAssignmentsOnly) {
      return ballInCourtData;
    }
    
    // Filter to show only John Smith's assignments (demo user)
    const filteredRecords = {
      rfis: ballInCourtRecords.rfis.filter(record => record.assignedTo === "John Smith"),
      submittals: ballInCourtRecords.submittals.filter(record => record.assignedTo === "John Smith"),
      issues: ballInCourtRecords.issues.filter(record => record.assignedTo === "John Smith"),
    };
    
    // Calculate new chart data from filtered records
    return [
      {
        name: "RFIs",
        open: filteredRecords.rfis.filter(r => r.status === "Open").length,
        inProgress: filteredRecords.rfis.filter(r => r.status === "In Progress").length,
        closed: filteredRecords.rfis.filter(r => r.status === "Closed").length,
        total: filteredRecords.rfis.length,
      },
      {
        name: "Submittals",
        open: filteredRecords.submittals.filter(r => r.status === "Open").length,
        inProgress: filteredRecords.submittals.filter(r => r.status === "In Progress").length,
        closed: filteredRecords.submittals.filter(r => r.status === "Closed").length,
        total: filteredRecords.submittals.length,
      },
      {
        name: "Issues",
        open: filteredRecords.issues.filter(r => r.status === "Open").length,
        inProgress: filteredRecords.issues.filter(r => r.status === "In Progress").length,
        closed: filteredRecords.issues.filter(r => r.status === "Closed").length,
        total: filteredRecords.issues.length,
      },
    ];
  }, [myAssignmentsOnly]);

  return (
    <div className="flex flex-col h-52">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} layout="vertical" margin={{ top: 10, right: 10, bottom: 20, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 'dataMax']} stroke="currentColor" />
            <YAxis type="category" dataKey="name" width={80} stroke="currentColor" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))"}}/>
            <Bar dataKey="open" stackId="a" fill="hsl(var(--primary))" name="Open" />
            <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--chart-2))" name="In Progress" />
            <Bar dataKey="closed" stackId="a" fill="hsl(var(--chart-3))" name="Closed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <div className="flex items-center space-x-2">
            <span>Total: {filteredData.reduce((sum, item) => sum + item.total, 0)}</span>
            {myAssignmentsOnly && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                Filtered
              </span>
            )}
            <div className="flex items-center space-x-1">
              <label 
                className="text-xs cursor-pointer hover:text-foreground transition-colors"
                onClick={() => {
                  console.log('Label clicked, toggling switch');
                  setMyAssignmentsOnly(!myAssignmentsOnly);
                }}
              >
                My Assignments:
              </label>
              <button
                onClick={() => {
                  console.log('Button clicked, toggling switch');
                  setMyAssignmentsOnly(!myAssignmentsOnly);
                }}
                className={cn(
                  "h-4 w-6 rounded-full transition-colors cursor-pointer border",
                  myAssignmentsOnly 
                    ? "bg-primary border-primary" 
                    : "bg-muted border-border"
                )}
              >
                <div className={cn(
                  "h-3 w-3 rounded-full bg-background transition-transform",
                  myAssignmentsOnly ? "translate-x-3" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
          <BallInCourtDialog myAssignmentsOnly={myAssignmentsOnly} setMyAssignmentsOnly={setMyAssignmentsOnly} />
        </div>
    </div>
  );
};

// Separate component for the ball-in-court dialog
const BallInCourtDialog: React.FC<{
  myAssignmentsOnly: boolean;
  setMyAssignmentsOnly: (value: boolean) => void;
}> = ({ myAssignmentsOnly, setMyAssignmentsOnly }) => {
  // Filter states for ball-in-court workflows - moved inside the component
  const [recordTypeFilter, setRecordTypeFilter] = React.useState("");
  const [assigneeFilter, setAssigneeFilter] = React.useState("");
  const [dueDateFilter, setDueDateFilter] = React.useState("");
  const router = useRouter();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <Expand className="h-3 w-3 mr-1" />
          Expand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ball-in-Court Workflows - Detailed View</DialogTitle>
        </DialogHeader>
        
        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Record Type:</label>
                <select 
                  className="px-3 py-1 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={recordTypeFilter}
                  onChange={(e) => setRecordTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="RFI">RFI</option>
                  <option value="Submittal">Submittal</option>
                  <option value="Issue">Issue</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Assignee:</label>
                <select 
                  className="px-3 py-1 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                  <option value="">All Assignees</option>
                  <option value="John Smith">John Smith</option>
                  <option value="Sarah Johnson">Sarah Johnson</option>
                  <option value="Mike Davis">Mike Davis</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Due Date:</label>
                <select 
                  className="px-3 py-1 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                >
                  <option value="">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due Today</option>
                  <option value="week">Due This Week</option>
                  <option value="month">Due This Month</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">My Assignments:</label>
                <button
                  onClick={() => setMyAssignmentsOnly(!myAssignmentsOnly)}
                  className={cn(
                    "h-5 w-8 rounded-full transition-colors cursor-pointer border",
                    myAssignmentsOnly 
                      ? "bg-primary border-primary" 
                      : "bg-muted border-border"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full bg-background transition-transform",
                    myAssignmentsOnly ? "translate-x-3" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setRecordTypeFilter("");
                setAssigneeFilter("");
                setDueDateFilter("");
                setMyAssignmentsOnly(false);
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            Showing {(() => {
              let allRecords = [
                ...ballInCourtRecords.rfis,
                ...ballInCourtRecords.submittals,
                ...ballInCourtRecords.issues
              ];
              
              // Apply filters
              if (recordTypeFilter) {
                allRecords = allRecords.filter(record => record.recordType === recordTypeFilter);
              }
              
              if (assigneeFilter) {
                allRecords = allRecords.filter(record => record.assignedTo === assigneeFilter);
              }
              
              if (myAssignmentsOnly) {
                // For demo purposes, assume current user is "John Smith"
                // In a real app, this would come from user authentication
                allRecords = allRecords.filter(record => record.assignedTo === "John Smith");
              }
              
              if (dueDateFilter) {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                
                allRecords = allRecords.filter(record => {
                  const recordDate = new Date(record.dueDate);
                  const recordDateStr = recordDate.toISOString().split('T')[0];
                  
                  switch (dueDateFilter) {
                    case 'overdue':
                      return recordDate < today;
                    case 'today':
                      return recordDateStr === todayStr;
                    case 'week':
                      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return recordDate <= weekFromNow && recordDate >= today;
                    case 'month':
                      const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                      return recordDate <= monthFromNow && recordDate >= today;
                    default:
                      return true;
                  }
                });
              }
              
              return allRecords.length;
            })()} records
            {recordTypeFilter && ` • Type: ${recordTypeFilter}`}
            {assigneeFilter && ` • Assignee: ${assigneeFilter}`}
            {dueDateFilter && ` • Due: ${dueDateFilter === 'overdue' ? 'Overdue' : dueDateFilter === 'today' ? 'Due Today' : dueDateFilter === 'week' ? 'Due This Week' : dueDateFilter === 'month' ? 'Due This Month' : dueDateFilter}`}
            {myAssignmentsOnly && ` • My Assignments Only`}
          </div>
        </div>

        {/* Grouped by Assignee */}
        <div className="space-y-6">
          {(() => {
            // Get all records and apply filters
            let allRecords = [
              ...ballInCourtRecords.rfis,
              ...ballInCourtRecords.submittals,
              ...ballInCourtRecords.issues
            ];
            
            // Apply filters
            if (recordTypeFilter) {
              allRecords = allRecords.filter(record => record.recordType === recordTypeFilter);
            }
            
            if (assigneeFilter) {
              allRecords = allRecords.filter(record => record.assignedTo === assigneeFilter);
            }
            
            if (myAssignmentsOnly) {
              // For demo purposes, assume current user is "John Smith"
              // In a real app, this would come from user authentication
              allRecords = allRecords.filter(record => record.assignedTo === "John Smith");
            }
            
            if (dueDateFilter) {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              
              allRecords = allRecords.filter(record => {
                const recordDate = new Date(record.dueDate);
                const recordDateStr = recordDate.toISOString().split('T')[0];
                
                switch (dueDateFilter) {
                  case 'overdue':
                    return recordDate < today;
                  case 'today':
                    return recordDateStr === todayStr;
                  case 'week':
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return recordDate <= weekFromNow && recordDate >= today;
                  case 'month':
                    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                    return recordDate <= monthFromNow && recordDate >= today;
                  default:
                    return true;
                }
              });
            }
            
            const assignees = Array.from(new Set(allRecords.map(record => record.assignedTo))).sort();
            
            if (assignees.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No records found</div>
                  <div className="text-sm">Try adjusting your filters or clearing them to see all records.</div>
                </div>
              );
            }
            
            return assignees.map((assignee) => {
              const assigneeRecords = allRecords.filter(record => record.assignedTo === assignee);
              const openCount = assigneeRecords.filter(r => r.status === "Open").length;
              const inProgressCount = assigneeRecords.filter(r => r.status === "In Progress").length;
              const closedCount = assigneeRecords.filter(r => r.status === "Closed").length;
              
              return (
                <div key={assignee} className="space-y-3 border rounded-lg p-4 bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-lg font-semibold text-foreground">{assignee}</h3>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {openCount} Open
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {inProgressCount} In Progress
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {closedCount} Closed
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {assigneeRecords.map((record, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors",
                          record.recordType === "RFI" && "cursor-pointer hover:bg-muted/60 border-l-4 border-l-yellow-400"
                        )}
                        onClick={() => {
                          if (record.recordType === "RFI") {
                            router.push("/rfis");
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-foreground">{record.number}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                              {record.recordType}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{record.description}</div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border",
                            record.status === "Open" ? "bg-primary/10 text-primary border-primary/20" :
                            record.status === "In Progress" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}>
                            {record.status}
                          </span>
                          <span className="text-muted-foreground font-medium">{record.dueDate}</span>
                          {record.recordType === "RFI" && (
                            <span className="text-primary text-xs">→</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ProjectSightDashboard() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  // Filter states for ball-in-court workflows in main dashboard
  const [myAssignmentsOnly, setMyAssignmentsOnly] = React.useState(false);

  // Create Issue side panel state
  const [createIssueAlert, setCreateIssueAlert] = React.useState<IssueAlert | null>(null);

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('myAssignmentsOnly state changed to:', myAssignmentsOnly);
  }, [myAssignmentsOnly]);

  // Centralized definition for all widgets.
  // It recalculates its internal values (chartColors, dates) only when isDarkMode changes.
  const currentWidgetDefinitions: WidgetRows = React.useMemo(() => {
    // Calculate derived values needed for widget content *inside* this useMemo.
    const currentChartColors = isDarkMode ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;
    
    const localToday = new Date();
    const localStartDateObj = new Date(workProgressData.startDate);
    const localEndDateObj = new Date(workProgressData.endDate);
    const localFormattedStartDate = `${localStartDateObj.toLocaleString("default", {month: "short"})} ${localStartDateObj.getFullYear()}`;
    const localFormattedEndDate = `${localEndDateObj.toLocaleString("default", {month: "short"})} ${localEndDateObj.getFullYear()}`;
    const localDaysRemaining = Math.max(0, Math.floor(
      (localEndDateObj.getTime() - localToday.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Return the full WidgetRows structure using these internally calculated values
    return {
      buildingInfo: [
        {
          id: "building-info",
          title: "Building Information",
          className: "w-full relative border-border",
          content: (
            <div className="flex flex-col md:flex-row">
              <div className="p-4 flex items-center justify-center border-r border-border">
                <Building className="h-20 w-20 text-primary" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border-r border-border">
                  <h3 className="text-primary font-medium mb-2">Address</h3>
                  <p className="text-muted-foreground">{buildingData.address}</p>
                </div>
                <div className="p-4 border-r border-border">
                  <h3 className="text-primary font-medium mb-2">Building type</h3>
                  <p className="text-muted-foreground">{buildingData.buildingType}</p>
                </div>
                <div className="p-4 border-r border-border">
                  <h3 className="text-primary font-medium mb-2">Construction type</h3>
                  <p className="text-muted-foreground">{buildingData.constructionType}</p>
                </div>
                <div className="p-4">
                  <h3 className="text-primary font-medium mb-2">Owner</h3>
                  <p className="text-muted-foreground">{buildingData.owner}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="absolute right-16 top-2">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ],
      stats: [
        { id: "total-mentions", title: "Total Mentions", icon: Bell, content: <><div className="text-2xl font-bold">245</div><p className="text-xs text-muted-foreground">+12% from last month</p></> },
        { id: "active-projects", title: "Active Projects", icon: Activity, content: <><div className="text-2xl font-bold">8</div><p className="text-xs text-muted-foreground">2 new this quarter</p></> },
        { id: "team-members", title: "Team Members", icon: Users, content: <><div className="text-2xl font-bold">24</div><p className="text-xs text-muted-foreground">Active collaborators</p></> },
        { id: "documents", title: "Documents", icon: FileText, content: <><div className="text-2xl font-bold">342</div><p className="text-xs text-muted-foreground">Shared across projects</p></> },
      ],
      chartsRow1: [
        { id: "ball-in-court", title: "Ball-in-Court Workflows", className: "md:col-span-2", content: <div /> }, // Will be set separately
        { id: "drawings", title: "Drawings", className: "md:col-span-1", content: (
          <div className="flex flex-col h-52 justify-center">
            <div className="text-sm mb-2">Current</div>
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className="bg-primary h-full" style={{ width: `${(drawingsData.current / drawingsData.total) * 100}%`}}></div>
            </div>
            <div className="text-sm text-right">{drawingsData.current} / {drawingsData.total}</div>
            <div className="text-sm mb-2 mt-4">Not Current</div>
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className="bg-amber-500 h-full" style={{ width: `${(drawingsData.notCurrent / drawingsData.total) * 100}%`}}></div>
            </div>
            <div className="text-sm text-right">{drawingsData.notCurrent} / {drawingsData.total}</div>
          </div>
        )},
        { id: "work-progress", title: "Work Progress", className: "md:col-span-1", content: (
          <div className="flex flex-col items-center justify-center h-52">
            <div className="relative h-40 w-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeDasharray={`${(2 * Math.PI * 45 * workProgressData.progress) / 100} ${2 * Math.PI * 45 * (1 - workProgressData.progress / 100)}`} strokeDashoffset={2 * Math.PI * 45 * 0.25} strokeLinecap="round" transform="rotate(-90 50 50)"/>
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="currentColor">{workProgressData.progress}%</text>
              </svg>
            </div>
            <div className="text-xs text-primary mt-4">{localFormattedStartDate} / {localFormattedEndDate}</div>
            <div className="text-xs text-muted-foreground">{localDaysRemaining} days remaining</div>
          </div>
        )},
        { id: "notices-to-comply", title: "Notices to Comply", className: "md:col-span-1", content: (
          <div className="flex flex-col h-52 justify-center space-y-2">
            {noticesData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm">{item.name}</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full", index === 0 ? "bg-primary" : index === 1 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${(item.value / item.total) * 100}%`}}></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-right ml-2">{item.value} / {item.total}</div>
              </div>
            ))}
            <div className="text-center text-xs mt-6 text-muted-foreground">Average Turnaround: 3.2 days</div>
          </div>
        )},
        { id: "safety-notices", title: "Top 5 Safety Notices By Type", className: "md:col-span-1", content: (
           <div className="flex flex-col h-52 justify-between">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={[{ name: "Falling Hazard", value: 8 },{ name: "Electrical", value: 6 },{ name: "PPE Violation", value: 5 },{ name: "Scaffolding", value: 4 },{ name: "Fire Safety", value: 3 }]} margin={{ top: 10, right: 10, bottom: 5, left: 70 }}>
                    <XAxis type="number" domain={[0, 10]} stroke="currentColor"/>
                    <YAxis type="category" dataKey="name" width={70} style={{ fontSize: "10px" }} stroke="currentColor"/>
                    <Bar dataKey="value" fill="hsl(var(--primary))" background={{ fill: "hsl(var(--secondary))" }}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        )},
        { id: "overdue-items", title: "Overdue Items", className: "md:col-span-1", content: (
          <div className="flex flex-col items-center justify-center h-52">
            <div className="relative h-36 w-36">
              <PieChart width={150} height={150}>
                <Pie data={overdueItemsData} cx="50%" cy="50%" outerRadius={60} innerRadius={45} paddingAngle={2} dataKey="value">
                  {overdueItemsData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={currentChartColors[index % currentChartColors.length]}/> ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))"}}/>
              </PieChart>
              <div className="absolute top-16 right-0 bg-card px-2 py-1 text-xs border border-border rounded">Total: 25 items</div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 mt-2">
              {overdueItemsData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: currentChartColors[index % currentChartColors.length]}}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )},
      ],
      chartsRow2: [
        { id: "due-today", title: "Due Today Items", className: "md:col-span-1", content: (
          <div className="flex flex-col items-center justify-center h-52">
            <div className="relative h-36 w-36">
              <PieChart width={150} height={150}>
                <Pie data={dueTodayItemsData} cx="50%" cy="50%" outerRadius={60} innerRadius={45} paddingAngle={2} dataKey="value">
                  {dueTodayItemsData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={currentChartColors[index % currentChartColors.length]}/> ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))"}}/>
              </PieChart>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 mt-2">
              {dueTodayItemsData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: currentChartColors[index % currentChartColors.length]}}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
            <div className="text-sm mt-2">Total: 14</div>
          </div>
        )},
        { id: "due-next-7-days", title: "Due in Next 7 Days", className: "md:col-span-1", content: (
          <div className="flex flex-col items-center justify-center h-52">
            <div className="relative h-36 w-36">
              <PieChart width={150} height={150}>
                <Pie data={dueNext7DaysData} cx="50%" cy="50%" outerRadius={60} innerRadius={45} paddingAngle={2} dataKey="value">
                  {dueNext7DaysData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={currentChartColors[index % currentChartColors.length]}/> ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))"}}/>
              </PieChart>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 mt-2">
              {dueNext7DaysData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: currentChartColors[index % currentChartColors.length]}}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
            <div className="text-sm mt-2">Total: 35</div>
          </div>
        )},
        { id: "rfis", title: "RFIs", className: "md:col-span-1", content: (
          <div className="flex flex-col h-52 justify-center space-y-2">
            {rfisData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm">{item.name}</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={index === 0 ? "bg-primary h-full" : "bg-emerald-500 h-full"} style={{ width: `${(item.value / item.total) * 100}%`}}></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-right ml-2">{item.value} / {item.total}</div>
              </div>
            ))}
            <div className="text-center text-xs text-muted-foreground mt-4">8 pending responses</div>
            <div className="text-center text-xs mt-4 text-muted-foreground">Average Turnaround: 4.5 days</div>
            <div className="text-center mt-4">
              <Link href="/rfis" className="text-xs text-primary hover:underline">
                View All RFIs →
              </Link>
            </div>
          </div>
        )},
        { id: "submittals", title: "Submittals", className: "md:col-span-1", content: (
          <div className="flex flex-col h-52 justify-center space-y-2">
            {submittalsData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm">{item.name}</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={index === 0 ? "bg-primary h-full" : index === 1 ? "bg-destructive h-full" : "bg-emerald-500 h-full"} style={{ width: `${(item.value / item.total) * 100}%`}}></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-right ml-2">{item.value} / {item.total}</div>
              </div>
            ))}
            <div className="text-center text-xs mt-4 text-muted-foreground">Average Turnaround: 5.8 days</div>
          </div>
        )},
        { id: "punch-items", title: "Punch Items", className: "md:col-span-1", content: (
          <div className="flex flex-col h-52 justify-center space-y-2">
            {punchItemsData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-28 text-sm">{item.name}</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={index === 0 ? "bg-primary h-full" : index === 1 ? "bg-amber-500 h-full" : "bg-emerald-500 h-full"} style={{ width: `${(item.value / item.total) * 100}%`}}></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-right ml-2">{item.value} / {item.total}</div>
              </div>
            ))}
            <div className="text-center text-xs mt-4 text-muted-foreground">Average Turnaround: 7.2 days</div>
          </div>
        )},
      ]
    };
  }, [isDarkMode]); // Only isDarkMode is needed as a dependency. workProgressData is const.

  const [widgetRows, setWidgetRows] = React.useState<WidgetRows>(currentWidgetDefinitions);

  // Effect to synchronize widgetRows state if currentWidgetDefinitions changes (e.g., due to theme change)
  React.useEffect(() => {
    setWidgetRows(currentWidgetDefinitions);
  }, [currentWidgetDefinitions]);



  React.useEffect(() => {
    setMounted(true);
    const checkDarkMode = () => {
      if (typeof window !== "undefined") {
        const isDark =
          document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(isDark);
      }
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return; // No operation needed
    }

    setWidgetRows((currentRows) => {
      const activeId = String(active.id);
      const overId = String(over.id);

      let activeRowKey: keyof WidgetRows | null = null;
      let activeItemIndex = -1;
      let itemToMove: Widget | null = null;

      // Find active item, its row, and index
      for (const keyStr in currentRows) {
        if (Object.prototype.hasOwnProperty.call(currentRows, keyStr)) {
          const key = keyStr as keyof WidgetRows;
          const rowIndex = currentRows[key].findIndex(item => item.id === activeId);
          if (rowIndex !== -1) {
            activeRowKey = key;
            activeItemIndex = rowIndex;
            itemToMove = currentRows[key][rowIndex];
            break;
          }
        }
      }

      if (!activeRowKey || activeItemIndex === -1 || !itemToMove) {
        console.warn("DND: Active item not found.");
        return currentRows; // No change
      }

      let targetRowKey: keyof WidgetRows | null = null;
      let targetItemIndex = -1; // This will be the insertion index

      // Scenario 1: Dropping onto a specific item in a row
      for (const keyStr in currentRows) {
        if (Object.prototype.hasOwnProperty.call(currentRows, keyStr)) {
          const key = keyStr as keyof WidgetRows;
          const rowIndex = currentRows[key].findIndex(item => item.id === overId);
          if (rowIndex !== -1) {
            targetRowKey = key;
            targetItemIndex = rowIndex;
            break;
          }
        }
      }

      // Scenario 2: Dropping onto a SortableContext (a row container)
      if (!targetRowKey && over.data.current?.sortable?.containerId) {
        const containerId = over.data.current.sortable.containerId as keyof WidgetRows;
        if (Object.prototype.hasOwnProperty.call(currentRows, containerId)) {
          targetRowKey = containerId;
          // Decide where to insert: if dragging to a new container, often it's at the end or based on pointer position.
          // For simplicity with arrayMove later, if moving to a new container, let's target the end for now.
          // If we are moving FROM this container, activeItemIndex has to be accounted for if it's the same container.
          targetItemIndex = currentRows[targetRowKey].length;
        }
      }
      
      if (!targetRowKey || targetItemIndex === -1) {
         // If targetItemIndex is still -1, it means we couldn't resolve it to an item or a known container.
         // This might happen if `overId` is something unexpected or not part of sortable items/containers.
        console.warn("DND: Target drop location not identified.", { overId, overData: over.data.current });
        return currentRows; // No change
      }

      // Perform the state update immutably
      if (activeRowKey === targetRowKey) {
        // Moving within the same row
        const currentRow = currentRows[activeRowKey];
        if (activeItemIndex === targetItemIndex) return currentRows; // No change if dropped in the same spot
        
        const reorderedRow = arrayMove(currentRow, activeItemIndex, targetItemIndex);
        return {
          ...currentRows,
          [activeRowKey]: reorderedRow,
        };
      } else {
        // Moving to a different row
        const sourceRow = [...currentRows[activeRowKey]]; // Clone source
        sourceRow.splice(activeItemIndex, 1); // Remove item from source

        const destinationRow = [...currentRows[targetRowKey]]; // Clone destination
        // If targetItemIndex was set to destinationRow.length (for dropping on container end),
        // splice will correctly append.
        destinationRow.splice(targetItemIndex, 0, itemToMove);

        return {
          ...currentRows,
          [activeRowKey]: sourceRow,
          [targetRowKey]: destinationRow,
        };
      }
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
    <div className="flex flex-col h-full">
      {/* Toolbar — full width, always on top */}
      <div className="flex justify-end items-center gap-2 p-2 border-b bg-background shrink-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileSymlink className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Printer className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>

    <div className="flex flex-1 min-h-0">
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-12 space-y-4">
          {/* Building Info Card - Assuming this one is not draggable or part of a sortable list for now */}
          {widgetRows.buildingInfo.map(widget => (
              <Card key={widget.id} className={widget.className}>
                   {/* Retain X button for card removal if needed */}
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2"> <X className="h-4 w-4" /> </Button>
                  {widget.content}
        </Card>
          ))}
          

        {/* Stats Cards */}
          <SortableContext items={widgetRows.stats.map(w => w.id)} strategy={horizontalListSortingStrategy}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {widgetRows.stats.map(widget => (
                <DraggableCard key={widget.id} id={widget.id} title={widget.title} icon={widget.icon} className={widget.className}>
                  {widget.content}
                </DraggableCard>
              ))}
        </div>
          </SortableContext>

        {/* AI Issue Alerts */}
        <IssueAlertWidget onCreateIssue={(alert) => setCreateIssueAlert(alert)} />

        {/* Chart Cards - First Row */}
          <SortableContext items={widgetRows.chartsRow1.map(w => w.id)} strategy={horizontalListSortingStrategy}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              {widgetRows.chartsRow1.map(widget => {
                // Special handling for ball-in-court widget to fix state management
                if (widget.id === "ball-in-court") {
                  return (
                    <DraggableCard key={widget.id} id={widget.id} title={widget.title} className={widget.className}>
                      <BallInCourtWidgetContent myAssignmentsOnly={myAssignmentsOnly} setMyAssignmentsOnly={setMyAssignmentsOnly} />
                    </DraggableCard>
                  );
                }
                
                return (
                  <DraggableCard key={widget.id} id={widget.id} title={widget.title} className={widget.className}>
                    {widget.content}
                  </DraggableCard>
                );
              })}
                </div>
          </SortableContext>

        {/* Chart Cards - Second Row */}
          <SortableContext items={widgetRows.chartsRow2.map(w => w.id)} strategy={horizontalListSortingStrategy}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {widgetRows.chartsRow2.map(widget => (
                <DraggableCard key={widget.id} id={widget.id} title={widget.title} className={widget.className}>
                  {/* Retain X button for card removal if needed */}
                  {/* <Button size="icon" variant="ghost" className="h-5 w-5 absolute top-2 right-2 z-10"> <X className="h-3 w-3" /> </Button>*/}
                  {widget.content}
                </DraggableCard>
                  ))}
                </div>
          </SortableContext>
        </div>
      </div>

      {/* Create Issue side panel */}
      {createIssueAlert && (
        <CreateIssuePanel
          alert={createIssueAlert}
          onClose={() => setCreateIssueAlert(null)}
          onSave={() => setCreateIssueAlert(null)}
        />
      )}
      </div>
      </div>
    </DndContext>
  );
}
