const User = require('../models/User');
const jwt = require('jsonwebtoken');

// fonction d'inscription bch yest3mlha l'utilisateur jdid 
exports.register = async (req, res) => {
    try {
        const { nom, login, motDePasse } = req.body;

        // Vérification simple des données
        if (!nom || !login || !motDePasse) {
            return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }

        // Vérifier si le login existe déjà
        const userExists = await User.findOne({ login: login.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: 'Ce login est déjà utilisé' });
        }

        // Créer l'utilisateur
        const user = new User({
            nom,
            login: login.toLowerCase(),
            motDePasse
        });

        await user.save();

        // Créer le token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Compte créé avec succès',
            user: {
                id: user._id,
                nom: user.nom,
                login: user.login,
                role: user.role
            },
            token
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Fonction de login bch yest3mlha l'utilisateur eli Andou compte
exports.login = async (req, res) => {
    try {
        const { login, motDePasse } = req.body;

        // Vérification simple des données
        if (!login || !motDePasse) {
            return res.status(400).json({ error: 'Login et mot de passe requis' });
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ login: login.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        // Vérifier le mot de passe
        const passwordMatch = await user.comparePassword(motDePasse);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        // Créer le token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion réussie',
            user: {
                id: user._id,
                nom: user.nom,
                login: user.login,
                role: user.role
            },
            token
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Fonction bch tjib profile mte3 l'utilisateur connecté 
exports.getProfile = (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            nom: req.user.nom,
            login: req.user.login,
            role: req.user.role,
            dateCreation: req.user.dateCreation
        }
    });
};