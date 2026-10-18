import OrderModel from "../order/order.model.js";
import PaymentModel from "../payments/payments.model.js";
import { getISTDateRange } from "../utils/timezone.js";
import {
    fetchExportData,
    generateCombinedSalesExcel,
    generateSalesSummaryCsv,
    generateOrdersCsv,
    generatePaymentsCsv,
    calculateSalesSummary,
} from "./export.service.js";

// GET SALES REPORT (Analytics API)
export const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Use IST inclusive date range
        const range = getISTDateRange(startDate, endDate);

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

        // Properly populate payment method breakdown
        const methodCollections = {
            cash: 0,
            upi: 0,
            card: 0,
        };

        (paymentBreakdown || []).forEach((item) => {
            if (item.method && methodCollections[item.method] !== undefined) {
                methodCollections[item.method] = money(item.amount);
            }
        });

        return res.status(200).json({
            success: true,
            period: {
                startDate: range.start.toISOString(),
                endDate: range.end.toISOString(),
                startDateStr: range.startDateStr,
                endDateStr: range.endDateStr,
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
                    paymentMethods: methodCollections,
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
        const range = getISTDateRange(
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
                startDateStr: range.startDateStr,
                endDateStr: range.endDateStr,
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

/**
 * ─────────────────────────────────────────────────────────────
 * EXPORT CONTROLLERS: Excel (.xlsx) and CSV (.csv)
 * ─────────────────────────────────────────────────────────────
 */

// EXPORT COMBINED SALES REPORT
export const exportSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, format = "xlsx" } = req.query;
        const range = getISTDateRange(startDate, endDate);

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range. Use YYYY-MM-DD.",
            });
        }

        const { orders, payments } = await fetchExportData(range);
        const filenameBase = `BongPizza_Sales_Report_${range.startDateStr}_to_${range.endDateStr}`;

        if (format.toLowerCase() === "csv") {
            const csvData = generateSalesSummaryCsv(range, orders, payments);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filenameBase}.csv"`
            );
            return res.status(200).send(csvData);
        }

        // Default to Excel
        const workbook = await generateCombinedSalesExcel(range, orders, payments);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filenameBase}.xlsx"`
        );
        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        console.error("Export sales report error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to export sales report: " + error.message,
        });
    }
};

// EXPORT ORDERS LIST
export const exportOrders = async (req, res) => {
    try {
        const { startDate, endDate, format = "xlsx" } = req.query;
        const range = getISTDateRange(startDate, endDate);

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range. Use YYYY-MM-DD.",
            });
        }

        const { orders } = await fetchExportData(range);
        const filenameBase = `BongPizza_Orders_${range.startDateStr}_to_${range.endDateStr}`;

        if (format.toLowerCase() === "csv") {
            const csvData = generateOrdersCsv(orders);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filenameBase}.csv"`
            );
            return res.status(200).send(csvData);
        }

        // Excel format - Use the orders sheet generator
        const workbook = await generateCombinedSalesExcel(range, orders, []);
        // Retain only Orders worksheet
        const summarySheet = workbook.getWorksheet("Sales Summary");
        const paymentsSheet = workbook.getWorksheet("Payments");
        if (summarySheet) workbook.removeWorksheet(summarySheet.id);
        if (paymentsSheet) workbook.removeWorksheet(paymentsSheet.id);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filenameBase}.xlsx"`
        );
        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        console.error("Export orders error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to export orders: " + error.message,
        });
    }
};

// EXPORT PAYMENTS LIST
export const exportPayments = async (req, res) => {
    try {
        const { startDate, endDate, format = "xlsx" } = req.query;
        const range = getISTDateRange(startDate, endDate);

        if (!range) {
            return res.status(400).json({
                success: false,
                message: "Invalid date range. Use YYYY-MM-DD.",
            });
        }

        const { payments } = await fetchExportData(range);
        const filenameBase = `BongPizza_Payments_${range.startDateStr}_to_${range.endDateStr}`;

        if (format.toLowerCase() === "csv") {
            const csvData = generatePaymentsCsv(payments);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filenameBase}.csv"`
            );
            return res.status(200).send(csvData);
        }

        // Excel format
        const workbook = await generateCombinedSalesExcel(range, [], payments);
        const summarySheet = workbook.getWorksheet("Sales Summary");
        const ordersSheet = workbook.getWorksheet("Orders");
        if (summarySheet) workbook.removeWorksheet(summarySheet.id);
        if (ordersSheet) workbook.removeWorksheet(ordersSheet.id);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filenameBase}.xlsx"`
        );
        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        console.error("Export payments error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to export payments: " + error.message,
        });
    }
};
