"use client";

import type { MutableRefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
    fields: { name: string; label: string; fieldType: string; isRequired: boolean | null; order: number | null }[];
    formData: Record<string, string>;
    onChange: (name: string, value: string) => void;
    sigCanvasRefs: MutableRefObject<Record<string, SignatureCanvas | null>>;
    onClearSignature: (name: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string;
};

export function DocxForm({
    fields,
    formData,
    onChange,
    sigCanvasRefs,
    onClearSignature,
    onSubmit,
    loading,
    error,
}: Props) {
    return (
        <div className="w-full rounded-xl bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/5">
            <h2 className="mb-6 text-2xl font-bold text-white text-center">Isi Formulir</h2>

            <form onSubmit={onSubmit} className="flex flex-col gap-4 text-sm z-50">
                {fields.map((field) => {
                    if (field.fieldType === "signature") {
                        return (
                            <div key={field.name} className="flex flex-col gap-1">
                                <label className="font-bold text-white uppercase tracking-wider text-[10px] flex justify-between items-center mb-1">
                                    <span>{field.label}</span>
                                    <button
                                        type="button"
                                        onClick={() => onClearSignature(field.name)}
                                        className="text-white/50 hover:text-white transition-colors underline"
                                    >
                                        Hapus
                                    </button>
                                </label>
                                <div className="rounded-lg bg-[#EAE8E3] border border-white/20 overflow-hidden cursor-crosshair relative z-20">
                                    <SignatureCanvas
                                        ref={(ref) => {
                                            sigCanvasRefs.current[field.name] = ref;
                                        }}
                                        penColor="black"
                                        onEnd={() => {
                                            onChange(
                                                field.name,
                                                sigCanvasRefs.current[field.name]?.getTrimmedCanvas().toDataURL("image/png") ?? ""
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
                        <div key={field.name} className="flex flex-col gap-1">
                            <label htmlFor={field.name} className="font-bold text-white uppercase tracking-wider text-[10px]">{field.label}</label>
                            <input
                                type={field.fieldType === 'date' ? 'date' : 'text'}
                                id={field.name}
                                name={field.name}
                                required={field.isRequired ?? false}
                                value={formData[field.name] ?? ""}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                className="rounded-lg bg-white/5 border border-white/20 p-2.5 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                                placeholder={field.label}
                                style={field.fieldType === 'date' ? { colorScheme: "dark" } : undefined}
                            />
                        </div>
                    );
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
