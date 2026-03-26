"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";

function isDateString(val: unknown): val is string {
  if (typeof val !== "string") return false;
  // Match ISO 8601 or plain YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(val) && !isNaN(Date.parse(val));
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: documents = [], isLoading } = api.document.getAll.useQuery();

  const doc = documents.find((d) => d.id === id);

  if (isLoading) {
    return (
      <main className="bg-academic-white flex h-full flex-col items-center p-4 font-mono text-xs">
        <div className="text-academic-black font-bold tracking-wider uppercase">
          Loading...
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="bg-academic-white flex h-full flex-col items-center p-4 font-mono text-xs">
        <div className="text-academic-black font-bold tracking-wider uppercase">
          Document not found
        </div>
        <Link
          href="/documents"
          className="text-academic-black/60 hover:text-academic-black mt-4"
        >
          ← Back to Documents
        </Link>
      </main>
    );
  }

  const docData: Record<string, unknown> =
    typeof doc.data === "string"
      ? (JSON.parse(doc.data) as Record<string, unknown>)
      : doc.data;

  return (
    <main className="bg-academic-white text-academic-black flex h-full flex-col p-4 font-mono text-xs">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mt-4 mb-8">
          <Link
            href="/documents"
            className="border-academic-black text-academic-black hover:text-academic-black/60 inline-flex items-center gap-2 border-b-2 pb-1 text-[10px] font-bold tracking-widest uppercase transition-colors"
          >
            <span className="mb-[2px] leading-none">←</span>
            <span>BACK TO DOCUMENTS</span>
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-academic-black border-academic-green mb-2 inline-block border-b-4 pb-2 text-3xl font-bold tracking-widest uppercase md:text-5xl">
            {doc.template?.title || "Document Details"}
          </h1>
          <p className="text-academic-black/60 mt-4 text-[10px] font-bold tracking-widest uppercase">
            {doc.template?.category || "N/A"} • Created{" "}
            {formatDate(doc.createdAt)}
          </p>
        </div>

        <div className="border-academic-black bg-academic-white border p-6 shadow-[8px_8px_0px_#111111] md:p-10">
          <div className="border-academic-black mb-8 flex flex-col justify-between gap-4 border-b-2 pb-4 md:flex-row md:items-center">
            <h2 className="text-academic-black flex items-center gap-3 text-xl font-bold tracking-widest uppercase">
              <span className="bg-academic-green border-academic-black inline-block h-4 w-4 border"></span>
              Form Data
            </h2>
            <a
              href={`/api/documents/${doc.id}/download`}
              className="border-academic-black bg-academic-green text-academic-black hover:bg-academic-black hover:text-academic-white inline-flex items-center gap-2 border px-6 py-3 text-[10px] font-bold tracking-widest uppercase shadow-[4px_4px_0px_#111111] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111]"
            >
              DOWNLOAD <span>↓</span>
            </a>
          </div>

          <div className="space-y-8">
            {Object.entries(docData).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 inline-block self-start border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                  {key.replace(/_/g, " ")}
                </div>
                {typeof value === "string" && value.startsWith("data:image") ? (
                  <div className="border-academic-black bg-academic-white border p-4 shadow-[4px_4px_0px_#48C796]">
                    <Image
                      src={value}
                      alt={key}
                      width={128}
                      height={128}
                      className="border-academic-black max-h-32 border object-contain"
                    />
                  </div>
                ) : Array.isArray(value) ? (
                  <div className="space-y-4 pt-2">
                    {value.map((item, idx) => (
                      <div
                        key={`row-${idx}`}
                        className="border-academic-black bg-academic-white relative border p-6"
                      >
                        <div className="bg-academic-green border-academic-black text-academic-black absolute -top-3 -left-3 border px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0px_#111111]">
                          Row {idx + 1}
                        </div>
                        {Object.entries(item as Record<string, unknown>).map(
                          ([k, v]) => (
                            <div
                              key={k}
                              className="border-academic-black/20 flex flex-col gap-1 border-b py-3 last:border-0 last:pb-0"
                            >
                              <div className="text-academic-black/60 text-[10px] font-bold tracking-widest uppercase">
                                {k.replace(/_/g, " ")}
                              </div>
                              {typeof v === "string" &&
                              v.startsWith("data:image") ? (
                                <Image
                                  src={v}
                                  alt={k}
                                  width={96}
                                  height={96}
                                  className="border-academic-black mt-2 max-h-24 border object-contain"
                                />
                              ) : (
                                <div className="text-academic-black text-sm font-bold">
                                  {isDateString(v)
                                    ? formatDate(v)
                                    : String(v) || "-"}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-academic-black bg-academic-white border p-3 shadow-[4px_4px_0px_#48C796]">
                    <div className="text-academic-black text-sm font-bold">
                      {isDateString(value)
                        ? formatDate(value)
                        : String(value) || "-"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-academic-black bg-academic-green mt-12 mb-12 border p-6 shadow-[8px_8px_0px_#111111] md:p-8">
          <h2 className="text-academic-black border-academic-black mb-6 flex items-center gap-3 border-b-2 pb-4 text-xl font-bold tracking-widest uppercase">
            <span className="bg-academic-white border-academic-black inline-block h-4 w-4 border"></span>
            Document Info
          </h2>
          <div className="grid grid-cols-1 gap-6 text-xs md:grid-cols-2 lg:grid-cols-3">
            <div className="border-academic-black bg-academic-white border p-4">
              <div className="text-academic-black/60 border-academic-black mb-2 border-b pb-1 text-[10px] font-bold tracking-widest uppercase">
                Document ID
              </div>
              <div
                className="text-academic-black truncate font-mono"
                title={doc.id}
              >
                {doc.id}
              </div>
            </div>
            <div className="border-academic-black bg-academic-white border p-4">
              <div className="text-academic-black/60 border-academic-black mb-2 border-b pb-1 text-[10px] font-bold tracking-widest uppercase">
                Template
              </div>
              <div className="text-academic-black truncate font-bold">
                {doc.template?.title || "N/A"}
              </div>
            </div>
            <div className="border-academic-black bg-academic-white border p-4">
              <div className="text-academic-black/60 border-academic-black mb-2 border-b pb-1 text-[10px] font-bold tracking-widest uppercase">
                Category
              </div>
              <div className="text-academic-black truncate font-bold uppercase">
                {doc.template?.category || "N/A"}
              </div>
            </div>
            <div className="border-academic-black bg-academic-white border p-4">
              <div className="text-academic-black/60 border-academic-black mb-2 border-b pb-1 text-[10px] font-bold tracking-widest uppercase">
                Created By
              </div>
              <div className="text-academic-black truncate font-bold">
                {doc.createdBy?.name ?? doc.createdBy?.email ?? "Unknown"}
              </div>
            </div>
            <div className="border-academic-black bg-academic-white border p-4 lg:col-span-2">
              <div className="text-academic-black/60 border-academic-black mb-2 border-b pb-1 text-[10px] font-bold tracking-widest uppercase">
                Created At
              </div>
              <div className="text-academic-black truncate font-mono">
                {formatDate(doc.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
