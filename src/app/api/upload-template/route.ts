import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        // make sure file name is unique
        const ext = path.extname(originalName);
        const fileName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(process.cwd(), "public", "templates", fileName);

        await writeFile(filePath, buffer);

        // Path to be stored in DB and used by the generating logic
        return NextResponse.json({
            fileName: originalName,
            filePath: `/templates/${fileName}`
        });

    } catch (err: unknown) {
        console.error("Error uploading template:", err);
        return NextResponse.json({ error: "Error uploading template" }, { status: 500 });
    }
}
