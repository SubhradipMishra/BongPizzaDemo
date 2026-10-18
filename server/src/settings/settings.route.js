

import { Router } from "express";
import { UserGaurd } from "../middleware/gaurd.middleware.js";
import { getSettings, updateSettings } from "./settings.controller.js";

const SettingsRouter = Router();

SettingsRouter.get("/", getSettings);
SettingsRouter.put("/", UserGaurd, updateSettings);

export default SettingsRouter;