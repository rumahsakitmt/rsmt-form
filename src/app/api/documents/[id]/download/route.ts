import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { db } from "@/server/db";
import { generatedDocument } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import ImageModule from "docxtemplater-image-module-free";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;

    const docRecord = await db.query.generatedDocument.findFirst({
      where: eq(generatedDocument.id, id),
      with: {
        template: true,
      },
    });

    if (!docRecord?.template) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const template = docRecord.template;
    const data = JSON.parse(docRecord.data) as Record<string, unknown>;

    // Load the template from Vercel Blob URL
    const templateUrl = template.filePath;
    const response = await fetch(templateUrl);
    const arrayBuffer = await response.arrayBuffer();
    const content = Buffer.from(arrayBuffer);

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

    const isDateString = (val: unknown): val is string => {
      if (typeof val !== "string") return false;
      return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(val) && !isNaN(Date.parse(val));
    };

    const formatDate = (val: string): string => {
      const d = new Date(val);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const cleanDataObj = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map((item) => cleanDataObj(item));
      } else if (obj !== null && typeof obj === "object") {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          const cleanKey = key.startsWith("%") ? key.substring(1) : key;
          cleaned[cleanKey] = cleanDataObj(value);
        }
        return cleaned;
      }
      if (isDateString(obj)) return formatDate(obj);
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
    const today = new Date().toLocaleDateString("id-ID").split("/").join("-");

    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="dokumen-${today}-${template.title.replace(/\s+/g, "-").toLowerCase()}.docx"`,
      },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("Error generating docx:", err);
    return NextResponse.json(
      { error: "Error generating document" },
      { status: 500 },
    );
  }
}
