const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);

// --- PROTECTED (Hanya Owner) ---
router.get('/users', verifyToken, verifyRole(['OWNER']), authController.getAllUsers);

router.post('/users', verifyToken, verifyRole(['OWNER']), authController.createUser);

router.put('/users/:id', verifyToken, verifyRole(['OWNER']), authController.updateUser);

router.delete('/users/:id', verifyToken, verifyRole(['OWNER']), authController.deleteUser);


module.exports = router;