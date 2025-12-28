const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.get('/menus', menuController.getAllMenus);

router.post('/menus', verifyToken, verifyRole(['OWNER', 'KASIR']), upload.single('gambar'), menuController.createMenu);

router.post('/menus/bulk', verifyToken, verifyRole(['OWNER', 'KASIR']), menuController.bulkCreateMenu);

router.put('/menus/:id', verifyToken, verifyRole(['OWNER', 'KASIR']), upload.single('gambar'), menuController.updateMenu);

router.delete('/menus/:id', verifyToken, verifyRole(['OWNER']), menuController.deleteMenu);


module.exports = router;