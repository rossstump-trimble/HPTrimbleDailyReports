"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  MessageCircle, 
  MoreHorizontal, 
  Grid3X3, 
  List, 
  Eye,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  LayoutGrid,
  FileText,
  Printer,
  AlertCircle,
  Plus,
  Menu,
  Info,
  FilePlus
} from "lucide-react";

// Type definition for RFI data
interface RFI {
  id: number;
  number: string;
  description: string;
  importance: string;
  dueDate: string;
  openAssignments: string;
  status: string;
  assignee: string | string[] | null;
}

// Panel types for the right sidebar
type SidePanelType = 'search' | 'info' | 'add';

// Mock RFI data based on the screenshot
const mockRFIs: RFI[] = [
  {
    id: 1,
    number: "- Test RFI",
    description: "Sample Question",
    importance: "Normal",
    dueDate: "2024-12-15",
    openAssignments: "No open assignments",
    status: "Open",
    assignee: null
  },
  {
    id: 2,
    number: "001 - 100 Links",
    description: "Here is the question...",
    importance: "High",
    dueDate: "2024-12-18",
    openAssignments: "(1/1)",
    status: "Open",
    assignee: ["Jesse Lavine", "Mike Davis"]
  },
  {
    id: 3,
    number: "002 - Electrical Panel",
    description: "Clarification needed for electrical panel specifications",
    importance: "Normal",
    dueDate: "2024-12-20",
    openAssignments: "(0/1)",
    status: "Open",
    assignee: null
  },
  {
    id: 4,
    number: "003 - Structural Beam",
    description: "Request for structural beam connection details",
    importance: "Low",
    dueDate: "2024-12-22",
    openAssignments: "(1/1)",
    status: "Draft",
    assignee: "Sarah Johnson"
  },
  {
    id: 5,
    number: "004 - HVAC Ductwork",
    description: "HVAC ductwork routing through structural members",
    importance: "High",
    dueDate: "2024-12-25",
    openAssignments: "(0/1)",
    status: "Closed",
    assignee: null
  },
  {
    id: 6,
    number: "005 - Fire Protection",
    description: "Fire protection system integration with MEP",
    importance: "Normal",
    dueDate: "2024-12-28",
    openAssignments: "(1/1)",
    status: "Open",
    assignee: "Mike Davis"
  },
  {
    id: 7,
    number: "006 - Plumbing Fixtures",
    description: "Plumbing fixture specifications and installation",
    importance: "High",
    dueDate: "2024-12-30",
    openAssignments: "(1/1)",
    status: "Open",
    assignee: "Jesse Lavine"
  },
  {
    id: 8,
    number: "007 - Roofing Details",
    description: "Roofing material specifications and installation",
    importance: "Normal",
    dueDate: "2025-01-02",
    openAssignments: "(0/1)",
    status: "Open",
    assignee: "Sarah Johnson"
  },
  {
    id: 9,
    number: "008 - Interior Finishes",
    description: "Interior finish material selections",
    importance: "Low",
    dueDate: "2025-01-05",
    openAssignments: "(1/1)",
    status: "Draft",
    assignee: "Mike Davis"
  },
  {
    id: 10,
    number: "009 - Site Grading",
    description: "Site grading and drainage requirements",
    importance: "High",
    dueDate: "2025-01-08",
    openAssignments: "(1/1)",
    status: "Open",
    assignee: "Jesse Lavine"
  }
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-500';
    case 'closed':
      return 'bg-green-500';
    case 'draft':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const getImportanceColor = (importance: string) => {
  switch (importance.toLowerCase()) {
    case 'high':
      return 'text-red-600';
    case 'low':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export default function RFIsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedView, setSelectedView] = useState('My Custom View');
  const [selectedGroup, setSelectedGroup] = useState('None');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPanel, setSelectedPanel] = useState<SidePanelType>('search');
  const [filters, setFilters] = useState({
    assignedToMe: false,
    assignedToMyCompany: false,
    draft: false,
    open: false,
    closed: false,
    location: '',
    dueDateFrom: '',
    dueDateTo: '',
    linkedSpecifications: '',
    assignedToContact: '',
    assignedToCompany: '',
    ccedToContact: '',
    ccedToCompany: '',
    author: '',
    authorCompany: '',
    responsibleCompany: '',
    discipline: ''
  });

  const handleFilterChange = (key: string, value: boolean | string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Update selectedGroup when view changes to Ball-in-court
  React.useEffect(() => {
    if (selectedView === 'Ball-in-court') {
      setSelectedGroup('Assignee');
    }
  }, [selectedView]);

  const resetSearch = () => {
    setSearchQuery('');
    setFilters({
      assignedToMe: false,
      assignedToMyCompany: false,
      draft: false,
      open: false,
      closed: false,
      location: '',
      dueDateFrom: '',
      dueDateTo: '',
      linkedSpecifications: '',
      assignedToContact: '',
      assignedToCompany: '',
      ccedToContact: '',
      ccedToCompany: '',
      author: '',
      authorCompany: '',
      responsibleCompany: '',
      discipline: ''
    });
  };

  // Group RFIs by assignee for Ball-in-court view
  const getGroupedRFIs = () => {
    if (selectedView === 'Ball-in-court') {
      const grouped = mockRFIs.reduce((acc, rfi) => {
        if (rfi.assignee) {
          if (Array.isArray(rfi.assignee)) {
            // Handle multiple assignees - add RFI to each assignee's group
            rfi.assignee.forEach(assignee => {
              if (!acc[assignee]) {
                acc[assignee] = [];
              }
              acc[assignee].push(rfi);
            });
          } else {
            // Handle single assignee
            if (!acc[rfi.assignee]) {
              acc[rfi.assignee] = [];
            }
            acc[rfi.assignee].push(rfi);
          }
        } else {
          // Handle unassigned RFIs
          if (!acc['Unassigned']) {
            acc['Unassigned'] = [];
          }
          acc['Unassigned'].push(rfi);
        }
        return acc;
      }, {} as Record<string, RFI[]>);
      
      // Sort groups by assignee name
      return Object.keys(grouped).sort().reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, RFI[]>);
    }
    return null;
  };

  const groupedRFIs = getGroupedRFIs();

  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
                 {/* Main Application Toolbar - Full Width */}
         <div className="flex justify-end items-center gap-2 p-2 border-b bg-background">
           {/* Right side - Action buttons */}
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <LayoutGrid className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <FileText className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <Printer className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <AlertCircle className="h-4 w-4" />
             </Button>
           </div>
         </div>

        {/* Record Toolbar - Full Width */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">Viewing {mockRFIs.length} RFIs</h1>
              
              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-48">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="My Custom View">My Custom View</SelectItem>
                  <SelectItem value="All RFIs">All RFIs</SelectItem>
                  <SelectItem value="My RFIs">My RFIs</SelectItem>
                  <SelectItem value="Ball-in-court">Ball-in-court</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">Group</SelectItem>
                  <SelectItem value="Status">Status</SelectItem>
                  <SelectItem value="Assignee">Assignee</SelectItem>
                  <SelectItem value="Due Date">Due Date</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Data View */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === 'grid' ? (
            selectedView === 'Ball-in-court' && groupedRFIs ? (
              // Ball-in-court view: Grouped by assignee in grid
              <div className="space-y-6">
                {Object.entries(groupedRFIs).map(([assignee, rfiList]) => (
                  <div key={assignee} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-medium text-muted-foreground">{assignee}</h3>
                      <Badge variant="secondary">
                        {rfiList.length} RFI{rfiList.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {rfiList.map((rfi) => (
                         <Card key={`${rfi.id}-${assignee}`} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
                           <CardContent className="p-4">
                             <div className="flex items-start justify-between mb-3">
                                                               <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="font-medium text-sm">{rfi.number}</span>
                                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                               <Button variant="ghost" size="icon" className="h-6 w-6">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </div>

                            {rfi.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {rfi.description}
                              </p>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Importance</span>
                                <Badge variant="outline" className={getImportanceColor(rfi.importance)}>
                                  {rfi.importance}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Due date</span>
                                <span className="text-sm font-medium">{rfi.dueDate}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Open assignments</span>
                                <span className="text-sm">{rfi.openAssignments}</span>
                              </div>

                              {rfi.assignee && (
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {Array.isArray(rfi.assignee) 
                                      ? rfi.assignee.join(', ') 
                                      : rfi.assignee}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Status indicator */}
                            <div className="mt-3 flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(rfi.status)}`} />
                              <span className="text-xs text-muted-foreground capitalize">{rfi.status}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Regular grid view
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockRFIs.map((rfi) => (
                  <Card key={rfi.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="font-medium text-sm">{rfi.number}</span>
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {rfi.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {rfi.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Importance</span>
                          <Badge variant="outline" className={getImportanceColor(rfi.importance)}>
                            {rfi.importance}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Due date</span>
                          <span className="text-sm font-medium">{rfi.dueDate}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Open assignments</span>
                          <span className="text-sm">{rfi.openAssignments}</span>
                        </div>

                        {rfi.assignee && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {Array.isArray(rfi.assignee) 
                                ? rfi.assignee.join(', ') 
                                : rfi.assignee}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="mt-3 flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(rfi.status)}`} />
                        <span className="text-xs text-muted-foreground capitalize">{rfi.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2">
              {selectedView === 'Ball-in-court' && groupedRFIs ? (
                // Ball-in-court view: Grouped by assignee
                Object.entries(groupedRFIs).map(([assignee, rfiList]) => (
                  <div key={assignee} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-muted-foreground">{assignee}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {rfiList.length} RFI{rfiList.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                                         {rfiList.map((rfi) => (
                       <Card key={`${rfi.id}-${assignee}`} className="border-l-4 border-l-yellow-400 ml-4">
                         <CardContent className="p-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-4">
                               <input type="checkbox" className="rounded" />
                               <div className="flex items-center space-x-2">
                                 <span className="font-medium">{rfi.number}</span>
                                 <MessageCircle className="h-4 w-4 text-muted-foreground" />
                               </div>
                               <span className="text-muted-foreground">{rfi.description}</span>
                             </div>
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline" className={getImportanceColor(rfi.importance)}>
                                {rfi.importance}
                              </Badge>
                              <span className="text-sm">{rfi.dueDate}</span>
                              <span className="text-sm">{rfi.openAssignments}</span>
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(rfi.status)}`} />
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))
              ) : (
                // Regular list view
                mockRFIs.map((rfi) => (
                  <Card key={rfi.id} className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input type="checkbox" className="rounded" />
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{rfi.number}</span>
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-muted-foreground">{rfi.description}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className={getImportanceColor(rfi.importance)}>
                            {rfi.importance}
                          </Badge>
                          <span className="text-sm">{rfi.dueDate}</span>
                          <span className="text-sm">{rfi.openAssignments}</span>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(rfi.status)}`} />
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar with Selectable Panels */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
                 {/* Right Sidebar Toolbar */}
         <div className="flex justify-end items-center p-2 border-b bg-background">
           <div className="flex items-center gap-1">
             <Button
               variant={selectedPanel === 'search' ? 'default' : 'ghost'}
               size="icon"
               onClick={() => setSelectedPanel('search')}
               className="h-8 w-8"
               title="Search"
             >
               <Search className="h-4 w-4" />
             </Button>
             <Button
               variant={selectedPanel === 'info' ? 'default' : 'ghost'}
               size="icon"
               onClick={() => setSelectedPanel('info')}
               className="h-8 w-8"
               title="Info"
             >
               <Info className="h-4 w-4" />
             </Button>
             <Button
               variant={selectedPanel === 'add' ? 'default' : 'ghost'}
               onClick={() => setSelectedPanel('add')}
               className="h-8 px-3"
               title="Add"
             >
               <Plus className="h-4 w-4 mr-2" />
               Add
             </Button>
           </div>
         </div>

        {/* Panel Content */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {selectedPanel === 'search' && (
            <>
              {/* Search Bar */}
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

              {/* Assignments Filter */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Assignments</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned to me</span>
                    <Switch
                      checked={filters.assignedToMe}
                      onCheckedChange={(checked) => handleFilterChange('assignedToMe', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned to my company</span>
                    <Switch
                      checked={filters.assignedToMyCompany}
                      onCheckedChange={(checked) => handleFilterChange('assignedToMyCompany', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span className="text-sm">Draft</span>
                    </div>
                    <Switch
                      checked={filters.draft}
                      onCheckedChange={(checked) => handleFilterChange('draft', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Open</span>
                    </div>
                    <Switch
                      checked={filters.open}
                      onCheckedChange={(checked) => handleFilterChange('open', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Closed</span>
                    </div>
                    <Switch
                      checked={filters.closed}
                      onCheckedChange={(checked) => handleFilterChange('closed', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Location</h3>
                <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basement">Basement</SelectItem>
                    <SelectItem value="ground-floor">Ground Floor</SelectItem>
                    <SelectItem value="first-floor">First Floor</SelectItem>
                    <SelectItem value="second-floor">Second Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Filter */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Due date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dueDateFrom}
                    onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <input
                    type="date"
                    value={filters.dueDateTo}
                    onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              {/* Linked Specifications Filter */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Linked Specifications</h3>
                <Select value={filters.linkedSpecifications} onValueChange={(value) => handleFilterChange('linkedSpecifications', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned to Contact */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Assigned to Contact</h3>
                <Select value={filters.assignedToContact} onValueChange={(value) => handleFilterChange('assignedToContact', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="mike-davis">Mike Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Author */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Author</h3>
                <Select value={filters.author} onValueChange={(value) => handleFilterChange('author', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-smith">John Smith</SelectItem>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="mike-davis">Mike Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discipline */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Discipline</h3>
                <Select value={filters.discipline} onValueChange={(value) => handleFilterChange('discipline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <Button 
                variant="outline" 
                onClick={resetSearch}
                className="w-full"
              >
                Reset search
              </Button>
            </>
          )}

          {selectedPanel === 'info' && (
            <div className="text-center text-muted-foreground py-8">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an RFI to view its information</p>
            </div>
          )}

          {selectedPanel === 'add' && (
            <div className="text-center text-muted-foreground py-8">
              <FilePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add new RFI functionality coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
