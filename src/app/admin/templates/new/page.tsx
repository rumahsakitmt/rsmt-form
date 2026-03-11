"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PizZip from "pizzip";
import { api } from "@/trpc/react";

export default function NewTemplatePage() {
    const router = useRouter();
    const createTemplate = api.template.create.useMutation();

    const [title, setTitle] = useState("");
    const [room, setRoom] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [extractedFields, setExtractedFields] = useState<{ id: string; name: string; label: string; fieldType: string; isRequired: boolean; order: number; parentId?: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Extract variables using docxtemplater
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                // Ensure content is passed correctly to docxtemplater
                const _base64 = content.split(",")[1];
                if (!_base64) {
                    throw new Error("Invalid base64 content");
                }
                const binaryString = atob(_base64);

                const zip = new PizZip(binaryString);

                // We only need Pizzip to extract text, Docxtemplater parsing is unneeded just for tags
                let text = "";
                const files = zip.file(/.*/); // Get all files as array

                files.forEach(file => {
                    if (file.name.startsWith("word/") && file.name.endsWith(".xml")) {
                        try {
                            const xmlText = file.asText() ?? "";
                            // Strip all xml tags
                            let plainText = xmlText.replace(/<[^>]+>/g, "");
                            // Strip invisible control characters Word sometimes adds
                            plainText = plainText.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");
                            text += plainText + " ";
                        } catch (e) {
                            console.warn("Could not parse file:", file.name, e);
                        }
                    }
                });


                // We allow letters, numbers, underscores, and the '%' prefix used by image module
                const tagRegex = /{{([#\/]?[%a-zA-Z0-9_\s-]+)}}/g;
                let match;

                type FieldDefinition = {
                    name: string;
                    label: string;
                    fieldType: string;
                    isRequired: boolean;
                    order: number;
                    id: string;
                    parentId?: string;
                };

                const elements: FieldDefinition[] = [];
                const addedNames = new Set<string>();

                let currentParent: FieldDefinition | null = null;
                let orderCount = 0;

                while ((match = tagRegex.exec(text)) !== null) {
                    if (match[1]) {
                        const tagName = match[1].trim();

                        if (tagName.startsWith('#')) {
                            // Array Open
                            const arrayName = tagName.substring(1);
                            if (!addedNames.has(arrayName)) {
                                const newArrayField = {
                                    id: crypto.randomUUID(),
                                    name: arrayName,
                                    label: arrayName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                    fieldType: 'array',
                                    isRequired: true,
                                    order: orderCount++
                                };
                                elements.push(newArrayField);
                                addedNames.add(arrayName);
                                currentParent = newArrayField;
                            } else {
                                currentParent = elements.find(e => e.name === arrayName) ?? null;
                            }
                        } else if (tagName.startsWith('/')) {
                            // Array Close
                            currentParent = null;
                        } else {
                            // Normal Variable
                            const cleanVariable = tagName.startsWith('%') ? tagName.substring(1) : tagName;

                            if (!addedNames.has(cleanVariable)) {
                                addedNames.add(cleanVariable);
                                elements.push({
                                    id: crypto.randomUUID(),
                                    name: cleanVariable,
                                    label: cleanVariable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                    fieldType: tagName.startsWith('%') || tagName.toLowerCase().includes('signature') || tagName.toLowerCase().includes('ttd') ? 'signature' :
                                        cleanVariable.toLowerCase().includes('date') || cleanVariable.toLowerCase().includes('tanggal') ? 'date' : 'text',
                                    isRequired: true,
                                    order: orderCount++,
                                    parentId: currentParent?.id
                                });
                            }
                        }
                    }
                }

                setExtractedFields(elements);
            } catch (error: unknown) {
                console.error("Error parsing Word document", error);
                alert("Failed to parse the uploaded document for variables.");
            }
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleFieldChange = <K extends keyof typeof extractedFields[0]>(index: number, key: K, value: typeof extractedFields[0][K]) => {
        const newFields = [...extractedFields];
        newFields[index] = { ...newFields[index], [key]: value } as typeof extractedFields[0];
        setExtractedFields(newFields);
    };

    const handleAddVariable = () => {
        setExtractedFields([...extractedFields, {
            id: crypto.randomUUID(),
            name: `custom_variable_${extractedFields.length + 1}`,
            label: "Custom Variable",
            fieldType: "text",
            isRequired: false,
            order: extractedFields.length,
        }]);
    };

    const handleRemoveField = (index: number) => {
        setExtractedFields(extractedFields.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);

        // Ideally, here you'd upload the file to an S3/R2 bucket or public directory.
        // For simplicity, we assume we upload it via an API endpoint that returns the filePath,
        // or we just save local path if we handle base64.
        // Let's create an API endpoint to upload the file, or do it in the TRPC mutation directly (note: TRPC requires base64 if large).
        // Best approach for Next.js is a separate API route to upload.
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch('/api/upload-template', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const uploadData = (await uploadRes.json()) as { filePath: string; fileName: string };
            const { filePath, fileName } = uploadData;

            await createTemplate.mutateAsync({
                title,
                category: room || "UNCATEGORIZED",
                room,
                theme: "light",
                status: "ACTIVE",
                fileName,
                filePath,
                fields: extractedFields,
            });

            router.push('/');
        } catch (error: unknown) {
            console.error(error);
            alert("Error saving template.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-academic-white text-academic-black p-4 md:p-8 font-mono flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-8 uppercase tracking-widest text-academic-black border-b-4 border-academic-green inline-block pb-2 text-center w-full max-w-2xl">Add New Template</h1>

            <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-academic-white p-6 md:p-10 border border-academic-black shadow-[8px_8px_0px_#111111]">
                <div className="flex flex-col gap-8">
                    <div>
                        <label className="text-[10px] font-bold text-academic-black/60 mb-2 uppercase tracking-widest bg-academic-black/5 px-2 py-1 inline-block border border-academic-black/20">Title</label>
                        <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-academic-black p-3 text-academic-black font-bold uppercase focus:border-academic-green outline-none transition-colors" placeholder="e.g. General Consent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-academic-black/60 mb-2 uppercase tracking-widest bg-academic-black/5 px-2 py-1 inline-block border border-academic-black/20">Room</label>
                            <input required type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-transparent border-b-2 border-academic-black p-3 text-academic-black font-bold uppercase focus:border-academic-green outline-none transition-colors" placeholder="e.g. UP3" />
                        </div>
                    </div>

                    <div className="border border-academic-black bg-academic-green p-4 shadow-[4px_4px_0px_#111111]">
                        <label className="block text-[10px] font-bold text-academic-black mb-4 uppercase tracking-widest">Document Template (.docx)</label>
                        <input required type="file" accept=".docx" onChange={handleFileChange} className="w-full bg-academic-white border border-academic-black p-3 text-academic-black font-mono text-xs focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-academic-black file:bg-academic-black file:text-academic-white file:font-bold file:uppercase file:text-[10px] file:tracking-widest cursor-pointer hover:file:bg-academic-white hover:file:text-academic-black file:transition-colors" />
                    </div>
                </div>

                {extractedFields.length > 0 && (
                    <div className="mt-12 border-t-2 border-academic-black pt-10">
                        <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-academic-black flex items-center gap-3">
                            <span className="bg-academic-green w-4 h-4 inline-block border border-academic-black"></span>
                            Detected Variables
                        </h2>
                        <div className="space-y-6">
                            {extractedFields.map((field, index) => (
                                <div key={index} className={`flex flex-col md:flex-row md:items-start gap-4 bg-academic-white p-6 border border-academic-black relative shadow-[4px_4px_0px_#48C796] ${field.parentId ? 'ml-4 md:ml-8 border-l-4 border-l-academic-green' : ''}`}>
                                    <button type="button" onClick={() => handleRemoveField(index)} className="absolute -top-3 -right-3 bg-red-500 text-white border border-academic-black w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-[2px_2px_0px_#111111] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all z-10">×</button>

                                    <div className="w-full md:w-1/4">
                                        <span className="text-[10px] font-bold text-academic-black/60 uppercase tracking-widest mb-1 block">Variable</span>
                                        <div className="flex items-center">
                                            <span className="text-academic-black/40 font-mono text-sm mr-1">{"{{"}</span>
                                            <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} className="w-full bg-transparent border-b border-academic-black p-1 text-academic-black font-mono text-sm focus:border-academic-green outline-none" />
                                            <span className="text-academic-black/40 font-mono text-sm ml-1">{"}}"}</span>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-1/3">
                                        <label className="block text-[10px] font-bold text-academic-black/60 uppercase tracking-widest mb-1">UI Label</label>
                                        <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full bg-transparent border-b border-academic-black p-1 text-academic-black font-bold uppercase text-xs focus:border-academic-green outline-none" />
                                    </div>

                                    <div className="w-full md:w-1/4">
                                        <label className="block text-[10px] font-bold text-academic-black/60 uppercase tracking-widest mb-1">Type</label>
                                        {field.fieldType === 'array' ? (
                                            <div className="w-full bg-academic-black text-academic-white border border-academic-black p-2 font-bold uppercase text-[10px] tracking-widest text-center shadow-[2px_2px_0px_#48C796]">
                                                Array (Repeat)
                                            </div>
                                        ) : (
                                            <select value={field.fieldType} onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)} className="w-full bg-transparent border-b border-academic-black p-1 text-academic-black font-bold uppercase text-xs focus:border-academic-green outline-none appearance-none cursor-pointer">
                                                <option value="text">TEXT</option>
                                                <option value="date">DATE</option>
                                                <option value="signature">SIGNATURE</option>
                                            </select>
                                        )}
                                    </div>

                                    <div className="flex items-center md:pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-academic-black uppercase tracking-widest group">
                                            <div className="relative flex items-center justify-center">
                                                <input type="checkbox" checked={field.isRequired} onChange={(e) => handleFieldChange(index, 'isRequired', e.target.checked)} className="peer appearance-none w-4 h-4 border border-academic-black bg-academic-white checked:bg-academic-green cursor-pointer transition-colors" />
                                                <svg className="absolute w-3 h-3 text-academic-black pointer-events-none opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"><polyline points="20 6 9 17 4 12" /></svg>
                                            </div>
                                            Required
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-2">
                            <button type="button" onClick={handleAddVariable} className="w-full border-2 border-dashed border-academic-black/40 text-academic-black/60 py-4 font-bold text-[10px] tracking-widest uppercase hover:text-academic-black hover:border-academic-black hover:bg-academic-black/5 transition-all">
                                + Add Manual Variable (Header/Footer/Custom)
                            </button>
                        </div>
                    </div>
                )}

                <button disabled={loading || !file} type="submit" className="mt-12 w-full bg-academic-black border border-academic-black text-academic-white font-bold text-sm uppercase tracking-widest py-4 shadow-[4px_4px_0px_#48C796] hover:shadow-[2px_2px_0px_#48C796] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#48C796]">
                    {loading ? "SAVING..." : "SAVE TEMPLATE"}
                </button>
            </form>
        </main>
    );
}
