// Middleware simple bch nverifyiw role mte3 l'utilisateur ( manager wala user)
const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Non authentifié' });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ 
                error: `Accès réservé aux ${role}s uniquement` 
            });
        }
        
        next();
    };
};

module.exports = checkRole;