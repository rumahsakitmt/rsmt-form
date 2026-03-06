"use client";

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
    onSubmit: (e: React.FormEvent) => void;
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
    const rootFields = fields.filter(f => !f.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const getChildren = (parentId: string) => fields.filter(f => f.parentId === parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const renderField = (field: Props['fields'][0], parentName?: string, index?: number) => {
        const value = parentName && index !== undefined ? (formData[parentName]?.[index]?.[field.name] ?? "") : (formData[field.name] ?? "");

        if (field.fieldType === "signature") {
            const refKey = parentName && index !== undefined ? `${parentName}_${index}_${field.name}` : field.name;
            return (
                <div key={field.id || field.name} className="flex flex-col gap-1">
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
                    <div className="rounded-lg bg-[#EAE8E3] border border-white/20 overflow-hidden cursor-crosshair relative z-20">
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
                </div>
            );
        }

        return (
            <div key={field.id || field.name} className="flex flex-col gap-1">
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

    return (
        <div className="w-full rounded-xl bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/5">
            <h2 className="mb-6 text-2xl font-bold text-white text-center">Isi Formulir</h2>

            <form onSubmit={onSubmit} className="flex flex-col gap-4 text-sm z-50">
                {rootFields.map((field) => {
                    if (field.fieldType === 'array') {
                        const childrenFields = getChildren(field.id);
                        const rows = formData[field.name] || [];

                        return (
                            <div key={field.id || field.name} className="flex flex-col gap-4 border border-white/20 rounded-lg p-4 bg-white/5">
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

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 rounded-lg bg-white text-black px-5 py-4 font-bold uppercase tracking-wider transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full flex justify-center items-center gap-2 relative z-10"
                >
                    {loading ? "MENGHASILKAN DOKUMEN..." : "DOWNLOAD DOKUMEN"}
                    {!loading && <span>↓</span>}
                </button>
            </form>
        </div>
    );
}
