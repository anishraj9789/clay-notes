let currentUser = null;
let tasksCache = [];
let editingId = null;

// DOM refs
const incompleteGrid = document.getElementById('incompleteGrid');
const completedGrid = document.getElementById('completedGrid');
const incompleteSection = document.getElementById('incompleteSection');
const completedSection = document.getElementById('completedSection');
const spinner = document.getElementById('spinner');
const userEmailEl = document.getElementById('userEmail');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskContentInput = document.getElementById('taskContentInput');
const taskDueInput = document.getElementById('taskDueInput');

// ---------- helpers ----------
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  if (!toast || !toastText) return;
  toastText.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// ---------- auth guard ----------
async function initAuthGuard() {
  const { data } = await window.sb.auth.getSession();
  if (!data || !data.session) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = data.session.user;
  userEmailEl.textContent = currentUser.email;
  loadTasks();
}

window.sb.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    window.location.href = 'index.html';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await window.sb.auth.signOut();
  window.location.href = 'index.html';
});

// ---------- load tasks ----------
async function loadTasks() {
  spinner.style.display = 'block';
  incompleteSection.style.display = 'none';
  completedSection.style.display = 'none';

  const { data, error } = await window.sb
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  spinner.style.display = 'none';

  if (error) {
    showToast(error.message || 'Could not load tasks', true);
    return;
  }

  tasksCache = data || [];
  renderTasks();
}

// ---------- render tasks – always shows both sections ----------
function renderTasks() {
  // Always show both sections
  incompleteSection.style.display = 'block';
  completedSection.style.display = 'block';

  const incomplete = tasksCache.filter(t => !t.completed);
  const completed = tasksCache.filter(t => t.completed);

  // Incomplete grid
  if (incomplete.length) {
    incompleteGrid.innerHTML = incomplete.map(task => renderTaskCard(task, false)).join('');
  } else {
    incompleteGrid.innerHTML = `<div class="empty-state-mini">✨ No pending tasks. Take a break!</div>`;
  }

  // Completed grid
  if (completed.length) {
    completedGrid.innerHTML = completed.map(task => renderTaskCard(task, true)).join('');
  } else {
    completedGrid.innerHTML = `<div class="empty-state-mini">📝 No completed tasks yet. Get started!</div>`;
  }
}

function renderTaskCard(task, isCompleted) {
  const overdue = !isCompleted && isOverdue(task.due_date);
  const dueDateStr = task.due_date ? formatDate(task.due_date) : 'No due date';
  const dueClass = overdue ? 'overdue' : '';

  return `
    <div class="note-card ${dueClass}" data-id="${task.id}" style="${overdue ? 'border: 2px solid var(--danger);' : ''}">
      <h3 class="note-title">${escapeHtml(task.title)}</h3>
      <p class="note-body">${escapeHtml(task.content)}</p>
      <p class="note-meta">Due: ${dueDateStr} ${overdue ? '⚠️ Overdue' : ''}</p>
      <p class="note-meta">Edited ${formatDate(task.updated_at || task.created_at)}</p>
      <div class="note-actions">
        ${isCompleted ? `
          <button class="icon-btn" aria-label="Reopen task" data-action="reopen" data-id="${task.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        ` : `
          <button class="icon-btn" aria-label="Complete task" data-action="complete" data-id="${task.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        `}
        <button class="icon-btn edit" aria-label="Edit task" data-action="edit" data-id="${task.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn delete" aria-label="Delete task" data-action="delete" data-id="${task.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

// ---------- event delegation ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  switch (btn.dataset.action) {
    case 'complete':
      toggleComplete(id, true);
      break;
    case 'reopen':
      toggleComplete(id, false);
      break;
    case 'edit':
      openModal(id);
      break;
    case 'delete':
      deleteTask(id);
      break;
  }
});

// ---------- complete / reopen ----------
async function toggleComplete(id, completed) {
  const { error } = await window.sb
    .from('notes')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) {
    showToast(error.message || 'Could not update task', true);
    return;
  }
  showToast(completed ? '🎉 Task completed!' : 'Task reopened');
  loadTasks();
}

// ---------- modal ----------
function openModal(id = null) {
  editingId = id;
  if (id) {
    const task = tasksCache.find(t => t.id === id);
    modalTitle.textContent = 'Edit task';
    taskTitleInput.value = task.title;
    taskContentInput.value = task.content;
    taskDueInput.value = task.due_date ? task.due_date.slice(0, 16) : '';
  } else {
    modalTitle.textContent = 'New task';
    taskTitleInput.value = '';
    taskContentInput.value = '';
    taskDueInput.value = '';
  }
  modalOverlay.classList.add('show');
  taskTitleInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('show');
  editingId = null;
}

document.getElementById('newTaskBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOverlay.classList.contains('show')) closeModal(); });

// ---------- create / update ----------
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  const content = taskContentInput.value.trim();
  const due_date = taskDueInput.value ? new Date(taskDueInput.value).toISOString() : null;

  if (!title) { showToast('Give the task a title', true); return; }

  const saveBtn = taskForm.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  let error;
  if (editingId) {
    ({ error } = await window.sb
      .from('notes')
      .update({ title, content, due_date, updated_at: new Date().toISOString() })
      .eq('id', editingId)
      .eq('user_id', currentUser.id));
  } else {
    ({ error } = await window.sb
      .from('notes')
      .insert({ title, content, due_date, user_id: currentUser.id, completed: false }));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save task';

  if (error) {
    showToast(error.message || 'Could not save task', true);
    return;
  }

  showToast(editingId ? 'Task updated' : `✨ Task "${title}" created!`);
  closeModal();
  loadTasks();
});

// ---------- delete ----------
async function deleteTask(id) {
  const confirmed = window.confirm('Delete this task? This cannot be undone.');
  if (!confirmed) return;

  const { error } = await window.sb
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) {
    showToast(error.message || 'Could not delete task', true);
    return;
  }
  showToast('Task deleted');
  loadTasks();
}

// ---------- start ----------
initAuthGuard();
