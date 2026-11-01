/**
 * SalesPulse - Vanilla JS Sales Analytics Dashboard
 * Data persistence powered strictly by WebStorage (localStorage).
 * No backend, No CSS variables.
 */

// Storage Key
const STORAGE_KEY = 'salespulse_analytics_transactions';

// Application State
const state = {
  transactions: [],
  selectedTimeframe: '30', // 'all', '30', '90', 'year'
  chartView: 'revenue', // 'revenue' | 'volume'
  searchQuery: '',
  statusFilter: 'all',
  categoryFilter: 'all',
  currentPage: 1,
  pageSize: 8,
  charts: {
    trend: null,
    category: null,
    region: null
  }
};

// Category Colors for Visual Consistency
const CATEGORY_COLORS = {
  'Software': '#3b82f6',
  'Hardware': '#8b5cf6',
  'Consulting': '#10b981',
  'Electronics': '#f59e0b',
  'Cloud Storage': '#06b6d4'
};

// Relative date helper
function getRelativeDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Generate Realistic Seed Data
function generateDefaultSeedData() {
  const sampleCustomers = [
    'Acme Global Corp', 'NexaLogic Tech', 'CloudFlow Labs', 'Horizon Media Group',
    'Apex Retailers', 'Stellar BioHealth', 'Zenith Capital', 'Quantum Dynamics',
    'Vanguard Logistics', 'BlueWave Systems', 'Summit Dynamics', 'Prism Interactive',
    'Atlas Engineering', 'Hyperion Software', 'Solstice Media', 'Aurora Robotics',
    'Catalyst Energy', 'Orion Data Corp', 'Echo Digital', 'Pinnacle Ventures'
  ];

  const sampleProducts = [
    { name: 'Enterprise Cloud License', category: 'Software', basePrice: 2400 },
    { name: 'API High-Throughput Tier', category: 'Software', basePrice: 1200 },
    { name: 'Dedicated Server Cluster', category: 'Hardware', basePrice: 4800 },
    { name: 'Network Gateway Pro', category: 'Hardware', basePrice: 1850 },
    { name: 'Architecture Review & Audit', category: 'Consulting', basePrice: 3500 },
    { name: 'DevOps Enablement Package', category: 'Consulting', basePrice: 5200 },
    { name: 'Smart IoT Sensor Array', category: 'Electronics', basePrice: 950 },
    { name: 'Edge Gateway Device V2', category: 'Electronics', basePrice: 1400 },
    { name: 'Encrypted Cold Storage 100TB', category: 'Cloud Storage', basePrice: 1100 },
    { name: 'Multi-Region Backup Suite', category: 'Cloud Storage', basePrice: 2200 }
  ];

  const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
  const paymentMethods = ['Credit Card', 'Wire Transfer', 'PayPal', 'Stripe', 'ACH'];
  const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Refunded'];

  const seed = [];
  let orderNumber = 1042;

  // Generate 45 realistic distributed records over the last 120 days
  for (let i = 0; i < 48; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 115);
    const prod = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
    const variance = (Math.random() * 0.4 - 0.2); // +/- 20%
    const amount = parseFloat((prod.basePrice * (1 + variance)).toFixed(2));
    const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    seed.push({
      id: 'ORD-' + (orderNumber++),
      customer: customer,
      product: prod.name,
      category: prod.category,
      amount: amount,
      date: getRelativeDateStr(daysAgo),
      region: region,
      paymentMethod: payment,
      status: status
    });
  }

  // Sort by date descending
  seed.sort((a, b) => new Date(b.date) - new Date(a.date));
  return seed;
}

// LocalStorage Handlers
function loadTransactionsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
  }

  // Fallback to seed data
  const initial = generateDefaultSeedData();
  saveTransactionsToStorage(initial);
  return initial;
}

function saveTransactionsToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
    showToast('Storage quota exceeded or error saving data', 'error');
  }
}

// Currency & Number Formatters
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val || 0);
}

function formatNumber(val) {
  return new Intl.NumberFormat('en-US').format(val || 0);
}

// Timeframe Filter logic
function getFilteredByTimeframe(list, timeframe) {
  if (timeframe === 'all') return list;

  const now = new Date();
  let cutoff = new Date();

  if (timeframe === '30') {
    cutoff.setDate(now.getDate() - 30);
  } else if (timeframe === '90') {
    cutoff.setDate(now.getDate() - 90);
  } else if (timeframe === 'year') {
    cutoff = new Date(now.getFullYear(), 0, 1);
  }

  const cutoffStr = cutoff.toISOString().split('T')[0];
  return list.filter(item => item.date >= cutoffStr);
}

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'success' ? 'success' : 'info'}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// --------------------------------------------------------------------------
// Calculation & UI Update Functions
// --------------------------------------------------------------------------

function updateKPICards(currentList) {
  // Total Revenue: sum of Completed transactions
  const completedList = currentList.filter(t => t.status === 'Completed');
  const totalRev = completedList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalOrdersCount = currentList.length;
  const aov = completedList.length > 0 ? (totalRev / completedList.length) : 0;
  const completionRate = totalOrdersCount > 0 ? ((completedList.length / totalOrdersCount) * 100) : 0;

  // DOM Elements
  const elRev = document.getElementById('totalRevenue');
  const elOrders = document.getElementById('totalOrders');
  const elAOV = document.getElementById('avgOrderValue');
  const elCompRate = document.getElementById('completionRate');
  const elCompBar = document.getElementById('completionBar');
  const elCompSubtext = document.getElementById('completionSubtext');

  if (elRev) elRev.textContent = formatCurrency(totalRev);
  if (elOrders) elOrders.textContent = formatNumber(totalOrdersCount);
  if (elAOV) elAOV.textContent = formatCurrency(aov);
  if (elCompRate) elCompRate.textContent = `${completionRate.toFixed(1)}%`;
  if (elCompBar) elCompBar.style.width = `${Math.min(100, completionRate)}%`;
  if (elCompSubtext) elCompSubtext.textContent = `${completedList.length} of ${totalOrdersCount} completed`;
}

// Render Top Products List
function updateTopProducts(currentList) {
  const container = document.getElementById('topProductsList');
  if (!container) return;

  const productMap = {};
  currentList.forEach(t => {
    if (t.status === 'Refunded') return;
    if (!productMap[t.product]) {
      productMap[t.product] = {
        name: t.product,
        category: t.category,
        revenue: 0,
        count: 0
      };
    }
    productMap[t.product].revenue += Number(t.amount || 0);
    productMap[t.product].count += 1;
  });

  const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748b; font-size: 0.85rem;">No products in this period</div>`;
    return;
  }

  container.innerHTML = sorted.map((p, idx) => `
    <div class="top-product-item">
      <div class="top-product-info">
        <div class="top-product-rank">#${idx + 1}</div>
        <div>
          <div class="top-product-name">${p.name}</div>
          <div class="top-product-meta">${p.category} &bull; ${p.count} ${p.count === 1 ? 'sale' : 'sales'}</div>
        </div>
      </div>
      <div class="top-product-finance">
        <div class="top-product-revenue">${formatCurrency(p.revenue)}</div>
        <div class="top-product-orders">avg. ${formatCurrency(p.revenue / p.count)}</div>
      </div>
    </div>
  `).join('');
}

// Category breakdown summary list
function updateCategoryLegend(dataMap, totalRevenue) {
  const container = document.getElementById('categorySummaryList');
  if (!container) return;

  const entries = Object.entries(dataMap);
  if (entries.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = entries.map(([category, amt]) => {
    const pct = totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(1) : '0.0';
    const color = CATEGORY_COLORS[category] || '#64748b';
    return `
      <div class="category-summary-item">
        <div class="cat-bullet-label">
          <span class="cat-bullet" style="background-color: ${color}"></span>
          <span>${category}</span>
        </div>
        <div class="cat-val-group">
          <span class="cat-amount">${formatCurrency(amt)}</span>
          <span class="cat-pct">${pct}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Chart.js Rendering
// --------------------------------------------------------------------------

function updateTrendChart(currentList) {
  const ctx = document.getElementById('revenueTrendChart');
  if (!ctx) return;

  if (state.charts.trend) {
    state.charts.trend.destroy();
  }

  // Group by date
  const dateMap = {};
  // Sort ascending by date for timeline
  const sorted = [...currentList].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(t => {
    if (!dateMap[t.date]) {
      dateMap[t.date] = { revenue: 0, volume: 0 };
    }
    if (t.status === 'Completed') {
      dateMap[t.date].revenue += Number(t.amount || 0);
    }
    dateMap[t.date].volume += 1;
  });

  const labels = Object.keys(dateMap);
  const isRevenue = state.chartView === 'revenue';
  const dataPoints = labels.map(dateKey => isRevenue ? dateMap[dateKey].revenue : dateMap[dateKey].volume);

  const formattedLabels = labels.map(l => {
    const parts = l.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return l;
  });

  state.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedLabels,
      datasets: [{
        label: isRevenue ? 'Net Revenue ($)' : 'Transactions Count',
        data: dataPoints,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
        pointRadius: labels.length > 20 ? 0 : 3.5,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 10,
          boxPadding: 4,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return isRevenue ? `Revenue: ${formatCurrency(val)}` : `Transactions: ${val}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            maxTicksLimit: 10
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            callback: function(value) {
              if (isRevenue) {
                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                return '$' + value;
              }
              return value;
            }
          }
        }
      }
    }
  });
}

function updateCategoryChart(currentList) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (state.charts.category) {
    state.charts.category.destroy();
  }

  const catMap = {
    'Software': 0,
    'Hardware': 0,
    'Consulting': 0,
    'Electronics': 0,
    'Cloud Storage': 0
  };

  let totalRev = 0;
  currentList.forEach(t => {
    if (t.status === 'Refunded') return;
    const cat = t.category || 'Software';
    const amt = Number(t.amount || 0);
    catMap[cat] = (catMap[cat] || 0) + amt;
    totalRev += amt;
  });

  const labels = Object.keys(catMap);
  const data = Object.values(catMap);
  const bgColors = labels.map(c => CATEGORY_COLORS[c] || '#94a3b8');

  state.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              const pct = totalRev > 0 ? ((val / totalRev) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  updateCategoryLegend(catMap, totalRev);
}

function updateRegionChart(currentList) {
  const ctx = document.getElementById('regionChart');
  if (!ctx) return;

  if (state.charts.region) {
    state.charts.region.destroy();
  }

  const regionMap = {
    'North America': 0,
    'Europe': 0,
    'Asia Pacific': 0,
    'Latin America': 0,
    'Middle East': 0
  };

  currentList.forEach(t => {
    if (t.status === 'Refunded') return;
    const r = t.region || 'North America';
    regionMap[r] = (regionMap[r] || 0) + Number(t.amount || 0);
  });

  const labels = Object.keys(regionMap);
  const data = Object.values(regionMap);

  state.charts.region = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue by Region ($)',
        data: data,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        hoverBackgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          callbacks: {
            label: function(context) {
              return ` Revenue: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            callback: function(value) {
              return '$' + (value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value);
            }
          }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// Transactions Table & Filter Rendering
// --------------------------------------------------------------------------

function getTableFilteredTransactions() {
  // Start with timeframe filtered data
  const timeframeData = getFilteredByTimeframe(state.transactions, state.selectedTimeframe);

  return timeframeData.filter(item => {
    // Search query check
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchCust = item.customer.toLowerCase().includes(q);
      const matchProd = item.product.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      if (!matchCust && !matchProd && !matchId) return false;
    }

    // Status filter
    if (state.statusFilter !== 'all' && item.status !== state.statusFilter) {
      return false;
    }

    // Category filter
    if (state.categoryFilter !== 'all' && item.category !== state.categoryFilter) {
      return false;
    }

    return true;
  });
}

function renderTable() {
  const tbody = document.getElementById('transactionsTbody');
  const emptyState = document.getElementById('emptyState');
  const countBadge = document.getElementById('transactionCountBadge');
  const paginationInfo = document.getElementById('tablePaginationInfo');
  const paginationControls = document.getElementById('paginationControls');

  if (!tbody) return;

  const filtered = getTableFilteredTransactions();
  const totalCount = filtered.length;

  if (countBadge) {
    countBadge.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (paginationInfo) paginationInfo.textContent = 'Showing 0 of 0 entries';
    if (paginationControls) paginationControls.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / state.pageSize) || 1;
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + state.pageSize);

  tbody.innerHTML = pageItems.map(item => {
    let statusClass = 'status-completed';
    if (item.status === 'Pending') statusClass = 'status-pending';
    if (item.status === 'Refunded') statusClass = 'status-refunded';

    return `
      <tr>
        <td class="order-id-cell">${item.id}</td>
        <td class="customer-cell">${item.customer}</td>
        <td>${item.date}</td>
        <td>${item.product}</td>
        <td><span style="font-weight: 600; color: #475569;">${item.category}</span></td>
        <td class="amount-cell">${formatCurrency(item.amount)}</td>
        <td>${item.paymentMethod}</td>
        <td><span class="badge-status ${statusClass}">${item.status}</span></td>
        <td class="text-right">
          <button class="btn-edit-outline" onclick="openEditModal('${item.id}')">Edit</button>
          <button class="btn-danger-outline" onclick="deleteTransaction('${item.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  // Info label
  if (paginationInfo) {
    const endDisplay = Math.min(startIndex + state.pageSize, totalCount);
    paginationInfo.textContent = `Showing ${startIndex + 1} to ${endDisplay} of ${totalCount} entries`;
  }

  // Pagination Buttons
  if (paginationControls) {
    let buttonsHtml = `
      <button class="page-btn" ${state.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${state.currentPage - 1})">
        &laquo; Prev
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7) {
        // Only show boundary pages to prevent overflow
        if (p !== 1 && p !== totalPages && Math.abs(p - state.currentPage) > 1) {
          if (p === 2 || p === totalPages - 1) {
            buttonsHtml += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
          }
          continue;
        }
      }
      buttonsHtml += `
        <button class="page-btn ${p === state.currentPage ? 'active' : ''}" onclick="changePage(${p})">
          ${p}
        </button>
      `;
    }

    buttonsHtml += `
      <button class="page-btn" ${state.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${state.currentPage + 1})">
        Next &raquo;
      </button>
    `;

    paginationControls.innerHTML = buttonsHtml;
  }
}

// Global hook for page changes
window.changePage = function(newPage) {
  state.currentPage = newPage;
  renderTable();
};

// --------------------------------------------------------------------------
// Full Dashboard Refresh
// --------------------------------------------------------------------------

function refreshDashboard() {
  const currentList = getFilteredByTimeframe(state.transactions, state.selectedTimeframe);

  updateKPICards(currentList);
  updateTrendChart(currentList);
  updateCategoryChart(currentList);
  updateRegionChart(currentList);
  updateTopProducts(currentList);
  renderTable();
}

// --------------------------------------------------------------------------
// Modal & CRUD Operations
// --------------------------------------------------------------------------

const modal = document.getElementById('transactionModal');
const transactionForm = document.getElementById('transactionForm');
const modalTitle = document.getElementById('modalTitle');
const formEditId = document.getElementById('formEditId');

function openNewModal() {
  modalTitle.textContent = 'Record New Sale';
  formEditId.value = '';
  transactionForm.reset();
  document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
  modal.style.display = 'flex';
}

window.openEditModal = function(id) {
  const item = state.transactions.find(t => t.id === id);
  if (!item) return;

  modalTitle.textContent = `Edit Sale (${item.id})`;
  formEditId.value = item.id;
  document.getElementById('formCustomer').value = item.customer;
  document.getElementById('formDate').value = item.date;
  document.getElementById('formProduct').value = item.product;
  document.getElementById('formCategory').value = item.category;
  document.getElementById('formAmount').value = item.amount;
  document.getElementById('formRegion').value = item.region;
  document.getElementById('formPayment').value = item.paymentMethod;
  document.getElementById('formStatus').value = item.status;

  modal.style.display = 'flex';
};

function closeModal() {
  modal.style.display = 'none';
  transactionForm.reset();
}

window.deleteTransaction = function(id) {
  if (!confirm(`Are you sure you want to remove sale #${id}?`)) return;

  state.transactions = state.transactions.filter(t => t.id !== id);
  saveTransactionsToStorage(state.transactions);
  refreshDashboard();
  showToast(`Transaction ${id} deleted`, 'info');
};

function handleFormSubmit(e) {
  e.preventDefault();

  const id = formEditId.value;
  const customer = document.getElementById('formCustomer').value.trim();
  const date = document.getElementById('formDate').value;
  const product = document.getElementById('formProduct').value.trim();
  const category = document.getElementById('formCategory').value;
  const amount = parseFloat(document.getElementById('formAmount').value);
  const region = document.getElementById('formRegion').value;
  const paymentMethod = document.getElementById('formPayment').value;
  const status = document.getElementById('formStatus').value;

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (id) {
    // Update existing
    const index = state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      state.transactions[index] = {
        ...state.transactions[index],
        customer,
        date,
        product,
        category,
        amount,
        region,
        paymentMethod,
        status
      };
      showToast(`Sale #${id} updated successfully!`, 'success');
    }
  } else {
    // Generate new ID
    const newId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newRecord = {
      id: newId,
      customer,
      date,
      product,
      category,
      amount,
      region,
      paymentMethod,
      status
    };
    state.transactions.unshift(newRecord);
    showToast(`New sale #${newId} recorded!`, 'success');
  }

  saveTransactionsToStorage(state.transactions);
  closeModal();
  refreshDashboard();
}

// --------------------------------------------------------------------------
// CSV Export
// --------------------------------------------------------------------------

function exportToCsv() {
  const data = getTableFilteredTransactions();
  if (data.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const headers = ['Order ID', 'Customer', 'Date', 'Product', 'Category', 'Amount', 'Payment Method', 'Region', 'Status'];
  const rows = data.map(item => [
    `"${item.id}"`,
    `"${item.customer.replace(/"/g, '""')}"`,
    `"${item.date}"`,
    `"${item.product.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    item.amount,
    `"${item.paymentMethod}"`,
    `"${item.region}"`,
    `"${item.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `sales_analytics_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Transactions exported to CSV', 'success');
}

// --------------------------------------------------------------------------
// Initialization & Event Listeners
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load initial data
  state.transactions = loadTransactionsFromStorage();

  // 2. Setup Timeframe Selector
  const timeframeFilter = document.getElementById('timeframeFilter');
  if (timeframeFilter) {
    timeframeFilter.value = state.selectedTimeframe;
    timeframeFilter.addEventListener('change', (e) => {
      state.selectedTimeframe = e.target.value;
      state.currentPage = 1;
      refreshDashboard();
    });
  }

  // 3. Setup Trend Chart View Pills (Revenue vs Volume)
  const pillBtns = document.querySelectorAll('[data-chart-view]');
  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartView = btn.getAttribute('data-chart-view');
      const currentList = getFilteredByTimeframe(state.transactions, state.selectedTimeframe);
      updateTrendChart(currentList);
    });
  });

  // 4. Setup Table Filter Listeners
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        renderTable();
      }, 200);
    });
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      renderTable();
    });
  }

  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      state.currentPage = 1;
      renderTable();
    });
  }

  // 5. Setup Action Buttons
  const openModalBtn = document.getElementById('openModalBtn');
  if (openModalBtn) openModalBtn.addEventListener('click', openNewModal);

  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  const cancelModalBtn = document.getElementById('cancelModalBtn');
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  // Close modal when clicking on backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Form submit
  if (transactionForm) {
    transactionForm.addEventListener('submit', handleFormSubmit);
  }

  // Export CSV
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCsv);

  // Reset Demo Data
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      if (confirm('Reset sales data back to original demo values? All custom edits will be replaced.')) {
        localStorage.removeItem(STORAGE_KEY);
        state.transactions = loadTransactionsFromStorage();
        state.currentPage = 1;
        refreshDashboard();
        showToast('Demo data reloaded successfully', 'success');
      }
    });
  }

  // 6. Initial Render
  refreshDashboard();
});

