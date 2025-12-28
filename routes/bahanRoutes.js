const express = require('express');
const router = express.Router();
const bahanBakuController = require('../controllers/bahanBakuController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/bahan', verifyToken, verifyRole(['OWNER', 'KASIR', 'BARISTA']), bahanBakuController.getAllBahan);
router.get('/bahan/alerts', verifyToken, verifyRole(['OWNER', 'KASIR', 'BARISTA']), bahanBakuController.getLowStockAlerts);

router.post('/bahan', verifyToken, verifyRole(['OWNER', 'KASIR']), bahanBakuController.createBahan);

router.put('/bahan/:id_bahan', verifyToken, verifyRole(['OWNER', 'KASIR']), bahanBakuController.updateBahan);

router.delete('/bahan/:id_bahan', verifyToken, verifyRole(['OWNER', 'KASIR']), bahanBakuController.deleteBahan);

router.post('/bahan/bulk', verifyToken, verifyRole(['OWNER', 'KASIR']), bahanBakuController.bulkCreateBahanBaku);


module.exports = router;
