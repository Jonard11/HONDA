// ============================================================
//  AUTH GUARD + SHARED UTILITIES — Honda Inventory System
// ============================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

let _app, _auth, _db;

export function initFirebase() {
  if (!_app) {
    _app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db   = getFirestore(_app);
  }
  return { app: _app, auth: _auth, db: _db };
}

export async function requireAuth() {
  const { auth, db } = initFirebase();
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = 'index.html'; return; }
      let displayName = user.displayName || user.email.split('@')[0];
      let userData = {};
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) { userData = snap.data(); displayName = userData.displayName || displayName; }
      } catch (_) {}
      const nameEl  = document.getElementById('sidebarUserName');
      const emailEl = document.getElementById('sidebarUserEmail');
      if (nameEl)  nameEl.textContent  = displayName;
      if (emailEl) emailEl.textContent = user.email;
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.style.display = 'none';
      resolve({ user, userData, displayName, email: user.email });
    });
  });
}

export async function logoutUser() {
  const { auth } = initFirebase();
  await signOut(auth);
  window.location.href = 'index.html';
}

export function showToast(title, message = '', type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type]||icons.info} toast-icon"></i>
    <div class="toast-content" style="flex:1;">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4500);
}

export function initSidebar() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.querySelector('.sidebar-overlay');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

export function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
}

export function formatDateTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

export function generateOrderNumber() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `HND-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${String(Date.now()).slice(-5)}`;
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function debounce(fn, delay = 280) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export function stockBadge(stock, threshold = 5) {
  return Number(stock) <= Number(threshold)
    ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Low</span>`
    : `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> OK</span>`;
}
