import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

import UserRouter from "./user/user.route.js";
import MenuRouter from "./menu/menu.route.js";
import CategoryRouter from "./category/category.route.js";
import TableGroupRouter from "./tableGroup/tableGroup.route.js";
import TableRouter from "./table/table.route.js";
import PaymentsRouter from "./payments/payments.route.js";
import OrderRouter from "./order/order.route.js";
import KOTRouter from "./kot/kot.route.js";
import RecieptRouter from "./reciept/reciept.route.js";
import SettingsRouter from "./settings/settings.route.js";
import ReportRouter from "./report/report.route.js";
import BackupRouter from "./backup/backup.route.js";
import { initBackupScheduler } from "./backup/backup.scheduler.js";
import dns from "node:dns";

try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (err) {
    console.warn("Notice: DNS servers fallback warning:", err.message);
}

mongoose.connect(process.env.DB_URL)
    .then(() => {
        console.log("DB CONNECTED SUCCESSFULLY...");
        // Initialize scheduled daily backup
        initBackupScheduler();
    })
    .catch((err) => console.log(`DB failed to connect :- ${err}`));

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/+$/, "");

        const envOrigins = (process.env.FRONTEND_URL || "")
            .split(",")
            .map((o) => o.trim().replace(/\/+$/, ""))
            .filter(Boolean);

        const staticAllowed = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "https://bong-pizza-demo.vercel.app",
        ];

        let isAllowed =
            envOrigins.includes(cleanOrigin) ||
            staticAllowed.includes(cleanOrigin);

        if (!isAllowed) {
            try {
                const parsedUrl = new URL(cleanOrigin);
                if (parsedUrl.hostname.endsWith(".vercel.app") || parsedUrl.hostname.endsWith(".onrender.com")) {
                    isAllowed = true;
                }
            } catch (_) {}
        }

        if (isAllowed) {
            return callback(null, true);
        }

        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", UserRouter);
app.use("/api/menu", MenuRouter);
app.use("/api/category", CategoryRouter);
app.use("/api/tablegroup", TableGroupRouter);
app.use("/api/table", TableRouter);
app.use("/api/order", OrderRouter);
app.use("/api/payments", PaymentsRouter);
app.use("/api/kot", KOTRouter);
app.use("/api/reciept", RecieptRouter);
app.use("/api/settings", SettingsRouter);
app.use("/api/report", ReportRouter);
app.use("/api/backup", BackupRouter);

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});