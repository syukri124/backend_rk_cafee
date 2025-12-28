const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.post('/orders', verifyToken, verifyRole(['KASIR', 'OWNER']), orderController.createOrder);

router.put('/orders/:id', verifyToken, verifyRole(['BARISTA', 'KASIR', 'OWNER']), orderController.updateOrderStatus);

router.delete('/orders/:id', verifyToken, verifyRole(['KASIR', 'OWNER']), orderController.deleteOrder);

router.get('/kitchen/orders', verifyToken, verifyRole(['BARISTA', 'KASIR', 'OWNER']), orderController.getKitchenOrders);


module.exports = router;