
import SettingsModel from "./settings.model.js";

// DEFAULT SETTINGS
const defaultSettings = {
    shopName: "বং Pizza",
    taxEnabled: false,
    pricesIncludeTax: false,
    cgstRate: 0,
    sgstRate: 0,
    receiptFooter: "Thank you for visiting বং Pizza!",
    receiptPaperSize: "80mm",
    showGstNumberOnReceipt: true,
    autoPrintReceipt: false,
    autoPrintKOT: false,
};

// GET SETTINGS
export const getSettings = async (req, res) => {
    try {
        let settings = await SettingsModel.findOne();

        if (!settings) {
            settings = await SettingsModel.create(defaultSettings);
        }

        return res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch settings",
        });
    }
};

// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
    try {
        const allowedFields = [
            "shopName",
            "address",
            "phone",
            "email",
            "gstNumber",
            "taxEnabled",
            "pricesIncludeTax",
            "cgstRate",
            "sgstRate",
            "receiptFooter",
            "receiptPaperSize",
            "showGstNumberOnReceipt",
            "autoPrintReceipt",
            "autoPrintKOT",
        ];

        const updates = {};

        // Only accept recognized fields
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one valid setting to update",
            });
        }

        // Manual validation
        if (
            updates.shopName !== undefined &&
            (typeof updates.shopName !== "string" ||
                !updates.shopName.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Shop name must be a non-empty string",
            });
        }

        const booleanFields = [
            "taxEnabled",
            "pricesIncludeTax",
            "showGstNumberOnReceipt",
            "autoPrintReceipt",
            "autoPrintKOT",
        ];

        for (const field of booleanFields) {
            if (
                updates[field] !== undefined &&
                typeof updates[field] !== "boolean"
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be true or false`,
                });
            }
        }

        for (const field of ["cgstRate", "sgstRate"]) {
            if (updates[field] !== undefined) {
                const rate = updates[field];

                if (
                    typeof rate !== "number" ||
                    !Number.isFinite(rate) ||
                    rate < 0 ||
                    rate > 100
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be a number between 0 and 100`,
                    });
                }
            }
        }

        if (updates.receiptPaperSize !== undefined) {
            const allowedSizes = ["58mm", "80mm", "A4"];

            if (!allowedSizes.includes(updates.receiptPaperSize)) {
                return res.status(400).json({
                    success: false,
                    message: "Receipt paper size must be 58mm, 80mm, or A4",
                });
            }
        }

        if (
            updates.email !== undefined &&
            typeof updates.email !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Email must be a string",
            });
        }

        if (
            updates.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address",
            });
        }

        if (
            updates.taxEnabled === true &&
            (updates.cgstRate !== undefined || updates.sgstRate !== undefined)
        ) {
            const cgst = updates.cgstRate ?? 0;
            const sgst = updates.sgstRate ?? 0;

            if (cgst + sgst > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Combined CGST and SGST cannot exceed 100%",
                });
            }
        }

        const updatedBy = req.user?._id || req.user?.id;

        if (!updatedBy) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        // Keep one settings document
        let settings = await SettingsModel.findOne();

        if (!settings) {
            settings = new SettingsModel({
                ...defaultSettings,
                updatedBy,
            });
        }

        Object.assign(settings, updates);
        settings.updatedBy = updatedBy;

        await settings.save();

        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: settings,
        });
    } catch (error) {
        console.error("Update settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update settings",
        });
    }
};
