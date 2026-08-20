export interface ScheduleTemplate {
  name: string;
  subtasks: string[];
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    name: "Site Work",
    subtasks: [
      "Mobilization",
      "Clearing & Grubbing",
      "Rough Grading",
      "Utility Trenching",
      "Fine Grading",
      "Paving",
    ],
  },
  {
    name: "Foundations",
    subtasks: [
      "Excavation",
      "Footings Formwork",
      "Footings Rebar",
      "Pour Footings",
      "Foundation Walls Formwork",
      "Pour Foundation Walls",
      "Waterproofing",
      "Backfill",
    ],
  },
  {
    name: "Structural",
    subtasks: [
      "Columns",
      "Beams & Girders",
      "Elevated Slab Formwork",
      "Elevated Slab Rebar",
      "Pour Elevated Slab",
      "Shear Walls",
      "Structural Steel Erection",
      "Metal Decking",
    ],
  },
  {
    name: "Exterior Envelope",
    subtasks: [
      "Curtain Wall Install",
      "Masonry Veneer",
      "Roofing",
      "Waterproofing / Air Barrier",
      "Windows & Doors",
      "Caulking / Sealants",
    ],
  },
  {
    name: "MEP Rough-In",
    subtasks: [
      "Mechanical Rough-In",
      "Electrical Rough-In",
      "Plumbing Rough-In",
      "Fire Protection Rough-In",
      "Low Voltage Rough-In",
    ],
  },
  {
    name: "Interior Finishes",
    subtasks: [
      "Drywall Framing",
      "Drywall Hang & Finish",
      "Painting",
      "Flooring",
      "Ceiling Grid / Tile",
      "Millwork & Casework",
      "Specialties",
    ],
  },
  {
    name: "MEP Trim & Commissioning",
    subtasks: [
      "Mechanical Trim",
      "Electrical Trim & Panels",
      "Plumbing Fixtures",
      "Fire Alarm / Detection",
      "Controls & BAS",
      "Commissioning",
    ],
  },
  {
    name: "Closeout",
    subtasks: [
      "Punch List",
      "Final Inspections",
      "As-Built Drawings",
      "O&M Manuals",
      "Substantial Completion",
      "Final Completion",
    ],
  },
];
