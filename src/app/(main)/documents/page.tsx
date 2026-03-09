"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { AppNav } from "@/components/app-nav";

export default function DocumentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: documents = [], isLoading: isDocsLoading } =
    api.document.getAll.useQuery();

  const isLoading = isDocsLoading;

  const uniqueCategories = Array.from(
    new Set(documents.map((d) => d.template?.category).filter(Boolean)),
  );
  const uniqueTemplates = Array.from(
    new Set(documents.map((d) => d.template?.title).filter(Boolean)),
  );

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      (doc.template?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (doc.template?.category
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false);

    const matchesCategory = selectedCategory
      ? doc.template?.category === selectedCategory
      : true;
    const matchesTemplate = selectedTemplate
      ? doc.template?.title === selectedTemplate
      : true;

    return matchesSearch && matchesCategory && matchesTemplate;
  });

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-academic-white font-mono text-xs md:flex-row">
      <div className="flex shrink-0 items-center justify-between bg-academic-green border-b border-academic-black p-4 text-academic-black md:hidden">
        <div className="flex w-full items-center justify-between gap-2 text-[11px] font-bold tracking-wider uppercase">
          <span>LIBRARY 01</span>
          <input
            type="text"
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-none border border-academic-black bg-transparent px-2 py-1 text-[10px] text-academic-black uppercase placeholder-academic-black/50 focus:border-academic-black focus:outline-none"
          />
          <Drawer direction="left">
            <DrawerTrigger asChild>
              <button className="rounded-none border border-academic-black px-3 py-1 transition-colors bg-academic-white hover:bg-academic-black hover:text-academic-white">
                MENU
              </button>
            </DrawerTrigger>
            <DrawerContent className="inset-y-0 left-0 h-full w-[280px] rounded-none bg-academic-white border-r border-academic-black">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Navigation Menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex h-full flex-col justify-between p-6 text-academic-black">
                <AppNav activeItem="documents" />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>



      {/* Middle Content */}
      <section
        className={`${isMobileMenuOpen ? "hidden" : "flex"} flex-1 flex-col overflow-y-auto bg-academic-white p-4 md:flex md:p-8 text-academic-black`}
      >
        <div className="mb-6 flex flex-col gap-6 md:mb-8 w-full max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h1 className="text-xl font-bold tracking-widest text-academic-black uppercase md:text-3xl">
              Generated Documents
            </h1>
            <div className="text-[10px] font-bold tracking-wider text-academic-black/60">
              TOTAL: {filteredDocs.length}
            </div>
          </div>

          {/* Filters */}
          <div className="hidden w-full flex-col gap-4 md:flex">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              <input
                type="text"
                placeholder="SEARCH DOCUMENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 w-full border-b-2 border-academic-black bg-transparent py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase placeholder-academic-black/50 transition-colors focus:border-academic-black focus:outline-none"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="cursor-pointer w-full border-b-2 border-academic-black bg-transparent py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors focus:border-academic-black focus:outline-none md:w-48 appearance-none"
              >
                <option value="" className="bg-academic-white text-academic-black">
                  ALL CATEGORIES
                </option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-academic-white text-academic-black">
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="cursor-pointer w-full border-b-2 border-academic-black bg-transparent py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors focus:border-academic-black focus:outline-none md:w-48 appearance-none"
              >
                <option value="" className="bg-academic-white text-academic-black">
                  ALL TEMPLATES
                </option>
                {uniqueTemplates.map((tpl) => (
                  <option key={tpl} value={tpl} className="bg-academic-white text-academic-black">
                    {tpl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-[10px] font-bold tracking-wider text-academic-black uppercase">
              LOADING...
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="w-full overflow-x-auto border-t border-academic-black bg-academic-white">
              <table className="w-full text-left text-xs text-academic-black">
                <thead className="border-b border-academic-black bg-academic-white text-[10px] font-bold tracking-wider text-academic-black uppercase">
                  <tr>
                    <th className="px-6 py-4">DOCUMENT ID</th>
                    <th className="px-6 py-4">NAME / NO RM</th>
                    <th className="px-6 py-4">TEMPLATE NAME</th>
                    <th className="px-6 py-4">CATEGORY</th>
                    <th className="px-6 py-4">CREATED BY</th>
                    <th className="px-6 py-4">CREATED AT</th>
                    <th className="px-6 py-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => {
                    const docData =
                      typeof doc.data === "string"
                        ? JSON.parse(doc.data)
                        : doc.data;
                    const nameOrNoRm = docData.name || docData.rm_number || "-";
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="group cursor-pointer border-b border-academic-black transition-colors hover:bg-academic-green"
                      >
                        <td className="px-6 py-4 text-[10px] text-academic-black/60">
                          {doc.id.split("-")[0]}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                          {nameOrNoRm}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                          {doc.template?.title || "Unknown Template"}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold tracking-wider text-academic-black/80 uppercase">
                          {doc.template?.category || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-academic-black/80">
                          {doc.createdBy?.name ??
                            doc.createdBy?.email ??
                            "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-academic-black/60">
                          {new Date(doc.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            className="inline-flex items-center gap-2 border border-academic-black bg-academic-white px-4 py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors hover:bg-academic-black hover:text-academic-white"
                          >
                            DOWNLOAD <span>↓</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center border-t border-dashed border-academic-black text-xs font-bold tracking-wider text-academic-black/60 uppercase">
              No documents found.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
