"use client";
import {
  User,
  Group,
  users,
  groups,
  searchUsers,
  searchGroups,
  getGroupsByClassification,
} from "@/data/users";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Users } from "lucide-react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

interface SearchResult {
  id: string;
  name: string;
  type: "user" | "group";
  email?: string;
  avatar?: string;
}

interface SelectedEntity {
  id: string;
  name: string;
  type: "user" | "group";
  email?: string;
}

interface ShareDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  itemCount?: number;
  itemType: "file" | "folder" | "results" | "project";
  fileId?: string | string[];
}

export default function ShareDataDialog({
  open,
  onOpenChange,
  itemName,
  itemCount,
  itemType,
  fileId,
}: ShareDataDialogProps) {
  const { toast } = useToast();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase =
    supabaseUrl && supabaseKey
      ? createBrowserClient(supabaseUrl, supabaseKey)
      : null;
  const [shareOption, setShareOption] = useState("specific");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>(
    []
  );
  const [note, setNote] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Handle search input changes
  useEffect(() => {
    async function searchEntities() {
      if (searchQuery.length === 0) {
        setSearchResults([]);
        return;
      }
      if (!supabase) return;
      const [{ data: matchedUsers }, { data: matchedGroups }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, name, email, avatar")
            .ilike("name", `%${searchQuery}%`)
            .limit(5),
          supabase
            .from("groups")
            .select("id, name")
            .ilike("name", `%${searchQuery}%`)
            .limit(5),
        ]);

      const formattedUsers = (matchedUsers || []).map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        type: "user" as const,
      }));

      const formattedGroups = (matchedGroups || []).map((group) => ({
        id: group.id,
        name: group.name,
        type: "group" as const,
      }));

      setSearchResults([...formattedUsers, ...formattedGroups]);
    }

    searchEntities();
  }, [searchQuery, supabase]);

  // Add user or group to the selected list
  const handleAddEntity = (entity: SearchResult) => {
    const newEntity: SelectedEntity = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      email: entity.email,
    };

    if (
      !selectedEntities.some(
        (e) => e.id === entity.id && e.type === entity.type
      )
    ) {
      setSelectedEntities([...selectedEntities, newEntity]);
    }
    setSearchQuery(""); // Clear search after selection
  };

  // Remove entity from selection
  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities(selectedEntities.filter((e) => e.id !== entityId));
  };

  const handleShare = async () => {
    if (!fileId) {
      toast({
        title: "Error",
        description: "No files selected for sharing",
        variant: "destructive",
      });
      return;
    }
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase is not configured",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      const fileIds = Array.isArray(fileId) ? fileId : [fileId];

      // Create sharing records for each file
      const sharingPromises = fileIds.map(async (id) => {
        // 1. Create or update the file sharing record
        const { data: fileSharing, error: fileSharingError } = await supabase
          .from("file_sharing")
          .upsert(
            {
              file_id: id,
              sharing_method: shareOption as "specific" | "specific2" | "all",
              note,
              created_by: "anonymous",
            },
            {
              onConflict: "file_id",
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (fileSharingError) throw fileSharingError;

        // 2. If specific sharing, handle members and groups
        if (shareOption === "specific" && fileSharing) {
          // First, delete existing members and groups for this share
          await Promise.all([
            supabase
              .from("file_sharing_members")
              .delete()
              .eq("file_sharing_id", fileSharing.id),
            supabase
              .from("file_sharing_groups")
              .delete()
              .eq("file_sharing_id", fileSharing.id),
          ]);

          // Then add new members - use email from selectedEntities
          const memberPromises = selectedEntities
            .filter((entity) => entity.type === "user")
            .map((user) => ({
              file_sharing_id: fileSharing.id,
              email: user.email,
            }))
            .filter((member) => member.email) // Only include if email exists
            .map((member) =>
              supabase.from("file_sharing_members").upsert(member)
            );

          // Add new groups - directly use the group IDs from selection
          const groupPromises = selectedEntities
            .filter((entity) => entity.type === "group")
            .map((group) => ({
              file_sharing_id: fileSharing.id,
              group_id: group.id,
            }))
            .map((group) => supabase.from("file_sharing_groups").upsert(group));

          await Promise.all([...memberPromises, ...groupPromises]);
        }

        return fileSharing;
      });

      await Promise.all(sharingPromises);

      onOpenChange(false);
      toast({
        title: "Shared successfully",
        description: `${fileIds.length} ${
          fileIds.length === 1 ? "file has" : "files have"
        } been shared with the selected members.`,
        className: "bg-green-800 text-background dark:text-white",
        duration: 2000,
      });
    } catch (error) {
      console.error("Sharing error:", error);
      toast({
        title: "Error sharing files",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while sharing",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-secondary ring-1 dark:ring-slate-700 p-8">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1">
            {itemCount ? (
              <>
                <span className="text-lg font-semibold">
                  {itemType === "results"
                    ? "Share Results"
                    : itemType === "file"
                    ? "Share File"
                    : itemType === "project"
                    ? "Share Files"
                    : `Share ${itemType}`}
                </span>
                <span className="text-base font-normal text-muted-foreground">
                  {itemCount}{" "}
                  {itemType === "results"
                    ? "item"
                    : itemType === "project"
                    ? "file"
                    : itemType}
                  {itemCount === 1 ? "" : "s"}{" "}
                  {itemType === "results" ? "found" : "selected"}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-semibold">
                  {itemType === "results"
                    ? "Share Results"
                    : itemType === "file"
                    ? "Share File"
                    : itemType === "project"
                    ? "Share Files"
                    : `Share ${itemType}`}
                </span>
                <span className="text-base font-normal text-muted-foreground">
                  {itemName}
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <h3 className="text-xs font-medium">Share with</h3>
            <Select value={shareOption} onValueChange={setShareOption}>
              <SelectTrigger id="share-with">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific">
                  Specific members of the project
                </SelectItem>
                <SelectItem value="specific2">
                  Signed in users with the link
                </SelectItem>
                <SelectItem value="all">All project members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareOption === "specific" && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium">People</h3>
              <div className="relative">
                <Input
                  id="people"
                  placeholder="Search users or groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && searchQuery && (
                  <div className="absolute w-full mt-1 bg-background border rounded-md shadow-lg z-50">
                    <ScrollArea className="h-[200px]">
                      <div className="p-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="p-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                            onClick={() => handleAddEntity(result)}
                          >
                            {result.type === "user" ? (
                              <Avatar className="h-6 w-6">
                                {result.avatar && (
                                  <Image
                                    src={result.avatar}
                                    alt={result.name}
                                    width={24}
                                    height={24}
                                  />
                                )}
                                <AvatarFallback>
                                  {result.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                            <span>{result.name}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {selectedEntities.length > 0 && (
                <ScrollArea className="h-48 border bg-background">
                  <div className="p-4 space-y-2">
                    {selectedEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between bg-muted p-2 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          {entity.type === "user" ? (
                            <Avatar className="h-12 w-12">
                              {users.find((u) => u.id === entity.id)?.avatar ? (
                                <Image
                                  src={
                                    users.find((u) => u.id === entity.id)
                                      ?.avatar || ""
                                  }
                                  alt={entity.name}
                                  className="h-full w-full object-cover"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <AvatarFallback className="bg-background">
                                  {entity.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ) : (
                            <Users className="h-6 w-6" />
                          )}
                          <span>{entity.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEntity(entity.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-medium">Note</h3>
            <Textarea
              id="note"
              placeholder="Add a message"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background"
            />
          </div>
          <p className="text-xs text-foreground">
            Note: Any access restrictions placed on the files are removed when
            the files are shared.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
