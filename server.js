const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware teb3in express
app.use(cors());
app.use(express.json());

// Hethi lel Connexion mte3 base de données MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Route de test 
app.get('/', (req, res) => {
    res.json({ message: 'API de gestion de projets et tâches' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});