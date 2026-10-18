
import mongoose, { Schema } from "mongoose";


const MenuSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        lowercase: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    price: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const MenuModel = mongoose.model("Menu", MenuSchema)

export default MenuModel; 