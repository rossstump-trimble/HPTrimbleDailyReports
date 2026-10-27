import { describe, it, expect, beforeEach } from "vitest";
import {
  extractProjectIdFromPath,
  resolveActiveProjectId,
  setLastSelectedProjectId,
  getLastSelectedProjectId,
  setDefaultProjectId,
  getDefaultProjectId,
  clearRememberedProjectIfMatches,
} from "./active-project";

describe("active-project helpers", () => {
  beforeEach(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("extracts projectId from /projects/[projectId]/* and /intake/[projectId]", () => {
    expect(extractProjectIdFromPath("/projects/moa-clinic-security-upgrades/dashboard")).toBe(
      "moa-clinic-security-upgrades",
    );
    expect(extractProjectIdFromPath("/intake/moa-clinic-security-upgrades")).toBe(
      "moa-clinic-security-upgrades",
    );
    expect(extractProjectIdFromPath("/projects")).toBeNull();
    expect(extractProjectIdFromPath("/admin")).toBeNull();
  });

  it("resolves active project id prioritizing URL path, then last selected, then default, then fallback", () => {
    expect(
      resolveActiveProjectId({
        pathname: "/projects/moa-clinic-security-upgrades/bowling",
        lastProjectId: "8",
        defaultProjectId: "1025",
      }),
    ).toBe("moa-clinic-security-upgrades");

    expect(
      resolveActiveProjectId({
        pathname: "/projects",
        lastProjectId: "moa-clinic-security-upgrades",
        defaultProjectId: "8",
      }),
    ).toBe("moa-clinic-security-upgrades");

    expect(
      resolveActiveProjectId({
        pathname: "/projects",
        lastProjectId: null,
        defaultProjectId: "moa-clinic-security-upgrades",
      }),
    ).toBe("moa-clinic-security-upgrades");

    expect(
      resolveActiveProjectId({
        pathname: "/projects",
        lastProjectId: null,
        defaultProjectId: null,
      }),
    ).toBe("1025");
  });

  it("persists and clears last selected and default project in browser storage", () => {
    if (typeof window === "undefined") return;
    setLastSelectedProjectId("moa-clinic-security-upgrades");
    expect(getLastSelectedProjectId()).toBe("moa-clinic-security-upgrades");

    setDefaultProjectId("8");
    expect(getDefaultProjectId()).toBe("8");
    expect(getLastSelectedProjectId()).toBe("8");

    clearRememberedProjectIfMatches("8");
    expect(getDefaultProjectId()).toBeNull();
    expect(getLastSelectedProjectId()).toBeNull();
  });
});
