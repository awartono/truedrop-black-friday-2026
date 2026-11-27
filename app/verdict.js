export const VERDICT_META = {
  'all-time-low': {
    label: 'All-Time Low',
    shortLabel: 'All-Time Low',
    rank: 4,
    tone: 'low',
    explanation: 'Verified at or near the lowest price ever tracked — buy with confidence.',
  },
  'strong-deal': {
    label: 'Strong Deal',
    shortLabel: 'Strong Deal',
    rank: 3,
    tone: 'strong',
    explanation: 'Meaningfully below typical street price, not just an MSRP cut.',
  },
  'routine-sale': {
    label: 'Routine Sale',
    shortLabel: 'Routine Sale',
    rank: 2,
    tone: 'routine',
    explanation: 'Repeats throughout the year; fine if you need it now, no rush.',
  },
  'inflated-msrp': {
    label: 'Inflated MSRP',
    shortLabel: 'Inflated MSRP',
    rank: 1,
    tone: 'warn',
    explanation: 'Headline % off relies on a high list price; real drop vs street is smaller.',
  },
};

export function computeDiscountPct(salePrice, usualPrice) {
  if (!usualPrice || usualPrice <= salePrice) return 0;
  return Math.round(((usualPrice - salePrice) / usualPrice) * 100);
}

export function computeStreetDiscountPct(salePrice, streetPrice) {
  if (!streetPrice || streetPrice <= salePrice) return 0;
  return Math.round(((streetPrice - salePrice) / streetPrice) * 100);
}

export function computeSavings(salePrice, usualPrice) {
  return Math.max(0, Number((usualPrice - salePrice).toFixed(2)));
}

export function computeDealScore(deal) {
  const verdictBase = {
    'all-time-low': 76,
    'strong-deal': 64,
    'routine-sale': 46,
    'inflated-msrp': 34,
  }[deal.verdict] ?? 50;
  const streetBonus = Math.min(20, Math.round(computeStreetDiscountPct(deal.salePrice, deal.streetPrice) * 0.5));
  const multiStoreBonus = deal.compareStores && deal.compareStores.length > 1 ? 4 : 0;
  return Math.min(99, verdictBase + streetBonus + multiStoreBonus);
}

export function getStoreSpread(deal) {
  if (!deal.compareStores || deal.compareStores.length < 2) return null;
  const sorted = [...deal.compareStores].sort((a, b) => a.price - b.price);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const diff = Number((worst.price - best.price).toFixed(2));
  return { best, worst, diff, count: sorted.length };
}

export function formatMoney(amount) {
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
