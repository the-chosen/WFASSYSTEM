import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, followUpsTable, insertLeadSchema, insertFollowUpSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/leads", async (_req, res) => {
  const leads = await db.select().from(leadsTable).orderBy(leadsTable.createdAt);
  res.json(leads);
});

router.post("/leads", async (req, res) => {
  const result = insertLeadSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  const [lead] = await db.insert(leadsTable).values(result.data).returning();
  res.status(201).json(lead);
});

router.get("/leads/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

router.put("/leads/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = insertLeadSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  const [lead] = await db.update(leadsTable).set(result.data).where(eq(leadsTable.id, id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

router.delete("/leads/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [lead] = await db.delete(leadsTable).where(eq(leadsTable.id, id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.status(204).send();
});

router.get("/leads/:id/follow-ups", async (req, res) => {
  const leadId = Number(req.params.id);
  const followUps = await db.select().from(followUpsTable)
    .where(eq(followUpsTable.leadId, leadId))
    .orderBy(followUpsTable.scheduledDate);
  res.json(followUps);
});

router.post("/leads/:id/follow-ups", async (req, res) => {
  const leadId = Number(req.params.id);
  const result = insertFollowUpSchema.safeParse({ ...req.body, leadId });
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  const [followUp] = await db.insert(followUpsTable).values(result.data).returning();
  res.status(201).json(followUp);
});

router.put("/leads/:id/follow-ups/:fid", async (req, res) => {
  const fid = Number(req.params.fid);
  const result = insertFollowUpSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  const [followUp] = await db.update(followUpsTable).set(result.data).where(eq(followUpsTable.id, fid)).returning();
  if (!followUp) {
    res.status(404).json({ error: "Follow-up not found" });
    return;
  }
  res.json(followUp);
});

router.delete("/leads/:id/follow-ups/:fid", async (req, res) => {
  const fid = Number(req.params.fid);
  const [followUp] = await db.delete(followUpsTable).where(eq(followUpsTable.id, fid)).returning();
  if (!followUp) {
    res.status(404).json({ error: "Follow-up not found" });
    return;
  }
  res.status(204).send();
});

export default router;
