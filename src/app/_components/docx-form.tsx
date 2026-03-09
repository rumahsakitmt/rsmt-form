/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
"use client";

import { useState, useRef } from "react";
import type { MutableRefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
    fields: { id: string; name: string; label: string; fieldType: string; isRequired: boolean | null; order: number | null; parentId: string | null; }[];
    formData: Record<string, any>;
    onChange: (name: string, value: any, parentName?: string, index?: number) => void;
    onAddRow: (parentName: string, childrenFields: any[]) => void;
    onRemoveRow: (parentName: string, index: number) => void;
    sigCanvasRefs: MutableRefObject<Record<string, SignatureCanvas | null>>;
    onClearSignature: (name: string, parentName?: string, index?: number) => void;
    onSubmit: (e: React.FormEvent, action: 'save' | 'download') => void;
    loading: boolean;
    error: string;
};

export function DocxForm({
    fields,
    formData,
    onChange,
    onAddRow,
    onRemoveRow,
    sigCanvasRefs,
    onClearSignature,
    onSubmit,
    loading,
    error,
}: Props) {
    const [submitAction, setSubmitAction] = useState<'save' | 'download'>('save');
    const [expandedSig, setExpandedSig] = useState<string | null>(null);
    const expandedCanvasRef = useRef<SignatureCanvas | null>(null);

    const rootFields = fields.filter(f => !f.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const getChildren = (parentId: string) => fields.filter(f => f.parentId === parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const renderField = (field: Props['fields'][0], parentName?: string, index?: number) => {
        const value = parentName && index !== undefined ? (formData[parentName]?.[index]?.[field.name] ?? "") : (formData[field.name] ?? "");

        if (field.fieldType === "signature") {
            const refKey = parentName && index !== undefined ? `${parentName}_${index}_${field.name}` : field.name;
            const currentSig = parentName && index !== undefined
                ? (formData[parentName]?.[index]?.[field.name] ?? "")
                : (formData[field.name] ?? "");

            return (
                <div key={field.id ?? field.name} className="flex flex-col gap-1">
                    <label className="font-bold text-white uppercase tracking-wider text-[10px] flex justify-between items-center mb-1">
                        <span>{field.label}</span>
                        <button
                            type="button"
                            onClick={() => onClearSignature(field.name, parentName, index)}
                            className="text-white/50 hover:text-white transition-colors underline"
                        >
                            Hapus
                        </button>
                    </label>
                    {/* Inline canvas (hidden on small screens, shown on md+) */}
                    <div className="hidden md:block rounded-lg bg-[#EAE8E3] border border-white/20 overflow-hidden cursor-crosshair relative z-20">
                        <SignatureCanvas
                            ref={(ref) => {
                                sigCanvasRefs.current[refKey] = ref;
                            }}
                            penColor="black"
                            onEnd={() => {
                                onChange(
                                    field.name,
                                    sigCanvasRefs.current[refKey]?.getTrimmedCanvas().toDataURL("image/png") ?? "",
                                    parentName,
                                    index
                                );
                            }}
                            canvasProps={{
                                width: 400,
                                height: 150,
                                className: "w-full h-[150px]"
                            }}
                        />
                    </div>
                    {/* Mobile tap-to-expand preview */}
                    <button
                        type="button"
                        onClick={() => setExpandedSig(refKey)}
                        className="md:hidden rounded-lg bg-[#EAE8E3] border border-white/20 overflow-hidden w-full h-[80px] flex items-center justify-center relative"
                    >
                        {currentSig ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentSig} alt="Tanda tangan" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-gray-500 text-sm flex flex-col items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.213-1.213l1-4a4 4 0 01.828-1.414z" /></svg>
                                Tap untuk tanda tangan
                            </span>
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div key={field.id ?? field.name} className="flex flex-col gap-1">
                <label htmlFor={field.name} className="font-bold text-white uppercase tracking-wider text-[10px]">{field.label}</label>
                <input
                    type={field.fieldType === 'date' ? 'date' : 'text'}
                    id={field.name}
                    name={field.name}
                    required={field.isRequired ?? false}
                    value={value}
                    onChange={(e) => onChange(field.name, e.target.value, parentName, index)}
                    className="rounded-lg bg-white/5 border border-white/20 p-2.5 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                    placeholder={field.label}
                    style={field.fieldType === 'date' ? { colorScheme: "dark" } : undefined}
                />
            </div>
        );
    };

    // Find the refKey metadata for the expanded modal
    const expandedMeta = expandedSig
        ? (() => {
            // Determine field name and parent info from refKey
            const parts = expandedSig.split("_");
            // refKey formats: "fieldName" or "parentName_index_fieldName"
            if (parts.length >= 3) {
                return { fieldName: parts.slice(2).join("_"), parentName: parts[0], index: parseInt(parts[1] ?? "0") };
            }
            return { fieldName: expandedSig, parentName: undefined, index: undefined };
        })()
        : null;

    return (
        <div className="w-full rounded-xl bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/5">
            {/* Full-screen signature modal for mobile */}
            {expandedSig && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/90 md:hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">Tanda Tangan</h3>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    expandedCanvasRef.current?.clear();
                                    if (expandedMeta) {
                                        onChange(
                                            expandedMeta.fieldName,
                                            "",
                                            expandedMeta.parentName,
                                            expandedMeta.index
                                        );
                                        onClearSignature(expandedMeta.fieldName, expandedMeta.parentName, expandedMeta.index);
                                    }
                                }}
                                className="text-white/50 hover:text-white transition-colors text-sm underline"
                            >
                                Hapus
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (expandedMeta && expandedCanvasRef.current && !expandedCanvasRef.current.isEmpty()) {
                                        const dataUrl = expandedCanvasRef.current.getTrimmedCanvas().toDataURL("image/png");
                                        onChange(expandedMeta.fieldName, dataUrl, expandedMeta.parentName, expandedMeta.index);
                                    }
                                    setExpandedSig(null);
                                }}
                                className="bg-white text-black px-4 py-1.5 rounded-lg font-bold text-sm"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-full rounded-lg bg-[#EAE8E3] overflow-hidden" style={{ touchAction: 'none' }}>
                            <SignatureCanvas
                                ref={expandedCanvasRef}
                                penColor="black"
                                canvasProps={{
                                    className: "w-full",
                                    style: { height: '60vh', display: 'block' }
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-white/40 text-xs text-center pb-4">Tanda tangani di area abu-abu di atas</p>
                </div>
            )}
            <h2 className="mb-6 text-2xl font-bold text-white text-center">Isi Formulir</h2>

            <form onSubmit={(e) => onSubmit(e, submitAction)} className="flex flex-col gap-4 text-sm z-50">
                {rootFields.map((field) => {
                    if (field.fieldType === 'array') {
                        const childrenFields = getChildren(field.id);
                        const rows = formData[field.name] ?? [];

                        return (
                            <div key={field.id ?? field.name} className="flex flex-col gap-4 border border-white/20 rounded-lg p-4 bg-white/5">
                                <h3 className="font-bold text-white uppercase tracking-wider text-sm">{field.label}</h3>

                                {rows.map((row: any, index: number) => (
                                    <div key={index} className="flex flex-col gap-4 border-l-2 border-white/20 pl-4 relative">
                                        {rows.length > 1 && (
                                            <button type="button" onClick={() => onRemoveRow(field.name, index)} className="absolute top-0 right-0 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase underline">Hapus Baris</button>
                                        )}
                                        <h4 className="text-white/60 text-[10px] uppercase tracking-wider font-bold mb-2">Data {index + 1}</h4>
                                        {childrenFields.map(child => renderField(child, field.name, index))}
                                    </div>
                                ))}

                                <button type="button" onClick={() => onAddRow(field.name, childrenFields)} className="mt-2 py-2 px-4 rounded border border-white/20 text-white/80 hover:bg-white/10 hover:text-white uppercase tracking-wider text-[10px] font-bold self-start transition-colors">
                                    + Tambah {field.label}
                                </button>
                            </div>
                        );
                    }

                    return renderField(field);
                })}

                {error && <p className="text-sm text-red-500 font-bold mt-2">{error}</p>}

                <div className="mt-4 flex gap-4 w-full z-10 relative">
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => setSubmitAction('save')}
                        className="flex-1 rounded-lg bg-[#333] text-white px-5 py-4 font-bold uppercase tracking-wider transition-colors hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading && submitAction === 'save' ? "SAVING..." : "SAVE"}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => setSubmitAction('download')}
                        className="flex-1 rounded-lg bg-white text-black px-5 py-4 font-bold uppercase tracking-wider transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading && submitAction === 'download' ? "GENERATING..." : "DOWNLOAD"}
                        {!loading && <span>↓</span>}
                    </button>
                </div>
            </form>
        </div>
    );
}
