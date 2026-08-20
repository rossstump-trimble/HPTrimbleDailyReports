import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support | ProjectSight",
  description: "Get in touch with ProjectSight support or submit a support request.",
};

export default function ContactSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
