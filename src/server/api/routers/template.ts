import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { documentTemplate, templateField } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const templateRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.query.documentTemplate.findMany({
            orderBy: (templates, { desc }) => [desc(templates.createdAt)],
        });
    }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const template = await ctx.db.query.documentTemplate.findFirst({
                where: eq(documentTemplate.id, input.id),
                with: {
                    fields: {
                        orderBy: (fields, { asc }) => [asc(fields.order)],
                    },
                },
            });
            return template ?? null;
        }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1),
                category: z.string().min(1),
                status: z.string(),
                theme: z.string(),
                icon: z.string().optional(),
                fileName: z.string(),
                filePath: z.string(),
                fields: z.array(
                    z.object({
                        name: z.string(),
                        label: z.string(),
                        fieldType: z.string(),
                        parentId: z.string().optional(),
                        isRequired: z.boolean(),
                        order: z.number(),
                        id: z.string().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const templateId = crypto.randomUUID();

            await ctx.db.insert(documentTemplate).values({
                id: templateId,
                title: input.title,
                category: input.category,
                status: input.status,
                theme: input.theme,
                icon: input.icon ?? "light",
                fileName: input.fileName,
                filePath: input.filePath,
            });

            if (input.fields.length > 0) {
                const fieldsToInsert = input.fields.map((field) => ({
                    id: field.id ?? crypto.randomUUID(),
                    templateId,
                    name: field.name,
                    label: field.label,
                    fieldType: field.fieldType,
                    parentId: field.parentId,
                    isRequired: field.isRequired,
                    order: field.order,
                }));
                await ctx.db.insert(templateField).values(fieldsToInsert);
            }

            return { id: templateId };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1),
                category: z.string().min(1),
                status: z.string(),
                theme: z.string(),
                icon: z.string().optional(),
                fileName: z.string(),
                filePath: z.string(),
                fields: z.array(
                    z.object({
                        name: z.string(),
                        label: z.string(),
                        fieldType: z.string(),
                        parentId: z.string().optional(),
                        isRequired: z.boolean(),
                        order: z.number(),
                        id: z.string().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.db.update(documentTemplate)
                .set({
                    title: input.title,
                    category: input.category,
                    status: input.status,
                    theme: input.theme,
                    icon: input.icon ?? "light",
                    fileName: input.fileName,
                    filePath: input.filePath,
                    updatedAt: new Date(),
                })
                .where(eq(documentTemplate.id, input.id));

            // Delete old fields and insert new ones
            await ctx.db.delete(templateField).where(eq(templateField.templateId, input.id));

            if (input.fields.length > 0) {
                const fieldsToInsert = input.fields.map((field) => ({
                    id: field.id ?? crypto.randomUUID(),
                    templateId: input.id,
                    name: field.name,
                    label: field.label,
                    fieldType: field.fieldType,
                    parentId: field.parentId,
                    isRequired: field.isRequired,
                    order: field.order,
                }));
                await ctx.db.insert(templateField).values(fieldsToInsert);
            }

            return { id: input.id };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Delete fields first due to foreign key constraints, just to be safe
            await ctx.db.delete(templateField).where(eq(templateField.templateId, input.id));
            await ctx.db.delete(documentTemplate).where(eq(documentTemplate.id, input.id));

            return { success: true };
        }),
});
