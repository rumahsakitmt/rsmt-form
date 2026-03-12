"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DocumentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

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
    <section className="bg-academic-white text-academic-black mx-auto min-h-dvh max-w-6xl flex-1 flex-col space-y-4 overflow-auto overflow-y-auto border border-black p-2 md:flex md:p-8">
      <div className="flex w-full flex-col items-center gap-4 md:flex-row">
        <input
          type="text"
          placeholder="SEARCH DOCUMENTS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-academic-black bg-academic-white text-academic-black placeholder-academic-black/50 focus:border-academic-black w-full flex-1 border-b-2 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors focus:outline-none"
        />
        <Select
          value={selectedCategory || "all"}
          onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}
        >
          <SelectTrigger className="border-academic-black bg-academic-white text-academic-black focus:border-academic-black h-auto min-h-[34px] w-full cursor-pointer rounded-none border-0 border-b-2 px-0 py-2 text-[10px] font-bold tracking-wider uppercase shadow-none transition-colors focus:ring-0 focus:outline-none md:w-48">
            <SelectValue placeholder="ALL CATEGORIES" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem
              value="all"
              className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              ALL CATEGORIES
            </SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem
                key={cat}
                value={cat ?? ""}
                className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedTemplate || "all"}
          onValueChange={(val) => setSelectedTemplate(val === "all" ? "" : val)}
        >
          <SelectTrigger className="border-academic-black bg-academic-white text-academic-black focus:border-academic-black h-auto min-h-[34px] w-full cursor-pointer rounded-none border-0 border-b-2 px-0 py-2 text-[10px] font-bold tracking-wider uppercase shadow-none transition-colors focus:ring-0 focus:outline-none md:w-48">
            <SelectValue placeholder="ALL TEMPLATES" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem
              value="all"
              className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              ALL TEMPLATES
            </SelectItem>
            {uniqueTemplates.map((tpl) => (
              <SelectItem
                key={tpl}
                value={tpl ?? ""}
                className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
              >
                {tpl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-academic-black flex flex-1 items-center justify-center text-[10px] font-bold tracking-wider uppercase">
          LOADING...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="border-academic-black bg-academic-white w-full overflow-x-auto border-t">
          <Table className="text-academic-black w-full text-left text-xs">
            <TableHeader className="border-academic-black bg-academic-white text-academic-black border-b text-[10px] font-bold tracking-wider uppercase hover:bg-transparent">
              <TableRow className="border-academic-black hover:bg-transparent">
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  DOCUMENT ID
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  NAME / NO RM
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  TEMPLATE NAME
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  CATEGORY
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  CREATED BY
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  CREATED AT
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4 text-right">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const docData: Record<string, unknown> =
                  typeof doc.data === "string"
                    ? (JSON.parse(doc.data) as Record<string, unknown>)
                    : doc.data;
                const nameOrNoRm =
                  (docData.name as string) ??
                  (docData.rm_number as string) ??
                  "-";
                return (
                  <TableRow
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="group border-academic-black hover:bg-academic-green cursor-pointer border-b transition-colors"
                  >
                    <TableCell className="text-academic-black/60 px-6 py-4 text-[10px]">
                      {doc.id.split("-")[0]}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      {nameOrNoRm}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      {doc.template?.title || "Unknown Template"}
                    </TableCell>
                    <TableCell className="text-academic-black/80 px-6 py-4 text-[10px] font-bold tracking-wider uppercase">
                      {doc.template?.category || "N/A"}
                    </TableCell>
                    <TableCell className="text-academic-black/80 px-6 py-4 text-[10px] font-bold">
                      {doc.createdBy?.name ?? doc.createdBy?.email ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-academic-black/60 px-6 py-4 text-[10px]">
                      {new Date(doc.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right align-middle">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="inline-block"
                      >
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="border-academic-black bg-academic-white text-academic-black hover:bg-academic-black hover:text-academic-white inline-flex items-center gap-2 border px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors"
                        >
                          DOWNLOAD <span>↓</span>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border-academic-black text-academic-black/60 flex flex-1 items-center justify-center border-t border-dashed text-xs font-bold tracking-wider uppercase">
          No documents found.
        </div>
      )}
    </section>
  );
}
