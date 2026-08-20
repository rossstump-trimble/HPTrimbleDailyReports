"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Search, Settings } from "lucide-react";
import { MOBILE_PROJECTS, PORTFOLIOS, type MobileProject, type Portfolio } from "@/lib/mobile/mockData";

type ActiveTab = "projects" | "portfolios";

// Group projects by their groupLabel
function groupProjects(projects: MobileProject[]) {
  const groups: Record<string, MobileProject[]> = {};
  for (const p of projects) {
    if (!groups[p.groupLabel]) groups[p.groupLabel] = [];
    groups[p.groupLabel].push(p);
  }
  return groups;
}

export default function ProjectsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("projects");
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

  const filteredProjects = MOBILE_PROJECTS.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.number.includes(q);
  });
  const grouped = groupProjects(filteredProjects);

  const filteredPortfolios = PORTFOLIOS.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
  });

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchMode(false);
    setSearchQuery("");
    setSelectedPortfolio(null);
  };

  const title = selectedPortfolio
    ? selectedPortfolio.name
    : activeTab === "portfolios" ? "Portfolios" : "My projects";
  const subtitle = selectedPortfolio
    ? `${selectedPortfolio.projectCount} Projects`
    : activeTab === "portfolios" ? "Updating…" : "Synced Just Now";
  const searchPlaceholder = activeTab === "portfolios" ? "Search portfolios…" : "Search projects…";

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        {searchMode ? (
          <>
            <input
              autoFocus
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded px-3 py-1.5 text-sm focus:outline-none"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="ml-2 text-white text-sm" onClick={() => { setSearchMode(false); setSearchQuery(""); }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {selectedPortfolio ? (
              <button className="text-white p-1 mr-2" onClick={() => setSelectedPortfolio(null)}>
                <ArrowLeft size={20} />
              </button>
            ) : (
              <button className="text-white opacity-90 hover:opacity-100 p-1 mr-3">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-white font-semibold text-base leading-tight">{title}</h1>
              <p className="text-white text-xs opacity-60 leading-tight mt-0.5">{subtitle}</p>
            </div>
            <button className="text-white opacity-80 hover:opacity-100 p-1" onClick={() => setSearchMode(true)}>
              <Search size={20} />
            </button>
          </>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Portfolio detail — show its projects */}
        {selectedPortfolio ? (
          <>
            <div className="mt-3 px-3">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 px-1">
                {selectedPortfolio.projectCount} Projects
              </h2>
              <div className="flex flex-col gap-3">
                {MOBILE_PROJECTS.filter(p => selectedPortfolio.projectIds.includes(p.id)).map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => router.push(`/mobile/projects/${project.id}`)}
                    onSettings={() => router.push("/mobile/settings")}
                  />
                ))}
              </div>
            </div>
            <div className="h-4" />
          </>
        ) : activeTab === "projects" ? (
          <>
            {Object.entries(grouped).map(([groupLabel, projects]) => (
              <section key={groupLabel} className="mt-4 px-3">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 px-1">
                  {groupLabel}{groupLabel === "Downloaded" ? ` ${projects.length}` : ""}
                </h2>
                <div className="flex flex-col gap-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onOpen={() => router.push(`/mobile/projects/${project.id}`)}
                      onSettings={() => router.push("/mobile/settings")}
                    />
                  ))}
                </div>
              </section>
            ))}
            <div className="h-4" />
          </>
        ) : (
          <>
            <div className="mt-4 px-3">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 px-1">
                Portfolios ({filteredPortfolios.length})
              </h2>
              <div className="flex flex-col gap-3">
                {filteredPortfolios.map(portfolio => (
                  <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    onOpen={() => setSelectedPortfolio(portfolio)}
                  />
                ))}
              </div>
            </div>
            <div className="h-4" />
          </>
        )}
      </div>

      {/* Bottom tab bar — segmented control */}
      <div className="flex-none bg-gray-100 dark:bg-gray-950 pt-2 pb-4 flex items-center justify-center">
        <div className="flex border-2 rounded overflow-hidden" style={{ borderColor: "#1b3a5c" }}>
          <button
            className={`px-5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "projects"
                ? "text-white"
                : "bg-white dark:bg-gray-900 text-[#1b3a5c] dark:text-gray-200"
            }`}
            style={activeTab === "projects" ? { backgroundColor: "#1b3a5c" } : undefined}
            onClick={() => switchTab("projects")}
          >
            Projects
          </button>
          <button
            className={`px-5 py-1 text-xs font-semibold transition-colors border-l-2 ${
              activeTab === "portfolios"
                ? "text-white"
                : "bg-white dark:bg-gray-900 text-[#1b3a5c] dark:text-gray-200"
            }`}
            style={{ borderColor: "#1b3a5c", ...(activeTab === "portfolios" ? { backgroundColor: "#1b3a5c" } : {}) }}
            onClick={() => switchTab("portfolios")}
          >
            Portfolios
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio, onOpen }: { portfolio: Portfolio; onOpen: () => void }) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={onOpen}
    >
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-none">
        {portfolio.imageSrc ? (
          <img src={portfolio.imageSrc} alt={portfolio.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-gray-500 dark:text-gray-400" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-0.5">{portfolio.company}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{portfolio.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{portfolio.projectCount} Projects</p>
      </div>
      <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 flex-none" />
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onSettings,
}: {
  project: MobileProject;
  onOpen: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl px-4 pt-4 pb-4 flex items-start gap-3 shadow-sm">
      {/* Project thumbnail — circular */}
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-none">
        {project.imageSrc ? (
          <img src={project.imageSrc} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-0.5">{project.company}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">
          {project.number} - {project.name}
        </p>

        {project.downloaded ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onOpen}
              className="px-6 py-1.5 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: "#1c1c1e" }}
            >
              Open
            </button>
            {project.syncedDate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">Synced: {project.syncedDate}</span>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <button
              className="px-6 py-1.5 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: "#1c1c1e" }}
            >
              Download
            </button>
          </div>
        )}
      </div>

      {/* Settings gear */}
      <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 flex-none mt-0.5" aria-label="Project settings" onClick={e => { e.stopPropagation(); onSettings(); }}>
        <Settings size={18} />
      </button>
    </div>
  );
}
