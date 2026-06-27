/**
 * Performance Module for ByteHex Internship Portal
 * Handles metric calculations, ranking, and evaluation input.
 */

let internsList = [];
let performanceList = [];

document.addEventListener('DOMContentLoaded', () => {
  initPerformancePage();
});

function initPerformancePage() {
  loadData();
  renderTopPerformer();
  renderGrid();
  
  const evalForm = document.getElementById('evalForm');
  if (evalForm) {
    evalForm.addEventListener('submit', handleEvalSubmit);
  }
}

function loadData() {
  if (!window.Database) return;
  const db = window.Database;
  internsList = db.getData(window.STORAGE_KEYS.INTERNS);
  performanceList = db.getData(window.STORAGE_KEYS.PERFORMANCE);
}

function renderTopPerformer() {
  if (performanceList.length === 0) return;
  
  // Sort desc
  const sorted = [...performanceList].sort((a, b) => b.overall - a.overall);
  const best = sorted[0];
  
  const intern = internsList.find(i => i.id === best.internId);
  if (!intern) return;
  
  document.getElementById('top-name').textContent = intern.name;
  document.getElementById('top-domain').textContent = intern.domain;
  
  document.getElementById('top-score').textContent = `${Math.round(best.overall)}%`;
  document.getElementById('top-attendance').textContent = `${Math.round(best.attendance)}%`;
  document.getElementById('top-tasks').textContent = `${Math.round(best.taskCompletion)}%`;
}

function renderGrid() {
  const tbody = document.getElementById('performance-tbody');
  if (!tbody) return;
  
  if (internsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No interns found to evaluate.</td></tr>`;
    return;
  }
  
  // Combine lists
  const rows = internsList.map(intern => {
    let p = performanceList.find(x => x.internId === intern.id);
    if (!p) {
      // Default zero state
      p = { communication: 0, coding: 0, problemSolving: 0, teamwork: 0, attendance: 0, taskCompletion: 0, overall: 0 };
    }
    
    // Derived values
    const coreAvg = Math.round((p.communication + p.coding + p.problemSolving + p.teamwork) / 4);
    
    let badgeClass = 'bg-danger';
    let badgeText = 'Needs Improvement';
    let circleColor = 'var(--primary)';
    
    if (p.overall >= 90) { badgeClass = 'bg-success'; badgeText = 'Excellent'; circleColor = '#10B981'; }
    else if (p.overall >= 75) { badgeClass = 'bg-primary'; badgeText = 'Good'; circleColor = '#3B82F6'; }
    else if (p.overall >= 60) { badgeClass = 'bg-warning text-dark'; badgeText = 'Average'; circleColor = '#F59E0B'; }
    else { circleColor = '#EF4444'; }
    
    return `
      <tr class="animate-fade-in">
        <td>
          <div class="fw-semibold text-color">${intern.name}</div>
          <small class="font-monospace text-primary">${intern.id}</small>
        </td>
        <td>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span style="font-size: 0.8rem;">Core Average</span>
            <span class="fw-bold" style="font-size: 0.8rem;">${coreAvg}%</span>
          </div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${coreAvg}%; background: ${circleColor};"></div>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2 mb-1" style="font-size: 0.75rem;">
            <i class="bi bi-calendar-check text-muted"></i> Att: <strong class="ms-auto">${Math.round(p.attendance)}%</strong>
          </div>
          <div class="d-flex align-items-center gap-2" style="font-size: 0.75rem;">
            <i class="bi bi-list-check text-muted"></i> Tsk: <strong class="ms-auto">${Math.round(p.taskCompletion)}%</strong>
          </div>
        </td>
        <td>
          <span class="badge ${badgeClass} perf-badge">${badgeText}</span>
        </td>
        <td class="text-center">
          <div class="overall-circle mx-auto" style="background: ${circleColor}; font-size: 0.9rem;">
            ${Math.round(p.overall)}%
          </div>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary rounded-3 px-3 fw-semibold" onclick="openEvalModal('${intern.id}')">
            Evaluate
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = rows.join('');
}

window.openEvalModal = function(internId) {
  const intern = internsList.find(i => i.id === internId);
  const p = performanceList.find(x => x.internId === internId) || { communication: 0, coding: 0, problemSolving: 0, teamwork: 0, attendance: 0, taskCompletion: 0 };
  
  if (!intern) return;
  
  document.getElementById('eval-intern-id').value = internId;
  document.getElementById('eval-intern-name').textContent = intern.name;
  
  // Set Sliders
  document.getElementById('eval-comm').value = p.communication;
  document.getElementById('val-comm').textContent = p.communication + '%';
  
  document.getElementById('eval-code').value = p.coding;
  document.getElementById('val-code').textContent = p.coding + '%';
  
  document.getElementById('eval-prob').value = p.problemSolving;
  document.getElementById('val-prob').textContent = p.problemSolving + '%';
  
  document.getElementById('eval-team').value = p.teamwork;
  document.getElementById('val-team').textContent = p.teamwork + '%';
  
  // Set Readonly texts
  document.getElementById('eval-sys-att').textContent = Math.round(p.attendance) + '%';
  document.getElementById('eval-sys-task').textContent = Math.round(p.taskCompletion) + '%';
  
  const evalModal = new bootstrap.Modal(document.getElementById('evalModal'));
  evalModal.show();
}

function handleEvalSubmit(e) {
  e.preventDefault();
  
  if (!window.Database) return;
  const db = window.Database;
  
  const internId = document.getElementById('eval-intern-id').value;
  const comm = parseInt(document.getElementById('eval-comm').value) || 0;
  const code = parseInt(document.getElementById('eval-code').value) || 0;
  const prob = parseInt(document.getElementById('eval-prob').value) || 0;
  const team = parseInt(document.getElementById('eval-team').value) || 0;
  
  const idx = performanceList.findIndex(p => p.internId === internId);
  if (idx !== -1) {
    performanceList[idx].communication = comm;
    performanceList[idx].coding = code;
    performanceList[idx].problemSolving = prob;
    performanceList[idx].teamwork = team;
    
    // Recalculate Overall
    const p = performanceList[idx];
    p.overall = Math.round((p.communication + p.coding + p.problemSolving + p.teamwork + p.attendance + p.taskCompletion) / 6 * 10) / 10;
    
    db.saveData(window.STORAGE_KEYS.PERFORMANCE, performanceList);
  } else {
    // Failsafe create
    const p = {
      internId, communication: comm, coding: code, problemSolving: prob, teamwork: team, attendance: 0, taskCompletion: 0
    };
    p.overall = Math.round((comm + code + prob + team) / 6 * 10) / 10;
    performanceList.push(p);
    db.saveData(window.STORAGE_KEYS.PERFORMANCE, performanceList);
  }
  
  const modalEl = document.getElementById('evalModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
  
  window.showToast('Evaluation scores saved successfully', 'success');
  renderTopPerformer();
  renderGrid();
}
