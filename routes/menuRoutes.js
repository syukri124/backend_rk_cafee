const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// --- PUBLIC (Bisa dilihat siapa saja) ---
router.get('/menus', menuController.getAllMenus);

// --- PROTECTED ---
// Tambah & Edit: Owner DAN Kasir (Sesuai revisi Anda)
router.post('/menus', verifyToken, verifyRole(['OWNER', 'KASIR']), menuController.createMenu);
// Bulk insert: hanya OWNER & KASIR
router.post('/menus/bulk', verifyToken, verifyRole(['OWNER', 'KASIR']), menuController.bulkCreateMenu
);


router.put('/menus/:id', verifyToken, verifyRole(['OWNER', 'KASIR']), menuController.updateMenu);

// Hapus: Hanya Owner
router.delete('/menus/:id', verifyToken, verifyRole(['OWNER']), menuController.deleteMenu);

module.exports = router;