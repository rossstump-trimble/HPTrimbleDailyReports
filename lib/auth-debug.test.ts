import { describe, expect, it } from "vitest";
import { isLoopbackValue, loopbackFieldNames, requestAuthSnapshot } from "./auth-debug";

describe("auth-debug", () => {
  it("flags localhost Location and Host values", () => {
    expect(isLoopbackValue("http://localhost:3000/")).toBe(true);
    expect(isLoopbackValue("https://hp-trimble-lab.com/auth/callback")).toBe(false);
    expect(
      loopbackFieldNames({
        location: "http://localhost:3000/",
        redirectUri: "https://hp-trimble-lab.com/auth/callback",
        host: "127.0.0.1:3000",
      })
    ).toEqual(["location", "host"]);
  });

  it("snapshots forwarded headers and cookie names without values", () => {
    const headers = new Headers();
    headers.set("host", "127.0.0.1:3000");
    headers.set("x-forwarded-host", "hp-trimble-lab.com");
    headers.set("x-forwarded-proto", "https");
    headers.set("cookie", "tid_pkce=secret; ps_session=also-secret");
    const snap = requestAuthSnapshot({
      headers,
      url: "http://localhost:3000/auth/callback?code=nope",
    });
    expect(snap.host).toBe("127.0.0.1:3000");
    expect(snap.xForwardedHost).toBe("hp-trimble-lab.com");
    expect(snap.requestPath).toBe("/auth/callback");
    expect(snap.searchParamKeys).toEqual(["code"]);
    expect(snap.cookieNames).toEqual(["tid_pkce", "ps_session"]);
    expect(JSON.stringify(snap)).not.toContain("secret");
    expect(JSON.stringify(snap)).not.toContain("also-secret");
    expect(JSON.stringify(snap)).not.toContain("nope");
  });
});
