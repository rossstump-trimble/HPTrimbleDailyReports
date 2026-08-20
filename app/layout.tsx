import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModusProviders } from "@/components/ModusProviders";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HP Demo Day — Daily Intake",
  description: "Trade daily intake and bowling sheet prototype",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://resources.connect.trimble.com/1.15.0/fonts/icon-font.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ps-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", openSans.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="ps-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ModusProviders>
            {children}
            <Toaster />
          </ModusProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
