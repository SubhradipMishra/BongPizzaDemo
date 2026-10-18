
import { Schema, model } from "mongoose";


const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    phoneNo: {
        type: String,
        required: true,
        min: [10, "Minimum 10 digit mobile no required."],
        max: [10, "Maximum 10 digit mobile no allowed."],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true })

const UserModel = new model("User", UserSchema);
export default UserModel;