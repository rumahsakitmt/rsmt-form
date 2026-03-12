export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DocumentsPageContent } from "./documents-page-content";

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-academic-white text-academic-black mx-auto min-h-dvh max-w-6xl flex-1 flex-col space-y-4 overflow-auto overflow-y-auto border border-black p-2 md:flex md:p-8">
          <div className="text-academic-black flex flex-1 items-center justify-center text-[10px] font-bold tracking-wider uppercase">
            LOADING...
          </div>
        </section>
      }
    >
      <DocumentsPageContent />
    </Suspense>
  );
}
