"use client";

import Link from "next/link";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: documents = [], isLoading } = api.document.getAll.useQuery();

  const doc = documents.find((d) => d.id === id);

  if (isLoading) {
    return (
      <main className="flex h-full flex-col items-center bg-academic-white p-4 font-mono text-xs">
        <div className="font-bold tracking-wider text-academic-black uppercase">
          Loading...
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="flex h-full flex-col items-center bg-academic-white p-4 font-mono text-xs">
        <div className="font-bold tracking-wider text-academic-black uppercase">
          Document not found
        </div>
        <Link href="/documents" className="mt-4 text-academic-black/60 hover:text-academic-black">
          ← Back to Documents
        </Link>
      </main>
    );
  }

  const docData =
    typeof doc.data === "string" ? JSON.parse(doc.data) : doc.data;

  return (
    <main className="flex h-full flex-col bg-academic-white p-4 font-mono text-xs text-academic-black">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 mt-4">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 border-b-2 border-academic-black pb-1 text-[10px] font-bold tracking-widest text-academic-black uppercase hover:text-academic-black/60 transition-colors"
          >
            <span className="mb-[2px] leading-none">←</span>
            <span>BACK TO DOCUMENTS</span>
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="mb-2 text-3xl md:text-5xl font-bold tracking-widest text-academic-black uppercase border-b-4 border-academic-green inline-block pb-2">
            {doc.template?.title || "Document Details"}
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mt-4">
            {doc.template?.category || "N/A"} • Created{" "}
            {new Date(doc.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="border border-academic-black bg-academic-white p-6 md:p-10 shadow-[8px_8px_0px_#111111]">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b-2 border-academic-black pb-4 gap-4">
            <h2 className="text-xl font-bold tracking-widest text-academic-black uppercase flex items-center gap-3">
              <span className="bg-academic-green w-4 h-4 inline-block border border-academic-black"></span>
              Form Data
            </h2>
            <a
              href={`/api/documents/${doc.id}/download`}
              className="inline-flex items-center gap-2 border border-academic-black bg-academic-green px-6 py-3 text-[10px] font-bold tracking-widest text-academic-black uppercase transition-colors hover:bg-academic-black hover:text-academic-white shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              DOWNLOAD <span>↓</span>
            </a>
          </div>

          <div className="space-y-8">
            {Object.entries(docData).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase bg-academic-black/5 inline-block px-2 py-1 border border-academic-black/20 self-start">
                  {key.replace(/_/g, " ")}
                </div>
                {typeof value === "string" && value.startsWith("data:image") ? (
                  <div className="border border-academic-black bg-academic-white p-4 shadow-[4px_4px_0px_#48C796]">
                    <img
                      src={value}
                      alt={key}
                      className="max-h-32 border border-academic-black"
                    />
                  </div>
                ) : Array.isArray(value) ? (
                  <div className="space-y-4 pt-2">
                    {value.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-academic-black bg-academic-white p-6 relative"
                      >
                        <div className="absolute -top-3 -left-3 bg-academic-green border border-academic-black px-2 py-1 text-[10px] font-bold text-academic-black uppercase shadow-[2px_2px_0px_#111111]">
                          Row {idx + 1}
                        </div>
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-1 py-3 border-b border-academic-black/20 last:border-0 last:pb-0">
                            <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase">
                              {k.replace(/_/g, " ")}
                            </div>
                            {typeof v === "string" &&
                              v.startsWith("data:image") ? (
                              <img
                                src={v}
                                alt={k}
                                className="max-h-24 border border-academic-black mt-2"
                              />
                            ) : (
                              <div className="font-bold text-academic-black text-sm">
                                {String(v) || "-"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-academic-black bg-academic-white p-3 shadow-[4px_4px_0px_#48C796]">
                    <div className="font-bold text-academic-black text-sm">
                      {String(value) || "-"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 mb-12 border border-academic-black bg-academic-green p-6 md:p-8 shadow-[8px_8px_0px_#111111]">
          <h2 className="mb-6 text-xl font-bold tracking-widest text-academic-black uppercase flex items-center gap-3 border-b-2 border-academic-black pb-4">
            <span className="bg-academic-white w-4 h-4 inline-block border border-academic-black"></span>
            Document Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="border border-academic-black bg-academic-white p-4">
              <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mb-2 border-b border-academic-black pb-1">
                Document ID
              </div>
              <div className="font-mono text-academic-black truncate" title={doc.id}>{doc.id}</div>
            </div>
            <div className="border border-academic-black bg-academic-white p-4">
              <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mb-2 border-b border-academic-black pb-1">
                Template
              </div>
              <div className="font-bold text-academic-black truncate">
                {doc.template?.title || "N/A"}
              </div>
            </div>
            <div className="border border-academic-black bg-academic-white p-4">
              <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mb-2 border-b border-academic-black pb-1">
                Category
              </div>
              <div className="font-bold text-academic-black uppercase truncate">
                {doc.template?.category || "N/A"}
              </div>
            </div>
            <div className="border border-academic-black bg-academic-white p-4">
              <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mb-2 border-b border-academic-black pb-1">
                Created By
              </div>
              <div className="font-bold text-academic-black truncate">
                {doc.createdBy?.name ?? doc.createdBy?.email ?? "Unknown"}
              </div>
            </div>
            <div className="border border-academic-black bg-academic-white p-4 lg:col-span-2">
              <div className="text-[10px] font-bold tracking-widest text-academic-black/60 uppercase mb-2 border-b border-academic-black pb-1">
                Created At
              </div>
              <div className="font-mono text-academic-black truncate">
                {new Date(doc.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
