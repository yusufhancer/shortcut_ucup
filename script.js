const STORAGE_KEY = "shortcut_ucup.shortcuts";
const THEME_KEY = "shortcut_ucup.theme";

const defaultShortcuts = [
  {
    id: 1,
    name: "Google",
    url: "https://www.google.com",
    logo: "G",
    category: "Umum",
    session: ""
  },
  {
    id: 2,
    name: "GitHub",
    url: "https://github.com",
    logo: "https://github.githubassets.com/favicons/favicon.png",
    category: "Coding",
    session: ""
  },
  {
    id: 3,
    name: "YouTube",
    url: "https://www.youtube.com",
    logo: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png",
    category: "Hiburan",
    session: ""
  }
];

const grid = document.querySelector("#shortcutGrid");
const categoryFilter = document.querySelector("#categoryFilter");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const totalShortcuts = document.querySelector("#totalShortcuts");
const storedSessions = document.querySelector("#storedSessions");
const resultInfo = document.querySelector("#resultInfo");
const dialog = document.querySelector("#shortcutDialog");
const modalBackdrop = document.querySelector("#modalBackdrop");
const form = document.querySelector("#shortcutForm");
const dialogTitle = document.querySelector("#dialogTitle");
const shortcutId = document.querySelector("#shortcutId");
const nameInput = document.querySelector("#nameInput");
const urlInput = document.querySelector("#urlInput");
const logoInput = document.querySelector("#logoInput");
const categoryInput = document.querySelector("#categoryInput");
const sessionInput = document.querySelector("#sessionInput");
const addShortcutBtn = document.querySelector("#addShortcutBtn");
const quickAddBtn = document.querySelector("#quickAddBtn");
const closeDialogBtn = document.querySelector("#closeDialogBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const themeBtn = document.querySelector("#themeBtn");
const profileBtn = document.querySelector("#profileBtn");

let shortcuts = loadShortcuts();
let searchTerm = "";
let activeCategory = "Semua";

applySavedTheme();
renderShortcuts();

addShortcutBtn.addEventListener("click", openCreateDialog);
quickAddBtn.addEventListener("click", openCreateDialog);
closeDialogBtn.addEventListener("click", closeDialog);
cancelBtn.addEventListener("click", closeDialog);
themeBtn.addEventListener("click", toggleTheme);
profileBtn.addEventListener("click", () => {
  window.alert("Pemilik dashboard: Ucup");
});
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeDialog();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeDialog();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderShortcuts();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const shortcut = {
    id: shortcutId.value ? Number(shortcutId.value) : Date.now(),
    name: nameInput.value.trim(),
    url: normalizeUrl(urlInput.value.trim()),
    logo: logoInput.value.trim(),
    category: categoryInput.value,
    session: sessionInput.value.trim()
  };

  if (!shortcut.name || !shortcut.url) return;

  const existingIndex = shortcuts.findIndex((item) => item.id === shortcut.id);
  if (existingIndex >= 0) {
    shortcuts[existingIndex] = shortcut;
  } else {
    shortcuts.unshift(shortcut);
  }

  saveShortcuts();
  renderShortcuts();
  closeDialog();
});

function loadShortcuts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultShortcuts;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeShortcut) : defaultShortcuts;
  } catch {
    return defaultShortcuts;
  }
}

function saveShortcuts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

function renderShortcuts() {
  const visibleShortcuts = shortcuts.filter((shortcut) => {
    const target = `${shortcut.name} ${shortcut.url} ${shortcut.category}`.toLowerCase();
    const matchesSearch = target.includes(searchTerm);
    const matchesCategory = activeCategory === "Semua" || shortcut.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  renderCategoryFilter();
  grid.innerHTML = "";
  visibleShortcuts.forEach((shortcut) => {
    grid.appendChild(createShortcutCard(shortcut));
  });

  totalShortcuts.textContent = String(shortcuts.length);
  storedSessions.textContent = String(shortcuts.filter((shortcut) => shortcut.session).length);
  emptyState.hidden = visibleShortcuts.length > 0;
  resultInfo.textContent = getResultText(visibleShortcuts.length);
}

function createShortcutCard(shortcut) {
  const card = document.createElement("article");
  card.className = "shortcut-card";
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Buka ${shortcut.name}`);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.append(
    createActionButton("Edit", "M13 6h5m-2.5-2.5 5 5L8 21H3v-5L15.5 3.5Z", (event) => {
      event.stopPropagation();
      openEditDialog(shortcut);
    }),
    createActionButton("Hapus", "M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15", (event) => {
      event.stopPropagation();
      deleteShortcut(shortcut.id, shortcut.name);
    })
  );

  const logo = document.createElement("div");
  logo.className = "shortcut-logo";
  fillLogo(logo, shortcut);

  const name = document.createElement("h3");
  name.className = "shortcut-name";
  name.textContent = shortcut.name;

  const category = document.createElement("p");
  category.className = "shortcut-category";
  category.textContent = shortcut.category || "Umum";

  card.append(actions, logo, name, category);
  card.addEventListener("click", () => openShortcut(shortcut.url));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openShortcut(shortcut.url);
    }
  });

  return card;
}

function createActionButton(label, pathData, handler) {
  const button = document.createElement("button");
  button.className = "icon-btn";
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${pathData}"></path></svg>`;
  button.addEventListener("click", handler);
  return button;
}

function fillLogo(container, shortcut) {
  if (isImageUrl(shortcut.logo)) {
    const image = document.createElement("img");
    image.src = shortcut.logo;
    image.alt = "";
    image.onerror = () => {
      container.textContent = getInitial(shortcut.name);
    };
    container.appendChild(image);
    return;
  }

  container.textContent = shortcut.logo || getInitial(shortcut.name);
}

function openShortcut(url) {
  window.open(normalizeUrl(url), "_blank", "noopener,noreferrer");
}

function openCreateDialog() {
  dialogTitle.textContent = "Tambah Shortcut";
  form.reset();
  shortcutId.value = "";
  modalBackdrop.hidden = false;
  nameInput.focus();
}

function openEditDialog(shortcut) {
  dialogTitle.textContent = "Edit Shortcut";
  shortcutId.value = shortcut.id;
  nameInput.value = shortcut.name;
  urlInput.value = shortcut.url;
  logoInput.value = shortcut.logo;
  categoryInput.value = shortcut.category || "Umum";
  sessionInput.value = shortcut.session;
  modalBackdrop.hidden = false;
  nameInput.focus();
}

function closeDialog() {
  modalBackdrop.hidden = true;
  form.reset();
}

function deleteShortcut(id, name) {
  const confirmed = window.confirm(`Hapus shortcut "${name}"?`);
  if (!confirmed) return;

  shortcuts = shortcuts.filter((shortcut) => shortcut.id !== id);
  saveShortcuts();
  renderShortcuts();
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function isImageUrl(value) {
  return /^https?:\/\//i.test(value);
}

function getInitial(name) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function getResultText(count) {
  if (count === 0 && searchTerm) return "Tidak ada shortcut yang cocok.";
  if (count === 0) return "Tambah shortcut pertama Ucup.";
  if (searchTerm || activeCategory !== "Semua") return `${count} shortcut ditemukan.`;
  return "Semua shortcut siap dibuka.";
}

function renderCategoryFilter() {
  const categories = ["Semua", ...new Set(shortcuts.map((shortcut) => shortcut.category || "Umum"))];
  if (!categories.includes(activeCategory)) activeCategory = "Semua";

  categoryFilter.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `category-chip${category === activeCategory ? " active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      activeCategory = category;
      renderShortcuts();
    });
    categoryFilter.appendChild(button);
  });
}

function normalizeShortcut(shortcut) {
  return {
    id: shortcut.id || Date.now(),
    name: shortcut.name || "Shortcut",
    url: shortcut.url || "#",
    logo: shortcut.logo || "",
    category: shortcut.category || guessCategory(shortcut.name, shortcut.url),
    session: shortcut.session || ""
  };
}

function guessCategory(name = "", url = "") {
  const target = `${name} ${url}`.toLowerCase();
  if (target.includes("chatgpt") || target.includes("openai") || target.includes("gemini") || target.includes("ai")) return "AI";
  if (target.includes("youtube") || target.includes("netflix") || target.includes("music") || target.includes("game")) return "Hiburan";
  if (target.includes("github") || target.includes("code") || target.includes("vercel")) return "Coding";
  return "Umum";
}

function applySavedTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  document.documentElement.classList.toggle("light", theme === "light");
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
}
