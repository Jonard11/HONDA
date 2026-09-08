// ============================================================
//  LOGS.JS — Activity Logs Page Logic
//  Honda Inventory System
//
//  Handles:
//  - Loading inventory_logs from Firestore
//  - Loading sales from Firestore
//  - Rendering inventory movement log table
//  - Rendering sales transaction log table
//  - Rendering combined "All Logs" table
//  - Search, type filter, and date filter for all tabs
//  - Sale detail modal
//  - CSV export
//  - Summary chips (stock-in count, stock-out, adjustments, sales)
// ============================================================

import { initFirebase } from "./auth-guard.js";
import { formatCurrency, formatDateTime, escapeHtml, debounce, logTypeBadge } from "./app.js";
import {
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { db } = initFirebase();

// ---- Module state ----
export let invLogs   = [];
export let salesLogs = [];

// ============================================================
//  LOAD DATA
// ============================================================

export async function loadInventoryLogs() {
  const snap = await getDocs(query(
    collection(db, 'inventory_logs'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ));
  invLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  updateSummaryChips();
  renderInventoryLog(invLogs);
}

export async function loadSalesLogs() {
  const snap = await getDocs(query(
    collection(db, 'sales'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ));
  salesLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  updateSummaryChips();
  renderSalesLog(salesLogs);
}

// ============================================================
//  SUMMARY CHIPS
// ============================================================

export function updateSummaryChips() {
  const chipIn    = document.getElementById('chipIn');
  const chipOut   = document.getElementById('chipOut');
  const chipAdj   = document.getElementById('chipAdj');
  const chipSales = document.getElementById('chipSales');
  if (chipIn)    chipIn.textContent    = invLogs.filter(l => l.type === 'stock_in').length;
  if (chipOut)   chipOut.textContent   = invLogs.filter(l => l.type === 'stock_out').length;
  if (chipAdj)   chipAdj.textContent   = invLogs.filter(l => l.type === 'adjustment').length;
  if (chipSales) chipSales.textContent = salesLogs.length;
}

// ============================================================
//  RENDER: INVENTORY MOVEMENT LOG
// ============================================================

export function renderInventoryLog(logs) {
  const countEl = document.getElementById('invLogCount');
  const tbody   = document.getElementById('invLogBody');
  if (countEl) countEl.textContent = `${logs.length} entries`;
  if (!tbody) return;

  if (!logs.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="ei">📋</div>
        <h3>No inventory movements yet</h3>
        <p>Stock In / Out actions will appear here.</p>
      </div></td></tr>`;
    return;
  }

  const typeMap = {
    stock_in:   { badge: 'badge-success', icon: 'fa-arrow-down',  label: 'In'  },
    stock_out:  { badge: 'badge-danger',  icon: 'fa-arrow-up',    label: 'Out' },
    adjustment: { badge: 'badge-info',    icon: 'fa-sliders',     label: 'Adj' },
  };

  tbody.innerHTML = logs.map(l => {
    const t      = typeMap[l.type] || { badge: 'badge-dark', icon: 'fa-circle', label: l.type };
    const isIn   = l.type === 'stock_in';
    const sign   = isIn ? '+' : l.type === 'stock_out' ? '-' : '±';
    const color  = isIn ? 'var(--success)' : l.type === 'stock_out' ? 'var(--danger)' : 'var(--info)';
    return `<tr>
      <td><span class="badge ${t.badge}"><i class="fa-solid ${t.icon}"></i> ${t.label}</span></td>
      <td class="td-name" style="font-size:.875rem;">${escapeHtml(l.itemName) || '—'}</td>
      <td><span class="badge ${l.itemType === 'vehicle' ? 'badge-red' : 'badge-dark'}" style="font-size:.65rem;">${escapeHtml(l.itemType) || '—'}</span></td>
      <td class="fw-700" style="color:${color};">${sign}${l.quantity ?? 0}</td>
      <td>${l.previousStock ?? '—'}</td>
      <td>${l.newStock ?? '—'}</td>
      <td style="font-size:.78rem;color:var(--gray-400);">${escapeHtml(l.notes) || '—'}</td>
      <td style="font-size:.78rem;color:var(--gray-400);">${formatDateTime(l.createdAt)}</td>
    </tr>`;
  }).join('');
}

// ============================================================
//  RENDER: SALES LOG TABLE
// ============================================================

export function renderSalesLog(sales) {
  const countEl = document.getElementById('salesLogCount');
  const tbody   = document.getElementById('salesLogBody');
  if (countEl) countEl.textContent = `${sales.length} entries`;
  if (!tbody) return;

  if (!sales.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="ei">🛒</div>
        <h3>No sales transactions yet</h3>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = sales.map(s => `<tr>
    <td class="td-name" style="font-size:.8rem;">${escapeHtml(s.orderNumber) || s.id.slice(-8).toUpperCase()}</td>
    <td style="font-size:.8rem;">${escapeHtml(s.customerName) || '—'}</td>
    <td style="font-size:.78rem;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
      ${(s.items || []).map(i => `${escapeHtml(i.itemName)} ×${i.quantity}`).join(', ') || '—'}
    </td>
    <td class="fw-700">${s.totalQuantity ?? 0}</td>
    <td class="fw-700 text-red">${formatCurrency(s.totalAmount)}</td>
    <td style="font-size:.78rem;color:var(--gray-400);">${formatDateTime(s.createdAt)}</td>
    <td>
      <button class="btn btn-outline btn-icon" onclick="window._viewSaleDetail('${s.id}')" title="View Details">
        <i class="fa-solid fa-eye"></i>
      </button>
    </td>
  </tr>`).join('');
}

// ============================================================
//  RENDER: ALL LOGS (COMBINED)
// ============================================================

export function renderAllLogs(filtered = null) {
  const combined = [
    ...invLogs.map(l  => ({ ...l, _src: 'inv'  })),
    ...salesLogs.map(l => ({ ...l, _src: 'sale', type: 'sale' }))
  ].sort((a, b) => {
    const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return tb - ta;
  });

  const data    = filtered || combined;
  const countEl = document.getElementById('allLogCount');
  const tbody   = document.getElementById('allLogBody');
  if (countEl) countEl.textContent = `${data.length} entries`;
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><div class="ei">📄</div><h3>No logs found</h3></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(l => {
    if (l._src === 'sale') {
      return `<tr>
        <td>${logTypeBadge('sale')}</td>
        <td class="td-name" style="font-size:.875rem;">${escapeHtml(l.orderNumber) || l.id.slice(-8).toUpperCase()}</td>
        <td class="fw-700 text-red">${formatCurrency(l.totalAmount)}</td>
        <td style="color:var(--gray-400);">qty: ${l.totalQuantity ?? 0}</td>
        <td style="font-size:.78rem;color:var(--gray-400);">${escapeHtml(l.notes) || '—'}</td>
        <td style="font-size:.78rem;color:var(--gray-400);">${formatDateTime(l.createdAt)}</td>
      </tr>`;
    }
    const isIn  = l.type === 'stock_in';
    const sign  = isIn ? '+' : l.type === 'stock_out' ? '-' : '±';
    const color = isIn ? 'var(--success)' : l.type === 'stock_out' ? 'var(--danger)' : 'var(--info)';
    return `<tr>
      <td>${logTypeBadge(l.type)}</td>
      <td class="td-name" style="font-size:.875rem;">${escapeHtml(l.itemName) || '—'}</td>
      <td class="fw-700" style="color:${color};">${sign}${l.quantity ?? 0}</td>
      <td style="color:var(--gray-400);">${l.previousStock ?? '—'} → ${l.newStock ?? '—'}</td>
      <td style="font-size:.78rem;color:var(--gray-400);">${escapeHtml(l.notes) || '—'}</td>
      <td style="font-size:.78rem;color:var(--gray-400);">${formatDateTime(l.createdAt)}</td>
    </tr>`;
  }).join('');
}

// ============================================================
//  SALE DETAIL MODAL
// ============================================================

export function openSaleDetailModal(id) {
  const s = salesLogs.find(x => x.id === id);
  if (!s) return;

  const body = document.getElementById('saleDetailBody');
  if (!body) return;

  body.innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:var(--gray-400);font-size:.875rem;">Order #</span>
        <span class="fw-800">${escapeHtml(s.orderNumber) || s.id.slice(-8).toUpperCase()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:var(--gray-400);font-size:.875rem;">Customer</span>
        <span class="fw-700">${escapeHtml(s.customerName) || '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:var(--gray-400);font-size:.875rem;">Date &amp; Time</span>
        <span>${formatDateTime(s.createdAt)}</span>
      </div>
      ${s.notes ? `<div style="display:flex;justify-content:space-between;">
        <span style="color:var(--gray-400);font-size:.875rem;">Notes</span>
        <span>${escapeHtml(s.notes)}</span>
      </div>` : ''}
    </div>
    <div class="divider"></div>
    <table style="width:100%;margin-bottom:14px;">
      <thead><tr>
        <th style="padding:7px;text-align:left;font-size:.7rem;color:var(--gray-400);">Item</th>
        <th style="padding:7px;text-align:left;font-size:.7rem;color:var(--gray-400);">Type</th>
        <th style="padding:7px;text-align:center;font-size:.7rem;color:var(--gray-400);">Qty</th>
        <th style="padding:7px;text-align:right;font-size:.7rem;color:var(--gray-400);">Price</th>
        <th style="padding:7px;text-align:right;font-size:.7rem;color:var(--gray-400);">Subtotal</th>
      </tr></thead>
      <tbody>
        ${(s.items || []).map(i => `<tr>
          <td style="padding:7px;font-size:.875rem;">${escapeHtml(i.itemName)}</td>
          <td style="padding:7px;">
            <span class="badge ${i.itemType === 'vehicle' ? 'badge-red' : 'badge-dark'}" style="font-size:.65rem;">${i.itemType || '—'}</span>
          </td>
          <td style="padding:7px;text-align:center;">${i.quantity}</td>
          <td style="padding:7px;text-align:right;font-size:.875rem;">${formatCurrency(i.price)}</td>
          <td style="padding:7px;text-align:right;font-weight:700;">${formatCurrency(i.subtotal)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;">
      <span class="fw-800" style="font-size:1rem;">TOTAL</span>
      <span style="font-size:1.375rem;font-weight:900;color:var(--honda-red);">${formatCurrency(s.totalAmount)}</span>
    </div>`;

  document.getElementById('saleDetailModal').classList.add('open');
}

// ============================================================
//  FILTER HELPERS
// ============================================================

export function filterByDate(list, dateStr) {
  if (!dateStr) return list;
  return list.filter(l => {
    const d = l.createdAt?.toDate?.() || new Date(l.createdAt || 0);
    return d.toISOString().slice(0, 10) === dateStr;
  });
}

export function filterByText(list, searchStr, fields = []) {
  if (!searchStr) return list;
  const q = searchStr.toLowerCase();
  return list.filter(l => fields.some(f => (l[f] || '').toLowerCase().includes(q)));
}

// ============================================================
//  CSV EXPORT
// ============================================================

export function exportCSV() {
  const rows = [['Type', 'Item / Order', 'Item Type', 'Qty / Amount', 'Before Stock', 'After Stock', 'Notes', 'Date']];

  invLogs.forEach(l => {
    rows.push([
      l.type,
      l.itemName || '',
      l.itemType || '',
      l.quantity || '',
      l.previousStock ?? '',
      l.newStock ?? '',
      l.notes || '',
      formatDateTime(l.createdAt)
    ]);
  });

  salesLogs.forEach(s => {
    rows.push([
      'sale',
      s.orderNumber || s.id,
      '',
      formatCurrency(s.totalAmount),
      '',
      '',
      s.notes || '',
      formatDateTime(s.createdAt)
    ]);
  });

  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `honda-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
