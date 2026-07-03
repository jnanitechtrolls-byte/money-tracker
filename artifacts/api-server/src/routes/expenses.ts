import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  ListExpensesQueryParams,
  CreateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  GetExpenseSummaryQueryParams,
} from "@workspace/api-zod";

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

function toExpenseJSON(e: typeof expensesTable.$inferSelect) {
  return {
    id: e.id,
    userId: e.userId,
    type: e.type,
    amount: parseFloat(e.amount),
    category: e.category,
    description: e.description,
    date: e.date,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/expenses/summary", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = GetExpenseSummaryQueryParams.safeParse(req.query);
  const userId: string = req.userId;

  const now = new Date();
  const monthParam =
    parsed.success && parsed.data.month
      ? parsed.data.month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, month] = monthParam.split("-");
  const monthStart = `${year}-${month}-01`;
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const allRows = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(desc(expensesTable.date));

  const thisMonthRows = allRows.filter((e) => e.date >= monthStart && e.date < monthEnd);

  const totalExpenses = thisMonthRows
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalIncome = thisMonthRows
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const balance = totalIncome - totalExpenses;

  // Category breakdown (expenses only)
  const categoryMap = new Map<string, number>();
  thisMonthRows
    .filter((e) => e.type === "expense")
    .forEach((e) => {
      const prev = categoryMap.get(e.category) || 0;
      categoryMap.set(e.category, prev + parseFloat(e.amount));
    });

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const recentExpenses = allRows.slice(0, 10).map(toExpenseJSON);

  // Monthly stats (last 12 months)
  const monthlyMap = new Map<string, { expenses: number; income: number }>();
  allRows.forEach((e) => {
    const m = e.date.slice(0, 7);
    const prev = monthlyMap.get(m) || { expenses: 0, income: 0 };
    if (e.type === "income") {
      monthlyMap.set(m, { ...prev, income: prev.income + parseFloat(e.amount) });
    } else {
      monthlyMap.set(m, { ...prev, expenses: prev.expenses + parseFloat(e.amount) });
    }
  });

  const monthlyStats = Array.from(monthlyMap.entries())
    .map(([month, { expenses, income }]) => ({
      month,
      expenses,
      income,
      balance: income - expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    totalExpenses,
    totalIncome,
    balance,
    byCategory,
    recentExpenses,
    monthlyStats,
  });
});

router.get("/expenses", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const parsed = ListExpensesQueryParams.safeParse(req.query);

  let rows = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(desc(expensesTable.date));

  if (parsed.success && parsed.data.month) {
    const [year, month] = parsed.data.month.split("-");
    const monthStart = `${year}-${month}-01`;
    const nextMonth = new Date(parseInt(year), parseInt(month), 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    rows = rows.filter((e) => e.date >= monthStart && e.date < monthEnd);
  }

  if (parsed.success && parsed.data.category) {
    rows = rows.filter((e) => e.category === parsed.data.category);
  }

  if (parsed.success && (parsed.data as any).type) {
    rows = rows.filter((e) => e.type === (parsed.data as any).type);
  }

  res.json(rows.map(toExpenseJSON));
});

router.post("/expenses", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      userId,
      type: (parsed.data as any).type || "expense",
      amount: String(parsed.data.amount),
      category: parsed.data.category,
      description: parsed.data.description || "",
      date: parsed.data.date,
    })
    .returning();

  res.status(201).json(toExpenseJSON(expense));
});

router.patch("/expenses/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if ((parsed.data as any).type !== undefined) updateData.type = (parsed.data as any).type;
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;

  const [expense] = await db
    .update(expensesTable)
    .set(updateData)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, userId)))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(toExpenseJSON(expense));
});

router.delete("/expenses/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, userId)))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
