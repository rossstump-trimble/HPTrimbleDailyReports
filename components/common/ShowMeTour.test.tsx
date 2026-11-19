import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const push = vi.fn();
let pathname = "/projects";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

import ShowMeTour, { TOUR_STEPS } from "./ShowMeTour";

describe("ShowMeTour", () => {
  beforeEach(() => {
    push.mockReset();
    pathname = "/projects";
    document.cookie = "hp_last_project_id=; path=/; max-age=0";
  });

  afterEach(cleanup);

  it("walks through the real pages for the active project", () => {
    pathname = "/projects/8/review";
    render(<ShowMeTour />);

    fireEvent.click(screen.getByText("Show Me Around"));
    expect(push).toHaveBeenLastCalledWith("/projects");
    expect(screen.getByText("1 of 4")).toBeTruthy();

    fireEvent.click(screen.getByText("Next"));
    expect(push).toHaveBeenLastCalledWith("/projects/8/companies");

    fireEvent.click(screen.getByText("Next"));
    expect(push).toHaveBeenLastCalledWith("/projects/8/review");

    fireEvent.click(screen.getByText("Next"));
    expect(push).toHaveBeenLastCalledWith("/projects/8/bowling");
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("goes back a page and closes on Done or X", () => {
    pathname = "/projects/8/companies";
    render(<ShowMeTour />);
    fireEvent.click(screen.getByText("Show Me Around"));
    fireEvent.click(screen.getByText("Next"));

    fireEvent.click(screen.getByText("Back"));
    expect(push).toHaveBeenLastCalledWith("/projects");

    fireEvent.click(screen.getByLabelText("Close tour"));
    expect(screen.getByText("Show Me Around")).toBeTruthy();
    expect(TOUR_STEPS).toHaveLength(4);
  });

  it("falls back to the last selected project when off a project page", () => {
    document.cookie = "hp_last_project_id=1025; path=/";
    render(<ShowMeTour />);

    fireEvent.click(screen.getByText("Show Me Around"));
    fireEvent.click(screen.getByText("Next"));

    expect(push).toHaveBeenLastCalledWith("/projects/1025/companies");
  });
});
