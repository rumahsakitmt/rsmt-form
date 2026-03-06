"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { data: documents = [], isLoading: isDocsLoading } = api.document.getAll.useQuery();
    const { data: session, isPending: isSessionLoading } = authClient.useSession();

    const isLoading = isDocsLoading || isSessionLoading;

    const uniqueCategories = Array.from(new Set(documents.map(d => d.template?.category).filter(Boolean)));
    const uniqueTemplates = Array.from(new Set(documents.map(d => d.template?.title).filter(Boolean)));

    const filteredDocs = documents.filter((doc) => {
        const matchesSearch = !searchQuery ||
            (doc.template?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (doc.template?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        const matchesCategory = selectedCategory ? doc.template?.category === selectedCategory : true;
        const matchesTemplate = selectedTemplate ? doc.template?.title === selectedTemplate : true;

        return matchesSearch && matchesCategory && matchesTemplate;
    });

    return (
        <main className="flex flex-col md:flex-row h-dvh w-full bg-black md:p-[2px] font-sans overflow-hidden text-sm">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#454545] text-white shrink-0">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider w-full items-center">
                    <span>LIBRARY 01</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="px-3 py-1 border border-gray-500 rounded hover:bg-white hover:text-black transition-colors"
                    >
                        {isMobileMenuOpen ? "CLOSE" : "MENU"}
                    </button>
                </div>
            </div>

            {/* Left Sidebar */}
            <aside className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex w-full md:w-[280px] bg-[#454545] text-white flex-col justify-between p-6 md:h-full border-b-2 md:border-b-0 md:border-r-2 border-black shrink-0 relative flex-1 md:flex-none overflow-y-auto`}>
                <div>
                    <div className="hidden md:flex justify-between text-[11px] font-bold uppercase tracking-wider mb-8">
                        <span>LIBRARY</span>
                        <span>01</span>
                    </div>

                    <nav className="flex flex-col space-y-5 text-[13px] font-extrabold tracking-wide">
                        <Link href="/" className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <span>ALL TEMPLATES</span>
                        </Link>
                        <div className="flex justify-between items-center text-white cursor-pointer hover:text-gray-300 transition-colors">
                            <span>GENERATED DOCUMENTS</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                        <Link href="/admin/templates/new" className="flex justify-between items-center text-gray-400 hover:text-white transition-colors cursor-pointer mt-4 pt-4 border-t border-gray-600">
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

            {/* Middle Content */}
            <section className={`${isMobileMenuOpen ? "hidden" : "flex"} md:flex flex-1 bg-black overflow-y-auto p-4 md:p-8 md:m-[2px] border-[#333] border-t md:border md:rounded-xl flex-col`}>
                <div className="mb-6 md:mb-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-end">
                        <h1 className="text-xl md:text-3xl font-bold uppercase tracking-widest text-[#EAE8E3]">Generated Documents</h1>
                        <div className="text-gray-500 font-bold tracking-wider text-xs">TOTAL: {filteredDocs.length}</div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <input
                            type="text"
                            placeholder="SEARCH DOCUMENTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-b-2 border-[#333] focus:border-gray-500 text-white placeholder-gray-500 text-[11px] font-bold uppercase tracking-wider py-2 focus:outline-none transition-colors"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="md:w-48 bg-transparent border-b-2 border-[#333] focus:border-gray-500 text-white text-[11px] font-bold uppercase tracking-wider py-2 focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="" className="bg-[#1A1A1A]">ALL CATEGORIES</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat} className="bg-[#1A1A1A]">{cat}</option>
                            ))}
                        </select>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="md:w-48 bg-transparent border-b-2 border-[#333] focus:border-gray-500 text-white text-[11px] font-bold uppercase tracking-wider py-2 focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="" className="bg-[#1A1A1A]">ALL TEMPLATES</option>
                            {uniqueTemplates.map(tpl => (
                                <option key={tpl} value={tpl} className="bg-[#1A1A1A]">{tpl}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-white text-sm font-bold uppercase tracking-wider">
                        LOADING...
                    </div>
                ) : filteredDocs.length > 0 ? (
                    <div className="w-full bg-[#1A1A1A] rounded-xl border border-[#333] overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-[#222] text-[10px] uppercase text-gray-500 font-bold tracking-wider border-b border-[#333]">
                                <tr>
                                    <th className="px-6 py-4">DOCUMENT ID</th>
                                    <th className="px-6 py-4">TEMPLATE NAME</th>
                                    <th className="px-6 py-4">CATEGORY</th>
                                    <th className="px-6 py-4">CREATED BY</th>
                                    <th className="px-6 py-4">CREATED AT</th>
                                    <th className="px-6 py-4 text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="border-b border-[#333] hover:bg-[#2A2A2A] transition-colors group">
                                        <td className="px-6 py-4 font-mono text-[11px] text-gray-500">
                                            {doc.id.split('-')[0]}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white text-[13px] uppercase tracking-wide">
                                            {doc.template?.title || "Unknown Template"}
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            {doc.template?.category || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[12px] text-gray-300">
                                            {doc.createdBy?.name ?? doc.createdBy?.email ?? "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[11px] text-gray-400">
                                            {new Date(doc.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`/api/documents/${doc.id}/download`}
                                                className="inline-flex items-center gap-2 bg-[#EAE8E3] text-black px-4 py-2 rounded font-bold uppercase tracking-wider text-[10px] hover:bg-white transition-colors"
                                            >
                                                DOWNLOAD <span>↓</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-bold uppercase tracking-wider border border-dashed border-[#333] rounded-xl">
                        No documents found.
                    </div>
                )}
            </section>
        </main>
    );
}
