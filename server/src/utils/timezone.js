/**
 * BongPizza POS - Timezone & Date Utilities
 * The pizza shop operates in Debra, West Bengal, India (Asia/Kolkata, UTC+5:30).
 */

const IST_OFFSET_MINUTES = 330; // +05:30 = 330 minutes

/**
 * Returns UTC Date boundaries for given YYYY-MM-DD dates in Asia/Kolkata (IST).
 * 
 * For example:
 * startDate = '2026-10-18' in IST starts at 2026-10-18T00:00:00+05:30
 * which is 2026-10-17T18:30:00.000Z in UTC.
 * 
 * endDate = '2026-10-18' in IST ends at 2026-10-18T23:59:59.999+05:30
 * which is 2026-10-18T18:29:59.999Z in UTC.
 */
export const getISTDateRange = (startDateStr, endDateStr) => {
    // Validate format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    // Default to current date in IST if missing
    const now = new Date();
    const istNow = new Date(now.getTime() + (IST_OFFSET_MINUTES + now.getTimezoneOffset()) * 60000);
    const todayStr = istNow.toISOString().split("T")[0];

    const startVal = startDateStr || todayStr;
    const endVal = endDateStr || startVal;

    if (!dateRegex.test(startVal) || !dateRegex.test(endVal)) {
        return null;
    }

    const [startYear, startMonth, startDay] = startVal.split("-").map(Number);
    const [endYear, endMonth, endDay] = endVal.split("-").map(Number);

    // Create UTC date that corresponds to start of day in IST (00:00:00.000 +05:30)
    // UTC time = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000)
    const startUtcMillis = Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0) - (IST_OFFSET_MINUTES * 60 * 1000);
    const endUtcMillis = Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999) - (IST_OFFSET_MINUTES * 60 * 1000);

    const start = new Date(startUtcMillis);
    const end = new Date(endUtcMillis);

    if (start > end) {
        return null;
    }

    return {
        start,
        end,
        startDateStr: startVal,
        endDateStr: endVal,
    };
};

/**
 * Format a Date to IST readable string: DD/MM/YYYY, hh:mm A
 */
export const formatISTDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

/**
 * Format a Date to IST date string: DD/MM/YYYY
 */
export const formatISTDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

/**
 * Neutralizes potential formula injection in spreadsheets (CSV/Excel).
 * Strings starting with '=', '+', '-', '@', '\t', '\r' are prefixed with a single quote (').
 */
export const sanitizeForSpreadsheet = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`;
    }
    return str;
};
