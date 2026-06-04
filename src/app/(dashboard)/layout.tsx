import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNav />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl bg-slate-50/40 px-4 py-8">
        {children}
      </main>
    </>
  );
}
