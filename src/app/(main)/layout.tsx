import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex  flex-col overflow-hidden">
      <Header />
      <div id="main-scroll-container" className="relative flex-1 overflow-y-auto bg-white p-4 font-sans text-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
        {children}
        <BackToTop />
      </div>
    </div>
  );
}
