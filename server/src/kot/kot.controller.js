
import mongoose from "mongoose";
import KOTModel from "./kot.model.js";
import OrderModel from "../order/order.model.js";
import TableModel from "../table/table.model.js";

// CREATE KOT FROM AN EXISTING ORDER
export const createKOT = async (req, res) => {
    try {
        const { orderId, items, notes } = req.body;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID is required",
            });
        }

        const createdBy = req.user?._id || req.user?.id;

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one item is required",
            });
        }

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
                message: "Cannot create KOT for a cancelled order",
            });
        }

        // Validate requested items against the original order
        const orderItems = order.items;

        const kotItems = [];

        for (const item of items) {
            if (
                !item.menuItemId ||
                !mongoose.Types.ObjectId.isValid(item.menuItemId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Valid menu item ID is required for every KOT item",
                });
            }

            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Item quantity must be a positive integer",
                });
            }

            const orderItem = orderItems.find(
                (orderItem) =>
                    orderItem.menuItemId.toString() === item.menuItemId
            );

            if (!orderItem) {
                return res.status(400).json({
                    success: false,
                    message: "KOT item does not belong to this order",
                });
            }

            // Prevent sending more than the ordered quantity
            const requestedTotal = items
                .filter(
                    (entry) =>
                        entry.menuItemId === item.menuItemId
                )
                .reduce(
                    (total, entry) => total + Number(entry.quantity),
                    0
                );

            if (requestedTotal > orderItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `KOT quantity exceeds ordered quantity for ${orderItem.name}`,
                });
            }

            kotItems.push({
                menuItemId: orderItem.menuItemId,
                name: orderItem.name,
                quantity,
                notes: item.notes || "",
            });
        }

        // Retrieve table number for dine-in orders
        let tableNumber = "";

        if (order.tableId) {
            const table = await TableModel.findById(order.tableId);

            if (table) {
                tableNumber = String(table.tableNumber);
            }
        }

        // Generate a unique KOT number
        const kotNo = `KOT-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

        const kot = await KOTModel.create({
            kotNo,
            orderId: order._id,
            orderType: order.orderType,
            tableId: order.tableId || null,
            tableNumber,
            items: kotItems,
            notes: notes || "",
            createdBy,
        });

        return res.status(201).json({
            success: true,
            message: "KOT created successfully",
            data: kot,
        });
    } catch (error) {
        console.error("Create KOT error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create KOT",
        });
    }
};

// GET ALL KOTS (OPTIONAL STATUS FILTER)
export const getAllKOTs = async (req, res) => {
    try {
        const { status } = req.query;

        const allowedStatuses = [
            "pending",
            "preparing",
            "ready",
            "served",
            "cancelled",
        ];

        const filter = {};

        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid KOT status",
                });
            }

            filter.status = status;
        }

        const kots = await KOTModel.find(filter)
            .populate("orderId", "orderNo customer orderType")
            .populate("createdBy", "name email")
            .sort({ time: -1 });

        return res.status(200).json({
            success: true,
            count: kots.length,
            data: kots,
        });
    } catch (error) {
        console.error("Get KOTs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch KOTs",
        });
    }
};

// GET SINGLE KOT
export const getKOTById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid KOT ID is required",
            });
        }

        const kot = await KOTModel.findById(id)
            .populate("orderId", "orderNo customer orderType")
            .populate("createdBy", "name email");

        if (!kot) {
            return res.status(404).json({
                success: false,
                message: "KOT not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: kot,
        });
    } catch (error) {
        console.error("Get KOT error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch KOT",
        });
    }
};

// UPDATE KOT STATUS
export const updateKOTStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Valid KOT ID is required",
            });
        }

        const allowedStatuses = [
            "pending",
            "preparing",
            "ready",
            "served",
            "cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid KOT status",
            });
        }

        const kot = await KOTModel.findById(id);

        if (!kot) {
            return res.status(404).json({
                success: false,
                message: "KOT not found",
            });
        }

        const allowedTransitions = {
            pending: ["preparing", "cancelled"],
            preparing: ["ready", "cancelled"],
            ready: ["served"],
            served: [],
            cancelled: [],
        };

        if (!allowedTransitions[kot.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change KOT status from ${kot.status} to ${status}`,
            });
        }

        kot.status = status;

        if (status === "preparing") {
            kot.time = new Date();
        }

        await kot.save();

        return res.status(200).json({
            success: true,
            message: "KOT status updated successfully",
            data: kot,
        });
    } catch (error) {
        console.error("Update KOT status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update KOT status",
        });
    }
};
