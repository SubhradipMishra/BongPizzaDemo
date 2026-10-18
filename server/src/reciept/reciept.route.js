
import { Router } from "express";
import { createReceipt, getAllReceipts, getReceiptById, getReceiptByOrderId } from "./reciept.controller.js";
import { UserGaurd } from "../middleware/gaurd.middleware.js";

const RecieptRouter = Router();

RecieptRouter.post("/createReciept", UserGaurd, createReceipt);
RecieptRouter.get("/getAllReceipts", getAllReceipts);
RecieptRouter.get("/getReceiptById/:id", getReceiptById);
RecieptRouter.get("/getReceiptByOrderId/:orderId", getReceiptByOrderId);

export default RecieptRouter;
