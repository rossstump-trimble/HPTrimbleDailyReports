export interface NavItem {
  value: string;
  label: string;
  icon: string;
}

export interface SelectedTeamMember {
  id: string;
  name: string;
  type: "user" | "group";
  role: "admin" | "member" | "viewer";
  avatar?: string;
}

export interface ProjectAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface MapCenter {
  lat: number;
  lng: number;
  zoom: number;
}

export interface CoordinateSystem {
  type: string;
  epsgCode: string;
}

export interface Integration {
  id: string;
  name: string;
  type:
    | "Trimble"
    | "Microsoft"
    | "AWS"
    | "Other"
    | "Google"
    | "Storage"
    | "PowerBI";
  logo: string;
  description: string;
  status?: "connected" | "disconnected" | "error" | "pending";
}
