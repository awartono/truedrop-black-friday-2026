import {
  computeDealScore,
  computeDiscountPct,
  computeSavings,
  computeStreetDiscountPct,
  formatMoney,
  getStoreSpread,
  VERDICT_META,
} from './verdict.js';

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderStats(container, stats, meta) {
  container.innerHTML = `
    <div class="stat-pill">
      <span class="stat-label">Showing</span>
      <strong class="stat-value">${stats.shown} / ${stats.total} deals</strong>
    </div>
    <div class="stat-pill stat-pill--low">
      <span class="stat-label">All-Time Lows</span>
      <strong class="stat-value">${stats.allTimeLows}</strong>
    </div>
    <div class="stat-pill">
      <span class="stat-label">Avg Discount</span>
      <strong class="stat-value">${stats.avgDiscount}% off</strong>
    </div>
    <div class="stat-pill">
      <span class="stat-label">Cross-Store Compared</span>
      <strong class="stat-value">${stats.crossStoreCount}</strong>
    </div>
    <div class="stat-pill stat-pill--audit">
      <span class="stat-label">Last Audited</span>
      <strong class="stat-value">${escapeHtml(meta.lastAuditUtc)}</strong>
    </div>
  `;
}

export function renderCategoryPills(container, categories, activeCategory, countsByCategory) {
  const allCount = Object.values(countsByCategory).reduce((a, b) => a + b, 0);
  const pills = ['All', ...categories];
  container.innerHTML = pills
    .map((cat) => {
      const count = cat === 'All' ? allCount : (countsByCategory[cat] ?? 0);
      const active = cat === activeCategory ? ' pill--active' : '';
      const pressed = cat === activeCategory ? 'true' : 'false';
      return `<button type="button" class="pill${active}" aria-pressed="${pressed}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="pill-count">${count}</span></button>`;
    })
    .join('');
}

function renderCompareStrip(deal) {
  const spread = getStoreSpread(deal);
  if (!spread) return '';
  const items = deal.compareStores
    .map((entry) => {
      const isBest = entry.price === spread.best.price;
      return `<a class="compare-chip${isBest ? ' compare-chip--best' : ''}" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.store)} <strong>${formatMoney(entry.price)}</strong></a>`;
    })
    .join('');
  const note = spread.diff > 0
    ? `Save ${formatMoney(spread.diff)} at ${escapeHtml(spread.best.store)}`
    : `Price-matched across ${spread.count} stores`;
  return `
    <div class="compare-strip">
      <div class="compare-header">
        <span class="compare-title">Store Compare</span>
        <span class="compare-note">${note}</span>
      </div>
      <div class="compare-chips">${items}</div>
    </div>
  `;
}

export function renderDealGrid(container, deals) {
  if (!deals.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No deals match your filters</h3>
        <p>Try lowering the minimum discount, clearing the search term, or resetting filters.</p>
        <button type="button" class="btn btn--primary" data-action="reset-filters">Reset all filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = deals
    .map((deal) => {
      const pct = computeDiscountPct(deal.salePrice, deal.usualPrice);
      const savings = computeSavings(deal.salePrice, deal.usualPrice);
      const score = computeDealScore(deal);
      const meta = VERDICT_META[deal.verdict] ?? VERDICT_META['routine-sale'];
      return `
        <article class="deal-card" data-deal-id="${escapeHtml(deal.id)}">
          <div class="card-top">
            <span class="verdict-badge verdict-badge--${meta.tone}">${escapeHtml(meta.label)}</span>
            <div class="card-badges-right">
              <span class="score-badge" title="TrueDrop Shopper Score">${score}/100</span>
              <span class="discount-badge">-${pct}%</span>
            </div>
          </div>

          <div class="card-meta">
            <span class="meta-cat">${escapeHtml(deal.category)}</span>
            <span class="meta-dot">·</span>
            <span class="meta-store">${escapeHtml(deal.store)}</span>
          </div>

          <h2 class="card-title">${escapeHtml(deal.product)}</h2>

          <div class="price-row">
            <span class="sale-price">${formatMoney(deal.salePrice)}</span>
            <span class="usual-price">${formatMoney(deal.usualPrice)}</span>
            <span class="savings-pill">Save ${formatMoney(savings)}</span>
          </div>

          <p class="verdict-note">${escapeHtml(deal.verdictNote)}</p>

          ${renderCompareStrip(deal)}

          <div class="card-condition">${escapeHtml(deal.condition)}</div>

          <div class="card-footer">
            <div class="audit-info">
              <span>Checked ${escapeHtml(deal.checkedAt)}</span>
              <span>Source: <a href="${escapeHtml(deal.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(deal.sourceName)}</a></span>
            </div>
            <div class="card-actions">
              <button type="button" class="btn btn--ghost" data-open-deal="${escapeHtml(deal.id)}">Audit</button>
              <a class="btn btn--primary" href="${escapeHtml(deal.storeUrl)}" target="_blank" rel="noopener noreferrer">Shop ${escapeHtml(deal.store)} ↗</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

export function renderDealModal(dialogBody, deal) {
  const pct = computeDiscountPct(deal.salePrice, deal.usualPrice);
  const streetPct = computeStreetDiscountPct(deal.salePrice, deal.streetPrice);
  const savings = computeSavings(deal.salePrice, deal.usualPrice);
  const score = computeDealScore(deal);
  const meta = VERDICT_META[deal.verdict] ?? VERDICT_META['routine-sale'];
  const rows = (deal.compareStores || [])
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.store)}</td>
        <td class="num">${formatMoney(s.price)}</td>
        <td class="num"><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">Open store ↗</a></td>
      </tr>
    `,
    )
    .join('');

  dialogBody.innerHTML = `
    <div class="modal-badges">
      <span class="verdict-badge verdict-badge--${meta.tone}">${escapeHtml(meta.label)}</span>
      <span class="score-badge">Score ${score}/100</span>
      <span class="discount-badge">-${pct}% vs MSRP</span>
    </div>
    <h2 class="modal-title">${escapeHtml(deal.product)}</h2>
    <p class="modal-subtitle">${escapeHtml(deal.brand)} · ${escapeHtml(deal.category)} · Best at <strong>${escapeHtml(deal.store)}</strong></p>

    <div class="modal-price-grid">
      <div class="price-box">
        <span>Sale Price</span>
        <strong>${formatMoney(deal.salePrice)}</strong>
      </div>
      <div class="price-box">
        <span>Usual / MSRP</span>
        <strong>${formatMoney(deal.usualPrice)}</strong>
      </div>
      <div class="price-box">
        <span>Typical Street</span>
        <strong>${formatMoney(deal.streetPrice)} (${streetPct}% below)</strong>
      </div>
      <div class="price-box">
        <span>You Save</span>
        <strong>${formatMoney(savings)} (${pct}%)</strong>
      </div>
    </div>

    <div class="modal-verdict-box modal-verdict-box--${meta.tone}">
      <strong>Is it really a deal?</strong>
      <p>${escapeHtml(deal.verdictNote)}</p>
      <small>${escapeHtml(meta.explanation)}</small>
    </div>

    <div class="modal-section">
      <h3>Store Price Comparison</h3>
      <table class="compare-table">
        <thead>
          <tr><th>Retailer</th><th class="num">Checked Price</th><th class="num">Link</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="modal-section modal-audit">
      <div><strong>Condition:</strong> ${escapeHtml(deal.condition)}</div>
      <div><strong>Price Checked:</strong> ${escapeHtml(deal.checkedAt)}</div>
      <div><strong>Verified Source:</strong> <a href="${escapeHtml(deal.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(deal.sourceName)} ↗</a></div>
    </div>

    <div class="modal-actions">
      <a class="btn btn--primary" href="${escapeHtml(deal.storeUrl)}" target="_blank" rel="noopener noreferrer">Go to ${escapeHtml(deal.store)} (${formatMoney(deal.salePrice)}) ↗</a>
      <button type="button" class="btn btn--ghost" data-close-modal>Close</button>
    </div>
  `;
}
