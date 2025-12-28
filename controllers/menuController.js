const { Menu } = require("../models");

// --- A. GET ALL MENUS ---
exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.findAll({
      order: [["nama_menu", "ASC"]],
    });

    res.json({ success: true, data: menus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- B. CREATE MENU ---
exports.createMenu = async (req, res) => {
  try {
    const {
      id_menu,
      nama_menu,
      harga,
      kategori,
      status_tersedia,
    } = req.body;

    const gambar = req.file ? `/uploads/menu/${req.file.filename}` : null;

    const newMenu = await Menu.create({
      id_menu,
      nama_menu,
      harga,
      kategori,
      status_tersedia,
      gambar,
    });

    res.status(201).json({
      success: true,
      message: "Menu berhasil dibuat",
      data: newMenu,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- BULK CREATE MENU ---
exports.bulkCreateMenu = async (req, res) => {
  try {
    const { menus } = req.body;

    if (!Array.isArray(menus)) {
      return res.status(400).json({
        success: false,
        message: "Data harus berupa array menus",
      });
    }

    const result = await Menu.bulkCreate(menus, {
      validate: true,
    });

    res.status(201).json({
      success: true,
      message: `${result.length} menu berhasil ditambahkan`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan menu",
      error: err.message,
    });
  }
};

// --- C. UPDATE MENU ---
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nama_menu,
      harga,
      kategori,
      status_tersedia,
    } = req.body;

    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu tidak ditemukan",
      });
    }

    const updateData = { nama_menu, harga, kategori, status_tersedia };

    // Jika ada file baru, update gambar
    if (req.file) {
      updateData.gambar = `/uploads/menu/${req.file.filename}`;

      // Hapus gambar lama jika ada
      if (menu.gambar) {
        const fs = require('fs');
        const path = require('path');
        const oldPath = path.join(__dirname, '..', menu.gambar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    await Menu.update(updateData, { where: { id_menu: id } });

    res.json({
      success: true,
      message: "Menu berhasil diupdate",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// --- D. DELETE MENU ---
exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Menu.destroy({
      where: { id_menu: id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Menu tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Menu berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
