import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { db, accountsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

function toAccountJSON(a: typeof accountsTable.$inferSelect) {
  return {
    id: a.id,
    userId: a.userId,
    name: a.name,
    type: a.type,
    currency: a.currency,
    amount: parseFloat(a.amount),
    icon: a.icon,
    includeInTotal: a.includeInTotal,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/accounts", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const rows = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .orderBy(desc(accountsTable.createdAt));
  res.json(rows.map(toAccountJSON));
});

router.post("/accounts", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const { name, type, currency, amount, icon, includeInTotal } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [account] = await db
    .insert(accountsTable)
    .values({
      userId,
      name,
      type: type || "Default",
      currency: currency || "USD",
      amount: String(amount ?? 0),
      icon: icon || "💳",
      includeInTotal: includeInTotal !== false,
    })
    .returning();
  res.status(201).json(toAccountJSON(account));
});

router.patch("/accounts/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, type, currency, amount, icon, includeInTotal } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (currency !== undefined) updateData.currency = currency;
  if (amount !== undefined) updateData.amount = String(amount);
  if (icon !== undefined) updateData.icon = icon;
  if (includeInTotal !== undefined) updateData.includeInTotal = includeInTotal;

  const [account] = await db
    .update(accountsTable)
    .set(updateData)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .returning();

  if (!account) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toAccountJSON(account));
});

router.delete("/accounts/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [account] = await db
    .delete(accountsTable)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .returning();

  if (!account) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
