import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commitments: any[];
  taskNames: Map<string, string>;
}

export function WeeklyReviewDialog({ open, onOpenChange, commitments, taskNames }: Props) {
  const completed = commitments.filter((c) => c.completed).length;
  const total = commitments.length;
  const ppc = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Weekly Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-3xl font-bold">{ppc}%</span>
            <p className="text-sm text-muted-foreground">
              PPC — {completed}/{total} tasks completed
            </p>
          </div>
          <div className="space-y-1">
            {commitments.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{taskNames.get(c.task_id) ?? "Unknown"}</span>
                <span className={c.completed ? "text-green-600" : "text-muted-foreground"}>
                  {c.completed ? "Done" : "Incomplete"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
