import { HydrateClient } from "@/trpc/server";
import { TemplateBrowser } from "@/app/_components/template-browser";

export default async function Home() {
  return (
    <HydrateClient>
      <TemplateBrowser />
    </HydrateClient>
  );
}
