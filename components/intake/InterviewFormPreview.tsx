import { CheckCircle2, Circle } from "lucide-react";
import { interviewFieldPreview } from "@/lib/fog617-interview";
import type { ExtractedDaily } from "@/lib/extract-response";

export default function InterviewFormPreview({
  draft,
  audience,
}: {
  draft: ExtractedDaily;
  audience?: "trade" | "hp";
}) {
  const rows = interviewFieldPreview(draft, audience);
  const filled = rows.filter((row) => row.complete).length;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Form preview
        </h3>
        <span className="text-xs text-gray-400">
          {filled} of {rows.length} filled
        </span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-2 px-4 py-2">
            {row.complete ? (
              <CheckCircle2 size={14} className="mt-0.5 flex-none text-green-600 dark:text-green-400" />
            ) : (
              <Circle
                size={14}
                className={`mt-0.5 flex-none ${
                  row.required ? "text-amber-500" : "text-gray-300 dark:text-gray-600"
                }`}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {row.label}
                {row.required && !row.complete ? (
                  <span className="ml-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Needed
                  </span>
                ) : null}
              </p>
              <p
                className={`text-sm leading-snug ${
                  row.complete
                    ? "text-gray-800 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 italic"
                }`}
              >
                {row.value || (row.required ? "Not captured yet" : "Optional")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
