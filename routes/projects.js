const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// les routes nécessitent l'authentification pour les protéger
router.use(auth);

// Routes de base
router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Recherche simple
router.get('/search', projectController.searchProjects);

module.exports = router;