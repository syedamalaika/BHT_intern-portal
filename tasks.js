/**
 * Tasks Module for ByteHex Internship Portal
 * Implements Kanban layout, Assignments, Priority classifications, Countdowns, and Performance Syncs.
 */

let tasksList = [];
let internsList = [];
let countdownInterval = null;
let currentDeleteTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTasksPage();
});

function initTasksPage() {
  loadData();
  populateAssigneeDropdown();
  renderBoard();
  
  // Start countdown ticking
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdowns, 1000);
  
  // Search & Filter event binds
  const searchInput = document.getElementById('task-search');
  const priorityFilter = document.getElementById('task-priority-filter');
  
  if (searchInput) searchInput.addEventListener('input', renderBoard);
  if (priorityFilter) priorityFilter.addEventListener('change', renderBoard);
  
  // Form submit bind
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskFormSubmit);
  }
  
  // Delete confirm bind
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-task');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      if (currentDeleteTaskId) {
        deleteTask(currentDeleteTaskId);
      }
    });
  }
}

function loadData() {
  if (!window.Database) return;
  tasksList = window.Database.getData(window.STORAGE_KEYS.TASKS);
  internsList = window.Database.getData(window.STORAGE_KEYS.INTERNS);
}

function populateAssigneeDropdown() {
  const select = document.getElementById('task-assignee');
  if (!select) return;
  
  // Keep the first default option
  select.innerHTML = `<option value="" disabled selected>Select an Intern</option>`;
  
  // Only assign to Active status interns
  const activeInterns = internsList.filter(i => i.status === 'Active');
  
  activeInterns.forEach(intern => {
    select.innerHTML += `<option value="${intern.id}">${intern.name} (${intern.id}) - ${intern.domain}</option>`;
  });
}

function renderBoard() {
  const query = document.getElementById('task-search')?.value.toLowerCase() || '';
  const priority = document.getElementById('task-priority-filter')?.value || '';
  
  const colPending = document.getElementById('col-pending');
  const colInProgress = document.getElementById('col-inprogress');
  const colCompleted = document.getElementById('col-completed');
  
  if (!colPending || !colInProgress || !colCompleted) return;
  
  // Clear columns
  colPending.innerHTML = '';
  colInProgress.innerHTML = '';
  colCompleted.innerHTML = '';
  
  let pendingCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  
  // Filter list
  const filtered = tasksList.filter(task => {
    const assignedIntern = internsList.find(i => i.id === task.assignedTo);
    const internName = assignedIntern ? assignedIntern.name.toLowerCase() : 'unassigned';
    
    const matchSearch = task.title.toLowerCase().includes(query) || 
                        task.description.toLowerCase().includes(query) ||
                        internName.includes(query);
                        
    const matchPriority = priority === '' || task.priority === priority;
    
    return matchSearch && matchPriority;
  });
  
  filtered.forEach(task => {
    const intern = internsList.find(i => i.id === task.assignedTo);
    const internName = intern ? intern.name : '<span class="text-danger">Unassigned</span>';
    
    const card = document.createElement('div');
    card.className = `glass-card task-card p-3 animate-fade-in priority-${task.priority.toLowerCase()}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('data-deadline', task.deadline);
    card.setAttribute('data-status', task.status);
    
    // Header priority badge
    let priorityBadge = '';
    if (task.priority === 'High') priorityBadge = 'bg-danger';
    else if (task.priority === 'Medium') priorityBadge = 'bg-warning text-dark';
    else priorityBadge = 'bg-info text-white';
    
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-2">
        <span class="badge ${priorityBadge} mb-1" style="font-size:0.7rem;">${task.priority} Priority</span>
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-secondary border-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="width:20px; height:20px;">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end glass-card p-1">
            <li><button class="dropdown-item rounded-2 py-1" onclick="openEditTaskModal('${task.id}')" style="font-size:0.8rem;"><i class="bi bi-pencil-square me-2 text-primary"></i> Edit</button></li>
            <li><button class="dropdown-item rounded-2 py-1 text-danger" onclick="openDeleteTaskModal('${task.id}')" style="font-size:0.8rem;"><i class="bi bi-trash3-fill me-2"></i> Delete</button></li>
          </ul>
        </div>
      </div>
      <h6 class="fw-bold mb-1 text-color" style="font-size:0.95rem;">${task.title}</h6>
      <p class="text-muted mb-3" style="font-size: 0.8rem; line-height: 1.4;">${task.description}</p>
      
      <div class="d-flex justify-content-between align-items-center border-top pt-2" style="font-size: 0.75rem;">
        <span class="text-color"><i class="bi bi-person-fill text-muted me-1"></i>${internName}</span>
        <div class="countdown-container" id="countdown-${task.id}">
          <!-- Countdown text injected dynamically -->
        </div>
      </div>
    `;
    
    if (task.status === 'Pending') {
      colPending.appendChild(card);
      pendingCount++;
    } else if (task.status === 'In Progress') {
      colInProgress.appendChild(card);
      inProgressCount++;
    } else if (task.status === 'Completed') {
      colCompleted.appendChild(card);
      completedCount++;
    }
  });
  
  // Set count badges
  document.getElementById('badge-count-pending').textContent = pendingCount;
  document.getElementById('badge-count-inprogress').textContent = inProgressCount;
  document.getElementById('badge-count-completed').textContent = completedCount;
  
  // Empty states
  if (pendingCount === 0) colPending.innerHTML = `<div class="text-center text-muted py-4" style="font-size:0.8rem; border:1px dashed var(--card-border); border-radius:10px;">No pending tasks</div>`;
  if (inProgressCount === 0) colInProgress.innerHTML = `<div class="text-center text-muted py-4" style="font-size:0.8rem; border:1px dashed var(--card-border); border-radius:10px;">No tasks in progress</div>`;
  if (completedCount === 0) colCompleted.innerHTML = `<div class="text-center text-muted py-4" style="font-size:0.8rem; border:1px dashed var(--card-border); border-radius:10px;">No completed tasks</div>`;
  
  // Update board ratio & stats bar
  updateBoardProgress();
  
  // Tick immediately once to fill countdown texts
  updateCountdowns();
}

function updateBoardProgress() {
  const total = tasksList.length;
  const completed = tasksList.filter(t => t.status === 'Completed').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const ratioLbl = document.getElementById('board-ratio-lbl');
  const pctLbl = document.getElementById('board-percentage-lbl');
  const progressbar = document.getElementById('global-task-progress-bar');
  
  if (ratioLbl) ratioLbl.textContent = `${completed} of ${total} Tasks Completed`;
  if (pctLbl) pctLbl.textContent = `${pct}%`;
  if (progressbar) {
    progressbar.style.width = `${pct}%`;
    progressbar.setAttribute('aria-valuenow', pct);
  }
}

function updateCountdowns() {
  const containers = document.querySelectorAll('.countdown-container');
  const now = new Date();
  
  containers.forEach(container => {
    const parent = container.closest('.task-card');
    if (!parent) return;
    
    const status = parent.getAttribute('data-status');
    
    if (status === 'Completed') {
      container.innerHTML = `<span class="countdown-timer completed"><i class="bi bi-check-circle-fill"></i> Completed</span>`;
      return;
    }
    
    const deadlineStr = parent.getAttribute('data-deadline');
    const deadline = new Date(deadlineStr);
    const diffMs = deadline - now;
    
    if (isNaN(deadline.getTime())) {
      container.innerHTML = `<span class="text-muted"><i class="bi bi-clock"></i> No Deadline</span>`;
      return;
    }
    
    if (diffMs <= 0) {
      // Overdue
      const absoluteDiff = Math.abs(diffMs);
      const hours = Math.floor(absoluteDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      let overdueText = '';
      if (days > 0) overdueText = `${days}d overdue`;
      else overdueText = `${hours}h overdue`;
      
      container.innerHTML = `<span class="countdown-timer fw-bold text-danger animate-pulse"><i class="bi bi-exclamation-octagon-fill"></i> ${overdueText}</span>`;
    } else {
      // Remaining
      const minutes = Math.floor((diffMs / 1000 / 60) % 60);
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let remainingText = '';
      if (days > 0) remainingText = `${days}d ${hours}h left`;
      else if (hours > 0) remainingText = `${hours}h ${minutes}m left`;
      else remainingText = `${minutes}m left`;
      
      container.innerHTML = `<span class="countdown-timer text-warning"><i class="bi bi-hourglass-split"></i> ${remainingText}</span>`;
    }
  });
}

// Opens modal in Create state
window.openCreateTaskModal = function() {
  const modalEl = document.getElementById('taskModal');
  const titleEl = document.getElementById('taskModalLabel');
  const btnEl = document.getElementById('btn-save-task');
  
  if (titleEl) titleEl.textContent = 'Assign New Task';
  if (btnEl) btnEl.textContent = 'Assign Task';
  
  // Clear fields
  document.getElementById('task-id').value = '';
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-assignee').value = '';
  document.getElementById('task-priority').value = 'High';
  document.getElementById('task-status').value = 'Pending';
  document.getElementById('task-deadline').value = '';
  
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Opens modal in Edit state
window.openEditTaskModal = function(id) {
  const task = tasksList.find(t => t.id === id);
  if (!task) return;
  
  const modalEl = document.getElementById('taskModal');
  const titleEl = document.getElementById('taskModalLabel');
  const btnEl = document.getElementById('btn-save-task');
  
  if (titleEl) titleEl.textContent = 'Edit Task Details';
  if (btnEl) btnEl.textContent = 'Update Task';
  
  // Pre-fill inputs
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description;
  document.getElementById('task-assignee').value = task.assignedTo;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-status').value = task.status;
  
  // Formatting ISO datetime for input element (YYYY-MM-DDTHH:MM)
  if (task.deadline) {
    document.getElementById('task-deadline').value = task.deadline;
  }
  
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Handle Form Submission
function handleTaskFormSubmit(e) {
  e.preventDefault();
  
  if (!window.Database) return;
  const db = window.Database;
  
  const id = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const assignedTo = document.getElementById('task-assignee').value;
  const priority = document.getElementById('task-priority').value;
  const status = document.getElementById('task-status').value;
  const deadline = document.getElementById('task-deadline').value;
  
  if (!title || !description || !assignedTo || !deadline) {
    window.showToast('Please fill out all fields', 'warning');
    return;
  }
  
  const modalEl = document.getElementById('taskModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  
  if (id) {
    // Edit existing task
    const idx = tasksList.findIndex(t => t.id === id);
    if (idx !== -1) {
      const oldAssignee = tasksList[idx].assignedTo;
      
      tasksList[idx] = { id, title, description, assignedTo, priority, status, deadline };
      db.saveData(window.STORAGE_KEYS.TASKS, tasksList);
      
      // Update performance indexes
      updateInternPerformanceTaskCompletion(assignedTo);
      if (oldAssignee !== assignedTo) {
        updateInternPerformanceTaskCompletion(oldAssignee);
      }
      
      window.showToast('Task updated successfully', 'success');
    }
  } else {
    // Create new task
    const newTaskId = `task_${Date.now()}`;
    const newTask = { id: newTaskId, title, description, assignedTo, priority, status, deadline };
    
    tasksList.push(newTask);
    db.saveData(window.STORAGE_KEYS.TASKS, tasksList);
    
    // Sync performance
    updateInternPerformanceTaskCompletion(assignedTo);
    
    window.showToast('Task assigned successfully!', 'success');
  }
  
  if (modalInstance) modalInstance.hide();
  loadData();
  renderBoard();
}

window.openDeleteTaskModal = function(id) {
  currentDeleteTaskId = id;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteTaskModal'));
  deleteModal.show();
};

function deleteTask(id) {
  if (!window.Database) return;
  const db = window.Database;
  
  const task = tasksList.find(t => t.id === id);
  const assignee = task ? task.assignedTo : null;
  
  tasksList = tasksList.filter(t => t.id !== id);
  db.saveData(window.STORAGE_KEYS.TASKS, tasksList);
  
  if (assignee) {
    updateInternPerformanceTaskCompletion(assignee);
  }
  
  const modalEl = document.getElementById('deleteTaskModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  
  window.showToast('Task deleted successfully', 'success');
  loadData();
  renderBoard();
}

function updateInternPerformanceTaskCompletion(internId) {
  if (!internId || !window.Database) return;
  const db = window.Database;
  const tasks = db.getData(window.STORAGE_KEYS.TASKS);
  const internTasks = tasks.filter(t => t.assignedTo === internId);
  
  let taskCompletionRate = 0;
  if (internTasks.length > 0) {
    const completed = internTasks.filter(t => t.status === 'Completed').length;
    taskCompletionRate = Math.round((completed / internTasks.length) * 100);
  }
  
  let performance = db.getData(window.STORAGE_KEYS.PERFORMANCE);
  let perfIndex = performance.findIndex(p => p.internId === internId);
  
  if (perfIndex !== -1) {
    performance[perfIndex].taskCompletion = taskCompletionRate;
    const p = performance[perfIndex];
    // Recompute overall performance score average
    p.overall = Math.round((p.communication + p.coding + p.problemSolving + p.teamwork + p.attendance + p.taskCompletion) / 6 * 10) / 10;
    db.saveData(window.STORAGE_KEYS.PERFORMANCE, performance);
  }
}
