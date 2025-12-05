const express = require('express');
const router = express.Router();
const riwayatStokController = require('../controllers/riwayatStokController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/riwayat', verifyToken, verifyRole(['OWNER','KASIR','BARISTA']), riwayatStokController.getAllRiwayatStok);
router.get('/riwayat/:id_bahan', verifyToken, verifyRole(['OWNER','KASIR','BARISTA']), riwayatStokController.getRiwayatByBahan);
router.post('/riwayat', verifyToken, verifyRole(['OWNER','KASIR']), riwayatStokController.createRiwayat);

module.exports = router;
