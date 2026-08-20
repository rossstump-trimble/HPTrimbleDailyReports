export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: User[];
  classification: "team" | "permission";
}

export const users: User[] = [
  {
    id: "1",
    name: "Emma Johnson",
    email: "emma.johnson@company.com",
    role: "Admin",
    avatar: "/avatars/Emma.jpeg",
  },
  {
    id: "2",
    name: "Liam Williams",
    email: "liam.williams@company.com",
    role: "User",
    avatar: "/avatars/Liam.jpeg",
  },
  {
    id: "3",
    name: "Olivia Brown",
    email: "olivia.brown@company.com",
    role: "User",
    avatar: "/avatars/Olivia.jpeg",
  },
  {
    id: "4",
    name: "Noah Jones",
    email: "noah.jones@company.com",
    role: "User",
    avatar: "/avatars/Noah.jpeg",
  },
  {
    id: "5",
    name: "Sophia Davis",
    email: "sophia.davis@company.com",
    role: "Admin",
    avatar: "/avatars/Sophia.jpeg",
  },
  {
    id: "6",
    name: "James Wilson",
    email: "james.wilson@company.com",
    role: "User",
    avatar: "/avatars/James.jpeg",
  },
  {
    id: "7",
    name: "Isabella Martinez",
    email: "isabella.martinez@company.com",
    role: "User",
    avatar: "/avatars/Isabella.jpeg",
  },
  {
    id: "8",
    name: "Lucas Anderson",
    email: "lucas.anderson@company.com",
    role: "User",
    avatar: "/avatars/Lucas.jpeg",
  },
  {
    id: "9",
    name: "Mia Thompson",
    email: "mia.thompson@company.com",
    role: "Admin",
    avatar: "/avatars/Mia.jpeg",
  },
  {
    id: "10",
    name: "Alexander White",
    email: "alexander.white@company.com",
    role: "User",
    avatar: "/avatars/Alexander.jpeg",
  },
  {
    id: "11",
    name: "Charlotte Garcia",
    email: "charlotte.garcia@company.com",
    role: "User",
    avatar: "/avatars/Charlotte.jpeg",
  },
  {
    id: "12",
    name: "Benjamin Lee",
    email: "benjamin.lee@company.com",
    role: "User",
    avatar: "/avatars/Benjamin.jpeg",
  },
];

export const groups: Group[] = [
  {
    id: "pm",
    name: "Project Managers",
    description: "Project management team members",
    members: [users[0], users[4], users[8]], // Emma, Sophia, Mia
    classification: "team",
  },
  {
    id: "arch",
    name: "Architects",
    description: "Architectural team members",
    members: [users[1], users[5], users[9]], // Liam, James, Alexander
    classification: "team",
  },
  {
    id: "est",
    name: "Estimators",
    description: "Cost estimation team members",
    members: [users[3], users[7], users[11]], // Noah, Lucas, Benjamin
    classification: "team",
  },
  {
    id: "bim",
    name: "BIM Managers",
    description: "BIM management team members",
    members: [users[2], users[6], users[10]], // Olivia, Isabella, Charlotte
    classification: "team",
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Access to engineering documents and calculations",
    members: [
      users[2], // Olivia
      users[6], // Isabella
      users[3], // Noah
      users[7], // Lucas
    ],
    classification: "permission",
  },
  {
    id: "design",
    name: "Design",
    description: "Access to design files and assets",
    members: [
      users[1], // Liam
      users[5], // James
      users[9], // Alexander
      users[10], // Charlotte
    ],
    classification: "permission",
  },
  {
    id: "management",
    name: "Management",
    description: "Access to project management and financial documents",
    members: [
      users[0], // Emma
      users[4], // Sophia
      users[8], // Mia
      users[11], // Benjamin
    ],
    classification: "permission",
  },
  {
    id: "all_staff",
    name: "All Staff",
    description: "General access group for company-wide documents",
    members: [...users],
    classification: "permission",
  },
];

// Helper function to get all members of a group
export const getGroupMembers = (groupId: string): User[] => {
  const group = groups.find((g) => g.id === groupId);
  return group ? group.members : [];
};

// Helper function to get all groups a user belongs to
export const getUserGroups = (userId: string): Group[] => {
  return groups.filter((group) =>
    group.members.some((member) => member.id === userId)
  );
};

// Helper function to search users by name or email
export const searchUsers = (query: string): User[] => {
  const lowercaseQuery = query.toLowerCase();
  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
  );
};

// Helper function to search groups by name
export const searchGroups = (query: string): Group[] => {
  const lowercaseQuery = query.toLowerCase();
  return groups.filter(
    (group) =>
      group.name.toLowerCase().includes(lowercaseQuery) ||
      group.description.toLowerCase().includes(lowercaseQuery)
  );
};

// Modified helper function to get groups by classification
export const getGroupsByClassification = (
  classification: "team" | "permission"
): Group[] => {
  return groups.filter((group) => group.classification === classification);
};
