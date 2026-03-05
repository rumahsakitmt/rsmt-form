"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { DocxForm, type FormData } from "./docx-form";

export function TemplateEditor({ templateId }: { templateId: string }) {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        room: "",
        date: "",
        signature: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const sigCanvas = useRef<SignatureCanvas>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClearSignature = () => {
        sigCanvas.current?.clear();
        setFormData({ ...formData, signature: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const signatureBase64 = sigCanvas.current?.isEmpty() ? "" : sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
        const submitData = { ...formData, signature: signatureBase64 };

        try {
            const response = await fetch("/api/generate-docx", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                throw new Error("Failed to generate document");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `dokumen-${formData.name || "template"}.docx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-12 w-full items-center justify-center">
            <div className="w-full max-w-md shrink-0">
                <DocxForm
                    formData={formData}
                    onChange={handleChange}
                    sigCanvas={sigCanvas}
                    onClearSignature={handleClearSignature}
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
}
