import { Router, type IRouter } from "express";
import healthRouter from "./health";
import expensesRouter from "./expenses";
import accountsRouter from "./accounts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(expensesRouter);
router.use(accountsRouter);

export default router;
