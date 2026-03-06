"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { api } from "@/trpc/react";

export default function NewTemplatePage() {
    const router = useRouter();
    const createTemplate = api.template.create.useMutation();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("FINANCE");
    const [theme, setTheme] = useState("light");
    const [status, setStatus] = useState("ACTIVE");
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
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    delimiters: { start: "{{", end: "}}" },
                });

                // Get all text content and find {{variables}} using simple regex
                let text = "";
                const files = zip.file(/.*/); // Get all files as array

                files.forEach(file => {
                    if (file.name.startsWith("word/") && file.name.endsWith(".xml")) {
                        try {
                            const xmlText = file.asText() || "";
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

                console.log("Extracted raw document text length:", text.length);

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
                                currentParent = elements.find(e => e.name === arrayName) || null;
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

                console.log("Auto-detected variables:", elements);
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
                category,
                theme,
                status,
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
        <main className="min-h-screen bg-black text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-[#EAE8E3]">Add New Template</h1>

            <form onSubmit={handleSubmit} className="max-w-2xl bg-[#1A1A1A] p-8 rounded-xl border border-[#333]">
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Title</label>
                        <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none" placeholder="e.g. TAX EXEMPTION FORM" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Category</label>
                            <input required type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none" placeholder="FINANCE" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Theme</label>
                            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none">
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none">
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="LOCKED">LOCKED</option>
                                <option value="REVIEW">REVIEW</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Document Template (.docx)</label>
                        <input required type="file" accept=".docx" onChange={handleFileChange} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-bold file:uppercase cursor-pointer text-sm" />
                    </div>
                </div>

                {extractedFields.length > 0 && (
                    <div className="mt-10 border-t border-gray-700 pt-8">
                        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-[#EAE8E3]">Detected Variables</h2>
                        <div className="space-y-4">
                            {extractedFields.map((field, index) => (
                                <div key={index} className={`flex items-center gap-4 bg-black p-4 rounded border border-gray-800 relative ${field.parentId ? 'ml-8 border-l-4 border-l-blue-500' : ''}`}>
                                    <button type="button" onClick={() => handleRemoveField(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-600">×</button>
                                    <div className="w-1/4">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Variable</span>
                                        <div className="mt-1 flex items-center">
                                            <span className="text-gray-500 font-mono text-sm mr-1">{"{{"}</span>
                                            <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-1 text-white font-mono text-sm focus:border-gray-500 outline-none" />
                                            <span className="text-gray-500 font-mono text-sm ml-1">{"}}"}</span>
                                        </div>
                                    </div>
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UI Label</label>
                                        <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-gray-500 outline-none text-sm" />
                                    </div>
                                    <div className="w-1/4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                        {field.fieldType === 'array' ? (
                                            <div className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-blue-400 font-bold uppercase text-xs outline-none">
                                                Array (Repeatable)
                                            </div>
                                        ) : (
                                            <select value={field.fieldType} onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-gray-500 outline-none text-sm">
                                                <option value="text">Text</option>
                                                <option value="date">Date</option>
                                                <option value="signature">Signature</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex items-center pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-400 uppercase">
                                            <input type="checkbox" checked={field.isRequired} onChange={(e) => handleFieldChange(index, 'isRequired', e.target.checked)} className="accent-white w-4 h-4 cursor-pointer" />
                                            Required
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-gray-800 pt-6">
                            <button type="button" onClick={handleAddVariable} className="w-full border border-dashed border-gray-600 text-gray-400 py-3 rounded hover:bg-gray-800 hover:text-white transition-colors uppercase font-bold text-xs tracking-wider">
                                + Tambah Variabel Manual (Header/Footer/Custom)
                            </button>
                        </div>
                    </div>
                )}

                <button disabled={loading || !file} type="submit" className="mt-10 w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save Template"}
                </button>
            </form>
        </main>
    );
}
