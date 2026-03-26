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
  const { data: cards = [], isLoading: isCardsLoading } =
    api.template.getAll.useQuery();

  const isLoading = isCardsLoading;

  const activeTemplateId =
    selectedTemplateId ?? (cards.length > 0 ? cards[0]?.id : null);
  return (
    <div className="border-academic-black bg-academic-green z-10 flex w-full shrink-0 items-center justify-between gap-4 border-b p-2">
      <Link href="/">
        <span className="hidden sm:block">RSMT.DOCX</span>{" "}
        <span className="block sm:hidden">.DOCX</span>{" "}
      </Link>
      <Select
        value={activeTemplateId ?? ""}
        onValueChange={(val) => void setSelectedTemplateId(val)}
        disabled={isLoading}
      >
        <SelectTrigger className="border-academic-black bg-academic-white w-full rounded-none font-mono text-[10px] font-bold tracking-widest uppercase md:w-[400px]">
          <SelectValue
            placeholder={isLoading ? "LOADING..." : "SELECT A TEMPLATE"}
          />
        </SelectTrigger>
        <SelectContent>
          {cards.map((card) => (
            <SelectItem
              key={card.id}
              value={card.id}
              className="font-mono text-[10px] font-bold tracking-widest uppercase"
            >
              {card.title} {card.category ? `(${card.category})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-6 font-mono text-[10px] font-bold tracking-widest">

        {isPending ? (
          <div className="bg-academic-black/10 flex h-8 w-8 animate-pulse items-center justify-center rounded-full" />
        ) : session ? (
          <>
            <div className="text-academic-black hidden items-center gap-4 uppercase md:flex">
              <Link
                href="/documents"
                className="transition-opacity hover:opacity-70"
              >
                Dokumen
              </Link>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="border-academic-black h-8 w-8 cursor-pointer border transition-opacity hover:opacity-80">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback className="bg-academic-white text-academic-black font-sans text-xs">
                    {session.user.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-academic-black bg-academic-white w-56 rounded-none"
              >
                <DropdownMenuLabel className="text-academic-black flex flex-col gap-1 font-mono text-[10px] tracking-widest uppercase">
                  <span>{session.user.name ?? "User"}</span>
                  <span className="text-academic-black/60 block truncate text-[8px] lowercase">
                    {session.user.email}
                  </span>
                  <div className="mt-1 flex gap-1">
                    {session.user.role && (
                      <span className="bg-academic-green border-academic-black border px-1 text-[8px] uppercase">
                        {(session.user as { role?: string }).role}
                      </span>
                    )}
                    {(session.user as { room?: string }).room && (
                      <span className="bg-academic-green border-academic-black border px-1 text-[8px] uppercase">
                        {(session.user as { room?: string }).room}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-academic-black/20" />
                <DropdownMenuItem
                  asChild
                  className="hover:bg-academic-green hover:text-academic-black cursor-pointer font-mono text-[10px] tracking-widest uppercase"
                >
                  <Link href="/admin/templates">Manage Templates</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="hover:bg-academic-green hover:text-academic-black cursor-pointer font-mono text-[10px] tracking-widest uppercase"
                >
                  <Link href="/admin/templates">Template</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="hover:bg-academic-green hover:text-academic-black cursor-pointer font-mono text-[10px] tracking-widest uppercase"
                >
                  <Link href="/admin/templates/new">Add Template</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="hover:bg-academic-green hover:text-academic-black cursor-pointer font-mono text-[10px] tracking-widest uppercase md:hidden"
                >
                  <Link href="/documents">Dokumen</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-academic-black/20" />
                <DropdownMenuItem
                  className="cursor-pointer font-mono text-[10px] tracking-widest text-red-600 uppercase hover:bg-red-50 hover:text-red-700"
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
          </>

        ) : (
          <Button
            asChild
            variant="default"
            size="sm"
            className="border-academic-black bg-academic-white text-academic-black hover:bg-academic-black hover:text-academic-white h-8 rounded-none border px-4 font-mono text-[10px] tracking-widest uppercase"
          >
            <Link href="/login">Log In</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
