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

// 2. Récupérer tous les projets avec recherche simple fel query ( URL ) w tri simple 
exports.getAllProjects = async (req, res) => {
  try {
        let projects;
        let filter = {};

        // Manager voit tous les projets, user voit seulement les siens
        if (req.user.role !== 'manager') {
            filter.proprietaire = req.user._id;
        }

        // RECHERCHE SIMPLE par nom (sans regex)
        if (req.query.nom) {
            // On récupère tous les projets d'abord, puis on filtre
            projects = await Project.find(filter)
                .populate('proprietaire', 'nom login');
            
            // Filtrage simple par nom (contient la chaîne)
            projects = projects.filter(project => 
                project.nom.toLowerCase().includes(req.query.nom.toLowerCase())
            );
        } else {
            projects = await Project.find(filter)
                .populate('proprietaire', 'nom login');
        }

        // TRI SIMPLE
        if (req.query.tri) {
            const tri = req.query.tri;
            
            if (tri === 'nom') {
                projects.sort((a, b) => a.nom.localeCompare(b.nom));
            } 
            else if (tri === 'nom_desc') {
                projects.sort((a, b) => b.nom.localeCompare(a.nom));
            }
            else if (tri === 'date') {
                projects.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
            }
            else if (tri === 'date_desc') {
                projects.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
            }
            else if (tri === 'statut') {
                projects.sort((a, b) => a.statut.localeCompare(b.statut));
            }
        } else {
            // Tri par défaut : date décroissante
            projects.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        }

        res.json(projects);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// fonction bch tjib projects selon statut (en cours, terminé, en pause)
exports.getProjectsByStatus = async (req, res) => {
    try {
        const { statut } = req.params;
        
        // Vérifier que le statut est valide
        const statutsValides = ['en cours', 'terminé', 'en pause'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ 
                error: 'Statut invalide. Valeurs possibles: en cours, terminé, en pause' 
            });
        }

        let filter = { statut };

        // Manager voit tous, user voit seulement les siens
        if (req.user.role !== 'manager') {
            filter.proprietaire = req.user._id;
        }

        const projects = await Project.find(filter)
            .populate('proprietaire', 'nom login')
            .sort({ dateCreation: -1 });

        res.json(projects);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// fonction bch tjib projects selon proprietaire ( manager seulement peut y accéder )
exports.getProjectsByOwner = async (req, res) => {
    try {
        // Seul le manager peut voir les projets par propriétaire
        if (req.user.role !== 'manager') {
            return res.status(403).json({ 
                error: 'Seul un manager peut rechercher par propriétaire' 
            });
        }

        const { proprietaireId } = req.params;

        const projects = await Project.find({ proprietaire: proprietaireId })
            .populate('proprietaire', 'nom login')
            .sort({ dateCreation: -1 });

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

