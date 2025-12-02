const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification bch na3rfou shkon l'utilisateur eli 3mal request w nprotectiw routes
const auth = async (req, res, next) => {
    try {
        // Récupérer le token depuis le header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Trouver l'utilisateur
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Ajouter l'utilisateur à la requête
        req.user = user;
        next();
        
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
};

module.exports = auth;