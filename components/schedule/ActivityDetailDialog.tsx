import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUpdateActivity, useActivities, useDependencies, type Activity } from "@/hooks/useActivities";
import { useLookaheadTasks } from "@/hooks/useLookaheadTasks";
import { useSubmittals, type SubmittalStatus } from "@/hooks/useSubmittals";
import { Layers, MapPin, User, Package, HardHat, Calendar, Clock, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { addDays, differenceInCalendarDays, parseISO, format } from "date-fns";

interface Props {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBreakdown: (activity: Activity) => void;
  fromSubmittals?: boolean;
}

const STATUS_COLORS: Record<SubmittalStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/20 text-blue-400",
  under_review: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  approved_as_noted: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-destructive/20 text-destructive",
  resubmit: "bg-orange-500/20 text-orange-400",
};

const STATUS_LABELS: Record<SubmittalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  approved_as_noted: "Approved as Noted",
  rejected: "Rejected",
  resubmit: "Resubmit",
};

export function ActivityDetailDialog({ activity, open, onOpenChange, onBreakdown, fromSubmittals }: Props) {
  const navigate = useNavigate();
  const updateActivity = useUpdateActivity();
  const { data: tasks } = useLookaheadTasks(activity?.project_id);
  const { data: allActivities } = useActivities(activity?.project_id);
  const { data: deps } = useDependencies(activity?.project_id);
  const { data: submittals } = useSubmittals(activity?.project_id);
  const linkedTasks = tasks?.filter((t) => t.activity_id === activity?.id) ?? [];
  const siblingIds = activity?.parent_id
    ? new Set(allActivities?.filter((a) => a.parent_id === activity.parent_id).map((a) => a.id))
    : new Set<string>();
  const linkedSubmittals = submittals?.filter((s) =>
    s.linked_activity_id === activity?.id || (s.linked_activity_id && siblingIds.has(s.linked_activity_id))
  ) ?? [];

  const isFolder = allActivities?.some((a) => a.parent_id === activity?.id) ?? false;
  const hasDeps = deps?.some((d) => d.predecessor_id === activity?.id || d.successor_id === activity?.id) ?? false;

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    duration: 1,
    location: "",
    owner: "",
    package: "",
    subcontractor: "",
  });

  useEffect(() => {
    if (activity) {
      setForm({
        name: activity.name,
        start_date: activity.start_date ?? "",
        end_date: activity.end_date ?? "",
        duration: activity.duration ?? 1,
        location: activity.location ?? "",
        owner: activity.owner ?? "",
        package: activity.package ?? "",
        subcontractor: activity.subcontractor ?? "",
      });
    }
  }, [activity]);

  const handleStartDateChange = (val: string) => {
    const next = { ...form, start_date: val };
    if (val && next.duration > 0) {
      next.end_date = format(addDays(parseISO(val), next.duration), "yyyy-MM-dd");
    }
    setForm(next);
  };

  const handleDurationChange = (val: number) => {
    const dur = Math.max(1, val);
    const next = { ...form, duration: dur };
    if (form.start_date) {
      next.end_date = format(addDays(parseISO(form.start_date), dur), "yyyy-MM-dd");
    }
    setForm(next);
  };

  const handleEndDateChange = (val: string) => {
    const next = { ...form, end_date: val };
    if (val && form.start_date) {
      const diff = differenceInCalendarDays(parseISO(val), parseISO(form.start_date));
      if (diff > 0) next.duration = diff;
    }
    setForm(next);
  };

  const handleSave = async () => {
    if (!activity) return;
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        name: form.name,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        duration: form.duration,
        location: form.location || null,
        owner: form.owner || null,
        package: form.package || null,
        subcontractor: form.subcontractor || null,
      } as any);
      toast.success("Activity updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
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
          <DialogTitle className="font-heading">Activity Details</DialogTitle>
          <DialogDescription>
            {activity.start_date && `${activity.start_date} — ${activity.duration}d`}
            {activity.is_critical && <span className="ml-2 text-destructive font-medium">Critical Path</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto max-h-[60vh] pr-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          {!isFolder && (
            <>
              {hasDeps && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Changing dates will trigger a CPM recalculation.
                </div>
              )}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => handleStartDateChange(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Duration</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={1} className="w-20" value={form.duration} onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)} />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => handleEndDateChange(e.target.value)} />
              </div>
            </>
          )}

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

          {linkedSubmittals.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><FileText className="h-3 w-3" />Linked Submittals</Label>
              <div className="space-y-1.5">
                {linkedSubmittals.map((s) => {
                  const isRisk = s.status !== "approved" && s.status !== "approved_as_noted";
                  return (
                    <div key={s.id} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${isRisk ? "bg-amber-500/10 border border-amber-500/20" : "bg-secondary/50"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isRisk && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                        <span className="font-mono text-muted-foreground shrink-0">{s.spec_section || "—"}</span>
                        <span className="font-medium truncate">{s.title}</span>
                      </div>
                      <Badge className={`${STATUS_COLORS[s.status]} ml-2 shrink-0`}>{STATUS_LABELS[s.status]}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {linkedTasks.length > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
              <span className="font-medium text-foreground">{linkedTasks.length} lookahead task(s)</span> linked to this activity
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              onBreakdown(activity);
            }}
          >
            <Layers className="h-4 w-4 mr-2" />
            Plan Work ({linkedTasks.length})
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={updateActivity.isPending}>
            {updateActivity.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
