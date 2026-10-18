import { Router } from "express";
import { UserGaurd } from "../middleware/gaurd.middleware.js";
import {
    getSalesReport,
    getPaymentBreakdown,
} from "./report.controller.js";

const ReportRouter = Router();
ReportRouter.get("/getDailySalesReport", UserGaurd, getSalesReport);
ReportRouter.get("/getSalesReport", UserGaurd, getSalesReport);
ReportRouter.get("/getPaymentBreakDown", UserGaurd, getPaymentBreakdown);

export default ReportRouter;