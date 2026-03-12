import { HydrateClient } from "@/trpc/server";
import { TemplateBrowser } from "@/app/_components/template-browser";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Templates | RSMT.DOCX",
  description: "Buat dokumen, formulir, dan template dengan mudah.",
};

export default async function Home() {
  return (
    <HydrateClient>
      <TemplateBrowser />
    </HydrateClient>
  );
}
