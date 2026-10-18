import jwt from "jsonwebtoken";

export const UserGaurd = (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization) {
            const parts = req.headers.authorization.split(" ");
            if (parts.length === 2 && (parts[0] === "Bearer" || parts[0] === "bearer")) {
                token = parts[1];
            }
        }
        if (!token && req.headers.cookie) {
            const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
            if (match) token = match[1];
        }

        if (!token) return res.status(401).json({ success: false, message: "Unauthorized! Token missing." });

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    }
    catch (err) {
        console.log(`Error in user gaurd ${err.message}`);
        return res.status(401).json({ success: false, message: "Unauthorized or invalid token!" });
    }
};