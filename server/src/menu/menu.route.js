

import { Router } from "express";
import { CreateMenu, getFullMenu, updateMenu, deleteMenu, getMenuByCategory, getSpecificMenu } from "./menu.controller.js";

const MenuRouter = Router();

MenuRouter.post("/create", CreateMenu);
MenuRouter.get("/getfullmenu", getFullMenu);
MenuRouter.put("/update/:id", updateMenu);
MenuRouter.delete("/delete/:id", deleteMenu);
MenuRouter.get("/getbycategory/:category", getMenuByCategory);
MenuRouter.get("/getspecific/:id", getSpecificMenu);


export default MenuRouter;