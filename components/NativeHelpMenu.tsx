"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  HELP_LINKS,
  getOnlineHelpUrl,
} from "@/lib/projectsight/helpConfig";

// ---------------------------------------------------------------------------
// Primitive row
// ---------------------------------------------------------------------------
interface HelpLinkRowProps {
  label: string;
  href: string;
  external?: boolean;
  internal?: boolean;
  description?: string;
  muted?: boolean;
}

const rowBase =
  "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex flex-col gap-0.5 focus:outline-none focus-visible:bg-accent";

const HelpLinkRow: React.FC<HelpLinkRowProps> = ({
  label,
  href,
  external = true,
  internal = false,
  description,
  muted = false,
}) => {
  const labelClass = muted ? "text-sm text-muted-foreground" : "text-sm text-foreground";

  const inner = (
    <>
      <span className={labelClass}>{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </>
  );

  if (internal) {
    return (
      <Link href={href} className={rowBase}>
        {inner}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={rowBase}
    >
      {inner}
    </a>
  );
};

// ---------------------------------------------------------------------------
// Resources collapsible group
// ---------------------------------------------------------------------------
const resourcesItems: Array<{ label: string; href: string }> = [
  { label: "License Assignments", href: HELP_LINKS.licenseAssignments },
  { label: "Account Transfers", href: HELP_LINKS.accountTransfers },
  { label: "API Documentation", href: HELP_LINKS.apiDocumentation },
  { label: "Blog", href: HELP_LINKS.blog },
  { label: "Browser Cache", href: HELP_LINKS.browserCache },
  { label: "FAQs", href: HELP_LINKS.faqs },
  { label: "Video Library", href: HELP_LINKS.videoLibrary },
];

const ResourcesSection: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="w-full flex items-start justify-between px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors focus:outline-none focus-visible:bg-accent"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-col items-start gap-0.5 w-full text-left">
          <span>Resources</span>
          {!open && (
            <span className="text-xs text-muted-foreground">
              Access the API documentation, videos, demos, and blog posts.
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>

      {open && (
        <div>
          {resourcesItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block px-6 py-2.5 text-sm text-foreground hover:bg-accent transition-colors border-t border-border"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
const NativeHelpMenu: React.FC = () => {
  const pathname = usePathname();
  const onlineHelpUrl = getOnlineHelpUrl(pathname ?? "");

  return (
    <div className="w-[360px] bg-background rounded-md overflow-hidden border border-border flex flex-col">
      {/* Header */}
      <div className="bg-[#1e5f8e] px-4 py-3">
        <span className="text-white text-xs font-semibold tracking-widest uppercase">
          Resource Center
        </span>
      </div>

      {/* Rows — divided list */}
      <div className="flex flex-col divide-y divide-border">
        <HelpLinkRow label="Online Help" href={onlineHelpUrl} external />
        <HelpLinkRow label="The Network" href={HELP_LINKS.theNetwork} external />
        <HelpLinkRow label="Training" href={HELP_LINKS.training} external />
        <HelpLinkRow label="Release Notes" href={HELP_LINKS.releaseNotes} external />
        <HelpLinkRow label="Requirements" href={HELP_LINKS.requirements} external />
        <HelpLinkRow
          label="Maintenance Windows"
          href="/maintenance-windows"
          internal
          muted
        />
        <HelpLinkRow label="Product Ideas" href={HELP_LINKS.productIdeas} external />
      </div>

      {/* Resources — collapsible, sits outside divide-y to control its own border */}
      <ResourcesSection />

      {/* Contact Support */}
      <HelpLinkRow
        label="Contact Support"
        href="/contact-support"
        description="View contact details and Support Center information"
        internal
      />
    </div>
  );
};

export default NativeHelpMenu;

