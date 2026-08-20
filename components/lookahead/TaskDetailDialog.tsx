import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useUpdateLookaheadTask, type LookaheadTask } from "@/hooks/useLookaheadTasks";
import { useResourceRoles } from "@/hooks/useResourceRoles";
import { useCrewAssignments, useCreateCrewAssignment, useDeleteCrewAssignment } from "@/hooks/useCrewAssignments";
import { MapPin, User, Package, HardHat, AlertTriangle, Users, Plus, X, Calculator, Link2, ArrowLeft } from "lucide-react";

interface Props {
  task: LookaheadTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentActivityName?: string;
  allTasks?: LookaheadTask[];
  fromSubmittals?: boolean;
}

function getEfficiencyFactor(totalHeadcount: number): number {
  if (totalHeadcount <= 5) return 1.0;
  if (totalHeadcount <= 10) return 0.95;
  if (totalHeadcount <= 20) return 0.85;
  return 0.75;
}

export function TaskDetailDialog({ task, open, onOpenChange, parentActivityName, allTasks = [], fromSubmittals }: Props) {
  const navigate = useNavigate();
  const updateTask = useUpdateLookaheadTask();
  const { data: roles } = useResourceRoles(task?.project_id);
  const { data: assignments } = useCrewAssignments(task?.id);
  const createAssignment = useCreateCrewAssignment();
  const deleteAssignment = useDeleteCrewAssignment();

  const [form, setForm] = useState({
    name: "",
    duration: "1",
    start_date: "",
    end_date: "",
    location: "",
    owner: "",
    package: "",
    subcontractor: "",
    has_roadblock: false,
    roadblock_note: "",
    quantity: "",
    quantity_unit: "",
    productivity_rate: "",
    efficiency_factor: "",
    predecessor_task_id: "",
  });

  const [addCrewRole, setAddCrewRole] = useState("");
  const [addCrewCount, setAddCrewCount] = useState("1");

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name,
        duration: String((task as any).duration ?? 1),
        start_date: (task as any).start_date ?? "",
        end_date: (task as any).end_date ?? "",
        location: (task as any).location ?? "",
        owner: (task as any).owner ?? "",
        package: (task as any).package ?? "",
        subcontractor: (task as any).subcontractor ?? "",
        has_roadblock: task.has_roadblock ?? false,
        roadblock_note: task.roadblock_note ?? "",
        quantity: (task as any).quantity != null ? String((task as any).quantity) : "",
        quantity_unit: (task as any).quantity_unit ?? "",
        productivity_rate: (task as any).productivity_rate != null ? String((task as any).productivity_rate) : "",
        efficiency_factor: (task as any).efficiency_factor != null ? String((task as any).efficiency_factor) : "",
        predecessor_task_id: (task as any).predecessor_task_id ?? "",
      });
      setAddCrewRole("");
      setAddCrewCount("1");
    }
  }, [task]);

  const totalHeadcount = useMemo(() => {
    return (assignments ?? []).reduce((sum, a) => sum + a.headcount, 0);
  }, [assignments]);

  const calculatedDuration = useMemo(() => {
    const qty = parseFloat(form.quantity);
    const rate = parseFloat(form.productivity_rate);
    if (!qty || !rate || totalHeadcount === 0) return null;
    const eff = form.efficiency_factor ? parseFloat(form.efficiency_factor) : getEfficiencyFactor(totalHeadcount);
    if (!eff) return null;
    return Math.ceil((qty / rate) / (totalHeadcount * eff));
  }, [form.quantity, form.productivity_rate, form.efficiency_factor, totalHeadcount]);

  // Predecessor options: other tasks in same project, excluding self
  const predecessorOptions = useMemo(() => {
    if (!task) return [];
    return allTasks.filter((t) => t.id !== task.id);
  }, [allTasks, task]);

  const handleSave = async () => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        name: form.name,
        duration: parseInt(form.duration) || 1,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        location: form.location || null,
        owner: form.owner || null,
        package: form.package || null,
        subcontractor: form.subcontractor || null,
        has_roadblock: form.has_roadblock,
        roadblock_note: form.has_roadblock ? form.roadblock_note : null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        quantity_unit: form.quantity_unit || null,
        productivity_rate: form.productivity_rate ? parseFloat(form.productivity_rate) : null,
        efficiency_factor: form.efficiency_factor ? parseFloat(form.efficiency_factor) : null,
        predecessor_task_id: form.predecessor_task_id || null,
      } as any);
      toast.success("Task updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddCrew = async () => {
    if (!addCrewRole || !task) return;
    try {
      await createAssignment.mutateAsync({
        task_id: task.id,
        role_id: addCrewRole,
        headcount: parseInt(addCrewCount) || 1,
      });
      setAddCrewRole("");
      setAddCrewCount("1");
      toast.success("Crew assigned");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveCrew = async (assignmentId: string) => {
    if (!task) return;
    try {
      await deleteAssignment.mutateAsync({ id: assignmentId, taskId: task.id });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const applyCalculatedDuration = () => {
    if (calculatedDuration) {
      setForm({ ...form, duration: String(calculatedDuration) });
    }
  };

  const roleMap = useMemo(() => {
    const m = new Map<string, string>();
    roles?.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [roles]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {fromSubmittals && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-1 mb-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { onOpenChange(false); navigate("/submittals"); }}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Submittals
            </Button>
          )}
          <DialogTitle className="font-heading">Task Details</DialogTitle>
          {parentActivityName && (
            <DialogDescription>
              Linked to: <span className="font-medium text-foreground">{parentActivityName}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
          </div>

          {/* Predecessor */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Link2 className="h-3 w-3" />After (predecessor)</Label>
            <Select value={form.predecessor_task_id || "none"} onValueChange={(v) => setForm({ ...form, predecessor_task_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {predecessorOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location / Owner / Package / Sub */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Level 2" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><User className="h-3 w-3" />Owner</Label>
              <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="e.g. John" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Package className="h-3 w-3" />Package</Label>
              <Input value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="e.g. Structural" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><HardHat className="h-3 w-3" />Subcontractor</Label>
              <Input value={form.subcontractor} onChange={(e) => setForm({ ...form, subcontractor: e.target.value })} placeholder="e.g. ABC Corp" />
            </div>
          </div>

          {/* Quantity / Productivity */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-semibold">
              <Calculator className="h-3.5 w-3.5" />
              Production Input
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input value={form.quantity_unit} onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })} placeholder="e.g. sq ft" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Rate / worker / day</Label>
                <Input type="number" min={0} value={form.productivity_rate} onChange={(e) => setForm({ ...form, productivity_rate: e.target.value })} placeholder="e.g. 20" />
              </div>
            </div>
          </div>

          {/* Crew Assignments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-semibold">
              <Users className="h-3.5 w-3.5" />
              Crew ({totalHeadcount} total)
            </Label>

            {assignments && assignments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {assignments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {a.headcount}× {roleMap.get(a.role_id) ?? "Unknown"}
                    <button onClick={() => handleRemoveCrew(a.id)} className="hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {roles && roles.length > 0 ? (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Select value={addCrewRole} onValueChange={setAddCrewRole}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1">
                  <Input className="h-9" type="number" min={1} value={addCrewCount} onChange={(e) => setAddCrewCount(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" onClick={handleAddCrew} disabled={!addCrewRole || createAssignment.isPending}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No roles defined. Add roles on the Workforce page first.
              </p>
            )}

            {calculatedDuration && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>
                  Calculated: <strong>{calculatedDuration}d</strong>
                  {form.efficiency_factor ? "" : ` (eff: ${getEfficiencyFactor(totalHeadcount)})`}
                </span>
                <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={applyCalculatedDuration}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Roadblock */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_roadblock}
                onChange={(e) => setForm({ ...form, has_roadblock: e.target.checked })}
                className="rounded"
              />
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-sm font-medium">Roadblock</span>
            </label>
            {form.has_roadblock && (
              <Textarea
                value={form.roadblock_note}
                onChange={(e) => setForm({ ...form, roadblock_note: e.target.value })}
                placeholder="Describe the roadblock..."
                rows={2}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>
            {updateTask.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
