const jwt = require("jsonwebtoken");
const JWT_SECRET = "123"; // Nên thay bằng process.env.JWT_SECRET nếu cần bảo mật hơn

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // chứa userId, email, role
        next();
    } catch (err) {
        return res.status(403).json({ message: "Token không hợp lệ!" });
    }
};

module.exports = authenticate;
