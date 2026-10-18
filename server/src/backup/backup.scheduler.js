import cron from "node-cron";
import { createDatabaseBackup } from "./backup.service.js";

/**
 * Initializes the automated database backup scheduler.
 * Runs daily at 23:59 IST (Debra shop closing time).
 * 23:59 IST is 18:29 UTC -> cron "29 18 * * *"
 */
export const initBackupScheduler = () => {
    // Optional custom cron expression from environment, defaults to daily at 23:59 IST (18:29 UTC)
    const schedule = process.env.BACKUP_CRON_SCHEDULE || "29 18 * * *";

    if (!cron.validate(schedule)) {
        console.error(`Invalid BACKUP_CRON_SCHEDULE expression: "${schedule}". Using fallback "29 18 * * *".`);
    }

    const validSchedule = cron.validate(schedule) ? schedule : "29 18 * * *";

    console.log(`[Backup Scheduler] Initialized daily automated backup with schedule: "${validSchedule}"`);

    cron.schedule(validSchedule, async () => {
        console.log(`[Backup Scheduler] Starting scheduled daily database backup at ${new Date().toISOString()}`);
        try {
            const backup = await createDatabaseBackup({
                userId: null,
                isAutomatic: true,
            });
            console.log(`[Backup Scheduler] Daily backup completed successfully: ${backup.filename} (${(backup.fileSizeBytes / 1024).toFixed(1)} KB)`);
        } catch (error) {
            console.error("[Backup Scheduler] Scheduled daily backup failed:", error.message);
        }
    });
};
