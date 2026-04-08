import { Deal, Venue } from '../types/api';

// ── Types ─────────────────────────────────────────────────────

export type SortMode = 'nearest' | 'best_deal';
export type FilterCategory = 'All' | 'Cocktails' | 'Draft' | 'Wine' | 'Bites';

export interface VenueWithDistance extends Venue {
  distance: number;
}

// ── Constants ─────────────────────────────────────────────────

export const FILTER_PILLS: FilterCategory[] = ['All', 'Cocktails', 'Draft', 'Wine', 'Bites'];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Cocktails: ['cocktail', 'mixed', 'martini', 'margarita'],
  Draft: ['draft', 'beer', 'pint', 'ipa', 'lager'],
  Wine: ['wine', 'glass', 'bottle', 'red', 'white', 'rose'],
  Bites: ['food', 'bite', 'appetizer', 'snack', 'wings', 'tacos'],
};

// ── Deal filters ──────────────────────────────────────────────

/**
 * Filter deals by category pill. Returns all deals when category is 'All'.
 */
export function filterDealsByCategory(deals: Deal[], category: FilterCategory): Deal[] {
  if (category === 'All') return deals;
  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  return deals.filter((deal) =>
    keywords.some(
      (kw) =>
        deal.category.toLowerCase().includes(kw) ||
        deal.title.toLowerCase().includes(kw) ||
        (deal.items ?? []).some((item) => item.toLowerCase().includes(kw)),
    ),
  );
}

/**
 * Filter deals by free-text search query across title, category, items, and
 * the name of the venue that owns the deal. Returns all deals when query is blank.
 */
export function filterDealsBySearch(
  deals: Deal[],
  query: string,
  venueMap: Map<string, Venue>,
): Deal[] {
  const q = query.toLowerCase().trim();
  if (!q) return deals;
  return deals.filter((deal) => {
    const venue = venueMap.get(deal.venue_id);
    return (
      deal.title.toLowerCase().includes(q) ||
      deal.category.toLowerCase().includes(q) ||
      (deal.items ?? []).some((item) => item.toLowerCase().includes(q)) ||
      (venue?.name.toLowerCase().includes(q) ?? false)
    );
  });
}

// ── Venue filters / sort ──────────────────────────────────────

/**
 * Filter venues-with-distance by free-text query across name, venue_type,
 * and address. Returns all venues when query is blank.
 */
export function filterVenuesBySearch(
  venues: VenueWithDistance[],
  query: string,
): VenueWithDistance[] {
  const q = query.toLowerCase().trim();
  if (!q) return venues;
  return venues.filter(
    (venue) =>
      venue.name.toLowerCase().includes(q) ||
      (venue.venue_type?.toLowerCase().includes(q) ?? false) ||
      venue.address.toLowerCase().includes(q),
  );
}

/**
 * Sort venues-with-distance by the selected sort mode.
 *   nearest   — ascending distance (default)
 *   best_deal — venues that have an active deal float to the top,
 *               then ties broken by distance
 */
export function sortVenuesByMode(
  venues: VenueWithDistance[],
  mode: SortMode,
  deals: Deal[],
): VenueWithDistance[] {
  const sorted = [...venues];
  if (mode === 'nearest') {
    return sorted.sort((a, b) => a.distance - b.distance);
  }
  // best_deal
  return sorted.sort((a, b) => {
    const aHas = deals.some((d) => d.venue_id === a.id) ? 1 : 0;
    const bHas = deals.some((d) => d.venue_id === b.id) ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    return a.distance - b.distance;
  });
}

// ── Combined pipeline ─────────────────────────────────────────

/**
 * Apply category filter, then search filter, to a deal list.
 * This is the complete pipeline used by the Home screen deal sections.
 */
export function applyDealFilters(
  deals: Deal[],
  category: FilterCategory,
  query: string,
  venueMap: Map<string, Venue>,
): Deal[] {
  const byCategory = filterDealsByCategory(deals, category);
  return filterDealsBySearch(byCategory, query, venueMap);
}

/**
 * Apply search filter, then sort, to a venue-with-distance list.
 * This is the complete pipeline used by the "Nearby Now" section.
 */
export function applyVenueFilters(
  venues: VenueWithDistance[],
  query: string,
  sortMode: SortMode,
  deals: Deal[],
): VenueWithDistance[] {
  const searched = filterVenuesBySearch(venues, query);
  return sortVenuesByMode(searched, sortMode, deals);
}
