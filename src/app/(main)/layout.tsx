import { Suspense } from "react";
import { Header } from "@/components/header";
import { BackToTop } from "@/components/back-to-top";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "RSMT.DOCX",
  description: "Buat dokumen, formulir, dan template dengan mudah.",
};

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="border-academic-black bg-academic-green z-10 flex w-full shrink-0 items-center justify-between gap-4 border-b p-2">
            <span className="hidden sm:block">RSMT.DOCX</span>
            <span className="block sm:hidden">.DOCX</span>
            <div className="bg-academic-white/50 h-8 w-[400px] animate-pulse" />
            <div className="bg-academic-black/10 h-8 w-8 animate-pulse" />
          </div>
        }
      >
        <Header />
      </Suspense>
      <div
        id="main-scroll-container"
        className="bg-academic-white relative flex-1 overflow-y-auto p-4 font-sans text-sm md:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10">{children}</div>
        <BackToTop />
      </div>
    </div>
  );
}
