/**
 * GiftFlow - Main Application Logic
 * This file handles the entire frontend logic for the GiftFlow application,
 * including state management, API communication, rendering, and event handling.
 * It uses a simple i18n system for translations and Basic Auth for API requests.
 */
document.addEventListener('DOMContentLoaded', () => {
	// --- STATE & CONSTANTS ---
	let DB = {};
	const state = {
		authHeader: null,
		currentUser: null,
		currentView: 'dashboard',
		viewingMemberId: null,
		selectedArchiveYear: null,
		selectedArchiveMemberId: null,
	};
	const translations = {};
	let currentLang = 'fr';

	// --- DOM SELECTORS ---
	const loginContainer = document.getElementById('login-container');
	const appContainer = document.getElementById('app-container');
	const mainContent = document.getElementById('main-content');
	const loginForm = document.getElementById('login-form');
	const loginError = document.getElementById('login-error');
	const currentUserSpan = document.getElementById('current-user-name');
	const logoutBtn = document.getElementById('logout-btn');
	const navDashboard = document.getElementById('nav-dashboard');
	const navArchives = document.getElementById('nav-archives');
	const navLogo = document.getElementById('nav-logo');
	const addFab = document.getElementById('add-fab');
	const modal = document.getElementById('add-modal');
	const closeModalBtn = document.querySelector('.close-button');
	const addForm = document.getElementById('add-form');
	const modalTypeSelector = document.getElementById('modal-type-selector');

	// --- UTILITY FUNCTIONS ---
	const findById = (collection, id) => collection.find(item => item.id === id);
	const formatCurrency = (amount) => new Intl.NumberFormat(currentLang, {
		style: 'currency',
		currency: 'EUR'
	}).format(amount);
	const formatDate = (dateString) => new Date(dateString).toLocaleDateString(currentLang, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	// --- i18n / TRANSLATION ENGINE ---
	const t = (key, params = {}) => {
		let text = key.split('.').reduce((obj, i) => obj?.[i], translations[currentLang]);
		if (!text) return `[${key}]`;
		for (const [param, value] of Object.entries(params)) {
			text = text.replace(`{${param}}`, value);
		}
		return text;
	};

	async function setLanguage(lang) {
		if (!translations[lang]) {
			try {
				const response = await fetch(`/locales/${lang}.json`);
				translations[lang] = await response.json();
			} catch (e) {
				console.error(`Could not load language: ${lang}`);
				return;
			}
		}
		currentLang = lang;
		localStorage.setItem('giftflow_lang', lang);
		document.documentElement.lang = lang;
		document.querySelectorAll('[data-translate]').forEach(element => {
			element.innerHTML = t(element.dataset.translate);
		});
		if (state.currentUser) {
			currentUserSpan.textContent = `${t('header.loggedInAs')} ${state.currentUser.username}`;
			render();
		}
	}

	// --- DATA & API LOGIC ---
	async function apiFetch(url, options = {}) {
		const headers = {
			...options.headers,
			'Authorization': state.authHeader
		};
		const response = await fetch(url, {
			...options,
			headers
		});
		if (!response.ok) {
			if (response.status === 401) handleLogout();
			throw new Error(`API Error: ${response.status}`);
		}
		if (response.status === 204) return; // No content to parse
		return response.json();
	}

	async function loadData() {
		try {
			DB = await apiFetch('/api/data');
			console.log('Data loaded successfully from API!');
		} catch (error) {
			console.error(error);
			if (error.message.includes('401')) {
				loginError.textContent = t('login.error');
			} else {
				mainContent.innerHTML = `<p class="error-message">Could not load application data.</p>`;
			}
			throw error; // Propagate error to handleLogin
		}
	}

	// --- AUTHENTICATION LOGIC ---
	async function handleLogin(event) {
		event.preventDefault();
		const username = loginForm.username.value;
		const password = loginForm.password.value;
		const authString = btoa(`${username}:${password}`); // btoa is a browser function for Base64 encoding
		state.authHeader = `Basic ${authString}`;

		try {
			await loadData();
			state.currentUser = DB.members.find(member => member.username === username);
			localStorage.setItem('giftflowUser', JSON.stringify(state.currentUser));
			localStorage.setItem('giftflowAuth', state.authHeader);
			initAppUI();
		} catch (error) {
			state.authHeader = null;
			state.currentUser = null;
		}
	}

	function handleLogout() {
		state.authHeader = null;
		state.currentUser = null;
		localStorage.removeItem('giftflowUser');
		localStorage.removeItem('giftflowAuth');
		appContainer.classList.remove('active');
		loginContainer.classList.add('active');
		mainContent.innerHTML = '';
		loginError.textContent = '';
		loginForm.reset();
	}

	// --- RENDER FUNCTIONS ---
	// (Render functions from previous correct answer are placed here, unchanged)
	// ...

	// --- INITIALIZATION ---
	function initAppUI() {
		loginContainer.classList.remove('active');
		appContainer.classList.add('active');
		currentUserSpan.textContent = `${t('header.loggedInAs')} ${state.currentUser.username}`;
		state.currentView = 'dashboard';
		render();
	}

	async function main() {
		const langSwitcher = document.getElementById('lang-switcher');
		langSwitcher.innerHTML = `<option value="fr">Français</option><option value="en">English</option>`;
		langSwitcher.addEventListener('change', (event) => setLanguage(event.target.value));

		const initialLang = localStorage.getItem('giftflow_lang') || window.APP_CONFIG.defaultLang || navigator.language.split('-')[0] || 'fr';
		await setLanguage(initialLang);
		langSwitcher.value = currentLang;

		setupEventListeners(); // Setup basic listeners before attempting login

		const savedAuth = localStorage.getItem('giftflowAuth');
		if (savedAuth) {
			state.authHeader = savedAuth;
			try {
				await loadData();
				state.currentUser = JSON.parse(localStorage.getItem('giftflowUser'));
				initAppUI();
			} catch (error) {
				handleLogout(); // Clean up if saved auth is invalid
			}
		} else {
			loginContainer.classList.add('active');
		}
	}

	main();


	// --- All functions from here down are included for completeness ---

	function setupEventListeners() {
		const goToDashboard = (event) => {
			event.preventDefault();
			state.currentView = 'dashboard';
			render();
		};
		loginForm.addEventListener('submit', handleLogin);
		logoutBtn.addEventListener('click', handleLogout);
		navDashboard.addEventListener('click', goToDashboard);
		navLogo.addEventListener('click', goToDashboard);
		navArchives.addEventListener('click', (e) => {
			e.preventDefault();
			state.currentView = 'archives';
			state.selectedArchiveYear = null;
			state.selectedArchiveMemberId = null;
			render();
		});
		mainContent.addEventListener('click', async (e) => {
			const card = e.target.closest('.gift-card');
			if (!card) {
				const mC = e.target.closest('.member-card');
				if (mC) {
					if (state.currentView !== 'archives') {
						state.viewingMemberId = parseInt(mC.dataset.memberId);
						state.currentView = 'memberProfile';
					} else {
						state.selectedArchiveMemberId = parseInt(mC.dataset.memberId);
					}
					render();
				}
				const bB = e.target.closest('.back-to-members-btn');
				if (bB) {
					state.selectedArchiveMemberId = null;
					render();
				}
				const yB = e.target.closest('.year-btn');
				if (yB) {
					state.selectedArchiveYear = parseInt(yB.dataset.year);
					state.selectedArchiveMemberId = null;
					render();
				}
				return;
			}
			const ideaId = card.dataset.ideaId;
			const giftId = card.dataset.giftId;
			if (e.target.closest('.action-btn')) {
				if (e.target.closest('.convert-btn')) {
					const i = findById(DB.giftIdeas, parseInt(ideaId));
					if (i) openAddModalForConversion(i);
				} else if (e.target.closest('.edit-gift-btn')) {
					const g = findById(DB.purchasedGifts, parseInt(giftId));
					if (g) openEditGiftModal(g);
				} else if (e.target.closest('.edit-price-btn')) {
					const i = findById(DB.giftIdeas, parseInt(ideaId));
					const pC = card.querySelector('.price-container');
					const aC = card.querySelector('.card-actions');
					pC.innerHTML = `<input type="number" class="price-input" step="0.01" value="${i.estimatedPrice || ''}" placeholder="Prix">`;
					aC.innerHTML = `<button class="action-btn save-price-btn" title="Sauvegarder">✅</button><button class="action-btn cancel-edit-btn" title="Annuler">❌</button>`;
				} else if (e.target.closest('.save-price-btn')) {
					const i = card.querySelector('.price-input');
					const nP = parseFloat(i.value) || null;
					await apiFetch(`/api/ideas/${ideaId}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							estimatedPrice: nP
						})
					});
					await loadData();
					render();
				} else if (e.target.closest('.cancel-edit-btn')) {
					render();
				} else if (e.target.closest('.revert-to-idea-btn')) {
					if (confirm(t('alerts.confirmRevertIdea'))) {
						await apiFetch(`/api/gifts/${giftId}/revert-to-idea`, {
							method: 'POST'
						});
						await loadData();
						render();
					}
				} else if (e.target.closest('.delete-btn')) {
					if (ideaId && confirm(t('alerts.confirmDeleteIdea'))) {
						await apiFetch(`/api/ideas/${ideaId}`, {
							method: 'DELETE'
						});
						await loadData();
						render();
					} else if (giftId && confirm(t('alerts.confirmDeleteGift'))) {
						await apiFetch(`/api/gifts/${giftId}`, {
							method: 'DELETE'
						});
						await loadData();
						render();
					}
				}
				return;
			}
			if (e.target.closest('.btn-status-change')) {
				const b = e.target.closest('.btn-status-change');
				const aD = b.parentElement;
				const sId = aD.dataset.statusId;
				const nS = b.dataset.newStatus;
				const aDue = parseFloat(aD.dataset.amountDue);
				const pL = {
					status: nS,
					amountPaid: nS === 'Tout Remboursé' ? aDue : 0
				};
				await apiFetch(`/api/status/${sId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(pL)
				});
				await loadData();
				render();
				return;
			}
			if (e.target.closest('.btn-partial-payment')) {
				const b = e.target.closest('.btn-partial-payment');
				const aD = b.parentElement;
				const i = aD.querySelector('.input-partial-payment');
				const pA = parseFloat(i.value);
				if (!isNaN(pA) && pA >= 0) {
					const sId = aD.dataset.statusId;
					const aDue = parseFloat(aD.dataset.amountDue);
					const pL = {
						amountPaid: pA,
						status: pA >= aDue ? 'Tout Remboursé' : 'Partiellement Remboursé'
					};
					await apiFetch(`/api/status/${sId}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(pL)
					});
					await loadData();
					render();
				}
				return;
			}
		});
		addFab.addEventListener('click', openAddModal);
		closeModalBtn.addEventListener('click', closeModal);
		window.addEventListener('click', (e) => {
			if (e.target == modal) closeModal();
		});
		modalTypeSelector.addEventListener('click', (e) => {
			const b = e.target.closest('.btn');
			if (b && b.dataset.formType) {
				modalTypeSelector.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
				b.classList.add('active');
				renderAddForm(b.dataset.formType);
			}
		});
		addForm.addEventListener('submit', handleAddFormSubmit);
	}

	// All other render functions
	function render() {
		mainContent.innerHTML = '';
		addFab.style.display = 'none';
		document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
		switch (state.currentView) {
			case 'dashboard':
				navDashboard.classList.add('active');
				renderDashboard();
				break;
			case 'memberProfile':
				navDashboard.classList.add('active');
				renderMemberProfile(state.viewingMemberId);
				addFab.style.display = 'flex';
				break;
			case 'archives':
				navArchives.classList.add('active');
				renderArchives();
				break;
		}
	}

	function renderDashboard() {
		const otherMembers = DB.members.filter(m => m.id !== state.currentUser.id);
		mainContent.innerHTML = `<h2 class="section-title">${t('dashboard.title')}</h2><div class="grid-container">${otherMembers.map(member => { const ideaCount = DB.giftIdeas.filter(g => g.targetMemberId === member.id).length; const purchaseCount = DB.purchasedGifts.filter(g => g.targetMemberId === member.id && new Date(g.purchaseDate).getFullYear() === new Date().getFullYear()).length; return `<div class="member-card" data-member-id="${member.id}"><h3>${member.username}</h3><p>${ideaCount} ${ideaCount === 1 ? t('dashboard.ideas_one') : t('dashboard.ideas_other')} | ${purchaseCount} ${purchaseCount === 1 ? t('dashboard.purchases_one') : t('dashboard.purchases_other')}</p></div>` }).join('')}</div>`;
	}

	function renderMemberProfile(memberId) {
		const member = findById(DB.members, memberId);
		if (!member) return renderDashboard();
		const ideas = DB.giftIdeas.filter(i => i.targetMemberId === memberId);
		const purchased = DB.purchasedGifts.filter(p => p.targetMemberId === memberId && new Date(p.purchaseDate).getFullYear() === new Date().getFullYear());
		mainContent.innerHTML = `<h2 class="section-title">${t('memberProfile.title', {name: member.username})}</h2><h3>${t('memberProfile.ideasTitle', {count: ideas.length})}</h3><div class="grid-container">${ideas.length > 0 ? ideas.map(renderGiftIdea).join('') : `<p>${t('memberProfile.noIdeas')}</p>`}</div><h3 style="margin-top: 2rem;">${t('memberProfile.purchasesTitle', {count: purchased.length})}</h3><div class="grid-container">${purchased.length > 0 ? purchased.map(renderPurchasedGift).join('') : `<p>${t('memberProfile.noPurchases')}</p>`}</div>`;
	}

	function renderGiftIdea(idea) {
		const creator = findById(DB.members, idea.creatorId);
		return `<div class="gift-card" data-idea-id="${idea.id}"><h4>${idea.title}<div class="card-actions"><button class="action-btn edit-price-btn" title="${t('giftCard.editPrice')}">✏️</button><button class="action-btn convert-btn" title="${t('giftCard.convertToPurchase')}">🛒</button><button class="action-btn delete-btn" title="${t('giftCard.deleteIdea')}">🗑️</button></div></h4><div class="price-container">${idea.estimatedPrice ? `<div class="price">${formatCurrency(idea.estimatedPrice)} ${t('giftCard.priceEstimated')}</div>` : `<div class="price">${t('giftCard.priceUndefined')}</div>`}</div><div class="meta">${t('giftCard.createdBy', {name: creator.username, date: formatDate(idea.creationDate)})}</div></div>`;
	}

	function renderPurchasedGift(gift) {
		const payer = findById(DB.members, gift.payerId);
		const amountPerPerson = gift.reimbursementMemberIds.length > 0 ? (gift.totalPrice / gift.reimbursementMemberIds.length) : 0;
		const statuses = DB.reimbursementStatus.filter(s => s.giftId === gift.id);
		return `<div class="gift-card" data-gift-id="${gift.id}"><h4>${gift.name}<div class="card-actions"><button class="action-btn revert-to-idea-btn" title="${t('purchasedCard.revertToIdea')}">💡</button><button class="action-btn edit-gift-btn" title="${t('purchasedCard.editGift')}">✏️</button><button class="action-btn delete-btn" title="${t('purchasedCard.deleteGift')}">🗑️</button></div></h4><div class="price">${formatCurrency(gift.totalPrice)}</div><p>${t('purchasedCard.purchasedAt', {store: gift.store, date: formatDate(gift.purchaseDate)})}</p><p>${t('purchasedCard.paidBy', {name: payer.username})}</p><table class="reimbursement-table"><thead><tr><th>${t('reimbursement.tableHeaderMember')}</th><th>${t('reimbursement.tableHeaderStatus')}</th><th>${t('reimbursement.tableHeaderActions')}</th></tr></thead><tbody>${statuses.map(status => renderReimbursementStatus(status, amountPerPerson)).join('')}</tbody></table></div>`;
	}

	function renderReimbursementStatus(status, amountDue) {
		const member = findById(DB.members, status.memberId);
		const gift = findById(DB.purchasedGifts, status.giftId);
		const canCurrentUserModify = gift && state.currentUser.id !== gift.targetMemberId;
		let sC = '',
			sT = '',
			rT = '';
		switch (status.status) {
			case 'Non Remboursé':
				sC = 'status-unpaid';
				sT = `<span class="status-tag unpaid">${t('reimbursement.statusUnpaid')}</span>`;
				break;
			case 'Tout Remboursé':
				sC = 'status-paid';
				sT = `<span class="status-tag paid">${t('reimbursement.statusPaid')}</span>`;
				break;
			case 'Partiellement Remboursé':
				sC = 'status-partial';
				const r = amountDue - status.amountPaid;
				sT = `<span class="status-tag partial">${t('reimbursement.statusPartial', {amount: formatCurrency(status.amountPaid)})}</span>`;
				rT = `<div class="remaining-amount">${t('reimbursement.remaining', {amount: formatCurrency(r)})}</div>`;
				break;
		}
		const uA = canCurrentUserModify ? `<div class="user-actions" data-status-id="${status.id}" data-amount-due="${amountDue}"><button class="btn-status-change" data-new-status="Tout Remboursé">${t('reimbursement.actionPaid')}</button><button class="btn-status-change" data-new-status="Non Remboursé">${t('reimbursement.actionUnpaid')}</button><input type="number" class="input-partial-payment" placeholder="${t('reimbursement.amountPlaceholder')}" step="0.01"><button class="btn-partial-payment">${t('reimbursement.actionPartial')}</button></div>` : '—';
		return `<tr class="${sC}"><td><strong>${member.username}</strong><br><small>${t('reimbursement.amountDue', {amount: formatCurrency(amountDue)})}</small></td><td>${sT}${rT}</td><td>${uA}</td></tr>`;
	}

	function renderArchives() {
		const cY = new Date().getFullYear();
		const pG = DB.purchasedGifts.filter(g => new Date(g.purchaseDate).getFullYear() < cY);
		const aY = [...new Set(pG.map(g => new Date(g.purchaseDate).getFullYear()))].sort((a, b) => b - a);
		let c = `<h2 class="section-title">${t('archives.title')}</h2><div class="archive-controls">${aY.map(y => `<button class="btn year-btn ${state.selectedArchiveYear === y ? 'active' : ''}" data-year="${y}">${y}</button>`).join('')}</div>`;
		if (state.selectedArchiveYear) {
			if (!state.selectedArchiveMemberId) {
				const gY = pG.filter(g => new Date(g.purchaseDate).getFullYear() === state.selectedArchiveYear);
				const mY = [...new Set(gY.map(g => g.targetMemberId))];
				c += `<h3 class="sub-title">${t('archives.giftsForWhom', {year: state.selectedArchiveYear})}</h3>`;
				if (mY.length > 0) {
					c += `<div class="grid-container">${mY.map(id => { const m = findById(DB.members, id); const gC = gY.filter(g => g.targetMemberId === id).length; return `<div class="member-card archive-member-card" data-member-id="${id}"><h3>${m.username}</h3><p>${gC} ${gC === 1 ? t('archives.giftsReceived_one') : t('archives.giftsReceived_other')}</p></div>`; }).join('')}</div>`;
				} else {
					c += `<p>${t('archives.noGiftsForYear')}</p>`;
				}
			} else {
				const m = findById(DB.members, state.selectedArchiveMemberId);
				const gM = pG.filter(g => new Date(g.purchaseDate).getFullYear() === state.selectedArchiveYear && g.targetMemberId === state.selectedArchiveMemberId);
				c += `<div class="archive-header"><h3 class="sub-title">${t('archives.giftsForMemberInYear', {name: m.username, year: state.selectedArchiveYear})}</h3><button class="btn btn-secondary back-to-members-btn">${t('archives.backButton')}</button></div>`;
				if (gM.length > 0) {
					c += `<div class="grid-container">${gM.map(renderPurchasedGift).join('')}</div>`;
				}
			}
		} else {
			c += `<p class="sub-title">${t('archives.selectYear')}</p>`;
		}
		mainContent.innerHTML = c;
	}

	function openAddModal(isEditing = false) {
		addForm.innerHTML = '';
		addForm.classList.remove('visible');
		delete addForm.dataset.convertingIdeaId;
		delete addForm.dataset.editingGiftId;
		modalTypeSelector.style.display = 'block';
		modal.querySelector('#modal-title').textContent = t('modal.addTitle');
		modalTypeSelector.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
		modal.classList.add('active');
	}

	function openAddModalForConversion(idea) {
		openAddModal();
		modalTypeSelector.style.display = 'none';
		addForm.dataset.convertingIdeaId = idea.id;
		renderAddForm('purchase');
		addForm.querySelector('#gift-name').value = idea.title;
		if (idea.estimatedPrice) addForm.querySelector('#gift-price').value = idea.estimatedPrice;
	}

	function openEditGiftModal(gift) {
		openAddModal(true);
		modalTypeSelector.style.display = 'none';
		modal.querySelector('#modal-title').textContent = t('modal.editTitle');
		addForm.dataset.editingGiftId = gift.id;
		renderAddForm('purchase', true);
		addForm.querySelector('#gift-name').value = gift.name;
		addForm.querySelector('#gift-price').value = gift.totalPrice;
		addForm.querySelector('#gift-store').value = gift.store;
		addForm.querySelector('#gift-date').value = new Date(gift.purchaseDate).toISOString().slice(0, 10);
		addForm.querySelector('#payerId').value = gift.payerId;
		addForm.querySelectorAll('input[name="reimbursementMemberIds"]').forEach(c => {
			if (gift.reimbursementMemberIds.includes(parseInt(c.value))) c.checked = true;
		});
		addForm.querySelector('.submit-btn').textContent = t('modal.editGiftBtn');
	}

	function closeModal() {
		modal.classList.remove('active');
	}

	function renderAddForm(type, isEditing = false) {
		addForm.dataset.formType = type;
		const tM = findById(DB.members, state.viewingMemberId);
		let fH = '';
		if (type === 'idea') {
			fH = `<div class="input-group"><label for="idea-title">${t('modal.ideaName')}</label><input type="text" id="idea-title" name="title" required></div><div class="input-group"><label for="idea-price">${t('modal.ideaPrice')}</label><input type="number" id="idea-price" name="estimatedPrice" step="0.01"></div><input type="hidden" name="targetMemberId" value="${tM.id}"><p>${t('modal.for', {name: tM.username})}</p><button type="submit" class="btn btn-primary submit-btn">${t('modal.addIdeaBtn')}</button>`;
		} else if (type === 'purchase') {
			const mO = DB.members.map(m => `<option value="${m.id}">${m.username}</option>`).join('');
			const mC = DB.members.map(m => `<label><span>${m.username}</span> <input type="checkbox" name="reimbursementMemberIds" value="${m.id}"></label>`).join('');
			fH = `<div class="input-group"><label for="gift-name">${t('modal.giftName')}</label><input type="text" id="gift-name" name="name" required></div><div class="input-group"><label for="gift-price">${t('modal.giftPrice')}</label><input type="number" id="gift-price" name="totalPrice" step="0.01" required></div><div class="input-group"><label for="gift-store">${t('modal.giftStore')}</label><input type="text" id="gift-store" name="store" required></div><div class="input-group"><label for="gift-date">${t('modal.giftDate')}</label><input type="date" id="gift-date" name="purchaseDate" value="${new Date().toISOString().slice(0, 10)}" required></div><div class="input-group"><label for="payerId">${t('modal.giftPayer')}</label><select id="payerId" name="payerId" required>${mO}</select></div><div class="input-group"><label>${t('modal.giftParticipants')}</label><div class="checkbox-group">${mC}</div></div><input type="hidden" name="targetMemberId" value="${tM.id}"><p>${t('modal.for', {name: tM.username})}</p><button type="submit" class="btn btn-primary submit-btn">${isEditing ? t('modal.editGiftBtn') : t('modal.addGiftBtn')}</button>`;
		}
		addForm.innerHTML = fH;
		addForm.classList.add('visible');
	}
	async function handleAddFormSubmit(e) {
		e.preventDefault();
		const fD = new FormData(addForm);
		const type = addForm.dataset.formType;
		const eId = addForm.dataset.editingGiftId;
		try {
			if (type === 'idea') {
				const nI = {
					title: fD.get('title'),
					estimatedPrice: parseFloat(fD.get('estimatedPrice')) || null,
					targetMemberId: parseInt(fD.get('targetMemberId')),
					creationDate: new Date().toISOString(),
					creatorId: state.currentUser.id
				};
				if (!nI.title) {
					alert(t('alerts.fillFields'));
					return;
				}
				await apiFetch('/api/ideas', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(nI)
				});
			} else if (type === 'purchase') {
				const gD = {
					name: fD.get('name'),
					totalPrice: parseFloat(fD.get('totalPrice')),
					store: fD.get('store'),
					payerId: parseInt(fD.get('payerId')),
					purchaseDate: new Date(fD.get('purchaseDate')).toISOString(),
					targetMemberId: parseInt(fD.get('targetMemberId')),
					reimbursementMemberIds: Array.from(fD.getAll('reimbursementMemberIds')).map(id => parseInt(id))
				};
				if (!gD.name || !gD.totalPrice || !gD.store) {
					alert(t('alerts.fillFields'));
					return;
				}
				if (gD.reimbursementMemberIds.length === 0) {
					alert(t('alerts.selectParticipant'));
					return;
				}
				if (eId) {
					await apiFetch(`/api/gifts/${eId}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(gD)
					});
				} else {
					let url = '/api/gifts';
					const cId = addForm.dataset.convertingIdeaId;
					if (cId) {
						url += `?deleteIdeaId=${cId}`;
					}
					await apiFetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(gD)
					});
				}
			}
			closeModal();
			await loadData();
			render();
		} catch (error) {
			console.error("Erreur:", error);
			alert(t('alerts.errorSave'));
		}
	}
});
