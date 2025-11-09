const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware pour parser le JSON des requêtes entrantes
app.use(express.json());

const dataDir = '/data'; 
const dbPath = path.join(dataDir, 'database.json');
const usersPath = path.join(dataDir, 'users.json');

// --- Fonctions utilitaires pour lire/écrire la BDD ---
const readDB = async () => {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
};

const writeDB = async (data) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// --- API ROUTES ---

// GET: Récupérer toutes les données initiales
app.get('/api/data', async (req, res) => {
    try {
        const dbData = await readDB();
        const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        res.json({ ...usersData, ...dbData });
    } catch (error) {
        res.status(500).json({ message: "Erreur de lecture des données" });
    }
});

// POST: Ajouter un cadeau acheté (et ses statuts de remboursement)
app.post('/api/gifts', async (req, res) => {
    try {
        const db = await readDB();
        const newGift = req.body;
        
        // Logique de création de l'ID et des statuts
        newGift.id = db.purchasedGifts.length > 0 ? Math.max(...db.purchasedGifts.map(g => g.id)) + 1 : 1;
        db.purchasedGifts.push(newGift);

        let nextStatusId = db.reimbursementStatus.length > 0 ? Math.max(...db.reimbursementStatus.map(s => s.id)) + 1 : 1;
        const amountPerPerson = newGift.totalPrice / newGift.reimbursementMemberIds.length;
        
        newGift.reimbursementMemberIds.forEach(memberId => {
            const isPayer = memberId === newGift.payerId;
            db.reimbursementStatus.push({
                id: nextStatusId++,
                giftId: newGift.id,
                memberId: memberId,
                status: isPayer ? 'Tout Remboursé' : 'Non Remboursé',
                amountPaid: isPayer ? amountPerPerson : 0
            });
        });
        
        // Si on convertit une idée, on la supprime
        if (req.query.deleteIdeaId) {
            const ideaId = parseInt(req.query.deleteIdeaId);
            db.giftIdeas = db.giftIdeas.filter(idea => idea.id !== ideaId);
        }

        await writeDB(db);
        res.status(201).json(newGift);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout du cadeau" });
    }
});

// PUT: Mettre à jour un cadeau acheté
app.put('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);
        const updatedGiftData = req.body;

        const giftIndex = db.purchasedGifts.findIndex(g => g.id === giftId);
        if (giftIndex === -1) {
            return res.status(404).json({ message: "Cadeau non trouvé" });
        }

        // 1. Mettre à jour les données du cadeau
        db.purchasedGifts[giftIndex] = { ...updatedGiftData, id: giftId };

        // 2. Supprimer tous les anciens statuts de remboursement pour ce cadeau
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);

        // 3. Recréer les statuts de remboursement à partir des nouvelles données
        let nextStatusId = db.reimbursementStatus.length > 0 ? Math.max(...db.reimbursementStatus.map(s => s.id)) + 1 : 1;
        const amountPerPerson = updatedGiftData.totalPrice / updatedGiftData.reimbursementMemberIds.length;

        updatedGiftData.reimbursementMemberIds.forEach(memberId => {
            const isPayer = memberId === updatedGiftData.payerId;
            db.reimbursementStatus.push({
                id: nextStatusId++,
                giftId: giftId,
                memberId: memberId,
                status: isPayer ? 'Tout Remboursé' : 'Non Remboursé',
                amountPaid: isPayer ? amountPerPerson : 0
            });
        });

        await writeDB(db);
        res.json(db.purchasedGifts[giftIndex]);

    } catch (error) {
        console.error("ERREUR API /gifts/:id PUT:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du cadeau" });
    }
});

// DELETE: Supprimer un cadeau acheté (et ses statuts)
app.delete('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);

        // 1. Filtrer pour supprimer le cadeau
        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== giftId);

        // 2. Filtrer pour supprimer tous les statuts de remboursement associés
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);

        await writeDB(db);
        res.status(204).send(); // Succès, pas de contenu à renvoyer
    } catch (error) {
        console.error("ERREUR API /gifts/:id DELETE:", error);
        res.status(500).json({ message: "Erreur lors de la suppression du cadeau" });
    }
});

// POST: Repasser un cadeau acheté en idée
app.post('/api/gifts/:id/revert-to-idea', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);

        const giftToRevert = db.purchasedGifts.find(g => g.id === giftId);
        if (!giftToRevert) {
            return res.status(404).json({ message: "Cadeau acheté non trouvé" });
        }

        // 1. Créer une nouvelle idée à partir du cadeau
        const newIdea = {
            id: db.giftIdeas.length > 0 ? Math.max(...db.giftIdeas.map(i => i.id)) + 1 : 1,
            title: giftToRevert.name,
            estimatedPrice: giftToRevert.totalPrice,
            targetMemberId: giftToRevert.targetMemberId,
            creationDate: new Date().toISOString(),
            creatorId: giftToRevert.payerId // On assume que le payeur est le créateur
        };
        db.giftIdeas.push(newIdea);

        // 2. Supprimer le cadeau acheté et ses statuts
        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== giftId);
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);
        
        await writeDB(db);
        res.status(200).json(newIdea);

    } catch (error) {
        console.error("ERREUR API /gifts/:id/revert-to-idea:", error);
        res.status(500).json({ message: "Erreur lors de la conversion du cadeau en idée" });
    }
});

// POST: Ajouter une idée de cadeau
app.post('/api/ideas', async (req, res) => {
    try {
        const db = await readDB();
        const newIdea = req.body;
        newIdea.id = db.giftIdeas.length > 0 ? Math.max(...db.giftIdeas.map(i => i.id)) + 1 : 1;
        db.giftIdeas.push(newIdea);
        await writeDB(db);
        res.status(201).json(newIdea);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'ajout de l'idée" });
    }
});

// DELETE: Supprimer une idée de cadeau
app.delete('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        const ideaId = parseInt(req.params.id);
        db.giftIdeas = db.giftIdeas.filter(idea => idea.id !== ideaId);
        await writeDB(db);
        res.status(204).send(); // 204 No Content = Succès sans rien à renvoyer
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression de l'idée" });
    }
});

// PUT: Mettre à jour un statut de remboursement
app.put('/api/status/:id', async (req, res) => {
    try {
        const db = await readDB();
        const statusId = parseInt(req.params.id);
        const updatedData = req.body; // { status, amountPaid }

        const statusIndex = db.reimbursementStatus.findIndex(s => s.id === statusId);
        if (statusIndex === -1) {
            return res.status(404).json({ message: "Statut non trouvé" });
        }
        
        // Fusionner les anciennes et nouvelles données
        db.reimbursementStatus[statusIndex] = { ...db.reimbursementStatus[statusIndex], ...updatedData };

        await writeDB(db);
        res.json(db.reimbursementStatus[statusIndex]);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
});

// PUT: Mettre à jour une idée (pour le prix estimé)
app.put('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        const ideaId = parseInt(req.params.id);
        const { estimatedPrice } = req.body;

        const ideaIndex = db.giftIdeas.findIndex(i => i.id === ideaId);
        if (ideaIndex === -1) {
            return res.status(404).json({ message: "Idée non trouvée" });
        }

        db.giftIdeas[ideaIndex].estimatedPrice = estimatedPrice;
        await writeDB(db);
        res.json(db.giftIdeas[ideaIndex]);
    } catch (error) {
        console.error("ERREUR API /ideas/:id PUT:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour de l'idée" });
    }
});


app.listen(PORT, () => {
    console.log(`Serveur GiftFlow API démarré sur http://localhost:${PORT}`);
});
