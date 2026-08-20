"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface TradePartner {
  id: string;
  name: string;
  contactEmail?: string;
  category?: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
  tradePartners: TradePartner[];
  createdAt: string;
}

function getIntakeUrl(projectId: string): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // On localhost variants use the actual origin; otherwise use the production domain
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `${origin}/intake/${projectId}`;
    }
  }
  return `https://hp-trimble-lab.com/intake/${projectId}`;
}

function QrCodeImage({ url, size = 120 }: { url: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=4`;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`QR code for ${url}`}
        width={size}
        height={size}
        className="rounded border border-border"
      />
      <p className="text-[10px] text-muted-foreground text-center max-w-[120px] truncate" title={url}>
        {url}
      </p>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from the bowling API to get project list (could also be a dedicated /api/projects)
    // For now we use a static seeded list since the store is server-side
    const seeded: Project[] = [
      {
        id: "cys07",
        code: "CYS07",
        name: "CYS07 - Data Center Campus",
        createdAt: "2026-08-01T00:00:00.000Z",
        tradePartners: [
          { id: "alc", name: "ALC", category: "Controls" },
          { id: "black-roofing", name: "Black Roofing", category: "Roofing" },
          { id: "apex-steel", name: "Apex Steel", category: "Structural Steel" },
          { id: "titan-electric", name: "Titan Electric", category: "Electrical" },
          { id: "cascade-plumbing", name: "Cascade Plumbing & Mechanical", category: "Mechanical" },
          { id: "precision-drywall", name: "Precision Drywall", category: "Interiors" },
        ],
      },
    ];
    setProjects(seeded);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading projects…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a project to view its master bowling sheet or share the QR intake link with trade partners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const intakeUrl = getIntakeUrl(project.id);
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs font-semibold">
                        {project.code}
                      </Badge>
                    </div>
                    <h2 className="text-sm font-semibold text-foreground leading-tight">
                      {project.name}
                    </h2>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Trade partner count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{project.tradePartners.length}</span>
                  <span>trade partners</span>
                </div>

                {/* Trade partner chips */}
                <div className="flex flex-wrap gap-1">
                  {project.tradePartners.slice(0, 5).map((tp) => (
                    <Badge key={tp.id} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {tp.name}
                    </Badge>
                  ))}
                  {project.tradePartners.length > 5 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      +{project.tradePartners.length - 5} more
                    </Badge>
                  )}
                </div>

                {/* QR code section */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Trade QR Intake Link
                  </p>
                  <div className="flex items-start gap-3">
                    <QrCodeImage url={intakeUrl} size={100} />
                    <div className="flex flex-col gap-2 pt-1">
                      <p className="text-xs text-muted-foreground">
                        Scan to open the daily intake form. Share with field foremen.
                      </p>
                      <button
                        onClick={() => window.open(intakeUrl, "_blank")}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open intake
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-1.5"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}/dashboard`)}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
                <Button
                  className="w-full flex items-center gap-1.5"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}/bowling`)}
                >
                  <TableProperties className="h-3.5 w-3.5" />
                  Bowling Sheet
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
