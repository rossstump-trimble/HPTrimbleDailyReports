import type { Metadata } from "next";
import { Open_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModusProviders } from "@/components/ModusProviders";
import { FeedbackWidgetProvider } from "@/components/feedback/FeedbackWidgetProvider";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const roboto = Roboto({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "HP Daily Reporting",
  description: "Hensel Phelps Daily Reporting & Compliance",
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
      <body className={cn("min-h-screen bg-background font-sans antialiased", roboto.className, openSans.variable, roboto.variable)}>
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
            <FeedbackWidgetProvider />
          </ModusProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
