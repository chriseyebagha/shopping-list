import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, off, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ── Firebase ──
const firebaseConfig = {
  apiKey: "AIzaSyBAnMbbd7hbQvx8mdNF5PajAdxl_VYOsxE",
  authDomain: "chris-shopping-list.firebaseapp.com",
  databaseURL: "https://chris-shopping-list-default-rtdb.firebaseio.com",
  projectId: "chris-shopping-list",
  storageBucket: "chris-shopping-list.firebasestorage.app",
  messagingSenderId: "222533323145",
  appId: "1:222533323145:web:f24d42c4dccd0fa19fb958",
  measurementId: "G-V3DT5PCT0D"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
setPersistence(auth, indexedDBLocalPersistence).catch(() =>
  setPersistence(auth, browserLocalPersistence)
);
const provider = new GoogleAuthProvider();

// ── State ──
let listRef, suggestionsRef, iconsRef;
let currentUser = null;
let activeList = [];
let suggestionDB = {};
let activeListId = 'personal';
let sharedLists = {};
let searchQuery = '';
let selectedStore = '';
let suggestionsCollapsed = false;

const STORE_ORDER = ["Trader Joe's", "Whole Foods", "Costco", "Safeway", "Target", "TJ Maxx", "Amazon", "IKEA", "General"];

const STORE_ICONS = {
  "Trader Joe's": { emoji: '🛒', color: '#c1272d' },
  'Whole Foods': { emoji: '🥬', color: '#00674f' },
  'Costco': { emoji: '🏪', color: '#003087' },
  'Safeway': { emoji: '🛒', color: '#e31837' },
  'Target': { emoji: '🎯', color: '#cc0000' },
  'TJ Maxx': { emoji: '🏬', color: '#991b1b' },
  'Amazon': { emoji: '📦', color: '#ff9900' },
  'IKEA': { emoji: '🪑', color: '#0058a3' },
  'General': { emoji: '🏠', color: '#f97316' }
};

const SEED_DATA = [
  { name: 'Plates', store: 'General', count: 5 },
  { name: 'Spoons', store: 'General', count: 5 },
  { name: 'Wine glass', store: 'General', count: 5 },
  { name: 'Cups', store: 'General', count: 5 },
  { name: 'Trash bags', store: 'General', count: 10 },
  { name: 'Trash bin', store: 'General', count: 1 },
  { name: 'Rain Jacket', store: 'General', count: 1 },
  { name: 'Dining Chair', store: 'TJ Maxx', count: 2 },
  { name: 'Knife', store: 'TJ Maxx', count: 1 },
  { name: 'Can Opener', store: 'TJ Maxx', count: 1 },
  { name: 'Wine Opener', store: 'TJ Maxx', count: 1 },
  { name: 'Oven Mitts', store: 'TJ Maxx', count: 1 },
  { name: 'Tupperware', store: 'TJ Maxx', count: 5 },
  { name: 'Bath Mat', store: 'TJ Maxx', count: 1 },
  { name: 'Hand Towels', store: 'TJ Maxx', count: 5 },
  { name: 'Bathing Sponge', store: 'TJ Maxx', count: 2 },
  { name: 'Broom and Dustpan', store: 'TJ Maxx', count: 1 },
  { name: 'Laundry Hamper', store: 'TJ Maxx', count: 1 },
  { name: 'Laundry Detergent', store: 'Costco', count: 5 },
  { name: 'Toilet Paper', store: 'Costco', count: 20 },
  { name: 'Paper Towels', store: 'Costco', count: 20 },
  { name: 'Kitchen Napkin', store: 'Costco', count: 10 },
  { name: 'Coconut Water', store: 'Costco', count: 15 },
  { name: 'Celsius', store: 'Costco', count: 15 },
  { name: 'Kirkland Grilled Chicken Breast Skewers', store: 'Costco', count: 10 },
  { name: 'Kirkland Wild Alaskan Sockeye Salmon', store: 'Costco', count: 10 },
  { name: 'Kahiki Chicken Rice Bowls — Teriyaki', store: 'Costco', count: 8 },
  { name: 'Kirkland Rotisserie Chicken', store: 'Costco', count: 25 },
  { name: 'Bibigo Beef Pho Steamed Dumplings', store: 'Costco', count: 10 },
  { name: 'Kirkland Boneless Chicken Breasts (frozen)', store: 'Costco', count: 10 },
  { name: 'Eggs', store: "Trader Joe's", count: 30 },
  { name: 'Butter', store: "Trader Joe's", count: 20 },
  { name: 'Olive oil', store: "Trader Joe's", count: 15 },
  { name: 'Salt', store: "Trader Joe's", count: 10 },
  { name: 'Pepper', store: "Trader Joe's", count: 10 },
  { name: 'Branzino Fish', store: "Trader Joe's", count: 12 },
  { name: 'Tikka Masala', store: "Trader Joe's", count: 15 },
  { name: 'Argentinian Red Shrimp — Ginger Garlic Butter', store: "Trader Joe's", count: 12 },
  { name: 'Wild Raw Argentinian Red Shrimp (1 lb bag)', store: "Trader Joe's", count: 12 },
  { name: 'Pulled Chicken Salsa Verde', store: "Trader Joe's", count: 15 },
  { name: 'Pre-Cooked Grilled Chicken Strips', store: "Trader Joe's", count: 15 },
  { name: 'Bacon Cheddar Egg Bites', store: "Trader Joe's", count: 15 }
];

// ── Helpers ──
const getStoreRank = s => { const i = STORE_ORDER.indexOf(s); return i === -1 ? 999 : i; };
const getStoreIcon = s => STORE_ICONS[s] || { emoji: '🛍️', color: '#6b7280' };
const esc = s => s.replace(/['"<>&]/g, c => ({ "'": '&#39;', '"': '&quot;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const jsesc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function haptic(style) {
  if (!navigator.vibrate) return;
  if (style === 'light') navigator.vibrate(10);
  else if (style === 'medium') navigator.vibrate(20);
  else if (style === 'heavy') navigator.vibrate([30, 10, 30]);
  else if (style === 'success') navigator.vibrate([10, 30, 10]);
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Dark mode ──
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  haptic('light');
}

// ── Auth ──
function login() {
  signInWithPopup(auth, provider).catch(err => {
    console.error("Login failed", err);
    toast("Login failed. Try again.");
  });
}

function logout() {
  signOut(auth).then(() => location.reload()).catch(console.error);
}

let recaptchaVerifier = null;
let confirmResult = null;

function togglePhoneLogin() {
  document.getElementById('mainLoginOptions').classList.add('hidden');
  document.getElementById('phoneFlow').classList.add('active');
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'normal' });
    recaptchaVerifier.render();
  }
}

function cancelPhoneLogin() {
  document.getElementById('phoneFlow').classList.remove('active');
  document.getElementById('mainLoginOptions').classList.remove('hidden');
  document.getElementById('otpGroup').classList.add('hidden');
  document.getElementById('sendCodeBtn').classList.remove('hidden');
}

function sendCode() {
  const phone = document.getElementById('phoneInput').value;
  if (!phone) { toast("Enter a phone number"); return; }
  signInWithPhoneNumber(auth, phone, recaptchaVerifier)
    .then(result => {
      confirmResult = result;
      toast("Code sent!");
      document.getElementById('sendCodeBtn').classList.add('hidden');
      document.getElementById('otpGroup').classList.remove('hidden');
    })
    .catch(err => {
      toast("Error: " + err.message);
      if (recaptchaVerifier) recaptchaVerifier.clear();
    });
}

function verifyCode() {
  const code = document.getElementById('otpInput').value;
  if (!code) return;
  confirmResult.confirm(code).catch(() => toast("Wrong code. Try again."));
}

// ── Auth state ──
onAuthStateChanged(auth, user => {
  const overlay = document.getElementById('loginOverlay');
  const topBar = document.getElementById('topBar');
  const appEl = document.getElementById('app');

  if (user) {
    currentUser = user;
    overlay.style.display = 'none';
    topBar.classList.remove('hidden');
    appEl.classList.remove('hidden');

    const name = user.displayName ? user.displayName.split(' ')[0] : 'User';
    const photo = user.photoURL || '';
    document.getElementById('userDisplay').innerHTML = photo
      ? `<img src="${photo}" class="user-avatar" alt="" /><span>${esc(name)}'s List</span>`
      : `<span>${esc(name)}'s List</span>`;

    listRef = ref(db, `users/${user.uid}/shoppingList`);
    suggestionsRef = ref(db, `users/${user.uid}/suggestions`);
    iconsRef = ref(db, `users/${user.uid}/storeIcons`);

    setupListeners();
    loadSharedLists();
    checkShareInvite();
  } else {
    currentUser = null;
    overlay.style.display = 'flex';
    topBar.classList.add('hidden');
    appEl.classList.add('hidden');
  }
});

// ── Firebase listeners ──
function setupListeners() {
  onValue(listRef, snap => {
    activeList = snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [];
    renderActiveList();
  });

  onValue(suggestionsRef, snap => {
    const data = snap.val();
    if (data) suggestionDB = data;
    else seedDatabase();
    renderSuggestions();
  });

  onValue(iconsRef, snap => {
    const data = snap.val();
    if (data) Object.assign(STORE_ICONS, data);
    renderActiveList();
    renderSuggestions();
  });
}

function seedDatabase() {
  const savedDB = localStorage.getItem('shoppingListSuggestionsDB');
  if (savedDB) {
    try { update(suggestionsRef, JSON.parse(savedDB)); } catch (e) {}
  } else {
    const updates = {};
    SEED_DATA.forEach(item => {
      updates[item.name] = { store: item.store, count: item.count, lastUsed: Date.now() };
    });
    update(suggestionsRef, updates);
  }
  const savedActive = localStorage.getItem('activeShoppingList');
  if (savedActive) {
    try {
      JSON.parse(savedActive).forEach(item => {
        push(listRef, { name: item.name, store: item.store, qty: item.qty || 1, checked: item.checked || false });
      });
      localStorage.removeItem('activeShoppingList');
    } catch (e) {}
  }
}

// ── CRUD ──
function addItem(name, store, qty) {
  if (!currentUser || !name.trim() || !store.trim()) return;
  name = name.trim();
  store = store.trim();
  qty = Math.max(1, parseInt(qty) || 1);

  const exists = activeList.some(i => i.name.toLowerCase() === name.toLowerCase() && i.store === store);
  if (exists) { toast(`"${name}" already on list`); haptic('heavy'); return; }

  const targetRef = activeListId === 'personal' ? listRef : ref(db, `sharedLists/${activeListId}/items`);
  push(targetRef, { name, store, qty, checked: false });
  updateStats(name, store);
  haptic('success');
  toast(`Added ${name}`);
}

function updateStats(name, store) {
  const current = suggestionDB[name];
  const updates = {};
  updates[name] = { store, count: current ? current.count + 1 : 1, lastUsed: Date.now() };
  update(suggestionsRef, updates);
}

function removeItem(id) {
  if (!currentUser) return;
  haptic('medium');
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    setTimeout(() => {
      const path = activeListId === 'personal'
        ? `users/${currentUser.uid}/shoppingList/${id}`
        : `sharedLists/${activeListId}/items/${id}`;
      remove(ref(db, path));
    }, 280);
  } else {
    const path = activeListId === 'personal'
      ? `users/${currentUser.uid}/shoppingList/${id}`
      : `sharedLists/${activeListId}/items/${id}`;
    remove(ref(db, path));
  }
}

function toggleItem(id, currentStatus) {
  if (!currentUser) return;
  haptic('light');
  const path = activeListId === 'personal'
    ? `users/${currentUser.uid}/shoppingList/${id}`
    : `sharedLists/${activeListId}/items/${id}`;
  update(ref(db, path), { checked: !currentStatus });
}

function clearChecked() {
  if (!currentUser) return;
  const updates = {};
  const base = activeListId === 'personal'
    ? `users/${currentUser.uid}/shoppingList`
    : `sharedLists/${activeListId}/items`;
  activeList.forEach(item => {
    if (item.checked) updates[`${base}/${item.id}`] = null;
  });
  if (Object.keys(updates).length > 0) {
    update(ref(db), updates);
    haptic('medium');
    toast("Cleared checked items");
  }
}

function clearAll() {
  if (!currentUser || !confirm('Delete ALL items?')) return;
  const targetRef = activeListId === 'personal' ? listRef : ref(db, `sharedLists/${activeListId}/items`);
  set(targetRef, null);
  haptic('heavy');
  toast("List cleared");
}

// ── Store picker bottom sheet ──
function openStorePicker() {
  const overlay = document.getElementById('storeSheet');
  let html = '<div class="store-grid">';

  STORE_ORDER.forEach(name => {
    const icon = getStoreIcon(name);
    const sel = selectedStore === name ? 'selected' : '';
    html += `
      <div class="store-grid-item ${sel}" onclick="window._pickStore('${jsesc(name)}')">
        <div class="sg-icon" style="background:${icon.color}">${icon.emoji}</div>
        <div class="sg-name">${esc(name)}</div>
      </div>`;
  });

  html += `
    <div class="store-grid-item custom-store" onclick="window._pickCustomStore()">
      <div class="sg-icon" style="background:var(--text-muted)">＋</div>
      <div class="sg-name">New Store</div>
    </div>`;
  html += '</div>';

  document.getElementById('storeGridContainer').innerHTML = html;
  overlay.classList.add('open');
  haptic('light');
}

function closeStorePicker() {
  document.getElementById('storeSheet').classList.remove('open');
}

function pickStore(name) {
  selectedStore = name;
  updateStoreButton();
  closeStorePicker();
  haptic('light');
}

function pickCustomStore() {
  const name = prompt('Enter store name:');
  if (name && name.trim()) {
    const trimmed = name.trim();
    if (!STORE_ICONS[trimmed] && currentUser) {
      update(iconsRef, { [trimmed]: { emoji: '🛍️', color: '#6b7280' } });
    }
    selectedStore = trimmed;
    updateStoreButton();
    closeStorePicker();
  }
}

function updateStoreButton() {
  const btn = document.getElementById('storePickerBtn');
  if (!btn) return;
  if (selectedStore) {
    const icon = getStoreIcon(selectedStore);
    btn.innerHTML = `<span class="store-emoji">${icon.emoji}</span> ${esc(selectedStore)} <span class="chevron">▼</span>`;
  } else {
    btn.innerHTML = `Store... <span class="chevron">▼</span>`;
  }
}

// ── Shared lists ──
function generateShareCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function loadSharedLists() {
  if (!currentUser) return;
  onValue(ref(db, `users/${currentUser.uid}/sharedLists`), snap => {
    sharedLists = snap.val() || {};
    renderListTabs();
  });
}

function createSharedList() {
  if (!currentUser) return;
  const name = document.getElementById('sharedListName').value.trim();
  if (!name) { toast("Enter a list name"); return; }
  const code = generateShareCode();
  const updates = {};
  updates[`sharedLists/${code}/meta`] = { name, owner: currentUser.uid, ownerName: currentUser.displayName || 'User', createdAt: Date.now() };
  updates[`sharedLists/${code}/members/${currentUser.uid}`] = { name: currentUser.displayName || 'User', photo: currentUser.photoURL || '', joinedAt: Date.now() };
  updates[`users/${currentUser.uid}/sharedLists/${code}`] = { name, role: 'owner' };
  update(ref(db), updates).then(() => {
    toast("Shared list created!");
    switchToList(code);
    closeShareModal();
    openShareModal(code);
  }).catch(err => toast("Error: " + err.message));
}

function joinSharedList(code) {
  if (!currentUser) return;
  code = code.trim().toUpperCase();
  get(ref(db, `sharedLists/${code}/meta`)).then(snap => {
    if (!snap.exists()) { toast("List not found"); return; }
    const meta = snap.val();
    const updates = {};
    updates[`sharedLists/${code}/members/${currentUser.uid}`] = { name: currentUser.displayName || 'User', photo: currentUser.photoURL || '', joinedAt: Date.now() };
    updates[`users/${currentUser.uid}/sharedLists/${code}`] = { name: meta.name, role: 'member' };
    update(ref(db), updates).then(() => {
      toast(`Joined "${meta.name}"!`);
      switchToList(code);
      closeShareModal();
    });
  }).catch(() => toast("Could not join list"));
}

function switchToList(listId) {
  if (activeListId !== 'personal') off(ref(db, `sharedLists/${activeListId}/items`));
  else off(listRef);

  activeListId = listId;
  activeList = [];
  renderActiveList();

  const target = listId === 'personal' ? listRef : ref(db, `sharedLists/${listId}/items`);
  onValue(target, snap => {
    activeList = snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [];
    renderActiveList();
  });
  renderListTabs();
}

function openShareModal(code) {
  const modal = document.getElementById('shareModal');
  const content = document.getElementById('shareModalContent');
  const baseUrl = location.origin + location.pathname;

  if (code) {
    const shareUrl = `${baseUrl}?join=${code}`;
    content.innerHTML = `
      <h2>Share This List</h2>
      <p>Send this link to invite others to collaborate in real-time.</p>
      <div class="share-link-box">
        <input type="text" value="${shareUrl}" readonly id="shareLinkInput" />
        <button onclick="window.copyShareLink()">Copy</button>
      </div>
      <div id="sharedMembersContainer"></div>
      <div class="modal-actions"><button class="btn-secondary" onclick="window.closeShareModal()">Done</button></div>`;
    loadMembers(code);
  } else {
    content.innerHTML = `
      <h2>Share & Collaborate</h2>
      <p>Create a shared list or join one with a code.</p>
      <input type="text" id="sharedListName" placeholder="New list name (e.g. Household)" />
      <button class="auth-btn google" style="margin-bottom:16px" onclick="window.createSharedList()">Create Shared List</button>
      <div style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-bottom:12px">— or join existing —</div>
      <input type="text" id="joinCodeInput" placeholder="Enter invite code (e.g. AB12CD)" style="text-transform:uppercase" />
      <div class="modal-actions">
        <button class="btn-secondary" onclick="window.closeShareModal()">Cancel</button>
        <button class="btn-primary" onclick="window.joinSharedList(document.getElementById('joinCodeInput').value)">Join</button>
      </div>`;
  }
  modal.classList.add('open');
}

function closeShareModal() { document.getElementById('shareModal').classList.remove('open'); }

function copyShareLink() {
  navigator.clipboard.writeText(document.getElementById('shareLinkInput').value).then(() => toast("Link copied!"));
}

function loadMembers(code) {
  get(ref(db, `sharedLists/${code}/members`)).then(snap => {
    const members = snap.val() || {};
    const el = document.getElementById('sharedMembersContainer');
    if (!el) return;
    let html = '<div class="shared-members">';
    Object.values(members).forEach(m => {
      html += `<div class="member-chip">`;
      if (m.photo) html += `<img src="${esc(m.photo)}" alt="" />`;
      html += `${esc(m.name)}</div>`;
    });
    el.innerHTML = html + '</div>';
  });
}

function checkShareInvite() {
  const code = new URLSearchParams(location.search).get('join');
  if (code) {
    history.replaceState({}, '', location.pathname);
    joinSharedList(code);
  }
}

// ── Voice input ──
let recognition = null;

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Voice not supported"); return; }
  const btn = document.getElementById('voiceBtn');

  if (recognition) {
    recognition.stop();
    recognition = null;
    btn.classList.remove('listening');
    return;
  }

  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  btn.classList.add('listening');
  haptic('medium');

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    document.getElementById('itemInput').value = text;
    btn.classList.remove('listening');
    recognition = null;
    haptic('success');
    toast(`Heard: "${text}"`);
  };

  recognition.onerror = () => { btn.classList.remove('listening'); recognition = null; toast("Couldn't hear that"); };
  recognition.onend = () => { btn.classList.remove('listening'); recognition = null; };
  recognition.start();
}

// ── Search ──
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  renderSuggestions();
}

// ── Collapsible suggestions ──
function toggleSuggestions() {
  suggestionsCollapsed = !suggestionsCollapsed;
  const content = document.getElementById('suggestionsContent');
  const toggle = document.getElementById('suggestionsToggle');
  if (suggestionsCollapsed) {
    content.classList.add('collapsed');
    toggle.classList.add('collapsed');
  } else {
    content.classList.remove('collapsed');
    toggle.classList.remove('collapsed');
  }
  localStorage.setItem('suggestionsCollapsed', suggestionsCollapsed);
  haptic('light');
}

// ── Swipe to delete ──
function initSwipe(container) {
  let startX, currentX, swiping = false, target = null;
  const threshold = 80;

  container.addEventListener('touchstart', e => {
    const item = e.target.closest('.active-item');
    if (!item || e.target.closest('.check-box') || e.target.closest('.delete-btn')) return;
    startX = e.touches[0].clientX;
    target = item;
    swiping = false;
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!target) return;
    currentX = e.touches[0].clientX;
    const dx = startX - currentX;
    if (dx > 10) {
      swiping = true;
      const content = target.querySelector('.item-content');
      if (content) {
        content.style.transform = `translateX(${Math.max(-threshold, -dx)}px)`;
        target.classList.toggle('swiping', dx > 30);
      }
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (!target) return;
    const content = target.querySelector('.item-content');
    if (swiping && startX - currentX > threshold) {
      const id = target.dataset.id;
      if (id) removeItem(id);
    } else if (content) {
      content.style.transform = '';
      target.classList.remove('swiping');
    }
    target = null;
    swiping = false;
  }, { passive: true });
}

// ── Long-press to delete ──
function initLongPress(container) {
  let timer = null;
  let pressTarget = null;

  container.addEventListener('touchstart', e => {
    const item = e.target.closest('.active-item');
    if (!item || e.target.closest('.check-box') || e.target.closest('.delete-btn')) return;
    pressTarget = item;
    timer = setTimeout(() => {
      haptic('heavy');
      pressTarget.classList.add('press-hold');
      const id = pressTarget.dataset.id;
      const name = pressTarget.querySelector('.item-text')?.textContent || 'this item';
      if (id && confirm(`Delete "${name}"?`)) {
        removeItem(id);
      } else {
        pressTarget.classList.remove('press-hold');
      }
      pressTarget = null;
    }, 600);
  }, { passive: true });

  const cancel = () => {
    clearTimeout(timer);
    if (pressTarget) pressTarget.classList.remove('press-hold');
    pressTarget = null;
  };

  container.addEventListener('touchmove', cancel, { passive: true });
  container.addEventListener('touchend', cancel, { passive: true });
}

// ── Rendering ──
function renderActiveList() {
  const container = document.getElementById('activeListContainer');

  if (activeList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <div>Your list is empty.<br>Add items above or tap a suggestion below.</div>
      </div>`;
    return;
  }

  const byStore = {};
  activeList.forEach(item => {
    if (!byStore[item.store]) byStore[item.store] = [];
    byStore[item.store].push(item);
  });

  let html = '';
  Object.keys(byStore).sort((a, b) => getStoreRank(a) - getStoreRank(b)).forEach(store => {
    const icon = getStoreIcon(store);
    const items = byStore[store];
    const unchecked = items.filter(i => !i.checked).length;
    html += `
      <div class="store-group">
        <div class="store-group-header">
          <div class="store-group-icon" style="background:${icon.color}">${icon.emoji}</div>
          <div class="store-group-name">${esc(store)}</div>
          <div class="store-group-count">${unchecked}/${items.length}</div>
        </div>
        <div class="items-grid">`;

    items.forEach(item => {
      const checked = item.checked ? 'checked' : '';
      const qty = item.qty && item.qty > 1 ? `<span class="item-qty">×${item.qty}</span>` : '';
      html += `
        <div class="item active-item ${checked} adding" data-id="${item.id}">
          <div class="swipe-bg">🗑️</div>
          <div class="item-content">
            <div class="check-box ${item.checked ? 'is-checked' : ''}" onclick="window._toggle('${item.id}', ${item.checked})">
              <svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5L5 9.5L10 3"/></svg>
            </div>
            <span class="item-text">${esc(item.name)}</span>
            ${qty}
            <button class="delete-btn" onclick="window._remove('${item.id}')">✕</button>
          </div>
        </div>`;
    });
    html += '</div></div>';
  });

  container.innerHTML = html;
  initSwipe(container);
  initLongPress(container);
}

function renderSuggestions() {
  const container = document.getElementById('suggestionsInner');
  const countEl = document.getElementById('suggestionsCountBadge');
  const activeNames = new Set(activeList.map(i => i.name.toLowerCase()));

  let candidates = Object.entries(suggestionDB).map(([name, data]) => ({ name, ...data }));
  candidates = candidates.filter(i => !activeNames.has(i.name.toLowerCase()));

  if (searchQuery) {
    candidates = candidates.filter(i =>
      i.name.toLowerCase().includes(searchQuery) || i.store.toLowerCase().includes(searchQuery)
    );
  }

  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (b.lastUsed || 0) - (a.lastUsed || 0);
  });

  const top = candidates.slice(0, 60);

  if (countEl) countEl.textContent = top.length;

  if (top.length === 0) {
    container.innerHTML = searchQuery
      ? `<div class="empty-state"><div class="empty-icon">🔍</div><div>No matches for "${esc(searchQuery)}"</div></div>`
      : `<div class="empty-state"><div class="empty-icon">💡</div><div>No suggestions yet. Add items to build your list.</div></div>`;
    return;
  }

  const byStore = {};
  top.forEach(item => {
    if (!byStore[item.store]) byStore[item.store] = [];
    byStore[item.store].push(item);
  });

  let html = '';
  Object.keys(byStore).sort((a, b) => getStoreRank(a) - getStoreRank(b)).forEach(store => {
    const icon = getStoreIcon(store);
    html += `
      <div class="store-section">
        <div class="store-header">
          <div class="store-icon" style="background:${icon.color}">${icon.emoji}</div>
          <div><h2>${esc(store)}</h2><div class="label">Tap to add</div></div>
        </div>
        <div class="suggestions-grid">`;

    byStore[store].forEach(item => {
      html += `
        <div class="suggestion-item" onclick="window._addSuggestion('${jsesc(item.name)}', '${jsesc(item.store)}')">
          <span class="item-text">${esc(item.name)}</span>
          <div class="suggestion-icon">+</div>
        </div>`;
    });
    html += '</div></div>';
  });

  container.innerHTML = html;
}

function renderListTabs() {
  const container = document.getElementById('listTabs');
  let html = `<button class="list-tab ${activeListId === 'personal' ? 'active' : ''}" onclick="window._switchList('personal')">My List</button>`;
  Object.entries(sharedLists).forEach(([code, info]) => {
    html += `<button class="list-tab ${activeListId === code ? 'active' : ''}" onclick="window._switchList('${code}')">${esc(info.name)}</button>`;
  });
  container.innerHTML = html;

  const shareBtn = document.getElementById('shareActiveBtn');
  if (shareBtn) {
    shareBtn.style.display = activeListId !== 'personal' ? 'flex' : 'none';
    shareBtn.onclick = () => openShareModal(activeListId);
  }
}

// ── PWA install ──
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner && !localStorage.getItem('installDismissed')) banner.style.display = 'flex';
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') toast("App installed!");
    deferredPrompt = null;
    document.getElementById('installBanner').style.display = 'none';
  });
}

function dismissInstall() {
  document.getElementById('installBanner').style.display = 'none';
  localStorage.setItem('installDismissed', 'true');
}

// ── Init ──
initDarkMode();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

// Restore suggestions collapsed state
suggestionsCollapsed = localStorage.getItem('suggestionsCollapsed') === 'true';

// Expose to window
window._toggle = toggleItem;
window._remove = removeItem;
window._addSuggestion = (name, store) => { addItem(name, store, 1); scrollTo({ top: 0, behavior: 'smooth' }); };
window._switchList = switchToList;
window._pickStore = pickStore;
window._pickCustomStore = pickCustomStore;
window.login = login;
window.logout = logout;
window.togglePhoneLogin = togglePhoneLogin;
window.cancelPhoneLogin = cancelPhoneLogin;
window.sendCode = sendCode;
window.verifyCode = verifyCode;
window.toggleDarkMode = toggleDarkMode;
window.startVoice = startVoice;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.createSharedList = createSharedList;
window.joinSharedList = joinSharedList;
window.copyShareLink = copyShareLink;
window.installApp = installApp;
window.dismissInstall = dismissInstall;
window.clearChecked = clearChecked;
window.clearAll = clearAll;
window.openStorePicker = openStorePicker;
window.closeStorePicker = closeStorePicker;
window.toggleSuggestions = toggleSuggestions;

// ── DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addForm');
  const itemInput = document.getElementById('itemInput');
  const qtyInput = document.getElementById('qtyInput');
  const searchInput = document.getElementById('searchInput');
  const suggestionsToggle = document.getElementById('suggestionsToggle');
  const suggestionsContent = document.getElementById('suggestionsContent');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!selectedStore) { toast("Pick a store first"); openStorePicker(); return; }
      addItem(itemInput.value, selectedStore, qtyInput.value);
      itemInput.value = '';
      qtyInput.value = '1';
      itemInput.focus();
    });
  }

  if (searchInput) searchInput.addEventListener('input', handleSearch);

  if (suggestionsCollapsed && suggestionsToggle && suggestionsContent) {
    suggestionsContent.classList.add('collapsed');
    suggestionsToggle.classList.add('collapsed');
  }

  // Close bottom sheet on overlay tap
  const storeSheet = document.getElementById('storeSheet');
  if (storeSheet) {
    storeSheet.addEventListener('click', e => {
      if (e.target === storeSheet) closeStorePicker();
    });
  }
});
