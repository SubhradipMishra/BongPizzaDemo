import Router from "express";

import { UserGaurd } from "../middleware/gaurd.middleware.js";
import { createPayment, getPaymentsByOrder } from "./payments.controller.js";

const PaymentsRouter = Router();
PaymentsRouter.post("/createPayment", UserGaurd, createPayment);
PaymentsRouter.get("/getPaymentsByOrder/:orderId", getPaymentsByOrder);
// PaymentsRouter.put("/updatePayment", UserGaurd, updatePayment)

export default PaymentsRouter;