import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Input, Select, Tag, Button, Space, Card, Badge, Empty, Skeleton } from "antd";
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  PrinterOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { orderApi } from "../api/orderApi";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import ReceiptModal from "../components/receipt/ReceiptModal";

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState(null);

  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    try {
      const res = await orderApi.getAllOrders();
      if (res.data) {
        setOrders(res.data);
      }
      if (isManualRefresh) {
        toast.info("Order history refreshed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNo?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.tableId?.tableNumber?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (orderStatusFilter !== "all" && o.orderStatus !== orderStatusFilter) {
        return false;
      }

      if (paymentStatusFilter !== "all" && o.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter]);

  const columns = [
    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (text) => <span className="font-mono font-bold text-gray-800">{text}</span>,
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-gray-500 text-xs flex items-center gap-1">
          <ClockCircleOutlined />
          {formatDateTime(date)}
        </span>
      ),
    },
    {
      title: "Type / Table",
      key: "type",
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Tag color={record.orderType === "dine-in" ? "blue" : record.orderType === "pickup" ? "cyan" : "purple"}>
            {record.orderType?.toUpperCase()}
          </Tag>
          {record.tableId && (
            <Tag color="gold" className="font-bold">
              Table {record.tableId.tableNumber}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => (
        <div>
          <p className="font-semibold text-gray-800 m-0">{customer?.name || "Walk-in"}</p>
          {customer?.phone && <span className="text-[11px] text-gray-400">{customer.phone}</span>}
        </div>
      ),
    },
    {
      title: "Items",
      dataIndex: "totalItems",
      key: "totalItems",
      render: (items) => <span className="font-medium text-gray-700">{items} items</span>,
    },
    {
      title: "Net Amount",
      dataIndex: "netAmount",
      key: "netAmount",
      render: (amount) => <span className="font-black text-gray-900">{formatCurrency(amount)}</span>,
    },
    {
      title: "Kitchen",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (status) => {
        let color = "default";
        if (status === "pending") color = "gold";
        if (status === "preparing") color = "processing";
        if (status === "ready") color = "lime";
        if (status === "completed") color = "success";
        if (status === "cancelled") color = "error";
        return <Tag color={color} className="font-semibold capitalize">{status}</Tag>;
      },
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => {
        let color = "error";
        if (status === "paid") color = "success";
        if (status === "partially_paid") color = "warning";
        return <Tag color={color} className="font-bold uppercase">{status?.replace("_", " ")}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Button
          size="small"
          icon={<PrinterOutlined className="text-red-600" />}
          onClick={() => setSelectedOrderReceipt(record)}
        >
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 m-0">Order History & Archives</h1>
            <Badge count={orders.length} overflowCount={9999} style={{ backgroundColor: "#D62828" }} />
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-0">
            Complete historical record of all restaurant orders, kitchen fulfillments, and tender settlements
          </p>
        </div>

        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={() => fetchOrders(true)}
          disabled={loading}
        >
          Refresh History
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-gray-200 shadow-2xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <Space wrap className="w-full md:w-auto">
            <Select
              value={orderStatusFilter}
              onChange={(val) => setOrderStatusFilter(val)}
              className="w-44"
              options={[
                { value: "all", label: "Kitchen: All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "preparing", label: "Preparing" },
                { value: "ready", label: "Ready" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />

            <Select
              value={paymentStatusFilter}
              onChange={(val) => setPaymentStatusFilter(val)}
              className="w-40"
              options={[
                { value: "all", label: "Payment: All" },
                { value: "paid", label: "Paid" },
                { value: "partially_paid", label: "Partially Paid" },
                { value: "unpaid", label: "Unpaid" },
                { value: "refunded", label: "Refunded" },
              ]}
            />
          </Space>

          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search order no, customer, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="w-full md:w-72 rounded-lg"
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border-gray-200 shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : filteredOrders.length === 0 ? (
          <Empty description="No orders matching your search filters" className="py-12" />
        ) : (
          <Table
            dataSource={filteredOrders}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 12, showSizeChanger: true, showTotal: (total) => `Total ${total} orders` }}
            size="middle"
          />
        )}
      </Card>

      {/* Receipt Modal */}
      {selectedOrderReceipt && (
        <ReceiptModal
          order={selectedOrderReceipt}
          onClose={() => setSelectedOrderReceipt(null)}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
