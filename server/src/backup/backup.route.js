import { Router } from "express";
import { UserGaurd } from "../middleware/gaurd.middleware.js";
import {
    triggerBackup,
    getHistory,
    downloadBackup,
    verifyBackup,
} from "./backup.controller.js";

const BackupRouter = Router();

// All backup routes require authentication
BackupRouter.post("/create", UserGaurd, triggerBackup);
BackupRouter.get("/history", UserGaurd, getHistory);
BackupRouter.get("/download/:id", UserGaurd, downloadBackup);
BackupRouter.post("/verify/:id", UserGaurd, verifyBackup);

export default BackupRouter;
