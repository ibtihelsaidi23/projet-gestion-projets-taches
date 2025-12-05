const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// les routes nécessitent l'authentification pour les protéger
router.use(auth);

// Routes de base CRUD
router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Recherche zeyedin lel recherche w filtres 
router.get('/statut/:statut', projectController.getProjectsByStatus);
router.get('/proprietaire/:proprietaireId', projectController.getProjectsByOwner);

module.exports = router;