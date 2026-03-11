"use client";

import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import { TemplateEditor } from "./template-editor";

export function TemplateBrowser() {
  const [selectedTemplateId] = useQueryState("id");
  const { data: cards = [], isLoading: isCardsLoading } =
    api.template.getAll.useQuery();

  const isLoading = isCardsLoading;

  const activeTemplateId =
    selectedTemplateId ?? (cards.length > 0 ? cards[0]?.id : null);

  return (
    <main className="text-academic-black flex w-full font-mono text-xs md:flex-row">
      <div className="flex flex-1 flex-col">
        <div className="relative flex flex-1 flex-col items-center font-sans text-sm">
          {activeTemplateId ? (
            <div className="mt-4 w-full max-w-4xl">
              <TemplateEditor
                templateId={activeTemplateId}
                key={activeTemplateId}
              />
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
