import { relations, sql } from "drizzle-orm";
import { index, sqliteTable } from "drizzle-orm/sqlite-core";

/**
 * Multi-project schema prefix helper
 */

// Posts example table
export const posts = sqliteTable(
  "post",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }),
    createdById: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

// Better Auth core tables
export const user = sqliteTable("user", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text({ length: 255 }),
  email: d.text({ length: 255 }).notNull().unique(),
  emailVerified: d.integer({ mode: "boolean" }).default(false),
  image: d.text({ length: 255 }),
  // Admin plugin fields
  role: d.text("role"),
  banned: d.integer("banned", { mode: "boolean" }),
  banReason: d.text("banReason"),
  banExpires: d.integer("banExpires", { mode: "timestamp" }),
  // Custom fields
  room: d.text("room"),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const account = sqliteTable(
  "account",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    accountId: d.text({ length: 255 }).notNull(),
    providerId: d.text({ length: 255 }).notNull(),
    accessToken: d.text(),
    refreshToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text({ length: 255 }),
    idToken: d.text(),
    password: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = sqliteTable(
  "session",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .text({ length: 255 })
      .notNull()
      .references(() => user.id),
    token: d.text({ length: 255 }).notNull().unique(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    ipAddress: d.text({ length: 255 }),
    userAgent: d.text({ length: 255 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = sqliteTable(
  "verification",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: d.text({ length: 255 }).notNull(),
    value: d.text({ length: 255 }).notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// Document Template System
export const documentTemplate = sqliteTable("document_template", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: d.text({ length: 256 }).notNull(),
  category: d.text({ length: 100 }).notNull(),
  status: d.text({ length: 50 }).notNull(), // 'DRAFT', 'ACTIVE', 'ARCHIVED'
  theme: d.text({ length: 50 }).notNull().default("light"), // 'light', 'dark'
  icon: d.text({ length: 50 }), // To store icon identifiers if needed
  fileName: d.text({ length: 255 }).notNull(),
  filePath: d.text({ length: 1024 }).notNull(), // Public path to access the file
  fileHash: d.text({ length: 255 }), // Optional: Ensure uniqueness/cache busting
  room: d.text({ length: 255 }), // Optional room scoping (e.g. "up3")
  createdById: d.text({ length: 255 }).references(() => user.id),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

export const documentTemplateRelations = relations(documentTemplate, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [documentTemplate.createdById],
    references: [user.id],
  }),
  fields: many(templateField),
  generatedDocuments: many(generatedDocument),
}));

export const templateField = sqliteTable("template_field", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: d
    .text({ length: 255 })
    .notNull()
    .references(() => documentTemplate.id, { onDelete: 'cascade' }),
  name: d.text({ length: 255 }).notNull(), // The variable in docx, e.g., 'patient_name'
  label: d.text({ length: 255 }).notNull(), // UI label, e.g., 'Patient Name'
  fieldType: d.text({ length: 50 }).notNull().default("text"), // 'text', 'date', 'signature', 'number', 'array'
  parentId: d.text({ length: 255 }), // If this field belongs to an array field
  isRequired: d.integer({ mode: "boolean" }).default(true),
  order: d.integer().default(0),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}), (t) => [
  index("template_field_template_id_idx").on(t.templateId),
]);

export const templateFieldRelations = relations(templateField, ({ one }) => ({
  template: one(documentTemplate, {
    fields: [templateField.templateId],
    references: [documentTemplate.id],
  }),
}));

export const generatedDocument = sqliteTable("generated_document", (d) => ({
  id: d
    .text({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: d
    .text({ length: 255 })
    .notNull()
    .references(() => documentTemplate.id, { onDelete: 'cascade' }),
  data: d.text().notNull(), // JSON string
  room: d.text({ length: 255 }), // Optional room scoping (e.g. "up3")
  driveFolderUrl: d.text({ length: 1024 }), // URL to the generated Google Drive folder
  createdById: d.text({ length: 255 }).references(() => user.id),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}), (t) => [
  index("generated_document_template_id_idx").on(t.templateId),
]);

export const generatedDocumentRelations = relations(generatedDocument, ({ one }) => ({
  template: one(documentTemplate, {
    fields: [generatedDocument.templateId],
    references: [documentTemplate.id],
  }),
  createdBy: one(user, {
    fields: [generatedDocument.createdById],
    references: [user.id],
  }),
}));
