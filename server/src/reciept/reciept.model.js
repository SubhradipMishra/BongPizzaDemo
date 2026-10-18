
import { Schema, model } from "mongoose";

const receiptItemSchema = new Schema(
    {
        menuItemId: {
            type: Schema.Types.ObjectId,
            ref: "Menu",
            default: null,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        itemTotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const receiptSchema = new Schema(
    {
        receiptNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
            index: true,
        },

        orderNo: {
            type: String,
            required: true,
            trim: true,
        },

        orderType: {
            type: String,
            enum: ["dine-in", "pickup", "delivery"],
            required: true,
        },

        tableNumber: {
            type: String,
            default: "",
            trim: true,
        },

        customer: {
            name: {
                type: String,
                trim: true,
                default: "",
            },
            phone: {
                type: String,
                trim: true,
                default: "",
            },
            address: {
                type: String,
                trim: true,
                default: "",
            },
        },

        items: {
            type: [receiptItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "Receipt must contain at least one item",
            },
        },

        totalItems: {
            type: Number,
            required: true,
            min: 1,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        amountPaid: {
            type: Number,
            default: 0,
            min: 0,
        },

        balanceDue: {
            type: Number,
            default: 0,
            min: 0,
        },

        paymentStatus: {
            type: String,
            enum: ["unpaid", "partially_paid", "paid", "refunded"],
            default: "unpaid",
        },

        payments: [
            {
                method: {
                    type: String,
                    enum: ["cash", "upi", "card", "due", "other", "part"],
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],

        shopDetails: {
            name: {
                type: String,
                default: "BongPizza",
                trim: true,
            },
            address: {
                type: String,
                default: "",
                trim: true,
            },
            phone: {
                type: String,
                default: "",
                trim: true,
            },
            gstNumber: {
                type: String,
                default: "",
                trim: true,
            },
        },

        issuedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        issuedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const ReceiptModel = model("Receipt", receiptSchema);

export default ReceiptModel;
