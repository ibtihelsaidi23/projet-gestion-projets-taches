const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Inscription 
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Profil utilisateur ( protegé bel middleware auth )
router.get('/profile', auth, authController.getProfile);

module.exports = router;