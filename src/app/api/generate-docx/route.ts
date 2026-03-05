import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import ImageModule from "docxtemplater-image-module-free";

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Load the template from the public folder
        const templatePath = path.resolve(process.cwd(), "public", "template.docx");
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

        // Render the document with the data from the form
        doc.render(data);

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
                "Content-Disposition": `attachment; filename="dokumen-${data.name || 'template'}.docx"`,
            },
            status: 200,
        });
    } catch (err: any) {
        console.error("Error generating docx:", err);
        return NextResponse.json(
            { error: "Error generating document" },
            { status: 500 }
        );
    }
}
