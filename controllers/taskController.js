const Task = require('../models/Task');
const Project = require('../models/Project');


//  Fonctionnalités mte3 l gestion de tâches 
// Créer une tâche 
exports.createTask = async (req, res) => {
    try {
        const { titre, description, projet, deadline } = req.body;

        // Validation simple si le titre w projet mawjoudin
        if (!titre || !projet) {
            return res.status(400).json({ 
                error: 'Le titre et le projet sont requis' 
            });
        }

        // Vérifier  est ce que le projet mawjoud deja ou non
        const projectExists = await Project.findById(projet);
        if (!projectExists) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        // Vérifier que l'utilisateur andou access lel projet 
        const isOwner = projectExists.proprietaire.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isOwner) {
            return res.status(403).json({ 
                error: 'Vous ne pouvez pas créer de tâche dans ce projet' 
            });
        }

        // nasn3ou tache jdida
        const task = new Task({
            titre,
            description: description || '',
            projet,
            deadline: deadline || null,
            // ken le manager ynajem y'assigni l tâche l utilisateur akher
            utilisateurAssigné: (req.user.role === 'manager' && req.body.utilisateurAssigné) 
                ? req.body.utilisateurAssigné 
                : null
        });

        await task.save();

        // Récupérer la tâche avec les informations du projet w utilisateur assigné lel response 
        const taskWithProject = await Task.findById(task._id)
            .populate('projet', 'nom')
            .populate('utilisateurAssigné', 'nom');

        res.status(201).json({
            message: 'Tâche créée avec succès',
            task: taskWithProject
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//Récupérer toutes les tâches
exports.getAllTasks = async (req, res) => {
    try {
        let tasks;

        // Manager voit toutes les tâches
        if (req.user.role === 'manager') {
            tasks = await Task.find()
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom login')
                .sort({ dateCreation: -1 });
        } 
        // Utilisateur normal voit ken les tâches mte3ou
        else {
            tasks = await Task.find({ utilisateurAssigné: req.user._id })
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom login')
                .sort({ dateCreation: -1 });
        }

        res.json(tasks);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Récupérer une tâche par ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('projet', 'nom proprietaire')
            .populate('utilisateurAssigné', 'nom login');

        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        // Vérifier les permissions ( check Task Access  sna3neha louta )
        const canAccess = await checkTaskAccess(req.user, task);
        if (!canAccess) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        res.json(task);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Mettre à jour une tâche
exports.updateTask = async (req, res) => {
    try {
        const { titre, description, statut } = req.body;
        
        // Vérifier les données
        if (!titre && !description && !statut) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        // Trouver la tâche
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        // Vérifier les permissions
        const canUpdate = await checkTaskUpdatePermission(req.user, task);
        if (!canUpdate) {
            return res.status(403).json({ error: 'Vous ne pouvez pas modifier cette tâche' });
        }

        // Mettre à jour les champs autorisés
        if (titre) task.titre = titre;
        if (description) task.description = description;
        if (statut) {
            // Vérifier que le statut est valide
            if (!['todo', 'doing', 'done'].includes(statut)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }
            task.statut = statut;
        }

        // Seul le manager peut changer l'assignation
        if (req.user.role === 'manager' && req.body.utilisateurAssigné) {
            task.utilisateurAssigné = req.body.utilisateurAssigné;
        }

        await task.save();

        // Récupérer la tâche mise à jour
        const updatedTask = await Task.findById(task._id)
            .populate('projet', 'nom')
            .populate('utilisateurAssigné', 'nom');

        res.json({
            message: 'Tâche mise à jour',
            task: updatedTask
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//Supprimer une tâche
exports.deleteTask = async (req, res) => {
    try {
        // Trouver la tâche
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        // Vérifier les permissions
        const project = await Project.findById(task.projet);
        const isProjectOwner = project.proprietaire.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isProjectOwner) {
            return res.status(403).json({ error: 'Vous ne pouvez pas supprimer cette tâche' });
        }

        await task.deleteOne();

        res.json({ message: 'Tâche supprimée avec succès' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Tâches d'un projet spécifique
exports.getTasksByProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        
        // Vérifier que le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        // Vérifier les permissions
        const isOwner = project.proprietaire.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isOwner) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Récupérer les tâches du projet
        const tasks = await Task.find({ projet: projectId })
            .populate('utilisateurAssigné', 'nom login')
            .sort({ dateCreation: -1 });

        res.json(tasks);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Tâches par statut
exports.getTasksByStatus = async (req, res) => {
    try {
        const { statut } = req.params;
        
        // Vérifier que le statut est valide
        if (!['todo', 'doing', 'done'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        let tasks;

        if (req.user.role === 'manager') {
            tasks = await Task.find({ statut })
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom');
        } else {
            tasks = await Task.find({ 
                statut,
                utilisateurAssigné: req.user._id 
            })
            .populate('projet', 'nom')
            .populate('utilisateurAssigné', 'nom');
        }

        res.json(tasks);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// functions sta3mlnehom fel controller mte3 l tasks bch nverifyiw les accès w permissions 
async function checkTaskAccess(user, task) {
    try {
        // Manager a toujours accès
        if (user.role === 'manager') {
            return true;
        }

        // Vérifier si l'utilisateur est assigné à la tâche
        if (task.utilisateurAssigné && 
            task.utilisateurAssigné._id.toString() === user._id.toString()) {
            return true;
        }

        // Vérifier si l'utilisateur est propriétaire du projet
        const project = await Project.findById(task.projet._id);
        if (project && project.proprietaire.toString() === user._id.toString()) {
            return true;
        }

        return false;

    } catch (error) {
        return false;
    }
}

// function bch nverifyiw les permissions mte3 l mise à jour mte3 l tâche
async function checkTaskUpdatePermission(user, task) {
    try {
        // Manager peut tout modifier
        if (user.role === 'manager') {
            return true;
        }

        // Utilisateur assigné peut modifier son statut
        if (task.utilisateurAssigné && 
            task.utilisateurAssigné.toString() === user._id.toString()) {
            return true;
        }

        // Propriétaire du projet peut modifier la tâche
        const project = await Project.findById(task.projet);
        if (project && project.proprietaire.toString() === user._id.toString()) {
            return true;
        }

        return false;

    } catch (error) {
        return false;
    }
}