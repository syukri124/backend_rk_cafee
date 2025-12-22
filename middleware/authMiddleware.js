const jwt = require("jsonwebtoken");
require("dotenv").config();

// 1. Cek apakah user sudah login (punya token valid)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Format token: "Bearer <token_asli>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Token tidak ada.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Simpan data user (id & role) ke request
    next(); // Lanjut ke controller
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau kadaluarsa.",
    });
  }
};

// 2. Cek apakah user memiliki role yang diizinkan
exports.verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // allowedRoles berupa array, contoh: ["OWNER"]
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Anda bukan ${allowedRoles.join(" atau ")}.`,
      });
    }

    next();
  };
};
