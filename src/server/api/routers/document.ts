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

            await ctx.db.insert(generatedDocument).values({
                id: documentId,
                templateId: input.templateId,
                data: JSON.stringify(input.data),
                createdById: ctx.session.user.id,
            });

            return { id: documentId };
        }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.generatedDocument.findMany({
            with: {
                template: true,
                createdBy: true,
            },
            orderBy: (docs, { desc }) => [desc(docs.createdAt)],
        });
    }),
});
