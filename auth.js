/**
 * Authentication Module for ByteHex Internship Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('email').value.trim();
      const passwordInput = document.getElementById('password').value.trim();
      const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;
      
      // Perform validation
      if (!emailInput || !passwordInput) {
        window.showToast('Please enter both email and password', 'danger');
        return;
      }
      
      // Accept any valid-looking email and password for the demo
      if (emailInput.includes('@') && passwordInput.length > 0) {
        const sessionData = {
          email: emailInput,
          // Extract a username from email (e.g. name@domain -> Name)
          name: emailInput.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          loggedInAt: new Date().toISOString(),
          remember: rememberMe
        };
        
        localStorage.setItem('bytehex_session', JSON.stringify(sessionData));
        window.showToast('Login successful! Redirecting...', 'success');
        
        // Wait and redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        window.showToast('Please enter a valid email address.', 'danger');
      }
    });
  }
});
