import { findTradeByName, findTradesInText, TRADE_ROSTER } from "./trades";
import type { AskResult, DashboardPayload, DashboardRow } from "./types";

function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function lastLoggedDate(row: DashboardRow): string | null {
  const logged = [...row.cells].reverse().find((c) => c.status === "logged" || c.status === "received");
  return logged?.date ?? null;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function tradeStatusLine(row: DashboardRow, asOfDate: string): string {
  const today = row.cells.find((c) => c.date === asOfDate);
  if (!today) return `${row.trade.name}: no cell for ${asOfDate}.`;
  if (today.isFuture) return `${row.trade.name}: ${formatDate(asOfDate)} is in the future.`;
  if (!today.onsite || today.status === "na") {
    return `${row.trade.name} was not on site on ${formatDate(asOfDate)}.`;
  }
  if (today.status === "missing") {
    return `${row.trade.name} was on site ${formatDate(asOfDate)} but has not turned in a daily report.`;
  }
  if (today.status === "received") {
    return `${row.trade.name} turned in a daily for ${formatDate(asOfDate)} (${today.manpower} / ${today.hours}h) — HP has not logged it in Project Sight yet.`;
  }
  return `${row.trade.name} is logged in Project Sight for ${formatDate(asOfDate)}: ${today.manpower} people / ${today.hours}h.`;
}

function helpResult(): AskResult {
  return {
    answer:
      "Ask about today's delinquencies, whether a trade is on site, last check-in, HP logging backlog, hours, or which days had the most missing dailies.",
    bullets: [
      "Who didn't turn in a daily today?",
      "Is Berg Electric on site today?",
      "When did CB Floors last check in?",
      "Which reports are waiting on HP to log?",
      "Which days this month had the most missing reports?",
    ],
    suggestedFollowUps: [
      "Who is missing a daily today?",
      "Show HP logging backlog",
      "Worst compliance this month",
    ],
  };
}

export function answerDashboardQuestion(question: string, data: DashboardPayload): AskResult {
  const q = question.trim();
  if (!q) return helpResult();

  const trades = data.rows.map((r) => r.trade);

  if (trades.length === 0) {
    return {
      answer: "No trade partner companies are on this dashboard yet. Add trade partners or load them from ProjectSight on the Bowling sheet to track daily reports.",
      bullets: [],
      suggestedFollowUps: [],
    };
  }

  const lower = q.toLowerCase();
  const named = findTradesInText(lower, trades);
  const namedExact = findTradeByName(lower.replace(/[?!.]/g, " "), trades);

  const rowFor = (id: string) => data.rows.find((r) => r.trade.id === id);

  if (/\b(help|what can you|how do i|examples)\b/.test(lower)) {
    return helpResult();
  }

  if (/\b(which days|top days|days with the most)\b/.test(lower) || /\bdays?\b.*\bmissing\b/.test(lower)) {
    const top = data.analytics.topMissingDays.filter((d) => d.missingCount > 0).slice(0, 5);
    if (top.length === 0) {
      return {
        answer: `No missing dailies in ${monthTitle(data.month)} so far.`,
        bullets: [],
        suggestedFollowUps: ["Month compliance"],
      };
    }
    return {
      answer: `Days with the most missing dailies in ${monthTitle(data.month)}:`,
      bullets: top.map(
        (d) =>
          `${formatDate(d.date)} (${d.weekday}): ${d.missingCount} missing — ${d.trades.join(", ")}`,
      ),
      suggestedFollowUps: ["Who is missing a daily today?", "Monday pattern"],
    };
  }

  if (/\b(missing|delinquent|didn't turn|did not turn|no daily|not turned|who.*(late|behind))\b/.test(lower)
    && !/\b(hp|hensel|logged|log)\b/.test(lower)
    && named.length === 0) {
    const items = data.delinquency.missingToday;
    if (items.length === 0) {
      return {
        answer: `No trade partners are missing a daily for ${formatDate(data.asOfDate)}. Everyone on site has turned one in.`,
        bullets: [],
        suggestedFollowUps: ["Which reports are waiting on HP to log?", "Month compliance"],
      };
    }
    return {
      answer: `${items.length} trade${items.length === 1 ? "" : "s"} on site ${formatDate(data.asOfDate)} ${items.length === 1 ? "has" : "have"} not turned in a daily report.`,
      bullets: items.map((i) => `${i.tradeName} (${i.category})`),
      suggestedFollowUps: [
        `Is ${items[0].tradeName} on site today?`,
        "Which reports are waiting on HP to log?",
      ],
    };
  }

  if (/\b(hp|hensel|not logged|waiting to log|backlog|received but)\b/.test(lower) && named.length === 0) {
    const todayBacklog = data.delinquency.hpBacklog.filter((i) => i.date === data.asOfDate);
    const monthBacklog = data.delinquency.hpBacklog;
    const bullets = [
      ...todayBacklog.map((i) => `Today — ${i.tradeName}: ${i.manpower ?? "—"} / ${i.hours ?? "—"}h`),
      ...monthBacklog
        .filter((i) => i.date !== data.asOfDate)
        .slice(0, 6)
        .map((i) => `${formatDate(i.date)} — ${i.tradeName}: ${i.manpower ?? "—"} / ${i.hours ?? "—"}h`),
    ];
    return {
      answer: `HP logging backlog: ${todayBacklog.length} received today and not logged, ${monthBacklog.length} across ${monthTitle(data.month)}. This is an HP delay, not a trade-partner miss.`,
      bullets: bullets.slice(0, 8),
      suggestedFollowUps: ["Who is missing a daily today?", "Month compliance"],
    };
  }

  if (/\b(hours|manpower|headcount|how many people|total hours)\b/.test(lower) && named.length === 0) {
    return {
      answer: `${monthTitle(data.month)} totals: ${data.kpis.monthManpower.toLocaleString()} manpower and ${data.kpis.monthHours.toLocaleString()} hours across ${data.rows.length} trades. Compliance (logged / on-site days) is ${data.kpis.monthCompliancePct}%.`,
      bullets: data.analytics.tradeCompliance
        .slice()
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5)
        .map((t) => `${t.tradeName}: ${t.manpower} people · ${t.hours}h`),
      suggestedFollowUps: ["Worst compliance this month", "Who is missing a daily today?"],
    };
  }

  if (/\b(worst|lowest compliance|repeat|who.*(problem|offender))\b/.test(lower) && named.length === 0) {
    const worst = data.analytics.tradeCompliance.slice(0, 4);
    return {
      answer: `Lowest logged-in-Project-Sight rates for ${monthTitle(data.month)}:`,
      bullets: worst.map(
        (t) =>
          `${t.tradeName}: ${t.compliancePct}% logged · ${t.missingDays} missing · ${t.receivedUnloggedDays} waiting on HP`,
      ),
      suggestedFollowUps: worst[0] ? [`When did ${worst[0].tradeName} last check in?`] : [],
    };
  }

  if (/\b(monday|week-?day|pattern|weekend)\b/.test(lower)) {
    const pattern = data.analytics.weekdayPattern.filter((w) => w.onsite > 0);
    const worst = [...pattern].sort((a, b) => b.missingRate - a.missingRate)[0];
    return {
      answer: worst
        ? `${worst.weekday}s are the weakest this month — ${worst.missingRate}% of on-site trades missed a daily.`
        : "Not enough on-site days yet to see a weekday pattern.",
      bullets: pattern.map((w) => `${w.weekday}: ${w.missing}/${w.onsite} missing (${w.missingRate}%)`),
      suggestedFollowUps: ["Which days this month had the most missing reports?"],
    };
  }

  if (/\b(compliance|how are we doing|summary|overview|status)\b/.test(lower) && named.length === 0) {
    const { kpis } = data;
    return {
      answer: `${monthTitle(data.month)} as of ${formatDate(kpis.asOfDate)}: ${kpis.monthCompliancePct}% of on-site days are logged in Project Sight. Today ${kpis.missingToday} missing, ${kpis.hpBacklogToday} received but not logged, ${kpis.tradesOnsiteToday} trades on site.`,
      bullets: [
        `${kpis.monthManpower.toLocaleString()} manpower · ${kpis.monthHours.toLocaleString()} hours MTD`,
        `${data.sourceReportCount} historical ProjectSight dailies informed this trade list`,
      ],
      suggestedFollowUps: ["Who is missing a daily today?", "Worst compliance this month"],
    };
  }

  const focus = namedExact ?? named[0];
  if (focus) {
    const row = rowFor(focus.id);
    if (!row) {
      return {
        answer: `I don't have ${focus.name} on this dashboard.`,
        bullets: [],
        suggestedFollowUps: trades.slice(0, 3).map((t) => `Is ${t.name} on site today?`),
      };
    }

    if (/\b(last check|last report|last daily|when did)\b/.test(lower)) {
      const last = lastLoggedDate(row);
      return {
        answer: last
          ? `${row.trade.name} last turned in a daily on ${formatDate(last)}.`
          : `${row.trade.name} has no received or logged daily so far this month.`,
        bullets: [
          `${row.missingDays} missing · ${row.receivedUnloggedDays} waiting on HP · ${row.loggedDays} logged`,
          `Month totals: ${row.monthTotalManpower} people · ${row.monthTotalHours}h`,
        ],
        suggestedFollowUps: [`Is ${row.trade.name} on site today?`],
      };
    }

    if (/\b(hours|manpower|people|headcount)\b/.test(lower)) {
      return {
        answer: `${row.trade.name} in ${monthTitle(data.month)}: ${row.monthTotalManpower} manpower and ${row.monthTotalHours} hours across ${row.onsiteDays} on-site days.`,
        bullets: [tradeStatusLine(row, data.asOfDate)],
        suggestedFollowUps: [`When did ${row.trade.name} last check in?`],
      };
    }

    return {
      answer: tradeStatusLine(row, data.asOfDate),
      bullets: [
        `${row.trade.category} · ${row.loggedDays} logged / ${row.onsiteDays} on-site days (${Math.round((row.loggedDays / Math.max(1, row.onsiteDays)) * 100)}%)`,
        lastLoggedDate(row)
          ? `Last daily received ${formatDate(lastLoggedDate(row)!)}`
          : "No daily received this month yet",
      ],
      suggestedFollowUps: [
        `When did ${row.trade.name} last check in?`,
        "Who is missing a daily today?",
      ],
    };
  }

  if (/\b(on ?site|on-site|today)\b/.test(lower)) {
    const onsite = data.rows.filter((r) => r.cells.find((c) => c.isToday)?.onsite);
    return {
      answer: `${onsite.length} trades are on site ${formatDate(data.asOfDate)}.`,
      bullets: onsite.map((r) => {
        const cell = r.cells.find((c) => c.isToday)!;
        const tag =
          cell.status === "logged"
            ? "logged"
            : cell.status === "received"
              ? "received, not logged"
              : "missing daily";
        return `${r.trade.name} — ${tag}`;
      }),
      suggestedFollowUps: ["Who is missing a daily today?", "Show HP logging backlog"],
    };
  }

  return {
    answer: `I couldn't map that to dashboard data. Try a trade name or a question about missing dailies, HP backlog, hours, or ${monthTitle(data.month)} compliance.`,
    bullets: trades.slice(0, 5).map((t) => t.name),
    suggestedFollowUps: [
      "Who is missing a daily today?",
      "Show HP logging backlog",
      "Which days this month had the most missing reports?",
    ],
  };
}
