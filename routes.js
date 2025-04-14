const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('knex')(require('./knexfile').development); // Configuration de la base de données
const { jwtSecret } = require('./config'); // Clé secrète pour les tokens
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        console.log('Token manquant');
        return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }
  
    const actualToken = token.split(' ')[1];
    jwt.verify(actualToken, jwtSecret, (err, user) => {
        if (err) {
            console.log('Erreur token:', err.message);
            return res.status(403).json({ message: 'Token invalide' });
        }
        req.user = user;
        console.log('Utilisateur vérifié:', user);
        next();
    });
}
  
// Routes d'authentification

// Connexion administrateur
router.post('/auth/admin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await knex('users').where({ email, role: 'admin' }).first();

        if (!admin) {
            return res.status(404).json({ message: 'Administrateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: admin.id, role: admin.role },
            jwtSecret,
            { expiresIn: '2h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Connexion utilisateur
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await knex('users').where({ email }).first();
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '2h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Création d'un nouvel utilisateur ou technicien
router.post('/auth/new', authenticateToken, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès interdit, rôle insuffisant' });
    }

    try {
        const validRoles = ['user', 'technician'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await knex('users').insert({ name, email, password: hashedPassword, role });
        res.status(201).json({ message: `Utilisateur ${name} créé` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Routes des tickets

// Création d'un ticket
router.post(
    '/tickets',
    authenticateToken,
    [
        body('title').isString().notEmpty().withMessage('Le titre est requis'),
        body('description').isString().notEmpty().withMessage('La description est requise'),
        body('technicianId').optional().isInt({ min: 1 }).withMessage('L\'ID technicien doit être un entier positif'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, technicianId } = req.body;
        const userId = req.user.id;

        try {
            const ticket = await knex('tickets').insert({
                title,
                description,
                status: 'open',
                userId,
                technicianId: technicianId || null,
                createdAt: new Date(),
            });
            res.status(201).json({ message: 'Ticket créé', ticketId: ticket[0] });
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }
);

// Récupération des tickets
router.get('/tickets', authenticateToken, async (req, res) => {
    const { role, id: userId } = req.user;

    try {
        let tickets;
        if (role === 'technician') {
            tickets = await knex('tickets');
        } else if (role === 'user') {
            tickets = await knex('tickets').where({ userId });
        } else {
            return res.status(403).json({ message: 'Accès interdit' });
        }

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Récupération des détails d'un ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
    const { id: userId, role } = req.user;
    const { id: ticketId } = req.params;

    try {
        const ticket = await knex('tickets').where({ id: ticketId }).first();
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket non trouvé' });
        }

        if (role === 'user' && ticket.userId !== userId) {
            return res.status(403).json({ message: 'Accès interdit au ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Mise à jour d'un ticket
router.put('/tickets/:id', authenticateToken, async (req, res) => {
    const { role } = req.user;
    const { id: ticketId } = req.params;
    const { status, technicianId } = req.body;

    if (role !== 'technician') {
        return res.status(403).json({ message: 'Seuls les techniciens peuvent mettre à jour les tickets' });
    }

    try {
        const validStatuses = ['open', 'in progress', 'closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        await knex('tickets').where({ id: ticketId }).update({ status, technicianId });
        res.json({ message: 'Ticket mis à jour' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// Suppression d'un ticket
router.delete('/admin/tickets/:id', authenticateToken, async (req, res) => {
    const { role } = req.user;
    const { id: ticketId } = req.params;

    if (role !== 'admin') {
        return res.status(403).json({ message: 'Accès interdit, rôle insuffisant' });
    }

    try {
        await knex('tickets').where({ id: ticketId }).del();
        res.json({ message: 'Ticket supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

module.exports = router;
