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
  'Produce':             { emoji: '🥬', order: 0 },
  'Meat & Poultry':      { emoji: '🥩', order: 1 },
  'Fish & Seafood':      { emoji: '🐟', order: 2 },
  'Dairy & Eggs':        { emoji: '🧀', order: 3 },
  'Bread & Bakery':      { emoji: '🍞', order: 4 },
  'Pasta & Grains':      { emoji: '🍝', order: 5 },
  'Canned & Jarred':     { emoji: '🥫', order: 6 },
  'Condiments & Spices': { emoji: '🧂', order: 7 },
  'Snacks':              { emoji: '🍿', order: 8 },
  'Beverages':           { emoji: '🥤', order: 9 },
  'Frozen Foods':        { emoji: '❄️', order: 10 },
  'Breakfast & Cereal':  { emoji: '🥣', order: 11 },
  'Baking':              { emoji: '🧁', order: 12 },
  'Household':           { emoji: '🏠', order: 13 },
  'Personal Care':       { emoji: '🧴', order: 14 },
  'Wine & Spirits':      { emoji: '🍷', order: 15 },
  'Other':               { emoji: '📦', order: 16 }
};

const CAT_ORDER = Object.keys(CATEGORIES).sort((a, b) => CATEGORIES[a].order - CATEGORIES[b].order);

const KEYWORD_MAP = {
  'Produce': ['sweet potato','bell pepper','green bean','brussels sprout','apple','banana','orange','grape','strawberry','blueberry','raspberry','mango','pineapple','watermelon','peach','pear','plum','cherry','lemon','lime','avocado','tomato','potato','onion','lettuce','spinach','kale','arugula','broccoli','cauliflower','carrot','celery','cucumber','zucchini','squash','mushroom','corn','asparagus','cabbage','radish','beet','eggplant','berries','melon','fruit','salad','herb','cilantro','parsley','basil','mint','ginger','jalapeño','pepper'],
  'Meat & Poultry': ['ground beef','ground turkey','chicken breast','chicken thigh','rotisserie chicken','chicken','beef','pork','turkey','lamb','steak','bacon','sausage','duck','ribs','roast','tenderloin','drumstick','wing','meatball','hot dog','jerky','chorizo','prosciutto','salami','pepperoni','meat','poultry'],
  'Fish & Seafood': ['shrimp','salmon','tuna','crab','lobster','scallop','clam','mussel','oyster','sardine','anchovy','cod','halibut','tilapia','trout','swordfish','mahi','catfish','branzino','calamari','squid','octopus','seafood','prawn','fish'],
  'Dairy & Eggs': ['cream cheese','sour cream','cottage cheese','almond milk','oat milk','soy milk','goat cheese','heavy cream','whipping cream','half and half','milk','cheese','yogurt','butter','cream','egg','mozzarella','cheddar','parmesan','ricotta','brie','feta','buttermilk','ghee','kefir','dairy'],
  'Bread & Bakery': ['english muffin','bread','bagel','tortilla','pita','naan','croissant','muffin','roll','bun','baguette','sourdough','ciabatta','wrap','flatbread','pretzel','crouton'],
  'Pasta & Grains': ['pasta','spaghetti','penne','fettuccine','linguine','macaroni','rice','quinoa','couscous','barley','farro','noodle','ramen','udon','orzo','gnocchi','tortellini','ravioli','lasagna','lentil','chickpea','black bean','kidney bean','grain'],
  'Canned & Jarred': ['tomato sauce','tomato paste','peanut butter','almond butter','canned','jarred','broth','stock','pickle','jam','jelly','preserves','nutella','salsa','applesauce','soup'],
  'Condiments & Spices': ['garlic powder','onion powder','chili powder','olive oil','vegetable oil','coconut oil','sesame oil','soy sauce','hot sauce','bbq sauce','maple syrup','salt','pepper','vinegar','ketchup','mustard','mayo','mayonnaise','sriracha','ranch','dressing','cumin','paprika','cinnamon','oregano','turmeric','cayenne','nutmeg','vanilla','seasoning','spice','honey','oil'],
  'Snacks': ['granola bar','protein bar','trail mix','rice cake','fruit snack','dried fruit','chip','cracker','popcorn','nut','almond','cashew','walnut','pecan','pistachio','candy','chocolate','gummy','cookie','snack'],
  'Beverages': ['coconut water','sparkling water','energy drink','iced tea','cold brew','water','juice','soda','coffee','tea','kombucha','sparkling','seltzer','lemonade','celsius','gatorade','creamer'],
  'Frozen Foods': ['frozen vegetable','frozen fruit','frozen meal','frozen pizza','ice cream','popsicle','dumpling','gelato','sorbet','tikka masala','frozen','waffle'],
  'Breakfast & Cereal': ['pancake mix','cereal','oatmeal','granola','pancake','syrup','breakfast','egg bites'],
  'Baking': ['baking soda','baking powder','brown sugar','powdered sugar','chocolate chip','cake mix','pie crust','yeast','sugar','flour','cocoa','frosting','sprinkle'],
  'Household': ['paper towel','toilet paper','trash bag','dish soap','laundry detergent','fabric softener','plastic wrap','zip lock','storage bag','light bulb','air freshener','trash bin','laundry hamper','can opener','wine opener','wine glass','oven mitt','bath mat','aluminum foil','parchment','napkin','sponge','scrub','cleaner','wipe','foil','battery','candle','broom','dustpan','mop','plate','spoon','fork','knife','cup','bowl','pot','pan','tupperware','container','towel','hanger','detergent','bleach','disinfectant','laundry'],
  'Personal Care': ['hand sanitizer','body wash','face wash','shampoo','conditioner','lotion','moisturizer','sunscreen','deodorant','toothpaste','toothbrush','floss','mouthwash','razor','shaving cream','cotton','bandage','medicine','vitamin','supplement','tissue','soap','sponge bath'],
  'Wine & Spirits': ['hard seltzer','wine','beer','vodka','whiskey','rum','tequila','gin','bourbon','champagne','prosecco','cocktail','scotch','brandy','cognac','sake','cider','mezcal','liqueur','liquor'],
};

for (const cat of Object.keys(KEYWORD_MAP)) {
  KEYWORD_MAP[cat].sort((a, b) => b.length - a.length);
}

function autoCategory(name) {
  const lower = name.toLowerCase();
  let best = null, bestLen = 0;
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (kw.length <= bestLen) continue;
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (re.test(lower)) { best = cat; bestLen = kw.length; }
    }
  }
  return best || 'Other';
}

function itemCategory(item) {
  if (item.category && CATEGORIES[item.category]) return item.category;
  return autoCategory(item.name);
}

// ── Seed data ──
const SEED_DATA = [
  { name: 'Bananas', category: 'Produce', count: 20 },
  { name: 'Avocados', category: 'Produce', count: 15 },
  { name: 'Tomatoes', category: 'Produce', count: 12 },
  { name: 'Onions', category: 'Produce', count: 12 },
  { name: 'Garlic', category: 'Produce', count: 10 },
  { name: 'Spinach', category: 'Produce', count: 10 },
  { name: 'Lemons', category: 'Produce', count: 8 },
  { name: 'Broccoli', category: 'Produce', count: 8 },
  { name: 'Bell Peppers', category: 'Produce', count: 7 },
  { name: 'Potatoes', category: 'Produce', count: 7 },
  { name: 'Chicken Breast', category: 'Meat & Poultry', count: 25 },
  { name: 'Ground Beef', category: 'Meat & Poultry', count: 15 },
  { name: 'Bacon', category: 'Meat & Poultry', count: 12 },
  { name: 'Salmon', category: 'Fish & Seafood', count: 15 },
  { name: 'Shrimp', category: 'Fish & Seafood', count: 12 },
  { name: 'Eggs', category: 'Dairy & Eggs', count: 30 },
  { name: 'Milk', category: 'Dairy & Eggs', count: 25 },
  { name: 'Butter', category: 'Dairy & Eggs', count: 20 },
  { name: 'Cheese', category: 'Dairy & Eggs', count: 15 },
  { name: 'Yogurt', category: 'Dairy & Eggs', count: 12 },
  { name: 'Bread', category: 'Bread & Bakery', count: 20 },
  { name: 'Tortillas', category: 'Bread & Bakery', count: 10 },
  { name: 'Rice', category: 'Pasta & Grains', count: 15 },
  { name: 'Pasta', category: 'Pasta & Grains', count: 12 },
  { name: 'Olive Oil', category: 'Condiments & Spices', count: 15 },
  { name: 'Soy Sauce', category: 'Condiments & Spices', count: 8 },
  { name: 'Honey', category: 'Condiments & Spices', count: 7 },
  { name: 'Coffee', category: 'Beverages', count: 20 },
  { name: 'Coconut Water', category: 'Beverages', count: 15 },
  { name: 'Sparkling Water', category: 'Beverages', count: 10 },
  { name: 'Frozen Vegetables', category: 'Frozen Foods', count: 10 },
  { name: 'Ice Cream', category: 'Frozen Foods', count: 8 },
  { name: 'Cereal', category: 'Breakfast & Cereal', count: 10 },
  { name: 'Paper Towels', category: 'Household', count: 20 },
  { name: 'Toilet Paper', category: 'Household', count: 20 },
  { name: 'Trash Bags', category: 'Household', count: 15 },
  { name: 'Dish Soap', category: 'Household', count: 10 },
  { name: 'Laundry Detergent', category: 'Household', count: 10 },
  { name: 'Shampoo', category: 'Personal Care', count: 8 },
  { name: 'Toothpaste', category: 'Personal Care', count: 8 },
];

// ── State ──
let listRef, suggestionsRef;
let currentUser = null;
let activeList = [];
let suggestionDB = {};
let activeListId = 'personal';
let sharedLists = {};
let sugCollapsed = localStorage.getItem('sugCollapsed') === 'true';
let doneCollapsed = localStorage.getItem('doneCollapsed') !== 'false';

const esc = s => s.replace(/['"<>&]/g, c => ({ "'": '&#39;', '"': '&quot;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function haptic(style) {
  if (!navigator.vibrate) return;
  if (style === 'light') navigator.vibrate(10);
  else if (style === 'medium') navigator.vibrate(20);
  else if (style === 'success') navigator.vibrate([10, 30, 10]);
  else if (style === 'heavy') navigator.vibrate([30, 10, 30]);
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
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

let recaptchaVerifier = null, confirmResult = null;

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
  const appEl = document.getElementById('app');
  if (user) {
    currentUser = user;
    overlay.style.display = 'none';
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
    appEl.classList.add('hidden');
  }
});

// ── Firebase listeners ──
function setupListeners() {
  onValue(listRef, snap => {
    activeList = snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [];
    render();
  });
  onValue(suggestionsRef, snap => {
    const data = snap.val();
    if (data) suggestionDB = data;
    else seedDatabase();
    render();
  });
}

function seedDatabase() {
  const updates = {};
  SEED_DATA.forEach(item => {
    updates[item.name] = { category: item.category, count: item.count, lastUsed: Date.now() };
  });
  update(suggestionsRef, updates);
}

// ── CRUD (Doherty Threshold — optimistic, instant UI) ──
function addItem(name, qty) {
  if (!currentUser || !name.trim()) return;
  name = name.trim();
  const category = autoCategory(name);
  qty = Math.max(1, parseInt(qty) || 1);

  if (activeList.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    toast(`"${name}" is already on your list`);
    haptic('heavy');
    return;
  }

  const targetRef = activeListId === 'personal' ? listRef : ref(db, `sharedLists/${activeListId}/items`);
  push(targetRef, { name, category, qty, checked: false });

  const current = suggestionDB[name];
  const updates = {};
  updates[name] = { category, count: current ? current.count + 1 : 1, lastUsed: Date.now() };
  update(suggestionsRef, updates);

  haptic('success');
  toast(`Added ${name}`);
}

function removeItem(id) {
  if (!currentUser) return;
  haptic('medium');
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    setTimeout(() => doRemove(id), 280);
  } else {
    doRemove(id);
  }
}

function doRemove(id) {
  const path = activeListId === 'personal'
    ? `users/${currentUser.uid}/shoppingList/${id}`
    : `sharedLists/${activeListId}/items/${id}`;
  remove(ref(db, path));
}

function toggleItem(id, currentChecked) {
  haptic('light');
  const path = activeListId === 'personal'
    ? `users/${currentUser.uid}/shoppingList/${id}`
    : `sharedLists/${activeListId}/items/${id}`;
  update(ref(db, path), { checked: !currentChecked });
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

// ── Shared lists ──
function loadSharedLists() {
  if (!currentUser) return;
  onValue(ref(db, `users/${currentUser.uid}/sharedLists`), snap => {
    sharedLists = snap.val() || {};
    renderListTabs();
  });
}

function createSharedList() {
  if (!currentUser) return;
  const nameInput = document.getElementById('sharedListName');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) { toast("Enter a list name"); return; }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
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
  render();
  const target = listId === 'personal' ? listRef : ref(db, `sharedLists/${listId}/items`);
  onValue(target, snap => {
    activeList = snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [];
    render();
  });
  renderListTabs();
}

function openShareModal(code) {
  const modal = document.getElementById('shareModal');
  const sheet = document.getElementById('shareSheet');
  const baseUrl = location.origin + location.pathname;

  if (code) {
    const shareUrl = `${baseUrl}?join=${code}`;
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <h2>Share This List</h2>
      <p>Send this link to invite others.</p>
      <div class="share-link-row">
        <input type="text" value="${shareUrl}" readonly id="shareLinkInput" />
        <button onclick="window.copyShareLink()">Copy</button>
      </div>
      <div id="membersContainer"></div>
      <div class="sheet-actions"><button class="btn-sec" onclick="window.closeShareModal()">Done</button></div>`;
    loadMembers(code);
  } else {
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <h2>Share & Collaborate</h2>
      <p>Create a shared list or join one with a code.</p>
      <input type="text" id="sharedListName" placeholder="New list name (e.g. Household)" />
      <button class="btn-login google" style="margin-bottom:14px;font-family:inherit" onclick="window.createSharedList()">Create Shared List</button>
      <div style="text-align:center;color:var(--text-dim);font-size:0.8rem;margin-bottom:10px">— or join existing —</div>
      <input type="text" id="joinCodeInput" placeholder="Enter invite code" style="text-transform:uppercase" />
      <div class="sheet-actions">
        <button class="btn-sec" onclick="window.closeShareModal()">Cancel</button>
        <button class="btn-pri" onclick="window.joinSharedList(document.getElementById('joinCodeInput').value)">Join</button>
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
    const el = document.getElementById('membersContainer');
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
  if (recognition) { recognition.stop(); recognition = null; btn.classList.remove('listening'); return; }
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
    showAutocomplete(text);
  };
  recognition.onerror = () => { btn.classList.remove('listening'); recognition = null; toast("Couldn't hear that"); };
  recognition.onend = () => { btn.classList.remove('listening'); recognition = null; };
  recognition.start();
}

// ── Autocomplete (Hick's Law — max 5 suggestions) ──
function showAutocomplete(query) {
  const el = document.getElementById('autocomplete');
  if (!query || query.length < 2) { el.classList.add('hidden'); return; }

  const lower = query.toLowerCase();
  const activeNames = new Set(activeList.map(i => i.name.toLowerCase()));

  let matches = Object.entries(suggestionDB)
    .map(([name, data]) => ({ name, ...data }))
    .filter(i => !activeNames.has(i.name.toLowerCase()) && i.name.toLowerCase().includes(lower))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(lower) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(lower) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;
      return (b.count || 0) - (a.count || 0);
    })
    .slice(0, 5);

  if (matches.length === 0) { el.classList.add('hidden'); return; }

  el.innerHTML = matches.map(item => {
    const cat = itemCategory(item);
    const info = CATEGORIES[cat] || CATEGORIES['Other'];
    return `<div class="ac-item" data-name="${esc(item.name)}">
      <span class="ac-emoji">${info.emoji}</span>
      <span class="ac-name">${esc(item.name)}</span>
      <span class="ac-cat">${esc(cat)}</span>
      <span class="ac-add">+</span>
    </div>`;
  }).join('');

  el.classList.remove('hidden');

  el.querySelectorAll('.ac-item').forEach(item => {
    item.addEventListener('click', () => {
      addItem(item.dataset.name, 1);
      document.getElementById('itemInput').value = '';
      el.classList.add('hidden');
      document.getElementById('itemInput').focus();
    });
  });
}

// ── Celebration (Peak-End Rule) ──
function celebrate() {
  const el = document.getElementById('celebration');
  el.classList.remove('hidden');
  const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#af52de'];
  let html = '';
  for (let i = 0; i < 40; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const size = 4 + Math.random() * 8;
    html += `<div class="confetti" style="left:${left}%;top:-10px;width:${size}px;height:${size}px;background:${color};animation-delay:${delay}s"></div>`;
  }
  el.innerHTML = html;
  setTimeout(() => { el.classList.add('hidden'); el.innerHTML = ''; }, 2000);
}

// ── Rendering ──
function render() {
  const area = document.getElementById('listArea');
  const progressWrap = document.getElementById('progressWrap');

  const unchecked = activeList.filter(i => !i.checked);
  const checked = activeList.filter(i => i.checked);
  const total = activeList.length;
  const checkedCount = checked.length;

  // Progress bar (Goal-Gradient Effect)
  if (total > 0) {
    progressWrap.classList.remove('hidden');
    const pct = Math.round((checkedCount / total) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = `${checkedCount} of ${total}`;

    if (checkedCount === total && total > 0) {
      celebrate();
    }
  } else {
    progressWrap.classList.add('hidden');
  }

  // Empty state
  if (total === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🛒</div>
        <div class="empty-title">What do you need?</div>
        <div class="empty-sub">Type below to start your list. We'll organize everything for you.</div>
      </div>
      ${renderSuggestions()}`;
    return;
  }

  // Group unchecked items by category
  const byCat = {};
  unchecked.forEach(item => {
    const cat = itemCategory(item);
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(item);
  });

  let html = '';

  // Unchecked items grouped by category
  CAT_ORDER.forEach(cat => {
    if (!byCat[cat]) return;
    const info = CATEGORIES[cat];
    html += `<div class="cat-section">
      <div class="cat-header">
        <span class="cat-emoji">${info.emoji}</span>
        <span class="cat-label">${esc(cat)}</span>
      </div>`;
    byCat[cat].forEach(item => { html += renderItem(item); });
    html += '</div>';
  });

  // "Got it" section for checked items
  if (checked.length > 0) {
    html += `<div class="done-section">
      <div class="done-header" onclick="window._toggleDone()">
        <span class="done-label">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="${doneCollapsed ? 'collapsed' : ''}"><polyline points="6 9 12 15 18 9"/></svg>
          Got it <span class="done-count">${checked.length}</span>
        </span>
        <button class="done-clear" onclick="event.stopPropagation(); window.clearChecked()">Clear all</button>
      </div>
      <div class="done-items ${doneCollapsed ? 'collapsed' : ''}" style="max-height:${doneCollapsed ? '0' : checked.length * 60 + 'px'}">`;
    checked.forEach(item => { html += renderItem(item); });
    html += '</div></div>';
  }

  // Suggestions
  html += renderSuggestions();

  area.innerHTML = html;
  initGestures(area);
}

function renderItem(item) {
  const isChecked = item.checked;
  const qty = item.qty && item.qty > 1 ? `<span class="item-qty">x${item.qty}</span>` : '';
  return `<div class="list-item ${isChecked ? 'is-checked' : ''} adding" data-id="${item.id}">
    <div class="item-swipe-bg">Delete</div>
    <div class="item-inner">
      <div class="item-check ${isChecked ? 'checked' : ''}" onclick="window._toggle('${item.id}', ${isChecked})">
        <svg viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5L5 9.5L10 3"/></svg>
      </div>
      <span class="item-name">${esc(item.name)}</span>
      ${qty}
    </div>
  </div>`;
}

function renderSuggestions() {
  const activeNames = new Set(activeList.map(i => i.name.toLowerCase()));
  let candidates = Object.entries(suggestionDB)
    .map(([name, data]) => ({ name, ...data }))
    .filter(i => !activeNames.has(i.name.toLowerCase()))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 30);

  if (candidates.length === 0) return '';

  const chips = candidates.map(item => {
    const cat = itemCategory(item);
    const info = CATEGORIES[cat] || CATEGORIES['Other'];
    return `<button class="sug-chip" onclick="window._addSug('${item.name.replace(/'/g, "\\'")}')">${info.emoji} ${esc(item.name)} <span class="plus">+</span></button>`;
  }).join('');

  return `<div class="suggestions-section">
    <div class="sug-title">
      <span>Suggestions</span>
      <button class="sug-toggle ${sugCollapsed ? 'collapsed' : ''}" onclick="window._toggleSug()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
    <div class="sug-grid ${sugCollapsed ? 'collapsed' : ''}">${chips}</div>
  </div>`;
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

// ── Gestures (Jakob's Law — familiar patterns) ──
function initGestures(container) {
  let startX, currentX, swiping = false, target = null;
  const threshold = 80;

  container.addEventListener('touchstart', e => {
    const item = e.target.closest('.list-item');
    if (!item || e.target.closest('.item-check') || e.target.closest('.done-clear')) return;
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
      const inner = target.querySelector('.item-inner');
      if (inner) {
        inner.style.transform = `translateX(${Math.max(-threshold, -dx)}px)`;
        target.classList.toggle('swiping', dx > 30);
      }
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (!target) return;
    const inner = target.querySelector('.item-inner');
    if (swiping && startX - currentX > threshold) {
      const id = target.dataset.id;
      if (id) removeItem(id);
    } else if (inner) {
      inner.style.transform = '';
      target.classList.remove('swiping');
    }
    target = null;
    swiping = false;
  }, { passive: true });
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

// Window bindings
window._toggle = toggleItem;
window._addSug = (name) => { addItem(name, 1); };
window._switchList = switchToList;
window._toggleDone = () => {
  doneCollapsed = !doneCollapsed;
  localStorage.setItem('doneCollapsed', doneCollapsed);
  render();
  haptic('light');
};
window._toggleSug = () => {
  sugCollapsed = !sugCollapsed;
  localStorage.setItem('sugCollapsed', sugCollapsed);
  render();
  haptic('light');
};
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

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('itemInput');
  const addBtn = document.getElementById('addBtn');
  const acEl = document.getElementById('autocomplete');

  // Add item on button click or Enter key
  const doAdd = () => {
    const val = input.value.trim();
    if (!val) return;
    addItem(val, 1);
    input.value = '';
    acEl.classList.add('hidden');
    input.focus();
  };

  addBtn.addEventListener('click', doAdd);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
  });

  // Autocomplete as you type (Postel's Law — accept flexible input)
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => showAutocomplete(input.value.trim()), 150);
  });

  // Hide autocomplete on outside tap
  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-wrap')) acEl.classList.add('hidden');
  });

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
