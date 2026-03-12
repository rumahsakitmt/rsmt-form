import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { generatedDocument } from "@/server/db/schema";
import crypto from "crypto";

import { google } from "googleapis";
import { env } from "@/env.js";
import { documentTemplate } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const documentRouter = createTRPCRouter({
    create: protectedProcedure
        .input(
            z.object({
                templateId: z.string(),
                data: z.record(z.any()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const documentId = crypto.randomUUID();
            
            // Get user's room to attach to the document
            const userRoom = ctx.session.user.room;

            let driveFolderUrl: string | null = null;
            
            // Fetch template to check if it's UP3
            const template = await ctx.db.query.documentTemplate.findFirst({
                where: eq(documentTemplate.id, input.templateId),
            });

            if (template && (template.room?.toLowerCase() === "up3" || template.category?.toLowerCase() === "up3")) {
                // Determine folder name from input data (e.g. "nama" or "name", fallback to document title)
                const folderName = String(
                    input.data.nama || 
                    input.data.name || 
                    input.data.NAMA || 
                    input.data.NAME || 
                    `${template.title} - ${new Date().toISOString().split('T')[0]}`
                );

                if (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
                    try {
                        const auth = new google.auth.GoogleAuth({
                            credentials: {
                                client_email: env.GOOGLE_CLIENT_EMAIL,
                                // Need to replace escaped newlines with actual newlines in private key
                                private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                            },
                            scopes: ['https://www.googleapis.com/auth/drive'],
                        });

                        const drive = google.drive({ version: 'v3', auth });

                        const folderMetadata = {
                            name: folderName,
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: ['1EwsJDoBD2_--K0_Pt0A6K5cSZAKQgRTa'] // Up3 Folder ID
                        };

                        const file = await drive.files.create({
                            requestBody: folderMetadata,
                            fields: 'id, webViewLink'
                        });

                        if (file.data.webViewLink) {
                            driveFolderUrl = file.data.webViewLink;
                        }
                    } catch (error) {
                        console.error("Failed to create Google Drive folder:", error);
                        // Optional: you can decide whether to fail the whole mutation or just skip folder creation
                    }
                }
            }

            await ctx.db.insert(generatedDocument).values({
                id: documentId,
                templateId: input.templateId,
                data: JSON.stringify(input.data),
                room: userRoom ?? null,
                driveFolderUrl: driveFolderUrl ?? null,
                createdById: ctx.session.user.id,
            });

            return { id: documentId, driveFolderUrl };
        }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const isAdmin = user.role === "admin";

        let docs = await ctx.db.query.generatedDocument.findMany({
            with: {
                template: true,
                createdBy: true,
            },
            orderBy: (docs, { desc }) => [desc(docs.createdAt)],
        });

        if (!isAdmin) {
             docs = docs.filter(d => !d.room || d.room === user.room);
        }

        return docs;
    }),
});
