import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Users, AlertTriangle, CheckCircle2, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecoveryChange {
  type: "activity" | "dependency";
  activity_id?: string;
  field?: string;
  old_value?: any;
  new_value?: any;
  predecessor_id?: string;
  successor_id?: string;
  new_type?: string;
  new_lag?: number;
}

export interface RecoveryOption {
  name: string;
  strategy: "fast_track" | "crash";
  actions: string[];
  days_recovered: number;
  estimated_cost: number;
  risk_level: "low" | "medium" | "high";
  changes: RecoveryChange[];
}

interface RecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: any[];
  dependencies: any[];
  delayInfo: {
    activityId: string;
    activityName: string;
    delayDays: number;
    totalFloat: number;
    projectDelayDays: number;
  } | null;
  onApply: (option: RecoveryOption) => Promise<void>;
}

export const RecoveryDialog = React.forwardRef<HTMLDivElement, RecoveryDialogProps>(function RecoveryDialog({
  open,
  onOpenChange,
  activities,
  dependencies,
  delayInfo,
  onApply,
}, _ref) {
  const [options, setOptions] = useState<RecoveryOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecovery = async () => {
    if (!delayInfo) return;
    setLoading(true);
    setError(null);
    setOptions(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("schedule-recovery", {
        body: {
          activities: activities.map((a) => ({
            id: a.id,
            name: a.name,
            duration: a.duration,
            start_date: a.start_date,
            end_date: a.end_date,
            total_float: a.total_float,
            is_critical: a.is_critical,
          })),
          dependencies: dependencies.map((d) => ({
            id: d.id,
            predecessor_id: d.predecessor_id,
            successor_id: d.successor_id,
            type: d.type,
            lag: d.lag,
          })),
          delayInfo,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setOptions(data.options ?? []);
    } catch (err: any) {
      console.error("Recovery fetch error:", err);
      setError(err.message || "Failed to analyze schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (option: RecoveryOption, index: number) => {
    setApplying(index);
    try {
      await onApply(option);
      onOpenChange(false);
      setOptions(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply recovery");
    } finally {
      setApplying(null);
    }
  };

  // Fetch on open
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && !options && !loading) {
      fetchRecovery();
    }
    if (!newOpen) {
      setOptions(null);
      setError(null);
    }
  };

  const riskColors: Record<string, string> = {
    low: "bg-green-500/10 text-green-700 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Schedule Recovery Assistant
          </DialogTitle>
          <DialogDescription>
            {delayInfo
              ? `Analyzing recovery options for ${delayInfo.projectDelayDays}-day project delay caused by "${delayInfo.activityName}".`
              : "AI-powered schedule optimization"}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing schedule network...</p>
            <p className="text-xs text-muted-foreground">Evaluating fast-tracking and crashing strategies</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecovery}>
              Retry Analysis
            </Button>
          </div>
        )}

        {options && options.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recovery options available for this scenario.</p>
          </div>
        )}

        {options && options.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {options.map((opt, idx) => (
              <Card key={idx} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-semibold text-sm">{opt.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {opt.strategy === "fast_track" ? (
                            <><Zap className="h-3 w-3 mr-1" />Fast-Track</>
                          ) : (
                            <><Users className="h-3 w-3 mr-1" />Crash</>
                          )}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${riskColors[opt.risk_level]}`}>
                          {opt.risk_level} risk
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {opt.actions.map((action, ai) => (
                      <p key={ai} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {action}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <Clock className="h-3 w-3" />
                      {opt.days_recovered}d recovered
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      {opt.estimated_cost === 0
                        ? "No cost"
                        : `$${opt.estimated_cost.toLocaleString()}`}
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleApply(opt, idx)}
                    disabled={applying !== null}
                  >
                    {applying === idx ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Applying...</>
                    ) : (
                      "Apply This Option"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
