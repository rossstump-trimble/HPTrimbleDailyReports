import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DataCategory } from "./types";

interface CategorySidebarProps {
  categories: DataCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Renders the sidebar with data categories for selection
 */
export function CategorySidebar({
  categories,
  activeCategory,
  onCategoryChange,
}: CategorySidebarProps) {
  return (
    <ScrollArea className="w-[220px] border-r dark:border-slate-800 h-full bg-muted/40 dark:bg-slate-950/40">
      <div className="py-8">
        <h3 className="px-4 text-sm font-medium mb-2">Data Categories</h3>
        <div className="space-y-1 px-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "ghost2" : "ghost"}
              className={cn(
                "w-full justify-start text-sm font-normal",
                activeCategory === category.id
                  ? "bg-foreground/10 dark:bg-blue-600/20 dark:text-white"
                  : "dark:hover:bg-slate-800/80"
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <category.icon
                className={cn(
                  "mr-2 h-4 w-4",
                  activeCategory === category.id
                    ? "text-primary dark:text-blue-400"
                    : ""
                )}
              />
              {category.label}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
