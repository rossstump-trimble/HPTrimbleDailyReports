export interface ProjectSightCompany {
  id: number;
  name: string;
}

export const PS_COMPANY_REGISTRY: Record<string, ProjectSightCompany> = {
  "three star drywall": { id: 99, name: "Three Star Drywall" },
  "threestardrywall": { id: 99, name: "Three Star Drywall" },
  "three star": { id: 99, name: "Three Star Drywall" },
  "electro electrical co.": { id: 104, name: "Electro Electrical Co." },
  "electro electrical co": { id: 104, name: "Electro Electrical Co." },
  "electro electrical": { id: 104, name: "Electro Electrical Co." },
  "electroelectric": { id: 104, name: "Electro Electrical Co." },
  "monster plumbing & mechanical": { id: 234, name: "Monster Plumbing & Mechanical" },
  "monster plumbing and mechanical": { id: 234, name: "Monster Plumbing & Mechanical" },
  "monster plumbing": { id: 234, name: "Monster Plumbing & Mechanical" },
  "paint pro's": { id: 98, name: "Paint Pro's" },
  "paint pros": { id: 98, name: "Paint Pro's" },
  "backstreet doors": { id: 230, name: "Backstreet Doors" },
  "amy's awning & sign": { id: 235, name: "Amy's Awning & Sign" },
  "amy's awning and sign": { id: 235, name: "Amy's Awning & Sign" },
  "amys awning": { id: 235, name: "Amy's Awning & Sign" },
  "sam's concrete": { id: 3, name: "Sam's Concrete" },
  "sams concrete": { id: 3, name: "Sam's Concrete" },
  "cb flooring, llc.": { id: 23, name: "CB Flooring, LLC." },
  "cb flooring": { id: 23, name: "CB Flooring, LLC." },
  "cb floors": { id: 23, name: "CB Flooring, LLC." },
  "intermountain electric": { id: 9, name: "Intermountain Electric" },
  "elite sheet metal works, inc.": { id: 29, name: "Elite Sheet Metal Works, Inc." },
  "elite sheet metal": { id: 29, name: "Elite Sheet Metal Works, Inc." },
  "inspiration plumbing company": { id: 41, name: "Inspiration Plumbing Company" },
  "inspiration plumbing": { id: 41, name: "Inspiration Plumbing Company" },
  "hensel phelps construction co.": { id: 2, name: "Hensel Phelps Construction Co." },
  "hensel phelps": { id: 2, name: "Hensel Phelps Construction Co." },
  "trimble ppm": { id: 1, name: "Trimble PPM" },
  "trimble": { id: 1, name: "Trimble PPM" },
};

export function lookupCompany(name?: string): ProjectSightCompany | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();

  if (PS_COMPANY_REGISTRY[key]) return PS_COMPANY_REGISTRY[key];

  for (const [k, comp] of Object.entries(PS_COMPANY_REGISTRY)) {
    if (k.length > 4 && (key.includes(k) || k.includes(key))) {
      return comp;
    }
  }

  if (key.includes("hensel") || key.includes("phelps")) {
    return { id: 2, name: "Hensel Phelps Construction Co." };
  }

  if (key.includes("trimble")) {
    return { id: 1, name: "Trimble PPM" };
  }

  // If trade name is not in the known registry, do NOT guess an arbitrary company ID.
  // Returning null allows ProjectSight to accept the record with trade/company name without invalid company ID errors.
  return null;
}

export function parseEquipmentItem(raw: string): { id: number; name: string; quantity: number } {
  if (!raw) return { id: 1029, name: "Scissor Lift", quantity: 1 };

  let qty = 1;
  const qtyMatch =
    raw.match(/(?:qty|quantity|\bcount)\s*[:=]?\s*(\d+(?:\.\d+)?)/i) ||
    raw.match(/\((\d+)\)/) ||
    raw.match(/^(\d+)\s*x?\s+/i);
  if (qtyMatch) {
    qty = parseFloat(qtyMatch[1]) || 1;
  }

  const cleanName = raw
    .replace(/(?:qty|quantity|\bcount)\s*[:=]?\s*\d+(?:\.\d+)?/gi, "")
    .replace(/\(\d+\)/g, "")
    .replace(/^\d+\s*x?\s+/i, "")
    .replace(/[-–—:]+$/, "")
    .trim();

  const key = cleanName.toLowerCase();

  if (key.includes("scissor") || key.includes("lift")) {
    return { id: 1029, name: "Scissor Lift", quantity: qty };
  }
  if (key.includes("forklift") || key.includes("fork lift") || key.includes("telehandler")) {
    return { id: 4606, name: "Forklift - All Terrain", quantity: qty };
  }
  if (key.includes("concrete pump") || key.includes("pump truck")) {
    return { id: 4604, name: "Concrete Pump Truck", quantity: qty };
  }
  if (key.includes("excavator") || key.includes("trackhoe") || key.includes("backhoe") || key.includes("digger")) {
    return { id: 956, name: "Excavator", quantity: qty };
  }
  if (key.includes("truck") || key.includes("van") || key.includes("pickup")) {
    return { id: 4611, name: "Company Truck", quantity: qty };
  }

  return { id: 1029, name: cleanName || "Scissor Lift", quantity: qty };
}

export const PS_CONDITIONS_LOOKUP: Record<string, number> = {
  "clear": 675,
  "sunny": 675,
  "clear / sunny": 675,
  "mainly clear": 675,
  "partly cloudy": 749,
  "cloudy": 750,
  "overcast": 750,
  "rain": 719,
  "light drizzle": 710,
  "drizzle": 710,
  "moderate rain": 719,
  "heavy rain": 719,
  "thunderstorm": 746,
  "snow": 728,
  "fog": 695,
  "mist": 681,
};

export function lookupConditionsId(conditions?: string): number {
  if (!conditions) return 749; // Partly Cloudy
  const key = conditions.toLowerCase().trim();
  if (PS_CONDITIONS_LOOKUP[key]) return PS_CONDITIONS_LOOKUP[key];

  if (key.includes("thunder") || key.includes("storm") || key.includes("tstorm")) return 746;
  if (key.includes("snow") || key.includes("flurr") || key.includes("sleet") || key.includes("blizzard")) return 728;
  if (key.includes("heavy rain") || key.includes("downpour")) return 719;
  if (key.includes("rain") || key.includes("shower") || key.includes("drizzle") || key.includes("precip")) return 719;
  if (key.includes("fog") || key.includes("mist") || key.includes("haze")) return 695;
  if (key.includes("partly") || key.includes("scattered")) return 749;
  if (key.includes("cloud") || key.includes("overcast")) return 750;
  if (key.includes("clear") || key.includes("sun") || key.includes("fair")) return 675;
  if (key.includes("wind") || key.includes("breeze") || key.includes("gust")) return 751;

  for (const [k, id] of Object.entries(PS_CONDITIONS_LOOKUP)) {
    if (key.includes(k) || k.includes(key)) return id;
  }
  return 749;
}
