import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateLookaheadTask, useLookaheadTasks } from "@/hooks/useLookaheadTasks";
import { addDays, parseISO, format } from "date-fns";
import type { Activity } from "@/hooks/useActivities";

interface Props {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DraftTask {
  name: string;
  duration: string;
  start_date: string;
  end_date: string;
  owner: string;
  subcontractor: string;
  location: string;
  package: string;
}

function buildDefaultDraft(activity: Activity | null): DraftTask {
  return {
    name: "",
    duration: "1",
    start_date: activity?.start_date ?? "",
    end_date: activity?.end_date ?? "",
    owner: (activity as any)?.owner ?? "",
    subcontractor: (activity as any)?.subcontractor ?? "",
    location: (activity as any)?.location ?? "",
    package: (activity as any)?.package ?? "",
  };
}

export function BreakdownDialog({ activity, open, onOpenChange }: Props) {
  const createTask = useCreateLookaheadTask();
  const { data: existingTasks } = useLookaheadTasks(activity?.project_id);
  const linkedTasks = existingTasks?.filter((t) => t.activity_id === activity?.id) ?? [];

  const [drafts, setDrafts] = useState<DraftTask[]>([buildDefaultDraft(activity)]);
  const [creating, setCreating] = useState(false);

  // Reset drafts when activity changes
  const [prevActivityId, setPrevActivityId] = useState<string | null>(null);
  if ((activity?.id ?? null) !== prevActivityId) {
    setPrevActivityId(activity?.id ?? null);
    setDrafts([buildDefaultDraft(activity)]);
  }

  const addRow = () => setDrafts([...drafts, buildDefaultDraft(activity)]);
  const removeRow = (i: number) => setDrafts(drafts.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof DraftTask, val: string) => {
    const next = [...drafts];
    next[i] = { ...next[i], [field]: val };
    setDrafts(next);
  };

  const handleCreate = async () => {
    if (!activity) return;
    const valid = drafts.filter((d) => d.name.trim());
    if (!valid.length) { toast.error("Add at least one task"); return; }

    setCreating(true);
    try {
      for (const d of valid) {
        await createTask.mutateAsync({
          project_id: activity.project_id,
          activity_id: activity.id,
          name: d.name.trim(),
          duration: parseInt(d.duration) || 1,
          start_date: d.start_date || null,
          end_date: d.end_date || null,
          location: d.location || null,
          owner: d.owner || null,
          package: d.package || null,
          subcontractor: d.subcontractor || null,
        } as any);
      }
      toast.success(`Created ${valid.length} task(s)`);
      setDrafts([buildDefaultDraft(activity)]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Plan Work — {activity.name}</DialogTitle>
          <DialogDescription>
            Break down this activity into granular lookahead tasks.
            {linkedTasks.length > 0 && ` (${linkedTasks.length} existing)`}
            {activity.start_date && activity.end_date && (
              <span className="ml-1 text-xs">
                · Activity: {activity.start_date} → {activity.end_date}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {linkedTasks.length > 0 && (
          <div className="space-y-1 mb-2">
            <Label className="text-xs text-muted-foreground">Existing Tasks</Label>
            {linkedTasks.map((t) => (
              <div key={t.id} className="text-sm px-2 py-1 bg-secondary/50 rounded flex items-center justify-between">
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{t.status?.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">New Tasks</Label>
          {drafts.map((d, i) => (
            <div key={i} className="space-y-2 p-2 rounded-lg border border-border">
              <div className="flex gap-2 items-center">
                <Input
                  value={d.name}
                  onChange={(e) => updateRow(i, "name", e.target.value)}
                  placeholder="Task name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={d.duration}
                  onChange={(e) => updateRow(i, "duration", e.target.value)}
                  className="w-16"
                  placeholder="Days"
                />
                {drafts.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(i)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={d.start_date}
                  onChange={(e) => updateRow(i, "start_date", e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={d.end_date}
                  onChange={(e) => updateRow(i, "end_date", e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={d.owner}
                  onChange={(e) => updateRow(i, "owner", e.target.value)}
                  placeholder="Owner"
                  className="text-xs"
                />
                <Input
                  value={d.subcontractor}
                  onChange={(e) => updateRow(i, "subcontractor", e.target.value)}
                  placeholder="Subcontractor"
                  className="text-xs"
                />
                <Input
                  value={d.location}
                  onChange={(e) => updateRow(i, "location", e.target.value)}
                  placeholder="Location"
                  className="text-xs"
                />
                <Input
                  value={d.package}
                  onChange={(e) => updateRow(i, "package", e.target.value)}
                  placeholder="Package"
                  className="text-xs"
                />
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addRow} className="text-xs">
            <Plus className="h-3 w-3 mr-1" />Add another
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
