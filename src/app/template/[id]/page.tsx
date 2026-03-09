import Link from "next/link";
import { TemplateEditor } from "@/app/_components/template-editor";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function TemplateFormPage({ params }: Props) {
    const { id } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center bg-black p-4 font-sans text-sm relative">
            <div className="absolute top-8 left-8 z-10">
                <Link
                    href="/"
                    className="text-white hover:text-gray-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2"
                >
                    <span className="text-lg leading-none mb-[2px]">←</span>
                    <span>BACK TO LIBRARY</span>
                </Link>
            </div>

            <div className="w-full max-w-6xl mt-20">
                <TemplateEditor templateId={id} />
            </div>
        </main>
    );
}
