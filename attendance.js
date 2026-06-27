/**
 * Attendance Module for ByteHex Internship Portal
 * Handles date selection, marking statuses, computing daily summaries, and syncing to performance.
 */

let activeInterns = [];
let attendanceLogs = [];
let currentDate = '';

document.addEventListener('DOMContentLoaded', () => {
  initAttendancePage();
});

function initAttendancePage() {
  if (!window.Database) return;
  
  // Set default date to today
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    currentDate = today;
    
    dateInput.addEventListener('change', (e) => {
      currentDate = e.target.value;
      renderTable();
    });
  }
  
  // Bind Bulk Actions
  const btnMarkAll = document.getElementById('btn-mark-all-present');
  const btnClearDay = document.getElementById('btn-clear-day');
  
  if (btnMarkAll) btnMarkAll.addEventListener('click', markAllPresent);
  if (btnClearDay) btnClearDay.addEventListener('click', clearDay);
  
  loadData();
  renderTable();
}

function loadData() {
  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);
  // Only show active interns for attendance marking
  activeInterns = interns.filter(i => i.status === 'Active');
  attendanceLogs = db.getData(window.STORAGE_KEYS.ATTENDANCE);
}

function renderTable() {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;
  
  if (!currentDate) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Please select a valid date</td></tr>`;
    updateSummary(0, 0, 0);
    return;
  }
  
  // Get logs for selected date
  const dayLogs = attendanceLogs.filter(a => a.date === currentDate);
  
  let pCount = 0;
  let lCount = 0;
  let aCount = 0;
  
  if (activeInterns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No active interns found</td></tr>`;
    updateSummary(0, 0, 0);
    return;
  }
  
  tbody.innerHTML = activeInterns.map(intern => {
    // Find if marked
    const log = dayLogs.find(l => l.internId === intern.id);
    const status = log ? log.status : 'Not Marked';
    
    // Summary counting
    if (status === 'Present') pCount++;
    else if (status === 'Late') lCount++;
    else if (status === 'Absent') aCount++;
    
    // Status Badge
    let statusHtml = `<span class="badge bg-secondary bg-opacity-25 text-muted px-3 py-2 rounded-pill">Not Marked</span>`;
    if (status === 'Present') statusHtml = `<span class="badge bg-success px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-check2"></i> Present</span>`;
    else if (status === 'Late') statusHtml = `<span class="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-clock-history"></i> Late</span>`;
    else if (status === 'Absent') statusHtml = `<span class="badge bg-danger px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-x-lg"></i> Absent</span>`;
    
    // Action Buttons
    const btnPresent = `<button class="btn btn-outline-success border-0 rounded-3 p-1 px-2 mx-1 ${status === 'Present' ? 'active' : ''}" onclick="markIntern('${intern.id}', 'Present')" title="Mark Present"><i class="bi bi-check-circle-fill fs-5"></i></button>`;
    const btnLate = `<button class="btn btn-outline-warning border-0 rounded-3 p-1 px-2 mx-1 ${status === 'Late' ? 'active' : ''}" onclick="markIntern('${intern.id}', 'Late')" title="Mark Late"><i class="bi bi-clock-fill fs-5"></i></button>`;
    const btnAbsent = `<button class="btn btn-outline-danger border-0 rounded-3 p-1 px-2 mx-1 ${status === 'Absent' ? 'active' : ''}" onclick="markIntern('${intern.id}', 'Absent')" title="Mark Absent"><i class="bi bi-x-circle-fill fs-5"></i></button>`;
    
    return `
      <tr class="animate-fade-in">
        <td>
          <div class="fw-semibold text-color">${intern.name}</div>
          <small class="font-monospace text-primary">${intern.id}</small>
        </td>
        <td><span class="text-muted" style="font-size: 0.9rem;">${intern.domain}</span></td>
        <td class="text-center">${statusHtml}</td>
        <td class="text-center">
          <div class="d-flex justify-content-center bg-light-subtle rounded-pill p-1 mx-auto" style="width: fit-content; background: rgba(0,0,0,0.03);">
            ${btnPresent}
            ${btnLate}
            ${btnAbsent}
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  updateSummary(pCount, lCount, aCount);
}

function updateSummary(present, late, absent) {
  document.getElementById('sum-present').textContent = present;
  document.getElementById('sum-late').textContent = late;
  document.getElementById('sum-absent').textContent = absent;
  
  const totalMarked = present + late + absent;
  let rate = 0;
  if (totalMarked > 0) {
    // Treat Late as present for rate calculation
    rate = Math.round(((present + late) / totalMarked) * 100);
  }
  
  document.getElementById('sum-rate').textContent = `${rate}%`;
}

window.markIntern = function(internId, status) {
  if (!currentDate) return;
  
  const db = window.Database;
  const existingIndex = attendanceLogs.findIndex(a => a.internId === internId && a.date === currentDate);
  
  if (existingIndex !== -1) {
    attendanceLogs[existingIndex].status = status;
  } else {
    attendanceLogs.push({
      date: currentDate,
      internId: internId,
      status: status
    });
  }
  
  db.saveData(window.STORAGE_KEYS.ATTENDANCE, attendanceLogs);
  updateInternPerformanceAttendance(internId);
  renderTable();
}

function markAllPresent() {
  if (!currentDate || activeInterns.length === 0) return;
  
  const db = window.Database;
  let changed = false;
  
  activeInterns.forEach(intern => {
    const existingIndex = attendanceLogs.findIndex(a => a.internId === intern.id && a.date === currentDate);
    if (existingIndex === -1) {
      attendanceLogs.push({ date: currentDate, internId: intern.id, status: 'Present' });
      changed = true;
    }
  });
  
  if (changed) {
    db.saveData(window.STORAGE_KEYS.ATTENDANCE, attendanceLogs);
    activeInterns.forEach(intern => updateInternPerformanceAttendance(intern.id));
    window.showToast(`Unmarked interns set to Present for ${currentDate}`, 'success');
    renderTable();
  } else {
    window.showToast('All interns are already marked for this date', 'warning');
  }
}

function clearDay() {
  if (!currentDate) return;
  
  const db = window.Database;
  // Identify interns whose records are being removed to recalculate their scores
  const affectedInternIds = attendanceLogs.filter(a => a.date === currentDate).map(a => a.internId);
  
  attendanceLogs = attendanceLogs.filter(a => a.date !== currentDate);
  db.saveData(window.STORAGE_KEYS.ATTENDANCE, attendanceLogs);
  
  // Recalculate only affected
  affectedInternIds.forEach(id => updateInternPerformanceAttendance(id));
  
  window.showToast(`Cleared all logs for ${currentDate}`, 'success');
  renderTable();
}

// Sync Attendance Score with Performance Table
function updateInternPerformanceAttendance(internId) {
  if (!internId || !window.Database) return;
  
  const db = window.Database;
  const logs = attendanceLogs.filter(a => a.internId === internId);
  
  let attendanceScore = 0;
  
  if (logs.length > 0) {
    let totalScore = 0;
    logs.forEach(log => {
      if (log.status === 'Present') totalScore += 100;
      else if (log.status === 'Late') totalScore += 80;
      // Absent = 0
    });
    attendanceScore = Math.round(totalScore / logs.length);
  }
  
  let performance = db.getData(window.STORAGE_KEYS.PERFORMANCE);
  let perfIndex = performance.findIndex(p => p.internId === internId);
  
  if (perfIndex !== -1) {
    performance[perfIndex].attendance = attendanceScore;
    const p = performance[perfIndex];
    // Recompute overall
    p.overall = Math.round((p.communication + p.coding + p.problemSolving + p.teamwork + p.attendance + p.taskCompletion) / 6 * 10) / 10;
    db.saveData(window.STORAGE_KEYS.PERFORMANCE, performance);
  }
}
