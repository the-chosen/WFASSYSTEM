import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotationsRouter from "./quotations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotationsRouter);

export default router;
