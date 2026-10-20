"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const urlError = searchParams.get("error");

  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"unknown" | "local" | "tid">("unknown");
  const [showManual, setShowManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode")
      .then((res) => res.json())
      .then((data: { mode?: string }) => {
        if (cancelled) return;
        if (data.mode === "local") {
          setAuthMode("local");
          window.location.replace(`/api/auth/local?from=${encodeURIComponent(from)}`);
          return;
        }
        setAuthMode("tid");
      })
      .catch(() => {
        if (!cancelled) setAuthMode("tid");
      });
    return () => {
      cancelled = true;
    };
  }, [from]);

  function handleTIDLogin() {
    setLoading(true);
    window.location.href = `/api/auth/login?from=${encodeURIComponent(from)}`;
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const password = inputRef.current?.value ?? "";
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, from }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Incorrect password.");
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      router.replace(data.redirectTo ?? "/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (authMode === "unknown" || authMode === "local") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1f33]">
        <div className="text-white text-sm">
          {authMode === "local" ? "Entering local development…" : "Loading…"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1f33] px-4">
      <div className="w-full max-w-sm px-8 py-10 bg-white rounded-2xl shadow-2xl flex flex-col items-center gap-6">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/projectsight_logo.svg"
          alt="ProjectSight"
          style={{ width: 180, height: "auto" }}
        />

        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">HP Daily Reporting</h1>
          <p className="text-xs text-gray-500 mt-1">Sign in with Trimble Identity</p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-600 font-medium break-words">{error}</p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleTIDLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#0063a3] hover:bg-[#004f83] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            Sign in with Trimble Identity
          </button>
        </div>

        <div className="w-full pt-2 border-t border-gray-100 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showManual ? "Hide direct passkey" : "Prototype direct passkey"}
          </button>

          {showManual && (
            <form onSubmit={handlePasswordSubmit} className="w-full mt-3 flex flex-col gap-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Prototype Password"
                  autoComplete="current-password"
                  style={{ color: "#111827", background: "#ffffff" }}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium"
              >
                Enter with Passkey
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0d1f33]">
          <div className="text-white text-sm">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
