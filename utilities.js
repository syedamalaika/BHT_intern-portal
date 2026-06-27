/**
 * Utilities for ByteHex Internship Portal
 * Implements navigation injections, theme toggling, custom cursor, and toast system.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check auth session unless we're on the login page (index.html)
  checkAuth();

  // Inject elements
  injectCursor();
  injectNavigation();
  setupTheme();
  setupCursorFollower();
  highlightSidebar();
  setupBreadcrumbs();
  setupLogout();
});

// Auth Verification
function checkAuth() {
  const path = window.location.pathname;
  const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path === '';
  const session = localStorage.getItem(window.STORAGE_KEYS ? window.STORAGE_KEYS.SESSION : 'bytehex_session');
  
  if (isLoginPage) {
    if (session) {
      window.location.href = 'dashboard.html';
    }
  } else {
    if (!session) {
      window.location.href = 'index.html';
    }
  }
}

// Injects Custom Cursor elements dynamically
function injectCursor() {
  if (document.querySelector('.custom-cursor')) return;
  
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  
  const follower = document.createElement('div');
  follower.className = 'custom-cursor-follower';
  
  document.body.appendChild(cursor);
  document.body.appendChild(follower);
}

// Dynamic Sidebar and Navbar injection for DRY principles
function injectNavigation() {
  const sidebarContainer = document.getElementById('sidebar-container');
  const navbarContainer = document.getElementById('navbar-container');
  
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <nav id="sidebar">
        <div class="sidebar-header">
          <div class="d-flex align-items-center gap-2">
            <img src="assets/images/logo.png" alt="BHT" style="width: 32px; height: auto;" class="animate-fade-in" onerror="this.src='https://placehold.co/40x40/171719/3EA7AD?text=BHT'">
            <h5 class="m-0 text-white fw-bold">ByteHex <span style="color: var(--primary);">Tech</span></h5>
          </div>
          <small class="text-info font-monospace" style="font-size: 0.75rem;">Intern Portal</small>
        </div>
        <ul class="list-unstyled components">
          <p>Main Menu</p>
          <li id="nav-dashboard">
            <a href="dashboard.html"><i class="bi bi-grid-1x2-fill"></i> Dashboard</a>
          </li>
          <li id="nav-interns">
            <a href="interns.html"><i class="bi bi-people-fill"></i> Interns List</a>
          </li>
          <li id="nav-add-intern">
            <a href="add-intern.html"><i class="bi bi-person-plus-fill"></i> Register Intern</a>
          </li>
          
          <p>Management</p>
          <li id="nav-tasks">
            <a href="tasks.html"><i class="bi bi-list-task"></i> Tasks Portal</a>
          </li>
          <li id="nav-attendance">
            <a href="attendance.html"><i class="bi bi-calendar2-check-fill"></i> Attendance</a>
          </li>
          <li id="nav-performance">
            <a href="performance.html"><i class="bi bi-speedometer2"></i> Performance</a>
          </li>
          
          <p>Administration</p>
          <li id="nav-announcements">
            <a href="announcements.html"><i class="bi bi-megaphone-fill"></i> Announcements</a>
          </li>
          <li id="nav-certificates">
            <a href="certificates.html"><i class="bi bi-award-fill"></i> Certificates</a>
          </li>
          <li id="nav-settings">
            <a href="settings.html"><i class="bi bi-gear-fill"></i> Settings</a>
          </li>
        </ul>
        <div class="p-3 text-center" style="position: absolute; bottom: 0; width: 100%;">
          <hr class="bg-light opacity-25">
          <small class="text-muted d-block">&copy; 2026 ByteHex Ltd.</small>
        </div>
      </nav>
    `;
  }
  
  if (navbarContainer) {
    const settings = window.Database ? window.Database.getSettings() : { darkMode: false };
    const sessionStr = localStorage.getItem(window.STORAGE_KEYS ? window.STORAGE_KEYS.SESSION : 'bytehex_session');
    const session = sessionStr ? JSON.parse(sessionStr) : { name: 'Admin', email: 'admin@bytehex.com' };
    const userName = session.name || 'Admin';

    navbarContainer.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-custom">
        <div class="container-fluid p-0">
          <button type="button" id="sidebarCollapse" class="btn btn-outline-secondary border-0 p-1 me-3">
            <i class="bi bi-list fs-3"></i>
          </button>
          
          <div class="d-flex align-items-center gap-2">
            <span class="navbar-brand m-0 font-weight-bold fs-5 text-color" id="portal-title-display">ByteHex Portal</span>
          </div>
          
          <div class="ms-auto d-flex align-items-center gap-3">
            <!-- Dark Mode Switcher -->
            <div class="theme-switch-wrapper me-2">
              <span class="me-2 text-muted" style="font-size: 0.85rem;"><i class="bi bi-brightness-high"></i></span>
              <label class="theme-switch" for="checkbox-theme">
                <input type="checkbox" id="checkbox-theme" ${settings.darkMode ? 'checked' : ''} />
                <div class="slider-toggle"></div>
              </label>
              <span class="ms-2 text-muted" style="font-size: 0.85rem;"><i class="bi bi-moon-stars"></i></span>
            </div>
            
            <!-- Quick Notification -->
            <div class="dropdown">
              <button class="btn btn-outline-secondary border-0 p-1 position-relative" type="button" id="notiDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-bell-fill fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" id="noti-badge" style="display: none;"></span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end glass-card p-2" aria-labelledby="notiDropdown" id="noti-dropdown-list" style="width: 280px; max-height: 350px; overflow-y: auto;">
                <li><h6 class="dropdown-header">Announcements</h6></li>
                <li><hr class="dropdown-divider"></li>
                <div id="noti-items">
                  <!-- Injected via announcements check -->
                  <li class="p-2 text-center text-muted"><small>No new announcements</small></li>
                </div>
              </ul>
            </div>
            
            <div class="vr bg-secondary opacity-25" style="height: 24px;"></div>
            
            <!-- Profile dropdown -->
            <div class="dropdown">
              <button class="profile-dropdown-btn dropdown-toggle" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" alt="Profile" class="profile-img-circle">
                <span class="d-none d-md-inline text-color" style="font-size: 0.9rem; font-weight: 500;">${userName}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end glass-card p-2" aria-labelledby="profileDropdown">
                <li><a class="dropdown-item rounded-3" href="settings.html"><i class="bi bi-person-fill me-2 text-primary"></i> Edit Profile</a></li>
                <li><a class="dropdown-item rounded-3" href="settings.html"><i class="bi bi-gear-fill me-2 text-secondary"></i> System Settings</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item rounded-3 text-danger" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i> Log Out</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    `;
    
    // Bind Sidebar toggle click
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
      sidebarCollapse.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('active');
      });
    }
  }
}

// Active tab highlighting based on current path
function highlightSidebar() {
  const path = window.location.pathname;
  let activeId = 'nav-dashboard';
  
  if (path.includes('dashboard.html')) activeId = 'nav-dashboard';
  else if (path.includes('add-intern.html')) activeId = 'nav-add-intern';
  else if (path.includes('interns.html')) activeId = 'nav-interns';
  else if (path.includes('tasks.html')) activeId = 'nav-tasks';
  else if (path.includes('attendance.html')) activeId = 'nav-attendance';
  else if (path.includes('performance.html')) activeId = 'nav-performance';
  else if (path.includes('announcements.html')) activeId = 'nav-announcements';
  else if (path.includes('certificates.html')) activeId = 'nav-certificates';
  else if (path.includes('settings.html')) activeId = 'nav-settings';
  
  const activeEl = document.getElementById(activeId);
  if (activeEl) {
    activeEl.classList.add('active');
  }
}

// Handles Custom Cursor Smooth follower lag
function setupCursorFollower() {
  const cursor = document.querySelector('.custom-cursor');
  const follower = document.querySelector('.custom-cursor-follower');
  
  if (!cursor || !follower) return;
  
  // Custom cursor positioning
  document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    follower.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });
  
  // Custom cursor hover scaling
  const hoverables = 'a, button, input, select, textarea, .quick-action-btn, [role="button"], .slider-toggle';
  
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      cursor.style.width = '12px';
      cursor.style.height = '12px';
      cursor.style.backgroundColor = 'var(--accent)';
      
      follower.style.width = '48px';
      follower.style.height = '48px';
      follower.style.borderColor = 'var(--accent)';
      follower.style.backgroundColor = 'rgba(20, 184, 166, 0.05)';
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) {
      cursor.style.width = '8px';
      cursor.style.height = '8px';
      cursor.style.backgroundColor = 'var(--primary)';
      
      follower.style.width = '32px';
      follower.style.height = '32px';
      follower.style.borderColor = 'var(--secondary)';
      follower.style.backgroundColor = 'transparent';
    }
  });
}

// Handles Theme Toggling sync
function setupTheme() {
  const checkbox = document.getElementById('checkbox-theme');
  if (!checkbox) return;
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const dbSettings = window.Database ? window.Database.getSettings() : { darkMode: false };
  
  // Set theme from local settings
  if (dbSettings.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    checkbox.checked = true;
  } else {
    document.documentElement.removeAttribute('data-theme');
    checkbox.checked = false;
  }
  
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      dbSettings.darkMode = true;
      showToast('Dark mode enabled', 'success');
    } else {
      document.documentElement.removeAttribute('data-theme');
      dbSettings.darkMode = false;
      showToast('Light mode enabled', 'success');
    }
    
    if (window.Database) {
      window.Database.saveSettings(dbSettings);
    }
    
    // Dispatch custom event for charts to redraw
    window.dispatchEvent(new Event('themeChanged'));
  });
}

// Render dynamic breadcrumbs
function setupBreadcrumbs() {
  const breadcrumbEl = document.getElementById('breadcrumb-container');
  if (!breadcrumbEl) return;
  
  const path = window.location.pathname;
  let pageName = 'Dashboard';
  
  if (path.includes('interns.html')) pageName = 'Interns List';
  else if (path.includes('add-intern.html')) pageName = 'Register Intern';
  else if (path.includes('tasks.html')) pageName = 'Tasks Portal';
  else if (path.includes('attendance.html')) pageName = 'Attendance';
  else if (path.includes('performance.html')) pageName = 'Performance Metrics';
  else if (path.includes('announcements.html')) pageName = 'Announcements';
  else if (path.includes('certificates.html')) pageName = 'Certificates Tracker';
  else if (path.includes('settings.html')) pageName = 'Portal Settings';
  
  breadcrumbEl.innerHTML = `
    <nav aria-label="breadcrumb" class="breadcrumb-custom animate-fade-in">
      <ol class="breadcrumb m-0">
        <li class="breadcrumb-item"><a href="dashboard.html">Home</a></li>
        <li class="breadcrumb-item active" aria-current="page">${pageName}</li>
      </ol>
    </nav>
  `;
  
  // Update browser document tab title
  const dbSettings = window.Database ? window.Database.getSettings() : { portalName: 'ByteHex Portal' };
  document.title = `${pageName} | ${dbSettings.portalName || 'ByteHex Portal'}`;
  
  // Update Navbar Title Display if it exists
  const navTitle = document.getElementById('portal-title-display');
  if (navTitle) {
    navTitle.textContent = dbSettings.portalName || 'ByteHex Portal';
  }
}

// Setup notifications list from announcements
function populateNotifications() {
  if (!window.Database) return;
  
  const announcements = window.Database.getData(window.STORAGE_KEYS.ANNOUNCEMENTS);
  const badge = document.getElementById('noti-badge');
  const itemsContainer = document.getElementById('noti-items');
  
  if (!itemsContainer) return;
  
  if (announcements.length > 0) {
    if (badge) badge.style.display = 'block';
    
    // Sort announcements by date desc, get first 3
    const recent = [...announcements]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
      
    itemsContainer.innerHTML = recent.map(ann => `
      <li class="p-2 border-bottom-1">
        <a class="dropdown-item rounded-3 p-2 text-wrap" href="announcements.html" style="line-height:1.4;">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary p-1"><i class="bi bi-megaphone-fill" style="font-size:0.75rem;"></i></span>
            <strong style="font-size:0.8rem;" class="text-color">${ann.title}</strong>
          </div>
          <small class="text-muted d-block" style="font-size:0.75rem;">${ann.content.substring(0, 50)}...</small>
          <small class="text-muted" style="font-size:0.65rem;">${new Date(ann.date).toLocaleDateString()}</small>
        </a>
      </li>
    `).join('');
  } else {
    if (badge) badge.style.display = 'none';
    itemsContainer.innerHTML = `<li class="p-2 text-center text-muted"><small>No announcements</small></li>`;
  }
}

// Hook populateNotifications in loaded listener
window.addEventListener('load', populateNotifications);

// Bind logout click
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(window.STORAGE_KEYS ? window.STORAGE_KEYS.SESSION : 'bytehex_session');
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    });
  }
}

// Centralized Toast Notifications
function showToast(message, type = 'primary') {
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  
  let icon = 'bi-info-circle-fill';
  if (type === 'success') icon = 'bi-check-circle-fill';
  else if (type === 'danger') icon = 'bi-exclamation-triangle-fill';
  else if (type === 'warning') icon = 'bi-exclamation-circle-fill';
  
  toast.innerHTML = `
    <i class="bi ${icon} fs-5 text-${type === 'primary' ? 'primary' : type}"></i>
    <div>
      <p class="m-0" style="font-size: 0.9rem; font-weight: 500;">${message}</p>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Expose toast function globally
window.showToast = showToast;
