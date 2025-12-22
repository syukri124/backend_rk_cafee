const { User } = require("../models");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// --- A. LOGIN (Menghasilkan Token) ---
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Cari user berdasarkan username
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // 2. Cek password (sederhana/plain text)
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Password salah" });
    }

    // 3. Buat Token JWT (Tiket Masuk)
    const token = jwt.sign(
      {
        id_user: user.id_user,
        role: user.role,
      }, // Data dalam token
      process.env.JWT_SECRET, // Kunci rahasia dari .env
      {
        expiresIn: "1d",
      } // Berlaku 1 hari
    );

    // 4. Kirim Respon
    res.json({
      success: true,
      message: "Login Berhasil",
      data: {
        token: token, // <-- Token dikirim ke frontend
        id_user: user.id_user,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- B. GET ALL USERS ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id_user", "username", "role", "created_at"],
      order: [["role", "ASC"]],
    });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- C. CREATE USER ---
exports.createUser = async (req, res) => {
  try {
    const { id_user, username, password, role } = req.body;

    const newUser = await User.create({
      id_user,
      username,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: newUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- D. UPDATE USER ---
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, role } = req.body;

    const [updated] = await User.update(
      { password, role },
      { where: { id_user: id } }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({ success: true, message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- E. DELETE USER ---
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.destroy({
      where: { id_user: id },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({ success: true, message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
