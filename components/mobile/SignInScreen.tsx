"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("demo.user@samplecompany.com");

  const handleNext = () => {
    router.push("/mobile/projects");
  };

  const handleSocialSignIn = () => {
    router.push("/mobile/projects");
  };

  return (
    <div className="flex flex-col flex-1 bg-white px-6 pt-10 pb-8 overflow-y-auto">
      {/* Trimble logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <TrimbleLogo />
        </div>
      </div>

      {/* Sign In heading */}
      <h1 className="text-3xl font-light text-gray-800 mb-1">Sign In</h1>
      <p className="text-sm text-gray-600 mb-6">
        New user?{" "}
        <button className="text-blue-600 hover:underline">
          Create a Trimble ID
        </button>
      </p>

      {/* Email input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Email or username
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete="email"
        />
      </div>

      {/* Next button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded text-sm font-medium text-white"
          style={{ backgroundColor: "#1b3a5c" }}
        >
          Next
        </button>
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 border-t border-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-300" />
      </div>

      {/* Social sign-in buttons */}
      <div className="flex flex-col gap-3">
        <SocialButton onClick={handleSocialSignIn}>
          <PasskeyIcon />
          Use a passkey
        </SocialButton>

        <SocialButton onClick={handleSocialSignIn}>
          <GoogleIcon />
          Continue with Google
        </SocialButton>

        <SocialButton onClick={handleSocialSignIn}>
          <AppleIcon />
          Continue with Apple
        </SocialButton>

        <SocialButton onClick={handleSocialSignIn}>
          <MicrosoftIcon />
          Continue with Microsoft
        </SocialButton>
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2 mt-6">
        <input
          type="checkbox"
          id="remember"
          defaultChecked
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="remember" className="text-sm text-gray-600">
          Remember me
        </label>
      </div>

      {/* Footer links */}
      <div className="mt-auto pt-8 text-center text-xs text-blue-500 space-y-1">
        <div className="flex justify-center gap-2 flex-wrap">
          <button className="hover:underline">Help</button>
          <span className="text-gray-300">|</span>
          <button className="hover:underline">Privacy Notice</button>
          <span className="text-gray-300">|</span>
          <button className="hover:underline">Terms of Use</button>
          <span className="text-gray-300">|</span>
        </div>
        <div className="flex justify-center gap-2 flex-wrap">
          <button className="hover:underline">CA Notice at Collection</button>
          <span className="text-gray-300">|</span>
        </div>
        <button className="hover:underline">Your Privacy Choices (US)</button>
      </div>
    </div>
  );
}

function SocialButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}

// ─── Icon components ────────────────────────────────────────────────────────

function TrimbleLogo() {
  return (
    <img src="/images/trimble-logo.png" alt="Trimble" className="h-11 w-auto" />
  );
}

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
      <path d="M16 11l2 2 4-4" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}
