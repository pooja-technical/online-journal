
const form = document.getElementById("journalForm");
const list = document.getElementById("entryList");
const search = document.getElementById("search");

let entries = JSON.parse(localStorage.getItem("myJournal") || "[]");
let editId = null;

function saveData() {
  localStorage.setItem("myJournal", JSON.stringify(entries));
}

function displayEntries() {
  const query = search.value.toLowerCase();

  const filtered = entries.filter(entry =>
    entry.title.toLowerCase().includes(query) ||
    entry.content.toLowerCase().includes(query)
  );

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = "<p>No journal entries yet. Write your first one!</p>";
    return;
  }

  filtered.forEach(entry => {
    const card = document.createElement("div");
    card.className = "entry";

    const heading = document.createElement("h3");
    heading.textContent = entry.title;

    const date = document.createElement("small");
    date.textContent = entry.date + " · " + entry.mood;

    const content = document.createElement("p");
    content.textContent = entry.content;

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = () => editEntry(entry.id);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteEntry(entry.id);

    card.append(heading, date, content, editButton, deleteButton);
    list.appendChild(card);
  });
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const mood = document.getElementById("mood").value;

  if (!title || !content) return;

  if (editId !== null) {
    const entry = entries.find(item => item.id === editId);
    entry.title = title;
    entry.content = content;
    entry.mood = mood;
    editId = null;
  } else {
    entries.push({
      id: Date.now(),
      title,
      content,
      mood,
      date: new Date().toLocaleDateString()
    });
  }

  saveData();
  form.reset();
  form.querySelector("button").textContent = "Save Entry";
  displayEntries();
});

function editEntry(id) {
  const entry = entries.find(item => item.id === id);

  document.getElementById("title").value = entry.title;
  document.getElementById("content").value = entry.content;
  document.getElementById("mood").value = entry.mood;

  editId = id;
  form.querySelector("button").textContent = "Update Entry";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(id) {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  entries = entries.filter(entry => entry.id !== id);
  saveData();
  displayEntries();
}

search.addEventListener("input", displayEntries);

displayEntries();
