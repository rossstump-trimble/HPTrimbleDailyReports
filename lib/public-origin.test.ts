import { afterEach, describe, expect, it } from "vitest";
import { publicAppUrl, resolvePublicOrigin, tidOAuthRedirectUri } from "./public-origin";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function request(opts: {
  url: string;
  host?: string;
  forwardedHost?: string;
  forwardedProto?: string;
}): { headers: Headers; url: string } {
  const headers = new Headers();
  if (opts.host) headers.set("host", opts.host);
  if (opts.forwardedHost) headers.set("x-forwarded-host", opts.forwardedHost);
  if (opts.forwardedProto) headers.set("x-forwarded-proto", opts.forwardedProto);
  return { headers, url: opts.url };
}

describe("resolvePublicOrigin", () => {
  it("keeps localhost origin in local auth mode", () => {
    process.env.AUTH_MODE = "local";
    expect(
      resolvePublicOrigin(
        request({ url: "http://localhost:3000/auth/callback", host: "localhost:3000" })
      )
    ).toBe("http://localhost:3000");
  });

  it("does not follow Next's internal listen origin in TID mode", () => {
    process.env.AUTH_MODE = "tid";
    process.env.PUBLIC_BASE_URL = "https://hp-trimble-lab.com";
    expect(
      resolvePublicOrigin(
        request({ url: "http://localhost:3000/auth/callback", host: "localhost:3000" })
      )
    ).toBe("https://hp-trimble-lab.com");
  });

  it("prefers forwarded host over loopback Host when present", () => {
    process.env.AUTH_MODE = "tid";
    expect(
      resolvePublicOrigin(
        request({
          url: "http://127.0.0.1:3000/auth/callback",
          host: "127.0.0.1:3000",
          forwardedHost: "hp-trimble-lab.com",
          forwardedProto: "https",
        })
      )
    ).toBe("https://hp-trimble-lab.com");
  });

  it("builds post-login redirects against the public origin", () => {
    process.env.AUTH_MODE = "tid";
    process.env.PUBLIC_BASE_URL = "https://hp-trimble-lab.com";
    expect(
      publicAppUrl(
        request({ url: "http://localhost:3000/auth/callback", host: "localhost:3000" }),
        "/"
      ).toString()
    ).toBe("https://hp-trimble-lab.com/");
  });
});

describe("tidOAuthRedirectUri", () => {
  it("replaces a loopback callback stored from a proxied Host header", () => {
    process.env.PUBLIC_BASE_URL = "https://hp-trimble-lab.com";
    delete process.env.TID_CALLBACK_URL;
    expect(tidOAuthRedirectUri("http://localhost:3000/auth/callback")).toBe(
      "https://hp-trimble-lab.com/auth/callback"
    );
  });
});
