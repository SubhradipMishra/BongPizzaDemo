

import { Router } from "express";
import {
    createTable,
    getAvailableTable,
    getAllTable,
    removeTable,
    updateTableStatus,
} from "./table.controller.js";
const TableRouter = Router();

TableRouter.post("/create", createTable);
TableRouter.get("/available", getAvailableTable);
TableRouter.get("/getall", getAllTable);
TableRouter.delete("/delete/:id", removeTable);
TableRouter.patch("/status/:id", updateTableStatus);
TableRouter.put("/status/:id", updateTableStatus);

export default TableRouter;
