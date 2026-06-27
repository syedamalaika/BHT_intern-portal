/**
 * Certificates Tracker Module for ByteHex Internship Portal
 */

let internsList = [];
let certificatesList = [];
let activeCertId = null;

document.addEventListener('DOMContentLoaded', () => {
  initCertificatesPage();
});

function initCertificatesPage() {
  loadData();
  renderGrid();
  
  const btnIssue = document.getElementById('btn-issue-cert');
  if (btnIssue) btnIssue.addEventListener('click', issueCertificate);
  
  const btnSaveStatus = document.getElementById('btn-save-status');
  if (btnSaveStatus) btnSaveStatus.addEventListener('click', saveStatusChange);
}

function loadData() {
  if (!window.Database) return;
  const db = window.Database;
  internsList = db.getData(window.STORAGE_KEYS.INTERNS);
  certificatesList = db.getData(window.STORAGE_KEYS.CERTIFICATES);
}

function renderGrid() {
  const tbody = document.getElementById('certificates-tbody');
  if (!tbody) return;
  
  if (internsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No interns found.</td></tr>`;
    return;
  }
  
  let cReview = 0, cReady = 0, cIssued = 0, cNotEligible = 0;
  
  const rows = internsList.map(intern => {
    let cert = certificatesList.find(c => c.internId === intern.id);
    if (!cert) {
      cert = { internId: intern.id, status: 'Not Eligible', issueDate: '', completionDate: '' };
    }
    
    // Stats count
    if (cert.status === 'Under Review') cReview++;
    else if (cert.status === 'Ready') cReady++;
    else if (cert.status === 'Issued') cIssued++;
    else cNotEligible++;
    
    // Badge styles
    let badgeClass = 'bg-secondary';
    if (cert.status === 'Under Review') badgeClass = 'bg-warning text-dark';
    else if (cert.status === 'Ready') badgeClass = 'bg-primary';
    else if (cert.status === 'Issued') badgeClass = 'bg-success';
    else if (cert.status === 'Not Eligible') badgeClass = 'bg-danger';
    
    // Actions logic
    let actionBtn = '';
    if (cert.status === 'Issued') {
      actionBtn = `<button class="btn btn-sm btn-outline-success fw-bold rounded-3 px-3" onclick="openPreview('${intern.id}')"><i class="bi bi-eye-fill me-1"></i> View Issued</button>`;
    } else if (cert.status === 'Ready') {
      actionBtn = `<button class="btn btn-sm btn-primary-custom fw-bold rounded-3 px-3 p-1" onclick="openPreview('${intern.id}')"><i class="bi bi-award me-1"></i> Issue Now</button>`;
    } else {
      actionBtn = `<button class="btn btn-sm btn-outline-secondary fw-bold rounded-3 px-3" onclick="openStatusModal('${intern.id}', '${cert.status}')"><i class="bi bi-pencil-square me-1"></i> Set Status</button>`;
    }
    
    return `
      <tr class="animate-fade-in">
        <td><strong class="font-monospace text-primary">${intern.id}</strong></td>
        <td>
          <div class="fw-semibold text-color">${intern.name}</div>
          <small class="text-muted">${intern.domain}</small>
        </td>
        <td>
          <div class="text-color">${cert.completionDate ? new Date(cert.completionDate).toLocaleDateString() : 'N/A'}</div>
          ${cert.issueDate ? `<small class="text-success fw-semibold"><i class="bi bi-check2-all"></i> Issued on ${new Date(cert.issueDate).toLocaleDateString()}</small>` : ''}
        </td>
        <td><span class="badge ${badgeClass} status-badge-cert">${cert.status}</span></td>
        <td class="text-center">${actionBtn}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = rows.join('');
  
  // Update stat counters
  document.getElementById('count-under-review').textContent = cReview;
  document.getElementById('count-ready').textContent = cReady;
  document.getElementById('count-issued').textContent = cIssued;
  document.getElementById('count-not-eligible').textContent = cNotEligible;
}

window.openStatusModal = function(internId, currentStatus) {
  document.getElementById('status-intern-id').value = internId;
  document.getElementById('status-select').value = currentStatus;
  
  const modal = new bootstrap.Modal(document.getElementById('statusModal'));
  modal.show();
}

function saveStatusChange() {
  if (!window.Database) return;
  const db = window.Database;
  
  const internId = document.getElementById('status-intern-id').value;
  const newStatus = document.getElementById('status-select').value;
  
  const idx = certificatesList.findIndex(c => c.internId === internId);
  if (idx !== -1) {
    certificatesList[idx].status = newStatus;
    if (newStatus !== 'Issued') {
      certificatesList[idx].issueDate = '';
    }
    db.saveData(window.STORAGE_KEYS.CERTIFICATES, certificatesList);
    
    const modalEl = document.getElementById('statusModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    
    window.showToast('Certificate status updated', 'success');
    renderGrid();
  }
}

window.openPreview = function(internId) {
  const intern = internsList.find(i => i.id === internId);
  const cert = certificatesList.find(c => c.internId === internId);
  
  if (!intern || !cert) return;
  
  activeCertId = internId;
  
  document.getElementById('cert-display-name').textContent = intern.name;
  document.getElementById('cert-display-domain').textContent = intern.domain;
  
  const btnIssue = document.getElementById('btn-issue-cert');
  const helper = document.getElementById('cert-status-helper');
  const dateDisplay = document.getElementById('cert-display-date');
  
  if (cert.status === 'Issued') {
    dateDisplay.textContent = new Date(cert.issueDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
    btnIssue.style.display = 'none';
    helper.textContent = 'Status: Certificate has been issued';
  } else {
    // Ready
    dateDisplay.textContent = new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
    btnIssue.style.display = 'inline-block';
    helper.textContent = 'Status: Ready to issue';
  }
  
  const modal = new bootstrap.Modal(document.getElementById('previewModal'));
  modal.show();
}

function issueCertificate() {
  if (!activeCertId || !window.Database) return;
  
  const db = window.Database;
  const idx = certificatesList.findIndex(c => c.internId === activeCertId);
  
  if (idx !== -1) {
    certificatesList[idx].status = 'Issued';
    certificatesList[idx].issueDate = new Date().toISOString();
    
    db.saveData(window.STORAGE_KEYS.CERTIFICATES, certificatesList);
    
    const modalEl = document.getElementById('previewModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    
    window.showToast('Certificate Issued Successfully!', 'success');
    renderGrid();
  }
}
