
import Router from "express";
import { createKOT, getAllKOTs, getKOTById, updateKOTStatus } from "./kot.controller.js";
import { UserGaurd } from "../middleware/gaurd.middleware.js";

const KOTRouter = Router();

KOTRouter.post("/create", UserGaurd, createKOT);
KOTRouter.get("/getAllKOTs", UserGaurd, getAllKOTs);
KOTRouter.get("/getKOTById/:id", UserGaurd, getKOTById);
KOTRouter.patch("/updateKOTStatus/:id", UserGaurd, updateKOTStatus);

export default KOTRouter;