
import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        method: {
            type: String,
            enum: ["cash", "upi", "card", "due", "other", "part"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        transactionReference: {
            type: String,
            trim: true,
            default: "",
        },

        receivedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["completed", "failed", "refunded"],
            default: "completed",
        },
    },
    { timestamps: true }
);

const PaymentModel = model("Payment", paymentSchema);

export default PaymentModel;
