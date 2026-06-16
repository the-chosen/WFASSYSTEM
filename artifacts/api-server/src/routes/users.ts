import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const role = req.session?.userRole;
  if (role !== "admin" && role !== "super_admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.session?.userRole !== "super_admin") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  next();
}

router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    role: usersTable.role,
    displayName: usersTable.displayName,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", requireSuperAdmin, async (req, res) => {
  const { username, email, password, role, displayName } = req.body ?? {};
  if (!username || !password || !displayName) {
    res.status(400).json({ error: "username, password, displayName required" });
    return;
  }
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username, email: email ?? "", passwordHash,
    role: role ?? "user", displayName,
  }).returning();
  res.status(201).json({
    id: user.id, username: user.username, email: user.email,
    role: user.role, displayName: user.displayName, createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/:id", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { role, displayName, email } = req.body ?? {};
  const updates: Record<string, string> = {};
  if (role) updates.role = role;
  if (displayName) updates.displayName = displayName;
  if (email !== undefined) updates.email = email;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id, username: user.username, email: user.email,
    role: user.role, displayName: user.displayName, createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(204).send();
});

export { requireAdmin, requireSuperAdmin };
export default router;
