import { pgTable, serial, text, boolean, numeric, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull().default("quotation"),
  quotationNumber: text("quotation_number").notNull(),
  date: text("date").notNull(),
  validUntil: text("valid_until").notNull(),
  clientName: text("client_name").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  address: text("address").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  items: jsonb("items").notNull().default([]),
  discountType: text("discount_type").notNull().default("fixed"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull().default("0"),
  applyTax: boolean("apply_tax").notNull().default(true),
  notes: text("notes").notNull().default(""),
  preparedBy: text("prepared_by").notNull().default(""),
  signatureImage: text("signature_image").notNull().default(""),
  // Approval workflow
  status: text("status").notNull().default("draft"), // draft | pending | approved | rejected
  submittedById: integer("submitted_by_id"),
  approvedById: integer("approved_by_id"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
