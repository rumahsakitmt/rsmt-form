"use client";

import { useState, useRef, useEffect } from "react";
import type SignatureCanvas from "react-signature-canvas";
import { DocxForm } from "./docx-form";
import { api } from "@/trpc/react";

export function TemplateEditor({ templateId }: { templateId: string }) {
    const { data: template, isLoading: isTemplateLoading } = api.template.getById.useQuery({ id: templateId });

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const sigCanvasRefs = useRef<Record<string, SignatureCanvas | null>>({});

    useEffect(() => {
        if (template?.fields) {
            const initialData: Record<string, string> = {};
            template.fields.forEach(field => {
                initialData[field.name] = "";
            });
            setFormData(initialData);
        }
    }, [template]);

    const handleChange = (name: string, value: string) => {
        setFormData((prev: Record<string, string>) => ({ ...prev, [name]: value }));
    };

    const handleClearSignature = (name: string) => {
        sigCanvasRefs.current[name]?.clear();
        handleChange(name, "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!template) return;

        setLoading(true);
        setError("");

        const submitData = { ...formData };

        // Grab signature base64 strings dynamically
        template.fields?.filter(f => f.fieldType === "signature").forEach(field => {
            const canvas = sigCanvasRefs.current[field.name];
            submitData[field.name] = canvas?.isEmpty() ? "" : canvas?.getTrimmedCanvas().toDataURL("image/png") ?? "";
        });

        try {
            const response = await fetch("/api/generate-docx", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    templateId: template.id,
                    data: submitData
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate document");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `dokumen-${template.title || "template"}.docx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Something went wrong.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (isTemplateLoading) {
        return <div className="text-white text-center font-bold tracking-wider uppercase">Loading Template...</div>;
    }

    if (!template) {
        return <div className="text-white text-center font-bold tracking-wider uppercase">Template not found</div>;
    }

    return (
        <div className="flex flex-col gap-12 w-full items-center justify-center">
            <div className="w-full max-w-md shrink-0">
                <DocxForm
                    fields={template.fields || []}
                    formData={formData}
                    onChange={handleChange}
                    sigCanvasRefs={sigCanvasRefs}
                    onClearSignature={handleClearSignature}
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
}
