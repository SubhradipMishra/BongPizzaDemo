import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Popconfirm,
  Tooltip,
  Badge,
  Progress,
  Space,
  Empty,
  Skeleton,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingOutlined,
  FireOutlined,
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  ArrowRightOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { orderApi } from "../api/orderApi";
import { tableApi } from "../api/tableApi";
import { formatCurrency, formatTimeOnly } from "../utils/formatters";
import SettleModal from "../components/settlement/SettleModal";
import ReceiptModal from "../components/receipt/ReceiptModal";
import TrainingGuideTabs from "../components/dashboard/TrainingGuideTabs";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "training" ? "training" : "operations";

  const { user } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Settlement & Receipt modals
  const [selectedOrderForSettle, setSelectedOrderForSettle] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        orderApi.getAllOrders(),
        tableApi.getAllTables(),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
      if (tablesRes.data) {
        setTables(tablesRes.data);
      }

      if (isManualRefresh) {
        toast.info("Dashboard refreshed with latest data");
      }
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived statistics
  const activeOrders = useMemo(
    () => orders.filter((o) => o.orderStatus !== "completed" && o.orderStatus !== "cancelled"),
    [orders]
  );

  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === "unpaid" || o.paymentStatus === "partially_paid"),
    [orders]
  );

  const preparingOrders = useMemo(
    () => orders.filter((o) => o.orderStatus === "preparing"),
    [orders]
  );

  const availableTables = useMemo(
    () => tables.filter((t) => t.status === "available" && t.isActive !== false),
    [tables]
  );

  // Today's total sales
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = useMemo(
    () => orders.filter((o) => o.createdAt?.startsWith(today) && o.orderStatus !== "cancelled"),
    [orders, today]
  );

  const todaySales = useMemo(
    () => todayOrders.reduce((sum, o) => sum + (Number(o.netAmount) || 0), 0),
    [todayOrders]
  );

  // Occupancy rate calculation
  const occupancyPercent = useMemo(() => {
    if (tables.length === 0) return 0;
    const occupiedCount = tables.length - availableTables.length;
    return Math.round((occupiedCount / tables.length) * 100);
  }, [tables, availableTables]);

  // Handle Order Cancellation with confirmation
  const handleCancelOrder = async (orderId, orderNo) => {
    setCancellingOrderId(orderId);
    try {
      const res = await orderApi.cancelOrder(orderId);
      if (res.success || res.data) {
        toast.success(`Order ${orderNo} cancelled successfully`);
        loadDashboardData();
      } else {
        throw new Error(res.message || "Failed to cancel order");
      }
    } catch (err) {
      toast.error(err.message || `Failed to cancel order ${orderNo}`);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Ant Design Table Columns for Recent Orders
  const columns = [
    {
      title: "Order No",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (text) => <span className="font-mono font-bold text-slate-900">{text}</span>,
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
          <ClockCircleOutlined />
          {formatTimeOnly(date)}
        </span>
      ),
    },
    {
      title: "Type / Table",
      key: "orderType",
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Tag color={record.orderType === "dine-in" ? "blue" : record.orderType === "pickup" ? "cyan" : "purple"}>
            {record.orderType?.toUpperCase()}
          </Tag>
          {record.tableId && (
            <Tag color="gold" className="font-bold">
              Table {record.tableId.tableNumber || "—"}
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
          <p className="font-semibold text-slate-900 m-0 leading-tight">{customer?.name || "Walk-in"}</p>
          {customer?.phone && <span className="text-xs text-slate-500">{customer.phone}</span>}
        </div>
      ),
    },
    {
      title: "Items / Total",
      key: "amount",
      render: (_, record) => (
        <div>
          <p className="font-bold text-slate-900 m-0">{formatCurrency(record.netAmount)}</p>
          <span className="text-xs text-slate-500">{record.totalItems} items</span>
        </div>
      ),
    },
    {
      title: "Kitchen (KOT)",
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
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => {
        const isPaid = record.paymentStatus === "paid";
        const isCancelled = record.orderStatus === "cancelled";
        const isCompleted = record.orderStatus === "completed";

        return (
          <Space size="small">
            {!isPaid && !isCancelled && (
              <Button
                type="primary"
                size="small"
                danger
                icon={<CreditCardOutlined />}
                onClick={() => setSelectedOrderForSettle(record)}
              >
                Settle
              </Button>
            )}

            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => setSelectedOrderForReceipt(record)}
            >
              Receipt
            </Button>

            {!isCompleted && !isCancelled && (
              <Popconfirm
                title="Cancel Order"
                description={`Are you sure you want to cancel order ${record.orderNo}? This cannot be undone.`}
                okText="Yes, Cancel Order"
                cancelText="No, Keep"
                okButtonProps={{ danger: true, loading: cancellingOrderId === record._id }}
                onConfirm={() => handleCancelOrder(record._id, record.orderNo)}
              >
                <Button size="small" type="text" danger icon={<CloseCircleOutlined />}>
                  Cancel
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Actions & Blended Logo */}
      <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Subtle decorative watermark of logo blended into dashboard */}
        <div className="absolute right-48 -bottom-10 opacity-[0.05] pointer-events-none select-none w-52 h-52">
          <img src="/images/logo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="বং Pizza"
              className="w-full h-full object-contain drop-shadow-xs hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 m-0">
                Welcome back, {user?.name || user?.username || "Biller"}!
              </h1>
              <Badge status="processing" text={<span className="text-xs font-semibold text-emerald-600">POS Online</span>} />
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-0 font-medium">
              {settings?.shopName || "বং Pizza"} (A Touch of Bengal) — Live terminal billing & operations management
            </p>
          </div>
        </div>

        <Space wrap className="relative z-10">
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => loadDashboardData(true)}
            disabled={loading}
          >
            Refresh Data
          </Button>

          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={() => navigate("/pos")}
            className="shadow-xs font-bold"
          >
            Create New Order
          </Button>
        </Space>
      </div>

      {/* Primary Dashboard Mode Switcher */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Space>
          <Button
            type={activeTab === "operations" ? "primary" : "text"}
            danger={activeTab === "operations"}
            icon={<ShoppingOutlined />}
            className="font-bold"
            onClick={() => setSearchParams({})}
          >
            Live Operations
          </Button>

          <Button
            type={activeTab === "training" ? "primary" : "text"}
            danger={activeTab === "training"}
            icon={<BookOutlined />}
            className="font-bold"
            onClick={() => setSearchParams({ tab: "training" })}
          >
            Staff Training & Procedure Guide
            <Tag color="gold" className="ml-1 text-[10px] font-bold uppercase">
              Guide
            </Tag>
          </Button>
        </Space>

        <span className="text-xs text-slate-500 px-3 hidden md:inline">
          {activeTab === "training"
            ? "Step-by-step interactive staff onboarding & rules"
            : "Real-time kitchen stream, sales metrics & floor occupancy"}
        </span>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "training" ? (
        <TrainingGuideTabs />
      ) : (
        <>
          {/* Executive Stat Cards */}
          <div>
            <h2 className="sr-only">Executive Sales and Operations Overview</h2>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Card className="rounded-xl border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                  <Statistic
                    title={<span className="text-xs font-medium text-slate-500">Today's Total Sales</span>}
                    value={todaySales}
                    precision={2}
                    prefix={<DollarCircleOutlined className="text-emerald-600 text-lg mr-1" />}
                    formatter={(val) => formatCurrency(val)}
                    valueStyle={{ fontWeight: 800, color: "#0f172a" }}
                  />
                  <div className="mt-2 text-xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                    <span>{todayOrders.length} orders today</span>
                    <Link to="/reports" className="!text-[#D62828] hover:underline font-semibold flex items-center">
                      Reports <ArrowRightOutlined className="ml-1 text-[10px]" />
                    </Link>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} lg={6}>
                <Card className="rounded-xl border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                  <Statistic
                    title={<span className="text-xs font-medium text-slate-500">Live Active Orders</span>}
                    value={activeOrders.length}
                    prefix={<ShoppingOutlined className="text-[#D62828] text-lg mr-1" />}
                    valueStyle={{ fontWeight: 800, color: "#D62828" }}
                  />
                  <div className="mt-2 text-xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                    <span>{unpaidOrders.length} pending payment</span>
                    <Link to="/live-orders" className="!text-[#D62828] hover:underline font-semibold flex items-center">
                      Live Stream <ArrowRightOutlined className="ml-1 text-[10px]" />
                    </Link>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} lg={6}>
                <Card className="rounded-xl border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                  <Statistic
                    title={<span className="text-xs font-medium text-slate-500">Cooking In Kitchen</span>}
                    value={preparingOrders.length}
                    prefix={<FireOutlined className="text-amber-600 text-lg mr-1" />}
                    valueStyle={{ fontWeight: 800, color: "#d97706" }}
                  />
                  <div className="mt-2 text-xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                    <span>KOT Tickets active</span>
                    <Link to="/kot" className="!text-amber-600 hover:underline font-semibold flex items-center">
                      KDS Board <ArrowRightOutlined className="ml-1 text-[10px]" />
                    </Link>
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} lg={6}>
                <Card className="rounded-xl border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                  <Statistic
                    title={<span className="text-xs font-medium text-slate-500">Dining Floor Occupancy</span>}
                    value={`${availableTables.length} / ${tables.length}`}
                    prefix={<AppstoreOutlined className="text-slate-600 text-lg mr-1" />}
                    valueStyle={{ fontWeight: 800, color: "#0f172a" }}
                  />
                  <Progress percent={occupancyPercent} size="small" strokeColor="#16a34a" className="mt-2 mb-0" />
                  <div className="mt-2 text-xs text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                    <span>{occupancyPercent}% seated</span>
                    <Link to="/tables" className="!text-emerald-600 hover:underline font-semibold flex items-center">
                      Floor Plan <ArrowRightOutlined className="ml-1 text-[10px]" />
                    </Link>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Quick Action Cards Section with Proper Heading Hierarchy */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Quick POS Actions</h2>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate("/pos")}
                  className="rounded-xl border-slate-200 bg-white cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D62828] flex items-center justify-center font-bold text-lg">
                      <PlusOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 m-0">Billing POS</h3>
                      <p className="text-xs text-slate-500 m-0">Punch dine-in & takeaway</p>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate("/live-orders")}
                  className="rounded-xl border-slate-200 bg-white cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                      <CreditCardOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 m-0">Settle Bills</h3>
                      <p className="text-xs text-slate-500 m-0">{unpaidOrders.length} orders pending</p>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate("/kot")}
                  className="rounded-xl border-slate-200 bg-white cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
                      <FireOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 m-0">Kitchen KOT</h3>
                      <p className="text-xs text-slate-500 m-0">Manage prep tickets</p>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate("/tables")}
                  className="rounded-xl border-slate-200 bg-white cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      <AppstoreOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 m-0">Floor & Tables</h3>
                      <p className="text-xs text-slate-500 m-0">{availableTables.length} tables vacant</p>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Recent Orders Stream - Ant Design Table */}
          <Card
            className="rounded-xl border-slate-200 shadow-xs overflow-hidden"
            title={
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <ShoppingOutlined className="text-[#D62828] text-base" />
                  <h2 className="font-bold text-base text-slate-900 m-0">Recent Live Orders</h2>
                  <Tag color="red" className="font-bold ml-1">
                    {orders.slice(0, 10).length}
                  </Tag>
                </div>

                <Link to="/orders" className="text-xs font-semibold text-[#D62828] hover:underline flex items-center">
                  Full History <ArrowRightOutlined className="ml-1 text-[10px]" />
                </Link>
              </div>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : orders.length === 0 ? (
              <Empty
                description="No customer orders recorded yet"
                className="py-10"
              >
                <Button type="primary" danger icon={<PlusOutlined />} onClick={() => navigate("/pos")}>
                  Start First Order
                </Button>
              </Empty>
            ) : (
              <Table
                dataSource={orders.slice(0, 8)}
                columns={columns}
                rowKey="_id"
                pagination={false}
                size="middle"
                className="ant-table-striped"
              />
            )}
          </Card>
        </>
      )}

      {/* Settlement Modal */}
      {selectedOrderForSettle && (
        <SettleModal
          order={selectedOrderForSettle}
          onClose={() => setSelectedOrderForSettle(null)}
          onSuccess={() => {
            setSelectedOrderForSettle(null);
            toast.success("Bill settled successfully!");
            loadDashboardData();
          }}
        />
      )}

      {/* Receipt Preview Modal */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
