import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { SlidersHorizontal, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { users, groups } from "@/data/users";
import Image from "next/image";
import { DateRange } from "react-day-picker";

// Product options with logos
const products = [
  { id: "all", name: "All Products", image: "/logos/connect-light.svg" },
  { id: "connect", name: "Trimble Connect", image: "/logos/connect-light.svg" },
  { id: "analytics", name: "Analytics", image: "/logos/analytics.svg" },
  { id: "admin", name: "Admin Console", image: "/logos/admin.svg" },
  {
    id: "marketplace",
    name: "Marketplace",
    image: "/logos/marketplace-new.svg",
  },

  { id: "sketchup", name: "SketchUp", image: "/logos/sketchup.svg" },
];

interface OmniFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: any) => void;
  trigger: React.ReactNode;
}

export function OmniFilters({
  isOpen,
  onOpenChange,
  onApplyFilters,
  trigger,
}: OmniFiltersProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["all"]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [type, setType] = useState("any");
  const [location, setLocation] = useState("anywhere");
  const [dateModified, setDateModified] = useState("any-time");

  // Add collapse states
  const [productsOpen, setProductsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const handleReset = () => {
    setSelectedProducts(["all"]);
    setSelectedUsers([]);
    setType("any");
    setLocation("anywhere");
    setDateModified("any-time");
  };

  const handleApply = () => {
    onApplyFilters({
      products: selectedProducts,
      users: selectedUsers,
      type,
      location,
      dateModified,
    });
    onOpenChange(false);
  };

  const getSelectedProductsText = () => {
    if (selectedProducts.includes("all")) return "All Products";
    if (selectedProducts.length === 0) return "No products selected";
    if (selectedProducts.length === 1) {
      return products.find((p) => p.id === selectedProducts[0])?.name || "";
    }
    return `${selectedProducts.length} products selected`;
  };

  const getSelectedUsersText = () => {
    if (selectedUsers.length === 0) return "No users selected";
    if (selectedUsers.length === 1) {
      return users.find((u) => u.id === selectedUsers[0])?.name || "";
    }
    return `${selectedUsers.length} users selected`;
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" sideOffset={10} align="start">
        <div className="border-b border-border p-4 sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Search Filters</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Products Selection */}
          <div className="space-y-2 relative">
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              onClick={() => setProductsOpen(!productsOpen)}
            >
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Products</label>
                <span className="text-sm text-muted-foreground">
                  {getSelectedProductsText()}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  productsOpen && "rotate-180"
                )}
              />
            </Button>
            {productsOpen && (
              <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0">
                <Command className="border rounded-md shadow-md bg-popover">
                  <CommandInput placeholder="Search products..." />
                  <CommandEmpty>No products found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        onSelect={() => {
                          if (product.id === "all") {
                            setSelectedProducts(["all"]);
                          } else {
                            const newSelection = selectedProducts.includes(
                              product.id
                            )
                              ? selectedProducts.filter(
                                  (id) => id !== product.id
                                )
                              : [
                                  ...selectedProducts.filter(
                                    (id) => id !== "all"
                                  ),
                                  product.id,
                                ];
                            setSelectedProducts(
                              newSelection.length ? newSelection : ["all"]
                            );
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-5 h-5 relative">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span>{product.name}</span>
                        </div>
                        {selectedProducts.includes(product.id) && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            )}
          </div>

          {/* Users Selection */}
          <div className="space-y-2 relative">
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              onClick={() => setUsersOpen(!usersOpen)}
            >
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Users & Groups</label>
                <span className="text-sm text-muted-foreground">
                  {getSelectedUsersText()}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  usersOpen && "rotate-180"
                )}
              />
            </Button>
            {usersOpen && (
              <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0">
                <Command className="border rounded-md shadow-md bg-popover">
                  <CommandInput placeholder="Search users or groups..." />
                  <CommandEmpty>No users or groups found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedUsers(
                            selectedUsers.includes(user.id)
                              ? selectedUsers.filter((id) => id !== user.id)
                              : [...selectedUsers, user.id]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {user.avatar && (
                            <div className="w-6 h-6 relative rounded-full overflow-hidden">
                              <Image
                                src={user.avatar}
                                alt={user.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border p-4 bg-muted/50 sticky bottom-0">
          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleApply}>Search</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
