export default function ThreeDViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen overflow-hidden">{children}</div>;
}

export const metadata = {
  title: "3D Viewer - Trimble Connect",
  description: "3D model visualization and interaction",
};
