"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import { formatDate } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DocumentsPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  const utils = api.useUtils();
  const { data: documents = [], isLoading: isDocsLoading } =
    api.document.getAll.useQuery();

  const deleteMutation = api.document.delete.useMutation({
    onSuccess: () => {
      void utils.document.getAll.invalidate();
    },
  });

  const isLoading = isDocsLoading;

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const getDocDate = (
    docData: Record<string, unknown>,
    keys: string[],
  ): string | null => {
    // 1. exact match
    for (const key of keys) {
      const val = docData[key];
      if (val && typeof val === "string") return val;
    }
    // 2. fuzzy match (key contains any of the search terms)
    const dataKeys = Object.keys(docData);
    for (const key of keys) {
      const matched = dataKeys.find(
        (k) =>
          k.toLowerCase().includes(key.toLowerCase()) &&
          docData[k] &&
          typeof docData[k] === "string",
      );
      if (matched) return docData[matched] as string;
    }
    return null;
  };

  const isExpired = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const uniqueCategories = Array.from(
    new Set(documents.map((d) => d.template?.category).filter(Boolean)),
  );
  const uniqueTemplates = Array.from(
    new Set(documents.map((d) => d.template?.title).filter(Boolean)),
  );

  const filteredDocs = documents.filter((doc) => {
    const docData: Record<string, unknown> =
      typeof doc.data === "string"
        ? (JSON.parse(doc.data) as Record<string, unknown>)
        : doc.data;

    const searchLower = searchQuery.toLowerCase();
    const nameOrRm = (
      (docData.name as string) ??
      (docData.rm_number as string) ??
      ""
    ).toLowerCase();

    const matchesSearch =
      !searchQuery ||
      (doc.template?.title?.toLowerCase().includes(searchLower) ?? false) ||
      (doc.template?.category?.toLowerCase().includes(searchLower) ?? false) ||
      nameOrRm.includes(searchLower);

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
          placeholder="CARI DOKUMEN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-academic-black bg-academic-white text-academic-black placeholder-academic-black/50 focus:border-academic-black w-full flex-1 border-b-2 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors focus:outline-none"
        />
        <Select
          value={selectedCategory || "all"}
          onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}
        >
          <SelectTrigger className="border-academic-black bg-academic-white text-academic-black focus:border-academic-black h-auto min-h-[34px] w-full cursor-pointer rounded-none border-0 border-b-2 px-0 py-2 text-[10px] font-bold tracking-wider uppercase shadow-none transition-colors focus:ring-0 focus:outline-none md:w-48">
            <SelectValue placeholder="SEMUA KATEGORI" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem
              value="all"
              className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              SEMUA KATEGORI
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
            <SelectValue placeholder="SEMUA TEMPLATE" />
          </SelectTrigger>
          <SelectContent className="bg-academic-white border-academic-black rounded-none">
            <SelectItem
              value="all"
              className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              SEMUA TEMPLATE
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
          MEMUAT...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="border-academic-black bg-academic-white w-full overflow-x-auto border-t">
          <Table className="text-academic-black w-full text-left text-xs">
            <TableHeader className="border-academic-black bg-academic-white text-academic-black border-b text-[10px] font-bold tracking-wider uppercase hover:bg-transparent">
              <TableRow className="border-academic-black hover:bg-transparent">
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  NAMA / NO RM
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  NAMA TEMPLATE
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  DARI TANGGAL
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  SAMPAI TANGGAL
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4">
                  TANGGAL DIBUAT
                </TableHead>
                <TableHead className="text-academic-black h-auto px-6 py-4 text-right">
                  AKSI
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
                const fromDateValue = getDocDate(docData, [
                  "dari",
                  "from",
                  "tanggal_mulai",
                  "start_date",
                  "date_from",
                ]);
                const toDateValue = getDocDate(docData, [
                  "sampai",
                  "to",
                  "tanggal_selesai",
                  "end_date",
                  "date_to",
                ]);
                const expired = toDateValue ? isExpired(toDateValue) : false;
                return (
                  <TableRow
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className={`group border-academic-black cursor-pointer border-b transition-colors ${expired ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-academic-green"}`}
                  >
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      <div className="flex flex-col gap-1">
                        <span>{nameOrNoRm}</span>
                        {(doc.template?.category?.toLowerCase() === "up3" ||
                          doc.template?.room?.toLowerCase() === "up3") &&
                          doc.driveFolderUrl && (
                            <a
                              href={doc.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex w-fit items-center gap-1 text-[9px] text-blue-600 normal-case hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                              Drive Link
                            </a>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold tracking-wide uppercase">
                      {doc.template?.title || "Unknown Template"}
                    </TableCell>
                    <TableCell className="text-academic-black/60 px-6 py-4 text-[10px]">
                      {fromDateValue ? formatDate(fromDateValue) : "-"}
                    </TableCell>
                    <TableCell className="text-academic-black/60 px-6 py-4 text-[10px]">
                      {toDateValue ? formatDate(toDateValue) : "-"}
                    </TableCell>
                    <TableCell className="text-academic-black/60 px-6 py-4 text-[10px]">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right align-middle">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="inline-flex gap-2"
                      >
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="border-academic-black bg-academic-white text-academic-black hover:bg-academic-black hover:text-academic-white inline-flex items-center gap-2 border px-4 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors"
                        >
                          UNDUH <span>↓</span>
                        </a>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="bg-academic-white hover:text-academic-white inline-flex items-center gap-2 border border-red-600 px-4 py-2 text-[10px] font-bold tracking-wider text-red-600 uppercase transition-colors hover:bg-red-600"
                              >
                                HAPUS <span>×</span>
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-academic-white border-academic-black rounded-none border-2 font-mono shadow-[8px_8px_0px_#111111]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-academic-black font-bold tracking-widest uppercase">
                                  Hapus Dokumen
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-academic-black/70">
                                  Apakah Anda yakin ingin menghapus dokumen ini?
                                  Ini juga akan menghapus folder di Google
                                  Drive.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-academic-black hover:bg-academic-black/5 rounded-none border-2 text-xs font-bold tracking-widest uppercase">
                                  Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(doc.id);
                                  }}
                                  className="rounded-none bg-red-600 text-xs font-bold tracking-widest text-white uppercase hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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
          Tidak ada dokumen.
        </div>
      )}
    </section>
  );
}
