import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotationsTable = sqliteTable("quotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentType: text("document_type").notNull().default("quotation"),
  quotationNumber: text("quotation_number").notNull(),
  date: text("date").notNull(),
  validUntil: text("valid_until").notNull(),
  clientName: text("client_name").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  address: text("address").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  items: text("items", { mode: "json" }).notNull().$type<unknown[]>().default([]),
  discountType: text("discount_type").notNull().default("fixed"),
  discountValue: text("discount_value").notNull().default("0"),
  applyTax: integer("apply_tax", { mode: "boolean" }).notNull().default(true),
  notes: text("notes").notNull().default(""),
  preparedBy: text("prepared_by").notNull().default(""),
  signatureImage: text("signature_image").notNull().default(""),
  status: text("status").notNull().default("draft"),
  submittedById: integer("submitted_by_id"),
  approvedById: integer("approved_by_id"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  rejectionReason: text("rejection_reason").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
