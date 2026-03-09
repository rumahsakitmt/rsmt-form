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
                <div key={field.id ?? field.name} className="flex flex-col gap-2">
                    <label className="font-bold text-academic-black uppercase tracking-widest text-[10px] flex justify-between items-center mb-1">
                        <span>{field.label}</span>
                        <button
                            type="button"
                            onClick={() => onClearSignature(field.name, parentName, index)}
                            className="text-[#888] hover:text-academic-black transition-colors underline"
                        >
                            HAPUS
                        </button>
                    </label>
                    {/* Inline canvas (hidden on small screens, shown on md+) */}
                    <div className="hidden md:block rounded-none bg-white border border-academic-black overflow-hidden cursor-crosshair relative z-20">
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
                        className="md:hidden rounded-none bg-white border border-academic-black overflow-hidden w-full h-[80px] flex items-center justify-center relative"
                    >
                        {currentSig ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={currentSig} alt="Tanda tangan" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-[#888] text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.213-1.213l1-4a4 4 0 01.828-1.414z" /></svg>
                                TAP UNTUK TANDA TANGAN
                            </span>
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div key={field.id ?? field.name} className="flex flex-col gap-2">
                <label htmlFor={field.name} className="font-bold text-academic-black uppercase tracking-widest text-[10px]">{field.label}</label>
                <input
                    type={field.fieldType === 'date' ? 'date' : 'text'}
                    id={field.name}
                    name={field.name}
                    required={field.isRequired ?? false}
                    value={value}
                    onChange={(e) => onChange(field.name, e.target.value, parentName, index)}
                    className="rounded-none bg-white border border-academic-black p-3 text-academic-black placeholder-[#888]/50 focus:border-academic-black focus:outline-none focus:ring-1 focus:ring-academic-black font-mono text-[10px] font-bold tracking-widest uppercase"
                    placeholder={field.label}
                    style={field.fieldType === 'date' ? { colorScheme: "light" } : undefined}
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
        <div className="w-full rounded-none bg-white p-6 md:p-8 border border-academic-black">
            {/* Full-screen signature modal for mobile */}
            {expandedSig && (
                <div className="fixed inset-0 z-50 flex flex-col bg-academic-white md:hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-academic-black bg-white">
                        <h3 className="text-academic-black font-mono font-bold uppercase tracking-widest text-[10px]">TANDA TANGAN</h3>
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
                                className="text-academic-black hover:underline transition-colors text-[10px] font-mono font-bold tracking-widest uppercase"
                            >
                                HAPUS
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
                                className="bg-academic-black text-white px-4 py-1.5 rounded-none font-mono font-bold tracking-widest uppercase text-[10px] hover:bg-[#333]"
                            >
                                SELESAI
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-full rounded-none border border-academic-black bg-white overflow-hidden" style={{ touchAction: 'none' }}>
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
                    <p className="text-[#888] text-[10px] font-mono font-bold tracking-widest uppercase text-center pb-8 pt-4">TANDA TANGANI DI AREA PUTIH DI ATAS</p>
                </div>
            )}
            <h2 className="mb-6 text-sm font-mono font-bold tracking-widest uppercase text-academic-black text-center">ISI FORMULIR</h2>

            <form onSubmit={(e) => onSubmit(e, submitAction)} className="flex flex-col gap-6 text-[10px] font-mono z-50">
                {rootFields.map((field) => {
                    if (field.fieldType === 'array') {
                        const childrenFields = getChildren(field.id);
                        const rows = formData[field.name] ?? [];

                        return (
                            <div key={field.id ?? field.name} className="flex flex-col gap-4 border border-academic-black rounded-none p-4 md:p-6 bg-white shrink-0">
                                <h3 className="font-bold text-academic-black uppercase tracking-widest text-[10px] pb-2 border-b border-academic-black/10">{field.label}</h3>

                                {rows.map((row: any, index: number) => (
                                    <div key={index} className="flex flex-col gap-4 border-l-2 border-academic-black/20 pl-4 relative">
                                        {rows.length > 1 && (
                                            <button type="button" onClick={() => onRemoveRow(field.name, index)} className="absolute top-0 right-0 text-red-800 hover:underline text-[10px] font-bold uppercase tracking-widest">HAPUS BARIS</button>
                                        )}
                                        <h4 className="text-[#888] text-[10px] uppercase tracking-widest font-bold mb-2">DATA {index + 1}</h4>
                                        {childrenFields.map(child => renderField(child, field.name, index))}
                                    </div>
                                ))}

                                <button type="button" onClick={() => onAddRow(field.name, childrenFields)} className="mt-2 py-2 px-4 rounded-none border border-academic-black text-academic-black hover:bg-academic-black hover:text-white uppercase tracking-widest text-[10px] font-bold self-start transition-colors">
                                    + TAMBAH {field.label}
                                </button>
                            </div>
                        );
                    }

                    return renderField(field);
                })}

                {error && <p className="text-[10px] text-red-800 font-bold tracking-widest uppercase mt-2">{error}</p>}

                <div className="mt-8 flex flex-col md:flex-row gap-4 w-full z-10 relative border-t border-academic-black/10 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => setSubmitAction('save')}
                        className="flex-1 rounded-none bg-academic-black text-white px-5 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 border border-academic-black"
                    >
                        {loading && submitAction === 'save' ? "SAVING..." : "SAVE"}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={() => setSubmitAction('download')}
                        className="flex-1 rounded-none bg-white text-academic-black border border-academic-black px-5 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-academic-yellow disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading && submitAction === 'download' ? "GENERATING..." : "DOWNLOAD"}
                        {!loading && <span>↓</span>}
                    </button>
                </div>
            </form>
        </div>
    );
}
