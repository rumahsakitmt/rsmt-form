import Link from "next/link";
import { TemplateEditor } from "@/app/_components/template-editor";
import { type Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Template ${id} | Academic Document Generator`,
  };
}

export default async function TemplateFormPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="relative flex min-h-screen flex-col items-center p-4 font-sans text-sm">
      <div className="absolute top-8 left-8 z-10">
        <Link
          href="/admin/templates"
          className="text-academic-black flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase"
        >
          <span className="mb-[2px] text-lg leading-none">←</span>
          <span>BACK TO TEMPLATE</span>
        </Link>
      </div>

      <div className="mt-20 w-full max-w-6xl">
        <TemplateEditor templateId={id} />
      </div>
    </main>
  );
}
