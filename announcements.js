/**
 * Announcements Module for ByteHex Internship Portal
 */

let announcementsList = [];
let deleteAnnId = null;

document.addEventListener('DOMContentLoaded', () => {
  initAnnouncements();
});

function initAnnouncements() {
  loadData();
  renderGrid();
  
  const form = document.getElementById('announcementForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-ann');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      if (deleteAnnId) deleteAnnouncement(deleteAnnId);
    });
  }
}

function loadData() {
  if (!window.Database) return;
  announcementsList = window.Database.getData(window.STORAGE_KEYS.ANNOUNCEMENTS);
}

function renderGrid() {
  const grid = document.getElementById('announcements-grid');
  if (!grid) return;
  
  if (announcementsList.length === 0) {
    grid.innerHTML = `<div class="col-12"><div class="glass-card p-5 text-center text-muted border border-dashed border-light-subtle">No announcements published yet.</div></div>`;
    return;
  }
  
  // Sort desc by date
  const sorted = [...announcementsList].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  grid.innerHTML = sorted.map(ann => `
    <div class="col-12 col-md-6 col-xl-4 animate-fade-in">
      <div class="glass-card h-100 p-4 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="p-2 bg-primary bg-opacity-10 text-primary rounded-circle"><i class="bi bi-megaphone-fill"></i></span>
            <div>
              <h5 class="fw-bold m-0 text-color" style="font-size: 1.1rem;">${ann.title}</h5>
              <small class="text-muted" style="font-size: 0.75rem;">${new Date(ann.date).toLocaleDateString()} at ${new Date(ann.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            </div>
          </div>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary border-0 p-1" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
            <ul class="dropdown-menu dropdown-menu-end glass-card p-1">
              <li><button class="dropdown-item rounded-2 py-1" onclick="openAnnouncementModal('${ann.id}')" style="font-size:0.85rem;"><i class="bi bi-pencil-square me-2 text-primary"></i> Edit</button></li>
              <li><button class="dropdown-item rounded-2 py-1 text-danger" onclick="openDeleteModal('${ann.id}')" style="font-size:0.85rem;"><i class="bi bi-trash-fill me-2"></i> Delete</button></li>
            </ul>
          </div>
        </div>
        <div class="flex-grow-1">
          <p class="text-color m-0" style="font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">${ann.content}</p>
        </div>
      </div>
    </div>
  `).join('');
}

window.openAnnouncementModal = function(id = null) {
  const modalEl = document.getElementById('announcementModal');
  const titleEl = document.getElementById('announcementModalLabel');
  const btnEl = document.getElementById('btn-save-ann');
  
  if (id) {
    // Edit mode
    const ann = announcementsList.find(a => a.id === id);
    if (ann) {
      document.getElementById('ann-id').value = ann.id;
      document.getElementById('ann-title').value = ann.title;
      document.getElementById('ann-content').value = ann.content;
      titleEl.textContent = 'Edit Bulletin';
      btnEl.textContent = 'Update';
    }
  } else {
    // Create mode
    document.getElementById('ann-id').value = '';
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-content').value = '';
    titleEl.textContent = 'Post Bulletin';
    btnEl.textContent = 'Publish';
  }
  
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!window.Database) return;
  const db = window.Database;
  
  const id = document.getElementById('ann-id').value;
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('ann-content').value.trim();
  
  if (!title || !content) {
    window.showToast('Please fill all fields', 'warning');
    return;
  }
  
  if (id) {
    // Update
    const idx = announcementsList.findIndex(a => a.id === id);
    if (idx !== -1) {
      announcementsList[idx].title = title;
      announcementsList[idx].content = content;
      window.showToast('Bulletin updated', 'success');
    }
  } else {
    // Create
    announcementsList.push({
      id: `ann_${Date.now()}`,
      title,
      content,
      date: new Date().toISOString()
    });
    window.showToast('Bulletin published', 'success');
  }
  
  db.saveData(window.STORAGE_KEYS.ANNOUNCEMENTS, announcementsList);
  
  const modalEl = document.getElementById('announcementModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  
  renderGrid();
}

window.openDeleteModal = function(id) {
  deleteAnnId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteAnnModal'));
  modal.show();
}

function deleteAnnouncement(id) {
  if (!window.Database) return;
  const db = window.Database;
  
  announcementsList = announcementsList.filter(a => a.id !== id);
  db.saveData(window.STORAGE_KEYS.ANNOUNCEMENTS, announcementsList);
  
  const modalEl = document.getElementById('deleteAnnModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  
  window.showToast('Bulletin deleted', 'success');
  renderGrid();
}
