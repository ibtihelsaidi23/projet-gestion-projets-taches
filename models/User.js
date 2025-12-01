const mongoose = require('mongoose');


// Entité mte3 l'utilisateur 
const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true
    },
    login: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    motDePasse: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'manager'],
        default: 'user'
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);