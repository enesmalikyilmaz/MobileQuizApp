const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
    try {
        const h = req.headers.authorization || "";
        const parts = h.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ message: "Token yok" });
        }

        let token = parts[1].trim();

        token = token.replace(/^"+|"+$/g, "");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (e) {
        return res.status(401).json({ message: "Token geçersiz" });
    }
}

module.exports = { authRequired };