import { Router, type IRouter } from "express";
import { db, inventoryItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemBody,
  GetInventoryItemResponse,
  UpdateInventoryItemResponse,
  ListInventoryItemsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", async (req, res) => {
  try {
    const activeOnly = req.query["activeOnly"] === "true";
    const rows = await db
      .select()
      .from(inventoryItemsTable)
      .orderBy(inventoryItemsTable.category, inventoryItemsTable.name);

    const filtered = activeOnly ? rows.filter((r) => r.isActive) : rows;

    const data = filtered.map((r) =>
      ListInventoryItemsResponseItem.parse(toRecord(r))
    );
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to list inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inventory", async (req, res) => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  try {
    const [row] = await db
      .insert(inventoryItemsTable)
      .values({
        name: body.name,
        description: body.description ?? "",
        category: body.category ?? "General",
        unit: body.unit ?? "unit",
        unitPrice: String(body.unitPrice),
        isActive: body.isActive ?? true,
      })
      .returning();

    res.status(201).json(GetInventoryItemResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to create inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/inventory/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(GetInventoryItemResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/inventory/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  try {
    const [row] = await db
      .update(inventoryItemsTable)
      .set({
        name: body.name,
        description: body.description ?? "",
        category: body.category ?? "General",
        unit: body.unit ?? "unit",
        unitPrice: String(body.unitPrice),
        isActive: body.isActive ?? true,
      })
      .where(eq(inventoryItemsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(UpdateInventoryItemResponse.parse(toRecord(row)));
  } catch (err) {
    req.log.error({ err }, "Failed to update inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/inventory/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .returning({ id: inventoryItemsTable.id });

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete inventory item");
    res.status(500).json({ error: "Internal server error" });
  }
});

function toRecord(row: typeof inventoryItemsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    unitPrice: Number(row.unitPrice),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export default router;
