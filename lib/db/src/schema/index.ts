import * as pgSchema from "./pg/index.js";
import * as sqliteSchema from "./sqlite/index.js";

const activeSchema = process.env.DATABASE_URL?.startsWith("postgres")
  ? pgSchema
  : sqliteSchema;

export const usersTable = activeSchema.usersTable;
export const insertUserSchema = activeSchema.insertUserSchema;

export const quotationsTable = activeSchema.quotationsTable;
export const insertQuotationSchema = activeSchema.insertQuotationSchema;

export const inventoryItemsTable = activeSchema.inventoryItemsTable;
export const insertInventoryItemSchema = activeSchema.insertInventoryItemSchema;

export const leadsTable = activeSchema.leadsTable;
export const followUpsTable = activeSchema.followUpsTable;
export const insertLeadSchema = activeSchema.insertLeadSchema;
export const insertFollowUpSchema = activeSchema.insertFollowUpSchema;

export type InsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export type InsertQuotation = typeof quotationsTable.$inferInsert;
export type Quotation = typeof quotationsTable.$inferSelect;

export type InsertInventoryItem = typeof inventoryItemsTable.$inferInsert;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

export type InsertLead = typeof leadsTable.$inferInsert;
export type Lead = typeof leadsTable.$inferSelect;
export type InsertFollowUp = typeof followUpsTable.$inferInsert;
export type FollowUp = typeof followUpsTable.$inferSelect;
