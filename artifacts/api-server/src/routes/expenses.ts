import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  ListExpensesQueryParams,
  CreateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  GetExpenseSummaryQueryParams,
  ListExpensesResponse,
  CreateExpenseResponse,
  UpdateExpenseResponse,
  GetExpenseSummaryResponse,
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

router.get("/expenses/summary", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = GetExpenseSummaryQueryParams.safeParse(req.query);
  const userId: string = req.userId;

  const now = new Date();
  const monthParam = parsed.success && parsed.data.month ? parsed.data.month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, month] = monthParam.split("-");
  const monthStart = `${year}-${month}-01`;
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const allExpenses = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(desc(expensesTable.date));

  const thisMonthExpenses = allExpenses.filter(e => e.date >= monthStart && e.date < monthEnd);

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalAllTime = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const categoryMap = new Map<string, number>();
  thisMonthExpenses.forEach(e => {
    const prev = categoryMap.get(e.category) || 0;
    categoryMap.set(e.category, prev + parseFloat(e.amount));
  });

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const recentExpenses = allExpenses.slice(0, 5).map(e => ({
    ...e,
    amount: parseFloat(e.amount),
    createdAt: e.createdAt.toISOString(),
  }));

  res.json(GetExpenseSummaryResponse.parse({
    totalThisMonth,
    totalAllTime,
    byCategory,
    recentExpenses,
  }));
});

router.get("/expenses", requireAuth, async (req: any, res): Promise<void> => {
  const userId: string = req.userId;
  const parsed = ListExpensesQueryParams.safeParse(req.query);

  let expenses = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, userId))
    .orderBy(desc(expensesTable.date));

  if (parsed.success && parsed.data.month) {
    const [year, month] = parsed.data.month.split("-");
    const monthStart = `${year}-${month}-01`;
    const nextMonth = new Date(parseInt(year), parseInt(month), 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    expenses = expenses.filter(e => e.date >= monthStart && e.date < monthEnd);
  }

  if (parsed.success && parsed.data.category) {
    expenses = expenses.filter(e => e.category === parsed.data.category);
  }

  const result = expenses.map(e => ({
    ...e,
    amount: parseFloat(e.amount),
    createdAt: e.createdAt.toISOString(),
  }));

  res.json(ListExpensesResponse.parse(result));
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
      amount: String(parsed.data.amount),
      category: parsed.data.category,
      description: parsed.data.description,
      date: parsed.data.date,
    })
    .returning();

  res.status(201).json(CreateExpenseResponse.parse({
    ...expense,
    amount: parseFloat(expense.amount),
    createdAt: expense.createdAt.toISOString(),
  }));
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
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(UpdateExpenseResponse.parse({
    ...expense,
    amount: parseFloat(expense.amount),
    createdAt: expense.createdAt.toISOString(),
  }));
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
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
