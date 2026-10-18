
import { Router } from "express";
import { CreateUser, Login, GetProfile, Logout } from "./user.controller.js";
import { UserGaurd } from "../middleware/gaurd.middleware.js";

const UserRouter = Router();
UserRouter.post("/create-user", CreateUser);
UserRouter.post("/login", Login);
UserRouter.get("/me", UserGaurd, GetProfile);
UserRouter.post("/logout", Logout);

export default UserRouter;