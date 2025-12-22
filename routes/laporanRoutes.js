const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get( '/laporan/penjualan', verifyToken, verifyRole(['OWNER']), laporanController.getLaporanPenjualan );

module.exports = router;
