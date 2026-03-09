"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Header() {
    const { data: session, isPending } = authClient.useSession();

    const [selectedTemplateId, setSelectedTemplateId] = useQueryState("id");
    const { data: cards = [], isLoading: isCardsLoading } = api.template.getAll.useQuery();

    const isLoading = isCardsLoading;

    const activeTemplateId = selectedTemplateId ?? (cards.length > 0 ? cards[0]?.id : null);
    return (
        <div className="border-academic-black flex items-center border-b p-2 gap-4 bg-academic-green z-10 w-full shrink-0 justify-between">
            <Link href="/" className="hidden sm:block">RSMT.DOCX</Link>
            <Select
                value={activeTemplateId ?? ""}
                onValueChange={(val) => void setSelectedTemplateId(val)}
                disabled={isLoading}
            >
                <SelectTrigger className="w-full md:w-[400px] border-academic-black text-[10px] font-mono font-bold tracking-widest uppercase rounded-none bg-transparent">
                    <SelectValue placeholder={isLoading ? "LOADING..." : "SELECT A TEMPLATE"} />
                </SelectTrigger>
                <SelectContent>
                    {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id} className="text-[10px] font-mono font-bold tracking-widest uppercase">
                            {card.title} {card.category ? `(${card.category})` : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-6 text-[10px] font-mono font-bold tracking-widest">
                <div className="hidden md:flex items-center gap-4 text-academic-black uppercase">
                    <Link href="/documents" className="hover:opacity-70 transition-opacity">Dokumen</Link>
                </div>

                {isPending ? (
                    <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-academic-black/10" />
                ) : session ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none">
                            <Avatar className="h-8 w-8 cursor-pointer border border-academic-black transition-opacity hover:opacity-80">
                                <AvatarImage src={session.user.image || ""} />
                                <AvatarFallback className="bg-academic-white text-academic-black font-sans text-xs">{session.user.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-none border-academic-black bg-academic-white">
                            <DropdownMenuLabel className="font-mono text-[10px] tracking-widest text-academic-black uppercase">
                                {session.user.name || "User"}
                                <span className="block text-[8px] text-academic-black/60 truncate mt-0.5 lowercase">{session.user.email}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-academic-black/20" />
                            <DropdownMenuItem asChild className="cursor-pointer font-mono text-[10px] tracking-widest uppercase hover:bg-academic-green hover:text-academic-black">
                                <Link href="/admin/templates/new">Add Template</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer font-mono text-[10px] tracking-widest uppercase hover:bg-academic-green hover:text-academic-black md:hidden">
                                <Link href="/documents">Dokumen</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-academic-black/20" />
                            <DropdownMenuItem
                                className="cursor-pointer font-mono text-[10px] tracking-widest uppercase text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                    void authClient.signOut({
                                        fetchOptions: {
                                            onSuccess: () => {
                                                window.location.href = "/login";
                                            },
                                        },
                                    });
                                }}
                            >
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button asChild variant="default" size="sm" className="rounded-none border border-academic-black bg-academic-white text-academic-black hover:bg-academic-black hover:text-academic-white font-mono text-[10px] tracking-widest uppercase h-8 px-4">
                        <Link href="/login">Log In</Link>
                    </Button>
                )}
            </div>

        </div>
    )
}