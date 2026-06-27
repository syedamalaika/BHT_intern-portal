/**
 * Dashboard Logic for ByteHex Internship Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update Current Date Indicator
  const dateLbl = document.getElementById('current-date-lbl');
  if (dateLbl) {
    const options = { month: 'long', year: 'numeric', day: 'numeric' };
    dateLbl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // Load Data and Draw stats
  loadDashboardStats();

  // Listen to theme change to redraw charts with custom fonts color
  window.addEventListener('themeChanged', () => {
    destroyCharts();
    loadDashboardStats();
  });
});

let charts = {};

function destroyCharts() {
  if (charts.domain) charts.domain.destroy();
  if (charts.tasks) charts.tasks.destroy();
  if (charts.attendance) charts.attendance.destroy();
}

function loadDashboardStats() {
  if (!window.Database) return;

  const db = window.Database;
  const interns = db.getData(window.STORAGE_KEYS.INTERNS);
  const tasks = db.getData(window.STORAGE_KEYS.TASKS);
  const attendance = db.getData(window.STORAGE_KEYS.ATTENDANCE);
  const performance = db.getData(window.STORAGE_KEYS.PERFORMANCE);
  const announcements = db.getData(window.STORAGE_KEYS.ANNOUNCEMENTS);

  // 1. Basic Stats Counts
  const totalCount = interns.length;
  const activeCount = interns.filter(i => i.status === 'Active').length;
  const completedCount = interns.filter(i => i.status === 'Completed').length;

  document.getElementById('stat-total-interns').textContent = totalCount;
  document.getElementById('stat-active-interns').textContent = activeCount;
  document.getElementById('stat-completed-interns').textContent = completedCount;

  // 2. Task Completion Rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById('stat-task-completion').textContent = `${taskCompletionRate}%`;

  // 3. Average Performance Rate
  let avgPerf = 0;
  if (performance.length > 0) {
    const totalPerfSum = performance.reduce((sum, p) => sum + parseFloat(p.overall), 0);
    avgPerf = Math.round(totalPerfSum / performance.length);
  }
  document.getElementById('stat-avg-performance').textContent = `${avgPerf}%`;

  // 4. Best Performer
  let bestPerformerName = 'None';
  let bestPerformerScore = 0;
  if (performance.length > 0) {
    // Sort desc by overall
    const sortedPerf = [...performance].sort((a, b) => b.overall - a.overall);
    const bestRecord = sortedPerf[0];
    bestPerformerScore = Math.round(bestRecord.overall);
    
    // Find matching intern name
    const internObj = interns.find(i => i.id === bestRecord.internId);
    bestPerformerName = internObj ? internObj.name : 'Unknown';
  }
  document.getElementById('stat-best-performer').textContent = bestPerformerName;
  document.getElementById('stat-best-score').textContent = `Overall Score: ${bestPerformerScore}%`;

  // 5. Today's Attendance Calculation
  // We'll scan for the latest date logged in the system.
  let todayAttendanceRate = 0;
  if (attendance.length > 0) {
    // Find unique dates, sort desc
    const uniqueDates = [...new Set(attendance.map(a => a.date))].sort((a, b) => new Date(b) - new Date(a));
    const latestDate = uniqueDates[0];
    
    const logsOfLatestDate = attendance.filter(a => a.date === latestDate);
    const presents = logsOfLatestDate.filter(l => l.status === 'Present' || l.status === 'Late').length;
    
    todayAttendanceRate = logsOfLatestDate.length > 0 ? Math.round((presents / logsOfLatestDate.length) * 100) : 0;
  }
  document.getElementById('stat-today-attendance').textContent = `${todayAttendanceRate}%`;

  // 6. Populate Recent Registrations Table
  const recentTable = document.getElementById('recent-interns-table');
  if (recentTable) {
    // Get latest 4 interns
    const recentInterns = [...interns]
      .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
      .slice(0, 4);

    if (recentInterns.length === 0) {
      recentTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No registered interns found.</td></tr>`;
    } else {
      recentTable.innerHTML = recentInterns.map(intern => `
        <tr>
          <td><strong class="font-monospace text-primary">${intern.id}</strong></td>
          <td>${intern.name}</td>
          <td>${intern.domain}</td>
          <td>${new Date(intern.joiningDate).toLocaleDateString()}</td>
          <td>
            <span class="badge badge-custom ${intern.status === 'Active' ? 'badge-active' : 'badge-completed'}">
              ${intern.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
  }

  // 7. Populate Announcements Feed
  const feedContainer = document.getElementById('announcements-feed');
  if (feedContainer) {
    const latestAnnouncements = [...announcements]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    if (latestAnnouncements.length === 0) {
      feedContainer.innerHTML = `<p class="text-muted text-center py-3">No news bulletins posted yet.</p>`;
    } else {
      feedContainer.innerHTML = latestAnnouncements.map(ann => `
        <div class="p-3 rounded-3" style="background: rgba(37, 99, 235, 0.04); border-left: 3px solid var(--primary);">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-color" style="font-size: 0.9rem;">${ann.title}</strong>
            <small class="text-muted" style="font-size: 0.7rem;">${new Date(ann.date).toLocaleDateString()}</small>
          </div>
          <p class="text-muted m-0" style="font-size: 0.8rem; line-height: 1.4;">${ann.content}</p>
        </div>
      `).join('');
    }
  }

  // 8. Render ChartJS charts
  renderCharts(interns, tasks, attendance);
}

function renderCharts(interns, tasks, attendance) {
  // Common theme color checks
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // Chart 1: Domains Breakdown
  const domainsCount = {};
  interns.forEach(i => {
    domainsCount[i.domain] = (domainsCount[i.domain] || 0) + 1;
  });
  const domainLabels = Object.keys(domainsCount);
  const domainData = Object.values(domainsCount);

  const ctxDomain = document.getElementById('domainChart').getContext('2d');
  charts.domain = new Chart(ctxDomain, {
    type: 'pie',
    data: {
      labels: domainLabels,
      datasets: [{
        data: domainData,
        backgroundColor: ['#2563EB', '#0EA5E9', '#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#1E293B' : '#FFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: labelColor, font: { family: 'Poppins', size: 10 } }
        }
      }
    }
  });

  // Chart 2: Task Status Summary
  const tasksCount = { 'Pending': 0, 'In Progress': 0, 'Completed': 0 };
  tasks.forEach(t => {
    if (tasksCount[t.status] !== undefined) {
      tasksCount[t.status]++;
    }
  });

  const ctxTasks = document.getElementById('tasksChart').getContext('2d');
  charts.tasks = new Chart(ctxTasks, {
    type: 'doughnut',
    data: {
      labels: Object.keys(tasksCount),
      datasets: [{
        data: Object.values(tasksCount),
        backgroundColor: ['#F59E0B', '#0EA5E9', '#2563EB'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#1E293B' : '#FFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: labelColor, font: { family: 'Poppins', size: 10 } }
        }
      },
      cutout: '65%'
    }
  });

  // Chart 3: Weekly Attendance Line Chart
  // Find dates, compute attendance rate per date, sort asc
  const attendanceByDate = {};
  attendance.forEach(a => {
    if (!attendanceByDate[a.date]) {
      attendanceByDate[a.date] = { total: 0, present: 0 };
    }
    attendanceByDate[a.date].total++;
    if (a.status === 'Present' || a.status === 'Late') {
      attendanceByDate[a.date].present++;
    }
  });

  const sortedDates = Object.keys(attendanceByDate).sort((a, b) => new Date(a) - new Date(b)).slice(-6);
  const attendanceRates = sortedDates.map(d => {
    const day = attendanceByDate[d];
    return Math.round((day.present / day.total) * 100);
  });

  const formattedDates = sortedDates.map(d => {
    const parsed = new Date(d);
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const ctxAttendance = document.getElementById('attendanceChart').getContext('2d');
  charts.attendance = new Chart(ctxAttendance, {
    type: 'line',
    data: {
      labels: formattedDates,
      datasets: [{
        label: 'Attendance Rate %',
        data: attendanceRates,
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#14B8A6',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: 'Poppins', size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: 'Poppins', size: 10 } },
          min: 0,
          max: 100
        }
      }
    }
  });
}
