/**
 * Settings Module for ByteHex Internship Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
});

function initSettings() {
  if (!window.Database) return;
  
  const settings = window.Database.getSettings();
  
  // Set User Session Profile Data
  const sessionStr = localStorage.getItem(window.STORAGE_KEYS ? window.STORAGE_KEYS.SESSION : 'bytehex_session');
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    const nameEl = document.getElementById('settings-admin-name');
    const emailEl = document.getElementById('settings-admin-email');
    if (nameEl) nameEl.value = session.name || 'Administrator';
    if (emailEl) emailEl.value = session.email || 'admin@bytehex.com';
  }
  
  // Set initial inputs
  const nameInput = document.getElementById('setting-portal-name');
  if (nameInput) {
    nameInput.value = settings.portalName || "ByteHex Internship Portal";
  }
  
  const darkSwitch = document.getElementById('setting-dark-mode');
  if (darkSwitch) {
    darkSwitch.checked = settings.darkMode === true;
    
    // Bind change listener
    darkSwitch.addEventListener('change', (e) => {
      // Trigger global checkbox via utilities.js mechanism if it exists
      const globalSwitch = document.getElementById('checkbox-theme');
      if (globalSwitch) {
        globalSwitch.checked = e.target.checked;
        globalSwitch.dispatchEvent(new Event('change'));
      } else {
        // Fallback save
        settings.darkMode = e.target.checked;
        window.Database.saveSettings(settings);
        if (e.target.checked) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      }
    });
  }
  
  // Bind Save Name
  const btnSaveName = document.getElementById('btn-save-sys');
  if (btnSaveName) {
    btnSaveName.addEventListener('click', () => {
      const newName = document.getElementById('setting-portal-name').value.trim();
      if (newName) {
        settings.portalName = newName;
        window.Database.saveSettings(settings);
        window.showToast('Portal display name updated', 'success');
        
        // Update nav bar immediately
        const navTitle = document.getElementById('portal-title-display');
        if (navTitle) navTitle.textContent = newName;
        document.title = `Settings | ${newName}`;
      } else {
        window.showToast('Portal name cannot be empty', 'danger');
      }
    });
  }
  
  // Bind Reset
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', () => {
      window.Database.resetDB();
      const modalEl = document.getElementById('resetModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      
      window.showToast('System Factory Reset Complete! Reloading...', 'success');
      
      setTimeout(() => {
        window.location.href = 'index.html'; // Log out to force fresh re-auth
      }, 1500);
    });
  }
}

window.openResetModal = function() {
  const modal = new bootstrap.Modal(document.getElementById('resetModal'));
  modal.show();
}
