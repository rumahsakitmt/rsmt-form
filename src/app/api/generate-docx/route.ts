import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { db } from "@/server/db";
import { documentTemplate } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import ImageModule from "docxtemplater-image-module-free";

export async function POST(req: Request) {
    try {
        const payload = (await req.json()) as { templateId: string, data: Record<string, unknown> };
        const { templateId, data } = payload;

        if (!templateId || !data) {
            return NextResponse.json({ error: "Missing templateId or data" }, { status: 400 });
        }

        const template = await db.query.documentTemplate.findFirst({
            where: eq(documentTemplate.id, String(templateId)),
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Load the template from the public folder based on template.filePath that looks like /templates/xyz.docx
        const relativePath = template.filePath.replace(/^\//, "");
        const templatePath = path.resolve(process.cwd(), "public", relativePath);
        const content = readFileSync(templatePath, "binary");

        // Initialize pizzip & docxtemplater
        const zip = new PizZip(content);

        // Configure ImageModule
        const imageOptions = {
            centered: false,
            // Function to load the image from base64 string
            getImage(tagValue: string) {
                if (!tagValue) return Buffer.from("");
                // Remove the data:image/png;base64, part
                const base64Data = tagValue.replace(/^data:image\/\w+;base64,/, "");
                return Buffer.from(base64Data, "base64");
            },
            // Specify the image size [width, height]
            getSize() {
                return [150, 80];
            },
        };
        const imageModule = new ImageModule(imageOptions);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "{{", end: "}}" },
            modules: [imageModule],
        });

        const cleanDataObj = (obj: unknown): unknown => {
            if (Array.isArray(obj)) {
                return obj.map(item => cleanDataObj(item));
            } else if (obj !== null && typeof obj === 'object') {
                const cleaned: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(obj)) {
                    const cleanKey = key.startsWith('%') ? key.substring(1) : key;
                    cleaned[cleanKey] = cleanDataObj(value);
                }
                return cleaned;
            }
            return obj;
        };

        const cleanData = cleanDataObj(data) as Record<string, unknown>;

        // Render the document with the data from the form
        doc.render(cleanData);

        // Get the generated document as a buffer
        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // Return the document buffer as response with correct headers for Word files
        return new NextResponse(buf as unknown as BodyInit, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="dokumen-${template.title.replace(/\s+/g, '-').toLowerCase()}.docx"`,
            },
            status: 200,
        });
    } catch (err: unknown) {
        console.error("Error generating docx:", err);
        return NextResponse.json(
            { error: "Error generating document" },
            { status: 500 }
        );
    }
}
