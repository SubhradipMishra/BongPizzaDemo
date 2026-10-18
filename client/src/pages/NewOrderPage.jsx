import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addItem,
  removeItem,
  updateItemQuantity,
  setOrderType,
  setTable,
  setCustomer,
  setDiscount,
  clearCart,
} from "../store/slices/cartSlice";
import { menuApi } from "../api/menuApi";
import { tableApi } from "../api/tableApi";
import { orderApi } from "../api/orderApi";
import { kotApi } from "../api/kotApi";
import { paymentApi } from "../api/paymentApi";
import { calculateOrderTotals } from "../utils/taxCalculations";
import { formatCurrency } from "../utils/formatters";
import SettleModal from "../components/settlement/SettleModal";
import ReceiptModal from "../components/receipt/ReceiptModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Truck,
  Grid,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChefHat,
  Receipt,
  CreditCard,
  X,
} from "lucide-react";

export const NewOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get("tableId");
  const queryTableNumber = searchParams.get("tableNumber");

  const cart = useSelector((state) => state.cart);
  const { settings } = useSelector((state) => state.settings);

  // Local component states
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableGroups, setTableGroups] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Modals & submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [activeSettleOrder, setActiveSettleOrder] = useState(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);

  // Payment method options (Cash, Card, UPI, Due, Other, Part)
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPaidChecked, setIsPaidChecked] = useState(false);
  const [partAmount, setPartAmount] = useState("");

  // Load menu, categories, and tables
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingMenu(true);
      try {
        const [menuRes, catRes, tablesRes, tgRes] = await Promise.all([
          menuApi.getFullMenu(),
          menuApi.getCategories(),
          tableApi.getAllTables(),
          tableApi.getTableGroups(),
        ]);

        if (menuRes.data) setMenuItems(menuRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (tablesRes.data) setTables(tablesRes.data);
        if (tgRes.data) setTableGroups(tgRes.data);
      } catch (err) {
        console.error("Error loading POS initial data:", err);
      } finally {
        setLoadingMenu(false);
      }
    };

    loadInitialData();
  }, []);

  // Pre-select table if passed via URL parameters (e.g. from Table Management double-click)
  useEffect(() => {
    if (queryTableId) {
      dispatch(setOrderType("dine-in"));
      dispatch(
        setTable({
          tableId: queryTableId,
          tableNumber: queryTableNumber || "",
        })
      );
    }
  }, [queryTableId, queryTableNumber, dispatch]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedCategory === "all") return true;

      const itemCatId =
        typeof item.category === "object" ? item.category?._id : item.category;
      return itemCatId === selectedCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Compute live billing totals using settings
  const billingTotals = useMemo(() => {
    return calculateOrderTotals(cart.items, cart.discount, settings);
  }, [cart.items, cart.discount, settings]);

  // Handle Order Submit with optional post-action: 'save' | 'settle'
  const handleCreateOrder = async (action = "save") => {
    setOrderError("");

    if (cart.items.length === 0) {
      setOrderError("Please add at least one item to the cart.");
      return;
    }

    if (cart.orderType === "dine-in" && !cart.tableId) {
      setOrderError("Please select a dining table for dine-in orders.");
      setIsTableModalOpen(true);
      return;
    }

    if (cart.orderType === "delivery" && !cart.customer.address?.trim()) {
      setOrderError("Delivery address is required for delivery orders.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        orderType: cart.orderType,
        tableId: cart.orderType === "dine-in" ? cart.tableId : null,
        customer: {
          name: cart.customer.name.trim(),
          phone: cart.customer.phone.trim(),
          address: cart.customer.address.trim(),
        },
        items: cart.items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
        discount: billingTotals.discount,
        taxAmount: billingTotals.taxAmount,
      };

      const response = await orderApi.createOrder(payload);

      if (response.success && response.data) {
        const newOrder = response.data;

        // Auto-record payment if Mark as Paid is checked or Part payment has an amount
        if (isPaidChecked || (paymentMethod === "part" && Number(partAmount) > 0)) {
          try {
            const payAmt =
              paymentMethod === "part" && Number(partAmount) > 0
                ? Number(partAmount)
                : billingTotals.netAmount;

            await paymentApi.createPayment({
              orderId: newOrder._id,
              method: paymentMethod,
              amount: payAmt,
              transactionReference:
                paymentMethod === "part"
                  ? `Part payment of ₹${payAmt}`
                  : `POS ${paymentMethod.toUpperCase()} Settlement`,
            });
          } catch (payErr) {
            console.warn("Direct payment recording note:", payErr);
          }
        }

        // Clear cart only after confirmed server creation
        dispatch(clearCart());
        setPartAmount("");

        if (action === "settle" || paymentMethod === "part") {
          setActiveSettleOrder(newOrder);
        } else {
          setCreatedOrder(newOrder);
        }
      } else {
        throw new Error(response.message || "Failed to create order");
      }
    } catch (err) {
      setOrderError(err.message || "An error occurred while creating order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick KOT creation from confirmation modal
  const handleQuickKOT = async (orderId) => {
    try {
      if (!createdOrder) return;
      const kotItems = createdOrder.items.map((it) => ({
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        notes: "",
      }));

      await kotApi.createKOT({
        orderId,
        items: kotItems,
        notes: "Direct from POS",
      });

      alert("KOT ticket generated and sent to kitchen successfully!");
    } catch (err) {
      alert(`KOT creation notice: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* LEFT COLUMN: Menu catalog & selection */}
      <div className="flex-1 w-full space-y-4">
        {/* Step 1: Order Type Switcher & Table Selection */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mr-1">
              Order Type:
            </span>
            <button
              onClick={() => dispatch(setOrderType("dine-in"))}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                cart.orderType === "dine-in"
                  ? "bg-[#D62828] text-white"
                  : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-[#FFFDF8]"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>

            <button
              onClick={() => dispatch(setOrderType("pickup"))}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                cart.orderType === "pickup"
                  ? "bg-[#D62828] text-white"
                  : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-[#FFFDF8]"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway / Pickup</span>
            </button>

            <button
              onClick={() => dispatch(setOrderType("delivery"))}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                cart.orderType === "delivery"
                  ? "bg-[#D62828] text-white"
                  : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-[#FFFDF8]"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
          </div>

          {/* Dine-In Table Picker Trigger */}
          {cart.orderType === "dine-in" && (
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FFC928] text-[#222222] hover:bg-[#eab308] transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-[#D62828]" />
              <span>
                {cart.tableNumber ? `Selected Table: ${cart.tableNumber}` : "Select Table *"}
              </span>
            </button>
          )}
        </div>

        {/* Step 3: Customer Details Form */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={cart.customer.name}
                onChange={(e) => dispatch(setCustomer({ name: e.target.value }))}
                placeholder="e.g. Rahul Sen"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                maxLength={10}
                value={cart.customer.phone}
                onChange={(e) =>
                  dispatch(
                    setCustomer({ phone: e.target.value.replace(/\D/g, "") })
                  )
                }
                placeholder="e.g. 9830012345"
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            {cart.orderType === "delivery" && (
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-semibold text-[#D62828] mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={cart.customer.address}
                  onChange={(e) =>
                    dispatch(setCustomer({ address: e.target.value }))
                  }
                  placeholder="Street / Flat / Landmark"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#FECACA] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D62828]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizza, sides, drinks by name or description..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC928]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 ${
                selectedCategory === "all"
                  ? "bg-[#222222] text-white"
                  : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 ${
                  selectedCategory === cat._id
                    ? "bg-[#D62828] text-white"
                    : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loadingMenu ? (
          <div className="bg-white p-12 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading menu catalog...
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
            No menu items found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredMenuItems.map((item) => {
              const inCart = cart.items.find((i) => i.menuItemId === item._id);
              const isAvailable = item.isAvailable !== false;

              return (
                <div
                  key={item._id}
                  className={`bg-white p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isAvailable
                      ? inCart
                        ? "border-[#D62828] ring-1 ring-[#D62828] shadow-xs"
                        : "border-[#E5E7EB] hover:border-[#FFC928] shadow-xs"
                      : "opacity-60 border-dashed border-gray-300 bg-gray-50"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-[#222222] capitalize leading-snug">
                        {item.name}
                      </h4>
                      <span className="font-black text-sm text-[#222222] shrink-0">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isAvailable
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isAvailable ? "Available" : "Sold Out"}
                    </span>

                    {isAvailable && (
                      <div>
                        {inCart ? (
                          <div className="flex items-center space-x-1.5 bg-[#FFFDF8] border border-[#D62828] rounded-lg p-0.5">
                            <button
                              onClick={() =>
                                dispatch(
                                  updateItemQuantity({
                                    menuItemId: item._id,
                                    quantity: inCart.quantity - 1,
                                  })
                                )
                              }
                              className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-[#222222]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-1.5 min-w-[20px] text-center text-[#D62828]">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() =>
                                dispatch(
                                  updateItemQuantity({
                                    menuItemId: item._id,
                                    quantity: inCart.quantity + 1,
                                  })
                                )
                              }
                              className="w-6 h-6 rounded flex items-center justify-center bg-[#D62828] text-white hover:bg-[#b91c1c]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => dispatch(addItem(item))}
                            className="inline-flex items-center space-x-1 bg-[#FFC928] hover:bg-[#eab308] text-[#222222] text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Shopping Cart & Billing Panel */}
      <div className="w-full lg:w-96 shrink-0 bg-white rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sticky top-20">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA] rounded-t-xl">
          <div>
            <h3 className="font-extrabold text-base text-[#222222]">Order Cart</h3>
            <p className="text-[11px] text-[#6B7280]">
              {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          {cart.items.length > 0 && (
            <button
              onClick={() => dispatch(clearCart())}
              className="text-[11px] font-semibold text-[#D62828] hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Selected Items List */}
        <div className="p-4 flex-1 overflow-y-auto max-h-[380px] divide-y divide-gray-100">
          {cart.items.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-500">Cart is empty</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Click "Add" on any pizza or item from the catalog
              </p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.menuItemId} className="py-2.5 flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-xs font-bold text-[#222222] capitalize leading-snug">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {formatCurrency(item.price)} × {item.quantity} ={" "}
                    <span className="font-bold text-[#222222]">
                      {formatCurrency(item.itemTotal)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="flex items-center border border-[#E5E7EB] rounded-md">
                    <button
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                      className="p-1 text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold px-2">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateItemQuantity({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      className="p-1 text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => dispatch(removeItem(item.menuItemId))}
                    className="p-1 text-gray-400 hover:text-[#D62828]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FFFDF8] space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between text-[#6B7280]">
            <span>Items Subtotal:</span>
            <span className="font-bold text-[#222222]">
              {formatCurrency(billingTotals.subtotal)}
            </span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#6B7280]">Discount (₹):</span>
            <input
              type="number"
              min="0"
              max={billingTotals.subtotal}
              value={cart.discount || ""}
              onChange={(e) => dispatch(setDiscount(e.target.value))}
              placeholder="0"
              className="w-24 text-right px-2 py-1 bg-white border border-[#E5E7EB] rounded text-xs font-bold"
            />
          </div>

          {/* Tax line */}
          {settings.taxEnabled ? (
            <div className="space-y-1 pt-1 border-t border-dashed border-gray-200">
              <div className="flex justify-between text-[11px] text-[#6B7280]">
                <span>CGST ({settings.cgstRate}%):</span>
                <span>{formatCurrency(billingTotals.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#6B7280]">
                <span>SGST ({settings.sgstRate}%):</span>
                <span>{formatCurrency(billingTotals.sgstAmount)}</span>
              </div>
              {settings.pricesIncludeTax && (
                <p className="text-[10px] text-gray-400 italic">
                  * Prices are tax-inclusive
                </p>
              )}
            </div>
          ) : (
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Taxes:</span>
              <span>Disabled</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-[#E5E7EB]">
            <span className="font-black text-sm text-[#222222]">Net Total:</span>
            <span className="font-black text-xl text-[#D62828]">
              {formatCurrency(billingTotals.netAmount)}
            </span>
          </div>

          {/* Error Message */}
          {orderError && (
            <div className="mt-2 p-2 rounded bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-1.5 text-[11px] text-[#991B1B]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{orderError}</span>
            </div>
          )}

          {/* PetPooja Style Quick Payment Method Bar */}
          <div className="pt-2.5 border-t border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                Payment Option:
              </span>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-[#166534]">
                <input
                  type="checkbox"
                  checked={isPaidChecked}
                  onChange={(e) => setIsPaidChecked(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#16A34A] rounded focus:ring-0 cursor-pointer"
                />
                <span>It's Paid</span>
              </label>
            </div>

            <div className="grid grid-cols-6 gap-1.5 text-center">
              {[
                { id: "cash", label: "Cash" },
                { id: "card", label: "Card" },
                { id: "upi", label: "UPI" },
                { id: "due", label: "Due" },
                { id: "other", label: "Other" },
                { id: "part", label: "Part" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-1 px-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer ${
                    paymentMethod === m.id
                      ? m.id === "part"
                        ? "bg-[#FEF3C7] border-[#D97706] text-[#B45309] ring-1 ring-[#D97706]"
                        : "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828]"
                      : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* If Part Payment selected, show quick partial amount input */}
            {paymentMethod === "part" && (
              <div className="p-2 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#92400E]">
                    Part Payment Amount (₹):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPartAmount((billingTotals.netAmount / 2).toFixed(2))
                    }
                    className="text-[10px] text-amber-800 underline font-bold"
                  >
                    50% (₹{(billingTotals.netAmount / 2).toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={billingTotals.netAmount}
                  value={partAmount}
                  onChange={(e) => setPartAmount(e.target.value)}
                  placeholder={`e.g. ${(billingTotals.netAmount / 2).toFixed(2)}`}
                  className="w-full px-2 py-1 text-xs font-bold bg-white border border-[#FDE68A] rounded focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleCreateOrder("save")}
              disabled={isSubmitting || cart.items.length === 0}
              className="py-2.5 bg-[#222222] hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Order</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleCreateOrder("settle")}
              disabled={isSubmitting || cart.items.length === 0}
              className="py-2.5 bg-[#D62828] hover:bg-[#b91c1c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Save & Settle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dine-In Table Selector Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-[#E5E7EB] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-extrabold text-[#222222]">
                  Select Dine-In Table
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Choose an available dining table for this order
                </p>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tables Grid */}
            <div className="py-4 max-h-[400px] overflow-y-auto space-y-4">
              {tableGroups.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  No table groups found. You can manage tables in the Tables tab.
                </div>
              ) : (
                tableGroups.map((group) => {
                  const groupTables = tables.filter(
                    (t) =>
                      (typeof t.tableGroupId === "object"
                        ? t.tableGroupId?._id
                        : t.tableGroupId) === group._id
                  );

                  return (
                    <div key={group._id} className="space-y-2">
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                        {group.title}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {groupTables.map((tbl) => {
                          const isSelected = cart.tableId === tbl._id;
                          const st = (tbl.status || "available").toLowerCase();

                          let cardStyle =
                            "bg-white hover:border-[#FFC928] text-[#222222] border-[#E5E7EB]";
                          let statusBadge =
                            "text-[#166534] bg-[#DCFCE7] border border-[#BBF7D0]";
                          let statusText = "Available";

                          if (st === "occupied") {
                            cardStyle =
                              "bg-[#FFFBEB] hover:border-amber-400 text-amber-950 border-amber-300";
                            statusBadge =
                              "text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A]";
                            statusText = "Occupied";
                          } else if (st === "billed") {
                            cardStyle =
                              "bg-[#F5F3FF] hover:border-purple-400 text-purple-950 border-purple-300";
                            statusBadge =
                              "text-[#5B21B6] bg-[#EDE9FE] border border-[#DDD6FE]";
                            statusText = "Billed";
                          } else if (st === "reserved") {
                            cardStyle =
                              "bg-[#F0F9FF] hover:border-sky-400 text-sky-950 border-sky-300";
                            statusBadge =
                              "text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD]";
                            statusText = "Reserved";
                          }

                          if (isSelected) {
                            cardStyle =
                              "bg-[#D62828] text-white border-[#D62828] ring-2 ring-[#D62828]/30";
                            statusBadge = "text-white bg-black/20";
                          }

                          return (
                            <button
                              key={tbl._id}
                              type="button"
                              onClick={() => {
                                dispatch(
                                  setTable({
                                    tableId: tbl._id,
                                    tableNumber: tbl.tableNumber,
                                  })
                                );
                                setIsTableModalOpen(false);
                              }}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${cardStyle}`}
                            >
                              <p className="text-sm font-black">{tbl.tableNumber}</p>
                              <p className="text-[10px] mt-0.5 opacity-80">
                                {tbl.capacity} Seats
                              </p>
                              <span
                                className={`inline-block text-[8px] font-black uppercase mt-1 px-1.5 py-0.5 rounded ${statusBadge}`}
                              >
                                {statusText}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-bold rounded-lg text-[#222222]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Created Success Modal */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#DCFCE7] text-[#166534] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#222222]">
                Order Created Successfully!
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 font-mono font-bold">
                Order No: <span className="text-[#D62828]">{createdOrder.orderNo}</span>
              </p>
            </div>

            <div className="bg-[#FFFDF8] p-4 rounded-xl border border-[#E5E7EB] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Type:</span>
                <span className="font-bold capitalize">{createdOrder.orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Items:</span>
                <span className="font-bold">{createdOrder.totalItems} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Net Amount:</span>
                <span className="font-black text-sm text-[#D62828]">
                  {formatCurrency(createdOrder.netAmount)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handleQuickKOT(createdOrder._id)}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-[#FFEDD5] hover:bg-[#fed7aa] text-[#9A3412] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Send KOT</span>
              </button>

              <button
                onClick={() => {
                  const ord = createdOrder;
                  setCreatedOrder(null);
                  setActiveSettleOrder(ord);
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Settle Order</span>
              </button>

              <button
                onClick={() => {
                  const ord = createdOrder;
                  setCreatedOrder(null);
                  setActiveReceiptOrder(ord);
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#222222] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => setCreatedOrder(null)}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#FFC928] hover:bg-[#eab308] text-[#222222] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>Next Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {activeSettleOrder && (
        <SettleModal
          order={activeSettleOrder}
          onClose={() => setActiveSettleOrder(null)}
          onSuccess={() => {
            setActiveSettleOrder(null);
            navigate("/live-orders");
          }}
        />
      )}

      {/* Receipt Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default NewOrderPage;
