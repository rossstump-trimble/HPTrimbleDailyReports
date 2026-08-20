// ─── Generic Record ─────────────────────────────────────────────────────────

export interface MobileRecord {
  id: string;
  number: string;
  title: string;
  status: string;
  location?: string;
  dueDate: string;
  assigneeCount: number;
  commentCount: number;
  downloaded: boolean;
  /** Extra type-specific metadata (e.g. weatherTemp for daily-reports) */
  meta?: Record<string, string | number>;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface MobileNotification {
  id: string;
  message: string;
  timestamp: string;
  tag: "Overdue" | "Assigned" | "Updated" | "Closed";
  unread: boolean;
}

export const MOCK_NOTIFICATIONS: MobileNotification[] = [
  { id: "n1", message: "Punch Item 013 Fix chip in wood soffit is overdue by 7 days.", timestamp: "1 hr ago", tag: "Overdue", unread: true },
  { id: "n2", message: "RFI 013 Confirm structural connection detail at grid C4 is due today.", timestamp: "2 hrs ago", tag: "Overdue", unread: true },
  { id: "n3", message: "Action Item 004 Confirm steel delivery schedule has been assigned to you.", timestamp: "3 hrs ago", tag: "Assigned", unread: true },
  { id: "n4", message: "Safety Notice 004 Crane swing radius — response required.", timestamp: "5 hrs ago", tag: "Overdue", unread: true },
  { id: "n5", message: "Submittal 006 Door Hardware Schedule was updated by Frank Ochoa.", timestamp: "8 hrs ago", tag: "Updated", unread: true },
  { id: "n6", message: "Punch Item 010 Patch and paint drywall has been closed.", timestamp: "Yesterday", tag: "Closed", unread: false },
];

// ─── Projects ──────────────────────────────────────────────────────────────

export interface MobileProject {
  id: string;
  number: string;
  name: string;
  company: string;
  /** Whether the project data has been downloaded to the device */
  downloaded: boolean;
  syncedDate: string;
  /** Group label used to bucket projects in the list (e.g. account number) */
  groupLabel: string;
  hasImage: boolean;
  imageSrc?: string;
}

export const MOBILE_PROJECTS: MobileProject[] = [
  {
    id: "2045",
    number: "2045",
    name: "Westminster Office Campus South",
    company: "Acme South, LLC",
    downloaded: true,
    syncedDate: "March 13, 2026",
    groupLabel: "Downloaded",
    hasImage: true,
    imageSrc: "/images/project-render.jpg",
  },
  {
    id: "6523001",
    number: "6523001",
    name: "ARS-WSU Bioscience Research Bldg",
    company: "Pacific NW",
    downloaded: true,
    syncedDate: "December 15, 2025",
    groupLabel: "Downloaded",
    hasImage: true,
    imageSrc: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&h=120&fit=crop",
  },
  {
    id: "tc-template",
    number: "0",
    name: "_Trimble Connect-Template Project",
    company: "Fransen Pittman",
    downloaded: false,
    syncedDate: "",
    groupLabel: "Projects 8064",
    hasImage: true,
    imageSrc: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&h=120&fit=crop",
  },
  {
    id: "sletten-nv",
    number: "0000",
    name: "! Sletten Nevada Template",
    company: "Sletten Construction of Nevada",
    downloaded: false,
    syncedDate: "",
    groupLabel: "Projects 8064",
    hasImage: true,
    imageSrc: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&h=120&fit=crop",
  },
];

// ─── Portfolios ──────────────────────────────────────────────────────────────

export interface Portfolio {
  id: string;
  name: string;
  company: string;
  projectCount: number;
  imageSrc?: string;
  projectIds: string[];
}

export const PORTFOLIOS: Portfolio[] = [
  {
    id: "p1", name: "Acme Construction Projects", company: "Trimble",
    projectCount: 33, projectIds: ["2045", "6523001"],
    imageSrc: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&h=120&fit=crop",
  },
  {
    id: "p2", name: "Acme Projects 2", company: "Trimble",
    projectCount: 1, projectIds: ["2045"],
    imageSrc: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&h=120&fit=crop",
  },
  {
    id: "p3", name: "Westminster Campus Portfolio", company: "Acme South, LLC",
    projectCount: 5, projectIds: ["2045"],
    imageSrc: "/images/project-render.jpg",
  },
  {
    id: "p4", name: "Pacific Northwest Projects", company: "Pacific NW",
    projectCount: 28, projectIds: ["6523001"],
    imageSrc: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&h=120&fit=crop",
  },
  {
    id: "p5", name: "Template Projects", company: "Fransen Pittman",
    projectCount: 4, projectIds: ["tc-template", "sletten-nv"],
    imageSrc: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&h=120&fit=crop",
  },
  {
    id: "p6", name: "Nevada Construction", company: "Sletten Construction of Nevada",
    projectCount: 12, projectIds: ["sletten-nv"],
    imageSrc: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&h=120&fit=crop",
  },
];

// ─── Team Members ───────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  phone?: string;
  mobile?: string;
  email?: string;
  photoUrl?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "ab", initials: "AB", name: "Alex Brooks", firstName: "Alex", lastName: "Brooks",
    role: "Contractor", company: "Sample Company",
    email: "alex.brooks@samplecompany.com",
  },
  {
    id: "sc", initials: "SC", name: "Sam Carter", firstName: "Sam", lastName: "Carter",
    role: "Project Manager", company: "Sample Company",
    phone: "6045550102", email: "sam.carter@samplecompany.com",
  },
  {
    id: "dd", initials: "DD", name: "Dana Donovan", firstName: "Dana", lastName: "Donovan",
    role: "Superintendent", company: "Sample Company",
    phone: "6045550120", mobile: "6045550121", email: "dana.donovan@samplecompany.com",
    photoUrl: "https://i.pravatar.cc/80?img=5",
  },
  {
    id: "sj", initials: "SJ", name: "Sydney Jensen", firstName: "Sydney", lastName: "Jensen",
    role: "Safety Officer", company: "Sample Company",
    phone: "6045550188", mobile: "6045550189", email: "sydney.jensen@samplecompany.com",
    photoUrl: "https://i.pravatar.cc/80?img=9",
  },
  {
    id: "jl1", initials: "JL", name: "Jordan Lee", firstName: "Jordan", lastName: "Lee",
    role: "Owner Rep", company: "Owner Corp",
    phone: "6045550210", mobile: "6045550211", email: "jordan.lee@ownercorp.com",
    photoUrl: "https://i.pravatar.cc/80?img=11",
  },
  {
    id: "jl2", initials: "JL", name: "Jamie Lawson", firstName: "Jamie", lastName: "Lawson",
    role: "BIM Manager", company: "Sample Company",
    phone: "6045550310", mobile: "6045550311", email: "jamie.lawson@samplecompany.com",
    photoUrl: "https://i.pravatar.cc/80?img=12",
  },
  {
    id: "jl3", initials: "JL", name: "Jesse Larkin", firstName: "Jesse", lastName: "Larkin",
    role: "Architect", company: "Sample Company",
    email: "jesse.larkin@samplecompany.com",
  },
  {
    id: "mr", initials: "MR", name: "Morgan Reed", firstName: "Morgan", lastName: "Reed",
    role: "Engineer", company: "Owner Corp",
    phone: "6045550401", mobile: "6045550402", email: "morgan.reed@ownercorp.com",
    photoUrl: "https://i.pravatar.cc/80?img=32",
  },
  {
    id: "pt", initials: "PT", name: "Parker Tan", firstName: "Parker", lastName: "Tan",
    role: "Inspector", company: "Sample Company",
    phone: "6045550501", email: "parker.tan@samplecompany.com",
    photoUrl: "https://i.pravatar.cc/80?img=47",
  },
];

// ─── Drawings ───────────────────────────────────────────────────────────────

export interface MobileDrawing {
  id: string;
  number: string;
  name: string;
  revision: string;
  discipline: string | null;
  downloaded: boolean;
  hasModel: boolean;
  /** Public path to the drawing thumbnail image */
  imageSrc?: string;
}

const DRAWING_IMAGES = [
  "/images/drawings/drawing-a.png",
  "/images/drawings/drawing-b.png",
  "/images/drawings/drawing-c.png",
  "/images/drawings/drawing-d.png",
];

export const MOBILE_DRAWINGS: MobileDrawing[] = [
  // Architectural (20 total, 4 downloaded)
  { id: "a2-01", number: "A2.01", name: "LEVEL 1 FLOOR PLAN", revision: "Current", discipline: "Architectural", downloaded: true, hasModel: true, imageSrc: DRAWING_IMAGES[0] },
  { id: "a2-02", number: "A2.02", name: "LEVEL 2 FLOOR PLAN", revision: "Current", discipline: "Architectural", downloaded: true, hasModel: true, imageSrc: DRAWING_IMAGES[1] },
  { id: "a2-03", number: "A2.03", name: "LEVEL 3 FLOOR PLAN", revision: "Current", discipline: "Architectural", downloaded: true, hasModel: true, imageSrc: DRAWING_IMAGES[2] },
  { id: "a2-04", number: "A2.04", name: "LEVEL 4 FLOOR PLAN", revision: "Current", discipline: "Architectural", downloaded: true, hasModel: true, imageSrc: DRAWING_IMAGES[3] },
  { id: "a2-05", number: "A2.05", name: "ROOF PLAN", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[0] },
  { id: "a2-008", number: "A2.008", name: "OVERALL PLAN L8 W", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[3] },
  { id: "a2-06", number: "A2.06", name: "EXTERIOR ELEVATIONS - NORTH", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[1] },
  { id: "a2-07", number: "A2.07", name: "EXTERIOR ELEVATIONS - SOUTH", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[2] },
  { id: "a2-08", number: "A2.08", name: "EXTERIOR ELEVATIONS - EAST/WEST", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[0] },
  { id: "a3-01", number: "A3.01", name: "WALL SECTIONS", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[1] },
  { id: "a3-02", number: "A3.02", name: "BUILDING SECTIONS", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[2] },
  { id: "a4-01", number: "A4.01", name: "ENLARGED PLANS - CORE", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[3] },
  { id: "a4-02", number: "A4.02", name: "ENLARGED PLANS - LOBBY", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[0] },
  { id: "a5-01", number: "A5.01", name: "INTERIOR ELEVATIONS", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[1] },
  { id: "a5-02", number: "A5.02", name: "INTERIOR ELEVATIONS - RESTROOMS", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[2] },
  { id: "a6-01", number: "A6.01", name: "REFLECTED CEILING PLAN L1", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[3] },
  { id: "a6-02", number: "A6.02", name: "REFLECTED CEILING PLAN L2", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[0] },
  { id: "a7-01", number: "A7.01", name: "DOOR SCHEDULE", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[1] },
  { id: "a7-02", number: "A7.02", name: "WINDOW SCHEDULE", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[2] },
  { id: "a8-01", number: "A8.01", name: "DETAILS - EXTERIOR", revision: "Current", discipline: "Architectural", downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[3] },
  // ── No Discipline (4 representative drawings, not yet downloaded) ──
  { id: "nd-01", number: "G0.01", name: "GENERAL NOTES & ABBREVIATIONS", revision: "Current", discipline: null, downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[2] },
  { id: "nd-02", number: "G0.02", name: "SHEET INDEX", revision: "Current", discipline: null, downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[3] },
  { id: "nd-03", number: "C0.01", name: "SITE PLAN", revision: "Current", discipline: null, downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[0] },
  { id: "nd-04", number: "C1.01", name: "GRADING & DRAINAGE PLAN", revision: "Current", discipline: null, downloaded: false, hasModel: false, imageSrc: DRAWING_IMAGES[1] },
  // Remaining 870 as a count placeholder — rendered as a summary in the UI
];

export const DRAWING_SUMMARY = {
  total: 894,
  noDisciplineCount: 874,
  architecturalDownloaded: 4,
  architecturalTotal: 20,
};

// ─── Punch Items ────────────────────────────────────────────────────────────

export type PunchStatus = "OPEN" | "PENDING REINSPECTION" | "CLOSED" | "VOID";

export interface PunchItem {
  id: string;
  number: string;
  description: string;
  status: PunchStatus;
  location?: string;
  dueDate: string;
  assigneeCount: number;
  commentCount: number;
  downloaded: boolean;
}

export const PUNCH_ITEMS: PunchItem[] = [
  {
    id: "pi-14",
    number: "00014",
    description: "Seal around west scupper at canopy",
    status: "PENDING REINSPECTION",
    location: "Exterior/Roof/NE Corner",
    dueDate: "7/14/26",
    assigneeCount: 2,
    commentCount: 1,
    downloaded: false,
  },
  {
    id: "pi-13",
    number: "00013",
    description: "Fix chip in wood soffit",
    status: "OPEN",
    location: "Interior/4th Floor/Area C/406",
    dueDate: "7/2/26",
    assigneeCount: 2,
    commentCount: 1,
    downloaded: false,
  },
  {
    id: "pi-12",
    number: "00012",
    description: "Remove scratches from west glass",
    status: "OPEN",
    location: "Interior/4th Floor/Area C/420",
    dueDate: "7/18/26",
    assigneeCount: 1,
    commentCount: 1,
    downloaded: true,
  },
  {
    id: "pi-11",
    number: "00011",
    description: "Floor box cover plate serving the 4th floor conference room is damaged",
    status: "OPEN",
    location: "Interior/4th Floor/Area A/412",
    dueDate: "7/18/26",
    assigneeCount: 1,
    commentCount: 0,
    downloaded: true,
  },
  {
    id: "pi-10",
    number: "00010",
    description: "Patch and paint damaged drywall in stairwell B",
    status: "OPEN",
    location: "Interior/3rd Floor/Stairwell B",
    dueDate: "7/16/26",
    assigneeCount: 1,
    commentCount: 2,
    downloaded: true,
  },
  {
    id: "pi-09",
    number: "00009",
    description: "Missing door hardware on room 309",
    status: "OPEN",
    location: "Interior/3rd Floor/Area B/309",
    dueDate: "7/14/26",
    assigneeCount: 1,
    commentCount: 1,
    downloaded: true,
  },
  {
    id: "pi-08",
    number: "00008",
    description: "Touch up paint at main lobby ceiling",
    status: "OPEN",
    location: "Interior/1st Floor/Lobby",
    dueDate: "7/12/26",
    assigneeCount: 2,
    commentCount: 0,
    downloaded: true,
  },
  {
    id: "pi-07",
    number: "00007",
    description: "Replace cracked floor tile near elevator bank",
    status: "OPEN",
    location: "Interior/2nd Floor/Area A",
    dueDate: "7/11/26",
    assigneeCount: 1,
    commentCount: 1,
    downloaded: true,
  },
  {
    id: "pi-06",
    number: "00006",
    description: "Caulk gap at curtain wall base",
    status: "OPEN",
    location: "Exterior/South Elevation",
    dueDate: "7/10/26",
    assigneeCount: 1,
    commentCount: 0,
    downloaded: true,
  },
  {
    id: "pi-05",
    number: "00005",
    description: "Verify roof drain clears correctly at northeast corner",
    status: "OPEN",
    location: "Exterior/Roof/NE Corner",
    dueDate: "7/8/26",
    assigneeCount: 1,
    commentCount: 2,
    downloaded: true,
  },
  {
    id: "pi-04",
    number: "00004",
    description: "Install missing light diffuser in conference room 210",
    status: "OPEN",
    location: "Interior/2nd Floor/Area C/210",
    dueDate: "7/7/26",
    assigneeCount: 1,
    commentCount: 1,
    downloaded: true,
  },
  {
    id: "pi-03",
    number: "00003",
    description: "HVAC diffuser misaligned in open office plan area",
    status: "CLOSED",
    location: "Interior/2nd Floor/Open Office",
    dueDate: "6/27/26",
    assigneeCount: 1,
    commentCount: 3,
    downloaded: true,
  },
  {
    id: "pi-02",
    number: "00002",
    description: "Water stain on ceiling tile in break room",
    status: "CLOSED",
    location: "Interior/1st Floor/Break Room",
    dueDate: "6/20/26",
    assigneeCount: 2,
    commentCount: 2,
    downloaded: true,
  },
  {
    id: "pi-01",
    number: "00001",
    description: "Verify sill flashing at west entrance",
    status: "CLOSED",
    location: "Exterior/West Entrance",
    dueDate: "6/12/26",
    assigneeCount: 1,
    commentCount: 1,
    downloaded: true,
  },
];

export const PUNCH_SUMMARY = {
  total: 14,
  downloaded: 10,
};

// ─── getMockRecords ───────────────────────────────────────────────────────────

/** Convert punch items to the generic MobileRecord shape */
function punchItemsAsRecords(): MobileRecord[] {
  return PUNCH_ITEMS.map((p) => ({
    id: p.id,
    number: p.number,
    title: p.description,
    status: p.status,
    location: p.location,
    dueDate: p.dueDate,
    assigneeCount: p.assigneeCount,
    commentCount: p.commentCount,
    downloaded: p.downloaded,
  }));
}

const STUB_RECORDS: Record<string, MobileRecord[]> = {
  rfis: [
    { id: "rfi-14", number: "00014", title: "Clarify waterproofing detail at planter edge", status: "SUBMITTED", location: "Exterior/Level 2 Deck", dueDate: "7/12/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "rfi-13", number: "00013", title: "Confirm structural connection detail at grid C4", status: "SUBMITTED", location: "Structural/4th Floor", dueDate: "7/9/26", assigneeCount: 2, commentCount: 3, downloaded: true },
    { id: "rfi-12", number: "00012", title: "Clarify MEP routing above drop ceiling L2", status: "OPEN", location: "MEP/2nd Floor", dueDate: "7/15/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "rfi-11", number: "00011", title: "Window sill flashing specification", status: "OPEN", location: "Exterior/North", dueDate: "7/18/26", assigneeCount: 1, commentCount: 0, downloaded: true },
    { id: "rfi-10", number: "00010", title: "Verify concrete mix design submittal", status: "CLOSED", dueDate: "6/20/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "rfi-09", number: "00009", title: "Coordinate elevator sill with finish floor", status: "CLOSED", location: "Interior/Lobby", dueDate: "6/12/26", assigneeCount: 1, commentCount: 1, downloaded: false },
  ],
  checklists: [
    { id: "cl-05", number: "00005", title: "Pre-pour concrete inspection — Level 3 deck", status: "IN PROGRESS", location: "Structural/3rd Floor", dueDate: "7/11/26", assigneeCount: 2, commentCount: 0, downloaded: true },
    { id: "cl-04", number: "00004", title: "Roofing installation quality checklist", status: "IN PROGRESS", location: "Exterior/Roof", dueDate: "7/16/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "cl-03", number: "00003", title: "Fire stopping inspection — Level 2", status: "COMPLETE", location: "Interior/2nd Floor", dueDate: "6/28/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "cl-02", number: "00002", title: "Exterior waterproofing sign-off", status: "COMPLETE", dueDate: "6/18/26", assigneeCount: 1, commentCount: 1, downloaded: false },
    { id: "cl-01", number: "00001", title: "Framing rough-in inspection — Level 1", status: "COMPLETE", location: "Structural/1st Floor", dueDate: "6/5/26", assigneeCount: 2, commentCount: 3, downloaded: false },
  ],
  "action-items": [
    { id: "ai-06", number: "00006", title: "Schedule utility coordination meeting with city", status: "OPEN", dueDate: "7/14/26", assigneeCount: 1, commentCount: 0, downloaded: true },
    { id: "ai-05", number: "00005", title: "Obtain updated geotechnical report for east wing", status: "OPEN", dueDate: "7/11/26", assigneeCount: 2, commentCount: 1, downloaded: true },
    { id: "ai-04", number: "00004", title: "Confirm steel delivery schedule with fabricator", status: "OPEN", dueDate: "7/9/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "ai-03", number: "00003", title: "Update site safety plan for crane operation", status: "CLOSED", dueDate: "6/25/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "ai-02", number: "00002", title: "Review and approve subcontractor insurance certificates", status: "CLOSED", dueDate: "6/18/26", assigneeCount: 1, commentCount: 0, downloaded: false },
  ],
  issues: [
    { id: "iss-04", number: "00004", title: "Standing water accumulation on Level 2 slab", status: "OPEN", location: "Interior/2nd Floor", dueDate: "7/10/26", assigneeCount: 2, commentCount: 3, downloaded: true },
    { id: "iss-03", number: "00003", title: "Concrete honeycombing on column C2", status: "IN REVIEW", location: "Structural/1st Floor", dueDate: "7/7/26", assigneeCount: 2, commentCount: 4, downloaded: true },
    { id: "iss-02", number: "00002", title: "Unauthorized material storage in egress path", status: "CLOSED", location: "Interior/Stairwell A", dueDate: "6/22/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "iss-01", number: "00001", title: "Missing fall protection at roof opening", status: "CLOSED", location: "Exterior/Roof", dueDate: "6/8/26", assigneeCount: 1, commentCount: 2, downloaded: false },
  ],
  "notices-to-comply": [
    { id: "ntc-05", number: "00005", title: "Lighting in wrong location", status: "OPEN", location: "Interior/2nd Floor/Lobby", dueDate: "7/14/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "ntc-04", number: "00004", title: "Missing fire blocking at penetrations", status: "OPEN", location: "Interior/3rd Floor", dueDate: "7/11/26", assigneeCount: 1, commentCount: 0, downloaded: true },
    { id: "ntc-03", number: "00003", title: "Correct formwork shoring before next pour", status: "OPEN", location: "Structural/4th Floor", dueDate: "7/11/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "ntc-02", number: "00002", title: "Resolve site drainage issue on north side", status: "PENDING RESPONSE", location: "Exterior/North", dueDate: "7/7/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "ntc-01", number: "00001", title: "Remove improperly stored hazardous materials", status: "CLOSED", dueDate: "6/18/26", assigneeCount: 1, commentCount: 0, downloaded: false },
  ],
  "field-work-directives": [
    { id: "fwd-03", number: "00003", title: "Relocate electrical panel in room 312", status: "OPEN", location: "Interior/3rd Floor/312", dueDate: "7/11/26", assigneeCount: 2, commentCount: 1, downloaded: true },
    { id: "fwd-02", number: "00002", title: "Additional excavation requested", status: "OPEN", location: "Exterior/North Half Site", dueDate: "7/8/26", assigneeCount: 1, commentCount: 0, downloaded: true },
    { id: "fwd-01", number: "00001", title: "Install temporary HVAC for occupied floor", status: "CLOSED", dueDate: "6/18/26", assigneeCount: 1, commentCount: 2, downloaded: false },
  ],
  "safety-notices": [
    { id: "sn-04", number: "00004", title: "Crane swing radius — sidewalk barrier required", status: "OPEN", location: "Exterior/North", dueDate: "7/9/26", assigneeCount: 2, commentCount: 1, downloaded: true },
    { id: "sn-03", number: "00003", title: "Personal Safety Violation-eyewear", status: "OPEN", location: "Interior/Stairwell C", dueDate: "7/15/26", assigneeCount: 1, commentCount: 0, downloaded: true },
    { id: "sn-02", number: "00002", title: "Fall protection netting missing at roof Level 4", status: "OPEN", location: "Exterior/Roof/SE", dueDate: "7/7/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "sn-01", number: "00001", title: "Scaffold inspection overdue — Level 3 west face", status: "CLOSED", location: "Exterior/West", dueDate: "6/18/26", assigneeCount: 1, commentCount: 1, downloaded: false },
  ],

  "submittal-packages": [
    { id: "sp-04", number: "00004", title: "Structural Steel Package — Connections", status: "UNDER REVIEW", dueDate: "7/11/26", assigneeCount: 2, commentCount: 2, downloaded: true },
    { id: "sp-03", number: "00003", title: "Mechanical Equipment Package — AHU Units", status: "UNDER REVIEW", dueDate: "7/7/26", assigneeCount: 2, commentCount: 1, downloaded: true },
    { id: "sp-02", number: "00002", title: "Exterior Glazing Package", status: "APPROVED", dueDate: "6/25/26", assigneeCount: 1, commentCount: 3, downloaded: true },
    { id: "sp-01", number: "00001", title: "Concrete Mix Design Package", status: "APPROVED", dueDate: "6/5/26", assigneeCount: 1, commentCount: 2, downloaded: false },
  ],

  submittals: [
    { id: "sub-06", number: "00006", title: "Door Hardware Schedule — Level 3", status: "FOR REVIEW", location: "Interior/3rd Floor", dueDate: "7/11/26", assigneeCount: 2, commentCount: 0, downloaded: true },
    { id: "sub-05", number: "00005", title: "Roofing Membrane Product Data Sheet", status: "FOR REVIEW", dueDate: "7/9/26", assigneeCount: 1, commentCount: 1, downloaded: true },
    { id: "sub-04", number: "00004", title: "Structural Steel Shop Drawings — Grid Lines A-D", status: "REVISE AND RESUBMIT", dueDate: "7/2/26", assigneeCount: 2, commentCount: 4, downloaded: true },
    { id: "sub-03", number: "00003", title: "Exterior Aluminum Curtain Wall System", status: "APPROVED", dueDate: "6/25/26", assigneeCount: 1, commentCount: 2, downloaded: true },
    { id: "sub-02", number: "00002", title: "Concrete Reinforcement Shop Drawings", status: "APPROVED", dueDate: "6/12/26", assigneeCount: 1, commentCount: 1, downloaded: false },
    { id: "sub-01", number: "00001", title: "Site Concrete Mix Design", status: "APPROVED", dueDate: "5/28/26", assigneeCount: 1, commentCount: 0, downloaded: false },
  ],

  "daily-reports": [
    { id: "dr-05", number: "00005", title: "Daily Report — Today", status: "PENDING", dueDate: "7/9/26", assigneeCount: 1, commentCount: 0, downloaded: true, meta: { weatherTemp: 92, laborHours: "0h 0m", notesCount: 0 } },
    { id: "dr-04", number: "00004", title: "Daily Report — July 8, 2026", status: "PENDING", dueDate: "7/8/26", assigneeCount: 1, commentCount: 1, downloaded: true, meta: { weatherTemp: 91, laborHours: "0h 0m", notesCount: 0 } },
    { id: "dr-03", number: "00003", title: "Daily Report — July 7, 2026", status: "PENDING", dueDate: "7/7/26", assigneeCount: 1, commentCount: 0, downloaded: true, meta: { weatherTemp: 84, laborHours: "0h 0m", notesCount: 0 } },
    { id: "dr-02", number: "00002", title: "Daily Report — July 6, 2026", status: "PENDING", dueDate: "7/6/26", assigneeCount: 1, commentCount: 0, downloaded: false, meta: { weatherTemp: 79, laborHours: "0h 0m", notesCount: 0 } },
    { id: "dr-01", number: "00001", title: "Daily Report — July 5, 2026", status: "PENDING", dueDate: "7/5/26", assigneeCount: 1, commentCount: 0, downloaded: false, meta: { weatherTemp: 76, laborHours: "0h 0m", notesCount: 0 } },
  ],
};

export function getMockRecords(type: string): MobileRecord[] {
  if (type === "punch-items") return punchItemsAsRecords();
  return STUB_RECORDS[type] ?? [];
}

export function getMockRecordSummary(type: string): { total: number; downloaded: number } {
  const records = getMockRecords(type);
  return {
    total: records.length,
    downloaded: records.filter((r) => r.downloaded).length,
  };
}

// ─── Companies ───────────────────────────────────────────────────────────────

export const MOCK_COMPANIES = [
  "None",
  "Acme South, LLC",
  "Pacific NW",
  "Fransen Pittman",
  "Sletten Construction of Nevada",
  "Sample Company",
  "Trimble",
];

// ─── Locations ────────────────────────────────────────────────────────────────

export interface MockLocation {
  name: string;
  fullPath: string;
}

export const MOCK_LOCATIONS: MockLocation[] = [
  { name: "Exterior", fullPath: "Exterior" },
  { name: "North Half Site", fullPath: "Exterior/North Half Site" },
  { name: "Test", fullPath: "Exterior/North Half Site/Test" },
  { name: "South Half Site", fullPath: "Exterior/South Half Site" },
  { name: "Interior", fullPath: "Interior" },
  { name: "1st Floor", fullPath: "Interior/1st Floor" },
  { name: "Area A", fullPath: "Interior/1st Floor/Area A" },
  { name: "104", fullPath: "Interior/1st Floor/Area A/104" },
  { name: "104A", fullPath: "Interior/1st Floor/Area A/104A" },
  { name: "105", fullPath: "Interior/1st Floor/Area A/105" },
  { name: "106", fullPath: "Interior/1st Floor/Area A/106" },
  { name: "107", fullPath: "Interior/1st Floor/Area A/107" },
  { name: "Area B", fullPath: "Interior/1st Floor/Area B" },
  { name: "108", fullPath: "Interior/1st Floor/Area B/108" },
  { name: "109", fullPath: "Interior/1st Floor/Area B/109" },
  { name: "Lobby", fullPath: "Interior/1st Floor/Lobby" },
  { name: "Break Room", fullPath: "Interior/1st Floor/Break Room" },
  { name: "2nd Floor", fullPath: "Interior/2nd Floor" },
  { name: "Area A", fullPath: "Interior/2nd Floor/Area A" },
  { name: "Area B", fullPath: "Interior/2nd Floor/Area B" },
  { name: "Area C", fullPath: "Interior/2nd Floor/Area C" },
  { name: "210", fullPath: "Interior/2nd Floor/Area C/210" },
  { name: "Open Office", fullPath: "Interior/2nd Floor/Open Office" },
  { name: "3rd Floor", fullPath: "Interior/3rd Floor" },
  { name: "Area B", fullPath: "Interior/3rd Floor/Area B" },
  { name: "309", fullPath: "Interior/3rd Floor/Area B/309" },
  { name: "Stairwell B", fullPath: "Interior/3rd Floor/Stairwell B" },
  { name: "4th Floor", fullPath: "Interior/4th Floor" },
  { name: "Area C", fullPath: "Interior/4th Floor/Area C" },
  { name: "406", fullPath: "Interior/4th Floor/Area C/406" },
  { name: "420", fullPath: "Interior/4th Floor/Area C/420" },
  { name: "Roof", fullPath: "Exterior/Roof" },
  { name: "NE Corner", fullPath: "Exterior/Roof/NE Corner" },
  { name: "SE Corner", fullPath: "Exterior/Roof/SE Corner" },
];

// ─── Contact / Assignee ───────────────────────────────────────────────────────

export interface MockContact {
  id: string;
  name: string;
  company: string;
  initials: string;
}

export const MOCK_CONTACTS: MockContact[] = [
  { id: "c1", name: "Paula Standley", company: "Sample Company", initials: "PS" },
  { id: "c2", name: "Scott Casey", company: "Sample Company", initials: "SC" },
  { id: "c3", name: "Frank Ochoa", company: "Acme South, LLC", initials: "FO" },
  { id: "c4", name: "Sarah Chen", company: "Pacific NW", initials: "SC" },
  { id: "c5", name: "Mike Kowalski", company: "Fransen Pittman", initials: "MK" },
  { id: "c6", name: "Lisa Reyes", company: "Acme South, LLC", initials: "LR" },
  { id: "c7", name: "Julian Lavine", company: "Trimble", initials: "JL" },
  { id: "c8", name: "Ben Torres", company: "Sletten Construction of Nevada", initials: "BT" },
  { id: "c9", name: "Alex Vance", company: "Pacific NW", initials: "AV" },
];

export interface Assignee {
  id: string;
  name: string;
  company: string;
  dueDate: string;
  isDone: boolean;
  doneDate?: string;
}

/** Deterministically generate mock assignees for a record */
export function getAssigneesForRecord(recordId: string, count: number): Assignee[] {
  let h = 0;
  for (let i = 0; i < recordId.length; i++) h = (h * 31 + recordId.charCodeAt(i)) >>> 0;
  return Array.from({ length: Math.min(count, MOCK_CONTACTS.length) }, (_, i) => {
    const contact = MOCK_CONTACTS[(h + i) % MOCK_CONTACTS.length];
    const isDone = i > 0 && (h + i) % 3 === 0;
    return {
      id: `${recordId}-a${i}`,
      name: contact.name,
      company: contact.company,
      dueDate: "7/18/26",
      isDone,
      doneDate: isDone ? "7/7/26" : undefined,
    };
  });
}

// ─── Record Form Data ─────────────────────────────────────────────────────────

export interface RecordComment {
  id: string;
  authorName: string;
  authorInitials: string;
  date: string;
  /** Optional badge label, e.g. "Resolution", "Note" */
  badge?: string;
  badgeColor?: string;
  text: string;
}

export interface RecordFormExtras {
  locationMain?: string;
  locationDetail?: string;
  responsibleCompany: string;
  assignedTo?: string;
  cc?: string;
  type?: string;
  importance: string;
  referencesCount: number;
  hasDrawingReference: boolean;
  comments: RecordComment[];
  linkedRecordsCount: number;
}

/** Deterministic mock form extras derived from record ID */
export function getMockFormExtras(recordId: string): RecordFormExtras {
  const PEOPLE = [
    "Paula Standley (Sa...",
    "James Ochoa (Acme...",
    "Sarah Chen (Pacific...",
    "Mike Torres (Frauen...",
    "Lisa Park (Sletten...",
  ];
  const TYPES_BY_MODULE: Record<string, string[]> = {
    punch: ["Work Completion", "Deficiency", "Warranty", "Inspection"],
    rfi: ["Architecture", "Structural", "MEP", "Civil"],
    default: ["Standard", "Urgent", "Informational"],
  };
  const IMPORTANCE = ["Normal", "High", "Low"];

  // Contextual comment pools per badge type
  const RESOLUTION_TEXTS = [
    "Work verified on site and accepted. Subcontractor confirmed completion to spec.",
    "Deficiency corrected. Reinspection completed — no further action required.",
    "Contractor completed repairs. Photo documentation uploaded for record.",
    "Reviewed with superintendent and owner rep. Item accepted and closed.",
    "Installation confirmed compliant with drawings. Marked complete.",
    "Punch item resolved. Final walk conducted with architect on 7/7/26.",
  ];
  const NOTE_TEXTS = [
    "Similar issue observed at adjacent location — tracking under separate item.",
    "Owner requested additional documentation before this can be closed.",
    "Coordinate with MEP sub prior to covering ceiling in this area.",
    "Follow-up required at next site visit. Schedule with GC foreman.",
    "Materials back-ordered — contractor to confirm revised completion date.",
    "Flagged for architect review during next scheduled site observation.",
  ];
  const RESPONSE_TEXTS = [
    "Acknowledged. Crew scheduled for next week. Will notify upon completion.",
    "Reviewed drawing set — detail at grid C4 to be clarified by EOR. RFI forthcoming.",
    "Work is in progress. Estimated completion by end of week.",
    "Submitted change order request per contract. Awaiting owner approval.",
    "Confirmed with superintendent — crew assigned, materials on order.",
    "Sub notified. They will mobilize once prior scope in this area is complete.",
  ];
  const PLAIN_TEXTS = [
    "Discussed with contractor on site. They are aware and have it on their punch list.",
    "Added to next OAC agenda for owner decision.",
    "This has been an ongoing issue — second occurrence in this zone.",
    "Per the spec section 07900 — sealant must be compatible with substrate.",
    "Photographs taken and shared with design team.",
    "Waiting on material sample approval from architect before proceeding.",
  ];

  // Comment author pool
  const AUTHORS = [
    { name: "Jesse Lavine", initials: "JL" },
    { name: "Frank Ochoa", initials: "FO" },
    { name: "Sarah Chen", initials: "SC" },
    { name: "Paula Standley", initials: "PS" },
    { name: "Mike Kowalski", initials: "MK" },
  ];

  const DATES = [
    "June 5, 2026",
    "June 12, 2026",
    "June 18, 2026",
    "June 25, 2026",
    "July 1, 2026",
    "July 3, 2026",
    "July 7, 2026",
    "July 9, 2026",
  ];

  const BADGE_DEFS = [
    { label: "Resolution", color: "#16a34a", pool: RESOLUTION_TEXTS },
    { label: "Note",       color: "#2563eb", pool: NOTE_TEXTS },
    { label: "Response",   color: "#d97706", pool: RESPONSE_TEXTS },
  ] as const;

  // Simple hash for determinism
  let h = 0;
  for (let i = 0; i < recordId.length; i++) h = (h * 31 + recordId.charCodeAt(i)) >>> 0;

  const person = PEOPLE[h % PEOPLE.length];
  const importance = IMPORTANCE[h % IMPORTANCE.length];
  const types = recordId.startsWith("rfi") ? TYPES_BY_MODULE.rfi : TYPES_BY_MODULE.punch;
  const type = recordId.startsWith("fwd") ? "Cost Control Item"
    : recordId.startsWith("ntc") ? ["Wrong Location", "Wrong Material", "Missing Work", "Non-Conformance"][h % 4]
    : types[h % types.length];
  const referencesCount = (h % 3) + 1;

  // Generate 1–3 contextual comments
  const commentCount = (h % 3) + 1;
  const comments: RecordComment[] = [];

  for (let i = 0; i < commentCount; i++) {
    const seed = (h + i * 7919) >>> 0;
    const author = AUTHORS[seed % AUTHORS.length];
    const date = DATES[seed % DATES.length];
    const hasBadge = i === commentCount - 1; // last comment gets the badge
    const badgeDef = BADGE_DEFS[seed % BADGE_DEFS.length];
    const textPool = hasBadge ? badgeDef.pool : PLAIN_TEXTS;
    const text = textPool[(seed >>> 4) % textPool.length];

    comments.push({
      id: `${recordId}-c${i + 1}`,
      authorName: author.name,
      authorInitials: author.initials,
      date,
      ...(hasBadge ? { badge: badgeDef.label, badgeColor: badgeDef.color } : {}),
      text,
    });
  }

  return {
    responsibleCompany: h % 3 === 0 ? "Acme South, LLC" : "None",
    assignedTo: person,
    type,
    importance,
    referencesCount,
    hasDrawingReference: referencesCount > 0,
    comments,
    linkedRecordsCount: h % 4,
  };
}

// ─── Specifications ──────────────────────────────────────────────────────────

export interface SpecSection {
  id: string;
  code: string;
  title: string;
  revision: string;
  status: "Current" | "Superseded" | "Draft";
  group: string;
  division: string;
  discipline: string;
  issueDate: string;
  receivedDate: string;
  specSet: string;
  downloaded: boolean;
  /** Path to PDF rendered in viewer; falls back to default spec PDF */
  pdfPath?: string;
}

export interface SpecDivision {
  id: string;
  code: string;
  title: string;
  sections: SpecSection[];
}

const SPEC_PDF = "/specs/033000-CAST-IN-PLACE-CONCRETE.pdf";

export const SPEC_DIVISIONS: SpecDivision[] = [
  {
    id: "div00", code: "00", title: "00 - Procurement and Contracting Requirements",
    sections: [
      { id: "s000000", code: "000000", title: "TOC", revision: "01", status: "Current", group: "n/a", division: "00 - Procurement and Contracting Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: true, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div01", code: "01", title: "01 - General Requirements",
    sections: [
      { id: "s011000", code: "011000", title: "SUMMARY", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s012000", code: "012000", title: "PRICE AND PAYMENT PROCEDURES", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s013000", code: "013000", title: "ADMINISTRATIVE REQUIREMENTS", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s014000", code: "014000", title: "QUALITY REQUIREMENTS", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s015000", code: "015000", title: "TEMPORARY FACILITIES AND CONTROLS", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s016000", code: "016000", title: "PRODUCT REQUIREMENTS", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s017000", code: "017000", title: "EXECUTION AND CLOSEOUT REQUIREMENTS", revision: "01", status: "Current", group: "n/a", division: "01 - General Requirements", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div03", code: "03", title: "03 - Concrete",
    sections: [
      { id: "s030000", code: "030000", title: "CONCRETE", revision: "01", status: "Current", group: "n/a", division: "03 - Concrete", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s033000", code: "033000", title: "CAST-IN-PLACE CONCRETE", revision: "01", status: "Current", group: "n/a", division: "03 - Concrete", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s034500", code: "034500", title: "PRECAST STRUCTURAL CONCRETE", revision: "01", status: "Current", group: "n/a", division: "03 - Concrete", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div04", code: "04", title: "04 - Masonry",
    sections: [
      { id: "s042000", code: "042000", title: "UNIT MASONRY", revision: "01", status: "Current", group: "n/a", division: "04 - Masonry", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s047200", code: "047200", title: "CAST STONE MASONRY", revision: "01", status: "Current", group: "n/a", division: "04 - Masonry", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div05", code: "05", title: "05 - Metals",
    sections: [
      { id: "s050000", code: "050000", title: "COMMON WORK RESULTS FOR METALS", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s051200", code: "051200", title: "STRUCTURAL STEEL FRAMING", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s053100", code: "053100", title: "STEEL DECKING", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Structural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s054000", code: "054000", title: "COLD-FORMED METAL FRAMING", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s055000", code: "055000", title: "METAL FABRICATIONS", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s057000", code: "057000", title: "DECORATIVE METAL", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s058000", code: "058000", title: "EXPANSION CONTROL", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s059000", code: "059000", title: "METAL RESTORATION AND CLEANING", revision: "01", status: "Current", group: "n/a", division: "05 - Metals", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div06", code: "06", title: "06 - Wood, Plastics, and Composites",
    sections: [
      { id: "s061000", code: "061000", title: "ROUGH CARPENTRY", revision: "01", status: "Current", group: "n/a", division: "06 - Wood, Plastics, and Composites", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s062000", code: "062000", title: "FINISH CARPENTRY", revision: "01", status: "Current", group: "n/a", division: "06 - Wood, Plastics, and Composites", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s064000", code: "064000", title: "ARCHITECTURAL WOODWORK", revision: "01", status: "Current", group: "n/a", division: "06 - Wood, Plastics, and Composites", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s066000", code: "066000", title: "FIBERGLASS REINFORCED PANELS", revision: "01", status: "Current", group: "n/a", division: "06 - Wood, Plastics, and Composites", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div07", code: "07", title: "07 - Thermal and Moisture Protection",
    sections: [
      { id: "s071000", code: "071000", title: "DAMP PROOFING AND WATERPROOFING", revision: "01", status: "Current", group: "n/a", division: "07 - Thermal and Moisture Protection", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s072000", code: "072000", title: "THERMAL PROTECTION", revision: "01", status: "Current", group: "n/a", division: "07 - Thermal and Moisture Protection", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s074000", code: "074000", title: "ROOFING AND SIDING PANELS", revision: "01", status: "Current", group: "n/a", division: "07 - Thermal and Moisture Protection", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s075000", code: "075000", title: "MEMBRANE ROOFING", revision: "01", status: "Current", group: "n/a", division: "07 - Thermal and Moisture Protection", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div08", code: "08", title: "08 - Openings",
    sections: [
      { id: "s081000", code: "081000", title: "DOORS AND FRAMES", revision: "01", status: "Current", group: "n/a", division: "08 - Openings", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s083000", code: "083000", title: "SPECIALTY DOORS AND FRAMES", revision: "01", status: "Current", group: "n/a", division: "08 - Openings", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s084000", code: "084000", title: "ENTRANCES, STOREFRONTS, AND CURTAIN WALLS", revision: "01", status: "Current", group: "n/a", division: "08 - Openings", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s087000", code: "087000", title: "HARDWARE", revision: "01", status: "Current", group: "n/a", division: "08 - Openings", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div09", code: "09", title: "09 - Finishes",
    sections: [
      { id: "s092000", code: "092000", title: "PLASTER AND GYPSUM BOARD", revision: "01", status: "Current", group: "n/a", division: "09 - Finishes", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s093000", code: "093000", title: "TILING", revision: "01", status: "Current", group: "n/a", division: "09 - Finishes", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s096000", code: "096000", title: "FLOORING", revision: "01", status: "Current", group: "n/a", division: "09 - Finishes", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s099000", code: "099000", title: "PAINTS AND COATINGS", revision: "01", status: "Current", group: "n/a", division: "09 - Finishes", discipline: "Architectural", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div10", code: "10", title: "10 - Specialties",
    sections: [
      { id: "s101000", code: "101000", title: "VISUAL DISPLAY UNITS", revision: "01", status: "Current", group: "n/a", division: "10 - Specialties", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s102000", code: "102000", title: "PARTITIONS", revision: "01", status: "Current", group: "n/a", division: "10 - Specialties", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s104000", code: "104000", title: "SAFETY SPECIALTIES", revision: "01", status: "Current", group: "n/a", division: "10 - Specialties", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div11", code: "11", title: "11 - Equipment",
    sections: [
      { id: "s111000", code: "111000", title: "VEHICLE AND PEDESTRIAN EQUIPMENT", revision: "01", status: "Current", group: "n/a", division: "11 - Equipment", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s113000", code: "113000", title: "COMMERCIAL EQUIPMENT", revision: "01", status: "Current", group: "n/a", division: "11 - Equipment", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s116000", code: "116000", title: "THEATRE AND STAGE EQUIPMENT", revision: "01", status: "Current", group: "n/a", division: "11 - Equipment", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
  {
    id: "div12", code: "12", title: "12 - Furnishings",
    sections: [
      { id: "s122000", code: "122000", title: "WINDOW TREATMENTS", revision: "01", status: "Current", group: "n/a", division: "12 - Furnishings", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s124000", code: "124000", title: "FURNISHINGS AND ACCESSORIES", revision: "01", status: "Current", group: "n/a", division: "12 - Furnishings", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
      { id: "s126000", code: "126000", title: "MULTIPLE SEATING", revision: "01", status: "Current", group: "n/a", division: "12 - Furnishings", discipline: "", issueDate: "1/19/21", receivedDate: "1/19/21", specSet: "sample specs 3", downloaded: false, pdfPath: SPEC_PDF },
    ],
  },
];

// ─── AI Centric Mode — Weather & Recent Records ──────────────────────────────

export interface HourlyWeather {
  hour: string;
  temp: number;
  condition: string;
  icon: string;
}

export const HOURLY_WEATHER: HourlyWeather[] = [
  { hour: "6 AM",  temp: 64, condition: "Clear",         icon: "🌤" },
  { hour: "7 AM",  temp: 67, condition: "Sunny",         icon: "☀️" },
  { hour: "8 AM",  temp: 72, condition: "Sunny",         icon: "☀️" },
  { hour: "9 AM",  temp: 76, condition: "Partly Cloudy", icon: "⛅" },
  { hour: "10 AM", temp: 80, condition: "Partly Cloudy", icon: "⛅" },
  { hour: "11 AM", temp: 83, condition: "Mostly Sunny",  icon: "🌤" },
  { hour: "12 PM", temp: 86, condition: "Sunny",         icon: "☀️" },
  { hour: "1 PM",  temp: 88, condition: "Sunny",         icon: "☀️" },
  { hour: "2 PM",  temp: 89, condition: "Mostly Sunny",  icon: "🌤" },
  { hour: "3 PM",  temp: 87, condition: "Partly Cloudy", icon: "⛅" },
  { hour: "4 PM",  temp: 84, condition: "Partly Cloudy", icon: "⛅" },
  { hour: "5 PM",  temp: 80, condition: "Clear",         icon: "🌤" },
  { hour: "6 PM",  temp: 76, condition: "Clear",         icon: "🌙" },
];

export const RECENT_RFIS: MobileRecord[] = [
  {
    id: "rfi-011",
    number: "RFI-011",
    title: "Confirm structural connection detail at grid C4",
    status: "Open",
    location: "Level 2 — Grid C4",
    dueDate: "07/17/26",
    assigneeCount: 1,
    commentCount: 2,
    downloaded: true,
  },
  {
    id: "rfi-012",
    number: "RFI-012",
    title: "Clarify fire-stopping assembly at MEP penetrations",
    status: "Open",
    location: "Level 3 — Mechanical Room",
    dueDate: "07/19/26",
    assigneeCount: 2,
    commentCount: 1,
    downloaded: true,
  },
  {
    id: "rfi-013",
    number: "RFI-013",
    title: "Window sill flashing detail — west elevation",
    status: "Open",
    location: "West Elevation",
    dueDate: "07/22/26",
    assigneeCount: 1,
    commentCount: 0,
    downloaded: true,
  },
];
