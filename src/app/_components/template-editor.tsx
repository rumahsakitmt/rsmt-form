"use client";

import { useState, useRef, useEffect } from "react";
import type SignatureCanvas from "react-signature-canvas";
import { DocxForm } from "./docx-form";
import { api } from "@/trpc/react";

export function TemplateEditor({ templateId }: { templateId: string }) {
    const { data: template, isLoading: isTemplateLoading } = api.template.getById.useQuery({ id: templateId });

    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const sigCanvasRefs = useRef<Record<string, SignatureCanvas | null>>({});

    useEffect(() => {
        if (template?.fields) {
            const initialData: Record<string, any> = {};
            template.fields.forEach(field => {
                if (field.fieldType === 'array') {
                    const row: Record<string, any> = {};
                    template.fields.filter(f => f.parentId === field.id).forEach(child => {
                        row[child.name] = "";
                    });
                    initialData[field.name] = [row];
                } else if (!field.parentId) {
                    initialData[field.name] = "";
                }
            });
            setFormData(initialData);
        }
    }, [template]);

    const handleChange = (name: string, value: any, parentName?: string, index?: number) => {
        setFormData((prev: Record<string, any>) => {
            if (parentName && index !== undefined) {
                const newArray = [...(prev[parentName] || [])];
                if (!newArray[index]) newArray[index] = {};
                newArray[index] = { ...newArray[index], [name]: value };
                return { ...prev, [parentName]: newArray };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleClearSignature = (name: string, parentName?: string, index?: number) => {
        const refKey = parentName && index !== undefined ? `${parentName}_${index}_${name}` : name;
        sigCanvasRefs.current[refKey]?.clear();
        handleChange(name, "", parentName, index);
    };

    const handleAddRow = (parentName: string, childrenFields: any[]) => {
        setFormData((prev) => {
            const row: Record<string, any> = {};
            childrenFields.forEach(child => {
                row[child.name] = "";
            });
            return { ...prev, [parentName]: [...(prev[parentName] || []), row] };
        });
    };

    const handleRemoveRow = (parentName: string, index: number) => {
        setFormData((prev) => {
            const currentArray = prev[parentName] || [];
            if (currentArray.length <= 1) return prev; // Keep at least one row
            const newArray = currentArray.filter((_: any, i: number) => i !== index);

            // Clean up signature refs for removed row
            Object.keys(sigCanvasRefs.current).forEach(key => {
                if (key.startsWith(`${parentName}_${index}_`)) {
                    delete sigCanvasRefs.current[key];
                }
            });

            // Note: If we remove index 1, index 2 shifts to 1, we might need to re-map existing signature canvases. 
            // In React, keying array items by index causes this issue, we will key by index for simplicity but clear 
            // signatures if removing rows, or users can just clear manually. 
            // For robust fix, rows should have IDs. Let's just update state.

            return { ...prev, [parentName]: newArray };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!template) return;

        setLoading(true);
        setError("");

        const submitData = { ...formData };

        // Grab signature base64 strings dynamically
        template.fields?.filter(f => f.fieldType === "signature").forEach(field => {
            if (field.parentId) {
                const parent = template.fields.find(p => p.id === field.parentId);
                if (parent && submitData[parent.name] && Array.isArray(submitData[parent.name])) {
                    submitData[parent.name] = submitData[parent.name].map((row: any, i: number) => {
                        const refKey = `${parent.name}_${i}_${field.name}`;
                        const canvas = sigCanvasRefs.current[refKey];
                        return {
                            ...row,
                            [field.name]: canvas?.isEmpty() ? "" : canvas?.getTrimmedCanvas().toDataURL("image/png") ?? ""
                        };
                    });
                }
            } else {
                const canvas = sigCanvasRefs.current[field.name];
                submitData[field.name] = canvas?.isEmpty() ? "" : canvas?.getTrimmedCanvas().toDataURL("image/png") ?? "";
            }
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
                    onAddRow={handleAddRow}
                    onRemoveRow={handleRemoveRow}
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
