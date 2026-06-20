/* ===========================================================
   Dashboard logic — auth guard + notes CRUD (Supabase)
   ===========================================================
   Expects a "notes" table:
     id          uuid, primary key, default gen_random_uuid()
     user_id     uuid, references auth.users
     title       text
     content     text
     created_at  timestamptz, default now()
     updated_at  timestamptz, default now()
   with Row Level Security restricting rows to their owner.
   See README.md for the exact SQL.
   =========================================================== */

let currentUser = null;
let notesCache = [];
let editingId = null;

const grid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const spinner = document.getElementById('spinner');
const userEmailEl = document.getElementById('userEmail');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const noteForm = document.getElementById('noteForm');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');

function showToast(msg, isError = false){
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  if(!toast || !toastText) return;
  toastText.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove('show'), 3200);
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

// ---------- auth guard ----------
async function initAuthGuard(){
  const { data } = await window.sb.auth.getSession();
  if(!data || !data.session){
    window.location.href = 'index.html';
    return;
  }
  currentUser = data.session.user;
  userEmailEl.textContent = currentUser.email;
  loadNotes();
}

window.sb.auth.onAuthStateChange((event, session) => {
  if(event === 'SIGNED_OUT'){
    window.location.href = 'index.html';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await window.sb.auth.signOut();
  window.location.href = 'index.html';
});

// ---------- load notes ----------
async function loadNotes(){
  spinner.style.display = 'block';
  grid.style.display = 'none';
  emptyState.style.display = 'none';

  // RLS already restricts this to the logged-in user's rows,
  // but filtering explicitly keeps intent clear in the code.
  const { data, error } = await window.sb
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  spinner.style.display = 'none';

  if(error){
    showToast(error.message || 'Could not load notes', true);
    return;
  }

  notesCache = data || [];
  renderNotes();
}

function renderNotes(){
  if(notesCache.length === 0){
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  grid.style.display = 'grid';

  grid.innerHTML = notesCache.map(note => `
    <div class="note-card" data-id="${note.id}">
      <h3 class="note-title">${escapeHtml(note.title)}</h3>
      <p class="note-body">${escapeHtml(note.content)}</p>
      <p class="note-meta">Edited ${formatDate(note.updated_at || note.created_at)}</p>
      <div class="note-actions">
        <button class="icon-btn edit" aria-label="Edit note" data-action="edit" data-id="${note.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn delete" aria-label="Delete note" data-action="delete" data-id="${note.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if(!btn) return;
  const id = btn.dataset.id;
  if(btn.dataset.action === 'edit') openModal(id);
  if(btn.dataset.action === 'delete') deleteNote(id);
});

// ---------- modal open/close ----------
function openModal(id = null){
  editingId = id;
  if(id){
    const note = notesCache.find(n => n.id === id);
    modalTitle.textContent = 'Edit note';
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
  } else {
    modalTitle.textContent = 'New note';
    noteTitleInput.value = '';
    noteContentInput.value = '';
  }
  modalOverlay.classList.add('show');
  noteTitleInput.focus();
}

function closeModal(){
  modalOverlay.classList.remove('show');
  editingId = null;
}

document.getElementById('newNoteBtn').addEventListener('click', () => openModal());
document.getElementById('emptyNewNoteBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modalOverlay.classList.contains('show')) closeModal(); });

// ---------- create / update ----------
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  if(!title){ showToast('Give the note a title', true); return; }

  const saveBtn = noteForm.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  let error;
  if(editingId){
    ({ error } = await window.sb
      .from('notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', editingId)
      .eq('user_id', currentUser.id));
  } else {
    ({ error } = await window.sb
      .from('notes')
      .insert({ title, content, user_id: currentUser.id }));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save note';

  if(error){
    showToast(error.message || 'Could not save note', true);
    return;
  }

  showToast(editingId ? 'Note updated' : 'Note created');
  closeModal();
  loadNotes();
});

// ---------- delete ----------
async function deleteNote(id){
  const confirmed = window.confirm('Delete this note? This cannot be undone.');
  if(!confirmed) return;

  const { error } = await window.sb
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if(error){
    showToast(error.message || 'Could not delete note', true);
    return;
  }
  showToast('Note deleted');
  loadNotes();
}

initAuthGuard();
