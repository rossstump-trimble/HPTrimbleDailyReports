import type { VariantProps } from "class-variance-authority";
import { labsBadgeVariants } from "@/components/labs/labs-badge";
import type { LabIcon } from "@/components/icons/lab-icon";
import type { LabIcon as LabIconModus } from "@/components/icons/lab-icon-modus";

export interface LabsBadgeConfig {
  id: string;
  icon: React.ElementType | typeof LabIcon | typeof LabIconModus;
  variant: VariantProps<typeof labsBadgeVariants>["variant"];
  className: string;
  label: string;
}
