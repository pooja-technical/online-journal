
const $ = id => document.getElementById(id);

let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
let todos = JSON.parse(localStorage.getItem('journalTodos') || '[]');
let selectedSticker = '🌷';
let editingId = null;

$('date').value = new Date().toLocaleDateString('en-CA');

function saveEntries() {
  localStorage.setItem('journalEntries', JSON.stringify(entries));
}

function saveTodos() {
  localStorage.setItem('journalTodos', JSON.stringify(todos));
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function changeTheme() {
  document.body.dataset.theme = $('theme').value;
}

$('theme').addEventListener('change', () => {
  localStorage.setItem('journalTheme', $('theme').value);
});

const savedTheme = localStorage.getItem('journalTheme');
if (savedTheme) {
  $('theme').value = savedTheme;
  document.body.dataset.theme = savedTheme;
}

function pickSticker(sticker) {
  selectedSticker = sticker;
  document.querySelectorAll('#stickers button').forEach(button => {
    button.style.outline =
      button.textContent === sticker ? '2px solid var(--accent)' : 'none';
  });
}

function resetForm() {
  $('journalForm').reset();
  $('date').value = new Date().toLocaleDateString('en-CA');
  editingId = null;
  selectedSticker = '🌷';
  $('formHeading').textContent = '✍️ Write a new page';
  pickSticker('🌷');
}

$('journalForm').addEventListener('submit', event => {
  event.preventDefault();

  const title = $('title').value.trim();
  const content = $('content').value.trim();

  if (!title || !content) return;

  const entry = {
    id: editingId || Date.now().toString(),
    title,
    date: $('date').value,
    mood: $('mood').value,
    content,
    sticker: selectedSticker,
    favorite: editingId
      ? Boolean(entries.find(item => item.id === editingId)?.favorite)
      : false
  };

  if (editingId) {
    entries = entries.map(item => item.id === editingId ? entry : item);
  } else {
    entries.unshift(entry);
  }

  saveEntries();
  renderEntries();
  resetForm();
  alert('Your little memory is saved! 💌');
});

function renderEntries() {
  const query = ($('search')?.value || '').toLowerCase();

  const filtered = entries.filter(entry =>
    (entry.title + ' ' + entry.content + ' ' + entry.mood)
      .toLowerCase().includes(query)
  );

  $('entries').innerHTML = filtered.map(entry => `
    <article class="entry">
      <div>${safeText(entry.sticker)} <small>${safeText(entry.date)}</small></div>
      <h3>${safeText(entry.title)}</h3>
      <p>${safeText(entry.content)}</p>
      <p><strong>Mood:</strong> ${safeText(entry.mood)}</p>
      <div class="entry-actions">
        <button onclick="editEntry('${entry.id}')">✏️ Edit</button>
        <button onclick="toggleFavorite('${entry.id}')">
          ${entry.favorite ? '❤️ Favorited' : '♡ Favorite'}
        </button>
        <button onclick="deleteEntry('${entry.id}')">🗑️ Delete</button>
      </div>
    </article>
  `).join('') || '<p>No memories found. Write your first page! 🌷</p>';
}

function editEntry(id) {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;

  editingId = id;
  $('title').value = entry.title;
  $('date').value = entry.date;
  $('mood').value = entry.mood;
  $('content').value = entry.content;
  $('formHeading').textContent = '✏️ Edit your page';
  pickSticker(entry.sticker);

  showSection('journal');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this memory?')) return;
  entries = entries.filter(entry => entry.id !== id);
  saveEntries();
  renderEntries();
}

function toggleFavorite(id) {
  entries = entries.map(entry =>
    entry.id === id ? { ...entry, favorite: !entry.favorite } : entry
  );
  saveEntries();
  renderEntries();
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('hidden', section.id !== sectionId);
  });

  if (sectionId === 'memories') renderEntries();
}

$('todoForm').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('todoInput').value.trim();

  if (!text) return;

  todos.push({
    id: Date.now().toString(),
    text,
    done: false
  });

  saveTodos();
  $('todoInput').value = '';
  renderTodos();
});

function renderTodos() {
  const completed = todos.filter(todo => todo.done).length;
  $('todoCount').textContent =
    `${completed} of ${todos.length} tasks completed 🌱`;

  $('todoList').innerHTML = todos.map(todo => `
    <li class="${todo.done ? 'done' : ''}">
      <input type="checkbox"
        ${todo.done ? 'checked' : ''}
        onchange="toggleTodo('${todo.id}')">
      <span>${safeText(todo.text)}</span>
      <button onclick="deleteTodo('${todo.id}')">✕</button>
    </li>
  `).join('');
}

function toggleTodo(id) {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveTodos();
  renderTodos();
}

renderEntries();
renderTodos();
pickSticker('🌷');
