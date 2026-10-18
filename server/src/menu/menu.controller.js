

import MenuModel from "./menu.model.js";


export const CreateMenu = async (req, res) => {
    try {
        const { name, description, price, category, isAvailable = true } = req.body;
        if (!name || price === undefined || !category) return res.status(400).json({ message: "All fields are required" });

        const menu = await MenuModel.create({
            name,
            description,
            price: Number(price),
            category,
            isAvailable: Boolean(isAvailable)
        });

        return res.status(200).json({ success: true, data: menu });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in creating menu ${err.message}` });
    }
};

export const getFullMenu = async (req, res) => {
    try {
        const menu = await MenuModel.find().populate("category");
        return res.status(200).json({ success: true, data: menu });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in fetching menu ${err.message}` });
    }
};

export const updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, isAvailable } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (category !== undefined) updateData.category = category;
        if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);

        const menu = await MenuModel.findByIdAndUpdate(id, updateData, { new: true }).populate("category");
        if (!menu) {
            return res.status(404).json({ message: "No Menu found" });
        }
        return res.status(200).json({ data: menu, message: "Menu item updated successfully!" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in updating menu ${err.message}` });
    }
};


export const deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await MenuModel.findByIdAndDelete(id);
        if (!menu) {
            return res.status(404).json({ message: "No Menu found" })
        }
        return res.status(200).json({ message: "Menu item deleted successfully." });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in deleting menu ${err.message}` })
    }
}

export const getMenuByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const menu = await MenuModel.find({ category });
        if (!menu) {
            return res.status(404).json({ message: "No Menu found" })
        }
        return res.status(200).json({ data: menu });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in fetching menu ${err.message}` })
    }
}

export const getSpecificMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await MenuModel.findById(id);
        if (!menu) {
            return res.status(404).json({ message: "No Menu found" })
        }
        return res.status(200).json({ data: menu });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: `Error in fetching menu ${err.message}` })
    }
}