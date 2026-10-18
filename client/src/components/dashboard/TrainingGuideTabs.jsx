import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Layers,
  HelpCircle,
  Sparkles,
  Receipt,
  UtensilsCrossed,
  CreditCard,
  Grid,
  ChefHat,
  ArrowRight,
  Clock,
  Printer,
  ShieldCheck,
  Split,
  MousePointerClick,
  Info,
} from "lucide-react";

export const TrainingGuideTabs = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Full Operational Flow", icon: Layers, badge: "Start Here" },
    { id: "tables", label: "Floor & Tables", icon: Grid },
    { id: "ordering", label: "Order Punching", icon: UtensilsCrossed },
    { id: "kitchen", label: "Kitchen (KOT)", icon: ChefHat },
    { id: "receipts", label: "Receipts & Print", icon: Receipt },
    { id: "payments", label: "Settlement & Split", icon: CreditCard, highlight: true },
    { id: "rules", label: "System Rules & FAQs", icon: HelpCircle },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#FFFDF8] via-white to-[#FEF2F2] border-b border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-xl bg-[#D62828] text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg md:text-xl font-black text-[#222222]">
                  Staff Training & Workflow Guide
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFC928]/30 text-[#92400E]">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Step-by-step operating procedures for cashiers, waitstaff, and floor managers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/pos"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <span>Practice in POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-5 pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#D62828] text-white shadow-xs"
                    : "bg-[#FAFAFA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#D62828]"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                      isActive ? "bg-white text-[#D62828]" : "bg-[#FFC928] text-[#92400E]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border border-[#FFC928]/40 p-4 rounded-xl flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
              <div className="text-xs text-[#92400E] leading-relaxed">
                <p className="font-bold mb-1">Standard Restaurant Dining Order Procedure</p>
                Every order follows an automated lifecycle from guest arrival to table sanitization.
                Watch how table status and payment tracking change automatically without manual overrides.
              </div>
            </div>

            {/* 6 Step Progression Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  1
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Guest Arrival & Seating</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Table is currently <strong className="text-emerald-700">Available (Green)</strong>.
                  Staff seats the guest and selects the table on the Floor Plan.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-[#D62828] flex items-center justify-between">
                  <span>Table Status: Available</span>
                  <Link to="/tables" className="hover:underline flex items-center">
                    Floor Plan <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  2
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Order Punching (POS)</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Waitstaff adds pizzas, drinks, and combos. Upon clicking <strong>Create Order</strong>,
                  the table automatically transitions to <strong className="text-amber-700">Occupied</strong>.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-amber-700 flex items-center justify-between">
                  <span>Auto Table: Occupied</span>
                  <Link to="/pos" className="hover:underline flex items-center">
                    New Order <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  3
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Kitchen KOT Preparation</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Tickets show up in real-time on the Kitchen Display. Chefs move items through
                  <span className="font-semibold text-yellow-700"> Pending</span> &rarr;
                  <span className="font-semibold text-blue-700"> Preparing</span> &rarr;
                  <span className="font-semibold text-green-700"> Ready</span>.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-blue-700 flex items-center justify-between">
                  <span>KOT Stream: Live</span>
                  <Link to="/kot" className="hover:underline flex items-center">
                    KOT Screen <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  4
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Billing & Receipt Preview</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Guest asks for the bill. Cashier hits <strong>Receipt</strong>. System creates thermal
                  snapshot and automatically marks table as <strong className="text-yellow-700">Billed</strong>.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-yellow-700 flex items-center justify-between">
                  <span>Auto Table: Billed</span>
                  <Link to="/receipts" className="hover:underline flex items-center">
                    Receipts <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  5
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Settlement & Split Payment</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Guest pays via Cash, UPI, Card, or splits tender using <strong>Part Payment</strong>.
                  Receipt reconciles automatically to <strong>PAID</strong> with zero balance due.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-green-700 flex items-center justify-between">
                  <span>Reconciled: Paid</span>
                  <Link to="/live-orders" className="hover:underline flex items-center">
                    Settle Bills <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D62828] transition-colors relative">
                <span className="w-6 h-6 rounded-full bg-[#D62828] text-white text-xs font-black flex items-center justify-center mb-2">
                  6
                </span>
                <h3 className="font-bold text-sm text-[#222222]">Table Released & Available</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Once payment is complete, the table is automatically freed and turns
                  <strong className="text-emerald-700"> Available (Green)</strong>, ready for new guests.
                </p>
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
                  <span>Auto Table: Available</span>
                  <Link to="/tables" className="hover:underline flex items-center">
                    View Tables <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLOOR & TABLES */}
        {activeTab === "tables" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#222222] flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-[#D62828]" />
                  <span>Table Status Definitions & Color Codes</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start space-x-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Available (Green)</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Clean and vacant. Click to start a new dine-in order directly for this table.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start space-x-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Occupied (Amber/Orange)</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Guests seated, dining, or order is cooking in kitchen.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-yellow-200 bg-yellow-50/50 flex items-start space-x-3">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-yellow-900">Billed (Yellow)</p>
                      <p className="text-[11px] text-yellow-700 mt-0.5">
                        Guest requested the check; receipt preview or print has been triggered.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start space-x-3">
                    <span className="w-3 h-3 rounded-full bg-purple-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-purple-900">Reserved (Purple)</p>
                      <p className="text-[11px] text-purple-700 mt-0.5">
                        Table held in advance for party or VIP reservations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[#222222] flex items-center space-x-2">
                  <MousePointerClick className="w-4 h-4 text-[#D62828]" />
                  <span>Floor Plan Shortcuts & Gestures</span>
                </h3>

                <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-4 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#222222]">
                      <span className="font-bold">Double-Click Table:</span> Immediately opens the order
                      details modal or billing screen for that specific table.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#222222]">
                      <span className="font-bold">Single Click Available Table:</span> Starts new order flow
                      with this table pre-selected.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#222222]">
                      <span className="font-bold">Automated Re-seating:</span> When an order is settled or
                      cancelled, tables automatically return to <strong>Available</strong> without needing
                      manual table edits.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/tables"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#D62828] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#b91c1c] transition-colors"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Open Live Floor Plan</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER PUNCHING */}
        {activeTab === "ordering" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D62828]">Type 1</span>
                <h4 className="font-black text-sm text-[#222222] mt-1">Dine-In Orders</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Requires selecting an available table. Triggers table status to <strong>Occupied</strong> and
                  routes KOT items with table number to the kitchen.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D62828]">Type 2</span>
                <h4 className="font-black text-sm text-[#222222] mt-1">Pickup / Takeaway</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Customer walks in or calls for pickup. Does not reserve floor tables. Requires customer name
                  and mobile number for pickup notification.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D62828]">Type 3</span>
                <h4 className="font-black text-sm text-[#222222] mt-1">Home Delivery</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Requires delivery address, contact person, and phone number. Calculates delivery fee and GST
                  automatically.
                </p>
              </div>
            </div>

            <div className="bg-[#FFFDF8] border border-[#FFC928]/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-[#92400E] mb-2">POS Tips for Faster Billing:</h4>
              <ul className="text-xs text-[#92400E] space-y-1 list-disc list-inside">
                <li>Use the category filters (Pizza, Beverages, Sides) or quick search bar.</li>
                <li>Tap `+` or `-` to alter quantities; item total recalculates automatically with GST.</li>
                <li>Apply flat ₹ or percentage % discounts; net bill total adjusts dynamically.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: KITCHEN KOT */}
        {activeTab === "kitchen" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <div>
                <h4 className="text-sm font-bold text-[#222222]">Kitchen Display System (KDS)</h4>
                <p className="text-xs text-[#6B7280]">
                  Real-time synchronization between billing terminal and kitchen staff.
                </p>
              </div>
              <Link
                to="/kot"
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#9A3412] text-white text-xs font-bold rounded-lg hover:bg-[#7c2d12] transition-colors"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Open KOT View</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50">
                <span className="text-xs font-black text-yellow-800">1. PENDING</span>
                <p className="text-[11px] text-yellow-700 mt-1">New order just placed by biller.</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                <span className="text-xs font-black text-blue-800">2. PREPARING</span>
                <p className="text-[11px] text-blue-700 mt-1">Chef has accepted & started cooking.</p>
              </div>

              <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                <span className="text-xs font-black text-green-800">3. READY</span>
                <p className="text-[11px] text-green-700 mt-1">Plated and waiting for runner pick-up.</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-xs font-black text-gray-800">4. COMPLETED</span>
                <p className="text-[11px] text-gray-700 mt-1">Food delivered to the guest table.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RECEIPTS & PRINT */}
        {activeTab === "receipts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#222222] flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-[#D62828]" />
                  <span>Thermal Paper Formats</span>
                </h4>
                <div className="space-y-2 text-xs text-[#6B7280]">
                  <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white">
                    <p className="font-bold text-[#222222]">58mm (Small Thermal Roll)</p>
                    <p className="text-[11px] text-[#6B7280]">Compact format for small thermal receipt printers.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white">
                    <p className="font-bold text-[#222222]">80mm (Standard POS Thermal Roll)</p>
                    <p className="text-[11px] text-[#6B7280]">Standard wide thermal format with full item details and tax summary.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white">
                    <p className="font-bold text-[#222222]">A4 Format</p>
                    <p className="text-[11px] text-[#6B7280]">Standard desktop printer sheet for catering or corporate orders.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#222222] flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-[#D62828]" />
                  <span>Pre-Bill vs Paid Receipt</span>
                </h4>
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2 text-xs">
                  <p className="text-[#222222]">
                    <strong>Pre-Bill (Check Presentation):</strong> Printed when the guest asks for the bill.
                    Shows <em>Grand Total</em> with payment status marked <em>UNPAID</em> and table status set to <em>BILLED</em>.
                  </p>
                  <p className="text-[#222222] pt-2 border-t border-[#E5E7EB]">
                    <strong>Final Paid Receipt:</strong> Printed or viewed after the cashier records payment.
                    Reconciles automatically to show <strong>PAID</strong>, tender methods used (Cash/Card/UPI), and <strong>Balance Due: ₹0.00</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTLEMENT & SPLIT */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800">
                <p className="font-bold mb-1">Automated Reconciliation Active</p>
                Payments immediately update both the order and receipt records. Tables are automatically
                freed as soon as the total paid amount meets the order total.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-[#D62828]" />
                  <h4 className="font-bold text-sm text-[#222222]">Single Tender Settlement</h4>
                </div>
                <p className="text-xs text-[#6B7280]">
                  When customer pays using one mode:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">Cash</span>
                  <span className="px-2.5 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">UPI / QR</span>
                  <span className="px-2.5 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">Card (Debit/Credit)</span>
                  <span className="px-2.5 py-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg">Due / Credit</span>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Click <strong>Settle Bill</strong> &rarr; Select Method &rarr; Submit. Order marks <em>Paid</em> and table becomes <em>Available</em>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
                <div className="flex items-center space-x-2">
                  <Split className="w-4 h-4 text-[#D62828]" />
                  <h4 className="font-bold text-sm text-[#222222]">Part / Split Payments</h4>
                </div>
                <p className="text-xs text-[#6B7280]">
                  When guests divide the bill or pay partially with multiple methods:
                </p>
                <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[11px] font-mono text-[#222222] space-y-1">
                  <div>Split 1: Cash = ₹500.00</div>
                  <div>Split 2: UPI = ₹881.80</div>
                  <div className="text-emerald-700 font-bold border-t border-gray-200 pt-1">
                    Total Settled: ₹1,381.80 (0 Due)
                  </div>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Select <strong>Part Payment</strong> in the settlement modal, input amounts, and submit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: RULES & FAQS */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
              <h4 className="text-xs font-bold text-[#222222] flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-[#D62828]" />
                <span>Q: Why did a receipt previously show "UNPAID" when the order was paid?</span>
              </h4>
              <p className="text-xs text-[#6B7280] mt-1 pl-5">
                A receipt snapshot is often created <em>before</em> payment (when printing the check for guests).
                The system now features <strong>dynamic payment reconciliation</strong>: whenever a receipt is opened or
                printed, it synchronizes with real-time payment records to display <strong>PAID</strong> with zero balance due.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
              <h4 className="text-xs font-bold text-[#222222] flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-[#D62828]" />
                <span>Q: How do tables transition back to Available?</span>
              </h4>
              <p className="text-xs text-[#6B7280] mt-1 pl-5">
                Table release is 100% automated upon full settlement. Once an order is fully paid or cancelled, the system verifies
                that no other active orders exist on that table and automatically sets the status back to <strong>Available</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white">
              <h4 className="text-xs font-bold text-[#222222] flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-[#D62828]" />
                <span>Q: Can a completed or paid order be cancelled?</span>
              </h4>
              <p className="text-xs text-[#6B7280] mt-1 pl-5">
                Orders with payment status <strong>paid</strong> require an approved refund workflow before cancellation
                to maintain financial accounting integrity.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingGuideTabs;
