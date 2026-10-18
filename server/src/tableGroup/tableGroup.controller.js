

import TableGroupModel from "./tableGroup.model.js";

export const createTableGroup = async (req, res) => {
    try {
        const { title, noOfTables, description } = req.body;

        if (!title || !noOfTables) return res.status(400).json({ message: "Name and number of tables is required..." })

        if (typeof noOfTables !== "number") return res.status(400).json({ message: "Number of tables must be a number..." })
        if (noOfTables <= 0) return res.status(400).json({ message: "Number of tables must be greater than 0..." })

        const newTableGroup = new TableGroupModel({
            title,
            noOfTables,
            description
        })
        await newTableGroup.save();
        return res.status(200).json({ success: true, message: "Table group created successfully...", data: newTableGroup })
    }
    catch (err) {
        console.log("Issue in category creation...", err);
        return res.status(500).json({ message: `Error in category creation ${err.message}` })
    }
}


export const getAllTableGroup = async (req, res) => {
    try {
        const tableGroup = await TableGroupModel.find();
        return res.status(200).json({ success: true, data: tableGroup });
    }
    catch (err) {
        console.log("Issue in fetching table group...", err);
        return res.status(500).json({ message: `Error in fetching table group... ${err.message}` });
    }
}


export const deleteTableGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Table group id is required..." })

        const tableGroup = await TableGroupModel.findById(id);
        if (!tableGroup) return res.status(404).json({ message: "Table group not found..." });

        await TableGroupModel.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: "Table group deleted successfully..." });
    }
    catch (err) {
        console.log("Issue in deleting table group...", err);
        return res.status(500).json({ message: `Error in deleting table group... ${err.message}` });
    }
}


export const getSingleTableGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "Table group id is required..." })

        const tableGroup = await TableGroupModel.findById(id);
        if (!tableGroup) return res.status(404).json({ message: "Table group not found..." });
        return res.status(200).json({ success: true, data: tableGroup });
    }
    catch (err) {
        console.log("Issue in fetching single table group...", err);
        return res.status(500).json({ message: `Error in fetching single table group... ${err.message}` });
    }
}

export const updateTableGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, noOfTables, description } = req.body;

        if (!id) return res.status(400).json({ message: "Table group id is required..." });

        const tableGroup = await TableGroupModel.findById(id);
        if (!tableGroup) return res.status(404).json({ message: "Table group not found..." });

        if (title) tableGroup.title = title;
        if (noOfTables) tableGroup.noOfTables = noOfTables;
        if (description) tableGroup.description = description;

        await tableGroup.save();
        return res.status(200).json({ success: true, message: "Table group updated successfully...", data: tableGroup });
    }
    catch (err) {
        console.log("Issue in updating table group...", err);
        return res.status(500).json({ message: `Error in updating table group... ${err.message}` });
    }
}