import TableModel from "./table.model.js";
import TableGroupModel from "../tableGroup/tableGroup.model.js";
import OrderModel from "../order/order.model.js";
import ReceiptModel from "../reciept/reciept.model.js";

export const createTable = async (req, res) => {
    try {
        const { tableNumber, tableGroupId, capacity } = req.body;
        if (!tableNumber || !tableGroupId || !capacity) {
            return res.status(400).json({ message: "All fields are required..." });
        }
        if (typeof capacity !== "number") {
            return res.status(400).json({ message: "Capacity must be a number..." });
        }
        if (capacity <= 0) {
            return res.status(400).json({ message: "Capacity must be greater than 0..." });
        }

        const newTable = await TableModel.create({
            tableNumber,
            tableGroupId,
            capacity,
            status: "available",
        });
        return res.status(200).json({ success: true, message: "Table created successfully...", data: newTable });
    } catch (err) {
        console.log(`Error in table creation ${err}`);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const removeTable = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Table id is required..." });
        const table = await TableModel.findById(id);
        if (!table) return res.status(404).json({ message: "Table not found..." });

        await TableModel.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: "Table deleted successfully..." });
    } catch (err) {
        console.log(`Error in table deletion ${err}`);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const getAvailableTable = async (req, res) => {
    try {
        // Find active dine-in orders that are unpaid
        const activeOrders = await OrderModel.find({
            orderType: "dine-in",
            orderStatus: { $nin: ["completed", "cancelled"] },
            paymentStatus: { $ne: "paid" },
        }).select("tableId");

        const occupiedTableIds = activeOrders
            .map((o) => o.tableId?.toString())
            .filter(Boolean);

        const tables = await TableModel.find({
            status: "available",
            _id: { $nin: occupiedTableIds },
            isActive: true,
        }).populate("tableGroupId", "title description");

        return res.status(200).json({ success: true, data: tables });
    } catch (err) {
        console.log(`Error in fetching available tables ${err}`);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const getAllTable = async (req, res) => {
    try {
        const tables = await TableModel.find().populate("tableGroupId", "title description");

        // Fetch active dine-in orders that are NOT completed, NOT cancelled, and NOT paid
        const activeOrders = await OrderModel.find({
            orderType: "dine-in",
            orderStatus: { $nin: ["completed", "cancelled"] },
            paymentStatus: { $ne: "paid" },
        })
            .populate("biller", "name email")
            .sort({ createdAt: -1 });

        const activeOrderIds = activeOrders.map((o) => o._id);
        const existingReceipts = await ReceiptModel.find({
            orderId: { $in: activeOrderIds },
        }).select("orderId");

        const billedOrderIds = new Set(existingReceipts.map((r) => r.orderId.toString()));

        const orderMap = {};
        for (const ord of activeOrders) {
            if (ord.tableId) {
                const tblIdStr = ord.tableId.toString();
                if (!orderMap[tblIdStr]) {
                    orderMap[tblIdStr] = ord;
                }
            }
        }

        const tablesWithStatus = await Promise.all(
            tables.map(async (tbl) => {
                const tblObj = tbl.toObject();
                const activeOrd = orderMap[tbl._id.toString()];

                if (activeOrd) {
                    tblObj.activeOrder = {
                        _id: activeOrd._id,
                        orderNo: activeOrd.orderNo,
                        orderStatus: activeOrd.orderStatus,
                        paymentStatus: activeOrd.paymentStatus,
                        netAmount: activeOrd.netAmount,
                        totalItems: activeOrd.totalItems,
                        items: activeOrd.items,
                        createdAt: activeOrd.createdAt,
                    };

                    // If a receipt exists or order is partially paid, table is BILLED; otherwise OCCUPIED
                    const isBilled =
                        billedOrderIds.has(activeOrd._id.toString()) ||
                        activeOrd.paymentStatus === "partially_paid";

                    const derivedStatus = isBilled ? "billed" : "occupied";

                    tblObj.status = derivedStatus;
                    if (tbl.status !== derivedStatus) {
                        TableModel.findByIdAndUpdate(tbl._id, { status: derivedStatus }).exec();
                    }
                } else {
                    // No active unpaid order on this table
                    if (tbl.status === "occupied" || tbl.status === "billed") {
                        tblObj.status = "available";
                        TableModel.findByIdAndUpdate(tbl._id, { status: "available" }).exec();
                    }
                }

                return tblObj;
            })
        );

        return res.status(200).json({ success: true, data: tablesWithStatus });
    } catch (err) {
        console.log(`Error in fetching all tables ${err}`);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

// MANUALLY UPDATE TABLE STATUS (AVAILABLE, OCCUPIED, BILLED, RESERVED)
export const updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["available", "occupied", "billed", "reserved"];
        if (!status || !allowedStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${allowedStatuses.join(", ")}`,
            });
        }

        const table = await TableModel.findByIdAndUpdate(
            id,
            { status: status.toLowerCase() },
            { new: true }
        ).populate("tableGroupId", "title description");

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Table status updated to ${status}`,
            data: table,
        });
    } catch (err) {
        console.error(`Error updating table status: ${err}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};