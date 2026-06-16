import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotationsRouter from "./quotations";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotationsRouter);
router.use(inventoryRouter);

export default router;
