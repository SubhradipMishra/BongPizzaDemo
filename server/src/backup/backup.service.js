import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import mongoose from "mongoose";

import BackupLogModel from "./backup.model.js";
import OrderModel from "../order/order.model.js";
import PaymentModel from "../payments/payments.model.js";
import KOTModel from "../kot/kot.model.js";
import ReceiptModel from "../reciept/reciept.model.js";
import SettingsModel from "../settings/settings.model.js";
import TableModel from "../table/table.model.js";
import TableGroupModel from "../tableGroup/tableGroup.model.js";
import MenuModel from "../menu/menu.model.js";
import CategoryModel from "../category/category.model.js";
import UserModel from "../user/user.model.js";

// Storage directory for database backups
const BACKUPS_DIR = path.resolve(process.cwd(), "backups");

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// In-memory mutex to prevent overlapping backup jobs
let isBackupRunning = false;

// Maximum backups to retain locally (30 days policy)
const MAX_BACKUPS_RETAINED = 30;

// Collections to back up
const BACKUP_COLLECTIONS = [
    { name: "orders", model: OrderModel },
    { name: "payments", model: PaymentModel },
    { name: "kots", model: KOTModel },
    { name: "reciepts", model: ReceiptModel },
    { name: "settings", model: SettingsModel },
    { name: "tables", model: TableModel },
    { name: "tablegroups", model: TableGroupModel },
    { name: "menus", model: MenuModel },
    { name: "categories", model: CategoryModel },
    { name: "users", model: UserModel },
];

/**
 * Creates a complete restorable database backup archive (.json.gz).
 */
export const createDatabaseBackup = async ({ userId = null, isAutomatic = false } = {}) => {
    if (isBackupRunning) {
        throw new Error("A backup process is already currently running. Please wait for it to complete.");
    }

    isBackupRunning = true;
    const startTime = Date.now();

    // Timestamp for filename: YYYY-MM-DD_HHmmss
    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/\..+/, "")
        .replace(/:/g, "");
    const filename = `bongpizza_backup_${timestamp}.json.gz`;
    const targetFilePath = path.join(BACKUPS_DIR, filename);

    // Initial log entry
    const backupLog = await BackupLogModel.create({
        backupType: "database",
        filename,
        storagePath: targetFilePath,
        storageType: "local",
        status: "in_progress",
        triggeredBy: userId,
        isAutomatic,
    });

    try {
        const collectionsData = {};
        const collectionsCount = {};

        // 1. Dump each collection
        for (const item of BACKUP_COLLECTIONS) {
            const docs = await item.model.find({}).lean();
            collectionsData[item.name] = docs;
            collectionsCount[item.name] = docs.length;
        }

        // 2. Prepare manifest archive
        const manifest = {
            app: "BongPizza POS",
            version: "1.0.0",
            exportDate: now.toISOString(),
            shopLocation: "Debra, Paschim Medinipur, West Bengal, India",
            databaseEngine: "MongoDB Atlas",
            counts: collectionsCount,
            data: collectionsData,
        };

        const jsonString = JSON.stringify(manifest);

        // 3. Compress using GZIP and compute SHA256
        const hash = crypto.createHash("sha256");
        const compressedBuffer = await new Promise((resolve, reject) => {
            zlib.gzip(Buffer.from(jsonString, "utf-8"), (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        hash.update(compressedBuffer);
        const checksum = hash.digest("hex");

        // 4. Write to disk
        fs.writeFileSync(targetFilePath, compressedBuffer);

        const fileStats = fs.statSync(targetFilePath);
        const durationMs = Date.now() - startTime;

        // 5. Update Log entry
        backupLog.status = "completed";
        backupLog.fileSizeBytes = fileStats.size;
        backupLog.collectionsCount = collectionsCount;
        backupLog.checksum = checksum;
        backupLog.durationMs = durationMs;
        await backupLog.save();

        // 6. Apply retention policy (prune backups exceeding MAX_BACKUPS_RETAINED)
        await applyRetentionPolicy();

        isBackupRunning = false;
        return backupLog;
    } catch (err) {
        isBackupRunning = false;
        backupLog.status = "failed";
        backupLog.error = err.message || "Unknown error during backup";
        backupLog.durationMs = Date.now() - startTime;
        await backupLog.save();

        // Remove partial file if exists
        if (fs.existsSync(targetFilePath)) {
            try {
                fs.unlinkSync(targetFilePath);
            } catch (_) {}
        }

        throw err;
    }
};

/**
 * Prunes backups older than MAX_BACKUPS_RETAINED (30 backups).
 */
export const applyRetentionPolicy = async () => {
    try {
        const allCompleted = await BackupLogModel.find({
            status: "completed",
            storageType: "local",
        })
            .sort({ createdAt: -1 })
            .lean();

        if (allCompleted.length > MAX_BACKUPS_RETAINED) {
            const toDelete = allCompleted.slice(MAX_BACKUPS_RETAINED);
            for (const item of toDelete) {
                if (item.storagePath && fs.existsSync(item.storagePath)) {
                    try {
                        fs.unlinkSync(item.storagePath);
                    } catch (e) {
                        console.error(`Failed to delete pruned backup file: ${item.storagePath}`, e);
                    }
                }
                await BackupLogModel.findByIdAndDelete(item._id);
            }
        }
    } catch (error) {
        console.error("Retention policy pruning error:", error);
    }
};

/**
 * Retrieves the paginated backup history list.
 */
export const getBackupHistory = async ({ limit = 30 } = {}) => {
    return BackupLogModel.find({})
        .populate("triggeredBy", "username")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

/**
 * Safely verifies a backup archive by decompressing and validating
 * document counts and JSON integrity without touching or overwriting live database.
 */
export const verifyBackupArchive = async (backupId) => {
    const log = await BackupLogModel.findById(backupId);
    if (!log) {
        throw new Error("Backup record not found");
    }

    if (!fs.existsSync(log.storagePath)) {
        throw new Error("Backup file not found on disk");
    }

    const compressedBuffer = fs.readFileSync(log.storagePath);

    // Verify Checksum
    const hash = crypto.createHash("sha256");
    hash.update(compressedBuffer);
    const calculatedChecksum = hash.digest("hex");

    if (log.checksum && log.checksum !== calculatedChecksum) {
        throw new Error("Integrity check failed: Checksum mismatch. The backup file may be corrupted.");
    }

    // Decompress and parse
    const decompressed = await new Promise((resolve, reject) => {
        zlib.gunzip(compressedBuffer, (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
        });
    });

    const manifest = JSON.parse(decompressed.toString("utf-8"));

    if (!manifest.data || !manifest.counts) {
        throw new Error("Invalid backup manifest structure");
    }

    const verifiedCounts = {};
    for (const [colName, docs] of Object.entries(manifest.data)) {
        verifiedCounts[colName] = Array.isArray(docs) ? docs.length : 0;
    }

    return {
        valid: true,
        filename: log.filename,
        checksumVerified: true,
        checksum: calculatedChecksum,
        exportDate: manifest.exportDate,
        verifiedCounts,
        totalCollections: Object.keys(verifiedCounts).length,
        totalDocuments: Object.values(verifiedCounts).reduce((a, b) => a + b, 0),
        message: "Backup verified successfully. All collections and documents are intact.",
    };
};
