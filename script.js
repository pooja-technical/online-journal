
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "littleJournalEntries_v1";
const TODO_KEY = "littleJournalTodos_v1";
const THEME_KEY = "littleJournalTheme_v1";
const FONT_KEY = "littleJournalFont_v1";

let entries = loadJSON(STORAGE_KEY, []);
let todos = loadJSON(TODO_KEY, []);
let currentEntryId = null;
let toastTimer;

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}
function today() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

$("dateLabel").textContent = today();

const fortunes = [
  "You don't have to have it all figured out today. 🌱",
  "Small steps still move you forward. 🐢",
  "You deserve the same kindness you give others. 💚",
  "Something lovely can grow from an ordinary day. 🌼",
  "Rest is productive too. Take a breath. ☁️",
  "Your story is still unfolding. Keep going. 📖",
  "One day, you'll be glad you didn't give up. ⭐",
  "You are allowed to begin again. 🌈"
];
const prompts = [
  "What is one small thing that made you smile recently?",
  "Write a letter to the version of you from five years ago.",
  "What would your perfect slow morning look like?",
  "List three things you want to make more time for.",
  "What is something you are proud of but rarely mention?",
  "Describe your current life using five little details.",
  "What would you try if you were not afraid of failing?",
  "What is one thing you want to let go of?",
  "Write about a song that feels like your life right now.",
  "What would make tomorrow just 1% better?"
];

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
$("newFortune").addEventListener("click", () => {
  $("fortune").textContent = pickRandom(fortunes);
});
$("surpriseBtn").addEventListener("click", () => {
  $("fortune").textContent = pickRandom(fortunes);
  $("promptText").textContent = pickRandom(prompts);
  showToast("A tiny surprise for you! ✨");
});
$("newPrompt").addEventListener("click", () => {
  $("promptText").textContent = pickRandom(prompts);
});

const themes = ["sage", "ocean", "lavender", "warm", "dark"];
let themeIndex = Math.max(0, themes.indexOf(localStorage.getItem(THEME_KEY) || "sage"));
function applyTheme() {
  const theme = themes[themeIndex];
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  $("themeBtn").textContent = theme === "dark" ? "☀️ Light" : "🎨 " + theme[0].toUpperCase() + theme.slice(1);
}
applyTheme();
$("themeBtn").addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % themes.length;
  applyTheme();
  showToast("Theme changed 🌈");
});

const fontChoices = ["clean", "hand", "serif", "type"];
let fontIndex = Math.max(0, fontChoices.indexOf(localStorage.getItem(FONT_KEY) || "clean"));
function applyFont() {
  const font = fontChoices[fontIndex];
  document.body.dataset.font = font;
  localStorage.setItem(FONT_KEY, font);
}
applyFont();

$("entryBody").addEventListener("input", () => {
  const words = $("entryBody").value.trim().split(/\s+/).filter(Boolean).length;
  $("wordCount").textContent = words + (words === 1 ? " word" : " words");
});

document.querySelectorAll(".sticker").forEach(button => {
  button.addEventListener("click", () => {
    const textarea = $("entryBody");
    const sticker = button.dataset.sticker;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(sticker, start, end, "end");
    textarea.focus();
    textarea.dispatchEvent(new Event("input"));
    showToast("Sticker added " + sticker);
  });
});

function clearEditor() {
  currentEntryId = null;
  $("entryTitle").value = "";
  $("entryBody").value = "";
  $("mood").value = "😊";
  $("wordCount").textContent = "0 words";
  $("status").textContent = "";
}
$("clearBtn").addEventListener("click", () => {
  if ($("entryTitle").value || $("entryBody").value) {
    if (!confirm("Clear this page? Unsaved writing will be lost.")) return;
  }
  clearEditor();
  showToast("Fresh page ready 📓");
});

$("saveBtn").addEventListener("click", () => {
  const title = $("entryTitle").value.trim() || "Untitled page";
  const body = $("entryBody").value.trim();
  if (!body && title === "Untitled page") {
    showToast("Write a little something first 💭");
    $("entryBody").focus();
    return;
  }
  const now = new Date().toISOString();
  if (currentEntryId) {
    const index = entries.findIndex(entry => entry.id === currentEntryId);
    if (index >= 0) {
      entries[index] = { ...entries[index], title, body, mood: $("mood").value, updatedAt: now };
    } else {
      entries.unshift({ id: makeId(), title, body, mood: $("mood").value, createdAt: now, updatedAt: now });
    }
  } else {
    const entry = {
      id: makeId(), title, body, mood: $("mood").value,
      createdAt: now, updatedAt: now
    };
    entries.unshift(entry);
    currentEntryId = entry.id;
  }
  saveEntries();
  renderEntries();
  $("status").textContent = "Saved safely in this browser ✨";
  showToast("Your page has been saved! 💚");
});

function renderEntries() {
  const query = $("searchEntries").value.trim().toLowerCase();
  const filtered = entries.filter(entry =>
    (entry.title + " " + entry.body).toLowerCase().includes(query)
  );
  $("entriesList").innerHTML = filtered.map(entry => {
    const date = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString();
    const preview = entry.body.slice(0, 90);
    return `<article class="entry-item">
      <button class="entry-open" data-open="${safeText(entry.id)}">
        <strong>${safeText(entry.mood || "📓")} ${safeText(entry.title)}</strong>
        <span class="entry-meta">${safeText(date)} · ${safeText(preview)}${entry.body.length > 90 ? "…" : ""}</span>
      </button>
      <div class="entry-actions">
        <button data-edit="${safeText(entry.id)}">Open / edit</button>
        <button data-delete="${safeText(entry.id)}">Delete</button>
      </div>
    </article>`;
  }).join("");
  $("emptyEntries").hidden = filtered.length > 0;
  if (entries.length === 0) $("emptyEntries").textContent = "Your saved pages will live here. 🌱";
  else if (filtered.length === 0) $("emptyEntries").textContent = "No pages match that search. 🔎";
}
$("searchEntries").addEventListener("input", renderEntries);

$("entriesList").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit], [data-open]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const id = editButton.dataset.edit || editButton.dataset.open;
    const entry = entries.find(item => item.id === id);
    if (!entry) return;
    currentEntryId = entry.id;
    $("entryTitle").value = entry.title;
    $("entryBody").value = entry.body;
    $("mood").value = entry.mood || "😊";
    $("entryBody").dispatchEvent(new Event("input"));
    $("status").textContent = "Editing a saved page.";
    $("entryTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    const entry = entries.find(item => item.id === id);
    if (!entry || !confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    entries = entries.filter(item => item.id !== id);
    if (currentEntryId === id) clearEditor();
    saveEntries();
    renderEntries();
    showToast("Page deleted.");
  }
});

$("todoForm").addEventListener("submit", event => {
  event.preventDefault();
  const text = $("todoInput").value.trim();
  if (!text) return;
  todos.push({ id: makeId(), text, done: false });
  $("todoInput").value = "";
  saveTodos();
  renderTodos();
});
function renderTodos() {
  $("todoList").innerHTML = todos.map(todo => `
    <li class="${todo.done ? "done" : ""}">
      <input type="checkbox" data-todo="${safeText(todo.id)}" ${todo.done ? "checked" : ""} aria-label="Complete task" style="width:auto">
      <span>${safeText(todo.text)}</span>
      <button data-remove-todo="${safeText(todo.id)}" aria-label="Delete task">✕</button>
    </li>
  `).join("");
}
$("todoList").addEventListener("change", event => {
  const checkbox = event.target.closest("[data-todo]");
  if (!checkbox) return;
  const todo = todos.find(item => item.id === checkbox.dataset.todo);
  if (todo) {
    todo.done = checkbox.checked;
    saveTodos();
    renderTodos();
  }
});
$("todoList").addEventListener("click", event => {
  const button = event.target.closest("[data-remove-todo]");
  if (!button) return;
  todos = todos.filter(item => item.id !== button.dataset.removeTodo);
  saveTodos();
  renderTodos();
});

$("exportBtn").addEventListener("click", () => {
  const backup = {
    app: "Little Journal",
    exportedAt: new Date().toISOString(),
    entries, todos
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "little-journal-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Backup exported 📦");
});

$("importFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (!Array.isArray(backup.entries) || !Array.isArray(backup.todos)) {
      throw new Error("This file is not a valid journal backup.");
    }
    if (!confirm("Import this backup? Your current journal and to-do list will be replaced.")) {
      event.target.value = "";
      return;
    }
    entries = backup.entries;
    todos = backup.todos;
    saveEntries();
    saveTodos();
    renderEntries();
    renderTodos();
    clearEditor();
    showToast("Backup imported successfully! 🌱");
  } catch (error) {
    showToast(error.message || "Couldn't import that file.");
  }
  event.target.value = "";
});

renderEntries();
renderTodos();
