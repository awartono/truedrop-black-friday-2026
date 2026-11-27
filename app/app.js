import { CATALOG_META, DEALS } from './deals-data.js';
import { filterDeals, getUniqueValues, sortDeals, summarizeCatalog } from './filters.js';
import { renderCategoryPills, renderDealGrid, renderDealModal, renderStats } from './render.js';

const DEFAULT_STATE = {
  query: '',
  category: 'All',
  store: 'All',
  verdict: 'All',
  minDiscount: 0,
  comparedOnly: false,
  sortBy: 'score-desc',
};

const state = { ...DEFAULT_STATE };

const els = {
  stats: document.getElementById('stats-bar'),
  categories: document.getElementById('category-pills'),
  grid: document.getElementById('deal-grid'),
  search: document.getElementById('search-input'),
  store: document.getElementById('store-select'),
  verdict: document.getElementById('verdict-select'),
  discount: document.getElementById('discount-select'),
  sort: document.getElementById('sort-select'),
  comparedToggle: document.getElementById('compared-toggle'),
  resetBtn: document.getElementById('reset-btn'),
  activeSummary: document.getElementById('active-filter-summary'),
  modal: document.getElementById('deal-modal'),
  modalBody: document.getElementById('modal-body'),
};

function populateSelectOptions() {
  const stores = getUniqueValues(DEALS, 'store');
  stores.forEach((store) => {
    const opt = document.createElement('option');
    opt.value = store;
    opt.textContent = store;
    els.store.appendChild(opt);
  });
}

function getCategoryCounts() {
  const counts = {};
  for (const deal of DEALS) {
    counts[deal.category] = (counts[deal.category] ?? 0) + 1;
  }
  return counts;
}

function updateActiveSummary(shownCount) {
  const parts = [];
  if (state.query.trim()) parts.push(`search "${state.query.trim()}"`);
  if (state.category !== 'All') parts.push(state.category);
  if (state.store !== 'All') parts.push(state.store);
  if (state.verdict !== 'All') parts.push(state.verdict.replaceAll('-', ' '));
  if (state.minDiscount > 0) parts.push(`${state.minDiscount}%+ off`);
  if (state.comparedOnly) parts.push('cross-store compared');
  els.activeSummary.textContent = parts.length
    ? `Showing ${shownCount} deals for: ${parts.join(' · ')}`
    : `Showing all ${shownCount} verified Black Friday & Cyber Monday 2026 deals`;
}

function renderAll() {
  const filtered = filterDeals(DEALS, state);
  const sorted = sortDeals(filtered, state.sortBy);
  const stats = summarizeCatalog(DEALS, sorted);
  const categories = getUniqueValues(DEALS, 'category');

  renderStats(els.stats, stats, CATALOG_META);
  renderCategoryPills(els.categories, categories, state.category, getCategoryCounts());
  renderDealGrid(els.grid, sorted);
  updateActiveSummary(sorted.length);
}

function resetFilters() {
  Object.assign(state, DEFAULT_STATE);
  els.search.value = '';
  els.store.value = 'All';
  els.verdict.value = 'All';
  els.discount.value = '0';
  els.sort.value = 'score-desc';
  els.comparedToggle.checked = false;
  renderAll();
}

function openDealById(dealId) {
  const deal = DEALS.find((d) => d.id === dealId);
  if (!deal) return;
  renderDealModal(els.modalBody, deal);
  if (!els.modal.open) els.modal.showModal();
  history.replaceState(null, '', `#deal=${encodeURIComponent(deal.id)}`);
}

function closeDealModal() {
  if (els.modal.open) els.modal.close();
  if (location.hash.startsWith('#deal=')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function bindEvents() {
  els.search.addEventListener('input', (e) => {
    state.query = e.target.value;
    renderAll();
  });
  els.store.addEventListener('change', (e) => {
    state.store = e.target.value;
    renderAll();
  });
  els.verdict.addEventListener('change', (e) => {
    state.verdict = e.target.value;
    renderAll();
  });
  els.discount.addEventListener('change', (e) => {
    state.minDiscount = Number(e.target.value) || 0;
    renderAll();
  });
  els.sort.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderAll();
  });
  els.comparedToggle.addEventListener('change', (e) => {
    state.comparedOnly = e.target.checked;
    renderAll();
  });
  els.resetBtn.addEventListener('click', resetFilters);

  els.categories.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-category]');
    if (!btn) return;
    state.category = btn.dataset.category;
    renderAll();
  });

  els.grid.addEventListener('click', (e) => {
    const reset = e.target.closest('[data-action="reset-filters"]');
    if (reset) {
      resetFilters();
      return;
    }
    const openBtn = e.target.closest('[data-open-deal]');
    if (openBtn) {
      openDealById(openBtn.dataset.openDeal);
    }
  });

  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal || e.target.closest('[data-close-modal]')) {
      closeDealModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== els.search && !els.modal.open) {
      e.preventDefault();
      els.search.focus();
    } else if (e.key === 'Escape' && els.modal.open) {
      closeDealModal();
    }
  });
}

function syncFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.has('q')) {
    state.query = params.get('q') ?? '';
    els.search.value = state.query;
  }
  if (params.has('category')) {
    state.category = params.get('category') || 'All';
  }
  if (params.has('store')) {
    state.store = params.get('store') || 'All';
    els.store.value = state.store;
  }
  if (params.has('verdict')) {
    state.verdict = params.get('verdict') || 'All';
    els.verdict.value = state.verdict;
  }
  if (params.has('minDiscount')) {
    state.minDiscount = Number(params.get('minDiscount')) || 0;
    els.discount.value = String(state.minDiscount);
  }
  if (params.get('compared') === '1') {
    state.comparedOnly = true;
    els.comparedToggle.checked = true;
  }
  renderAll();
  const hash = location.hash;
  if (hash.startsWith('#deal=')) {
    openDealById(decodeURIComponent(hash.slice(6)));
  }
}

populateSelectOptions();
bindEvents();
syncFromUrl();
