import { computeDealScore, computeDiscountPct, computeSavings, VERDICT_META } from './verdict.js';

export function filterDeals(deals, state) {
  const query = state.query.trim().toLowerCase();
  return deals.filter((deal) => {
    if (state.category !== 'All' && deal.category !== state.category) return false;
    if (state.store !== 'All' && deal.store !== state.store) return false;
    if (state.verdict !== 'All' && deal.verdict !== state.verdict) return false;
    const discountPct = computeDiscountPct(deal.salePrice, deal.usualPrice);
    if (state.minDiscount > 0 && discountPct < state.minDiscount) return false;
    if (state.comparedOnly && (!deal.compareStores || deal.compareStores.length < 2)) return false;
    if (query) {
      const haystack = [
        deal.product,
        deal.brand,
        deal.category,
        deal.store,
        deal.verdictNote,
        deal.sourceName,
        deal.condition,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortDeals(deals, sortBy) {
  const list = [...deals];
  switch (sortBy) {
    case 'discount-desc':
      return list.sort((a, b) => computeDiscountPct(b.salePrice, b.usualPrice) - computeDiscountPct(a.salePrice, a.usualPrice));
    case 'savings-desc':
      return list.sort((a, b) => computeSavings(b.salePrice, b.usualPrice) - computeSavings(a.salePrice, a.usualPrice));
    case 'price-asc':
      return list.sort((a, b) => a.salePrice - b.salePrice);
    case 'price-desc':
      return list.sort((a, b) => b.salePrice - a.salePrice);
    case 'score-desc':
    default:
      return list.sort((a, b) => {
        const scoreDiff = computeDealScore(b) - computeDealScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const rankDiff = (VERDICT_META[b.verdict]?.rank ?? 0) - (VERDICT_META[a.verdict]?.rank ?? 0);
        if (rankDiff !== 0) return rankDiff;
        return computeDiscountPct(b.salePrice, b.usualPrice) - computeDiscountPct(a.salePrice, a.usualPrice);
      });
  }
}

export function getUniqueValues(deals, key) {
  return [...new Set(deals.map((d) => d[key]))].sort();
}

export function summarizeCatalog(allDeals, visibleDeals) {
  const allTimeLows = visibleDeals.filter((d) => d.verdict === 'all-time-low').length;
  const avgDiscount = visibleDeals.length
    ? Math.round(visibleDeals.reduce((sum, d) => sum + computeDiscountPct(d.salePrice, d.usualPrice), 0) / visibleDeals.length)
    : 0;
  const maxSavings = visibleDeals.length
    ? Math.max(...visibleDeals.map((d) => computeSavings(d.salePrice, d.usualPrice)))
    : 0;
  const crossStoreCount = visibleDeals.filter((d) => d.compareStores && d.compareStores.length > 1).length;
  return {
    total: allDeals.length,
    shown: visibleDeals.length,
    allTimeLows,
    avgDiscount,
    maxSavings,
    crossStoreCount,
  };
}
