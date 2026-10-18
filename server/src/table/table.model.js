
import { Schema, model } from "mongoose";

const TableSchema = new Schema({
    tableNumber: {
        type: String,
        required: true,
        trim: true
    },
    tableGroupId: {
        type: Schema.Types.ObjectId,
        ref: "TableGroup",
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ["available", "occupied", "billed", "reserved"],
        default: "available",
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

const TableModel = model("Table", TableSchema);
export default TableModel;