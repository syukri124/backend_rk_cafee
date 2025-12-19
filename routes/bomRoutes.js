const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/bom', verifyToken, verifyRole(['OWNER', 'KASIR', 'BARISTA']), bomController.getAllBOM);
router.get('/bom/menu/:id_menu', verifyToken, verifyRole(['OWNER', 'KASIR', 'BARISTA']), bomController.getBOMByMenu);
router.post('/bom', verifyToken, verifyRole(['OWNER', 'KASIR']), bomController.createBOM);
router.put('/bom/:id_bom', verifyToken, verifyRole(['OWNER', 'KASIR']), bomController.updateBOM);
router.delete('/bom/:id_bom', verifyToken, verifyRole(['OWNER', 'KASIR']), bomController.deleteBOM);

router.post('/bom/bulk', verifyToken, verifyRole(['OWNER', 'KASIR']), bomController.bulkCreateBOM);

module.exports = router;
