import { Schema, model } from "mongoose";

const backupLogSchema = new Schema(
    {
        backupType: {
            type: String,
            enum: ["database", "sales_report", "orders_export", "payments_export"],
            default: "database",
            required: true,
        },
        filename: {
            type: String,
            required: true,
            trim: true,
        },
        storagePath: {
            type: String,
            required: true,
        },
        storageType: {
            type: String,
            enum: ["local", "s3"],
            default: "local",
        },
        status: {
            type: String,
            enum: ["in_progress", "completed", "failed"],
            default: "in_progress",
            index: true,
        },
        fileSizeBytes: {
            type: Number,
            default: 0,
        },
        collectionsCount: {
            type: Schema.Types.Mixed,
            default: {},
        },
        checksum: {
            type: String,
            default: "",
        },
        durationMs: {
            type: Number,
            default: 0,
        },
        error: {
            type: String,
            default: "",
        },
        triggeredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isAutomatic: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const BackupLogModel = model("BackupLog", backupLogSchema);

export default BackupLogModel;
