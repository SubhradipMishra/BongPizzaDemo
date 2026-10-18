
import { Schema, model } from "mongoose";

const kotItemSchema = new Schema(
    {
        menuItemId: {
            type: Schema.Types.ObjectId,
            ref: "Menu",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: false }
);

const kotSchema = new Schema(
    {
        kotNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        orderType: {
            type: String,
            enum: ["dine-in", "pickup", "delivery"],
            required: true,
        },

        tableId: {
            type: Schema.Types.ObjectId,
            ref: "Table",
            default: null,
        },

        tableNumber: {
            type: String,
            default: "",
            trim: true,
        },

        items: {
            type: [kotItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "KOT must contain at least one item",
            },
        },

        status: {
            type: String,
            enum: ["pending", "preparing", "ready", "served", "cancelled"],
            default: "pending",
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        time: {
            type: Date,
            default: Date.now(),
        }
    },
    { timestamps: true }
);

const KOTModel = model("KOT", kotSchema);

export default KOTModel;
