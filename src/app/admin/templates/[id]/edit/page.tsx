/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: template, isLoading: isFetching } =
    api.template.getById.useQuery({ id }, { enabled: !!id });
  const updateTemplate = api.template.update.useMutation();

  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [theme, setTheme] = useState("light");
  const [status, setStatus] = useState("ACTIVE");
  const [file, setFile] = useState<File | null>(null);
  const [extractedFields, setExtractedFields] = useState<
    {
      id?: string;
      name: string;
      label: string;
      fieldType: string;
      isRequired: boolean;
      order: number;
      parentId?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setRoom(template.room ?? "");
      setTheme(template.theme);
      setStatus(template.status);
      setExtractedFields(
        template.fields.map((f) => ({
          name: f.name,
          label: f.label,
          fieldType: f.fieldType,
          parentId: f.parentId ?? undefined,
          isRequired: f.isRequired ?? true,
          order: f.order ?? 0,
          id: f.id,
        })),
      );
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

        files.forEach((f) => {
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
              const arrayName = tagName.substring(1);
              if (!addedNames.has(arrayName)) {
                const existing = extractedFields.find(
                  (f) => f.name === arrayName,
                );
                const newArrayField = {
                  id: existing?.id ?? crypto.randomUUID(),
                  name: arrayName,
                  label:
                    existing?.label ??
                    arrayName
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                  fieldType: "array",
                  isRequired: existing?.isRequired ?? true,
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
              currentParent = null;
            } else {
              const cleanVariable = tagName.startsWith("%")
                ? tagName.substring(1)
                : tagName;

              if (!addedNames.has(cleanVariable)) {
                addedNames.add(cleanVariable);
                const existing = extractedFields.find(
                  (f) => f.name === cleanVariable,
                );

                elements.push({
                  id: existing?.id ?? crypto.randomUUID(),
                  name: cleanVariable,
                  label:
                    existing?.label ??
                    cleanVariable
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                  fieldType:
                    existing?.fieldType ??
                    (tagName.startsWith("%") ||
                    tagName.toLowerCase().includes("signature") ||
                    tagName.toLowerCase().includes("ttd")
                      ? "signature"
                      : cleanVariable.toLowerCase().includes("date") ||
                          cleanVariable.toLowerCase().includes("tanggal")
                        ? "date"
                        : "text"),
                  isRequired: existing?.isRequired ?? true,
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
    if (!template) return;

    setLoading(true);

    try {
      let fileName = template.fileName;
      let filePath = template.filePath;

      // If a new file is uploaded, upload it
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload-template", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const uploadData = (await uploadRes.json()) as {
          filePath: string;
          fileName: string;
        };
        fileName = uploadData.fileName;
        filePath = uploadData.filePath;
      }

      await updateTemplate.mutateAsync({
        id,
        title,
        category: room || "UNCATEGORIZED",
        room,
        theme,
        status,
        fileName,
        filePath,
        fields: extractedFields,
      });

      router.push("/");
    } catch (error: unknown) {
      console.error(error);
      alert("Error updating template.");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching || !template) {
    return (
      <main className="bg-academic-white text-academic-black flex min-h-screen items-center justify-center p-8 font-mono">
        <div className="border-academic-green border-b-4 pb-2 text-xl font-bold tracking-widest uppercase">
          LOADING...
        </div>
      </main>
    );
  }

  return (
    <main className="bg-academic-white text-academic-black flex min-h-screen flex-col items-center p-4 font-mono md:p-8">
      <h1 className="text-academic-black border-academic-green mb-8 inline-block w-full max-w-2xl border-b-4 pb-2 text-center text-2xl font-bold tracking-widest uppercase md:text-3xl">
        Edit Template
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-academic-white border-academic-black w-full max-w-2xl border p-6 shadow-[8px_8px_0px_#111111] md:p-10"
      >
        <div className="flex flex-col gap-8">
          <div>
            <label className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
              Title
            </label>
            <Input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 transition-colors outline-none focus-visible:ring-0"
              placeholder="e.g. TAX EXEMPTION FORM"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                Room
              </label>
              <Input
                required
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="border-academic-black text-academic-black focus:border-academic-green focus-visible:border-academic-green h-auto w-full rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 transition-colors outline-none focus-visible:ring-0"
                placeholder="e.g. UP3 BANTEN UTARA"
              />
            </div>
            <div>
              <label className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                Theme
              </label>
              <Select value={theme} onValueChange={(val) => setTheme(val)}>
                <SelectTrigger className="border-academic-black text-academic-black focus:border-academic-green h-auto w-full cursor-pointer rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 outline-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-academic-white border-academic-black rounded-none shadow-[4px_4px_0px_#111111]">
                  <SelectItem
                    value="light"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    Light
                  </SelectItem>
                  <SelectItem
                    value="dark"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    Dark
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-academic-black/60 bg-academic-black/5 border-academic-black/20 mb-2 inline-block border px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                Status
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className="border-academic-black text-academic-black focus:border-academic-green h-auto w-full cursor-pointer rounded-none border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent p-3 font-bold uppercase shadow-none ring-0 outline-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-academic-white border-academic-black rounded-none shadow-[4px_4px_0px_#111111]">
                  <SelectItem
                    value="ACTIVE"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    ACTIVE
                  </SelectItem>
                  <SelectItem
                    value="DRAFT"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    DRAFT
                  </SelectItem>
                  <SelectItem
                    value="LOCKED"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    LOCKED
                  </SelectItem>
                  <SelectItem
                    value="REVIEW"
                    className="focus:bg-academic-green focus:text-academic-black cursor-pointer text-xs font-bold tracking-wider uppercase"
                  >
                    REVIEW
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-academic-black bg-academic-green border p-4 shadow-[4px_4px_0px_#111111]">
            <label className="text-academic-black mb-4 block text-[10px] font-bold tracking-widest uppercase">
              Document Template (.docx)
            </label>
            <Input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="bg-academic-white border-academic-black text-academic-black file:border-academic-black file:bg-academic-black file:text-academic-white hover:file:bg-academic-white hover:file:text-academic-black h-auto w-full cursor-pointer rounded-none border p-3 font-mono text-xs shadow-none ring-0 file:mr-4 file:rounded-none file:border file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:uppercase file:transition-colors focus:outline-none focus-visible:ring-0"
            />
            <p className="text-academic-black mt-3 text-[10px] font-bold tracking-widest uppercase">
              Current file: {template.fileName} (Upload new file to replace)
            </p>
          </div>
        </div>

        {extractedFields.length > 0 && (
          <div className="border-academic-black mt-12 border-t-2 pt-10">
            <h2 className="text-academic-black mb-6 flex items-center gap-3 text-xl font-bold tracking-widest uppercase">
              <span className="bg-academic-green border-academic-black inline-block h-4 w-4 border"></span>
              Variables
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
          disabled={loading}
          type="submit"
          className="bg-academic-black border-academic-black text-academic-white mt-12 w-full border py-4 text-sm font-bold tracking-widest uppercase shadow-[4px_4px_0px_#48C796] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#48C796] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#48C796]"
        >
          {loading ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </form>
    </main>
  );
}
