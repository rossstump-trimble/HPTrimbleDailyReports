import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

import { ThemeProvider } from "@/components/ThemeProvider";
import { ModusProviders } from "@/components/ModusProviders";
import AppShell from "@/components/AppShell";

import { RoomWrapper } from "@/components/RoomWrapper";

import { AssistantProvider } from "@/contexts/AssistantContext";
import LiveAPIWrapper from "@/components/LiveAPIWrapper";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjectSight Web Prototype",
  description: "ProjectSight Web Prototype",
  authors: [
    { name: "Julian Oczkowski", url: "https://www.julianoczkowski.com" },
  ],
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retrieve API Key
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://resources.connect.trimble.com/1.15.0/fonts/icon-font.css"
        />
        {/* Inline script runs synchronously before any JS hydration — reliable on Vercel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ps-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="ps-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ModusProviders>
          <AssistantProvider>
            {geminiApiKey ? (
              <LiveAPIWrapper apiKey={geminiApiKey}>
                <AppShell>{children}</AppShell>
                <Toaster />
              </LiveAPIWrapper>
            ) : (
              <>
                <AppShell>{children}</AppShell>
                <Toaster />
              </>
            )}
          </AssistantProvider>
          </ModusProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
