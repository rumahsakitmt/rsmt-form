"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";

export function TemplateBrowser() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: cards = [], isLoading: isCardsLoading } = api.template.getAll.useQuery();
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const isLoading = isCardsLoading || isSessionLoading;

    const filteredCards = cards.filter((card) =>
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="flex h-screen w-full bg-black p-[2px] font-sans overflow-hidden text-sm">
            {/* Left Sidebar */}
            <aside className="w-[280px] bg-[#454545] text-white flex flex-col justify-between p-6 h-full border-r-2 border-black shrink-0 relative">
                <div>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-8">
                        <span>LIBRARY</span>
                        <span>01</span>
                    </div>

                    <div className="mb-8">
                        <input
                            type="text"
                            placeholder="SEARCH TEMPLATES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-gray-500 text-white placeholder-gray-500 text-[11px] font-bold uppercase tracking-wider py-2 focus:outline-none focus:border-white transition-colors"
                        />
                    </div>

                    <nav className="flex flex-col space-y-5 text-[13px] font-extrabold tracking-wide">
                        <div className="flex justify-between items-center text-white cursor-pointer hover:text-gray-300 transition-colors">
                            <span>ALL TEMPLATES</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                        <Link href="/admin/templates/new" className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>ADD TEMPLATE +</span>
                        </Link>
                    </nav>
                </div>

                <div className="text-[11px] font-bold tracking-wider space-y-6">
                    <div className="flex justify-between uppercase text-gray-400">
                        <span className="text-white">SYSTEM</span>
                        <span>v2.4</span>
                    </div>
                    {session ? (
                        <div className="flex flex-col gap-2">
                            <div className="uppercase text-gray-400 leading-tight">
                                LOGGED IN AS<br /><span className="text-white">{session.user.name || session.user.email}</span>
                            </div>
                            <button
                                onClick={() => {
                                    void authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
                                }}
                                className="text-left text-gray-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]"
                            >
                                SIGN OUT
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="uppercase text-gray-400 leading-tight">
                                NOT LOGGED IN
                            </div>
                            <Link href="/login" className="text-white hover:text-gray-300 transition-colors uppercase tracking-wider text-[11px]">
                                SIGN IN →
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Middle Grid */}
            <section className="flex-1 bg-black overflow-y-auto px-[2px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-white text-sm font-bold uppercase tracking-wider">
                        LOADING...
                    </div>
                ) : filteredCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px] h-auto min-h-full">
                        {filteredCards.map((card) => (
                            <Link
                                href={`/template/${card.id}`}
                                key={card.id}
                                className={`aspect-square p-6 flex flex-col relative cursor-pointer hover:opacity-90 transition-opacity ${card.theme === "dark"
                                    ? "bg-[#454545] text-white"
                                    : "bg-[#EAE8E3] text-black"
                                    }`}
                            >
                                <div
                                    className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${card.theme === "dark" ? "text-gray-400" : "text-gray-500"
                                        }`}
                                >
                                    <span>{card.category}</span>
                                    <span
                                        className={card.theme === "dark" ? "text-white" : "text-black"}
                                    >
                                        {card.status}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col justify-center mt-6 mb-4">
                                    <h3 className="text-[26px] font-bold leading-[1.05] tracking-tight whitespace-pre-line">
                                        {card.title}
                                    </h3>
                                </div>

                                <div className="flex justify-between items-end text-[11px] font-bold mt-auto tracking-wider">
                                    {card.theme === 'light' ? (
                                        <div className="w-3 h-3 rounded-full bg-black" />
                                    ) : (
                                        <div className="w-3 h-3 rounded-full bg-white" />
                                    )}
                                    <span>{card.id.slice(0, 8)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white text-sm font-bold uppercase tracking-wider">
                        No templates found.
                    </div>
                )}
            </section>

        </main>
    );
}
