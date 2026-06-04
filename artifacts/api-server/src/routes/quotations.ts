import { Router, type IRouter } from "express";
import { db, quotationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateQuotationBody,
  UpdateQuotationBody,
  GetQuotationResponse,
  UpdateQuotationResponse,
  ListQuotationsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quotations", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: quotationsTable.id,
        quotationNumber: quotationsTable.quotationNumber,
        clientName: quotationsTable.clientName,
        companyName: quotationsTable.companyName,
        date: quotationsTable.date,
        validUntil: quotationsTable.validUntil,
        createdAt: quotationsTable.createdAt,
      })
      .from(quotationsTable)
      .orderBy(quotationsTable.createdAt);

    const data = rows.map((r) =>
      ListQuotationsResponseItem.parse({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })
    );
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to list quotations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quotations", async (req, res) => {
  const parsed = CreateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  try {
    const [row] = await db
      .insert(quotationsTable)
      .values({
        quotationNumber: body.quotationNumber,
        date: body.date,
        validUntil: body.validUntil,
        clientName: body.clientName,
        companyName: body.companyName ?? "",
        address: body.address ?? "",
        email: body.email ?? "",
        phone: body.phone ?? "",
        items: body.items as any,
        discountType: body.discountType,
        discountValue: String(body.discountValue),
        applyTax: body.applyTax,
        notes: body.notes ?? "",
        preparedBy: body.preparedBy ?? "",
        signatureImage: body.signatureImage ?? "",
      })
      .returning();

    res.status(201).json(GetQuotationResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to create quotation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quotations/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db.select().from(quotationsTable).where(eq(quotationsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(GetQuotationResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to get quotation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/quotations/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  try {
    const [row] = await db
      .update(quotationsTable)
      .set({
        quotationNumber: body.quotationNumber,
        date: body.date,
        validUntil: body.validUntil,
        clientName: body.clientName,
        companyName: body.companyName ?? "",
        address: body.address ?? "",
        email: body.email ?? "",
        phone: body.phone ?? "",
        items: body.items as any,
        discountType: body.discountType,
        discountValue: String(body.discountValue),
        applyTax: body.applyTax,
        notes: body.notes ?? "",
        preparedBy: body.preparedBy ?? "",
        signatureImage: body.signatureImage ?? "",
      })
      .where(eq(quotationsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(UpdateQuotationResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to update quotation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quotations/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .delete(quotationsTable)
      .where(eq(quotationsTable.id, id))
      .returning({ id: quotationsTable.id });

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete quotation");
    res.status(500).json({ error: "Internal server error" });
  }
});

function toRecord(row: typeof quotationsTable.$inferSelect) {
  return {
    id: row.id,
    quotationNumber: row.quotationNumber,
    date: row.date,
    validUntil: row.validUntil,
    clientName: row.clientName,
    companyName: row.companyName,
    address: row.address,
    email: row.email,
    phone: row.phone,
    items: row.items as any,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    applyTax: row.applyTax,
    notes: row.notes,
    preparedBy: row.preparedBy,
    signatureImage: row.signatureImage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
