"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PizZip from "pizzip";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function NewTemplatePage() {
  const router = useRouter();
  const createTemplate = api.template.create.useMutation();

  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extractedFields, setExtractedFields] = useState<
    {
      id: string;
      name: string;
      label: string;
      fieldType: string;
      isRequired: boolean;
      order: number;
      parentId?: string;
    }[]
  >([]);
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

        files.forEach((file) => {
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

            if (tagName.startsWith("#")) {
              // Array Open
              const arrayName = tagName.substring(1);
              if (!addedNames.has(arrayName)) {
                const newArrayField = {
                  id: crypto.randomUUID(),
                  name: arrayName,
                  label: arrayName
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  fieldType: "array",
                  isRequired: true,
                  order: orderCount++,
                };
                elements.push(newArrayField);
                addedNames.add(arrayName);
                currentParent = newArrayField;
              } else {
                currentParent =
                  elements.find((e) => e.name === arrayName) ?? null;
              }
            } else if (tagName.startsWith("/")) {
              // Array Close
              currentParent = null;
            } else {
              // Normal Variable
              const cleanVariable = tagName.startsWith("%")
                ? tagName.substring(1)
                : tagName;

              if (!addedNames.has(cleanVariable)) {
                addedNames.add(cleanVariable);
                elements.push({
                  id: crypto.randomUUID(),
                  name: cleanVariable,
                  label: cleanVariable
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  fieldType:
                    tagName.startsWith("%") ||
                    tagName.toLowerCase().includes("signature") ||
                    tagName.toLowerCase().includes("ttd")
                      ? "signature"
                      : cleanVariable.toLowerCase().includes("date") ||
                          cleanVariable.toLowerCase().includes("tanggal")
                        ? "date"
                        : "text",
                  isRequired: true,
                  order: orderCount++,
                  parentId: currentParent?.id,
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

  const handleFieldChange = <K extends keyof (typeof extractedFields)[0]>(
    index: number,
    key: K,
    value: (typeof extractedFields)[0][K],
  ) => {
    const newFields = [...extractedFields];
    newFields[index] = {
      ...newFields[index],
      [key]: value,
    } as (typeof extractedFields)[0];
    setExtractedFields(newFields);
  };

  const handleAddVariable = () => {
    setExtractedFields([
      ...extractedFields,
      {
        id: crypto.randomUUID(),
        name: `custom_variable_${extractedFields.length + 1}`,
        label: "Custom Variable",
        fieldType: "text",
        isRequired: false,
        order: extractedFields.length,
      },
    ]);
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
      const uploadRes = await fetch("/api/upload-template", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = (await uploadRes.json()) as {
        filePath: string;
        fileName: string;
      };
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

      router.push("/");
    } catch (error: unknown) {
      console.error(error);
      alert("Error saving template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-academic-white text-academic-black flex min-h-screen flex-col items-center p-4 font-mono md:p-8">
      <h1 className="text-academic-black border-academic-green mb-8 inline-block w-full max-w-2xl border-b-4 pb-2 text-center text-2xl font-bold tracking-widest uppercase md:text-3xl">
        Add New Template
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-academic-white border-academic-black w-full max-w-2xl border p-6 shadow-[8px_8px_0px_#111111] md:p-10"
      >
        <div className="flex flex-col gap-8">
          <div>
            <label
              htmlFor="title"
              className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
            >
              Title
            </label>
            <Input
              id="title"
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 transition-colors outline-none focus-visible:ring-0"
              placeholder="e.g. General Consent"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
            <div>
              <label
                htmlFor="room"
                className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
              >
                Room
              </label>
              <Input
                id="room"
                required
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 transition-colors outline-none focus-visible:ring-0"
                placeholder="e.g. UP3"
              />
            </div>
          </div>

          <div className="border-academic-black bg-academic-green border p-4 shadow-[4px_4px_0px_#111111]">
            <label
              htmlFor="docx-file"
              className="text-academic-black mb-4 block text-[10px] font-bold tracking-widest uppercase"
            >
              Document Template (.docx)
            </label>
            <Input
              id="docx-file"
              required
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="bg-academic-white border-academic-black text-academic-black file:border-academic-black file:bg-academic-black file:text-academic-white hover:file:bg-academic-white hover:file:text-academic-black h-auto w-full cursor-pointer rounded-none border p-3 font-mono text-xs shadow-none ring-0 file:mr-4 file:rounded-none file:border file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:uppercase file:transition-colors focus:outline-none focus-visible:ring-0"
            />
          </div>
        </div>

        {extractedFields.length > 0 && (
          <div className="border-academic-black mt-12 border-t-2 pt-10">
            <h2 className="text-academic-black mb-6 flex items-center gap-3 text-xl font-bold tracking-widest uppercase">
              <span className="bg-academic-green border-academic-black inline-block h-4 w-4 border"></span>
              Detected Variables
            </h2>
            <div className="space-y-6">
              {extractedFields.map((field, index) => (
                <div
                  key={`${field.name}-${index}`}
                  className={`bg-academic-white border-academic-black relative flex flex-col gap-4 border p-6 shadow-[4px_4px_0px_#48C796] md:flex-row md:items-start ${field.parentId ? "border-l-academic-green ml-4 border-l-4 md:ml-8" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="border-academic-black absolute -top-3 -right-3 z-10 flex h-6 w-6 items-center justify-center border bg-red-500 text-xs font-bold text-white shadow-[2px_2px_0px_#111111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-red-600 hover:shadow-none"
                  >
                    ×
                  </button>

                  <div className="w-full md:w-1/4">
                    <span className="text-academic-black/60 mb-1 block text-[10px] font-bold tracking-widest uppercase">
                      Variable
                    </span>
                    <div className="flex items-center">
                      <span className="text-academic-black/40 mr-1 font-mono text-sm">
                        {"{{"}
                      </span>
                      <Input
                        type="text"
                        value={field.name}
                        onChange={(e) =>
                          handleFieldChange(index, "name", e.target.value)
                        }
                        className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b border-l-0 bg-transparent p-1 font-mono text-sm shadow-none ring-0 outline-none focus-visible:ring-0"
                      />
                      <span className="text-academic-black/40 ml-1 font-mono text-sm">
                        {"}}"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3">
                    <label className="text-academic-black/60 mb-1 block text-[10px] font-bold tracking-widest uppercase">
                      UI Label
                    </label>
                    <Input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(index, "label", e.target.value)
                      }
                      className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b border-l-0 bg-transparent p-1 text-xs font-bold uppercase shadow-none ring-0 outline-none focus-visible:ring-0"
                    />
                  </div>

                  <div className="w-full md:w-1/4">
                    <label className="text-academic-black/60 mb-1 block text-[10px] font-bold tracking-widest uppercase">
                      Type
                    </label>
                    {field.fieldType === "array" ? (
                      <div className="bg-academic-black text-academic-white border-academic-black w-full border p-2 text-center text-[10px] font-bold tracking-widest uppercase shadow-[2px_2px_0px_#48C796]">
                        Array (Repeat)
                      </div>
                    ) : (
                      <Select
                        value={field.fieldType}
                        onValueChange={(val) =>
                          handleFieldChange(index, "fieldType", val)
                        }
                      >
                        <SelectTrigger className="border-academic-black text-academic-black focus:border-academic-green h-auto w-full cursor-pointer rounded-none border-t-0 border-r-0 border-b border-l-0 bg-transparent p-1 px-0 py-1 text-xs font-bold uppercase shadow-none ring-0 outline-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-academic-white border-academic-black rounded-none shadow-[4px_4px_0px_#111111]">
                          <SelectItem
                            value="text"
                            className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                          >
                            TEXT
                          </SelectItem>
                          <SelectItem
                            value="date"
                            className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                          >
                            DATE
                          </SelectItem>
                          <SelectItem
                            value="signature"
                            className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                          >
                            SIGNATURE
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex items-center md:pt-6">
                    <label className="text-academic-black group flex cursor-pointer items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                      <Checkbox
                        checked={field.isRequired}
                        onCheckedChange={(checked) =>
                          handleFieldChange(index, "isRequired", !!checked)
                        }
                        className="border-academic-black bg-academic-white data-[state=checked]:bg-academic-green data-[state=checked]:text-academic-black h-4 w-4 rounded-none border shadow-none"
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-2">
              <button
                type="button"
                onClick={handleAddVariable}
                className="border-academic-black/40 text-academic-black/60 hover:text-academic-black hover:border-academic-black hover:bg-academic-black/5 w-full border-2 border-dashed py-4 text-[10px] font-bold tracking-widest uppercase transition-all"
              >
                + Add Manual Variable (Header/Footer/Custom)
              </button>
            </div>
          </div>
        )}

        <button
          disabled={loading || !file}
          type="submit"
          className="bg-academic-black border-academic-black text-academic-white mt-12 w-full border py-4 text-sm font-bold tracking-widest uppercase shadow-[4px_4px_0px_#48C796] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#48C796] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#48C796]"
        >
          {loading ? "SAVING..." : "SAVE TEMPLATE"}
        </button>
      </form>
    </main>
  );
}
