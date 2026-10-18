import { Router } from "express";
import { createTableGroup, getAllTableGroup, deleteTableGroup, getSingleTableGroup, updateTableGroup } from "./tableGroup.controller.js";
const TableGroupRouter = Router();

TableGroupRouter.post("/create", createTableGroup);
TableGroupRouter.get("/getall", getAllTableGroup);
TableGroupRouter.delete("/delete/:id", deleteTableGroup);
TableGroupRouter.get("/getsingle/:id", getSingleTableGroup);
TableGroupRouter.put("/update/:id", updateTableGroup);

export default TableGroupRouter;