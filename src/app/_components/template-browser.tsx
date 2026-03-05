"use client";

import { useState } from "react";
import Link from "next/link";

const cards = [
    {
        id: "001",
        category: "FINANCE",
        status: "ACTIVE",
        title: "TAX\nEXEMPTION\nFORM",
        theme: "light",
        icon: <div className="w-3 h-3 rounded-full bg-black" />,
    },
    {
        id: "002",
        category: "HR DEPT",
        status: "DRAFT",
        title: "NON\nDISCLOSURE\nAGREEMENT",
        theme: "dark",
        icon: (
            <div className="w-3 h-3 overflow-hidden relative">
                <div className="absolute bottom-0 w-3 h-[6px] bg-white rounded-t-full rotate-180" />
            </div>
        ),
    },
    {
        id: "003",
        category: "LEGAL",
        status: "REVIEW",
        title: "SERVICE\nLEVEL\nTERMS",
        theme: "light",
        icon: (
            <div className="w-3 h-3 overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-[6px] h-[6px] bg-black rounded-tr-full" />
            </div>
        ),
    },
    {
        id: "004",
        category: "FINANCE",
        status: "ACTIVE",
        title: "Q4\nBUDGET\nREPORT",
        theme: "light",
        icon: <div className="w-3 h-3 rounded-full bg-black" />,
    },
    {
        id: "005",
        category: "INTERNAL",
        status: "LOCKED",
        title: "EMPLOYEE\nONBOARDING\nCHECKLIST",
        theme: "dark",
        icon: <div className="w-3 h-3 rounded-full bg-white" />,
    },
    {
        id: "006",
        category: "SALES",
        status: "EDIT",
        title: "CLIENT\nINTAKE\nSHEET",
        theme: "light",
        icon: (
            <div className="w-3 h-3 overflow-hidden relative">
                <div className="absolute bottom-0 w-3 h-[6px] bg-black rounded-t-full rotate-180" />
            </div>
        ),
    },
    {
        id: "007",
        category: "OPS",
        status: "ACTIVE",
        title: "DAILY\nSTANDUP\nLOG",
        theme: "light",
        icon: <div className="w-3 h-3 rounded-full bg-black" />,
    },
];

export function TemplateBrowser() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCardId, setSelectedCardId] = useState("001");

    const filteredCards = cards.filter((card) =>
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

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
                        <div className="flex justify-between items-center text-white cursor-pointer">
                            <span>ALL TEMPLATES</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                        <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>INVOICES</span>
                            <span>12</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>CONTRACTS</span>
                            <span>08</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>SURVEYS</span>
                            <span>05</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>ARCHIVED</span>
                            <div className="w-2.5 h-[5px] bg-gray-400 rounded-t-full rotate-180" />
                        </div>
                    </nav>
                </div>

                <div className="text-[11px] font-bold tracking-wider space-y-6">
                    <div className="flex justify-between uppercase text-gray-400">
                        <span className="text-white">SYSTEM</span>
                        <span>v2.4</span>
                    </div>
                    <div className="uppercase text-gray-400 leading-tight">
                        LOGGED IN AS<br />ADMINISTRATOR
                    </div>
                </div>
            </aside>

            {/* Middle Grid */}
            <section className="flex-1 bg-black overflow-y-auto px-[2px]">
                {filteredCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px] h-auto min-h-full">
                        {filteredCards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => {
                                    setSelectedCardId(card.id);
                                }}
                                className={`aspect-square p-6 flex flex-col relative cursor-pointer hover:opacity-90 transition-opacity ${card.id === selectedCardId ? "ring-4 ring-inset ring-blue-500 z-10" : ""
                                    } ${card.theme === "dark"
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
                                    {card.icon}
                                    <span>{card.id}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white text-sm font-bold uppercase tracking-wider">
                        No templates found.
                    </div>
                )}
            </section>

            {/* Right Pane */}
            <aside className="w-[320px] bg-[#EAE8E3] flex flex-col border-l-2 border-black h-full shrink-0">
                <div className="flex-1 flex flex-col p-6">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-14 text-black">
                        <span>PROPERTIES</span>
                        <span>#{selectedCard?.id}</span>
                    </div>

                    <h2 className="text-[32px] font-bold leading-[1.05] tracking-tight uppercase mb-16 text-black whitespace-pre-line">
                        {selectedCard?.title}
                    </h2>

                    <div className="space-y-6 text-sm text-black relative">
                        <div className="border-b border-black/10 pb-2">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                CREATED BY
                            </div>
                            <div className="font-bold text-[13px]">System Admin</div>
                        </div>

                        <div className="border-b border-black/10 pb-2">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                LAST MODIFIED
                            </div>
                            <div className="font-bold text-[13px]">Oct 24, 2023</div>
                        </div>

                        <div className="border-b border-black/10 pb-2">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                VARIABLES
                            </div>
                            <div className="font-bold text-[13px]">14 Fields</div>
                        </div>

                        <div className="pb-2">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                STATUS
                            </div>
                            <div className="font-bold text-[13px] flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-black shrink-0" />
                                {selectedCard?.status === "ACTIVE" ? "Production Ready" : "Draft Iteration"}
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/template/${selectedCard?.id}`}
                    className="bg-[#454545] text-white p-5 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-colors w-full"
                >
                    <span>FILL TEMPLATE FORM</span>
                    <span>→</span>
                </Link>
            </aside>
        </main>
    );
}
