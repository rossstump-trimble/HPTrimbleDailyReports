import type { CSICodeSuggestion, AISuggestion, HistoricalProject } from "./types";

export const mockCSISuggestions: Record<number, CSICodeSuggestion[]> = {
  1: [
    { code: "03 30 53", title: "Miscellaneous Cast-in-Place Concrete", confidence: 94, matchReason: "Foundation wall thickness change matches concrete wall modification scope" },
    { code: "03 11 13", title: "Structural Concrete Formwork", confidence: 89, matchReason: "Formwork adjustment required for wall thickness delta (12\" to 14\")" },
    { code: "03 20 00", title: "Concrete Reinforcing", confidence: 82, matchReason: "Rebar modifications typically accompany wall thickness changes" },
  ],
  2: [
    { code: "26 05 19", title: "Low-Voltage Electrical Power Conductors", confidence: 92, matchReason: "Electrical line replacement directly maps to conductor installation" },
    { code: "26 05 33", title: "Raceway and Boxes for Electrical Systems", confidence: 87, matchReason: "Conduit and raceway replacement scope identified in description" },
    { code: "33 11 00", title: "Water Utility Distribution Piping", confidence: 78, matchReason: "Fire water line upgrade (6\" to 8\") falls under utility piping" },
  ],
  3: [
    { code: "07 84 13", title: "Penetration Firestopping", confidence: 96, matchReason: "Direct match: fire caulking of all firewall penetrations" },
    { code: "07 84 46", title: "Fire-Resistive Joint Systems", confidence: 88, matchReason: "Joint sealant scope included in comprehensive fire caulk work" },
    { code: "07 92 00", title: "Joint Sealants", confidence: 71, matchReason: "Partial overlap with general sealant work, lower confidence" },
  ],
  4: [
    { code: "05 12 23", title: "Structural Steel for Buildings", confidence: 91, matchReason: "Beam relocation is structural steel modification scope" },
    { code: "05 05 23", title: "Metal Fastenings", confidence: 83, matchReason: "Welding and re-connection work for relocated beams" },
    { code: "23 31 00", title: "HVAC Ducts and Casings", confidence: 68, matchReason: "Duct clearance is the driver, but work is structural" },
  ],
  5: [
    { code: "03 30 00", title: "Cast-in-Place Concrete", confidence: 88, matchReason: "Unit price concrete adjustment per contract terms" },
    { code: "01 22 00", title: "Unit Prices", confidence: 85, matchReason: "Contract unit price adjustment mechanism" },
    { code: "03 05 00", title: "Common Work Results for Concrete", confidence: 74, matchReason: "General concrete work umbrella code" },
  ],
  6: [
    { code: "03 30 53", title: "Miscellaneous Cast-in-Place Concrete", confidence: 93, matchReason: "Enlarged footings are cast-in-place concrete scope" },
    { code: "03 20 00", title: "Concrete Reinforcing", confidence: 90, matchReason: "Additional rebar for enlarged footings per revised structural drawings" },
    { code: "31 63 00", title: "Bored Piles", confidence: 65, matchReason: "Foundation scope overlap, but footings are not piles" },
  ],
};

export const mockEnhancedAISuggestions: Record<number, AISuggestion[]> = {
  1: [
    {
      costCode: "03 11 13", costCodeTitle: "Structural Concrete Formwork", description: "Structural concrete formwork — wall thickness upgrade",
      laborRate: 68.00, laborHours: 80, materialCost: 3200, equipmentCost: 800, total: 9440, confidence: 91,
      source: "6 similar projects",
      sourceProjects: ["Harbor View Tower", "Lakeshore Condos Phase 2", "Central Business Hub", "Metro Hospital Wing B", "Skyline Tower", "Commerce Park Building D"],
    },
    {
      costCode: "03 30 53", costCodeTitle: "Misc. Cast-in-Place Concrete", description: "Cast-in-place concrete — 14\" wall pour",
      laborRate: 65.00, laborHours: 60, materialCost: 4800, equipmentCost: 600, total: 9300, confidence: 93,
      source: "6 similar projects",
      sourceProjects: ["Harbor View Tower", "Lakeshore Condos Phase 2", "Central Business Hub", "University Science Center", "Airport Terminal Expansion", "Greenfield Industrial Park"],
    },
  ],
  2: [
    {
      costCode: "26 05 19", costCodeTitle: "Low-Voltage Electrical Conductors", description: "Low-voltage electrical power conductors — line replacement",
      laborRate: 78.00, laborHours: 120, materialCost: 9600, equipmentCost: 1400, total: 20360, confidence: 90,
      source: "5 similar projects",
      sourceProjects: ["Tech Campus Building C", "Downtown Medical Center", "Greenfield Industrial Park", "Metro Hospital Wing B", "Riverside Office Park"],
    },
    {
      costCode: "26 05 33", costCodeTitle: "Raceway and Boxes", description: "Raceway and conduit replacement",
      laborRate: 78.00, laborHours: 80, materialCost: 4200, equipmentCost: 600, total: 11040, confidence: 86,
      source: "5 similar projects",
      sourceProjects: ["Tech Campus Building C", "Downtown Medical Center", "Greenfield Industrial Park", "Skyline Tower", "Eastgate Shopping Center"],
    },
    {
      costCode: "26 05 53", costCodeTitle: "Identification and Testing", description: "Identification and testing — new conductors",
      laborRate: 72.00, laborHours: 16, materialCost: 450, equipmentCost: 0, total: 1602, confidence: 84,
      source: "3 similar projects",
      sourceProjects: ["Tech Campus Building C", "Downtown Medical Center", "Greenfield Industrial Park"],
    },
  ],
  3: [
    {
      costCode: "07 84 13", costCodeTitle: "Penetration Firestopping", description: "Penetration firestopping — caulk application",
      laborRate: 72.50, laborHours: 160, materialCost: 8400, equipmentCost: 1200, total: 21200, confidence: 94,
      source: "3 similar projects",
      sourceProjects: ["Riverside Office Park", "Metro Hospital Wing B", "Westside Mall Renovation"],
    },
    {
      costCode: "07 84 13", costCodeTitle: "Penetration Firestopping", description: "Penetration firestopping — collar installation",
      laborRate: 72.50, laborHours: 120, materialCost: 6200, equipmentCost: 800, total: 15700, confidence: 91,
      source: "3 similar projects",
      sourceProjects: ["Riverside Office Park", "Metro Hospital Wing B", "Westside Mall Renovation"],
    },
    {
      costCode: "07 84 46", costCodeTitle: "Fire-Resistive Joint Systems", description: "Fire-resistive joint sealant",
      laborRate: 68.00, laborHours: 24, materialCost: 1800, equipmentCost: 200, total: 3632, confidence: 87,
      source: "2 similar projects",
      sourceProjects: ["Metro Hospital Wing B", "Westside Mall Renovation"],
    },
  ],
  4: [
    {
      costCode: "05 12 23", costCodeTitle: "Structural Steel for Buildings", description: "Structural steel beam relocation — labor & rigging",
      laborRate: 85.00, laborHours: 32, materialCost: 0, equipmentCost: 1200, total: 3920, confidence: 88,
      source: "4 similar projects",
      sourceProjects: ["Skyline Tower", "Commerce Park Building D", "Airport Terminal Expansion", "Tech Campus Building C"],
    },
    {
      costCode: "05 05 23", costCodeTitle: "Metal Fastenings", description: "Welding and connections — beam re-attachment",
      laborRate: 92.00, laborHours: 8, materialCost: 450, equipmentCost: 0, total: 1186, confidence: 82,
      source: "4 similar projects",
      sourceProjects: ["Skyline Tower", "Commerce Park Building D", "Airport Terminal Expansion", "Tech Campus Building C"],
    },
  ],
  5: [
    {
      costCode: "03 30 00", costCodeTitle: "Cast-in-Place Concrete", description: "Unit price concrete adjustment",
      laborRate: 65.00, laborHours: 40, materialCost: 2200, equipmentCost: 400, total: 5200, confidence: 85,
      source: "7 similar projects",
      sourceProjects: ["Eastgate Shopping Center", "Northpoint Logistics Hub", "Harbor View Tower", "Central Business Hub", "University Science Center", "Lakeshore Condos Phase 2", "Midtown Lofts"],
    },
  ],
  6: [
    {
      costCode: "03 30 53", costCodeTitle: "Misc. Cast-in-Place Concrete", description: "Concrete placement — enlarged footings",
      laborRate: 65.00, laborHours: 200, materialCost: 18500, equipmentCost: 3200, total: 34700, confidence: 92,
      source: "5 similar projects",
      sourceProjects: ["Harbor View Tower", "Airport Terminal Expansion", "University Science Center", "Greenfield Industrial Park", "Lakeshore Condos Phase 2"],
    },
    {
      costCode: "03 20 00", costCodeTitle: "Concrete Reinforcing", description: "Concrete reinforcing — additional rebar",
      laborRate: 70.00, laborHours: 160, materialCost: 12800, equipmentCost: 800, total: 24800, confidence: 89,
      source: "5 similar projects",
      sourceProjects: ["Harbor View Tower", "Airport Terminal Expansion", "University Science Center", "Greenfield Industrial Park", "Lakeshore Condos Phase 2"],
    },
  ],
};

export const mockEnhancedHistorical: Record<number, HistoricalProject[]> = {
  1: [
    { name: "Harbor View Tower", date: "2024-01", similarItem: "Foundation wall thickness change", actualCost: 18900, variance: "-5.5%", laborCost: 8200, materialCost: 7800, equipmentCost: 2900, marginPercent: -5.5 },
    { name: "Lakeshore Condos Phase 2", date: "2023-09", similarItem: "Foundation wall redesign", actualCost: 21400, variance: "+7.0%", laborCost: 9800, materialCost: 8400, equipmentCost: 3200, marginPercent: 7.0 },
    { name: "Central Business Hub", date: "2023-05", similarItem: "Concrete wall modification", actualCost: 19600, variance: "-2.0%", laborCost: 8600, materialCost: 8100, equipmentCost: 2900, marginPercent: -2.0 },
  ],
  2: [
    { name: "Tech Campus Building C", date: "2024-02", similarItem: "Electrical utility line replacement", actualCost: 31200, variance: "-8.2%", laborCost: 14500, materialCost: 12800, equipmentCost: 3900, marginPercent: -8.2 },
    { name: "Downtown Medical Center", date: "2023-10", similarItem: "Fire water line upgrade 6\" to 8\"", actualCost: 36100, variance: "+6.2%", laborCost: 16800, materialCost: 14200, equipmentCost: 5100, marginPercent: 6.2 },
    { name: "Greenfield Industrial Park", date: "2023-06", similarItem: "Underground utility reroute", actualCost: 33800, variance: "-0.6%", laborCost: 15200, materialCost: 13900, equipmentCost: 4700, marginPercent: -0.6 },
  ],
  3: [
    { name: "Riverside Office Park", date: "2024-03", similarItem: "Fire caulking — full building", actualCost: 38500, variance: "-3.8%", laborCost: 18200, materialCost: 15100, equipmentCost: 5200, marginPercent: -3.8 },
    { name: "Metro Hospital Wing B", date: "2023-11", similarItem: "Firewall penetration sealing", actualCost: 42200, variance: "+5.5%", laborCost: 19800, materialCost: 16500, equipmentCost: 5900, marginPercent: 5.5 },
    { name: "Westside Mall Renovation", date: "2023-08", similarItem: "Fire protection caulking", actualCost: 36800, variance: "-8.0%", laborCost: 17400, materialCost: 14200, equipmentCost: 5200, marginPercent: -8.0 },
  ],
  4: [
    { name: "Skyline Tower", date: "2024-04", similarItem: "Steel beam relocation — HVAC clearance", actualCost: 5200, variance: "+6.1%", laborCost: 3200, materialCost: 600, equipmentCost: 1400, marginPercent: 6.1 },
    { name: "Commerce Park Building D", date: "2023-12", similarItem: "Duct shaft structural modification", actualCost: 4650, variance: "-5.1%", laborCost: 2800, materialCost: 500, equipmentCost: 1350, marginPercent: -5.1 },
  ],
  5: [
    { name: "Eastgate Shopping Center", date: "2024-02", similarItem: "Unit price concrete adjustment", actualCost: 4800, variance: "-4.0%", laborCost: 2200, materialCost: 2000, equipmentCost: 600, marginPercent: -4.0 },
    { name: "Northpoint Logistics Hub", date: "2023-07", similarItem: "Concrete unit rate change order", actualCost: 5300, variance: "+6.0%", laborCost: 2500, materialCost: 2200, equipmentCost: 600, marginPercent: 6.0 },
  ],
  6: [
    { name: "Harbor View Tower", date: "2024-01", similarItem: "Enlarged footing concrete pour", actualCost: 57400, variance: "-4.3%", laborCost: 24800, materialCost: 26200, equipmentCost: 6400, marginPercent: -4.3 },
    { name: "Airport Terminal Expansion", date: "2023-10", similarItem: "Additional concrete for revised footings", actualCost: 63200, variance: "+5.3%", laborCost: 27400, materialCost: 28500, equipmentCost: 7300, marginPercent: 5.3 },
    { name: "University Science Center", date: "2023-04", similarItem: "Foundation enlargement — structural", actualCost: 55800, variance: "-7.0%", laborCost: 23600, materialCost: 25800, equipmentCost: 6400, marginPercent: -7.0 },
  ],
};
