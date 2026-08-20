import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProjectSight Mobile",
  description: "ProjectSight Mobile Prototype",
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
  },
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-300 dark:bg-gray-800 flex items-start justify-center py-8">
      <div className="mobile-frame relative w-full max-w-[390px] h-[844px] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
