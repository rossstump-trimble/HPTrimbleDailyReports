import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limiter";

describe("checkRateLimit", () => {
  it("allows requests under the rate limit", () => {
    const ip = "192.0.2.1";
    const res1 = checkRateLimit(ip, 5, 10000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = checkRateLimit(ip, 5, 10000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("blocks requests that exceed the limit", () => {
    const ip = "192.0.2.2";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, 3, 10000);
    }
    const blocked = checkRateLimit(ip, 3, 10000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
