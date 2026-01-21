const User = require("../models/User");

async function adminRequired(req, res, next) {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ message: "Kullanıcı yok" });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ message: "Admin yetkisi gerekli" });
        }

        next();
    } catch (err) {
        console.error("adminRequired error:", err);
        res.status(500).json({ message: "Yetki kontrolü hatası" });
    }
}

module.exports = { adminRequired };