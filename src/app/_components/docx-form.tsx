/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
"use client";

import { useState, useRef } from "react";
import type { MutableRefObject } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
  fields: {
    id: string;
    name: string;
    label: string;
    fieldType: string;
    isRequired: boolean | null;
    order: number | null;
    parentId: string | null;
    description?: string | null;
  }[];
  formData: Record<string, any>;
  onChange: (
    name: string,
    value: any,
    parentName?: string,
    index?: number,
  ) => void;
  onAddRow: (parentName: string, childrenFields: any[]) => void;
  onRemoveRow: (parentName: string, index: number) => void;
  sigCanvasRefs: MutableRefObject<Record<string, SignatureCanvas | null>>;
  onClearSignature: (name: string, parentName?: string, index?: number) => void;
  onSubmit: (e: React.FormEvent, action: "save" | "download") => void;
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
  const [submitAction, setSubmitAction] = useState<"save" | "download">("save");
  const [expandedSig, setExpandedSig] = useState<string | null>(null);
  const expandedCanvasRef = useRef<SignatureCanvas | null>(null);

  const rootFields = fields
    .filter((f) => !f.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const getChildren = (parentId: string) =>
    fields
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const renderField = (
    field: Props["fields"][0],
    parentName?: string,
    index?: number,
  ) => {
    const value =
      parentName && index !== undefined
        ? (formData[parentName]?.[index]?.[field.name] ?? "")
        : (formData[field.name] ?? "");

    if (field.fieldType === "signature") {
      const refKey =
        parentName && index !== undefined
          ? `${parentName}_${index}_${field.name}`
          : field.name;
      const currentSig =
        parentName && index !== undefined
          ? (formData[parentName]?.[index]?.[field.name] ?? "")
          : (formData[field.name] ?? "");

      return (
        <div key={field.id ?? field.name} className="flex flex-col gap-2">
          <label className="text-academic-black mb-1 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
            <span>{field.label}</span>
            <button
              type="button"
              onClick={() => onClearSignature(field.name, parentName, index)}
              className="hover:text-academic-black text-[#888] underline transition-colors"
            >
              HAPUS
            </button>
          </label>
          {field.description && (
            <p className="-mt-1 mb-1 font-mono text-[9px] tracking-wide text-[#888]">
              {field.description}
            </p>
          )}
          {/* Inline canvas (hidden on small screens, shown on md+) */}
          <div className="border-academic-black relative z-20 hidden cursor-crosshair overflow-hidden rounded-none border bg-white md:block">
            <SignatureCanvas
              ref={(ref) => {
                sigCanvasRefs.current[refKey] = ref;
              }}
              penColor="black"
              onEnd={() => {
                onChange(
                  field.name,
                  sigCanvasRefs.current[refKey]
                    ?.getCanvas()
                    .toDataURL("image/png") ?? "",
                  parentName,
                  index,
                );
              }}
              canvasProps={{
                width: 400,
                height: 150,
                className: "w-full h-[150px]",
              }}
            />
          </div>
          {/* Mobile tap-to-expand preview */}
          <button
            type="button"
            onClick={() => setExpandedSig(refKey)}
            className="border-academic-black relative flex h-[80px] w-full items-center justify-center overflow-hidden rounded-none border bg-white md:hidden"
          >
            {currentSig ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSig}
                alt="Tanda tangan"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="flex flex-col items-center gap-1 text-[10px] font-bold tracking-widest text-[#888] uppercase">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.213-1.213l1-4a4 4 0 01.828-1.414z"
                  />
                </svg>
                TAP UNTUK TANDA TANGAN
              </span>
            )}
          </button>
        </div>
      );
    }

    return (
      <div key={field.id ?? field.name} className="flex flex-col gap-2">
        <label
          htmlFor={field.name}
          className="text-academic-black text-[10px] font-bold tracking-widest uppercase"
        >
          {field.label}
        </label>
        {field.description && (
          <p className="-mt-1 font-mono text-[9px] tracking-wide text-[#888]">
            {field.description}
          </p>
        )}
        <input
          type={field.fieldType === "date" ? "date" : "text"}
          id={field.name}
          name={field.name}
          required={field.isRequired ?? false}
          value={value}
          onChange={(e) =>
            onChange(field.name, e.target.value, parentName, index)
          }
          className="border-academic-black text-academic-black focus:border-academic-black focus:ring-academic-black rounded-none border bg-white p-3 font-mono text-[10px] font-bold tracking-widest uppercase placeholder-[#888]/50 focus:ring-1 focus:outline-none"
          placeholder={field.label}
          style={
            field.fieldType === "date" ? { colorScheme: "light" } : undefined
          }
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
          return {
            fieldName: parts.slice(2).join("_"),
            parentName: parts[0],
            index: parseInt(parts[1] ?? "0"),
          };
        }
        return {
          fieldName: expandedSig,
          parentName: undefined,
          index: undefined,
        };
      })()
    : null;

  return (
    <div className="border-academic-black w-full rounded-none border bg-white p-6 md:p-8">
      {/* Full-screen signature modal for mobile */}
      {expandedSig && (
        <div className="bg-academic-white fixed inset-0 z-50 flex flex-col md:hidden">
          <div className="border-academic-black flex items-center justify-between border-b bg-white px-4 py-3">
            <h3 className="text-academic-black font-mono text-[10px] font-bold tracking-widest uppercase">
              TANDA TANGAN
            </h3>
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
                      expandedMeta.index,
                    );
                    onClearSignature(
                      expandedMeta.fieldName,
                      expandedMeta.parentName,
                      expandedMeta.index,
                    );
                  }
                }}
                className="text-academic-black font-mono text-[10px] font-bold tracking-widest uppercase transition-colors hover:underline"
              >
                HAPUS
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    expandedMeta &&
                    expandedCanvasRef.current &&
                    !expandedCanvasRef.current.isEmpty()
                  ) {
                    const dataUrl = expandedCanvasRef.current
                      .getCanvas()
                      .toDataURL("image/png");
                    onChange(
                      expandedMeta.fieldName,
                      dataUrl,
                      expandedMeta.parentName,
                      expandedMeta.index,
                    );
                  }
                  setExpandedSig(null);
                }}
                className="bg-academic-black rounded-none px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase hover:bg-[#333]"
              >
                SELESAI
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <div
              className="border-academic-black w-full overflow-hidden rounded-none border bg-white"
              style={{ touchAction: "none" }}
            >
              <SignatureCanvas
                ref={expandedCanvasRef}
                penColor="black"
                canvasProps={{
                  className: "w-full",
                  style: { height: "60vh", display: "block" },
                }}
              />
            </div>
          </div>
          <p className="pt-4 pb-8 text-center font-mono text-[10px] font-bold tracking-widest text-[#888] uppercase">
            TANDA TANGANI DI AREA PUTIH DI ATAS
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => onSubmit(e, submitAction)}
        className="z-50 flex flex-col gap-6 font-mono text-[10px]"
      >
        {rootFields.map((field) => {
          if (field.fieldType === "array") {
            const childrenFields = getChildren(field.id);
            const rows = formData[field.name] ?? [];

            return (
              <div
                key={field.id ?? field.name}
                className="border-academic-black flex shrink-0 flex-col gap-4 rounded-none border bg-white p-4 md:p-6"
              >
                <h3 className="text-academic-black border-academic-black/10 border-b pb-2 text-[10px] font-bold tracking-widest uppercase">
                  {field.label}
                </h3>

                {rows.map((row: any, index: number) => (
                  <div
                    key={`${field.name}-row-${index}`}
                    className="border-academic-black/20 relative flex flex-col gap-4 border-l-2 pl-4"
                  >
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveRow(field.name, index)}
                        className="absolute top-0 right-0 text-[10px] font-bold tracking-widest text-red-800 uppercase hover:underline"
                      >
                        HAPUS BARIS
                      </button>
                    )}
                    <h4 className="mb-2 text-[10px] font-bold tracking-widest text-[#888] uppercase">
                      DATA {index + 1}
                    </h4>
                    {childrenFields.map((child) =>
                      renderField(child, field.name, index),
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => onAddRow(field.name, childrenFields)}
                  className="border-academic-black text-academic-black hover:bg-academic-black mt-2 self-start rounded-none border px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-white"
                >
                  + TAMBAH {field.label}
                </button>
              </div>
            );
          }

          return renderField(field);
        })}

        {error && (
          <p className="mt-2 text-[10px] font-bold tracking-widest text-red-800 uppercase">
            {error}
          </p>
        )}

        <div className="border-academic-black/10 relative z-10 mt-8 flex w-full flex-col gap-4 border-t pt-6 md:flex-row">
          <button
            type="submit"
            disabled={loading}
            onClick={() => setSubmitAction("save")}
            className="bg-academic-black border-academic-black flex flex-1 items-center justify-center gap-2 rounded-none border px-5 py-4 text-[10px] font-bold tracking-widest text-white uppercase transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && submitAction === "save" ? "SAVING..." : "SAVE"}
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={() => setSubmitAction("download")}
            className="text-academic-black border-academic-black hover:bg-academic-yellow flex flex-1 items-center justify-center gap-2 rounded-none border bg-white px-5 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && submitAction === "download"
              ? "GENERATING..."
              : "DOWNLOAD"}
            {!loading && <span>↓</span>}
          </button>
        </div>
      </form>
    </div>
  );
}
