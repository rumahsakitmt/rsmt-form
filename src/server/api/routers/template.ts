import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { documentTemplate, templateField } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { del } from "@vercel/blob";

export const templateRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        // If logged in, get user details for filtering
        const user = ctx.session?.user;
        const isAdmin = user?.role === "admin";
        
        let templates = await ctx.db.query.documentTemplate.findMany({
            orderBy: (templates, { desc }) => [desc(templates.createdAt)],
        });

        // Filter: Admin sees all. Normal user sees global (room is null) or templates matching their room. 
        // Guest user sees global only.
        if (!isAdmin) {
             templates = templates.filter(t => !t.room || t.room === user?.room);
        }

        return templates;
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

            if (!template) return null;

            // Authorization check
            const user = ctx.session?.user;
            const isAdmin = user?.role === "admin";
            if (!isAdmin && template.room && template.room !== user?.room) {
                 return null; // or throw TRPCError UNAUTHORIZED
            }

            return template;
        }),

    create: publicProcedure
        .input(
            z.object({
                title: z.string().min(1),
                category: z.string().min(1),
                status: z.string(),
                theme: z.string(),
                icon: z.string().optional(),
                fileName: z.string(),
                filePath: z.string(),
                room: z.string().optional(),
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
                room: input.room ?? null,
                createdById: ctx.session?.user?.id ?? null,
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
                room: z.string().optional(),
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
                    room: input.room ?? null,
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
            const template = await ctx.db.query.documentTemplate.findFirst({
                where: eq(documentTemplate.id, input.id),
            });

            if (template?.filePath) {
                try {
                    await del(template.filePath);
                } catch (error) {
                    console.error("Failed to delete blob from vercel:", error);
                }
            }

            // Delete fields first due to foreign key constraints, just to be safe
            await ctx.db.delete(templateField).where(eq(templateField.templateId, input.id));
            await ctx.db.delete(documentTemplate).where(eq(documentTemplate.id, input.id));

            return { success: true };
        }),
});
