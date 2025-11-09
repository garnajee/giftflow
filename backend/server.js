/**
 * GiftFlow API Server
 * This server uses Express.js to provide a RESTful API for managing gift data.
 * All data is stored in JSON files for simplicity and persistence via Docker volumes.
 * All API routes are protected by a Basic Authentication middleware.
 */

// --- IMPORTS ---
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// --- APP INITIALIZATION ---
const app = express();
const PORT = 3000;
app.use(express.json()); // Middleware to parse JSON request bodies

// --- CONSTANTS ---
const dataDir = '/data';
const dbPath = path.join(dataDir, 'database.json');
const usersPath = path.join(dataDir, 'users.json');

// --- DATABASE UTILITY FUNCTIONS ---
const readDB = async () => JSON.parse(await fs.readFile(dbPath, 'utf-8'));
const writeDB = async (data) => await fs.writeFile(dbPath, JSON.stringify(data, null, 2));

// --- AUTHENTICATION MIDDLEWARE ---
/**
 * A middleware that checks for a valid 'Authorization: Basic <credentials>' header.
 * It decodes the Base64 credentials and validates them against the users.json file.
 * If authentication fails, it sends a 401 Unauthorized response.
 * If it succeeds, it calls next() to proceed to the requested route.
 */
const authMiddleware = async (req, res, next) => {
    try {
        const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        const user = usersData.members.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If authentication is successful, proceed to the next handler
        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        res.status(500).json({ message: 'Authentication error' });
    }
};

// Apply the authentication middleware to all routes starting with /api
app.use('/api', authMiddleware);

// --- API ROUTES ---

// GET /api/data: Fetch all application data
app.get('/api/data', async (req, res) => {
    try {
        const dbData = await readDB();
        const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        res.json({ ...usersData, ...dbData });
    } catch (error) {
        console.error("API Error on GET /api/data:", error);
        res.status(500).json({ message: "Error reading data files" });
    }
});

// POST /api/ideas: Create a new gift idea
app.post('/api/ideas', async (req, res) => {
    try {
        const db = await readDB();
        const newIdea = req.body;
        newIdea.id = db.giftIdeas.length > 0 ? Math.max(...db.giftIdeas.map(i => i.id)) + 1 : 1;
        db.giftIdeas.push(newIdea);
        await writeDB(db);
        res.status(201).json(newIdea);
    } catch (error) {
        console.error("API Error on POST /api/ideas:", error);
        res.status(500).json({ message: "Error creating gift idea" });
    }
});

// PUT /api/ideas/:id: Update an existing gift idea (e.g., its price)
app.put('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        const ideaId = parseInt(req.params.id);
        const { estimatedPrice } = req.body;
        const ideaIndex = db.giftIdeas.findIndex(i => i.id === ideaId);
        if (ideaIndex === -1) return res.status(404).json({ message: "Idea not found" });
        db.giftIdeas[ideaIndex].estimatedPrice = estimatedPrice;
        await writeDB(db);
        res.json(db.giftIdeas[ideaIndex]);
    } catch (error) {
        console.error(`API Error on PUT /api/ideas/${req.params.id}:`, error);
        res.status(500).json({ message: "Error updating gift idea" });
    }
});

// DELETE /api/ideas/:id: Delete a gift idea
app.delete('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        const ideaId = parseInt(req.params.id);
        db.giftIdeas = db.giftIdeas.filter(idea => idea.id !== ideaId);
        await writeDB(db);
        res.status(204).send();
    } catch (error) {
        console.error(`API Error on DELETE /api/ideas/${req.params.id}:`, error);
        res.status(500).json({ message: "Error deleting gift idea" });
    }
});

// POST /api/gifts: Create a new purchased gift
app.post('/api/gifts', async (req, res) => {
    try {
        const db = await readDB();
        const newGift = req.body;
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
                amountPaid: isPayer ? amountPerPerson : 0,
            });
        });

        if (req.query.deleteIdeaId) {
            const ideaId = parseInt(req.query.deleteIdeaId);
            db.giftIdeas = db.giftIdeas.filter(idea => idea.id !== ideaId);
        }

        await writeDB(db);
        res.status(201).json(newGift);
    } catch (error) {
        console.error("API Error on POST /api/gifts:", error);
        res.status(500).json({ message: "Error creating purchased gift" });
    }
});

// PUT /api/gifts/:id: Update an existing purchased gift
app.put('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);
        const updatedGiftData = req.body;
        const giftIndex = db.purchasedGifts.findIndex(g => g.id === giftId);
        if (giftIndex === -1) return res.status(404).json({ message: "Gift not found" });

        db.purchasedGifts[giftIndex] = { ...updatedGiftData, id: giftId };
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);
        
        let nextStatusId = db.reimbursementStatus.length > 0 ? Math.max(...db.reimbursementStatus.map(s => s.id)) + 1 : 1;
        const amountPerPerson = updatedGiftData.totalPrice / updatedGiftData.reimbursementMemberIds.length;

        updatedGiftData.reimbursementMemberIds.forEach(memberId => {
            const isPayer = memberId === updatedGiftData.payerId;
            db.reimbursementStatus.push({
                id: nextStatusId++,
                giftId: giftId,
                memberId: memberId,
                status: isPayer ? 'Tout Remboursé' : 'Non Remboursé',
                amountPaid: isPayer ? amountPerPerson : 0,
            });
        });

        await writeDB(db);
        res.json(db.purchasedGifts[giftIndex]);
    } catch (error) {
        console.error(`API Error on PUT /api/gifts/${req.params.id}:`, error);
        res.status(500).json({ message: "Error updating purchased gift" });
    }
});

// DELETE /api/gifts/:id: Delete a purchased gift and its statuses
app.delete('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);
        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== giftId);
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);
        await writeDB(db);
        res.status(204).send();
    } catch (error) {
        console.error(`API Error on DELETE /api/gifts/${req.params.id}:`, error);
        res.status(500).json({ message: "Error deleting purchased gift" });
    }
});

// POST /api/gifts/:id/revert-to-idea: Convert a purchased gift back to an idea
app.post('/api/gifts/:id/revert-to-idea', async (req, res) => {
    try {
        const db = await readDB();
        const giftId = parseInt(req.params.id);
        const giftToRevert = db.purchasedGifts.find(g => g.id === giftId);
        if (!giftToRevert) return res.status(404).json({ message: "Purchased gift not found" });

        const newIdea = {
            id: db.giftIdeas.length > 0 ? Math.max(...db.giftIdeas.map(i => i.id)) + 1 : 1,
            title: giftToRevert.name,
            estimatedPrice: giftToRevert.totalPrice,
            targetMemberId: giftToRevert.targetMemberId,
            creationDate: new Date().toISOString(),
            creatorId: giftToRevert.payerId,
        };
        db.giftIdeas.push(newIdea);

        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== giftId);
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== giftId);
        
        await writeDB(db);
        res.status(200).json(newIdea);
    } catch (error) {
        console.error(`API Error on POST /api/gifts/${req.params.id}/revert-to-idea:`, error);
        res.status(500).json({ message: "Error reverting gift to idea" });
    }
});

// PUT /api/status/:id: Update a reimbursement status
app.put('/api/status/:id', async (req, res) => {
    try {
        const db = await readDB();
        const statusId = parseInt(req.params.id);
        const updatedData = req.body;
        const statusIndex = db.reimbursementStatus.findIndex(s => s.id === statusId);
        if (statusIndex === -1) return res.status(404).json({ message: "Status not found" });
        db.reimbursementStatus[statusIndex] = { ...db.reimbursementStatus[statusIndex], ...updatedData };
        await writeDB(db);
        res.json(db.reimbursementStatus[statusIndex]);
    } catch (error) {
        console.error(`API Error on PUT /api/status/${req.params.id}:`, error);
        res.status(500).json({ message: "Error updating status" });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`GiftFlow API Server started on http://localhost:${PORT}`);
});
