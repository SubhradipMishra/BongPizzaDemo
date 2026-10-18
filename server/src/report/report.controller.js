
import OrderModel from "../order/order.model.js";
import PaymentModel from "../payments/payments.model.js";

// HELPER: VALIDATE DATE RANGE
const getDateRange = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return null;
    }

    if (
        (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) ||
        (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
    ) {
        return null;
    }

    if (startDate) start.setHours(0, 0, 0, 0);
    if (endDate) end.setHours(23, 59, 59, 999);

    if (start > end) return null;

    return { start, end };
};

// GET SALES REPORT
export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const range = getDateRange(startDate, endDate);

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range. Use YYYY-MM-DD.",
            });
        }

        const { start, end } = range;

        // Exclude cancelled orders from sales totals
        const salesMatch = {
            createdAt: { $gte: start, $lte: end },
            orderStatus: { $ne: "cancelled" },
        };

        const [
            orderSummary,
            paymentSummary,
            paymentBreakdown,
            bestSellingItems,
        ] = await Promise.all([
            // 1. SALES AND ORDER SUMMARY
            OrderModel.aggregate([
                { $match: salesMatch },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalItems: { $sum: "$totalItems" },
                        grossSubtotal: { $sum: "$subtotal" },
                        totalDiscount: { $sum: "$discount" },
                        totalTax: { $sum: "$taxAmount" },
                        totalSales: { $sum: "$netAmount" },

                        completedOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$orderStatus", "completed"] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        pendingOrders: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            "$orderStatus",
                                            ["pending", "confirmed", "preparing", "ready"],
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        unpaidOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentStatus", "unpaid"] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        partiallyPaidOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentStatus", "partially_paid"] },
                                    1,
                                    0,
                                ],
                            },
                        },

                        paidOrders: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentStatus", "paid"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // 2. COMPLETED PAYMENT COLLECTIONS
            PaymentModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        status: "completed",
                    },
                },
                {
                    $lookup: {
                        from: OrderModel.collection.name,
                        localField: "orderId",
                        foreignField: "_id",
                        as: "order",
                    },
                },
                { $unwind: "$order" },
                {
                    $match: {
                        "order.orderStatus": { $ne: "cancelled" },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCollected: { $sum: "$amount" },
                        transactionCount: { $sum: 1 },
                    },
                },
            ]),

            // 3. COLLECTION BREAKDOWN BY PAYMENT METHOD
            PaymentModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        status: "completed",
                    },
                },
                {
                    $lookup: {
                        from: OrderModel.collection.name,
                        localField: "orderId",
                        foreignField: "_id",
                        as: "order",
                    },
                },
                { $unwind: "$order" },
                {
                    $match: {
                        "order.orderStatus": { $ne: "cancelled" },
                    },
                },
                {
                    $group: {
                        _id: "$method",
                        amount: { $sum: "$amount" },
                        transactions: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        method: "$_id",
                        amount: 1,
                        transactions: 1,
                    },
                },
            ]),

            // 4. BEST-SELLING MENU ITEMS
            OrderModel.aggregate([
                { $match: salesMatch },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.menuItemId",
                        itemName: { $first: "$items.name" },
                        quantitySold: { $sum: "$items.quantity" },
                        salesAmount: { $sum: "$items.itemTotal" },
                    },
                },
                { $sort: { quantitySold: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        menuItemId: "$_id",
                        itemName: 1,
                        quantitySold: 1,
                        salesAmount: 1,
                    },
                },
            ]),
        ]);

        const summary = orderSummary[0] || {
            totalOrders: 0,
            totalItems: 0,
            grossSubtotal: 0,
            totalDiscount: 0,
            totalTax: 0,
            totalSales: 0,
            completedOrders: 0,
            pendingOrders: 0,
            unpaidOrders: 0,
            partiallyPaidOrders: 0,
            paidOrders: 0,
        };

        const collections = paymentSummary[0] || {
            totalCollected: 0,
            transactionCount: 0,
        };

        const money = (value) =>
            Math.round((Number(value) + Number.EPSILON) * 100) / 100;

        return res.status(200).json({
            success: true,
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            data: {
                sales: {
                    totalOrders: summary.totalOrders,
                    totalItems: summary.totalItems,
                    grossSubtotal: money(summary.grossSubtotal),
                    totalDiscount: money(summary.totalDiscount),
                    totalTax: money(summary.totalTax),
                    totalSales: money(summary.totalSales),
                },

                orders: {
                    completed: summary.completedOrders,
                    pending: summary.pendingOrders,
                    unpaid: summary.unpaidOrders,
                    partiallyPaid: summary.partiallyPaidOrders,
                    paid: summary.paidOrders,
                },

                collections: {
                    totalCollected: money(collections.totalCollected),
                    transactionCount: collections.transactionCount,
                    paymentMethods: {
                        cash: 0,
                        upi: 0,
                        card: 0,
                    },
                },

                bestSellingItems,
            },
        });
    } catch (error) {
        console.error("Get sales report error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate sales report",
        });
    }
};

// GET PAYMENT METHOD BREAKDOWN
export const getPaymentBreakdown = async (req, res) => {
    try {
        const range = getDateRange(
            req.query.startDate,
            req.query.endDate
        );

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range. Use YYYY-MM-DD.",
            });
        }

        const payments = await PaymentModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: range.start,
                        $lte: range.end,
                    },
                    status: "completed",
                },
            },
            {
                $lookup: {
                    from: OrderModel.collection.name,
                    localField: "orderId",
                    foreignField: "_id",
                    as: "order",
                },
            },
            { $unwind: "$order" },
            {
                $match: {
                    "order.orderStatus": { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: "$method",
                    totalAmount: { $sum: "$amount" },
                    transactionCount: { $sum: 1 },
                },
            },
        ]);

        const breakdown = {
            cash: { totalAmount: 0, transactionCount: 0 },
            upi: { totalAmount: 0, transactionCount: 0 },
            card: { totalAmount: 0, transactionCount: 0 },
        };

        for (const payment of payments) {
            if (breakdown[payment._id]) {
                breakdown[payment._id] = {
                    totalAmount: Math.round(payment.totalAmount * 100) / 100,
                    transactionCount: payment.transactionCount,
                };
            }
        }

        return res.status(200).json({
            success: true,
            period: {
                startDate: range.start.toISOString(),
                endDate: range.end.toISOString(),
            },
            data: breakdown,
        });
    } catch (error) {
        console.error("Get payment breakdown error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate payment breakdown",
        });
    }
};
