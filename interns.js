/**
 * Interns Module for ByteHex Internship Portal
 * Implements Directory listings, CRUD operations, Pagination, Search, and Filters.
 */

let currentPage = 1;
const itemsPerPage = 5;
let filteredInterns = [];
let deleteInternId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Identify current view
  const isDirectoryPage = document.getElementById('interns-directory-tbody') !== null;
  const isFormPage = document.getElementById('internForm') !== null;

  if (isDirectoryPage) {
    initDirectory();
  } else if (isFormPage) {
    initForm();
  }
});

/* ==========================================================================
   Directory View Code (interns.html)
   ========================================================================== */

function initDirectory() {
  // Bind events
  const searchInput = document.getElementById('search-input');
  const filterDomain = document.getElementById('filter-domain');
  const filterStatus = document.getElementById('filter-status');
  const sortSelector = document.getElementById('sort-selector');
  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterDomain) filterDomain.addEventListener('change', applyFilters);
  if (filterStatus) filterStatus.addEventListener('change', applyFilters);
  if (sortSelector) sortSelector.addEventListener('change', applyFilters);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (deleteInternId) {
        deleteInternRecord(deleteInternId);
      }
    });
  }

  // Load first time
  applyFilters();
}

function applyFilters() {
  if (!window.Database) return;

  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);

  const query = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const domain = document.getElementById('filter-domain')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const sortVal = document.getElementById('sort-selector')?.value || 'id-asc';

  // 1. Search filter (Name, Email, Dept, University, Skills, Domain)
  filteredInterns = interns.filter(intern => {
    const matchQuery = 
      intern.name.toLowerCase().includes(query) ||
      intern.email.toLowerCase().includes(query) ||
      intern.department.toLowerCase().includes(query) ||
      intern.university.toLowerCase().includes(query) ||
      intern.domain.toLowerCase().includes(query) ||
      intern.skills.some(skill => skill.toLowerCase().includes(query));

    const matchDomain = domain === '' || intern.domain === domain;
    const matchStatus = status === '' || intern.status === status;

    return matchQuery && matchDomain && matchStatus;
  });

  // 2. Sorting
  filteredInterns.sort((a, b) => {
    switch (sortVal) {
      case 'id-asc':
        return a.id.localeCompare(b.id);
      case 'id-desc':
        return b.id.localeCompare(a.id);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-desc':
        return new Date(b.joiningDate) - new Date(a.joiningDate);
      case 'date-asc':
        return new Date(a.joiningDate) - new Date(b.joiningDate);
      default:
        return 0;
    }
  });

  // Reset to page 1 on filter trigger
  currentPage = 1;
  renderDirectoryTable();
}

function renderDirectoryTable() {
  const tbody = document.getElementById('interns-directory-tbody');
  if (!tbody) return;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredInterns.length);
  const pagedInterns = filteredInterns.slice(startIndex, endIndex);

  // Pagination stats
  const statsLbl = document.getElementById('pagination-stats');
  if (statsLbl) {
    if (filteredInterns.length === 0) {
      statsLbl.textContent = 'Showing 0-0 of 0 interns';
    } else {
      statsLbl.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredInterns.length} interns`;
    }
  }

  // Draw table
  if (pagedInterns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No matching intern profiles found.</td></tr>`;
    renderPaginationLinks(0);
    return;
  }

  tbody.innerHTML = pagedInterns.map(intern => {
    // Generate skills badges (max 3 badges, rest as +n)
    const skillsHtml = intern.skills.slice(0, 3).map(skill => 
      `<span class="badge bg-secondary me-1" style="font-weight:400; font-size:0.7rem;">${skill}</span>`
    ).join('') + (intern.skills.length > 3 ? `<span class="badge bg-light text-dark" style="font-weight:400; font-size:0.7rem;">+${intern.skills.length - 3}</span>` : '');

    return `
      <tr class="animate-fade-in">
        <td><strong class="font-monospace text-primary">${intern.id}</strong></td>
        <td>
          <div class="fw-semibold text-color">${intern.name}</div>
          <div class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-envelope-fill me-1"></i>${intern.email}</div>
          <div class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-telephone-fill me-1"></i>${intern.phone}</div>
        </td>
        <td>
          <div class="text-color" style="font-size:0.9rem;">${intern.university}</div>
          <small class="text-muted">${intern.department}</small>
        </td>
        <td>
          <div class="fw-medium text-color mb-1" style="font-size:0.9rem;">${intern.domain}</div>
          <div>${skillsHtml}</div>
        </td>
        <td style="font-size: 0.9rem;">
          <div class="text-color">${intern.duration}</div>
          <small class="text-muted">Joined: ${new Date(intern.joiningDate).toLocaleDateString()}</small>
        </td>
        <td>
          <span class="badge badge-custom ${intern.status === 'Active' ? 'badge-active' : 'badge-completed'}">
            ${intern.status}
          </span>
        </td>
        <td>
          <div class="d-flex justify-content-center gap-2">
            <a href="add-intern.html?id=${intern.id}" class="btn btn-sm btn-outline-primary border-0 p-1" title="Edit Profile">
              <i class="bi bi-pencil-square fs-5"></i>
            </a>
            <button class="btn btn-sm btn-outline-danger border-0 p-1" title="Delete Profile" onclick="openDeleteModal('${intern.id}', '${intern.name.replace(/'/g, "\\'")}')">
              <i class="bi bi-trash-fill fs-5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render pagination controls
  const totalPages = Math.ceil(filteredInterns.length / itemsPerPage);
  renderPaginationLinks(totalPages);
}

function renderPaginationLinks(totalPages) {
  const container = document.getElementById('pagination-links');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" onclick="changePage(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" onclick="changePage(${i})">${i}</a>
      </li>
    `;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" onclick="changePage(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
    </li>
  `;

  container.innerHTML = html;
}

window.changePage = function(page) {
  currentPage = page;
  renderDirectoryTable();
};

window.openDeleteModal = function(id, name) {
  deleteInternId = id;
  const nameEl = document.getElementById('delete-intern-name');
  const idEl = document.getElementById('delete-intern-id');
  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = id;

  const deleteModal = new bootstrap.Modal(document.getElementById('delete-confirmModal'));
  deleteModal.show();
};

function deleteInternRecord(id) {
  if (!window.Database) return;

  const db = window.Database;
  let interns = db.getData(window.STORAGE_KEYS.INTERNS);
  interns = interns.filter(i => i.id !== id);
  db.saveData(window.STORAGE_KEYS.INTERNS, interns);

  // Clean related tables
  let attendance = db.getData(window.STORAGE_KEYS.ATTENDANCE);
  attendance = attendance.filter(a => a.internId !== id);
  db.saveData(window.STORAGE_KEYS.ATTENDANCE, attendance);

  let performance = db.getData(window.STORAGE_KEYS.PERFORMANCE);
  performance = performance.filter(p => p.internId !== id);
  db.saveData(window.STORAGE_KEYS.PERFORMANCE, performance);

  let certificates = db.getData(window.STORAGE_KEYS.CERTIFICATES);
  certificates = certificates.filter(c => c.internId !== id);
  db.saveData(window.STORAGE_KEYS.CERTIFICATES, certificates);

  // Also unassign tasks
  let tasks = db.getData(window.STORAGE_KEYS.TASKS);
  tasks = tasks.map(t => {
    if (t.assignedTo === id) {
      t.assignedTo = ''; // set to unassigned
    }
    return t;
  });
  db.saveData(window.STORAGE_KEYS.TASKS, tasks);

  // Hide modal
  const modalEl = document.getElementById('delete-confirmModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  window.showToast('Intern and matching records deleted', 'success');
  applyFilters();
}

/* ==========================================================================
   Form View Code (add-intern.html)
   ========================================================================== */

let isEditMode = false;
let editInternId = null;

function initForm() {
  const urlParams = new URLSearchParams(window.location.search);
  editInternId = urlParams.get('id');
  isEditMode = editInternId !== null;

  if (isEditMode) {
    prepareEditMode(editInternId);
  } else {
    prepareAddMode();
  }

  // Bind submit
  const form = document.getElementById('internForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function prepareAddMode() {
  if (!window.Database) return;

  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);

  // Auto-generate numeric ID continuation
  let maxId = 1000;
  interns.forEach(i => {
    const parts = i.id.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1]);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  });

  const nextId = `BH-${maxId + 1}`;
  document.getElementById('intern-id').value = nextId;
  
  // Set default join date to today
  const joiningInput = document.getElementById('intern-joining');
  if (joiningInput) {
    joiningInput.value = new Date().toISOString().split('T')[0];
  }
}

function prepareEditMode(id) {
  if (!window.Database) return;

  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);
  const intern = interns.find(i => i.id === id);

  if (!intern) {
    window.showToast('Intern record not found!', 'danger');
    setTimeout(() => {
      window.location.href = 'interns.html';
    }, 1500);
    return;
  }

  // Update Page Labels
  document.getElementById('form-title-h2').textContent = 'Edit Intern Details';
  document.getElementById('form-desc-p').textContent = `Update details for intern profile: ${intern.name}`;
  document.getElementById('btn-submit').innerHTML = `<i class="bi bi-check-circle-fill"></i> Update Details`;

  // Pre-fill Inputs
  document.getElementById('intern-id').value = intern.id;
  document.getElementById('intern-name').value = intern.name;
  document.getElementById('intern-email').value = intern.email;
  document.getElementById('intern-phone').value = intern.phone;
  document.getElementById('intern-gender').value = intern.gender;
  document.getElementById('intern-university').value = intern.university;
  document.getElementById('intern-dept').value = intern.department;
  document.getElementById('intern-domain').value = intern.domain;
  document.getElementById('intern-skills').value = intern.skills.join(', ');
  document.getElementById('intern-joining').value = intern.joiningDate;
  document.getElementById('intern-duration').value = intern.duration;
  document.getElementById('intern-status').value = intern.status;
}

function handleFormSubmit(e) {
  e.preventDefault();

  if (!window.Database) return;

  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);

  const id = document.getElementById('intern-id').value;
  const name = document.getElementById('intern-name').value.trim();
  const email = document.getElementById('intern-email').value.trim();
  const phone = document.getElementById('intern-phone').value.trim();
  const gender = document.getElementById('intern-gender').value;
  const university = document.getElementById('intern-university').value.trim();
  const department = document.getElementById('intern-dept').value.trim();
  const domain = document.getElementById('intern-domain').value;
  const skillsText = document.getElementById('intern-skills').value;
  const joiningDate = document.getElementById('intern-joining').value;
  const duration = document.getElementById('intern-duration').value;
  const status = document.getElementById('intern-status').value;

  // Validation checks
  if (!name || !email || !phone || !gender || !university || !department || !domain || !skillsText || !joiningDate || !duration) {
    window.showToast('Please fill out all required fields', 'warning');
    return;
  }

  // Valid format checks
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    window.showToast('Please enter a valid email address', 'danger');
    return;
  }

  // Parse comma-separated skills
  const skills = skillsText.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const newRecord = {
    id,
    name,
    email,
    phone,
    gender,
    university,
    department,
    skills,
    domain,
    joiningDate,
    duration,
    status
  };

  if (isEditMode) {
    // Update record
    const index = interns.findIndex(i => i.id === id);
    if (index !== -1) {
      interns[index] = newRecord;
      db.saveData(window.STORAGE_KEYS.INTERNS, interns);
      window.showToast('Intern record updated successfully', 'success');
      
      // Update matching certificate records if status becomes completed
      let certificates = db.getData(window.STORAGE_KEYS.CERTIFICATES);
      let certIndex = certificates.findIndex(c => c.internId === id);
      if (certIndex !== -1) {
        if (status === 'Completed' && certificates[certIndex].status === 'Not Eligible') {
          certificates[certIndex].status = 'Ready';
        } else if (status === 'Active') {
          certificates[certIndex].status = 'Not Eligible';
        }
        db.saveData(window.STORAGE_KEYS.CERTIFICATES, certificates);
      }

      setTimeout(() => {
        window.location.href = 'interns.html';
      }, 1000);
    }
  } else {
    // Add new record
    interns.push(newRecord);
    db.saveData(window.STORAGE_KEYS.INTERNS, interns);

    // Seed defaults in other lists for this new intern
    // Seed Performance
    let performance = db.getData(window.STORAGE_KEYS.PERFORMANCE);
    performance.push({
      internId: id,
      communication: 0,
      coding: 0,
      problemSolving: 0,
      teamwork: 0,
      attendance: 0,
      taskCompletion: 0,
      overall: 0
    });
    db.saveData(window.STORAGE_KEYS.PERFORMANCE, performance);

    // Seed Certificate Profile
    let certificates = db.getData(window.STORAGE_KEYS.CERTIFICATES);
    certificates.push({
      internId: id,
      status: status === 'Completed' ? 'Ready' : 'Not Eligible',
      issueDate: '',
      completionDate: new Date(new Date(joiningDate).setMonth(new Date(joiningDate).getMonth() + parseInt(duration) || 3)).toISOString().split('T')[0]
    });
    db.saveData(window.STORAGE_KEYS.CERTIFICATES, certificates);

    window.showToast('New Intern registered successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'interns.html';
    }, 1000);
  }
}
