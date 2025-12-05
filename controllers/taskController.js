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

        // Manager ynajem ychouf kolchy
        if (req.user.role === 'manager') {
            tasks = await Task.find()
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom login');
        } 
        // Utilisateur normal ychouf ken les tâches mte3ou
        else {
            tasks = await Task.find({ utilisateurAssigné: req.user._id })
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom login');
        }

        // FILTRAGE SIMPLE
        // Filtre par statut ( par exemple todo, doing, done )
        if (req.query.statut) {
            tasks = tasks.filter(task => task.statut === req.query.statut);
        }

        // Filtre par projet ID
        if (req.query.projet) {
            tasks = tasks.filter(task => 
                task.projet && task.projet._id.toString() === req.query.projet
            );
        }

        // Filtre par titre 
        if (req.query.titre) {
            const recherche = req.query.titre.toLowerCase();
            tasks = tasks.filter(task => 
                task.titre.toLowerCase().includes(recherche)
            );
        }

        // Filtre par deadline (avant une date)
        if (req.query.deadlineAvant) {
            const dateLimite = new Date(req.query.deadlineAvant);
            tasks = tasks.filter(task => 
                task.deadline && new Date(task.deadline) <= dateLimite
            );
        }

        // TRI SIMPLE 
        if (req.query.tri) {
            const tri = req.query.tri;
            
            // Tri par différents champs
            // trie bel ordre croissant w décroissant mte3 titre, date de création, deadline w statut
            if (tri === 'titre') {
                tasks.sort((a, b) => a.titre.localeCompare(b.titre));
            }
            else if (tri === 'titre_desc') {
                tasks.sort((a, b) => b.titre.localeCompare(a.titre));
            }
            else if (tri === 'date') {
                tasks.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
            }
            else if (tri === 'date_desc') {
                tasks.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
            }
            else if (tri === 'deadline') {
                tasks.sort((a, b) => {
                    // Les tâches sans deadline vont à la fin
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
            }
            else if (tri === 'deadline_desc') {
                tasks.sort((a, b) => {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(b.deadline) - new Date(a.deadline);
                });
            }
            else if (tri === 'statut') {
                const ordreStatut = { 'todo': 1, 'doing': 2, 'done': 3 };
                tasks.sort((a, b) => ordreStatut[a.statut] - ordreStatut[b.statut]);
            }
        } else {
            // Tri par défaut : date décroissante
            tasks.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        }

        res.json({
            count: tasks.length,
            tasks
        });

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

// tjib les tâches par statut avec tri par deadline la plus proche 
exports.getTasksByStatus = async (req, res) => {
    try {
        const { statut } = req.params;
        
        // Vérifier que le statut est valide
        const statutsValides = ['todo', 'doing', 'done'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ 
                error: 'Statut invalide. Valeurs possibles: todo, doing, done' 
            });
        }

        let tasks;

        if (req.user.role === 'manager') {
            tasks = await Task.find({ statut })
                .populate('projet', 'nom')
                .populate('utilisateurAssigné', 'nom login');
        } else {
            tasks = await Task.find({ 
                statut,
                utilisateurAssigné: req.user._id 
            })
            .populate('projet', 'nom')
            .populate('utilisateurAssigné', 'nom login');
        }

        // Tri par défaut : deadline la plus proche
        tasks.sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        res.json({
            statut,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// tjib les Tâches d'un projet spécifique 
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

        // Récupérer les tâches
        const tasks = await Task.find({ projet: projectId })
            .populate('utilisateurAssigné', 'nom login')
            .sort({ dateCreation: -1 });

        res.json({
            projet: project.nom,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Mettre à jour une tâche
exports.updateTask = async (req, res) => {
    try {
        const { titre, description, statut , utilisateurAssigné } = req.body;
        
        // Vérifier les données
        if (!titre || !description || !statut || !utilisateurAssigné) {
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
        if (utilisateurAssigné) {task.utilisateurAssigné = utilisateurAssigné;}
        if (statut) {
            // Vérifier que le statut est valide
            if (!['todo', 'doing', 'done'].includes(statut)) {
                return res.status(400).json({ error: 'Statut invalide' });
            }
            task.statut = statut;
        }

        // Seul le manager peut changer l'assignation
        if (req.user.role === 'manager' || req.body.utilisateurAssigné) {
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