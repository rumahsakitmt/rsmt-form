"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function DocumentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: documents = [], isLoading: isDocsLoading } =
    api.document.getAll.useQuery();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const isLoading = isDocsLoading || isSessionLoading;

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
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-black font-sans text-sm md:flex-row md:p-[2px]">
      {/* Mobile Header with Drawer */}
      <div className="flex shrink-0 items-center justify-between bg-[#454545] p-4 text-white md:hidden">
        <div className="flex w-full items-center justify-between text-[11px] font-bold tracking-wider uppercase">
          <span>LIBRARY 01</span>
          <Drawer direction="left">
            <DrawerTrigger asChild>
              <button className="rounded border border-gray-500 px-3 py-1 transition-colors hover:bg-white hover:text-black">
                MENU
              </button>
            </DrawerTrigger>
            <DrawerContent className="inset-y-0 left-0 h-full w-[280px] rounded-none bg-[#454545]">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Navigation Menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex h-full flex-col justify-between p-6 text-white">
                <div>
                  <div className="mb-8 flex justify-between text-[11px] font-bold tracking-wider uppercase">
                    <span>LIBRARY</span>
                    <span>01</span>
                  </div>

                  <nav className="flex flex-col space-y-5 text-[13px] font-extrabold tracking-wide">
                    <Link
                      href="/"
                      className="flex cursor-pointer items-center justify-between text-gray-400 transition-colors hover:text-white"
                    >
                      <span>ALL TEMPLATES</span>
                    </Link>
                    <div className="flex cursor-pointer items-center justify-between text-white transition-colors hover:text-gray-300">
                      <span>GENERATED DOCUMENTS</span>
                      <div className="h-2.5 w-2.5 rounded-full bg-white" />
                    </div>
                    <Link
                      href="/admin/templates/new"
                      className="mt-4 flex cursor-pointer items-center justify-between border-t border-gray-600 pt-4 text-gray-400 transition-colors hover:text-white"
                    >
                      <span>ADD TEMPLATE +</span>
                    </Link>
                  </nav>
                </div>

                <div className="space-y-6 text-[11px] font-bold tracking-wider">
                  <div className="flex justify-between text-gray-400 uppercase">
                    <span className="text-white">SYSTEM</span>
                    <span>v2.4</span>
                  </div>
                  {session ? (
                    <div className="flex flex-col gap-2">
                      <div className="leading-tight text-gray-400 uppercase">
                        LOGGED IN AS
                        <br />
                        <span className="text-white">
                          {session.user.name || session.user.email}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          void authClient.signOut({
                            fetchOptions: {
                              onSuccess: () => {
                                window.location.href = "/login";
                              },
                            },
                          });
                        }}
                        className="text-left text-[10px] tracking-wider text-gray-400 uppercase transition-colors hover:text-white"
                      >
                        SIGN OUT
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="leading-tight text-gray-400 uppercase">
                        NOT LOGGED IN
                      </div>
                      <Link
                        href="/login"
                        className="text-[11px] tracking-wider text-white uppercase transition-colors hover:text-gray-300"
                      >
                        SIGN IN →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Left Sidebar - Desktop only */}
      <aside className="relative hidden w-full flex-1 shrink-0 flex-col justify-between overflow-y-auto border-b-2 border-black bg-[#454545] p-6 text-white md:flex md:h-full md:w-[280px] md:flex-none md:border-r-2 md:border-b-0">
        <div>
          <div className="mb-8 hidden justify-between text-[11px] font-bold tracking-wider uppercase md:flex">
            <span>LIBRARY</span>
            <span>01</span>
          </div>

          <nav className="flex flex-col space-y-5 text-[13px] font-extrabold tracking-wide">
            <Link
              href="/"
              className="flex cursor-pointer items-center justify-between text-gray-400 transition-colors hover:text-white"
            >
              <span>ALL TEMPLATES</span>
            </Link>
            <div className="flex cursor-pointer items-center justify-between text-white transition-colors hover:text-gray-300">
              <span>GENERATED DOCUMENTS</span>
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <Link
              href="/admin/templates/new"
              className="mt-4 flex cursor-pointer items-center justify-between border-t border-gray-600 pt-4 text-gray-400 transition-colors hover:text-white"
            >
              <span>ADD TEMPLATE +</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-6 text-[11px] font-bold tracking-wider">
          <div className="flex justify-between text-gray-400 uppercase">
            <span className="text-white">SYSTEM</span>
            <span>v2.4</span>
          </div>
          {session ? (
            <div className="flex flex-col gap-2">
              <div className="leading-tight text-gray-400 uppercase">
                LOGGED IN AS
                <br />
                <span className="text-white">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  void authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/login";
                      },
                    },
                  });
                }}
                className="text-left text-[10px] tracking-wider text-gray-400 uppercase transition-colors hover:text-white"
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="leading-tight text-gray-400 uppercase">
                NOT LOGGED IN
              </div>
              <Link
                href="/login"
                className="text-[11px] tracking-wider text-white uppercase transition-colors hover:text-gray-300"
              >
                SIGN IN →
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Middle Content */}
      <section
        className={`${isMobileMenuOpen ? "hidden" : "flex"} flex-1 flex-col overflow-y-auto border-t border-[#333] bg-black p-4 md:m-[2px] md:flex md:rounded-xl md:border md:p-8`}
      >
        <div className="mb-6 flex flex-col gap-6 md:mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h1 className="text-xl font-bold tracking-widest text-[#EAE8E3] uppercase md:text-3xl">
              Generated Documents
            </h1>
            <div className="text-xs font-bold tracking-wider text-gray-500">
              TOTAL: {filteredDocs.length}
            </div>
          </div>

          {/* Filters */}
          <div className="flex w-full flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="SEARCH DOCUMENTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-b-2 border-[#333] bg-transparent py-2 text-[11px] font-bold tracking-wider text-white uppercase placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="cursor-pointer border-b-2 border-[#333] bg-transparent py-2 text-[11px] font-bold tracking-wider text-white uppercase transition-colors focus:border-gray-500 focus:outline-none md:w-48"
            >
              <option value="" className="bg-[#1A1A1A]">
                ALL CATEGORIES
              </option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1A1A1A]">
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="cursor-pointer border-b-2 border-[#333] bg-transparent py-2 text-[11px] font-bold tracking-wider text-white uppercase transition-colors focus:border-gray-500 focus:outline-none md:w-48"
            >
              <option value="" className="bg-[#1A1A1A]">
                ALL TEMPLATES
              </option>
              {uniqueTemplates.map((tpl) => (
                <option key={tpl} value={tpl} className="bg-[#1A1A1A]">
                  {tpl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-bold tracking-wider text-white uppercase">
            LOADING...
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="w-full overflow-x-auto rounded-xl border border-[#333] bg-[#1A1A1A]">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-[#333] bg-[#222] text-[10px] font-bold tracking-wider text-gray-500 uppercase">
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
                      className="group cursor-pointer border-b border-[#333] transition-colors hover:bg-[#2A2A2A]"
                    >
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-500">
                        {doc.id.split("-")[0]}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold tracking-wide text-white uppercase">
                        {nameOrNoRm}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold tracking-wide text-white uppercase">
                        {doc.template?.title || "Unknown Template"}
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                        {doc.template?.category || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-[12px] font-bold text-gray-300">
                        {doc.createdBy?.name ??
                          doc.createdBy?.email ??
                          "Unknown"}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-400">
                        {new Date(doc.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          className="inline-flex items-center gap-2 rounded bg-[#EAE8E3] px-4 py-2 text-[10px] font-bold tracking-wider text-black uppercase transition-colors hover:bg-white"
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
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#333] text-sm font-bold tracking-wider text-gray-500 uppercase">
            No documents found.
          </div>
        )}
      </section>
    </main>
  );
}
