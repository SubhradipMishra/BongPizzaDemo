import { Router } from "express";
import { UserGaurd } from "../middleware/gaurd.middleware.js";
import {
    getSalesReport,
    getPaymentBreakdown,
    exportSalesReport,
    exportOrders,
    exportPayments,
} from "./report.controller.js";

const ReportRouter = Router();

// Analytics APIs (used by dashboard and reports page)
ReportRouter.get("/getDailySalesReport", UserGaurd, getSalesReport);
ReportRouter.get("/getSalesReport", UserGaurd, getSalesReport);
ReportRouter.get("/getPaymentBreakDown", UserGaurd, getPaymentBreakdown);

// Export APIs (Excel .xlsx and CSV .csv)
ReportRouter.get("/export/sales", UserGaurd, exportSalesReport);
ReportRouter.get("/export/orders", UserGaurd, exportOrders);
ReportRouter.get("/export/payments", UserGaurd, exportPayments);

export default ReportRouter;