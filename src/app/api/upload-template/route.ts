import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name);
    const fileName = `${crypto.randomUUID()}${ext}`;

    const blob = await put(fileName, file, {
      access: "public",
    });

    return NextResponse.json({
      fileName: file.name,
      filePath: blob.url,
    });
  } catch (err: unknown) {
    console.error("Error uploading template:", err);
    return NextResponse.json(
      { error: "Error uploading template" },
      { status: 500 },
    );
  }
}
