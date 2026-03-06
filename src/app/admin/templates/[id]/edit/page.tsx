"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { api } from "@/trpc/react";

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const { data: template, isLoading: isFetching } = api.template.getById.useQuery({ id }, { enabled: !!id });
    const updateTemplate = api.template.update.useMutation();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("FINANCE");
    const [theme, setTheme] = useState("light");
    const [status, setStatus] = useState("ACTIVE");
    const [file, setFile] = useState<File | null>(null);
    const [extractedFields, setExtractedFields] = useState<{ name: string; label: string; fieldType: string; isRequired: boolean; order: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (template) {
            setTitle(template.title);
            setCategory(template.category);
            setTheme(template.theme);
            setStatus(template.status);
            if (template.fields) {
                setExtractedFields(template.fields.map(f => ({
                    name: f.name,
                    label: f.label,
                    fieldType: f.fieldType,
                    isRequired: f.isRequired ?? true,
                    order: f.order ?? 0,
                })));
            }
        }
    }, [template]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Extract variables using docxtemplater
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
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

                let text = "";
                const files = zip.file(/.*/);

                files.forEach(f => {
                    if (f.name.startsWith("word/") && f.name.endsWith(".xml")) {
                        try {
                            const xmlText = f.asText() || "";
                            let plainText = xmlText.replace(/<[^>]+>/g, "");
                            plainText = plainText.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");
                            text += plainText + " ";
                        } catch (err) {
                            console.warn("Could not parse file:", f.name, err);
                        }
                    }
                });

                const regex = /{{([%a-zA-Z0-9_]+)}}/g;
                let match;
                const variables = new Set<string>();

                while ((match = regex.exec(text)) !== null) {
                    if (match[1]) {
                        const varName = match[1].trim();
                        if (varName) variables.add(varName);
                    }
                }

                const initialFields = Array.from(variables).map((variable, index) => {
                    const cleanVariable = variable.startsWith('%') ? variable.substring(1) : variable;

                    // Try to map to existing fields if possible to preserve labels
                    const existing = extractedFields.find(f => f.name === cleanVariable);

                    return {
                        name: cleanVariable,
                        label: existing?.label || cleanVariable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        fieldType: existing?.fieldType || (variable.startsWith('%') || variable.toLowerCase().includes('signature') || variable.toLowerCase().includes('ttd') ? 'signature' :
                            cleanVariable.toLowerCase().includes('date') || cleanVariable.toLowerCase().includes('tanggal') ? 'date' : 'text'),
                        isRequired: existing?.isRequired ?? true,
                        order: index,
                    }
                });

                setExtractedFields(initialFields);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!template) return;

        setLoading(true);

        try {
            let fileName = template.fileName;
            let filePath = template.filePath;

            // If a new file is uploaded, upload it
            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch('/api/upload-template', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Upload failed");

                const uploadData = (await uploadRes.json()) as { filePath: string; fileName: string };
                fileName = uploadData.fileName;
                filePath = uploadData.filePath;
            }

            await updateTemplate.mutateAsync({
                id,
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
            alert("Error updating template.");
        } finally {
            setLoading(false);
        }
    };

    if (isFetching || !template) {
        return (
            <main className="min-h-screen bg-black text-white p-8 font-sans flex items-center justify-center">
                <div className="text-xl font-bold uppercase tracking-widest text-[#EAE8E3]">Loading...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-[#EAE8E3]">Edit Template</h1>

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
                        <input type="file" accept=".docx" onChange={handleFileChange} className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-black file:font-bold file:uppercase cursor-pointer text-sm" />
                        <p className="text-gray-500 text-xs mt-2 uppercase">Current file: {template.fileName} (Upload a new file to replace)</p>
                    </div>
                </div>

                {extractedFields.length > 0 && (
                    <div className="mt-10 border-t border-gray-700 pt-8">
                        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-[#EAE8E3]">Variables</h2>
                        <div className="space-y-4">
                            {extractedFields.map((field, index) => (
                                <div key={index} className="flex items-center gap-4 bg-black p-4 rounded border border-gray-800">
                                    <div className="w-1/4">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Variable</span>
                                        <div className="font-mono text-sm mt-1">{`{{${field.name}}}`}</div>
                                    </div>
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UI Label</label>
                                        <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-gray-500 outline-none text-sm" />
                                    </div>
                                    <div className="w-1/4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                        <select value={field.fieldType} onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-gray-500 outline-none text-sm">
                                            <option value="text">Text</option>
                                            <option value="date">Date</option>
                                            <option value="signature">Signature</option>
                                        </select>
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
                    </div>
                )}

                <button disabled={loading} type="submit" className="mt-10 w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </main>
    );
}
