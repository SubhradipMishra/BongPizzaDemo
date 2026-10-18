
import UserModel from "./user.model.js";
import jwt from "jsonwebtoken";
export const CreateUser = async (req, res) => {

    try {

        const { username, phoneNo, email, password } = req.body;
        if (!username || !phoneNo || !password)
            return res.status(500).json({ message: "Please enter all required field value!" });
        const existsUser = await UserModel.findOne({ phoneNo });
        if (existsUser) return res.status(400).json({ message: "User already exist!" });
        const newUser = await UserModel.create({ username, phoneNo, email, password });
        return res.status(200).json({ message: "User created successfully!" });



    }
    catch (err) {
        console.log(`Error in user creation...`, err);
        return res.status(500).json({ message: "Internal server error!" });

    }


}

const generateToken = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        phoneNo: user.phoneNo
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
}

export const Login = async (req, res) => {
    try {
        const { phoneNo, password } = req.body;

        if (!phoneNo || !password)
            return res.status(500).json({ message: "Please enter all required field value!" });
        const existUser = await UserModel.findOne({ phoneNo });
        if (!existUser) return res.status(404).json({ message: "User not found!" });


        if (existUser.password != password) return res.status(401).json({ message: "Invalid password!" });

        const token = generateToken(existUser);
        res.cookie("token", token, {
            httpOnly: true,
            // secure: true,
            // sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.status(200).json({
            message: "User logged in successfully!",
            token,
            user: {
                id: existUser._id,
                username: existUser.username,
                phoneNo: existUser.phoneNo,
                email: existUser.email
            }
        });
    }
    catch (err) {
        console.log(`Error in login ${err.message}`);
        return res.status(500).json({ message: "Internal server error!" });
    }
};

export const GetProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const user = await UserModel.findById(userId).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found!" });
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                phoneNo: user.phoneNo,
                email: user.email
            }
        });
    } catch (err) {
        console.log(`Error in get profile ${err.message}`);
        return res.status(500).json({ success: false, message: "Internal server error!" });
    }
};

export const Logout = async (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
};