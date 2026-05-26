const STORAGE_KEY = "shortcut_ucup.shortcuts";
const THEME_KEY = "shortcut_ucup.theme";

const defaultShortcuts = [
  {
    id: 1,
    name: "Google",
    url: "https://www.google.com",
    logo: "G",
    categories: ["Umum"],
    pinned: false,
    note: "Mesin pencari cepat.",
    order: 1,
    session: ""
  },
  {
    id: 2,
    name: "GitHub",
    url: "https://github.com",
    logo: "https://github.githubassets.com/favicons/favicon.png",
    categories: ["Coding", "Belajar"],
    pinned: false,
    note: "Repo, coding, dan hosting.",
    order: 2,
    session: ""
  },
  {
    id: 3,
    name: "YouTube",
    url: "https://www.youtube.com",
    logo: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png",
    categories: ["Hiburan"],
    pinned: false,
    note: "Video dan hiburan.",
    order: 3,
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
const pinnedInput = document.querySelector("#pinnedInput");
const noteInput = document.querySelector("#noteInput");
const sessionInput = document.querySelector("#sessionInput");
const addShortcutBtn = document.querySelector("#addShortcutBtn");
const quickAddBtn = document.querySelector("#quickAddBtn");
const closeDialogBtn = document.querySelector("#closeDialogBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const themeBtn = document.querySelector("#themeBtn");
const profileBtn = document.querySelector("#profileBtn");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const importFileInput = document.querySelector("#importFileInput");
const openAllBtn = document.querySelector("#openAllBtn");
const selectModeBtn = document.querySelector("#selectModeBtn");
const openSelectedBtn = document.querySelector("#openSelectedBtn");

let shortcuts = loadShortcuts();
let searchTerm = "";
let activeCategory = "Semua";
let selectMode = false;
let selectedIds = new Set();
let draggedId = null;

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
exportBtn.addEventListener("click", exportBackup);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", importBackup);
openAllBtn.addEventListener("click", openAllVisibleShortcuts);
selectModeBtn.addEventListener("click", toggleSelectMode);
openSelectedBtn.addEventListener("click", openSelectedShortcuts);
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
    categories: getSelectedCategories(),
    pinned: pinnedInput.checked,
    note: noteInput.value.trim(),
    order: shortcutId.value ? getShortcutOrder(Number(shortcutId.value)) : getNextOrder(),
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
  if (!saved) return defaultShortcuts.map(normalizeShortcut);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeShortcut) : defaultShortcuts.map(normalizeShortcut);
  } catch {
    return defaultShortcuts.map(normalizeShortcut);
  }
}

function saveShortcuts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

function renderShortcuts() {
  const visibleShortcuts = getVisibleShortcuts();

  renderCategoryFilter();
  grid.innerHTML = "";
  visibleShortcuts.forEach((shortcut) => {
    grid.appendChild(createShortcutCard(shortcut));
  });

  totalShortcuts.textContent = String(shortcuts.length);
  storedSessions.textContent = String(shortcuts.filter((shortcut) => shortcut.session).length);
  emptyState.hidden = visibleShortcuts.length > 0;
  resultInfo.textContent = getResultText(visibleShortcuts.length);
  openSelectedBtn.hidden = !selectMode;
  openSelectedBtn.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>${selectedIds.size ? `Buka Pilihan (${selectedIds.size})` : "Buka Pilihan"}`;
  selectModeBtn.classList.toggle("active", selectMode);
}

function getVisibleShortcuts() {
  return shortcuts.filter((shortcut) => {
    const categories = getShortcutCategories(shortcut);
    const target = `${shortcut.name} ${shortcut.url} ${categories.join(" ")}`.toLowerCase();
    const matchesSearch = target.includes(searchTerm);
    const matchesCategory = activeCategory === "Semua" || categories.includes(activeCategory);
    return matchesSearch && matchesCategory;
  }).sort(sortShortcuts);
}

function createShortcutCard(shortcut) {
  const card = document.createElement("article");
  card.className = "shortcut-card";
  if (selectMode) card.classList.add("selecting");
  if (selectedIds.has(shortcut.id)) card.classList.add("selected");
  card.tabIndex = 0;
  card.draggable = !selectMode;
  card.dataset.id = String(shortcut.id);
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Buka ${shortcut.name}`);

  if (selectMode) {
    const selectCheck = document.createElement("input");
    selectCheck.className = "select-check";
    selectCheck.type = "checkbox";
    selectCheck.checked = selectedIds.has(shortcut.id);
    selectCheck.setAttribute("aria-label", `Pilih ${shortcut.name}`);
    selectCheck.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleShortcutSelection(shortcut.id);
    });
    card.appendChild(selectCheck);
  } else if (shortcut.pinned) {
    const pin = document.createElement("span");
    pin.className = "pin-badge";
    pin.textContent = "PIN";
    card.appendChild(pin);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.append(
    createActionButton(shortcut.pinned ? "Unpin" : "Pin", "M12 17v5M5 3h14l-2 6 2 6H5l2-6-2-6Z", (event) => {
      event.stopPropagation();
      togglePin(shortcut.id);
    }),
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

  const note = document.createElement("p");
  note.className = "shortcut-note";
  note.textContent = shortcut.note || "";

  const category = document.createElement("p");
  category.className = "shortcut-category";
  category.textContent = getShortcutCategories(shortcut).join(" + ");

  card.append(actions, logo, name);
  if (shortcut.note) card.appendChild(note);
  card.appendChild(category);
  card.addEventListener("click", () => {
    if (selectMode) {
      toggleShortcutSelection(shortcut.id);
      return;
    }
    openShortcut(shortcut.url);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selectMode) {
        toggleShortcutSelection(shortcut.id);
      } else {
        openShortcut(shortcut.url);
      }
    }
  });
  card.addEventListener("dragstart", (event) => {
    draggedId = shortcut.id;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", () => {
    draggedId = null;
    card.classList.remove("dragging");
  });
  card.addEventListener("dragover", (event) => {
    if (selectMode || draggedId === null || draggedId === shortcut.id) return;
    event.preventDefault();
  });
  card.addEventListener("drop", (event) => {
    event.preventDefault();
    if (draggedId === null || draggedId === shortcut.id) return;
    moveShortcut(draggedId, shortcut.id);
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
  setSelectedCategories(["Umum"]);
  pinnedInput.checked = false;
  modalBackdrop.hidden = false;
  nameInput.focus();
}

function openEditDialog(shortcut) {
  dialogTitle.textContent = "Edit Shortcut";
  shortcutId.value = shortcut.id;
  nameInput.value = shortcut.name;
  urlInput.value = shortcut.url;
  logoInput.value = shortcut.logo;
  setSelectedCategories(getShortcutCategories(shortcut));
  pinnedInput.checked = Boolean(shortcut.pinned);
  noteInput.value = shortcut.note || "";
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
  selectedIds.delete(id);
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
  const categories = ["Semua", ...new Set(shortcuts.flatMap(getShortcutCategories))];
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
    categories: getShortcutCategories(shortcut),
    session: shortcut.session || ""
  };
}

function guessCategories(name = "", url = "") {
  const target = `${name} ${url}`.toLowerCase();
  const categories = [];
  if (target.includes("chatgpt") || target.includes("openai") || target.includes("gemini") || target.includes("ai") || target.includes("notelm")) categories.push("AI");
  if (target.includes("youtube") || target.includes("netflix") || target.includes("music") || target.includes("game")) categories.push("Hiburan");
  if (target.includes("github") || target.includes("code") || target.includes("vercel")) categories.push("Coding");
  if (target.includes("notelm") || target.includes("learn") || target.includes("belajar") || target.includes("course")) categories.push("Belajar");
  return categories.length ? categories : ["Umum"];
}

function getShortcutCategories(shortcut) {
  if (Array.isArray(shortcut.categories) && shortcut.categories.length) return shortcut.categories;
  if (shortcut.category) return [shortcut.category];
  return guessCategories(shortcut.name, shortcut.url);
}

function getSelectedCategories() {
  const checked = [...categoryInput.querySelectorAll("input:checked")].map((input) => input.value);
  return checked.length ? checked : ["Umum"];
}

function setSelectedCategories(categories) {
  categoryInput.querySelectorAll("input").forEach((input) => {
    input.checked = categories.includes(input.value);
  });
}

function applySavedTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  document.documentElement.classList.toggle("light", theme === "light");
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
}

function sortShortcuts(a, b) {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return (a.order || 0) - (b.order || 0);
}

function getShortcutOrder(id) {
  return shortcuts.find((shortcut) => shortcut.id === id)?.order || getNextOrder();
}

function getNextOrder() {
  return Math.max(0, ...shortcuts.map((shortcut) => shortcut.order || 0)) + 1;
}

function togglePin(id) {
  shortcuts = shortcuts.map((shortcut) => {
    if (shortcut.id !== id) return shortcut;
    return { ...shortcut, pinned: !shortcut.pinned };
  });
  saveShortcuts();
  renderShortcuts();
}

function moveShortcut(dragId, targetId) {
  const ordered = [...shortcuts].sort(sortShortcuts);
  const fromIndex = ordered.findIndex((shortcut) => shortcut.id === dragId);
  const toIndex = ordered.findIndex((shortcut) => shortcut.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);
  ordered.forEach((shortcut, index) => {
    shortcut.order = index + 1;
  });
  shortcuts = ordered;
  saveShortcuts();
  renderShortcuts();
}

function exportBackup() {
  const data = JSON.stringify(shortcuts.map(normalizeShortcut), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shortcut_ucup_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!Array.isArray(parsed)) throw new Error("Format backup tidak valid.");
      shortcuts = parsed.map(normalizeShortcut);
      selectedIds.clear();
      saveShortcuts();
      renderShortcuts();
      window.alert("Backup berhasil di-import.");
    } catch {
      window.alert("File backup tidak valid.");
    } finally {
      importFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

function openAllVisibleShortcuts() {
  const visible = getVisibleShortcuts();
  if (!visible.length) return;

  const confirmed = window.confirm(`Buka ${visible.length} shortcut yang sedang tampil?`);
  if (!confirmed) return;
  visible.forEach((shortcut) => openShortcut(shortcut.url));
}

function toggleSelectMode() {
  selectMode = !selectMode;
  if (!selectMode) selectedIds.clear();
  renderShortcuts();
}

function toggleShortcutSelection(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  renderShortcuts();
}

function openSelectedShortcuts() {
  const selected = shortcuts.filter((shortcut) => selectedIds.has(shortcut.id));
  if (!selected.length) {
    window.alert("Pilih minimal satu shortcut dulu.");
    return;
  }

  selected.forEach((shortcut) => openShortcut(shortcut.url));
  selectedIds.clear();
  selectMode = false;
  renderShortcuts();
}
