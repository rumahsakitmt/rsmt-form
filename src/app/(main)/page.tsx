import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { TemplateBrowser } from "@/app/_components/template-browser";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Templates | RSMT.DOCX",
  description: "Buat dokumen, formulir, dan template dengan mudah.",
};

function TemplateBrowserWithSuspense() {
  return (
    <Suspense
      fallback={
        <main className="text-academic-black flex w-full font-mono text-xs md:flex-row">
          <div className="flex flex-1 flex-col">
            <div className="relative flex flex-1 flex-col items-center font-sans text-sm">
              <div className="flex h-full items-center justify-center p-8 text-[10px] font-bold tracking-widest text-[#888] uppercase">
                LOADING MATERIALS...
              </div>
            </div>
          </div>
        </main>
      }
    >
      <TemplateBrowser />
    </Suspense>
  );
}

export default async function Home() {
  return (
    <HydrateClient>
      <TemplateBrowserWithSuspense />
    </HydrateClient>
  );
}
