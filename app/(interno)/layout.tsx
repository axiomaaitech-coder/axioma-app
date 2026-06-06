import TopNav from "../../components/TopNav";

export default function InternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#020810" }}>
      <TopNav />
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}