import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Calendar,
  Camera,
  User,
  ChevronRight,
  MapPin,
  ArrowUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Issue types
const ISSUE_TYPES = [
  {
    id: "critical",
    label: "Critical Issue",
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
  {
    id: "safety",
    label: "Safety Risk",
    icon: AlertTriangle,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  {
    id: "delay",
    label: "Schedule Delay",
    icon: Clock,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    id: "inspection",
    label: "Inspection Required",
    icon: Check,
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    id: "general",
    label: "General Note",
    icon: Info,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
];

// Priority levels
const PRIORITY_LEVELS = [
  { id: "critical", label: "Critical", color: "text-red-600" },
  { id: "high", label: "High", color: "text-orange-600" },
  { id: "medium", label: "Medium", color: "text-yellow-600" },
  { id: "low", label: "Low", color: "text-green-600" },
];

// Dialog props
interface ConstructionIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { x: number; y: number }; // Optional position info for the pin
  viewportIndex: number;
}

export function ConstructionIssueDialog({
  open,
  onOpenChange,
  position,
  viewportIndex,
}: ConstructionIssueDialogProps) {
  // State for form fields
  const [issueType, setIssueType] = useState<string>("general");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("details");

  // Dummy function to simulate creating an issue
  const handleCreateIssue = () => {
    console.log("Creating issue:", {
      issueType,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      position,
      viewportIndex,
    });

    // Reset form fields
    setIssueType("general");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo("");
    setDueDate("");

    // Close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-h-[90vh] max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Create Construction Issue
          </DialogTitle>
          <DialogDescription>
            Report issues or observations from the construction site for team
            action.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details" className="text-sm">
              Issue Details
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-sm">
              Attachments
            </TabsTrigger>
            <TabsTrigger value="location" className="text-sm">
              Location Info
            </TabsTrigger>
          </TabsList>

          <ScrollArea
            className="flex-1 overflow-y-auto pr-2"
            style={{ maxHeight: "calc(min(60vh, 500px))" }}
          >
            <div className="p-1">
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="issue-type">Issue Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ISSUE_TYPES.map((type) => (
                      <Button
                        key={type.id}
                        type="button"
                        variant={issueType === type.id ? "default" : "outline"}
                        className={`justify-start h-auto p-3 ${
                          issueType === type.id ? "" : type.color
                        }`}
                        onClick={() => setIssueType(type.id)}
                      >
                        <div className="flex items-center gap-2">
                          <type.icon className="h-5 w-5" />
                          <span>{type.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a concise title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail"
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map((level) => (
                          <SelectItem
                            key={level.id}
                            value={level.id}
                            className={level.color}
                          >
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned">Assigned To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger id="assigned">
                        <SelectValue placeholder="Assign to team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john.doe">
                          John Doe (Site Manager)
                        </SelectItem>
                        <SelectItem value="jane.smith">
                          Jane Smith (Engineer)
                        </SelectItem>
                        <SelectItem value="bob.builder">
                          Bob Builder (Contractor)
                        </SelectItem>
                        <SelectItem value="sarah.architect">
                          Sarah Johnson (Architect)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-0">
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-sm font-medium mb-1">Add Photos</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Drag and drop or click to upload photos of the issue
                    </p>
                    <Button variant="outline" size="sm">
                      Upload Images
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Placeholder for uploaded images */}
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Preview 1
                      </span>
                    </div>
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Preview 2
                      </span>
                    </div>
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Preview 3
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="mt-0">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pin Location Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Viewport:</span>
                        <span className="font-medium">
                          Viewport {viewportIndex + 1}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">
                          Coordinates:
                        </span>
                        <span className="font-medium">
                          {position
                            ? `X: ${position.x.toFixed(
                                2
                              )}, Y: ${position.y.toFixed(2)}`
                            : "Not specified"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Element:</span>
                        <span className="font-medium">
                          Exterior Wall Section
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">
                          Floor Level:
                        </span>
                        <span className="font-medium">Level 3</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-details">
                      Additional Location Details
                    </Label>
                    <Textarea
                      id="location-details"
                      placeholder="Add specific directions or details about the location"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4 pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateIssue}
            className="gap-1"
            disabled={!title}
          >
            <ArrowUp className="h-4 w-4" />
            Submit Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConstructionIssueDialog;
