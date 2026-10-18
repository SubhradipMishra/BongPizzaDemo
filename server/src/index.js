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

mongoose.connect(process.env.DB_URL)
    .then(() => console.log("DB CONNECTED SUCCESSFULLY..."))
    .catch((err) => console.log(`DB failed to connect :- ${err}`));

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        const allowed = [
            process.env.FRONTEND_URL,          // production Render URL
            "http://localhost:5173",            // local Vite dev
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ].filter(Boolean);

        if (allowed.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin ${origin} not allowed`));
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

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});