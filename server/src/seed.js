import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import CategoryModel from "./category/category.model.js";
import MenuModel from "./menu/menu.model.js";
import TableGroupModel from "./tableGroup/tableGroup.model.js";
import TableModel from "./table/table.model.js";
import SettingsModel from "./settings/settings.model.js";

async function seed() {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to DB for seeding...");

    // 1. Settings
    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create({
            shopName: "BongPizza Restaurant & Cafe",
            address: "12/A Park Street, Kolkata, West Bengal - 700016",
            phone: "+91 98765 43210",
            email: "support@bongpizza.com",
            gstNumber: "19ABCDE1234F1Z5",
            taxEnabled: true,
            pricesIncludeTax: false,
            cgstRate: 2.5,
            sgstRate: 2.5,
            receiptFooter: "Thank you for dining at BongPizza! Visit again.",
            receiptPaperSize: "80mm",
            showGstNumberOnReceipt: true,
            autoPrintReceipt: false,
            autoPrintKOT: false
        });
        console.log("Settings created.");
    } else {
        settings.taxEnabled = true;
        settings.cgstRate = 2.5;
        settings.sgstRate = 2.5;
        await settings.save();
        console.log("Settings updated with tax.");
    }

    // 2. Categories
    const categoriesCount = await CategoryModel.countDocuments();
    if (categoriesCount === 0) {
        const catPizza = await CategoryModel.create({ name: "pizzas" });
        const catSides = await CategoryModel.create({ name: "sides & starters" });
        const catBeverages = await CategoryModel.create({ name: "beverages" });
        const catDesserts = await CategoryModel.create({ name: "desserts" });

        // 3. Menu items
        await MenuModel.create([
            {
                name: "Margherita Supreme",
                description: "Classic tomato basil sauce, fresh buffalo mozzarella, virgin olive oil",
                price: 249,
                category: catPizza._id,
                isAvailable: true
            },
            {
                name: "Bong Special Chicken Keema Pizza",
                description: "Spiced Kolkata-style chicken keema, crunchy capsicum, red onions, cheese blend",
                price: 389,
                category: catPizza._id,
                isAvailable: true
            },
            {
                name: "Paneer Tikka Fusion Pizza",
                description: "Tandoori marinated cottage cheese, charred bell peppers, mint mayo drizzle",
                price: 329,
                category: catPizza._id,
                isAvailable: true
            },
            {
                name: "Bengali Kasundi Mustard Pizza",
                description: "Authentic kasundi marinated mushroom and corn with melted mozzarella",
                price: 319,
                category: catPizza._id,
                isAvailable: true
            },
            {
                name: "Smoky BBQ Pepperoni Pizza",
                description: "Smoked spicy chicken sausage, jalapeños, BBQ glaze, mozzarella",
                price: 419,
                category: catPizza._id,
                isAvailable: true
            },
            {
                name: "Cheesy Garlic Breadsticks",
                description: "Freshly baked artisan bread with roasted garlic butter and herbs",
                price: 149,
                category: catSides._id,
                isAvailable: true
            },
            {
                name: "Peri Peri Crispy Fries",
                description: "Crispy skin-on french fries tossed with spicy African peri peri blend",
                price: 129,
                category: catSides._id,
                isAvailable: true
            },
            {
                name: "Chicken Wings - Sweet Chili",
                description: "Juicy golden fried wings glazed in sweet Bengali chili relish",
                price: 249,
                category: catSides._id,
                isAvailable: true
            },
            {
                name: "Cold Brew Frappe",
                description: "Rich roasted coffee blended with creamy chilled milk and cocoa",
                price: 119,
                category: catBeverages._id,
                isAvailable: true
            },
            {
                name: "Kolkata Gondhoraj Masala Lemonade",
                description: "Fresh fragrant Gondhoraj lime juice with black salt and crushed ice",
                price: 79,
                category: catBeverages._id,
                isAvailable: true
            },
            {
                name: "Dark Chocolate Lava Cake",
                description: "Warm molten Belgian chocolate cake dusted with powdered sugar",
                price: 159,
                category: catDesserts._id,
                isAvailable: true
            }
        ]);
        console.log("Categories and menu items created.");
    }

    // 4. Table Groups and Tables
    const tgCount = await TableGroupModel.countDocuments();
    if (tgCount === 0) {
        const tgGround = await TableGroupModel.create({
            title: "Ground Floor Dining",
            noOfTables: 6,
            description: "Main dining hall with central air conditioning"
        });

        const tgBalcony = await TableGroupModel.create({
            title: "First Floor Terrace",
            noOfTables: 4,
            description: "Open air terrace with garden view"
        });

        const tablesData = [
            { tableNumber: "T-01", tableGroupId: tgGround._id, capacity: 2, status: "available", isActive: true },
            { tableNumber: "T-02", tableGroupId: tgGround._id, capacity: 4, status: "available", isActive: true },
            { tableNumber: "T-03", tableGroupId: tgGround._id, capacity: 4, status: "available", isActive: true },
            { tableNumber: "T-04", tableGroupId: tgGround._id, capacity: 6, status: "available", isActive: true },
            { tableNumber: "T-05", tableGroupId: tgGround._id, capacity: 2, status: "available", isActive: true },
            { tableNumber: "T-06", tableGroupId: tgGround._id, capacity: 8, status: "available", isActive: true },
            { tableNumber: "T-07", tableGroupId: tgBalcony._id, capacity: 2, status: "available", isActive: true },
            { tableNumber: "T-08", tableGroupId: tgBalcony._id, capacity: 4, status: "available", isActive: true },
            { tableNumber: "T-09", tableGroupId: tgBalcony._id, capacity: 4, status: "available", isActive: true },
            { tableNumber: "T-10", tableGroupId: tgBalcony._id, capacity: 6, status: "available", isActive: true },
        ];

        await TableModel.insertMany(tablesData);
        console.log("Table groups and tables created.");
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
});
