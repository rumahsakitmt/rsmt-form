"use client";

import type { RefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

export type FormData = {
    name: string;
    room: string;
    date: string;
    signature: string;
};

type Props = {
    formData: FormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    sigCanvas: RefObject<SignatureCanvas | null>;
    onClearSignature: () => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string;
};

export function DocxForm({
    formData,
    onChange,
    sigCanvas,
    onClearSignature,
    onSubmit,
    loading,
    error,
}: Props) {
    return (
        <div className="w-full rounded-xl bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/5">
            <h2 className="mb-6 text-2xl font-bold text-white text-center">Isi Formulir</h2>

            <form onSubmit={onSubmit} className="flex flex-col gap-4 text-sm">
                <div className="flex flex-col gap-1">
                    <label htmlFor="name" className="font-bold text-white uppercase tracking-wider text-[10px]">Nama</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={onChange}
                        className="rounded-lg bg-white/5 border border-white/20 p-2.5 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                        placeholder="John Doe"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="room" className="font-bold text-white uppercase tracking-wider text-[10px]">Ruangan</label>
                    <input
                        type="text"
                        id="room"
                        name="room"
                        required
                        value={formData.room}
                        onChange={onChange}
                        className="rounded-lg bg-white/5 border border-white/20 p-2.5 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                        placeholder="Mawar"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="date" className="font-bold text-white uppercase tracking-wider text-[10px]">Tanggal</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={onChange}
                        className="rounded-lg bg-white/5 border border-white/20 p-2.5 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                        style={{ colorScheme: "dark" }}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-bold text-white uppercase tracking-wider text-[10px] flex justify-between items-center mb-1">
                        <span>Tanda Tangan</span>
                        <button
                            type="button"
                            onClick={onClearSignature}
                            className="text-white/50 hover:text-white transition-colors underline"
                        >
                            Hapus
                        </button>
                    </label>
                    <div className="rounded-lg bg-[#EAE8E3] border border-white/20 overflow-hidden cursor-crosshair">
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            onEnd={() => {
                                // Trigger a state update in the parent when drawing finishes
                                onChange({
                                    target: {
                                        name: 'signature',
                                        value: sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png") || ""
                                    }
                                } as any);
                            }}
                            canvasProps={{
                                width: 400,
                                height: 150,
                                className: "w-full h-[150px]"
                            }}
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 font-bold mt-2">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 rounded-lg bg-white text-black px-5 py-4 font-bold uppercase tracking-wider transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full flex justify-center items-center gap-2"
                >
                    {loading ? "MENGHASILKAN DOKUMEN..." : "DOWNLOAD DOKUMEN"}
                    {!loading && <span>↓</span>}
                </button>
            </form>
        </div>
    );
}
