import { HydrateClient } from "@/trpc/server";
import { TemplateBrowser } from "@/app/_components/template-browser";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Templates | Academic Document Generator",
  description:
    "Browse and use academic document templates for your research papers, theses, and publications.",
};

export default async function Home() {
  return (
    <HydrateClient>
      <TemplateBrowser />
    </HydrateClient>
  );
}
