"use client";


import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import { TemplateEditor } from "./template-editor";

export function TemplateBrowser() {
  const [selectedTemplateId] = useQueryState("id");
  const { data: cards = [], isLoading: isCardsLoading } = api.template.getAll.useQuery();

  const isLoading = isCardsLoading;

  const activeTemplateId = selectedTemplateId ?? (cards.length > 0 ? cards[0]?.id : null);

  return (
    <main className=" text-academic-black flex h-dvh w-full overflow-hidden font-mono text-xs md:flex-row">
      <div className=" flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white p-4 font-sans text-sm md:p-8 flex flex-col items-center relative">
          {activeTemplateId ? (
            <div className="w-full max-w-4xl mt-4">
              <TemplateEditor templateId={activeTemplateId} key={activeTemplateId} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-[10px] font-bold tracking-widest text-[#888] uppercase">
              {isLoading ? "LOADING MATERIALS..." : "SELECT A TEMPLATE TO VIEW"}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
