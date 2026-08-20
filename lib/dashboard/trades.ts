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
export const TRADE_ROSTER: TradeRosterEntry[] = [
  {
    id: "cb-floors",
    name: "CB Floors",
    category: "Flooring",
    domain: "cbfloorsinc.com",
    typicalCrew: 8,
    reliability: 0.94,
    hpLogRate: 0.92,
    weekendWorkChance: 0,
  },
  {
    id: "murray-company",
    name: "Murray Company",
    category: "Mechanical",
    domain: "murraycompany.com",
    typicalCrew: 11,
    reliability: 0.86,
    hpLogRate: 0.62,
    weekendWorkChance: 0.04,
  },
  {
    id: "berg-electric",
    name: "Berg Electric",
    category: "Electrical",
    domain: "bergelectric.com",
    typicalCrew: 14,
    reliability: 0.72,
    hpLogRate: 0.78,
    weekendWorkChance: 0.08,
  },
  {
    id: "best-contracting",
    name: "Best Contracting",
    category: "Roofing",
    domain: "bestcontracting.com",
    typicalCrew: 6,
    reliability: 0.88,
    hpLogRate: 0.85,
    weekendWorkChance: 0,
  },
  {
    id: "msi-steel",
    name: "MSI Steel",
    category: "Structural Steel",
    domain: "msisteel.com",
    typicalCrew: 16,
    reliability: 0.8,
    hpLogRate: 0.74,
    weekendWorkChance: 0.12,
  },
  {
    id: "cosco-fire",
    name: "Cosco Fire",
    category: "Fire Protection",
    domain: "coscofire.com",
    typicalCrew: 5,
    reliability: 0.9,
    hpLogRate: 0.7,
    weekendWorkChance: 0,
  },
  {
    id: "cp-contractors",
    name: "CP Contractors",
    category: "Concrete",
    domain: "cpcontractors.com",
    typicalCrew: 10,
    reliability: 0.84,
    hpLogRate: 0.8,
    weekendWorkChance: 0.05,
  },
  {
    id: "freeman-group",
    name: "Freeman Group",
    category: "Specialties",
    domain: "freemangroup.net",
    typicalCrew: 4,
    reliability: 0.91,
    hpLogRate: 0.88,
    weekendWorkChance: 0,
  },
  {
    id: "nevell-group",
    name: "Nevell Group",
    category: "Interiors",
    domain: "nevellgroup.com",
    typicalCrew: 9,
    reliability: 0.76,
    hpLogRate: 0.82,
    weekendWorkChance: 0,
  },
  {
    id: "first-impulse",
    name: "First Impulse",
    category: "Low Voltage",
    domain: "firstimpulse.com",
    typicalCrew: 3,
    reliability: 0.93,
    hpLogRate: 0.9,
    weekendWorkChance: 0,
  },
];

export function domainFromEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[1]?.trim().toLowerCase() ?? null;
}

export function findTradeByName(query: string): TradeRosterEntry | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return TRADE_ROSTER.find(
    (t) =>
      t.name.toLowerCase() === q ||
      t.id === q ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase() === q,
  );
}

export function findTradesInText(text: string): TradeRosterEntry[] {
  const lower = text.toLowerCase();
  return TRADE_ROSTER.filter((t) => {
    const tokens = [t.name.toLowerCase(), t.id.replace(/-/g, " "), t.category.toLowerCase()];
    return tokens.some((token) => token.length > 3 && lower.includes(token));
  });
}
