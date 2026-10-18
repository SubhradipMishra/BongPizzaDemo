import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSettings, updateSettingsAction } from "../store/slices/settingsSlice";
import {
  Settings,
  Store,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Percent,
} from "lucide-react";

export const SettingsPage = () => {
  const dispatch = useDispatch();
  const { settings, status, error: reduxError } = useSelector((state) => state.settings);

  // Form states matching backend settings model
  const [shopName, setShopName] = useState(settings?.shopName || "BongPizza");
  const [address, setAddress] = useState(settings?.address || "");
  const [phone, setPhone] = useState(settings?.phone || "");
  const [email, setEmail] = useState(settings?.email || "");
  const [gstNumber, setGstNumber] = useState(settings?.gstNumber || "");

  const [taxEnabled, setTaxEnabled] = useState(Boolean(settings?.taxEnabled));
  const [pricesIncludeTax, setPricesIncludeTax] = useState(Boolean(settings?.pricesIncludeTax));
  const [cgstRate, setCgstRate] = useState(settings?.cgstRate ?? 2.5);
  const [sgstRate, setSgstRate] = useState(settings?.sgstRate ?? 2.5);

  const [receiptFooter, setReceiptFooter] = useState(
    settings?.receiptFooter || "Thank you for visiting BongPizza!"
  );
  const [receiptPaperSize, setReceiptPaperSize] = useState(
    settings?.receiptPaperSize || "80mm"
  );
  const [showGstNumberOnReceipt, setShowGstNumberOnReceipt] = useState(
    settings?.showGstNumberOnReceipt ?? true
  );
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(
    Boolean(settings?.autoPrintReceipt)
  );
  const [autoPrintKOT, setAutoPrintKOT] = useState(
    Boolean(settings?.autoPrintKOT)
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || "BongPizza");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setEmail(settings.email || "");
      setGstNumber(settings.gstNumber || "");
      setTaxEnabled(Boolean(settings.taxEnabled));
      setPricesIncludeTax(Boolean(settings.pricesIncludeTax));
      setCgstRate(settings.cgstRate ?? 2.5);
      setSgstRate(settings.sgstRate ?? 2.5);
      setReceiptFooter(settings.receiptFooter || "Thank you for visiting BongPizza!");
      setReceiptPaperSize(settings.receiptPaperSize || "80mm");
      setShowGstNumberOnReceipt(settings.showGstNumberOnReceipt ?? true);
      setAutoPrintReceipt(Boolean(settings.autoPrintReceipt));
      setAutoPrintKOT(Boolean(settings.autoPrintKOT));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSaveSuccess(false);

    const cgst = Number(cgstRate) || 0;
    const sgst = Number(sgstRate) || 0;

    if (taxEnabled && cgst + sgst > 100) {
      setLocalError("Combined CGST and SGST cannot exceed 100%.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim(),
        taxEnabled: Boolean(taxEnabled),
        pricesIncludeTax: Boolean(pricesIncludeTax),
        cgstRate: cgst,
        sgstRate: sgst,
        receiptFooter: receiptFooter.trim(),
        receiptPaperSize,
        showGstNumberOnReceipt: Boolean(showGstNumberOnReceipt),
        autoPrintReceipt: Boolean(autoPrintReceipt),
        autoPrintKOT: Boolean(autoPrintKOT),
      };

      const result = await dispatch(updateSettingsAction(payload)).unwrap();
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setLocalError(err || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">
              Restaurant & POS Settings
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure restaurant identity, GST tax rules, and receipt printing preferences
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(fetchSettings())}
          className="p-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1"
          title="Reload Settings"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {(localError || reduxError) && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{localError || reduxError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center space-x-2 text-xs text-[#166534]">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>Settings saved and updated successfully across all terminals!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Shop & Restaurant Details */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
            <Store className="w-4 h-4 text-[#D62828]" />
            <h3 className="font-extrabold text-sm text-[#222222]">
              Shop Profile & Business Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@bongpizza.com"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 19ABCDE1234F1Z5"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928] uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#222222] mb-1">
                Full Physical Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, state, pin code..."
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Taxes & GST Configuration */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
            <Percent className="w-4 h-4 text-[#D62828]" />
            <h3 className="font-extrabold text-sm text-[#222222]">
              Tax Configuration (GST / VAT)
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Tax Enabled toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
              <div>
                <p className="font-bold text-[#222222]">Enable Automatic Tax Calculation</p>
                <p className="text-[11px] text-[#6B7280]">
                  Apply CGST and SGST taxes automatically on menu items during billing
                </p>
              </div>
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="w-5 h-5 text-[#D62828] rounded border-gray-300"
              />
            </div>

            {/* Prices Include Tax toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
              <div>
                <p className="font-bold text-[#222222]">Menu Prices Are Tax-Inclusive</p>
                <p className="text-[11px] text-[#6B7280]">
                  If checked, displayed menu prices already contain tax. Otherwise tax is added on top.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pricesIncludeTax}
                onChange={(e) => setPricesIncludeTax(e.target.checked)}
                className="w-5 h-5 text-[#D62828] rounded border-gray-300"
              />
            </div>

            {/* Tax Rates Inputs */}
            {taxEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-[#222222] mb-1">
                    CGST Rate (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    required
                    value={cgstRate}
                    onChange={(e) => setCgstRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Central GST (default 2.5% for restaurants)</p>
                </div>

                <div>
                  <label className="block font-semibold text-[#222222] mb-1">
                    SGST Rate (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    required
                    value={sgstRate}
                    onChange={(e) => setSgstRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-0.5">State GST (default 2.5% for restaurants)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Receipt & Thermal Printing Preferences */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E5E7EB]">
            <Receipt className="w-4 h-4 text-[#D62828]" />
            <h3 className="font-extrabold text-sm text-[#222222]">
              Thermal Receipts & Printing Preferences
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                Default Thermal Paper Roll Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["58mm", "80mm", "A4"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setReceiptPaperSize(sz)}
                    className={`p-3 rounded-xl border font-bold text-center cursor-pointer transition-colors ${
                      receiptPaperSize === sz
                        ? "bg-[#FFFDF8] border-[#D62828] text-[#D62828] ring-1 ring-[#D62828]"
                        : "bg-white border-[#E5E7EB] text-[#222222] hover:bg-gray-50"
                    }`}
                  >
                    {sz} {sz === "80mm" ? "(Standard)" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#222222] mb-1">
                Receipt Footer Greeting
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for visiting BongPizza!"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="showGstCheck"
                checked={showGstNumberOnReceipt}
                onChange={(e) => setShowGstNumberOnReceipt(e.target.checked)}
                className="w-4 h-4 text-[#D62828] rounded border-gray-300"
              />
              <label htmlFor="showGstCheck" className="font-semibold text-[#222222]">
                Display GSTIN number prominently on printed receipt
              </label>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#D62828] hover:bg-[#b91c1c] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
