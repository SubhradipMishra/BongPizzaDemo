import { Schema, model } from "mongoose";

const TableGroupSchema = new Schema({
    title: {
        required: true,
        trim: true,
        type: String,
        lowercase: true

    },
    noOfTables: {
        type: Number,
        required: true,
        min: 1,

    },
    description: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""

    }

}, { timestamps: true });

const TableGroupModel = model("TableGroup", TableGroupSchema);
export default TableGroupModel;