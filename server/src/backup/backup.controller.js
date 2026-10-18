import fs from "fs";
import path from "path";
import BackupLogModel from "./backup.model.js";
import {
    createDatabaseBackup,
    getBackupHistory,
    verifyBackupArchive,
} from "./backup.service.js";

// TRIGGER MANUAL DATABASE BACKUP
export const triggerBackup = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id || null;
        const backup = await createDatabaseBackup({
            userId,
            isAutomatic: false,
        });

        return res.status(201).json({
            success: true,
            message: "Database backup completed successfully.",
            data: backup,
        });
    } catch (error) {
        console.error("Manual backup error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create database backup",
        });
    }
};

// GET BACKUP HISTORY
export const getHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 30;
        const history = await getBackupHistory({ limit });

        return res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        console.error("Get backup history error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve backup history",
        });
    }
};

// DOWNLOAD AUTHORIZED BACKUP FILE
export const downloadBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await BackupLogModel.findById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Backup record not found",
            });
        }

        if (log.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "This backup is not completed or has failed.",
            });
        }

        if (!fs.existsSync(log.storagePath)) {
            return res.status(404).json({
                success: false,
                message: "Backup file is no longer available on disk.",
            });
        }

        // Set secure headers for file download
        res.setHeader("Content-Type", "application/gzip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${log.filename}"`
        );
        res.setHeader("Content-Length", log.fileSizeBytes);

        const readStream = fs.createReadStream(log.storagePath);
        readStream.pipe(res);
    } catch (error) {
        console.error("Download backup error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to download backup file",
        });
    }
};

// SAFELY TEST RESTORE / VERIFY ARCHIVE
export const verifyBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await verifyBackupArchive(id);

        return res.status(200).json({
            success: true,
            message: "Backup archive verified successfully.",
            data: result,
        });
    } catch (error) {
        console.error("Verify backup error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to verify backup archive",
        });
    }
};
