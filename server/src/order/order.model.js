
import { Schema, model } from "mongoose";

const orderItemSchema = new Schema(
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
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isInteger,
        },
        itemTotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const customerSchema = new Schema(
    {
        name: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
    },
    { _id: false }
);

const OrderSchema = new Schema(
    {
        orderNo: {
            type: String,
            unique: true,
            required: true,
            trim: true,
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
            required: function () {
                return this.orderType === "dine-in";
            },
        },

        customer: {
            type: customerSchema,
            default: () => ({}),
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "An order must contain at least one item",
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

        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "preparing",
                "ready",
                "completed",
                "cancelled",
            ],
            default: "pending",
        },

        paymentStatus: {
            type: String,
            enum: ["unpaid", "partially_paid", "paid", "refunded"],
            default: "unpaid",
        },

        biller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Delivery orders must have a delivery address.
OrderSchema.pre("validate", function () {
    if (this.orderType === "delivery" && !this.customer?.address?.trim()) {
        this.invalidate(
            "customer.address",
            "Delivery address is required for delivery orders"
        );
    }
});

const OrderModel = model("Order", OrderSchema);

export default OrderModel;
