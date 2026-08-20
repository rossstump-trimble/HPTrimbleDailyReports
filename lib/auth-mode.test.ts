import { describe, expect, it } from "vitest";
import { isLoopbackHost, resolveAuthMode } from "./auth-mode";

describe("resolveAuthMode", () => {
  it("uses AUTH_MODE=local even on a public host", () => {
    expect(
      resolveAuthMode({ authModeEnv: "local", hostHeader: "hp-trimble-lab.com" })
    ).toBe("local");
  });

  it("uses AUTH_MODE=tid even on localhost", () => {
    expect(
      resolveAuthMode({ authModeEnv: "tid", hostHeader: "localhost:3000" })
    ).toBe("tid");
  });

  it("defaults localhost and loopback to local when AUTH_MODE is unset", () => {
    expect(resolveAuthMode({ hostHeader: "localhost:3000" })).toBe("local");
    expect(resolveAuthMode({ hostHeader: "127.0.0.1" })).toBe("local");
    expect(resolveAuthMode({ hostHeader: "[::1]:3000" })).toBe("local");
  });

  it("defaults deployed hosts to TID when AUTH_MODE is unset", () => {
    expect(resolveAuthMode({ hostHeader: "hp-trimble-lab.com" })).toBe("tid");
    expect(resolveAuthMode({ hostHeader: "34.10.16.167.sslip.io" })).toBe("tid");
  });

  it("treats unknown AUTH_MODE values as unset", () => {
    expect(
      resolveAuthMode({ authModeEnv: "maybe", hostHeader: "localhost" })
    ).toBe("local");
    expect(
      resolveAuthMode({ authModeEnv: "maybe", hostHeader: "hp-trimble-lab.com" })
    ).toBe("tid");
  });
});

describe("isLoopbackHost", () => {
  it("recognizes loopback names with or without a port", () => {
    expect(isLoopbackHost("localhost:3000")).toBe(true);
    expect(isLoopbackHost("127.0.0.1:3000")).toBe(true);
    expect(isLoopbackHost("[::1]:3000")).toBe(true);
    expect(isLoopbackHost("hp-trimble-lab.com")).toBe(false);
  });
});
