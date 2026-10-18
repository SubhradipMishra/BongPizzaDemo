import { Router } from "express";
import { createCategory, getCategory } from "./category.controller.js";

const CategoryRouter = Router();

CategoryRouter.post("/create", createCategory);
CategoryRouter.get("/get", getCategory);

export default CategoryRouter;