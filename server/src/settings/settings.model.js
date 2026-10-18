
import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
    {
        // Shop details
        shopName: {
            type: String,
            required: true,
            trim: true,
            default: "BongPizza",
        },

        address: {
            type: String,
            trim: true,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },

        // Tax configuration
        taxEnabled: {
            type: Boolean,
            default: false,
        },

        pricesIncludeTax: {
            type: Boolean,
            default: false,
        },

        cgstRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        sgstRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // Receipt preferences
        receiptFooter: {
            type: String,
            trim: true,
            default: "Thank you for visiting BongPizza!",
        },

        receiptPaperSize: {
            type: String,
            enum: ["58mm", "80mm", "A4"],
            default: "80mm",
        },

        showGstNumberOnReceipt: {
            type: Boolean,
            default: true,
        },

        // Printing preferences
        autoPrintReceipt: {
            type: Boolean,
            default: false,
        },

        autoPrintKOT: {
            type: Boolean,
            default: false,
        },

        // Admin who last updated settings
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const SettingsModel = model("Settings", settingsSchema);

export default SettingsModel;
