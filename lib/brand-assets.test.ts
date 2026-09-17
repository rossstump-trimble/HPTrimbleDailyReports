import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("brand assets and fonts", () => {
  it("contains the official Hensel Phelps horizontal logo in public/images", () => {
    const logoPath = path.join(process.cwd(), "public", "images", "hp-logo-std.png");
    expect(fs.existsSync(logoPath)).toBe(true);
    const stats = fs.statSync(logoPath);
    expect(stats.size).toBeGreaterThan(1000);
  });
});
