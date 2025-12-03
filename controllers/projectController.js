const Project = require('../models/Project');

// Fonctionnalités mte3 l gestion de projets

// 1. Créer un nouveau projet
exports.createProject = async (req, res) => {
    try {
        const { nom, description } = req.body;

        // Validation simple ken nom mawjoud deja
        if (!nom) {
            return res.status(400).json({ error: 'Le nom du projet est requis' });
        }

        // nasn3ou l projet jdid
        const project = new Project({
            nom,
            description: description || '',
            proprietaire: req.user._id
        });

        await project.save();

        res.status(201).json({
            message: 'Projet créé avec succès',
            project
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. Récupérer tous les projets 
exports.getAllProjects = async (req, res) => {
    try {
        let projects;

        // Manager voit tous les projets
        if (req.user.role === 'manager') {
            projects = await Project.find()
                .populate('proprietaire', 'nom login')
                .sort({ dateCreation: -1 });
        } 
        // Utilisateur normal ychouf projets mte3ou bark
        else {
            projects = await Project.find({ proprietaire: req.user._id })
                .populate('proprietaire', 'nom login')
                .sort({ dateCreation: -1 });
        }

        res.json(projects);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer un projet par ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('proprietaire', 'nom login');

        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        // Vérifier les permissions est ce que user howa l proprietaire wala manager    
        const isOwner = project.proprietaire._id.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isOwner) {
            return res.status(403).json({ error: 'Vous ne pouvez pas voir ce projet' });
        }

        res.json(project);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4.  Mise à jour d'un projet 
exports.updateProject = async (req, res) => {
    try {
        const { nom, description, statut } = req.body;
        
        // Vérifier qu'au moins famma champ pour le mise à jour
        if (!nom && !description && !statut) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        //  Trouver le projet
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        // Vérifier les permissions 
        const isOwner = project.proprietaire.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isOwner) {
            return res.status(403).json({ error: 'Vous ne pouvez pas modifier ce projet' });
        }

        // Mettre à jour les champs
        if (nom) project.nom = nom;
        if (description) project.description = description;
        if (statut) project.statut = statut;

        await project.save();

        res.json({
            message: 'Projet mis à jour',
            project
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. Supprimer un projet
exports.deleteProject = async (req, res) => {
    try {
        // Trouver le projet
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        // Vérifier les permissions
        const isOwner = project.proprietaire.toString() === req.user._id.toString();
        
        if (req.user.role !== 'manager' && !isOwner) {
            return res.status(403).json({ error: 'Vous ne pouvez pas supprimer ce projet' });
        }

        await project.deleteOne();

        res.json({ message: 'Projet supprimé avec succès' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. Recherche simple par nom 
exports.searchProjects = async (req, res) => {
    try {
        const { search } = req.query;
        let projects;

        if (!search) {
            return res.status(400).json({ error: 'Terme de recherche requis' });
        }

        if (req.user.role === 'manager') {
            projects = await Project.find({ 
                nom: { $regex: search, $options: 'i' } 
            }).populate('proprietaire', 'nom login');
        } else {
            projects = await Project.find({ 
                proprietaire: req.user._id,
                nom: { $regex: search, $options: 'i' }
            }).populate('proprietaire', 'nom login');
        }

        res.json(projects);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};