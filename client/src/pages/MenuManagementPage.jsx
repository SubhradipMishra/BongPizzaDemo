import React, { useState, useEffect, useCallback, useMemo } from "react";
import { menuApi } from "../api/menuApi";
import { formatCurrency } from "../utils/formatters";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Tag,
} from "lucide-react";

export const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Form states
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [catName, setCatName] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadMenuData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuRes, catRes] = await Promise.all([
        menuApi.getFullMenu(),
        menuApi.getCategories(),
      ]);

      if (menuRes.data) setMenuItems(menuRes.data);
      if (catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !itemCategory) {
          setItemCategory(catRes.data[0]._id);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load menu data");
    } finally {
      setLoading(false);
    }
  }, [itemCategory]);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Open modal for new item
  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemAvailable(true);
    if (categories.length > 0) setItemCategory(categories[0]._id);
    setIsItemModalOpen(true);
  };

  // Open modal for editing item
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description || "");
    setItemPrice(item.price.toString());
    const catId = typeof item.category === "object" ? item.category?._id : item.category;
    setItemCategory(catId || (categories[0]?._id || ""));
    setItemAvailable(item.isAvailable !== false);
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice || !itemCategory) {
      alert("Please fill in item name, price, and category.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: itemName.trim(),
        description: itemDesc.trim(),
        price: Number(itemPrice),
        category: itemCategory,
        isAvailable: itemAvailable,
      };

      if (editingItem) {
        await menuApi.updateMenu(editingItem._id, payload);
      } else {
        await menuApi.createMenu(payload);
      }

      setIsItemModalOpen(false);
      await loadMenuData();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle availability switch
  const handleToggleAvailability = async (item) => {
    try {
      const nextStatus = item.isAvailable === false ? true : false;
      await menuApi.updateMenu(item._id, { isAvailable: nextStatus });
      setMenuItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isAvailable: nextStatus } : i))
      );
    } catch (err) {
      alert(`Could not toggle availability: ${err.message}`);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      return;
    }
    try {
      await menuApi.deleteMenu(id);
      await loadMenuData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Save new category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setFormSubmitting(true);
    try {
      await menuApi.createCategory({ name: catName.trim() });
      setCatName("");
      setIsCatModalOpen(false);
      await loadMenuData();
    } catch (err) {
      alert(`Category creation failed: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (selectedCategory === "all") return true;

      const catId = typeof item.category === "object" ? item.category?._id : item.category;
      return catId === selectedCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-[#D62828]" />
            <h1 className="text-xl font-black text-[#222222]">Menu Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]">
              {menuItems.length} Items Listed
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure pizza catalog, starters, beverages, prices, and live stock availability
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#222222] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>+ Category</span>
          </button>

          <button
            onClick={handleOpenNewItem}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#D62828] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center space-x-2 text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Categories Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#222222] text-white"
                  : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
              }`}
            >
              All ({menuItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === c._id
                    ? "bg-[#D62828] text-white"
                    : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#222222] hover:bg-gray-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
            />
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading && menuItems.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FFC928] mb-2" />
            Loading menu catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#6B7280]">
            <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-600">No Menu Items Found</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Add your first dish or try a different search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredItems.map((item) => {
                  const isAvail = item.isAvailable !== false;
                  const catNameDisplay =
                    typeof item.category === "object"
                      ? item.category?.name
                      : categories.find((c) => c._id === item.category)?.name || "—";

                  return (
                    <tr key={item._id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#222222] capitalize">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAFAFA] border border-[#E5E7EB] uppercase">
                          {catNameDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280] max-w-xs truncate">
                        {item.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm text-[#222222]">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            isAvail
                              ? "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]"
                              : "bg-gray-200 text-gray-700 border border-gray-300"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAvail ? "bg-[#16A34A]" : "bg-gray-500"
                            }`}
                          />
                          <span>{isAvail ? "In Stock" : "Out of Stock"}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 bg-[#FAFAFA] hover:bg-gray-200 rounded border border-[#E5E7EB] text-[#222222] transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          className="p-1.5 bg-[#FEF2F2] hover:bg-red-100 rounded border border-[#FECACA] text-[#D62828] transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-extrabold text-[#222222]">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Kolkata Mustard Fish Pizza"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Category *
                </label>
                <select
                  required
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="299.00"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Ingredients, crust type, flavor notes..."
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                  className="w-4 h-4 text-[#D62828] rounded border-gray-300"
                />
                <label htmlFor="availCheck" className="font-semibold text-[#222222]">
                  Item is currently in stock & available for billing
                </label>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#D62828] hover:bg-[#b91c1c] text-white font-bold rounded-lg shadow-xs"
                >
                  {formSubmitting ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E5E7EB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-extrabold text-[#222222]">
                New Category
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#222222] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Pasta & Garlic Breads"
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC928]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-[#D62828] text-white font-bold rounded-lg"
                >
                  {formSubmitting ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;
