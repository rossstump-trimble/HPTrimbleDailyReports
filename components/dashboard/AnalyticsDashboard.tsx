"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock3, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CHART_COLORS, STATUS_META } from "@/lib/dashboard/statusMeta";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "teal" | "rose" | "amber" | "sky";
}) {
  const tones = {
    teal: "border-teal-200 bg-teal-50/70 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200",
    rose: "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    amber: "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    sky: "border-sky-200 bg-sky-50/70 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  };
  return (
    <Card className={cn("border shadow-sm", tones[tone])}>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-white/70 dark:bg-black/20 p-1.5">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</div>
          <div className="text-2xl font-semibold tabular-nums leading-tight">{value}</div>
          {hint ? <div className="text-[11px] opacity-80 mt-0.5">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function formatShort(iso: string): string {
  const [, , d] = iso.split("-");
  return String(Number(d));
}

export function AnalyticsDashboard({ data }: { data: DashboardPayload }) {
  const pieData = data.analytics.statusMix.filter((s) => s.status !== "na");
  const trend = data.analytics.dailyTrend.filter((d) => d.date <= data.asOfDate);
  const { kpis } = data;
  const [compliancePage, setCompliancePage] = React.useState(1);
  const [jtdPage, setJtdPage] = React.useState(1);
  const ANALYTICS_PAGE_SIZE = 20;

  const totalCompliancePages = Math.max(1, Math.ceil(data.analytics.tradeCompliance.length / ANALYTICS_PAGE_SIZE));
  const pagedCompliance = data.analytics.tradeCompliance.slice(
    (compliancePage - 1) * ANALYTICS_PAGE_SIZE,
    compliancePage * ANALYTICS_PAGE_SIZE,
  );

  const totalJtdPages = Math.max(1, Math.ceil(data.analytics.jobToDate.rows.length / ANALYTICS_PAGE_SIZE));
  const pagedJtdRows = data.analytics.jobToDate.rows.slice(
    (jtdPage - 1) * ANALYTICS_PAGE_SIZE,
    jtdPage * ANALYTICS_PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi
          label="Logged compliance"
          value={`${kpis.monthCompliancePct}%`}
          hint={`${kpis.loggedDaysThisMonth} of ${kpis.onsiteDaysThisMonth} on-site days`}
          icon={ShieldCheck}
          tone="teal"
        />
        <Kpi
          label="Missing today"
          value={kpis.missingToday}
          hint={`${kpis.tradesOnsiteToday} trades on site`}
          icon={AlertTriangle}
          tone="rose"
        />
        <Kpi
          label="HP backlog today"
          value={kpis.hpBacklogToday}
          hint={`${data.delinquency.hpBacklog.length} received, not logged this month`}
          icon={Clock3}
          tone="amber"
        />
        <Kpi
          label="Hours MTD"
          value={kpis.monthHours.toLocaleString()}
          hint={`${kpis.monthManpower.toLocaleString()} manpower`}
          icon={Users}
          tone="sky"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Needs attention today</CardTitle>
            <CardDescription>Trade miss vs HP logging delay — {data.asOfDate}</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-rose-600 mb-2">Missing dailies</div>
              {data.delinquency.missingToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">All on-site trades turned in a daily.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.delinquency.missingToday.map((item) => (
                    <li key={item.tradeId} className="flex items-center justify-between rounded-md bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-sm">
                      <span className="font-medium">{item.tradeName}</span>
                      <span className="text-[11px] text-muted-foreground">{item.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">Received, not logged</div>
              {data.delinquency.hpBacklog.filter((i) => i.date === data.asOfDate).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing sitting with HP today.</p>
              ) : (
                <ul className="space-y-1.5">
                  {data.delinquency.hpBacklog
                    .filter((i) => i.date === data.asOfDate)
                    .map((item) => (
                      <li key={item.tradeId} className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-sm">
                        <span className="font-medium">{item.tradeName}</span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {item.manpower} / {item.hours}h
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status mix this month</CardTitle>
            <CardDescription>On-site days only — N/A hidden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="count" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {pieData.map((s) => (
                <span key={s.status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_CHART_COLORS[s.status] }} />
                  {STATUS_META[s.status].short} · {s.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Missing dailies by day</CardTitle>
            <CardDescription>Where the month ran hottest</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatShort} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={(v) => String(v)} />
                <Line type="monotone" dataKey="missing" stroke={STATUS_CHART_COLORS.missing} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" stroke={STATUS_CHART_COLORS.received} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekday pattern</CardTitle>
            <CardDescription>% of on-site trades missing a daily</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.analytics.weekdayPattern} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="weekday" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="missingRate" fill={STATUS_CHART_COLORS.missing} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top days with missing data</CardTitle>
            <CardDescription>Highest miss counts so far this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.analytics.topMissingDays.map((day) => (
                <li key={day.date} className="py-2.5 first:pt-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">
                      {day.weekday} {day.dayNumber}
                    </span>
                    <span className="text-xs tabular-nums text-rose-600 font-semibold">
                      {day.missingCount} missing
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {day.trades.length ? day.trades.join(" · ") : "None"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trade compliance</CardTitle>
            <CardDescription>Lowest logged rate first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pagedCompliance.map((t) => (
              <div key={t.tradeId}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium truncate pr-2">{t.tradeName}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t.compliancePct}% · {t.missingDays} miss · {t.receivedUnloggedDays} HP
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(100, t.compliancePct)}%` }}
                  />
                </div>
              </div>
            ))}
            {totalCompliancePages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/60">
                <span>
                  Page {compliancePage} of {totalCompliancePages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={compliancePage <= 1}
                    onClick={() => setCompliancePage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={compliancePage >= totalCompliancePages}
                    onClick={() => setCompliancePage((p) => Math.min(totalCompliancePages, p + 1))}
                    className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job-to-date hours</CardTitle>
          <CardDescription>Cumulative manpower and hours by month</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto space-y-3">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">Trade</th>
                {data.analytics.jobToDate.months.map((m) => (
                  <th key={m.month} className="text-right py-2 px-2 font-medium whitespace-nowrap">
                    {m.label}
                  </th>
                ))}
                <th className="text-right py-2 pl-3 font-semibold text-foreground">To date</th>
              </tr>
            </thead>
            <tbody>
              {pagedJtdRows.map((row) => (
                <tr key={row.tradeId} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{row.tradeName}</td>
                  {row.byMonth.map((cell) => (
                    <td key={cell.month} className="text-right py-2 px-2 tabular-nums text-muted-foreground">
                      {cell.hours.toLocaleString()}
                    </td>
                  ))}
                  <td className="text-right py-2 pl-3 tabular-nums font-semibold">
                    {row.totalHours.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalJtdPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/60">
              <span>
                Page {jtdPage} of {totalJtdPages} ({data.analytics.jobToDate.rows.length} trades)
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={jtdPage <= 1}
                  onClick={() => setJtdPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={jtdPage >= totalJtdPages}
                  onClick={() => setJtdPage((p) => Math.min(totalJtdPages, p + 1))}
                  className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
