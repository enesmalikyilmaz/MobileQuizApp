const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ message: "Token yok" });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ message: "Token geçersiz" });
    }
}

module.exports = { authRequired };