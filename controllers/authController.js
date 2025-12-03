const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Creation mte3 compte utilisateur
exports.register = async (req, res) => {
    try {
        const { nom, login, motDePasse, role} = req.body;

        // Validation simple ken nom, login w motDePasse mawjoudin 
        if (!nom || !login || !motDePasse) {
            return res.status(400).json({ 
                error: 'Nom, login et mot de passe sont requis' 
            });
        }

        let roleUtilisateur = role || 'user';
        
        // S'assurer que le rôle est valide
        if (roleUtilisateur !== 'user' && roleUtilisateur !== 'manager') {
            return res.status(400).json({ 
                error: 'Le rôle doit être "user" ou "manager"' 
            });
        }

        // Vérifier si l'utilisateur mawjoud wala lé 
        const userExists = await User.findOne({ login: login.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: 'Ce login est déjà utilisé' });
        }

        // HASHER LE MOT DE PASSE 
        const salt = await bcrypt.genSalt(10);
        const motDePasseHash = await bcrypt.hash(motDePasse, salt);

        // Créer l'utilisateur avec le mot de passe hashé
        const user = new User({
            nom,
            login: login.toLowerCase(),
            motDePasse: motDePasseHash, // On utilise le hash
            role:  roleUtilisateur
        });

        // Sauvegarder dans la base de données 
        await user.save();

        // Créer le token mte3 l utilisateur
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Répondre au client avec les infos de l'utilisateur et le token 
        res.status(201).json({
            message: 'Compte créé avec succès!',
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

// Connexion
exports.login = async (req, res) => {
    try {
        const { login, motDePasse } = req.body;

        // Validation simple ken login w motDePasse mawjoudin
        if (!login || !motDePasse) {
            return res.status(400).json({ 
                error: 'Login et mot de passe requis' 
            });
        }

        // Trouver l'utilisateur bi login
        const user = await User.findOne({ login: login.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        // COMPARER LES MOTS DE PASSE 
       
        
        const passwordMatch = await bcrypt.compare(motDePasse, user.motDePasse);
        
         console.log(
            motDePasse,
            user.motDePasse,
            passwordMatch
        );

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        // Créer le token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Répondre au client
        res.json({
            message: 'Connexion réussie!',
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

// Profil utilisateur
exports.getProfile = async (req, res) => {
    try {
        res.json({
            message: 'Profil utilisateur',
            user: {
                id: req.user._id,
                nom: req.user.nom,
                login: req.user.login,
                role: req.user.role,
                dateCreation: req.user.dateCreation
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};