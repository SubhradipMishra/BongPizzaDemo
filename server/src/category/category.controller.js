

import CategoryModel from "./category.model.js";


export const createCategory = async (req, res) => {
    try {

        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Category name is required" })
        const category = await CategoryModel.create({ name });
        return res.status(200).json({ success: true, data: category })

    }
    catch (err) {
        console.log("Issue in category creation...", err);
        return res.status(500).json({ message: `Error in category creation ${err.message}` })
    }
}

export const getCategory = async (req, res) => {
    try {
        const category = await CategoryModel.find();
        return res.status(200).json({ success: true, data: category })
    }
    catch (err) {
        console.log("Issue in fetching category...", err);
        return res.status(500).json({ message: `Error in fetching category... ${err.message}` })
    }
} 