import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, off, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// ── Categories ──
const CATEGORIES = {
  'Produce':             { emoji: '🥬', color: '#16a34a' },
  'Meat & Poultry':      { emoji: '🥩', color: '#dc2626' },
  'Fish & Seafood':      { emoji: '🐟', color: '#0284c7' },
  'Dairy & Eggs':        { emoji: '🧀', color: '#eab308' },
  'Bread & Bakery':      { emoji: '🍞', color: '#d97706' },
  'Deli':                { emoji: '🥪', color: '#9333ea' },
  'Pasta & Grains':      { emoji: '🍝', color: '#b45309' },
  'Canned & Jarred':     { emoji: '🥫', color: '#b91c1c' },
  'Condiments & Spices': { emoji: '🧂', color: '#78716c' },
  'Snacks':              { emoji: '🍿', color: '#f59e0b' },
  'Beverages':           { emoji: '🥤', color: '#0891b2' },
  'Frozen Foods':        { emoji: '❄️', color: '#6366f1' },
  'Breakfast & Cereal':  { emoji: '🥣', color: '#ea580c' },
  'Baking':              { emoji: '🧁', color: '#db2777' },
  'Household':           { emoji: '🧹', color: '#0d9488' },
  'Personal Care':       { emoji: '🧴', color: '#7c3aed' },
  'Wine & Spirits':      { emoji: '🍷', color: '#7f1d1d' },
  'Other':               { emoji: '🛒', color: '#6b7280' }
};

const CATEGORY_ORDER = Object.keys(CATEGORIES);

const KEYWORD_MAP = {
  'Produce': ['apple','banana','orange','grape','strawberry','blueberry','raspberry','mango','pineapple','watermelon','peach','pear','plum','cherry','lemon','lime','avocado','tomato','potato','onion','garlic','ginger','lettuce','spinach','kale','arugula','broccoli','cauliflower','carrot','celery','cucumber','zucchini','squash','bell pepper','jalapeño','mushroom','corn','asparagus','green bean','pea','sweet potato','cabbage','radish','beet','eggplant','artichoke','brussels sprout','cilantro','parsley','basil','mint','rosemary','thyme','dill','chive','scallion','leek','shallot','fruit','vegetable','salad','herb','berries','melon'],
  'Meat & Poultry': ['chicken','beef','pork','turkey','lamb','steak','ground beef','ground turkey','bacon','sausage','ham','veal','bison','duck','ribs','roast','tenderloin','thigh','drumstick','wing','breast','rotisserie','meatball','hot dog','jerky','chorizo','prosciutto','salami','pepperoni'],
  'Fish & Seafood': ['fish','salmon','tuna','shrimp','crab','lobster','scallop','clam','mussel','oyster','sardine','anchovy','cod','halibut','tilapia','trout','swordfish','mahi','catfish','branzino','calamari','squid','octopus','seafood','prawn'],
  'Dairy & Eggs': ['milk','cheese','yogurt','butter','cream','egg','sour cream','cottage cheese','cream cheese','mozzarella','cheddar','parmesan','ricotta','brie','gouda','swiss','feta','goat cheese','half and half','whipping cream','heavy cream','almond milk','oat milk','soy milk','buttermilk','ghee','kefir'],
  'Bread & Bakery': ['bread','bagel','tortilla','pita','naan','croissant','muffin','roll','bun','baguette','sourdough','ciabatta','focaccia','english muffin','wrap','flatbread','cornbread','brioche','pretzel','crouton'],
  'Deli': ['deli','cold cut','roast beef','turkey breast','sandwich','sub','wrap','coleslaw','potato salad','macaroni salad','hummus','olive'],
  'Pasta & Grains': ['pasta','spaghetti','penne','fettuccine','linguine','macaroni','rice','quinoa','couscous','barley','oat','farro','noodle','ramen','udon','orzo','gnocchi','tortellini','ravioli','lasagna','flour','cornmeal','polenta','grain','lentil','chickpea','bean','black bean','kidney bean','pinto bean'],
  'Canned & Jarred': ['canned','jarred','can of','tomato sauce','tomato paste','diced tomato','crushed tomato','soup','broth','stock','coconut milk canned','tuna can','sardine can','pickle','jam','jelly','preserves','peanut butter','almond butter','nutella','salsa','applesauce'],
  'Condiments & Spices': ['salt','pepper','olive oil','vegetable oil','coconut oil','sesame oil','vinegar','soy sauce','ketchup','mustard','mayo','mayonnaise','hot sauce','sriracha','worcestershire','bbq sauce','teriyaki','ranch','dressing','cumin','paprika','cinnamon','oregano','turmeric','chili powder','garlic powder','onion powder','cayenne','nutmeg','vanilla','extract','seasoning','spice','marinade','relish','honey','maple syrup','agave'],
  'Snacks': ['chip','cracker','popcorn','pretzel','nut','almond','cashew','walnut','pecan','pistachio','trail mix','granola bar','protein bar','candy','chocolate','gummy','cookie','snack','rice cake','fruit snack','dried fruit'],
  'Beverages': ['water','juice','soda','pop','coffee','tea','kombucha','sparkling','seltzer','coconut water','sports drink','energy drink','gatorade','celsius','lemonade','iced tea','cold brew','creamer'],
  'Frozen Foods': ['frozen','ice cream','popsicle','pizza frozen','waffle frozen','dumpling','tikka masala','burrito frozen','pot pie','tv dinner','gelato','sorbet','frozen fruit','frozen vegetable','frozen meal','egg bites'],
  'Breakfast & Cereal': ['cereal','oatmeal','granola','pancake','waffle','syrup','breakfast'],
  'Baking': ['baking soda','baking powder','yeast','sugar','brown sugar','powdered sugar','flour','cocoa','chocolate chip','sprinkle','frosting','cake mix','pie crust'],
  'Household': ['paper towel','toilet paper','napkin','trash bag','dish soap','laundry detergent','fabric softener','bleach','disinfectant','sponge','scrub','cleaner','wipe','foil','plastic wrap','parchment','zip lock','storage bag','light bulb','battery','candle','match','broom','dustpan','mop','vacuum','air freshener','trash bin','plate','spoon','fork','knife','cup','glass','bowl','pot','pan','tupperware','container','oven mitt','towel','bath mat','laundry hamper','hanger','iron','can opener','wine opener','wine glass','dining chair'],
  'Personal Care': ['shampoo','conditioner','body wash','soap bar','lotion','moisturizer','sunscreen','deodorant','toothpaste','toothbrush','floss','mouthwash','razor','shaving cream','cotton','q-tip','bandage','medicine','vitamin','supplement','tissue','face wash','hand sanitizer','bathing sponge'],
  'Wine & Spirits': ['wine','beer','vodka','whiskey','rum','tequila','gin','bourbon','champagne','prosecco','hard seltzer','cocktail','mixer','bourbon','scotch','brandy','cognac','sake','cider','mezcal','liqueur','liquor'],
};

function autoCategory(name) {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return cat;
    }
  }
  return 'Other';
}

function itemCategory(item) {
  if (item.category && CATEGORIES[item.category]) return item.category;
  return autoCategory(item.name);
}

// ── State ──
let listRef, suggestionsRef;
let currentUser = null;
let activeList = [];
let suggestionDB = {};
let activeListId = 'personal';
let sharedLists = {};
let searchQuery = '';
let selectedCategory = '';
let suggestionsCollapsed = false;

const SEED_DATA = [
  { name: 'Eggs', category: 'Dairy & Eggs', count: 30 },
  { name: 'Butter', category: 'Dairy & Eggs', count: 20 },
  { name: 'Olive oil', category: 'Condiments & Spices', count: 15 },
  { name: 'Salt', category: 'Condiments & Spices', count: 10 },
  { name: 'Pepper', category: 'Condiments & Spices', count: 10 },
  { name: 'Branzino Fish', category: 'Fish & Seafood', count: 12 },
  { name: 'Tikka Masala', category: 'Frozen Foods', count: 15 },
  { name: 'Argentinian Red Shrimp — Ginger Garlic Butter', category: 'Fish & Seafood', count: 12 },
  { name: 'Wild Raw Argentinian Red Shrimp (1 lb bag)', category: 'Fish & Seafood', count: 12 },
  { name: 'Pulled Chicken Salsa Verde', category: 'Frozen Foods', count: 15 },
  { name: 'Pre-Cooked Grilled Chicken Strips', category: 'Meat & Poultry', count: 15 },
  { name: 'Bacon Cheddar Egg Bites', category: 'Breakfast & Cereal', count: 15 },
  { name: 'Kirkland Rotisserie Chicken', category: 'Meat & Poultry', count: 25 },
  { name: 'Kirkland Grilled Chicken Breast Skewers', category: 'Meat & Poultry', count: 10 },
  { name: 'Kirkland Wild Alaskan Sockeye Salmon', category: 'Fish & Seafood', count: 10 },
  { name: 'Kahiki Chicken Rice Bowls — Teriyaki', category: 'Frozen Foods', count: 8 },
  { name: 'Bibigo Beef Pho Steamed Dumplings', category: 'Frozen Foods', count: 10 },
  { name: 'Kirkland Boneless Chicken Breasts (frozen)', category: 'Frozen Foods', count: 10 },
  { name: 'Coconut Water', category: 'Beverages', count: 15 },
  { name: 'Celsius', category: 'Beverages', count: 15 },
  { name: 'Laundry Detergent', category: 'Household', count: 5 },
  { name: 'Toilet Paper', category: 'Household', count: 20 },
  { name: 'Paper Towels', category: 'Household', count: 20 },
  { name: 'Kitchen Napkins', category: 'Household', count: 10 },
  { name: 'Trash Bags', category: 'Household', count: 10 },
  { name: 'Plates', category: 'Household', count: 5 },
  { name: 'Cups', category: 'Household', count: 5 },
  { name: 'Spoons', category: 'Household', count: 5 },
  { name: 'Wine Glass', category: 'Household', count: 5 },
  { name: 'Hand Towels', category: 'Household', count: 5 },
  { name: 'Bathing Sponge', category: 'Personal Care', count: 2 },
  { name: 'Broom and Dustpan', category: 'Household', count: 1 },
  { name: 'Tupperware', category: 'Household', count: 5 },
  { name: 'Oven Mitts', category: 'Household', count: 1 },
  { name: 'Can Opener', category: 'Household', count: 1 },
  { name: 'Wine Opener', category: 'Household', count: 1 },
  { name: 'Bath Mat', category: 'Household', count: 1 },
  { name: 'Laundry Hamper', category: 'Household', count: 1 },
  { name: 'Trash Bin', category: 'Household', count: 1 },
  { name: 'Rain Jacket', category: 'Other', count: 1 },
  { name: 'Dining Chair', category: 'Other', count: 2 },
];

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
}

function seedDatabase() {
  const updates = {};
  SEED_DATA.forEach(item => {
    updates[item.name] = { category: item.category, count: item.count, lastUsed: Date.now() };
  });
  update(suggestionsRef, updates);
}

// ── CRUD ──
function addItem(name, category, qty) {
  if (!currentUser || !name.trim()) return;
  name = name.trim();
  category = category || autoCategory(name);
  qty = Math.max(1, parseInt(qty) || 1);

  const exists = activeList.some(i => i.name.toLowerCase() === name.toLowerCase());
  if (exists) { toast(`"${name}" already on list`); haptic('heavy'); return; }

  const targetRef = activeListId === 'personal' ? listRef : ref(db, `sharedLists/${activeListId}/items`);
  push(targetRef, { name, category, qty, checked: false });
  updateStats(name, category);
  haptic('success');
  toast(`Added ${name}`);
}

function updateStats(name, category) {
  const current = suggestionDB[name];
  const updates = {};
  updates[name] = { category, count: current ? current.count + 1 : 1, lastUsed: Date.now() };
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

// ── Category picker bottom sheet ──
function openCategoryPicker() {
  const overlay = document.getElementById('categorySheet');
  let html = '<div class="cat-grid">';

  CATEGORY_ORDER.forEach(name => {
    const cat = CATEGORIES[name];
    const sel = selectedCategory === name ? 'selected' : '';
    html += `
      <div class="cat-grid-item ${sel}" onclick="window._pickCategory('${jsesc(name)}')">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${esc(name)}</span>
      </div>`;
  });

  html += '</div>';
  document.getElementById('catGridContainer').innerHTML = html;
  overlay.classList.add('open');
  haptic('light');
}

function closeCategoryPicker() {
  document.getElementById('categorySheet').classList.remove('open');
}

function pickCategory(name) {
  selectedCategory = name;
  updateCategoryButton();
  closeCategoryPicker();
  haptic('light');
}

function updateCategoryButton() {
  const btn = document.getElementById('catPickerBtn');
  if (!btn) return;
  if (selectedCategory && CATEGORIES[selectedCategory]) {
    const cat = CATEGORIES[selectedCategory];
    btn.innerHTML = `<span class="cat-btn-emoji">${cat.emoji}</span> ${esc(selectedCategory)} <span class="chevron">▼</span>`;
    btn.classList.add('has-value');
  } else {
    btn.innerHTML = `Category <span class="chevron">▼</span>`;
    btn.classList.remove('has-value');
  }
}

function autoFillCategory() {
  const input = document.getElementById('itemInput');
  if (!input) return;
  const name = input.value.trim();
  if (name.length < 2) return;
  const cat = autoCategory(name);
  if (cat !== 'Other' && !selectedCategory) {
    selectedCategory = cat;
    updateCategoryButton();
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
    autoFillCategory();
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

  const byCat = {};
  activeList.forEach(item => {
    const cat = itemCategory(item);
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(item);
  });

  let html = '';
  CATEGORY_ORDER.forEach(cat => {
    if (!byCat[cat]) return;
    const info = CATEGORIES[cat];
    const items = byCat[cat];
    const unchecked = items.filter(i => !i.checked).length;
    html += `
      <div class="cat-group">
        <div class="cat-group-header">
          <span class="cat-group-emoji">${info.emoji}</span>
          <span class="cat-group-name">${esc(cat)}</span>
          <span class="cat-group-count">${unchecked}/${items.length}</span>
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
      i.name.toLowerCase().includes(searchQuery) ||
      itemCategory(i).toLowerCase().includes(searchQuery)
    );
  }

  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (b.lastUsed || 0) - (a.lastUsed || 0);
  });

  const top = candidates.slice(0, 80);

  if (countEl) countEl.textContent = top.length;

  if (top.length === 0) {
    container.innerHTML = searchQuery
      ? `<div class="empty-state"><div class="empty-icon">🔍</div><div>No matches for "${esc(searchQuery)}"</div></div>`
      : `<div class="empty-state"><div class="empty-icon">💡</div><div>No suggestions yet. Add items to build your list.</div></div>`;
    return;
  }

  const byCat = {};
  top.forEach(item => {
    const cat = itemCategory(item);
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(item);
  });

  let html = '';
  CATEGORY_ORDER.forEach(cat => {
    if (!byCat[cat]) return;
    const info = CATEGORIES[cat];
    const items = byCat[cat];
    html += `
      <div class="sug-section">
        <div class="sug-header">
          <span class="sug-emoji">${info.emoji}</span>
          <span class="sug-cat-name">${esc(cat)}</span>
          <span class="sug-count">${items.length}</span>
        </div>
        <div class="sug-items">`;

    items.forEach(item => {
      const cat = itemCategory(item);
      html += `
        <div class="sug-item" onclick="window._addSuggestion('${jsesc(item.name)}', '${jsesc(cat)}')">
          <span class="item-text">${esc(item.name)}</span>
          <span class="sug-plus">+</span>
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

suggestionsCollapsed = localStorage.getItem('suggestionsCollapsed') === 'true';

// Expose to window
window._toggle = toggleItem;
window._remove = removeItem;
window._addSuggestion = (name, category) => { addItem(name, category, 1); scrollTo({ top: 0, behavior: 'smooth' }); };
window._switchList = switchToList;
window._pickCategory = pickCategory;
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
window.openCategoryPicker = openCategoryPicker;
window.closeCategoryPicker = closeCategoryPicker;
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
      const cat = selectedCategory || autoCategory(itemInput.value);
      addItem(itemInput.value, cat, qtyInput.value);
      itemInput.value = '';
      qtyInput.value = '1';
      selectedCategory = '';
      updateCategoryButton();
      itemInput.focus();
    });
  }

  if (itemInput) {
    let debounce;
    itemInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(autoFillCategory, 300);
    });
  }

  if (searchInput) searchInput.addEventListener('input', handleSearch);

  if (suggestionsCollapsed && suggestionsToggle && suggestionsContent) {
    suggestionsContent.classList.add('collapsed');
    suggestionsToggle.classList.add('collapsed');
  }

  const catSheet = document.getElementById('categorySheet');
  if (catSheet) {
    catSheet.addEventListener('click', e => {
      if (e.target === catSheet) closeCategoryPicker();
    });
  }

  // Pull-to-refresh for standalone PWA
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    let pullStartY = 0, pulling = false;
    const indicator = document.getElementById('pullIndicator');
    document.addEventListener('touchstart', e => {
      if (window.scrollY === 0 && e.touches.length === 1) {
        pullStartY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - pullStartY;
      if (dy > 0 && dy < 150 && window.scrollY === 0) {
        const progress = Math.min(dy / 80, 1);
        indicator.style.transform = `translateX(-50%) translateY(${dy * 0.5}px)`;
        indicator.style.opacity = progress;
        indicator.querySelector('.pull-arrow').style.transform = `rotate(${progress * 180}deg)`;
      }
    }, { passive: true });
    document.addEventListener('touchend', () => {
      if (!pulling) return;
      pulling = false;
      const opacity = parseFloat(indicator.style.opacity || 0);
      if (opacity >= 1) {
        indicator.querySelector('.pull-arrow').textContent = '↻';
        indicator.style.transition = 'opacity 0.3s';
        setTimeout(() => location.reload(), 300);
      } else {
        indicator.style.transition = 'transform 0.2s, opacity 0.2s';
        indicator.style.transform = 'translateX(-50%) translateY(0)';
        indicator.style.opacity = 0;
        setTimeout(() => { indicator.style.transition = ''; }, 200);
      }
    });
  }
});
