import { supabase } from "./supabase";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  type: "file";
  avatar?: string;
  lastActive: string;
  status: string;
  employer: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  classification: "team";
}

export async function fetchTeamMembers() {
  if (!supabase) {
    console.warn("Supabase client not available - environment variables may be missing");
    return [];
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("name");

  console.log("Fetched users:", users);

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }

  return users.map(
    (user): TeamMember => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "User",
      avatar: user.avatar,
      type: "file",
      lastActive: "2 hours ago",
      status: "Active",
      employer: "My Company",
    })
  );
}

export async function fetchGroups() {
  if (!supabase) {
    console.warn("Supabase client not available - environment variables may be missing");
    return [];
  }

  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  return groups;
}

interface DatabaseGroupMember {
  user_id: string;
  users: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

export async function fetchGroupMembers(
  groupId: string
): Promise<TeamMember[]> {
  if (!supabase) {
    console.warn("Supabase client not available - environment variables may be missing");
    return [];
  }

  const { data, error } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name,
        email,
        avatar,
        role
      )
    `
    )
    .eq("group_id", groupId);

  if (error) {
    console.error("Error fetching group members:", error);
    return [];
  }

  const members = data as unknown as DatabaseGroupMember[];

  return members.map((member) => ({
    id: member.users.id,
    name: member.users.name,
    email: member.users.email,
    avatar: member.users.avatar,
    role: member.users.role || "User",
    type: "file" as const,
    lastActive: "2 hours ago",
    status: "Active",
    employer: "My Company",
  }));
}
