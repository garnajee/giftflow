/**
 * GiftFlow - Main Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let DB = {};
    let ADMIN_DB = { users: [], families: [], links: [] }; // Initialisé avec des tableaux vides
    const state = {
        authHeader: null,
        currentUser: null,
        userFamilies: [],
        selectedFamilyId: null,
        currentView: 'login', // login, familySelector, app, admin
        appSubView: 'dashboard',
        viewingMemberId: null,
        selectedArchiveYear: null,
        selectedArchiveMemberId: null,
        adminTab: 'users'
    };
    const translations = {};
    let currentLang = 'fr';

    // --- DOM ---
    const loginContainer = document.getElementById('login-container');
    const familyContainer = document.getElementById('family-selector-container');
    const appContainer = document.getElementById('app-container');
    const mainContent = document.getElementById('main-content');
    const familyList = document.getElementById('family-list');
    
    const currentUserSpan = document.getElementById('current-user-name');
    const navDashboard = document.getElementById('nav-dashboard');
    const navArchives = document.getElementById('nav-archives');
    const navLogo = document.getElementById('nav-logo');
    const navSwitch = document.getElementById('nav-switch');
    const navAdmin = document.getElementById('nav-admin');
    const langSwitcher = document.getElementById('lang-switcher');
    
    const addFab = document.getElementById('add-fab');
    const modal = document.getElementById('add-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const addForm = document.getElementById('add-form');
    const modalTypeSelector = document.getElementById('modal-type-selector');

    // --- UTILS ---
    const findById = (coll, id) => coll.find(i => i.id === id);
    const formatCurrency = (amt) => new Intl.NumberFormat(currentLang, { style: 'currency', currency: 'EUR' }).format(amt);
    const formatDate = (date) => new Date(date).toLocaleDateString(currentLang);
    
    const t = (key, params = {}) => {
        let text = key.split('.').reduce((o, i) => o?.[i], translations[currentLang]);
        if (!text) return `[${key}]`; // Affiche la clé pour déboguer si manquant
        for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
        return text;
    };

    // Fonction pour appliquer les traductions sur le DOM actuel
    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            el.innerHTML = t(el.dataset.translate);
        });
        // Traduction des éléments spécifiques non gérés par data-translate
        if(state.currentView === 'familySelector') {
            document.querySelector('#family-selector-container h2').textContent = t('familySelector.title');
        }
    }

    // --- API & AUTH ---
    async function apiFetch(url, options = {}) {
        const headers = { ...options.headers, 'Authorization': state.authHeader, 'Content-Type': 'application/json' };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) { window.handleLogout(); throw new Error("Auth error"); }
        if (!res.ok) throw new Error("API Error");
        if (res.status === 204) return;
        return res.json();
    }

    window.handleLogout = () => {
        state.authHeader = null;
        state.currentUser = null;
        state.userFamilies = [];
        state.selectedFamilyId = null;
        localStorage.removeItem('giftflowUser');
        localStorage.removeItem('giftflowAuth');
        document.getElementById('login-form').reset();
        document.getElementById('login-error').textContent = '';
        switchView('login');
    };

    async function handleLogin(e) {
        e.preventDefault();
        const u = e.target.username.value;
        const p = e.target.password.value;
        state.authHeader = `Basic ${btoa(u + ':' + p)}`;
        
        try {
            const res = await apiFetch('/api/login', { method: 'POST' });
            state.currentUser = res.user;
            state.userFamilies = res.families;
            localStorage.setItem('giftflowAuth', state.authHeader);
            
            if (state.userFamilies.length === 1) {
                selectFamily(state.userFamilies[0].id);
            } else if (state.userFamilies.length > 1) {
                switchView('familySelector');
            } else if (state.currentUser.isAdmin) {
                switchView('admin');
            } else {
                alert("No family assigned.");
                window.handleLogout();
            }
        } catch (e) {
            document.getElementById('login-error').textContent = t('login.error');
            state.authHeader = null;
        }
    }

    // --- INIT ---
    async function init() {
        // Load Language
        const savedLang = localStorage.getItem('giftflow_lang') || 'fr';
        langSwitcher.innerHTML = `<option value="fr">Français</option><option value="en">English</option>`;
        langSwitcher.value = savedLang;
        langSwitcher.onchange = (e) => loadLang(e.target.value);
        await loadLang(savedLang);

        // Setup Events
        document.getElementById('login-form').onsubmit = handleLogin;
        document.getElementById('logout-btn').onclick = window.handleLogout;
        
        const goToDashboard = (e) => { 
            e.preventDefault(); 
            if(state.selectedFamilyId) {
                state.appSubView = 'dashboard'; 
                switchView('app'); 
                renderApp(); 
            } else if (state.userFamilies.length > 1) {
                switchView('familySelector');
            }
        };
        navDashboard.onclick = goToDashboard;
        navLogo.onclick = goToDashboard;
        navArchives.onclick = (e) => { e.preventDefault(); state.appSubView = 'archives'; state.selectedArchiveYear = null; switchView('app'); renderApp(); };
        
        navSwitch.onclick = (e) => { e.preventDefault(); switchView('familySelector'); };
        navAdmin.onclick = (e) => { e.preventDefault(); switchView('admin'); };

        addFab.onclick = () => openAddModal();
        closeModalBtn.onclick = closeModal;
        window.onclick = (e) => { if(e.target === modal) closeModal(); };

        // Check Session
        const savedAuth = localStorage.getItem('giftflowAuth');
        if (savedAuth) {
            state.authHeader = savedAuth;
            try {
                const res = await apiFetch('/api/login', { method: 'POST' });
                state.currentUser = res.user;
                state.userFamilies = res.families;
                
                if (state.userFamilies.length === 1) {
                    selectFamily(state.userFamilies[0].id);
                } else if (state.userFamilies.length > 1) {
                    switchView('familySelector');
                } else if (state.currentUser.isAdmin) {
                    switchView('admin');
                }
            } catch (e) { window.handleLogout(); }
        } else {
            switchView('login');
        }
    }

    async function loadLang(lang) {
        if(!translations[lang]) {
            try {
                const res = await fetch(`/locales/${lang}.json`);
                translations[lang] = await res.json();
            } catch(e) { console.error("Lang error"); return; }
        }
        currentLang = lang;
        localStorage.setItem('giftflow_lang', lang);
        document.documentElement.lang = lang;
        
        applyTranslations(); // Applique les traductions statiques

        // Refresh current view content
        if(state.currentUser) {
            currentUserSpan.textContent = `${t('header.loggedInAs')} ${state.currentUser.username}`;
            if(state.currentView === 'app') renderApp();
            if(state.currentView === 'admin') renderAdmin(); // Re-render admin to apply lang
            if(state.currentView === 'familySelector') renderFamilySelector();
        }
    }

    // --- VIEW MANAGER ---
    function switchView(view) {
        state.currentView = view;
        loginContainer.classList.remove('active');
        familyContainer.style.display = 'none';
        appContainer.classList.remove('active');
        
        // Header Links Visibility
        if (state.currentUser) {
            navAdmin.classList.toggle('hidden', !state.currentUser.isAdmin);
            navSwitch.classList.toggle('hidden', state.userFamilies.length <= 1);
        }

        if (view === 'login') loginContainer.classList.add('active');
        if (view === 'familySelector') {
            familyContainer.style.display = 'block';
            renderFamilySelector();
        }
        if (view === 'app') {
            appContainer.classList.add('active');
            renderApp();
        }
        if (view === 'admin') {
            appContainer.classList.add('active');
            loadAndRenderAdmin();
        }
        applyTranslations(); // Traduit les éléments statiques nouvellement affichés
    }

    window.selectFamily = async (id) => {
        state.selectedFamilyId = id;
        try {
            DB = await apiFetch(`/api/family/${id}/data`);
            state.appSubView = 'dashboard';
            switchView('app');
        } catch(e) { alert("Error loading family"); }
    };

    function renderFamilySelector() {
        document.querySelector('#family-selector-container h2').textContent = t('familySelector.title');
        familyList.innerHTML = state.userFamilies.map(f => `
            <div class="family-card" onclick="window.selectFamily(${f.id})">
                <h3>${f.name}</h3>
                <p>${t('familySelector.clickToEnter')}</p>
            </div>
        `).join('');
    }

    // --- APP RENDERERS ---
    function renderApp() {
        currentUserSpan.textContent = `${t('header.loggedInAs')} ${state.currentUser.username}`;
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        addFab.style.display = 'none';

        if(state.currentView === 'admin') {
            navAdmin.classList.add('active');
            return;
        }

        if(state.appSubView === 'dashboard') {
            navDashboard.classList.add('active');
            const others = DB.members.filter(m => m.id !== state.currentUser.id);
            mainContent.innerHTML = `<h2 class="section-title">${t('dashboard.title')}</h2><div class="grid-container">${others.map(m => {
                const iC = DB.giftIdeas.filter(i => i.targetMemberId === m.id).length;
                const pC = DB.purchasedGifts.filter(g => g.targetMemberId === m.id && new Date(g.purchaseDate).getFullYear() === new Date().getFullYear()).length;
                return `<div class="member-card" onclick="window.viewMember(${m.id})"><h3>${m.username}</h3><p>${iC} ${iC===1?t('dashboard.ideas_one'):t('dashboard.ideas_other')} | ${pC} ${pC===1?t('dashboard.purchases_one'):t('dashboard.purchases_other')}</p></div>`;
            }).join('')}</div>`;
        }
        
        if(state.appSubView === 'memberProfile') {
            navDashboard.classList.add('active');
            addFab.style.display = 'flex';
            const m = findById(DB.members, state.viewingMemberId);
            if(!m) { state.appSubView = 'dashboard'; renderApp(); return; }
            const ideas = DB.giftIdeas.filter(i => i.targetMemberId === m.id);
            const gifts = DB.purchasedGifts.filter(g => g.targetMemberId === m.id && new Date(g.purchaseDate).getFullYear() === new Date().getFullYear());
            
            mainContent.innerHTML = `<h2 class="section-title">${t('memberProfile.title', {name: m.username})}</h2>
            <h3>${t('memberProfile.ideasTitle', {count: ideas.length})}</h3><div class="grid-container">${ideas.length > 0 ? ideas.map(renderIdeaCard).join('') : `<p>${t('memberProfile.noIdeas')}</p>`}</div>
            <h3 style="margin-top:2rem">${t('memberProfile.purchasesTitle', {count: gifts.length})}</h3><div class="grid-container">${gifts.length > 0 ? gifts.map(renderGiftCard).join('') : `<p>${t('memberProfile.noPurchases')}</p>`}</div>`;
        }

        if(state.appSubView === 'archives') {
            navArchives.classList.add('active');
            const curYear = new Date().getFullYear();
            const past = DB.purchasedGifts.filter(g => new Date(g.purchaseDate).getFullYear() < curYear);
            const years = [...new Set(past.map(g => new Date(g.purchaseDate).getFullYear()))].sort((a,b)=>b-a);
            
            let html = `<h2 class="section-title">${t('archives.title')}</h2><div class="archive-controls">${years.map(y => `<button class="btn year-btn ${state.selectedArchiveYear===y?'active':''}" onclick="window.selectArchiveYear(${y})">${y}</button>`).join('')}</div>`;
            
            if(state.selectedArchiveYear) {
                const yearGifts = past.filter(g => new Date(g.purchaseDate).getFullYear() === state.selectedArchiveYear);
                if(!state.selectedArchiveMemberId) {
                    const mids = [...new Set(yearGifts.map(g => g.targetMemberId))];
                    html += `<h3 class="sub-title">${t('archives.giftsForWhom', {year: state.selectedArchiveYear})}</h3>`;
                    if(mids.length > 0) {
                        html += `<div class="grid-container">${mids.map(id => {
                            const m = findById(DB.members, id);
                            if(!m) return '';
                            const gc = yearGifts.filter(g=>g.targetMemberId===id).length;
                            return `<div class="member-card archive-member-card" onclick="window.selectArchiveMember(${id})"><h3>${m.username}</h3><p>${gc} ${gc===1?t('archives.giftsReceived_one'):t('archives.giftsReceived_other')}</p></div>`;
                        }).join('')}</div>`;
                    } else { html += `<p>${t('archives.noGiftsForYear')}</p>`; }
                } else {
                    const m = findById(DB.members, state.selectedArchiveMemberId);
                    const mg = yearGifts.filter(g => g.targetMemberId === m.id);
                    html += `<div class="archive-header"><h3 class="sub-title">${t('archives.giftsForMemberInYear', {name: m.username, year: state.selectedArchiveYear})}</h3><button class="btn btn-secondary" onclick="window.selectArchiveMember(null)">${t('archives.backButton')}</button></div><div class="grid-container">${mg.map(renderGiftCard).join('')}</div>`;
                }
            } else { html += `<p class="sub-title">${t('archives.selectYear')}</p>`; }
            mainContent.innerHTML = html;
        }
    }

    // Windows global for inline HTML events
    window.viewMember = (id) => { state.viewingMemberId = id; state.appSubView = 'memberProfile'; renderApp(); };
    window.selectArchiveYear = (y) => { state.selectedArchiveYear = y; state.selectedArchiveMemberId = null; renderApp(); };
    window.selectArchiveMember = (id) => { state.selectedArchiveMemberId = id; renderApp(); };

    // --- CARDS ---
    function renderIdeaCard(i) {
        const creator = findById(DB.members, i.creatorId)?.username || '?';
        return `<div class="gift-card" data-idea-id="${i.id}">
            <h4>${i.title}<div class="card-actions"><button class="action-btn edit-price-btn" title="${t('giftCard.editPrice')}">✏️</button><button class="action-btn convert-btn" title="${t('giftCard.convertToPurchase')}">🛒</button><button class="action-btn delete-btn" title="${t('giftCard.deleteIdea')}">🗑️</button></div></h4>
            <div class="price-container">${i.estimatedPrice ? `<div class="price">${formatCurrency(i.estimatedPrice)} ${t('giftCard.priceEstimated')}</div>` : `<div class="price">${t('giftCard.priceUndefined')}</div>`}</div>
            <div class="meta">${t('giftCard.createdBy', {name: creator, date: formatDate(i.creationDate)})}</div>
        </div>`;
    }

    function renderGiftCard(g) {
        const payer = findById(DB.members, g.payerId)?.username || '?';
        const statuses = DB.reimbursementStatus.filter(s => s.giftId === g.id);
        const share = g.totalPrice / g.reimbursementMemberIds.length;
        return `<div class="gift-card" data-gift-id="${g.id}">
            <h4>${g.name}<div class="card-actions">
                <button class="action-btn revert-to-idea-btn" title="${t('purchasedCard.revertToIdea')}">💡</button>
                <button class="action-btn edit-gift-btn" title="${t('purchasedCard.editGift')}">✏️</button>
                <button class="action-btn delete-btn" title="${t('purchasedCard.deleteGift')}">🗑️</button>
            </div></h4>
            <div class="price">${formatCurrency(g.totalPrice)}</div>
            <p>${t('purchasedCard.purchasedAt', {store: g.store, date: formatDate(g.purchaseDate)})}</p>
            <p>${t('purchasedCard.paidBy', {name: payer})}</p>
            <table class="reimbursement-table">
                <thead><tr><th>${t('reimbursement.tableHeaderMember')}</th><th>${t('reimbursement.tableHeaderStatus')}</th><th>${t('reimbursement.tableHeaderActions')}</th></tr></thead>
                <tbody>${statuses.map(s => {
                    const m = findById(DB.members, s.memberId);
                    if(!m) return '';
                    const canEdit = state.currentUser.id !== g.targetMemberId; 
                    let sC='', sT='', rT='';
                    if(s.status==='Non Remboursé'){sC='status-unpaid';sT=`<span class="status-tag unpaid">${t('reimbursement.statusUnpaid')}</span>`;}
                    if(s.status==='Tout Remboursé'){sC='status-paid';sT=`<span class="status-tag paid">${t('reimbursement.statusPaid')}</span>`;}
                    if(s.status==='Partiellement Remboursé'){sC='status-partial';sT=`<span class="status-tag partial">${t('reimbursement.statusPartial',{amount:formatCurrency(s.amountPaid)})}</span>`; rT=`<div class="remaining-amount">${t('reimbursement.remaining',{amount:formatCurrency(share-s.amountPaid)})}</div>`;}
                    const acts = canEdit ? `<div class="user-actions">
                        <button class="btn-status-change" data-new-status="Tout Remboursé">${t('reimbursement.actionPaid')}</button>
                        <button class="btn-status-change" data-new-status="Non Remboursé">${t('reimbursement.actionUnpaid')}</button>
                        <input type="number" class="input-partial-payment" placeholder="${t('reimbursement.amountPlaceholder')}" step="0.01">
                        <button class="btn-partial-payment">${t('reimbursement.actionPartial')}</button>
                    </div>` : '—';
                    return `<tr class="${sC}" data-status-id="${s.id}" data-amount-due="${share}"><td>${m.username}<br><small>${t('reimbursement.amountDue',{amount:formatCurrency(share)})}</small></td><td>${sT}${rT}</td><td>${acts}</td></tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
    }

    // Delegation for Cards
    mainContent.addEventListener('click', async (e) => {
        const card = e.target.closest('.gift-card');
        
        // Status/Partial Actions (inside card but specific DOM)
        if (e.target.closest('.btn-status-change')) {
            const btn = e.target.closest('.btn-status-change');
            const row = btn.closest('tr');
            const sId = row.dataset.statusId;
            const due = parseFloat(row.dataset.amountDue);
            const status = btn.dataset.newStatus;
            await apiFetch(`/api/status/${sId}`, { method: 'PUT', body: JSON.stringify({ status, amountPaid: status === 'Tout Remboursé' ? due : 0 }) });
            refresh();
            return;
        }
        if (e.target.closest('.btn-partial-payment')) {
            const btn = e.target.closest('.btn-partial-payment');
            const row = btn.closest('tr');
            const input = row.querySelector('.input-partial-payment');
            const val = parseFloat(input.value);
            const due = parseFloat(row.dataset.amountDue);
            if (!isNaN(val)) {
                await apiFetch(`/api/status/${row.dataset.statusId}`, { method: 'PUT', body: JSON.stringify({ 
                    amountPaid: val, 
                    status: val >= due ? 'Tout Remboursé' : 'Partiellement Remboursé' 
                }) });
                refresh();
            }
            return;
        }

        if(!card) return;
        const iId = parseInt(card.dataset.ideaId);
        const gId = parseInt(card.dataset.giftId);

        if(e.target.closest('.edit-price-btn')) {
            const i = findById(DB.giftIdeas, iId);
            card.querySelector('.price-container').innerHTML = `<input type="number" class="price-input" step="0.01" value="${i.estimatedPrice||''}">`;
            card.querySelector('.card-actions').innerHTML = `<button class="action-btn save-p">✅</button><button class="action-btn cancel-p">❌</button>`;
        }
        if(e.target.closest('.save-p')) {
            const v = parseFloat(card.querySelector('.price-input').value) || null;
            await apiFetch(`/api/ideas/${iId}`, { method: 'PUT', body: JSON.stringify({ estimatedPrice: v }) });
            refresh();
        }
        if(e.target.closest('.cancel-p')) refresh();
        if(e.target.closest('.convert-btn')) openAddModalForConversion(findById(DB.giftIdeas, iId));
        if(e.target.closest('.edit-gift-btn')) openEditGiftModal(findById(DB.purchasedGifts, gId));
        if(e.target.closest('.revert-to-idea-btn')) { if(confirm(t('alerts.confirmRevertIdea'))) { await apiFetch(`/api/gifts/${gId}/revert-to-idea`, { method: 'POST' }); refresh(); } }
        if(e.target.closest('.delete-btn')) {
            if(iId && confirm(t('alerts.confirmDeleteIdea'))) { await apiFetch(`/api/ideas/${iId}`, { method: 'DELETE' }); refresh(); }
            else if(gId && confirm(t('alerts.confirmDeleteGift'))) { await apiFetch(`/api/gifts/${gId}`, { method: 'DELETE' }); refresh(); }
        }
    });

    async function refresh() {
        if(state.selectedFamilyId) DB = await apiFetch(`/api/family/${state.selectedFamilyId}/data`);
        renderApp();
    }

    // --- MODAL ---
    function openModal(title, html) {
        modal.querySelector('#modal-title').textContent = title;
        modalTypeSelector.style.display = 'none';
        addForm.innerHTML = html;
        addForm.classList.add('visible');
        modal.classList.add('active');
    }
    function closeModal() { modal.classList.remove('active'); addForm.innerHTML=''; }

    window.openAddModal = () => {
        modal.querySelector('#modal-title').textContent = t('modal.addTitle');
        modalTypeSelector.style.display = 'block';
        addForm.innerHTML = ''; addForm.classList.remove('visible');
        delete addForm.dataset.adminAction; delete addForm.dataset.convertId; delete addForm.dataset.editGiftId;
        modalTypeSelector.querySelectorAll('.btn').forEach(b => {
            b.classList.remove('active');
            b.onclick = () => { renderForm(b.dataset.formType); b.classList.add('active'); };
        });
        modal.classList.add('active');
    };

    function openAddModalForConversion(idea) {
        window.openAddModal(); modalTypeSelector.style.display='none';
        addForm.dataset.convertId = idea.id;
        renderForm('purchase');
        addForm.querySelector('[name=name]').value = idea.title;
        if(idea.estimatedPrice) addForm.querySelector('[name=totalPrice]').value = idea.estimatedPrice;
    }

    function openEditGiftModal(gift) {
        window.openAddModal(); modalTypeSelector.style.display='none';
        modal.querySelector('#modal-title').textContent = t('modal.editTitle');
        addForm.dataset.editGiftId = gift.id;
        renderForm('purchase', true);
        addForm.querySelector('[name=name]').value = gift.name;
        addForm.querySelector('[name=totalPrice]').value = gift.totalPrice;
        addForm.querySelector('[name=store]').value = gift.store;
        addForm.querySelector('[name=purchaseDate]').value = new Date(gift.purchaseDate).toISOString().slice(0,10);
        addForm.querySelector('[name=payerId]').value = gift.payerId;
        gift.reimbursementMemberIds.forEach(mid => { const c = addForm.querySelector(`input[value="${mid}"]`); if(c) c.checked=true; });
        addForm.querySelector('.submit-btn').textContent = t('modal.editGiftBtn');
    }

    function renderForm(type, isEdit=false) {
        addForm.dataset.type = type;
        const tm = findById(DB.members, state.viewingMemberId);
        let h = '';
        if (type === 'idea') {
            h = `<div class="input-group"><label>${t('modal.ideaName')}</label><input type="text" name="title" required></div>
                 <div class="input-group"><label>${t('modal.ideaPrice')}</label><input type="number" name="estimatedPrice" step="0.01"></div>
                 <input type="hidden" name="targetMemberId" value="${tm.id}"><p>${t('modal.for', {name: tm.username})}</p>
                 <button class="btn btn-primary submit-btn">${t('modal.addIdeaBtn')}</button>`;
        } else {
            const opts = DB.members.map(m => `<option value="${m.id}">${m.username}</option>`).join('');
            const chks = DB.members.map(m => `<label><span>${m.username}</span><input type="checkbox" name="mids" value="${m.id}"></label>`).join('');
            h = `<div class="input-group"><label>${t('modal.giftName')}</label><input type="text" name="name" required></div>
                 <div class="input-group"><label>${t('modal.giftPrice')}</label><input type="number" name="totalPrice" step="0.01" required></div>
                 <div class="input-group"><label>${t('modal.giftStore')}</label><input type="text" name="store" required></div>
                 <div class="input-group"><label>${t('modal.giftDate')}</label><input type="date" name="purchaseDate" required value="${new Date().toISOString().slice(0,10)}"></div>
                 <div class="input-group"><label>${t('modal.giftPayer')}</label><select name="payerId">${opts}</select></div>
                 <div class="input-group"><label>${t('modal.giftParticipants')}</label><div class="checkbox-group">${chks}</div></div>
                 <input type="hidden" name="targetMemberId" value="${tm.id}"><p>${t('modal.for', {name: tm.username})}</p>
                 <button class="btn btn-primary submit-btn">${isEdit ? t('modal.editGiftBtn') : t('modal.addGiftBtn')}</button>`;
        }
        addForm.innerHTML = h; addForm.classList.add('visible');
    }

    addForm.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const adminAction = addForm.dataset.adminAction;

        if (adminAction) {
            try {
                if(adminAction === 'addUser') {
                    await apiFetch('/api/admin/users', { 
                        method: 'POST', 
                        body: JSON.stringify({username: fd.get('u'), password: fd.get('p'), isAdmin: fd.get('a')==='on', familyIds: Array.from(document.querySelectorAll('input[name=fams]:checked')).map(c=>c.value) }) 
                    });
                }
                if(adminAction === 'editUser') {
                    await apiFetch(`/api/admin/users/${addForm.dataset.adminId}`, { 
                        method: 'PUT', 
                        body: JSON.stringify({username: fd.get('u'), password: fd.get('p'), isAdmin: fd.get('a')==='on', familyIds: Array.from(document.querySelectorAll('input[name=fams]:checked')).map(c=>c.value) }) 
                    });
                }
              if(adminAction === 'addFam') {
                await apiFetch('/api/admin/families', { method: 'POST', body: JSON.stringify({name: fd.get('n')}) });
              }

              if(adminAction === 'editFam') {
                await apiFetch(`/api/admin/families/${addForm.dataset.adminId}`, { method: 'PUT', body: JSON.stringify({name: fd.get('n')}) });
                }
                
                // NOUVEAU: Gestion des membres de famille depuis l'onglet famille
                if(adminAction === 'editFamilyMembers') {
                    const memberIds = Array.from(document.querySelectorAll('input[name=memberIds]:checked')).map(c=>c.value);
                    await apiFetch(`/api/admin/families/${addForm.dataset.adminId}/members`, { method: 'PUT', body: JSON.stringify({ memberIds }) });
                }

                closeModal(); loadAndRenderAdmin();
            } catch(e) { console.error(e); alert("Admin Error"); }
            return;
        }

        // App logic
        const type = addForm.dataset.type;
        const payload = { familyId: state.selectedFamilyId };
        try {
            if (type === 'idea') {
                payload.title = fd.get('title');
                payload.estimatedPrice = parseFloat(fd.get('estimatedPrice')) || null;
                payload.targetMemberId = state.viewingMemberId;
                payload.creatorId = state.currentUser.id;
                payload.creationDate = new Date().toISOString();
                await apiFetch('/api/ideas', { method: 'POST', body: JSON.stringify(payload) });
            } else {
                payload.name = fd.get('name');
                payload.totalPrice = parseFloat(fd.get('totalPrice'));
                payload.store = fd.get('store');
                payload.purchaseDate = new Date(fd.get('purchaseDate')).toISOString();
                payload.payerId = parseInt(fd.get('payerId'));
                payload.targetMemberId = state.viewingMemberId;
                payload.reimbursementMemberIds = Array.from(document.querySelectorAll('input[name=mids]:checked')).map(c => parseInt(c.value));
                if(addForm.dataset.editGiftId) await apiFetch(`/api/gifts/${addForm.dataset.editGiftId}`, { method: 'PUT', body: JSON.stringify(payload) });
                else {
                    let url = '/api/gifts'; if(addForm.dataset.convertId) url+=`?deleteIdeaId=${addForm.dataset.convertId}`;
                    await apiFetch(url, { method: 'POST', body: JSON.stringify(payload) });
                }
            }
            closeModal(); refresh();
        } catch(e) { alert("Save Error"); }
    };

    // --- ADMIN DASHBOARD ---
    async function loadAndRenderAdmin() {
        try {
            ADMIN_DB = await apiFetch('/api/admin/data');
            // Check if data loaded correctly
            if (!ADMIN_DB.users) ADMIN_DB.users = [];
            if (!ADMIN_DB.families) ADMIN_DB.families = [];
            if (!ADMIN_DB.links) ADMIN_DB.links = [];
            
            renderAdmin();
        } catch(e) { mainContent.innerHTML = "Admin Load Error"; }
    }

function renderAdmin() {
        navDashboard.classList.remove('active');
        navArchives.classList.remove('active');
        navAdmin.classList.add('active');
        addFab.style.display = 'none';

        mainContent.innerHTML = `
            <h2 class="section-title">${t('admin.title')}</h2>
            <div class="archive-controls">
                <button class="btn year-btn ${state.adminTab==='users'?'active':''}" onclick="window.setAdminTab('users')">${t('admin.tabUsers')}</button>
                <button class="btn year-btn ${state.adminTab==='families'?'active':''}" onclick="window.setAdminTab('families')">${t('admin.tabFamilies')}</button>
            </div>
            <div id="admin-panel"></div>
        `;
        const p = document.getElementById('admin-panel');
        if(state.adminTab === 'users') {
            p.innerHTML = `<button class="btn btn-primary" onclick="window.admAddUser()">${t('admin.addUser')}</button>
            <table class="reimbursement-table"><thead><tr><th>${t('admin.username')}</th><th>${t('admin.isAdmin')}</th><th>${t('admin.families')}</th><th>${t('admin.actions')}</th></tr></thead>
            <tbody>${ADMIN_DB.users.map(u => {
                const fams = ADMIN_DB.links.filter(l=>l.userId===u.id).map(l=>ADMIN_DB.families.find(f=>f.id===l.familyId)?.name).filter(Boolean).join(', ');
                return `<tr><td>${u.username}</td><td>${u.isAdmin?t('admin.yes'):t('admin.no')}</td><td>${fams}</td><td><button class="btn btn-secondary" onclick="window.admEditUser(${u.id})">${t('admin.edit')}</button></td></tr>`;
            }).join('')}</tbody></table>`;
        } else {
            p.innerHTML = `<button class="btn btn-primary" onclick="window.admAddFam()">${t('admin.addFamily')}</button>
            <table class="reimbursement-table"><thead><tr><th>${t('admin.name')}</th><th>${t('admin.members')}</th><th>${t('admin.actions')}</th></tr></thead>
            <tbody>${ADMIN_DB.families.map(f => {
                const c = ADMIN_DB.links.filter(l=>l.familyId===f.id).length;
                return `<tr>
                    <td>${f.name}</td>
                    <td>${c}</td>
                    <td class="actions">
                        <button class="btn btn-secondary" onclick="window.admEditFam(${f.id})">${t('admin.edit')}</button>
                        <button class="btn btn-secondary" onclick="window.admManage(${f.id})">${t('admin.manage')}</button>
                        <!-- NOUVEAU BOUTON -->
                        <button class="btn btn-danger" onclick="window.admDeleteFam(${f.id})">🗑️</button>
                    </td>
                </tr>`;
            }).join('')}</tbody></table>`;
        }
    }

    window.setAdminTab = (t) => { state.adminTab = t; renderAdmin(); };
    
    window.admAddUser = () => {
        const fams = ADMIN_DB.families.map(f => `<label><span>${f.name}</span><input type="checkbox" name="fams" value="${f.id}"></label>`).join('');
        openModal(t('admin.addUser'), `<div class="input-group"><label>${t('admin.username')}</label><input name="u" required></div><div class="input-group"><label>${t('admin.password')}</label><input name="p" required></div><div class="input-group"><label>${t('admin.isAdmin')}</label><input type="checkbox" name="a"></div><div class="input-group"><label>${t('admin.families')}</label><div class="checkbox-group">${fams}</div></div><button class="btn btn-primary submit-btn">${t('admin.save')}</button>`);
        addForm.dataset.adminAction = 'addUser';
    };
    
    window.admEditUser = (id) => {
        const u = ADMIN_DB.users.find(u=>u.id===id);
        const fams = ADMIN_DB.families.map(f => {
            const has = ADMIN_DB.links.some(l=>l.userId===id && l.familyId===f.id);
            return `<label><span>${f.name}</span><input type="checkbox" name="fams" value="${f.id}" ${has?'checked':''}></label>`;
        }).join('');
        openModal(t('admin.edit'), `<div class="input-group"><label>${t('admin.username')}</label><input name="u" value="${u.username}" required></div><div class="input-group"><label>${t('admin.password')}</label><input name="p" value="${u.password}" required></div><div class="input-group"><label>${t('admin.isAdmin')}</label><input type="checkbox" name="a" ${u.isAdmin?'checked':''}></div><div class="input-group"><label>${t('admin.families')}</label><div class="checkbox-group">${fams}</div></div><button class="btn btn-primary submit-btn">${t('admin.save')}</button>`);
        addForm.dataset.adminAction = 'editUser'; addForm.dataset.adminId = id;
    };
    
    window.admAddFam = () => {
        openModal(t('admin.addFamily'), `<div class="input-group"><label>${t('admin.name')}</label><input name="n" required></div><button class="btn btn-primary submit-btn">${t('admin.create')}</button>`);
        addForm.dataset.adminAction = 'addFam';
    };

    window.admEditFam = (id) => {
        const fam = ADMIN_DB.families.find(f => f.id === id);
        openModal(t('admin.edit'), `<div class="input-group"><label>${t('admin.name')}</label><input name="n" value="${fam.name}" required></div><button class="btn btn-primary submit-btn">${t('admin.save')}</button>`);
        addForm.dataset.adminAction = 'editFam';
        addForm.dataset.adminId = id;
    };

    window.admDeleteFam = async (id) => {
        // Message en dur ou via t('alerts...') si vous l'ajoutez aux JSON
        if (confirm("Attention : Supprimer cette famille supprimera aussi TOUS les cadeaux et idées associés. Continuer ?")) {
            try {
                await apiFetch(`/api/admin/families/${id}`, { method: 'DELETE' });
                loadAndRenderAdmin();
            } catch (e) {
                alert("Erreur lors de la suppression.");
            }
        }
    };
    
    // Fonction pour gérer les membres d'une famille depuis l'onglet Familles
    window.admManage = (fid) => {
        const fam = ADMIN_DB.families.find(f=>f.id===fid);
        const checks = ADMIN_DB.users.map(u => {
            const has = ADMIN_DB.links.some(l => l.familyId===fid && l.userId===u.id);
            return `<label><span>${u.username}</span><input type="checkbox" name="memberIds" value="${u.id}" ${has?'checked':''}></label>`;
        }).join('');
        openModal(t('admin.manageMembersTitle', {name: fam.name}), `<div class="input-group"><div class="checkbox-group">${checks}</div></div><button class="btn btn-primary submit-btn">${t('admin.save')}</button>`);
        addForm.dataset.adminAction = 'editFamilyMembers';
        addForm.dataset.adminId = fid;
    };

    // Start
    init();
});
