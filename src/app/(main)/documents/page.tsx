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
    <section
      className="flex-1 flex-col overflow-y-auto max-w-6xl mx-auto bg-academic-white p-2 md:flex md:p-8 text-academic-black border border-black space-y-4 overflow-auto min-h-dvh"
    >
      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        <input
          type="text"
          placeholder="SEARCH DOCUMENTS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 w-full border-b-2 border-academic-black bg-academic-white py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase placeholder-academic-black/50 transition-colors focus:border-academic-black focus:outline-none"
        />
        <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
          <SelectTrigger className="cursor-pointer w-full border-0 border-b-2 border-academic-black bg-academic-white py-2 px-0 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors focus:ring-0 focus:border-academic-black focus:outline-none md:w-48 rounded-none h-auto min-h-[34px] shadow-none">
            <SelectValue placeholder="ALL CATEGORIES" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem value="all" className="focus:bg-academic-green focus:text-academic-black text-[10px] font-bold uppercase tracking-wider cursor-pointer">ALL CATEGORIES</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat ?? ""} className="focus:bg-academic-green focus:text-academic-black text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTemplate || "all"} onValueChange={(val) => setSelectedTemplate(val === "all" ? "" : val)}>
          <SelectTrigger className="cursor-pointer w-full border-0 border-b-2 border-academic-black bg-academic-white py-2 px-0 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors focus:ring-0 focus:border-academic-black focus:outline-none md:w-48 rounded-none h-auto min-h-[34px] shadow-none">
            <SelectValue placeholder="ALL TEMPLATES" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem value="all" className="focus:bg-academic-green focus:text-academic-black text-[10px] font-bold uppercase tracking-wider cursor-pointer">ALL TEMPLATES</SelectItem>
            {uniqueTemplates.map((tpl) => (
              <SelectItem key={tpl} value={tpl ?? ""} className="focus:bg-academic-green focus:text-academic-black text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                {tpl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-[10px] font-bold tracking-wider text-academic-black uppercase">
          LOADING...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="w-full overflow-x-auto border-t border-academic-black bg-academic-white">
          <Table className="w-full text-left text-xs text-academic-black">
            <TableHeader className="border-b border-academic-black bg-academic-white text-[10px] font-bold tracking-wider text-academic-black uppercase hover:bg-transparent">
              <TableRow className="border-academic-black hover:bg-transparent">
                <TableHead className="px-6 py-4 h-auto text-academic-black">DOCUMENT ID</TableHead>
                <TableHead className="px-6 py-4 h-auto text-academic-black">NAME / NO RM</TableHead>
                <TableHead className="px-6 py-4 h-auto text-academic-black">TEMPLATE NAME</TableHead>
                <TableHead className="px-6 py-4 h-auto text-academic-black">CATEGORY</TableHead>
                <TableHead className="px-6 py-4 h-auto text-academic-black">CREATED BY</TableHead>
                <TableHead className="px-6 py-4 h-auto text-academic-black">CREATED AT</TableHead>
                <TableHead className="px-6 py-4 h-auto text-right text-academic-black">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const docData =
                  typeof doc.data === "string"
                    ? JSON.parse(doc.data)
                    : doc.data;
                const nameOrNoRm = docData.name || docData.rm_number || "-";
                return (
                  <TableRow
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="group cursor-pointer border-b border-academic-black transition-colors hover:bg-academic-green"
                  >
                    <TableCell className="px-6 py-4 text-[10px] text-academic-black/60">
                      {doc.id.split("-")[0]}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      {nameOrNoRm}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      {doc.template?.title || "Unknown Template"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[10px] font-bold tracking-wider text-academic-black/80 uppercase">
                      {doc.template?.category || "N/A"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[10px] font-bold text-academic-black/80">
                      {doc.createdBy?.name ??
                        doc.createdBy?.email ??
                        "Unknown"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[10px] text-academic-black/60">
                      {new Date(doc.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right align-middle">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block"
                      >
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="inline-flex items-center gap-2 border border-academic-black bg-academic-white px-4 py-2 text-[10px] font-bold tracking-wider text-academic-black uppercase transition-colors hover:bg-academic-black hover:text-academic-white"
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
        <div className="flex flex-1 items-center justify-center border-t border-dashed border-academic-black text-xs font-bold tracking-wider text-academic-black/60 uppercase">
          No documents found.
        </div>
      )}

    </section>
  );
}
