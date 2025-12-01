const mongoose = require('mongoose');


// Entité mte3 l Tâche
const taskSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    statut: {
        type: String,
        enum: ['todo', 'doing', 'done'],
        default: 'todo'
    },
    deadline: {
        type: Date
    },
    projet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    utilisateurAssigné: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);