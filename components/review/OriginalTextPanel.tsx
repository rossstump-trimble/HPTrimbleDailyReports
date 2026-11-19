import { Languages } from "lucide-react";
import { getIntakeLanguage } from "@/lib/intake-languages";
import type { DailyReport } from "@/types/hpproto";

export default function OriginalTextPanel({ report }: { report: DailyReport }) {
  if (!report.originalLanguage || !report.originalText) return null;

  const language = getIntakeLanguage(report.originalLanguage);
  const original = report.originalText;
  const rows: Array<[string, string]> = [
    ["Location & Work Performed", original.locationDescription],
    ["Field Notes", original.notes],
    ["Trades & Favors", original.tradesAndFavors],
    ["Tier Subcontractors", original.tierSubsSummary],
    ["Crew Trades", original.crewCrafts.filter(Boolean).join(", ")],
    ["Equipment", original.equipment.join(", ")],
  ];
  const filledRows = rows.filter(([, value]) => value.trim());
  const translationFailed = report.translationStatus === "failed";

  return (
    <details className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
      <summary className="cursor-pointer select-none px-3 py-2 flex items-center gap-2 font-semibold text-[#0063a3] dark:text-blue-400">
        <Languages className="h-3.5 w-3.5 shrink-0" />
        <span>
          {translationFailed
            ? `Submitted in ${language.name}. Automatic English translation was unavailable, so the fields above are still in the original language.`
            : `Submitted in ${language.name}. The fields above are the English translation. View original wording`}
        </span>
      </summary>
      <div className="px-3 pb-3 space-y-2" dir={language.dir} lang={language.code}>
        {filledRows.map(([label, value]) => (
          <div key={label}>
            <span dir="ltr" className="font-semibold text-foreground block">
              {label}
            </span>
            <p className="text-muted-foreground whitespace-pre-wrap">{value}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
