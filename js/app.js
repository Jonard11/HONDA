// ============================================================
//  APP.JS — Global Utilities & Shared App Logic
//  Honda Inventory System
// ============================================================

// ---- Format Currency (₱) ----
export function formatCurrency(amount) {
  return '₱' + Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ---- Format Date ----
export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Format Date + Time ----
export function formatDateTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ---- Generate Honda Order Number ----
export function generateOrderNumber() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `HND-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(Date.now()).slice(-5)}`;
}

// ---- Toast Notification ----
export function showToast(title, message = '', type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content" style="flex:1;">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4500);
}

// ---- Mobile Sidebar Toggle ----
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

// ---- Escape HTML (prevent XSS) ----
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---- Debounce ----
export function debounce(fn, delay = 280) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ---- Truncate text ----
export function truncate(str, max = 40) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ---- Stock Status Badge ----
export function stockBadge(stock, threshold = 5) {
  return Number(stock) <= Number(threshold)
    ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Low</span>`
    : `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> OK</span>`;
}

// ---- Inventory Log Type Badge ----
export function logTypeBadge(type) {
  const map = {
    stock_in:   `<span class="badge badge-success"><i class="fa-solid fa-arrow-down"></i> Stock In</span>`,
    stock_out:  `<span class="badge badge-danger"><i class="fa-solid fa-arrow-up"></i> Stock Out</span>`,
    adjustment: `<span class="badge badge-info"><i class="fa-solid fa-sliders"></i> Adjustment</span>`,
    sale:       `<span class="badge badge-red"><i class="fa-solid fa-cash-register"></i> Sale</span>`,
  };
  return map[type] || `<span class="badge badge-dark">${escapeHtml(type)}</span>`;
}

// ---- Set Button Loading State ----
export function setButtonLoading(btn, loading = true) {
  if (loading) {
    btn._orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:15px;height:15px;border-width:2px;"></span> Loading...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._orig || 'Save';
  }
}

// ---- Get Today's Date Range ----
export function getTodayRange() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ---- Confirm Dialog (promise-based) ----
export function confirmDialog(message) {
  return new Promise(resolve => {
    const existing = document.getElementById('_hondaConfirm');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = '_hondaConfirm';
    el.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(3px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;`;
    el.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:26px 22px;max-width:360px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.2);border-top:4px solid #CC0000;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <i class="fa-solid fa-circle-question" style="font-size:20px;color:#E65100;"></i>
          <span style="font-size:.9375rem;font-weight:800;color:#212121;">Confirm Action</span>
        </div>
        <p style="color:#424242;font-size:.875rem;margin-bottom:20px;">${message}</p>
        <div style="display:flex;gap:9px;justify-content:flex-end;">
          <button id="_hondaNo"  style="padding:9px 18px;border:2px solid #e0e0e0;border-radius:8px;background:#f0f0f0;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;color:#424242;">Cancel</button>
          <button id="_hondaYes" style="padding:9px 18px;border:none;border-radius:8px;background:#CC0000;color:#fff;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#_hondaYes').addEventListener('click', () => { el.remove(); resolve(true);  });
    el.querySelector('#_hondaNo').addEventListener('click',  () => { el.remove(); resolve(false); });
  });
}
