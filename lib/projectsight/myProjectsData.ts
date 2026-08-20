export interface ProjectItem {
  id: string;
  name: string;
  subtitle?: string;
  progress?: number;
  icon?: string;
}

export interface PortfolioItem {
  id: string;
  name: string;
  projectIds: string[];
}

export const MOCK_PROJECTS: ProjectItem[] = [
  { id: "1", name: "My Free Project", subtitle: "Trimble", progress: undefined },
  { id: "2", name: "Westminster Office Campus", subtitle: "Trimble Go", progress: 100 },
  { id: "3", name: "Sample", subtitle: "Pinnacle Sports", progress: undefined },
  { id: "4", name: "Kenan Civic Center", subtitle: "Trimble", progress: 20 },
];

export const MOCK_PORTFOLIOS: PortfolioItem[] = [
  { id: "p1", name: "BuildingPoint NorthEast", projectIds: ["1", "2", "3", "4"] },
];
