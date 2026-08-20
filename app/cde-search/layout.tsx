export default function CDESearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {children}
    </main>
  );
}
