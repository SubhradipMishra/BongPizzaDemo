
import mongoose from "mongoose";
import PaymentModel from "./payments.model.js";
import OrderModel from "../order/order.model.js";
import TableModel from "../table/table.model.js";
import ReceiptModel from "../reciept/reciept.model.js";

// CREATE PAYMENT
export const createPayment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { orderId, method, amount, transactionReference, splits } = req.body;

        // 1. Basic manual validation
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID is required",
            });
        }

        const allowedMethods = ["cash", "upi", "card", "due", "other", "part"];

        // Determine payment items: either multiple splits or single payment
        let paymentEntries = [];

        if (Array.isArray(splits) && splits.length > 0) {
            for (const sp of splits) {
                const spMethod = (sp.method || "cash").toLowerCase();
                if (!allowedMethods.includes(spMethod)) {
                    return res.status(400).json({
                        success: false,
                        message: `Payment method ${spMethod} is not supported. Allowed: ${allowedMethods.join(", ")}`,
                    });
                }
                const spAmt = Number(sp.amount);
                if (Number.isFinite(spAmt) && spAmt > 0) {
                    paymentEntries.push({
                        method: spMethod,
                        amount: Math.round(spAmt * 100) / 100,
                        transactionReference: sp.transactionReference || "",
                    });
                }
            }
            if (paymentEntries.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one split payment with amount > 0 is required",
                });
            }
        } else {
            const payMethod = (method || "cash").toLowerCase();
            if (!allowedMethods.includes(payMethod)) {
                return res.status(400).json({
                    success: false,
                    message: `Payment method must be one of: ${allowedMethods.join(", ")}`,
                });
            }

            const paymentAmount = Number(amount);
            if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Payment amount must be greater than zero",
                });
            }

            paymentEntries.push({
                method: payMethod,
                amount: Math.round(paymentAmount * 100) / 100,
                transactionReference: transactionReference || "",
            });
        }

        const totalBatchAmount = paymentEntries.reduce((sum, p) => sum + p.amount, 0);
        const roundedBatchAmount = Math.round(totalBatchAmount * 100) / 100;

        // Get biller from authentication middleware
        const receivedBy = req.user?._id || req.user?.id;

        if (!receivedBy) {
            return res.status(401).json({
                success: false,
                message: "Authenticated biller not found",
            });
        }

        let createdPayments = [];
        let updatedOrder;

        const processPayment = async (sess) => {
            const query = OrderModel.findById(orderId);
            if (sess) query.session(sess);
            const order = await query;

            if (!order) {
                const error = new Error("Order not found");
                error.statusCode = 404;
                throw error;
            }

            if (order.orderStatus === "cancelled") {
                const error = new Error("Cannot accept payment for a cancelled order");
                error.statusCode = 400;
                throw error;
            }

            const orderTotal = Number(order.netAmount);

            if (!Number.isFinite(orderTotal) || orderTotal < 0) {
                const error = new Error("Invalid order total");
                error.statusCode = 400;
                throw error;
            }

            // Calculate previously received payments
            const payQuery = PaymentModel.find({
                orderId,
                status: "completed",
            });
            if (sess) payQuery.session(sess);
            const previousPayments = await payQuery;

            const paidAmount = previousPayments.reduce(
                (total, payment) => total + Number(payment.amount),
                0
            );

            const outstandingAmount =
                Math.round((orderTotal - paidAmount) * 100) / 100;

            if (outstandingAmount <= 0) {
                const error = new Error("This order is already fully paid");
                error.statusCode = 400;
                throw error;
            }

            if (roundedBatchAmount > outstandingAmount) {
                const error = new Error(
                    `Payment (₹${roundedBatchAmount.toFixed(2)}) exceeds outstanding balance of ₹${outstandingAmount.toFixed(2)}`
                );
                error.statusCode = 400;
                throw error;
            }

            // Create payment record(s)
            const createOptions = sess ? { session: sess } : {};
            const paymentDocs = paymentEntries.map((p) => ({
                orderId,
                method: p.method,
                amount: p.amount,
                transactionReference: p.transactionReference,
                receivedBy,
                status: "completed",
            }));

            createdPayments = await PaymentModel.create(paymentDocs, createOptions);

            // Update order payment status
            const totalPaid =
                Math.round((paidAmount + roundedBatchAmount) * 100) / 100;

            if (totalPaid >= orderTotal) {
                order.paymentStatus = "paid";
                // Procedure move forward: when fully paid, if dine-in, free table to available
                if (order.tableId) {
                    await TableModel.findByIdAndUpdate(order.tableId, { status: "available" });
                }
            } else if (totalPaid > 0) {
                order.paymentStatus = "partially_paid";
                // Procedure move forward: when partially paid, table status is billed
                if (order.tableId) {
                    await TableModel.findByIdAndUpdate(order.tableId, { status: "billed" });
                }
            } else {
                order.paymentStatus = "unpaid";
            }

            if (sess) {
                await order.save({ session: sess });
            } else {
                await order.save();
            }
            updatedOrder = order;

            // Synchronize existing Receipt snapshot if one exists for this order
            try {
                const existingReceipt = await ReceiptModel.findOne({ orderId: order._id });
                if (existingReceipt) {
                    const allPayments = await PaymentModel.find({
                        orderId: order._id,
                        status: "completed",
                    }).sort({ createdAt: 1 });

                    const totalAmountPaid = Math.round(
                        allPayments.reduce((acc, p) => acc + Number(p.amount), 0) * 100
                    ) / 100;
                    const netAmt = Number(existingReceipt.netAmount);
                    const balDue = Math.max(0, Math.round((netAmt - totalAmountPaid) * 100) / 100);

                    existingReceipt.amountPaid = totalAmountPaid;
                    existingReceipt.balanceDue = balDue;
                    existingReceipt.paymentStatus =
                        totalAmountPaid >= netAmt && netAmt > 0
                            ? "paid"
                            : totalAmountPaid > 0
                            ? "partially_paid"
                            : "unpaid";
                    existingReceipt.payments = allPayments.map((p) => ({
                        method: p.method,
                        amount: Number(p.amount),
                    }));

                    if (sess) {
                        await existingReceipt.save({ session: sess });
                    } else {
                        await existingReceipt.save();
                    }
                }
            } catch (recErr) {
                console.error("Failed to sync receipt after payment:", recErr);
            }
        };

        // Try transaction, fallback to direct execution on standalone MongoDB
        try {
            await session.withTransaction(async () => {
                await processPayment(session);
            });
        } catch (transErr) {
            if (
                transErr.code === 20 ||
                transErr.message?.includes("replica set") ||
                transErr.errmsg?.includes("replica set")
            ) {
                await processPayment(null);
            } else {
                throw transErr;
            }
        }

        return res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: {
                payment: createdPayments[0],
                payments: createdPayments,
                order: {
                    _id: updatedOrder._id,
                    orderNo: updatedOrder.orderNo,
                    netAmount: updatedOrder.netAmount,
                    paymentStatus: updatedOrder.paymentStatus,
                },
            },
        });
    } catch (error) {
        console.error("Create payment error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to record payment",
        });
    } finally {
        await session.endSession();
    }
};

// GET PAYMENTS FOR AN ORDER
export const getPaymentsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID is required",
            });
        }

        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const payments = await PaymentModel.find({
            orderId,
        })
            .populate("receivedBy", "name email")
            .sort({ createdAt: -1 });

        const paidAmount = payments
            .filter((payment) => payment.status === "completed")
            .reduce((total, payment) => total + Number(payment.amount), 0);

        const outstandingAmount = Math.max(
            0,
            Math.round((Number(order.netAmount) - paidAmount) * 100) / 100
        );

        return res.status(200).json({
            success: true,
            data: {
                payments,
                totalAmount: order.netAmount,
                paidAmount: Math.round(paidAmount * 100) / 100,
                outstandingAmount,
                paymentStatus: order.paymentStatus,
            },
        });
    } catch (error) {
        console.error("Get payments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
        });
    }
};
