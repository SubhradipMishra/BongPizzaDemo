import ExcelJS from "exceljs";
import OrderModel from "../order/order.model.js";
import PaymentModel from "../payments/payments.model.js";
import TableModel from "../table/table.model.js";
import UserModel from "../user/user.model.js";
import { formatISTDateTime, formatISTDate, sanitizeForSpreadsheet } from "../utils/timezone.js";
import { buildCsvString } from "../utils/csvHelper.js";

// Styling constants for ExcelJS
const BRAND_RED = "D62828";
const BRAND_YELLOW = "FFC928";
const BRAND_DARK = "222222";
const LIGHT_BG = "FFF8F8";
const HEADER_FILL = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF" + BRAND_RED },
};
const HEADER_FONT = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
};
const TITLE_FONT = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FF" + BRAND_RED },
};
const BORDER_THIN = {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
};
const INR_FORMAT = '₹#,##0.00';

/**
 * Fetch raw data for the specified date range.
 */
export const fetchExportData = async (range) => {
    const { start, end } = range;

    // 1. Fetch Orders within range (excluding cancelled for revenue aggregations, but including for complete history)
    const orders = await OrderModel.find({
        createdAt: { $gte: start, $lte: end },
    })
        .populate("tableId", "tableNumber")
        .populate("biller", "username")
        .sort({ createdAt: 1 })
        .lean();

    // 2. Fetch Payments within range
    const payments = await PaymentModel.find({
        createdAt: { $gte: start, $lte: end },
    })
        .populate("orderId", "orderNo orderType orderStatus netAmount")
        .populate("receivedBy", "username")
        .sort({ createdAt: 1 })
        .lean();

    return { orders, payments };
};

/**
 * Generate Sales Summary Aggregations matching POS business rules
 */
export const calculateSalesSummary = (orders, payments) => {
    // Exclude cancelled orders from sales totals
    const activeOrders = orders.filter((o) => o.orderStatus !== "cancelled");
    const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled");

    const totalOrders = activeOrders.length;
    let totalItems = 0;
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalSales = 0;

    const ordersCount = {
        completed: 0,
        pending: 0,
        cancelled: cancelledOrders.length,
        paid: 0,
        partiallyPaid: 0,
        unpaid: 0,
    };

    activeOrders.forEach((o) => {
        totalItems += o.totalItems || 0;
        grossSubtotal += o.subtotal || 0;
        totalDiscount += o.discount || 0;
        totalTax += o.taxAmount || 0;
        totalSales += o.netAmount || 0;

        if (o.orderStatus === "completed") ordersCount.completed++;
        else ordersCount.pending++;

        if (o.paymentStatus === "paid") ordersCount.paid++;
        else if (o.paymentStatus === "partially_paid") ordersCount.partiallyPaid++;
        else ordersCount.unpaid++;
    });

    // Completed payments for active orders
    const completedPayments = payments.filter((p) => p.status === "completed");
    let totalCollected = 0;
    const paymentMethods = {
        cash: { amount: 0, count: 0 },
        upi: { amount: 0, count: 0 },
        card: { amount: 0, count: 0 },
        due: { amount: 0, count: 0 },
        other: { amount: 0, count: 0 },
    };

    completedPayments.forEach((p) => {
        totalCollected += p.amount || 0;
        const method = (p.method || "other").toLowerCase();
        if (!paymentMethods[method]) {
            paymentMethods[method] = { amount: 0, count: 0 };
        }
        paymentMethods[method].amount += p.amount || 0;
        paymentMethods[method].count += 1;
    });

    // Best selling items
    const itemMap = {};
    activeOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
            const id = String(item.menuItemId || item.name);
            if (!itemMap[id]) {
                itemMap[id] = { name: item.name, quantity: 0, total: 0 };
            }
            itemMap[id].quantity += item.quantity || 0;
            itemMap[id].total += item.itemTotal || 0;
        });
    });

    const bestSellers = Object.values(itemMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    const balanceDue = Math.max(0, totalSales - totalCollected);

    return {
        totalOrders,
        totalItems,
        grossSubtotal: Math.round(grossSubtotal * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalSales: Math.round(totalSales * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        balanceDue: Math.round(balanceDue * 100) / 100,
        ordersCount,
        paymentMethods,
        bestSellers,
    };
};

/**
 * ─────────────────────────────────────────────────────────────
 * EXCEL GENERATOR: Combined Sales Workbook (.xlsx)
 * Sheets: "Sales Summary", "Orders", "Payments"
 * ─────────────────────────────────────────────────────────────
 */
export const generateCombinedSalesExcel = async (range, orders, payments) => {
    const summary = calculateSalesSummary(orders, payments);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BongPizza POS";
    workbook.created = new Date();

    // ── SHEET 1: Sales Summary ──
    const sheet1 = workbook.addWorksheet("Sales Summary", {
        views: [{ showGridLines: true }],
    });

    // Columns width
    sheet1.columns = [
        { width: 32 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
    ];

    // Header Title
    sheet1.mergeCells("A1:D1");
    sheet1.getCell("A1").value = "বং Pizza POS — Sales Summary Report";
    sheet1.getCell("A1").font = TITLE_FONT;
    sheet1.getCell("A1").alignment = { vertical: "middle" };
    sheet1.getRow(1).height = 30;

    sheet1.getCell("A2").value = `Reporting Period: ${range.startDateStr} to ${range.endDateStr} (Asia/Kolkata IST)`;
    sheet1.getCell("A2").font = { italic: true, color: { argb: "FF6B7280" } };
    sheet1.getCell("A3").value = `Generated At: ${formatISTDateTime(new Date())}`;
    sheet1.getCell("A3").font = { italic: true, color: { argb: "FF6B7280" } };

    // Key Revenue Metrics
    sheet1.getCell("A5").value = "Key Revenue Metrics";
    sheet1.getCell("A5").font = { bold: true, size: 13, color: { argb: "FF" + BRAND_DARK } };

    const metricRows = [
        ["Net Sales (Excl. Cancelled)", summary.totalSales, "Total Completed Orders", summary.ordersCount.completed],
        ["Gross Subtotal", summary.grossSubtotal, "Total Items Sold", summary.totalItems],
        ["Total Discounts", summary.totalDiscount, "Total Orders Placed", summary.totalOrders],
        ["Total Taxes Collected", summary.totalTax, "Pending / In-Kitchen Orders", summary.ordersCount.pending],
        ["Actual Revenue Collected", summary.totalCollected, "Unpaid Orders", summary.ordersCount.unpaid],
        ["Outstanding / Balance Due", summary.balanceDue, "Cancelled Orders", summary.ordersCount.cancelled],
    ];

    let rowCursor = 6;
    metricRows.forEach(([lbl1, val1, lbl2, val2]) => {
        const row = sheet1.getRow(rowCursor);
        row.getCell(1).value = lbl1;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = val1;
        if (typeof val1 === "number" && (lbl1.includes("Sales") || lbl1.includes("Subtotal") || lbl1.includes("Discount") || lbl1.includes("Tax") || lbl1.includes("Collected") || lbl1.includes("Due"))) {
            row.getCell(2).numFmt = INR_FORMAT;
        }

        row.getCell(3).value = lbl2;
        row.getCell(3).font = { bold: true };
        row.getCell(4).value = val2;

        for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = BORDER_THIN;
        }
        rowCursor++;
    });

    // Payment Methods Section
    rowCursor += 2;
    sheet1.getCell(`A${rowCursor}`).value = "Collections by Payment Method";
    sheet1.getCell(`A${rowCursor}`).font = { bold: true, size: 13, color: { argb: "FF" + BRAND_DARK } };
    rowCursor++;

    const payHeader = sheet1.getRow(rowCursor);
    payHeader.values = ["Payment Method", "Amount Collected", "Transaction Count", "% of Collections"];
    payHeader.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    payHeader.height = 24;
    rowCursor++;

    const totalCollected = summary.totalCollected || 1;
    const methodsList = [
        { label: "Cash", data: summary.paymentMethods.cash },
        { label: "UPI", data: summary.paymentMethods.upi },
        { label: "Card", data: summary.paymentMethods.card },
        { label: "Due / Other", data: summary.paymentMethods.due },
    ];

    methodsList.forEach(({ label, data }) => {
        const row = sheet1.getRow(rowCursor);
        const amt = data?.amount || 0;
        const count = data?.count || 0;
        const pct = summary.totalCollected > 0 ? (amt / summary.totalCollected) : 0;

        row.values = [label, amt, count, pct];
        row.getCell(1).font = { bold: true };
        row.getCell(2).numFmt = INR_FORMAT;
        row.getCell(3).alignment = { horizontal: "center" };
        row.getCell(4).numFmt = '0.0%';
        row.getCell(4).alignment = { horizontal: "center" };

        for (let col = 1; col <= 4; col++) {
            row.getCell(col).border = BORDER_THIN;
        }
        rowCursor++;
    });

    // Top Selling Items Section
    rowCursor += 2;
    sheet1.getCell(`A${rowCursor}`).value = "Top Selling Menu Items";
    sheet1.getCell(`A${rowCursor}`).font = { bold: true, size: 13, color: { argb: "FF" + BRAND_DARK } };
    rowCursor++;

    const topHeader = sheet1.getRow(rowCursor);
    topHeader.values = ["Item Name", "Quantity Sold", "Total Revenue (₹)", "Rank"];
    topHeader.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    topHeader.height = 24;
    rowCursor++;

    if (summary.bestSellers.length === 0) {
        const row = sheet1.getRow(rowCursor);
        row.getCell(1).value = "No item sales recorded for this period";
        sheet1.mergeCells(`A${rowCursor}:D${rowCursor}`);
        rowCursor++;
    } else {
        summary.bestSellers.forEach((item, index) => {
            const row = sheet1.getRow(rowCursor);
            row.values = [item.name, item.quantity, item.total, `#${index + 1}`];
            row.getCell(1).font = { bold: true };
            row.getCell(2).alignment = { horizontal: "center" };
            row.getCell(3).numFmt = INR_FORMAT;
            row.getCell(4).alignment = { horizontal: "center" };
            for (let col = 1; col <= 4; col++) {
                row.getCell(col).border = BORDER_THIN;
            }
            rowCursor++;
        });
    }

    // ── SHEET 2: Orders ──
    const sheet2 = workbook.addWorksheet("Orders", {
        views: [{ showGridLines: true }],
    });

    sheet2.columns = [
        { header: "Order No", key: "orderNo", width: 14 },
        { header: "Date & Time (IST)", key: "dateTime", width: 20 },
        { header: "Type", key: "type", width: 12 },
        { header: "Table", key: "table", width: 10 },
        { header: "Customer Name", key: "custName", width: 18 },
        { header: "Customer Phone", key: "custPhone", width: 14 },
        { header: "Items Ordered", key: "itemsSummary", width: 32 },
        { header: "Total Items", key: "totalItems", width: 12 },
        { header: "Subtotal (₹)", key: "subtotal", width: 14 },
        { header: "Discount (₹)", key: "discount", width: 14 },
        { header: "Tax (₹)", key: "tax", width: 12 },
        { header: "Net Amount (₹)", key: "netAmount", width: 16 },
        { header: "Order Status", key: "orderStatus", width: 14 },
        { header: "Payment Status", key: "paymentStatus", width: 16 },
        { header: "Biller", key: "biller", width: 14 },
    ];

    const ordersHeader = sheet2.getRow(1);
    ordersHeader.height = 26;
    ordersHeader.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    orders.forEach((o) => {
        const itemsSummary = (o.items || [])
            .map((i) => `${i.quantity}x ${i.name}`)
            .join(", ");
        const tableNum = o.tableId?.tableNumber || "-";
        const billerName = o.biller?.username || "-";

        const row = sheet2.addRow({
            orderNo: sanitizeForSpreadsheet(o.orderNo),
            dateTime: formatISTDateTime(o.createdAt),
            type: o.orderType,
            table: tableNum,
            custName: sanitizeForSpreadsheet(o.customer?.name || "-"),
            custPhone: sanitizeForSpreadsheet(o.customer?.phone || "-"),
            itemsSummary: sanitizeForSpreadsheet(itemsSummary),
            totalItems: o.totalItems || 0,
            subtotal: o.subtotal || 0,
            discount: o.discount || 0,
            tax: o.taxAmount || 0,
            netAmount: o.netAmount || 0,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            biller: billerName,
        });

        row.getCell("subtotal").numFmt = INR_FORMAT;
        row.getCell("discount").numFmt = INR_FORMAT;
        row.getCell("tax").numFmt = INR_FORMAT;
        row.getCell("netAmount").numFmt = INR_FORMAT;

        row.eachCell((cell) => {
            cell.border = BORDER_THIN;
        });
    });

    // Total row for orders
    if (orders.length > 0) {
        const totalRowIdx = orders.length + 2;
        const totalRow = sheet2.addRow({
            orderNo: "TOTAL",
            totalItems: { formula: `SUM(H2:H${totalRowIdx - 1})` },
            subtotal: { formula: `SUM(I2:I${totalRowIdx - 1})` },
            discount: { formula: `SUM(J2:J${totalRowIdx - 1})` },
            tax: { formula: `SUM(K2:K${totalRowIdx - 1})` },
            netAmount: { formula: `SUM(L2:L${totalRowIdx - 1})` },
        });
        totalRow.font = { bold: true };
        totalRow.getCell("subtotal").numFmt = INR_FORMAT;
        totalRow.getCell("discount").numFmt = INR_FORMAT;
        totalRow.getCell("tax").numFmt = INR_FORMAT;
        totalRow.getCell("netAmount").numFmt = INR_FORMAT;
        totalRow.eachCell((cell) => {
            cell.border = BORDER_THIN;
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" },
            };
        });
    }

    // ── SHEET 3: Payments ──
    const sheet3 = workbook.addWorksheet("Payments", {
        views: [{ showGridLines: true }],
    });

    sheet3.columns = [
        { header: "Payment ID", key: "paymentId", width: 24 },
        { header: "Order No", key: "orderNo", width: 14 },
        { header: "Order Type", key: "orderType", width: 12 },
        { header: "Payment Date (IST)", key: "date", width: 20 },
        { header: "Payment Method", key: "method", width: 16 },
        { header: "Amount (₹)", key: "amount", width: 16 },
        { header: "Txn Reference", key: "reference", width: 20 },
        { header: "Status", key: "status", width: 14 },
        { header: "Received By", key: "receivedBy", width: 16 },
    ];

    const paymentsHeader = sheet3.getRow(1);
    paymentsHeader.height = 26;
    paymentsHeader.eachCell((cell) => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    payments.forEach((p) => {
        const orderNo = p.orderId?.orderNo || "-";
        const orderType = p.orderId?.orderType || "-";
        const billerName = p.receivedBy?.username || "-";

        const row = sheet3.addRow({
            paymentId: sanitizeForSpreadsheet(p._id?.toString() || "-"),
            orderNo: sanitizeForSpreadsheet(orderNo),
            orderType,
            date: formatISTDateTime(p.createdAt),
            method: (p.method || "").toUpperCase(),
            amount: p.amount || 0,
            reference: sanitizeForSpreadsheet(p.transactionReference || "-"),
            status: p.status,
            receivedBy: billerName,
        });

        row.getCell("amount").numFmt = INR_FORMAT;
        row.eachCell((cell) => {
            cell.border = BORDER_THIN;
        });
    });

    // Total row for payments
    if (payments.length > 0) {
        const totalRowIdx = payments.length + 2;
        const totalRow = sheet3.addRow({
            paymentId: "TOTAL",
            amount: { formula: `SUM(F2:F${totalRowIdx - 1})` },
        });
        totalRow.font = { bold: true };
        totalRow.getCell("amount").numFmt = INR_FORMAT;
        totalRow.eachCell((cell) => {
            cell.border = BORDER_THIN;
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF3F4F6" },
            };
        });
    }

    return workbook;
};

/**
 * ─────────────────────────────────────────────────────────────
 * CSV GENERATORS
 * ─────────────────────────────────────────────────────────────
 */

export const generateSalesSummaryCsv = (range, orders, payments) => {
    const summary = calculateSalesSummary(orders, payments);
    const rows = [
        ["বং Pizza POS - Sales Summary Report"],
        [`Reporting Period: ${range.startDateStr} to ${range.endDateStr} (Asia/Kolkata IST)`],
        [`Generated At: ${formatISTDateTime(new Date())}`],
        [],
        ["--- KEY SALES METRICS ---"],
        ["Metric", "Value"],
        ["Total Orders (Excl. Cancelled)", summary.totalOrders],
        ["Total Items Sold", summary.totalItems],
        ["Gross Subtotal (₹)", summary.grossSubtotal.toFixed(2)],
        ["Total Discounts (₹)", summary.totalDiscount.toFixed(2)],
        ["Total Taxes Collected (₹)", summary.totalTax.toFixed(2)],
        ["Net Sales (₹)", summary.totalSales.toFixed(2)],
        ["Actual Revenue Collected (₹)", summary.totalCollected.toFixed(2)],
        ["Outstanding / Balance Due (₹)", summary.balanceDue.toFixed(2)],
        [],
        ["--- ORDERS STATUS BREAKDOWN ---"],
        ["Status", "Count"],
        ["Completed Orders", summary.ordersCount.completed],
        ["Pending / In-Kitchen Orders", summary.ordersCount.pending],
        ["Paid Orders", summary.ordersCount.paid],
        ["Partially Paid Orders", summary.ordersCount.partiallyPaid],
        ["Unpaid Orders", summary.ordersCount.unpaid],
        ["Cancelled Orders", summary.ordersCount.cancelled],
        [],
        ["--- COLLECTIONS BY PAYMENT METHOD ---"],
        ["Payment Method", "Amount Collected (₹)", "Transaction Count"],
        ["Cash", summary.paymentMethods.cash.amount.toFixed(2), summary.paymentMethods.cash.count],
        ["UPI", summary.paymentMethods.upi.amount.toFixed(2), summary.paymentMethods.upi.count],
        ["Card", summary.paymentMethods.card.amount.toFixed(2), summary.paymentMethods.card.count],
        ["Due / Other", summary.paymentMethods.due.amount.toFixed(2), summary.paymentMethods.due.count],
        [],
        ["--- TOP SELLING ITEMS ---"],
        ["Rank", "Item Name", "Quantity Sold", "Total Revenue (₹)"],
    ];

    if (summary.bestSellers.length === 0) {
        rows.push(["-", "No sales recorded", "0", "0.00"]);
    } else {
        summary.bestSellers.forEach((item, idx) => {
            rows.push([idx + 1, item.name, item.quantity, item.total.toFixed(2)]);
        });
    }

    return buildCsvString(rows);
};

export const generateOrdersCsv = (orders) => {
    const rows = [
        [
            "Order No",
            "Date & Time (IST)",
            "Order Type",
            "Table",
            "Customer Name",
            "Customer Phone",
            "Customer Address",
            "Items Ordered",
            "Total Items",
            "Subtotal (₹)",
            "Discount (₹)",
            "Tax (₹)",
            "Net Amount (₹)",
            "Order Status",
            "Payment Status",
            "Biller",
        ],
    ];

    orders.forEach((o) => {
        const itemsStr = (o.items || []).map((i) => `${i.quantity}x ${i.name}`).join("; ");
        rows.push([
            o.orderNo,
            formatISTDateTime(o.createdAt),
            o.orderType,
            o.tableId?.tableNumber || "-",
            o.customer?.name || "-",
            o.customer?.phone || "-",
            o.customer?.address || "-",
            itemsStr,
            o.totalItems || 0,
            (o.subtotal || 0).toFixed(2),
            (o.discount || 0).toFixed(2),
            (o.taxAmount || 0).toFixed(2),
            (o.netAmount || 0).toFixed(2),
            o.orderStatus,
            o.paymentStatus,
            o.biller?.username || "-",
        ]);
    });

    return buildCsvString(rows);
};

export const generatePaymentsCsv = (payments) => {
    const rows = [
        [
            "Payment ID",
            "Order No",
            "Order Type",
            "Date & Time (IST)",
            "Payment Method",
            "Amount (₹)",
            "Transaction Reference",
            "Status",
            "Received By",
        ],
    ];

    payments.forEach((p) => {
        rows.push([
            p._id?.toString() || "-",
            p.orderId?.orderNo || "-",
            p.orderId?.orderType || "-",
            formatISTDateTime(p.createdAt),
            (p.method || "").toUpperCase(),
            (p.amount || 0).toFixed(2),
            p.transactionReference || "-",
            p.status,
            p.receivedBy?.username || "-",
        ]);
    });

    return buildCsvString(rows);
};
