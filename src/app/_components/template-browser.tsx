"use client";

import { useState, useMemo } from "react";
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

export function TemplateBrowser() {
  const router = useRouter();
  const utils = api.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");
  const { data: cards = [], isLoading: isCardsLoading } =
    api.template.getAll.useQuery();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const deleteMutation = api.template.delete.useMutation({
    onSuccess: () => {
      void utils.template.getAll.invalidate();
    },
  });

  const isLoading = isCardsLoading || isSessionLoading;

  const docTypes = useMemo(() => {
    const categories = new Set(
      cards.map((card) => card.category).filter(Boolean),
    );
    return Array.from(categories).sort();
  }, [cards]);

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDocType = selectedDocType
      ? card.category === selectedDocType
      : true;

    return matchesSearch && matchesDocType;
  });

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-black font-sans text-sm md:flex-row md:p-[2px]">
      <div className="flex shrink-0 items-center justify-between bg-[#454545] p-4 text-white md:hidden">
        <div className="flex w-full items-center justify-between text-[11px] font-bold tracking-wider uppercase">
          <span>LIBRARY 01</span>
          <Drawer >
            <DrawerTrigger asChild>
              <button className="rounded border border-gray-500 px-3 py-1 transition-colors hover:bg-white hover:text-black">
                MENU
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-[#454545]">
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
                    <div
                      onClick={() => setSelectedDocType("")}
                      className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${!selectedDocType ? "text-white" : "text-gray-400"}`}
                    >
                      <span>ALL TEMPLATES</span>
                      {!selectedDocType && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </div>

                    {docTypes.map((docType) => (
                      <div
                        key={docType}
                        onClick={() => setSelectedDocType(docType)}
                        className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${selectedDocType === docType ? "text-white" : "text-gray-400"}`}
                      >
                        <span>DOCUMENT {docType}</span>
                        {selectedDocType === docType && (
                          <div className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    ))}

                    <Link
                      href="/documents"
                      className="mt-4 flex cursor-pointer items-center justify-between border-t border-gray-600 pt-5 text-gray-400 transition-colors hover:text-white"
                    >
                      <span>GENERATED DOCUMENTS</span>
                    </Link>
                    <Link
                      href="/admin/templates/new"
                      className="flex cursor-pointer items-center justify-between text-gray-400 transition-colors hover:text-white"
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
            <div
              onClick={() => setSelectedDocType("")}
              className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${!selectedDocType ? "text-white" : "text-gray-400"}`}
            >
              <span>ALL TEMPLATES</span>
              {!selectedDocType && (
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
            </div>

            {docTypes.map((docType) => (
              <div
                key={docType}
                onClick={() => setSelectedDocType(docType)}
                className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${selectedDocType === docType ? "text-white" : "text-gray-400"}`}
              >
                <span>DOCUMENT {docType}</span>
                {selectedDocType === docType && (
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                )}
              </div>
            ))}

            <Link
              href="/documents"
              className="mt-4 flex cursor-pointer items-center justify-between border-t border-gray-600 pt-5 text-gray-400 transition-colors hover:text-white"
            >
              <span>GENERATED DOCUMENTS</span>
            </Link>
            <Link
              href="/admin/templates/new"
              className="flex cursor-pointer items-center justify-between text-gray-400 transition-colors hover:text-white"
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

      {/* Middle Grid */}
      <section className="relative flex-1 overflow-y-auto bg-black px-[2px] pb-[2px] md:block md:pb-0">
        <div className="sticky top-0 z-10 mb-[2px] flex flex-col justify-between gap-4 border-b border-[#333] bg-black/80 p-6 backdrop-blur-md md:flex-row md:items-end md:p-8">
          <h1 className="text-xl font-bold tracking-widest text-[#EAE8E3] uppercase md:text-3xl">
            {selectedDocType ? `Document ${selectedDocType}` : "Templates"}
          </h1>
          <div className="w-full md:w-[300px]">
            <input
              type="text"
              placeholder="SEARCH TEMPLATES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-b-2 border-gray-500 bg-transparent py-2 text-[11px] font-bold tracking-wider text-white uppercase placeholder-gray-500 transition-colors focus:border-white focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm font-bold tracking-wider text-white uppercase">
            LOADING...
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid h-auto min-h-full grid-cols-1 gap-[2px] md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => (
              <div
                onClick={() => router.push(`/template/${card.id}`)}
                key={card.id}
                className={`group relative flex aspect-square cursor-pointer flex-col p-6 transition-opacity hover:opacity-90 ${card.theme === "dark"
                  ? "bg-[#454545] text-white"
                  : "bg-[#EAE8E3] text-black"
                  }`}
              >
                <div
                  className={`flex justify-between text-[10px] font-bold tracking-wider uppercase ${card.theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  <span>{card.category}</span>
                  <span
                    className={
                      card.theme === "dark" ? "text-white" : "text-black"
                    }
                  >
                    {card.status}
                  </span>
                </div>

                <div className="mt-6 mb-4 flex flex-1 flex-col justify-center">
                  <h3 className="text-[26px] leading-[1.05] font-bold tracking-tight whitespace-pre-line">
                    {card.title}
                  </h3>
                </div>

                <div className="relative mt-auto flex items-end justify-between text-[11px] font-bold tracking-wider">
                  <div className="flex items-center gap-2">
                    {card.theme === "light" ? (
                      <div className="h-3 w-3 rounded-full bg-black" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                    {session && (
                      <div className="ml-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/templates/${card.id}/edit`);
                          }}
                          className="hover:underline"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Are you sure you want to delete this template?",
                              )
                            ) {
                              deleteMutation.mutate({ id: card.id });
                            }
                          }}
                          className="text-red-500 hover:underline"
                        >
                          {deleteMutation.isPending &&
                            deleteMutation.variables?.id === card.id
                            ? "DELETING..."
                            : "DELETE"}
                        </button>
                      </div>
                    )}
                  </div>
                  <span>{card.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold tracking-wider text-white uppercase">
            No templates found.
          </div>
        )}
      </section>
    </main>
  );
}
