
import mongoose from "mongoose";
import ReceiptModel from "./reciept.model.js";
import OrderModel from "../order/order.model.js";
import PaymentModel from "../payments/payments.model.js";
import TableModel from "../table/table.model.js";

// HELPER TO SYNC RECEIPT WITH LATEST ORDER & PAYMENTS
export const syncReceiptWithPayments = async (receipt) => {
    if (!receipt) return receipt;
    try {
        const orderId = receipt.orderId?._id || receipt.orderId;
        const [order, payments] = await Promise.all([
            OrderModel.findById(orderId),
            PaymentModel.find({ orderId, status: "completed" }).sort({ createdAt: 1 }),
        ]);

        let amountPaid = Math.round(
            payments.reduce((total, p) => total + Number(p.amount), 0) * 100
        ) / 100;

        const netAmount = Number(receipt.netAmount || (order ? order.netAmount : 0));

        // If order itself is marked paid, ensure amountPaid reflects full amount
        if (order?.paymentStatus === "paid" && amountPaid < netAmount) {
            amountPaid = netAmount;
        }

        const balanceDue = Math.max(0, Math.round((netAmount - amountPaid) * 100) / 100);

        let paymentStatus = "unpaid";
        if (order?.paymentStatus === "paid" || (amountPaid >= netAmount && netAmount > 0)) {
            paymentStatus = "paid";
        } else if (order?.paymentStatus === "partially_paid" || amountPaid > 0) {
            paymentStatus = "partially_paid";
        }

        const formattedPayments = payments.map((p) => ({
            method: p.method,
            amount: Number(p.amount),
        }));

        if (paymentStatus === "paid" && formattedPayments.length === 0) {
            formattedPayments.push({
                method: "cash",
                amount: netAmount,
            });
        }

        receipt.amountPaid = amountPaid;
        receipt.balanceDue = balanceDue;
        receipt.paymentStatus = paymentStatus;
        receipt.payments = formattedPayments;

        if (!receipt.tableNumber && order?.tableId) {
            const table = await TableModel.findById(order.tableId);
            if (table) receipt.tableNumber = String(table.tableNumber);
        }

        await receipt.save();
    } catch (err) {
        console.error("Error syncing receipt with payments:", err);
    }
    return receipt;
};

// CREATE RECEIPT
export const createReceipt = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID is required",
            });
        }

        const issuedBy = req.user?._id || req.user?.id;

        if (!issuedBy) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        // Check whether a receipt already exists
        let existingReceipt = await ReceiptModel.findOne({ orderId });

        if (existingReceipt) {
            existingReceipt = await syncReceiptWithPayments(existingReceipt);
            return res.status(200).json({
                success: true,
                message: "Receipt retrieved successfully",
                data: existingReceipt,
            });
        }

        // Find order
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot generate a receipt for a cancelled order",
            });
        }

        if (!order.items || order.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order has no items",
            });
        }

        // Copy order items into receipt snapshot
        const receiptItems = order.items.map((item) => ({
            menuItemId: item.menuItemId || null,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            itemTotal: Number(item.itemTotal),
        }));

        // Find table number for dine-in orders
        let tableNumber = "";

        if (order.tableId) {
            const table = await TableModel.findById(order.tableId);

            if (table) {
                tableNumber = String(table.tableNumber);
            }
        }

        // Find completed payments
        const payments = await PaymentModel.find({
            orderId: order._id,
            status: "completed",
        }).sort({ createdAt: 1 });

        const amountPaid = Math.round(
            payments.reduce((total, payment) => {
                return total + Number(payment.amount);
            }, 0) * 100
        ) / 100;

        const netAmount = Number(order.netAmount);

        const balanceDue = Math.max(
            0,
            Math.round((netAmount - amountPaid) * 100) / 100
        );

        let paymentStatus = "unpaid";

        if (amountPaid >= netAmount) {
            paymentStatus = "paid";
        } else if (amountPaid > 0) {
            paymentStatus = "partially_paid";
        }

        // Generate receipt number
        const receiptNo = `RCP-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

        const receipt = await ReceiptModel.create({
            receiptNo,
            orderId: order._id,
            orderNo: order.orderNo,
            orderType: order.orderType,
            tableNumber,

            customer: {
                name: order.customer?.name || "",
                phone: order.customer?.phone || "",
                address: order.customer?.address || "",
            },

            items: receiptItems,
            totalItems: Number(order.totalItems),
            subtotal: Number(order.subtotal),
            discount: Number(order.discount || 0),
            taxAmount: Number(order.taxAmount || 0),
            netAmount,
            amountPaid,
            balanceDue,
            paymentStatus,

            payments: payments.map((payment) => ({
                method: payment.method,
                amount: Number(payment.amount),
            })),

            issuedBy,
        });

        // Procedure move forward: when receipt / bill is printed for a dine-in order, mark table as billed
        if (order.tableId) {
            await TableModel.findByIdAndUpdate(order.tableId, { status: "billed" });
        }

        return res.status(201).json({
            success: true,
            message: "Receipt generated successfully",
            data: receipt,
        });
    } catch (error) {
        console.error("Create receipt error:", error);

        // Handles duplicate orderId / receiptNo unique index conflicts
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A receipt already exists for this order",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate receipt",
        });
    }
};

// GET ALL RECEIPTS
export const getAllReceipts = async (req, res) => {
    try {
        const receipts = await ReceiptModel.find()
            .populate("orderId", "orderNo orderType")
            .populate("issuedBy", "name email")
            .sort({ issuedAt: -1 });

        return res.status(200).json({
            success: true,
            count: receipts.length,
            data: receipts,
        });
    } catch (error) {
        console.error("Get receipts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch receipts",
        });
    }
};

// GET RECEIPT BY ID
export const getReceiptById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid receipt ID is required",
            });
        }

        let receipt = await ReceiptModel.findById(id)
            .populate("orderId", "orderNo orderType paymentStatus")
            .populate("issuedBy", "name email");

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: "Receipt not found",
            });
        }

        receipt = await syncReceiptWithPayments(receipt);

        return res.status(200).json({
            success: true,
            data: receipt,
        });
    } catch (error) {
        console.error("Get receipt error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch receipt",
        });
    }
};

// GET RECEIPT BY ORDER ID
export const getReceiptByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID is required",
            });
        }

        let receipt = await ReceiptModel.findOne({ orderId })
            .populate("orderId", "orderNo orderType paymentStatus")
            .populate("issuedBy", "name email");

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: "Receipt not found for this order",
            });
        }

        receipt = await syncReceiptWithPayments(receipt);

        return res.status(200).json({
            success: true,
            data: receipt,
        });
    } catch (error) {
        console.error("Get receipt by order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch receipt",
        });
    }
};
