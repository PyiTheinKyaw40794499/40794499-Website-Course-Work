const Auth = {
  getUsers() { return JSON.parse(localStorage.getItem('cosmicUsers') || '[]'); },
  saveUsers(u) { localStorage.setItem('cosmicUsers', JSON.stringify(u)); },
  getSession() { return JSON.parse(localStorage.getItem('cosmicUser') || 'null'); },
  setSession(u) { localStorage.setItem('cosmicUser', JSON.stringify(u)); },
  clearSession() { localStorage.removeItem('cosmicUser'); },

  register(username, email, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) return { ok: false, msg: 'Email already registered.' };
    if (users.find(u => u.username === username)) return { ok: false, msg: 'Username taken.' };
    const user = { username, email, password, scores: [] };
    users.push(user);
    this.saveUsers(users);
    this.setSession({ username, email });
    return { ok: true };
  },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, msg: 'Invalid email or password.' };
    this.setSession({ username: user.username, email: user.email });
    return { ok: true };
  },

  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  },

  requireLogin(redirectBack) {
    if (!this.getSession()) {
      sessionStorage.setItem('afterLogin', redirectBack || window.location.href);
      // Show modal instead of redirect
      return false;
    }
    return true;
  }
};

// ── STAR FIELD ────────────────────────────────────────────
function initStars() {
  const sf = document.getElementById('star-field');
  if (!sf) return;
  for (let i = 0; i < 140; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const small = Math.random() < 0.7;
    s.style.cssText = `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      width:${small ? 1 : 2}px;
      height:${small ? 1 : 2}px;
      animation-duration:${2+Math.random()*4}s;
      animation-delay:${Math.random()*4}s;
    `;
    sf.appendChild(s);
  }
}

// ── AUTH MODAL ────────────────────────────────────────────
function initAuthModal() {
  const overlay  = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('modal-close');
  const tabs     = document.querySelectorAll('.modal-tab');
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginBtn  = document.getElementById('open-auth');
  const navUser   = document.getElementById('nav-user-info');
  const navLogout = document.getElementById('nav-logout');

  function updateNav() {
    const sess = Auth.getSession();
    if (loginBtn)  loginBtn.style.display  = sess ? 'none' : 'inline-block';
    if (navUser)   navUser.style.display   = sess ? 'inline' : 'none';
    if (navLogout) navLogout.style.display = sess ? 'inline-block' : 'none';
    if (sess && navUser) navUser.textContent = '👤 ' + sess.username;
  }

  updateNav();

  if (loginBtn) loginBtn.addEventListener('click', () => {
    overlay.classList.remove('hidden');
  });

  if (closeBtn) closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  overlay?.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      loginForm.style.display    = target === 'login'    ? 'block' : 'none';
      registerForm.style.display = target === 'register' ? 'block' : 'none';
    });
  });

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const res   = Auth.login(email, pass);
    const err   = document.getElementById('login-error');
    if (res.ok) {
      overlay.classList.add('hidden');
      updateNav();
      const next = sessionStorage.getItem('afterLogin');
      if (next) { sessionStorage.removeItem('afterLogin'); window.location.href = next; }
    } else {
      err.textContent = res.msg;
    }
  });

  registerForm?.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const pass     = document.getElementById('reg-pass').value;
    const pass2    = document.getElementById('reg-pass2').value;
    const err      = document.getElementById('register-error');
    const ok       = document.getElementById('register-ok');
    err.textContent = ''; ok.textContent = '';
    if (pass !== pass2) { err.textContent = 'Passwords do not match.'; return; }
    if (pass.length < 4) { err.textContent = 'Password too short.'; return; }
    const res = Auth.register(username, email, pass);
    if (res.ok) {
      ok.textContent = '✓ Registered! Welcome, ' + username + '!';
      updateNav();
      setTimeout(() => {
        overlay.classList.add('hidden');
        const next = sessionStorage.getItem('afterLogin');
        if (next) { sessionStorage.removeItem('afterLogin'); window.location.href = next; }
      }, 1000);
    } else {
      err.textContent = res.msg;
    }
  });

  if (navLogout) navLogout.addEventListener('click', Auth.logout.bind(Auth));
}

document.addEventListener('DOMContentLoaded', () => {
  initStars();
  initAuthModal();
});
