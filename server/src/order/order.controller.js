
import mongoose from "mongoose";
import OrderModel from "./order.model.js";
import MenuModel from "../menu/menu.model.js";
import TableModel from "../table/table.model.js";

// Generate a simple order number
const generateOrderNo = () => {
    return `BP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
};

// Create order
export const createOrder = async (req, res) => {
    try {
        const {
            orderType,
            tableId,
            customer,
            items,
            discount = 0,
            taxAmount = 0,
        } = req.body;

        // Validate order type
        if (!["dine-in", "pickup", "delivery"].includes(orderType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order type",
            });
        }

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one menu item is required",
            });
        }

        // Validate discount and tax
        if (
            !Number.isFinite(discount) ||
            discount < 0 ||
            !Number.isFinite(taxAmount) ||
            taxAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount and tax must be non-negative numbers",
            });
        }

        // Validate delivery address
        if (orderType === "delivery" && !customer?.address?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate table for dine-in
        let table = null;

        if (orderType === "dine-in") {
            if (!tableId || !mongoose.isValidObjectId(tableId)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid table is required for dine-in orders",
                });
            }

            table = await TableModel.findById(tableId);

            if (!table || !table.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "Table not found or inactive",
                });
            }

            if (table.status !== "available") {
                return res.status(409).json({
                    success: false,
                    message: "Table is not available",
                });
            }
        }

        // Build order items using trusted menu prices
        const orderItems = [];
        let subtotal = 0;
        let totalItems = 0;

        for (const item of items) {
            if (
                !item.menuItemId ||
                !mongoose.isValidObjectId(item.menuItemId) ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each item needs a valid menuItemId and positive integer quantity",
                });
            }

            const menuItem = await MenuModel.findById(item.menuItemId);

            if (!menuItem || menuItem.isAvailable === false) {
                return res.status(400).json({
                    success: false,
                    message: "A menu item was not found or is unavailable",
                    menuItemId: item.menuItemId,
                });
            }

            const price = menuItem.price;
            const itemTotal = price * item.quantity;

            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price,
                quantity: item.quantity,
                itemTotal,
            });

            subtotal += itemTotal;
            totalItems += item.quantity;
        }

        // Calculate final amount
        if (discount > subtotal) {
            return res.status(400).json({
                success: false,
                message: "Discount cannot exceed subtotal",
            });
        }

        const netAmount = Math.max(0, subtotal - discount + taxAmount);

        // Get biller from authenticated request
        // Adjust req.user._id if your auth middleware uses another property.
        const billerId = req.user?._id || req.user?.id;

        if (!billerId || !mongoose.isValidObjectId(billerId)) {
            return res.status(401).json({
                success: false,
                message: "Authenticated biller not found",
            });
        }

        const order = await OrderModel.create({
            orderNo: generateOrderNo(),
            orderType,
            tableId: orderType === "dine-in" ? tableId : null,
            customer: customer || {},
            items: orderItems,
            totalItems,
            subtotal,
            discount,
            taxAmount,
            netAmount,
            biller: billerId,
        });

        // Procedure move forward: Mark table as occupied when a dine-in order is created
        if (orderType === "dine-in" && tableId) {
            await TableModel.findByIdAndUpdate(tableId, { status: "occupied" });
        }

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create order",
        });
    }
};

// Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.find()
            .populate("tableId", "tableNumber status")
            .populate("biller", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await OrderModel.findById(id)
            .populate("tableId", "tableNumber status")
            .populate("biller", "name email");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "completed",
            "cancelled",
        ];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        const order = await OrderModel.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.orderStatus === "cancelled" || order.orderStatus === "completed") {
            return res.status(409).json({
                success: false,
                message: "Completed or cancelled orders cannot be changed",
            });
        }

        if (orderStatus === "cancelled" && order.paymentStatus === "paid") {
            return res.status(409).json({
                success: false,
                message: "Paid orders require the refund workflow before cancellation",
            });
        }

        order.orderStatus = orderStatus;
        await order.save();

        // Procedure move forward: if order completed or cancelled, release table if no other active orders exist
        if ((orderStatus === "completed" || orderStatus === "cancelled") && order.tableId) {
            const otherActiveOrders = await OrderModel.find({
                tableId: order.tableId,
                _id: { $ne: order._id },
                orderStatus: { $nin: ["completed", "cancelled"] },
            });
            if (otherActiveOrders.length === 0) {
                await TableModel.findByIdAndUpdate(order.tableId, { status: "available" });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order,
        });
    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
        });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await OrderModel.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (["completed", "cancelled"].includes(order.orderStatus)) {
            return res.status(409).json({
                success: false,
                message: "Order is already completed or cancelled",
            });
        }

        if (
            order.paymentStatus === "paid" ||
            order.paymentStatus === "partially_paid"
        ) {
            return res.status(409).json({
                success: false,
                message: "Orders with payments require the refund workflow before cancellation",
            });
        }

        order.orderStatus = "cancelled";
        await order.save();

        // Procedure move forward: release table if cancelled
        if (order.tableId) {
            const otherActiveOrders = await OrderModel.find({
                tableId: order.tableId,
                _id: { $ne: order._id },
                orderStatus: { $nin: ["completed", "cancelled"] },
            });
            if (otherActiveOrders.length === 0) {
                await TableModel.findByIdAndUpdate(order.tableId, { status: "available" });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order,
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    }
};
