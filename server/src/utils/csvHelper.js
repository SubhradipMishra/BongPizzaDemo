import { sanitizeForSpreadsheet } from "./timezone.js";

/**
 * Encodes an array of rows (where each row is an array of cell values)
 * into an RFC-4180 compliant CSV string, prefixed with UTF-8 BOM (\uFEFF)
 * so Microsoft Excel renders UTF-8 characters (like ₹ and Bengali) properly.
 */
export const buildCsvString = (rows = []) => {
    const BOM = "\uFEFF";
    
    const escapeCell = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        // Formula injection protection
        str = sanitizeForSpreadsheet(str);
        // If string contains comma, quote, or newline, escape double quotes and wrap in quotes
        if (/[",\r\n]/.test(str)) {
            str = `"${str.replace(/"/g, '""')}"`;
        } else {
            str = `"${str}"`;
        }
        return str;
    };

    const csvContent = rows
        .map((row) => row.map(escapeCell).join(","))
        .join("\r\n");

    return BOM + csvContent;
};
