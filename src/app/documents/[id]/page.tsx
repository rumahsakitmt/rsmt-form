"use client";

import Link from "next/link";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import { useParams } from "next/navigation";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: documents = [], isLoading } = api.document.getAll.useQuery();
  const { data: session } = authClient.useSession();

  const doc = documents.find((d) => d.id === id);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-black p-4 font-sans text-sm">
        <div className="font-bold tracking-wider text-white uppercase">
          Loading...
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-black p-4 font-sans text-sm">
        <div className="font-bold tracking-wider text-white uppercase">
          Document not found
        </div>
        <Link href="/documents" className="mt-4 text-gray-400 hover:text-white">
          ← Back to Documents
        </Link>
      </main>
    );
  }

  const docData =
    typeof doc.data === "string" ? JSON.parse(doc.data) : doc.data;

  return (
    <main className="flex min-h-screen flex-col bg-black p-4 font-sans text-sm">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href="/documents"
            className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-white uppercase hover:text-gray-300"
          >
            <span className="mb-[2px] text-lg leading-none">←</span>
            <span>BACK TO DOCUMENTS</span>
          </Link>
        </div>

        <div className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-wider text-white uppercase">
            {doc.template?.title || "Document Details"}
          </h1>
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
            {doc.template?.category || "N/A"} • Created{" "}
            {new Date(doc.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#333] bg-[#1A1A1A] p-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#333] pb-4">
            <h2 className="text-lg font-bold tracking-wider text-white uppercase">
              Form Data
            </h2>
            <a
              href={`/api/documents/${doc.id}/download`}
              className="inline-flex items-center gap-2 rounded bg-[#EAE8E3] px-4 py-2 text-[10px] font-bold tracking-wider text-black uppercase transition-colors hover:bg-white"
            >
              DOWNLOAD <span>↓</span>
            </a>
          </div>

          <div className="space-y-6">
            {Object.entries(docData).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  {key.replace(/_/g, " ")}
                </div>
                {typeof value === "string" && value.startsWith("data:image") ? (
                  <div className="rounded-lg border border-[#333] bg-[#222] p-4">
                    <img
                      src={value}
                      alt={key}
                      className="max-h-32 rounded border border-[#444]"
                    />
                  </div>
                ) : Array.isArray(value) ? (
                  <div className="space-y-3">
                    {value.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#333] bg-[#222] p-4"
                      >
                        <div className="mb-2 text-[10px] font-bold text-gray-500 uppercase">
                          Row {idx + 1}
                        </div>
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-1 py-2">
                            <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                              {k.replace(/_/g, " ")}
                            </div>
                            {typeof v === "string" &&
                            v.startsWith("data:image") ? (
                              <img
                                src={v}
                                alt={k}
                                className="max-h-24 rounded border border-[#333]"
                              />
                            ) : (
                              <div className="font-bold text-white">
                                {String(v) || "-"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#333] bg-[#222] p-3">
                    <div className="font-bold text-white">
                      {String(value) || "-"}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#333] bg-[#1A1A1A] p-6">
          <h2 className="mb-4 text-lg font-bold tracking-wider text-white uppercase">
            Document Info
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Document ID
              </div>
              <div className="font-mono text-xs text-gray-500">{doc.id}</div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Template
              </div>
              <div className="font-bold text-white">
                {doc.template?.title || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Category
              </div>
              <div className="font-bold text-white uppercase">
                {doc.template?.category || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Created By
              </div>
              <div className="font-bold text-white">
                {doc.createdBy?.name ?? doc.createdBy?.email ?? "Unknown"}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Created At
              </div>
              <div className="font-mono text-xs text-gray-400">
                {new Date(doc.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
