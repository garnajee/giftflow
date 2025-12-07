/**
 * GiftFlow API Server (Multi-Family Version)
 */
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;
app.use(express.json());

const dataDir = '/data';
const dbPath = path.join(dataDir, 'database.json');
const usersPath = path.join(dataDir, 'users.json');

const readDB = async () => JSON.parse(await fs.readFile(dbPath, 'utf-8'));
const writeDB = async (data) => await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
const readUsers = async () => JSON.parse(await fs.readFile(usersPath, 'utf-8'));
const writeUsers = async (data) => await fs.writeFile(usersPath, JSON.stringify(data, null, 2));
const getNextId = (collection) => (collection.length > 0 ? Math.max(...collection.map(item => item.id)) + 1 : 1);

const authMiddleware = async (req, res, next) => {
    try {
        const usersData = await readUsers();
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) return res.status(401).json({ message: 'Auth required' });
        const base64 = authHeader.split(' ')[1];
        const [username, password] = Buffer.from(base64, 'base64').toString('ascii').split(':');
        const user = usersData.members.find(u => u.username === username && u.password === password);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        req.user = user;
        next();
    } catch (e) { res.status(500).json({ message: 'Auth error' }); }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin required' });
    next();
};

// --- ROUTES ---

// LOGIN
app.post('/api/login', authMiddleware, async (req, res) => {
    try {
        const db = await readDB();
        const links = db.userFamilyLinks.filter(l => l.userId === req.user.id);
        const families = links.map(l => db.families.find(f => f.id === l.familyId)).filter(Boolean);
        res.json({ user: req.user, families });
    } catch (e) { res.status(500).json({ message: "Login error" }); }
});

// FAMILY DATA
app.get('/api/family/:familyId/data', authMiddleware, async (req, res) => {
    const fId = parseInt(req.params.familyId);
    try {
        const db = await readDB();
        const users = await readUsers();
        const isInFamily = db.userFamilyLinks.some(l => l.userId === req.user.id && l.familyId === fId);
        if (!isInFamily && !req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
        const memberIds = db.userFamilyLinks.filter(l => l.familyId === fId).map(l => l.userId);
        res.json({
            members: users.members.filter(m => memberIds.includes(m.id)),
            giftIdeas: db.giftIdeas.filter(i => i.familyId === fId),
            purchasedGifts: db.purchasedGifts.filter(g => g.familyId === fId),
            reimbursementStatus: db.reimbursementStatus
        });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// ADMIN ROUTES
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get('/data', async (req, res) => {
    try {
        const u = await readUsers();
        const db = await readDB();
        res.json({ users: u.members, families: db.families, links: db.userFamilyLinks });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

adminRouter.post('/users', async (req, res) => {
    try {
        const u = await readUsers();
        const newUser = { ...req.body, id: getNextId(u.members) };
        // Handle initial family assignment if provided
        if(req.body.familyIds) {
            const db = await readDB();
            req.body.familyIds.forEach(fid => db.userFamilyLinks.push({userId: newUser.id, familyId: parseInt(fid)}));
            await writeDB(db);
            delete newUser.familyIds;
        }
        u.members.push(newUser);
        await writeUsers(u);
        res.json(newUser);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

adminRouter.put('/users/:id', async (req, res) => {
    try {
        const u = await readUsers();
        const userId = parseInt(req.params.id);
        const idx = u.members.findIndex(m => m.id === userId);
        if (idx === -1) return res.status(404).json({ message: "User not found" });
        
        // Update user props
        const { familyIds, ...userData } = req.body;
        u.members[idx] = { ...u.members[idx], ...userData };
        await writeUsers(u);

        // Update family links if provided
        if (familyIds) {
            const db = await readDB();
            db.userFamilyLinks = db.userFamilyLinks.filter(l => l.userId !== userId); // Remove old
            familyIds.forEach(fid => db.userFamilyLinks.push({ userId: userId, familyId: parseInt(fid) }));
            await writeDB(db);
        }
        res.json(u.members[idx]);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

adminRouter.post('/families', async (req, res) => {
    try {
        const db = await readDB();
        const newFam = { ...req.body, id: getNextId(db.families) };
        db.families.push(newFam);
        await writeDB(db);
        res.json(newFam);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

// PUT /api/admin/families/:id (Update family name)
adminRouter.put('/families/:id', async (req, res) => {
    try {
        const db = await readDB();
        const familyId = parseInt(req.params.id);
        const { name } = req.body;
        
        const familyIndex = db.families.findIndex(f => f.id === familyId);
        if (familyIndex === -1) {
            return res.status(404).json({ message: "Family not found" });
        }

        db.families[familyIndex].name = name;
        await writeDB(db);
        res.json(db.families[familyIndex]);
    } catch (e) {
        res.status(500).json({ message: "Error updating family" });
    }
});

adminRouter.put('/families/:id/members', async (req, res) => {
    try {
        const db = await readDB();
        const fId = parseInt(req.params.id);
        db.userFamilyLinks = db.userFamilyLinks.filter(l => l.familyId !== fId);
        req.body.memberIds.forEach(userId => db.userFamilyLinks.push({ userId: parseInt(userId), familyId: fId }));
        await writeDB(db);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

adminRouter.delete('/families/:id', async (req, res) => {
    try {
        const db = await readDB();
        const familyId = parseInt(req.params.id);

        // 1. Identifier les cadeaux achetés de cette famille pour nettoyer les statuts de remboursement
        const giftsToDelete = db.purchasedGifts.filter(g => g.familyId === familyId).map(g => g.id);

        // 2. Supprimer la famille
        db.families = db.families.filter(f => f.id !== familyId);

        // 3. Supprimer les liens utilisateurs
        db.userFamilyLinks = db.userFamilyLinks.filter(l => l.familyId !== familyId);

        // 4. Supprimer les idées de cadeaux
        db.giftIdeas = db.giftIdeas.filter(i => i.familyId !== familyId);

        // 5. Supprimer les cadeaux achetés
        db.purchasedGifts = db.purchasedGifts.filter(g => g.familyId !== familyId);

        // 6. Supprimer les statuts de remboursement liés aux cadeaux supprimés
        db.reimbursementStatus = db.reimbursementStatus.filter(s => !giftsToDelete.includes(s.giftId));

        await writeDB(db);
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ message: "Error deleting family" });
    }
});

app.use('/api/admin', adminRouter);

// CRUD OPERATIONS
app.use('/api', authMiddleware);

app.post('/api/ideas', async (req, res) => {
    try {
        const db = await readDB();
        const item = { ...req.body, id: getNextId(db.giftIdeas) };
        if(!item.familyId) return res.status(400).json({message: "FamilyID missing"});
        db.giftIdeas.push(item);
        await writeDB(db);
        res.json(item);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        const idx = db.giftIdeas.findIndex(i => i.id === parseInt(req.params.id));
        if(idx === -1) return res.status(404).send();
        db.giftIdeas[idx] = { ...db.giftIdeas[idx], ...req.body };
        await writeDB(db);
        res.json(db.giftIdeas[idx]);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.delete('/api/ideas/:id', async (req, res) => {
    try {
        const db = await readDB();
        db.giftIdeas = db.giftIdeas.filter(i => i.id !== parseInt(req.params.id));
        await writeDB(db);
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.post('/api/gifts', async (req, res) => {
    try {
        const db = await readDB();
        const item = { ...req.body, id: getNextId(db.purchasedGifts) };
        if(!item.familyId) return res.status(400).json({message: "FamilyID missing"});
        db.purchasedGifts.push(item);
        let nextStatusId = getNextId(db.reimbursementStatus);
        const share = item.totalPrice / item.reimbursementMemberIds.length;
        item.reimbursementMemberIds.forEach(mid => {
            const isPayer = mid === item.payerId;
            db.reimbursementStatus.push({ id: nextStatusId++, giftId: item.id, memberId: mid, status: isPayer ? 'Tout Remboursé' : 'Non Remboursé', amountPaid: isPayer ? share : 0 });
        });
        if (req.query.deleteIdeaId) { db.giftIdeas = db.giftIdeas.filter(i => i.id !== parseInt(req.query.deleteIdeaId)); }
        await writeDB(db);
        res.json(item);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const gId = parseInt(req.params.id);
        const idx = db.purchasedGifts.findIndex(g => g.id === gId);
        if(idx === -1) return res.status(404).send();
        const updated = { ...db.purchasedGifts[idx], ...req.body };
        db.purchasedGifts[idx] = updated;
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== gId);
        let nextStatusId = getNextId(db.reimbursementStatus);
        const share = updated.totalPrice / updated.reimbursementMemberIds.length;
        updated.reimbursementMemberIds.forEach(mid => {
            const isPayer = mid === updated.payerId;
            db.reimbursementStatus.push({ id: nextStatusId++, giftId: gId, memberId: mid, status: isPayer ? 'Tout Remboursé' : 'Non Remboursé', amountPaid: isPayer ? share : 0 });
        });
        await writeDB(db);
        res.json(updated);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.delete('/api/gifts/:id', async (req, res) => {
    try {
        const db = await readDB();
        const gId = parseInt(req.params.id);
        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== gId);
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== gId);
        await writeDB(db);
        res.status(204).send();
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.post('/api/gifts/:id/revert-to-idea', async (req, res) => {
    try {
        const db = await readDB();
        const gId = parseInt(req.params.id);
        const gift = db.purchasedGifts.find(g => g.id === gId);
        if(!gift) return res.status(404).send();
        const idea = { id: getNextId(db.giftIdeas), title: gift.name, estimatedPrice: gift.totalPrice, targetMemberId: gift.targetMemberId, creationDate: new Date().toISOString(), creatorId: gift.payerId, familyId: gift.familyId };
        db.giftIdeas.push(idea);
        db.purchasedGifts = db.purchasedGifts.filter(g => g.id !== gId);
        db.reimbursementStatus = db.reimbursementStatus.filter(s => s.giftId !== gId);
        await writeDB(db);
        res.json(idea);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.put('/api/status/:id', async (req, res) => {
    try {
        const db = await readDB();
        const idx = db.reimbursementStatus.findIndex(s => s.id === parseInt(req.params.id));
        if(idx === -1) return res.status(404).send();
        db.reimbursementStatus[idx] = { ...db.reimbursementStatus[idx], ...req.body };
        await writeDB(db);
        res.json(db.reimbursementStatus[idx]);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
