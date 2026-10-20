"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEFAULT_DESTINATION,
  DESTINATION_COOKIE,
  destinationFromCookieWithFallback,
  parseDestinationJson,
  serializeDestination,
  type ProjectSightDestination,
} from "@/lib/projectsight/destination";

interface NamedRef {
  id: string;
  name: string;
}

function readCookieDestination(): ProjectSightDestination {
  if (typeof document === "undefined") return DEFAULT_DESTINATION;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${DESTINATION_COOKIE}=`));
  return destinationFromCookieWithFallback(raw ? raw.slice(DESTINATION_COOKIE.length + 1) : null);
}

function writeCookieDestination(dest: ProjectSightDestination) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${DESTINATION_COOKIE}=${encodeURIComponent(serializeDestination(dest))}; path=/; max-age=${maxAge}; samesite=lax`;
}

export default function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tidReady, setTidReady] = useState(false);
  const [portfolios, setPortfolios] = useState<NamedRef[]>([]);
  const [projects, setProjects] = useState<NamedRef[]>([]);
  const [loadError, setLoadError] = useState("");
  const [destination, setDestination] = useState<ProjectSightDestination | null>(null);

  const queryPortfolio = searchParams.get("psPortfolio");
  const queryProject = searchParams.get("psProject");

  useEffect(() => {
    const cookie = readCookieDestination();
    if (queryPortfolio && queryProject) {
      setDestination({
        portfolioId: queryPortfolio,
        projectId: queryProject,
        portfolioName: cookie?.portfolioName || "",
        projectName: cookie?.projectName || "",
      });
      return;
    }
    if (cookie) setDestination(cookie);
  }, [queryPortfolio, queryProject]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { authenticated?: boolean; mode?: string }) => {
        if (cancelled) return;
        setTidReady(Boolean(data.authenticated && data.mode === "tid"));
      })
      .catch(() => {
        if (!cancelled) setTidReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tidReady) return;
    let cancelled = false;
    fetch("/api/projectsight/portfolios")
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<NamedRef[]>;
      })
      .then((rows) => {
        if (!cancelled) {
          setPortfolios(rows);
          setLoadError("");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("No ProjectSight access for this user or missing API scope.");
      });
    return () => {
      cancelled = true;
    };
  }, [tidReady]);

  const selectedPortfolioId = destination?.portfolioId || portfolios[0]?.id || "";

  useEffect(() => {
    if (!tidReady || !selectedPortfolioId) return;
    let cancelled = false;
    fetch(`/api/projectsight/portfolios/${selectedPortfolioId}/projects`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<NamedRef[]>;
      })
      .then((rows) => {
        if (!cancelled) setProjects(rows);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tidReady, selectedPortfolioId]);

  const persist = useCallback(
    (next: ProjectSightDestination) => {
      setDestination(next);
      writeCookieDestination(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("psPortfolio", next.portfolioId);
      params.set("psProject", next.projectId);
      params.delete("project");
      router.replace(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [pathname, router, searchParams],
  );

  const filteredPortfolios = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return portfolios;
    return portfolios.filter((p) => p.name.toLowerCase().includes(q));
  }, [portfolios, search]);

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  const label = destination
    ? destination.projectName || "ProjectSight project"
    : tidReady
      ? "Select ProjectSight project"
      : "Sign in to ProjectSight";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 min-w-0 max-w-[320px] justify-between font-medium text-foreground hover:bg-accent/50"
          aria-label="Switch ProjectSight project"
        >
          <span className="truncate">{label}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="center" sideOffset={8}>
        {!tidReady ? (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in with Trimble Identity to pick a live portfolio and project.
            </p>
            <Button asChild className="w-full">
              <a href="/login?from=/daily">Sign in to ProjectSight</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="p-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                ProjectSight destination
              </p>
              <div className="flex items-center border border-input rounded-md bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <span className="pl-3 flex items-center shrink-0 text-muted-foreground" aria-hidden>
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="search"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 py-2 pl-2 pr-3 h-9 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                  autoFocus
                />
              </div>
              {loadError ? (
                <p className="text-xs text-destructive px-2 pt-2">{loadError}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <ScrollArea className="max-h-[320px]">
                <div className="p-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-1">
                    Portfolio
                  </p>
                  {filteredPortfolios.map((portfolio) => (
                    <button
                      key={portfolio.id}
                      type="button"
                      onClick={() =>
                        setDestination({
                          portfolioId: portfolio.id,
                          projectId:
                            destination?.portfolioId === portfolio.id
                              ? destination.projectId
                              : "",
                          portfolioName: portfolio.name,
                          projectName:
                            destination?.portfolioId === portfolio.id
                              ? destination.projectName
                              : "",
                        })
                      }
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm",
                        portfolio.id === selectedPortfolioId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      <span className="truncate">{portfolio.name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <ScrollArea className="max-h-[320px]">
                <div className="p-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-3 py-1">
                    Project
                  </p>
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        persist({
                          portfolioId: selectedPortfolioId,
                          projectId: project.id,
                          portfolioName:
                            portfolios.find((p) => p.id === selectedPortfolioId)?.name ||
                            destination?.portfolioName ||
                            "",
                          projectName: project.name,
                        })
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                        project.id === destination?.projectId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
