import { Router } from "express";
import { createOrder, getAllOrders, getOrderById, updateOrderStatus, cancelOrder } from "./order.controller.js";
import { UserGaurd } from "../middleware/gaurd.middleware.js";

const OrderRouter = Router();

OrderRouter.post("/createOrder", UserGaurd, createOrder);
OrderRouter.get("/getAllOrders", getAllOrders);
OrderRouter.get("/getOrderById/:id", getOrderById);
OrderRouter.put("/updateOrderStatus/:id", updateOrderStatus);
OrderRouter.put("/cancelOrder/:id", cancelOrder);

export default OrderRouter;