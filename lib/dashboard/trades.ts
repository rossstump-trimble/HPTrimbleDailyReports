import { DashboardTradePartner } from "./types";

/** Hensel Phelps / CM emails — not trade-partner rows. */
export const INTERNAL_DOMAINS = new Set(["henselphelps.com", "jacobs.com"]);

/** Personal inboxes that cannot be matched to a company — excluded from this dashboard. */
export const EXCLUDED_DOMAINS = new Set(["gmail.com"]);

export interface TradeRosterEntry extends DashboardTradePartner {
  typicalCrew: number;
  reliability: number;
  hpLogRate: number;
  weekendWorkChance: number;
}

/**
 * Trade partners inferred from ProjectSight daily `CreatedBy` domains
 * in the CYS07 dump (personal/unmatched inboxes omitted).
 */
export const SAMPLE_TRADE_ROSTER: TradeRosterEntry[] = [
  {
    id: "three-star-drywall",
    name: "Three Star Drywall",
    category: "Drywall & Framing",
    domain: "threestardrywall.com",
    typicalCrew: 12,
    reliability: 0.92,
    hpLogRate: 0.88,
    weekendWorkChance: 0.05,
  },
  {
    id: "electro-electrical-co",
    name: "Electro Electrical Co.",
    category: "Electrical",
    domain: "electroelectric.com",
    typicalCrew: 14,
    reliability: 0.86,
    hpLogRate: 0.82,
    weekendWorkChance: 0.08,
  },
  {
    id: "monster-plumbing-mechanical",
    name: "Monster Plumbing & Mechanical",
    category: "Plumbing & Mechanical",
    domain: "monsterplumbing.com",
    typicalCrew: 10,
    reliability: 0.84,
    hpLogRate: 0.78,
    weekendWorkChance: 0.04,
  },
  {
    id: "paint-pros",
    name: "Paint Pro's",
    category: "Painting & Finishes",
    domain: "paintpros.com",
    typicalCrew: 8,
    reliability: 0.90,
    hpLogRate: 0.85,
    weekendWorkChance: 0,
  },
  {
    id: "backstreet-doors",
    name: "Backstreet Doors",
    category: "Doors & Hardware",
    domain: "backstreetdoors.com",
    typicalCrew: 6,
    reliability: 0.94,
    hpLogRate: 0.90,
    weekendWorkChance: 0,
  },
  {
    id: "amys-awning-sign",
    name: "Amy's Awning & Sign",
    category: "Specialties & Signage",
    domain: "amysawning.com",
    typicalCrew: 4,
    reliability: 0.88,
    hpLogRate: 0.80,
    weekendWorkChance: 0,
  },
  {
    id: "sams-concrete",
    name: "Sam's Concrete",
    category: "Concrete",
    domain: "samsconcrete.com",
    typicalCrew: 15,
    reliability: 0.89,
    hpLogRate: 0.86,
    weekendWorkChance: 0.10,
  },
  {
    id: "cb-flooring",
    name: "CB Flooring, LLC.",
    category: "Flooring",
    domain: "cbflooring.com",
    typicalCrew: 7,
    reliability: 0.91,
    hpLogRate: 0.89,
    weekendWorkChance: 0,
  },
  {
    id: "intermountain-electric",
    name: "Intermountain Electric",
    category: "Electrical",
    domain: "intermountain.com",
    typicalCrew: 11,
    reliability: 0.87,
    hpLogRate: 0.84,
    weekendWorkChance: 0.06,
  },
  {
    id: "elite-sheet-metal",
    name: "Elite Sheet Metal Works, Inc.",
    category: "Sheet Metal",
    domain: "elitesheetmetal.com",
    typicalCrew: 9,
    reliability: 0.85,
    hpLogRate: 0.81,
    weekendWorkChance: 0.05,
  },
  {
    id: "inspiration-plumbing",
    name: "Inspiration Plumbing Company",
    category: "Plumbing",
    domain: "inspirationplumbing.com",
    typicalCrew: 8,
    reliability: 0.88,
    hpLogRate: 0.83,
    weekendWorkChance: 0.02,
  },
  {
    id: "hensel-phelps-construction",
    name: "Hensel Phelps Construction Co.",
    category: "General Contractor",
    domain: "henselphelps.com",
    typicalCrew: 18,
    reliability: 0.96,
    hpLogRate: 0.95,
    weekendWorkChance: 0.15,
  },
];

/**
 * Trade roster defaults to empty so dashboards do not show mock sample companies.
 * Companies are populated dynamically from connected ProjectSight projects or user submissions.
 */
export const TRADE_ROSTER: TradeRosterEntry[] = [];

export function domainFromEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[1]?.trim().toLowerCase() ?? null;
}

export function findTradeByName(
  query: string,
  roster: DashboardTradePartner[] = TRADE_ROSTER,
): DashboardTradePartner | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return roster.find(
    (t) =>
      t.name.toLowerCase() === q ||
      t.id === q ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase() === q,
  );
}

export function findTradesInText(
  text: string,
  roster: DashboardTradePartner[] = TRADE_ROSTER,
): DashboardTradePartner[] {
  const lower = text.toLowerCase();
  return roster.filter((t) => {
    const tokens = [t.name.toLowerCase(), t.id.replace(/-/g, " "), t.category.toLowerCase()];
    return tokens.some((token) => token.length > 3 && lower.includes(token));
  });
}
