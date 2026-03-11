import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { generatedDocument } from "@/server/db/schema";
import crypto from "crypto";

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

            await ctx.db.insert(generatedDocument).values({
                id: documentId,
                templateId: input.templateId,
                data: JSON.stringify(input.data),
                room: userRoom ?? null,
                createdById: ctx.session.user.id,
            });

            return { id: documentId };
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
