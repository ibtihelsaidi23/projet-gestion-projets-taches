const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes de base
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Routes zeydin pour fonctionnalités supplémentaires ( filtrage w recherche bel status w project)
router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/status/:statut', taskController.getTasksByStatus);

module.exports = router;