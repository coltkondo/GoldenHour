import {
  filterDealsByCategory,
  filterDealsBySearch,
  filterVenuesBySearch,
  sortVenuesByMode,
  applyDealFilters,
  applyVenueFilters,
} from '../utils/homeFilters';
import type { Deal, Venue } from '../types/api';
import type { VenueWithDistance } from '../utils/homeFilters';

// ── Fixtures ──────────────────────────────────────────────────

const BASE_VENUE: Venue = {
  id: 'v1',
  name: "O'Malley's Irish Pub",
  nickname: null,
  address: '123 College Ave, State College, PA',
  latitude: 40.793,
  longitude: -77.86,
  neighborhood: 'Downtown',
  venue_type: 'Bar',
  tags: null,
  phone: null,
  website: null,
  cash_only: false,
  google_place_id: null,
  price_level: 2,
  rating: 4.2,
  verified: true,
  active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

function makeVenue(overrides: Partial<Venue> & { id: string }): Venue {
  return { ...BASE_VENUE, ...overrides };
}

function makeVenueWithDistance(
  overrides: Partial<Venue> & { id: string },
  distance: number,
): VenueWithDistance {
  return { ...makeVenue(overrides), distance };
}

const BASE_DEAL: Deal = {
  id: 'd1',
  venue_id: 'v1',
  title: '$3 Draft Beers',
  description: null,
  category: 'Draft Beer',
  deal_type: 'price',
  original_price: 6,
  deal_price: 3,
  discount_percentage: null,
  items: ['Yuengling', 'Bud Light'],
  active: true,
  verified: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

function makeDeal(overrides: Partial<Deal> & { id: string }): Deal {
  return { ...BASE_DEAL, ...overrides };
}

// ── filterDealsByCategory ─────────────────────────────────────

describe('filterDealsByCategory', () => {
  const cocktailDeal = makeDeal({ id: 'd-c', title: 'Martini Special', category: 'cocktail' });
  const draftDeal = makeDeal({ id: 'd-d', title: '$3 Draft Beers', category: 'Draft Beer' });
  const wineDeal = makeDeal({ id: 'd-w', title: 'House Wine', category: 'Wine & Spirits', items: ['red', 'white'] });
  const bitesDeal = makeDeal({ id: 'd-b', title: 'Wing Night', category: 'Food', items: ['wings', 'tacos'] });
  const all = [cocktailDeal, draftDeal, wineDeal, bitesDeal];

  test('All returns every deal unchanged', () => {
    expect(filterDealsByCategory(all, 'All')).toEqual(all);
  });

  test('Cocktails matches on category keyword', () => {
    const result = filterDealsByCategory(all, 'Cocktails');
    expect(result).toContain(cocktailDeal);
    expect(result).not.toContain(draftDeal);
  });

  test('Draft matches on category keyword', () => {
    const result = filterDealsByCategory(all, 'Draft');
    expect(result).toContain(draftDeal);
    expect(result).not.toContain(wineDeal);
  });

  test('Wine matches on category keyword', () => {
    const result = filterDealsByCategory(all, 'Wine');
    expect(result).toContain(wineDeal);
    expect(result).not.toContain(draftDeal);
  });

  test('Bites matches via items array', () => {
    const result = filterDealsByCategory(all, 'Bites');
    expect(result).toContain(bitesDeal);
    expect(result).not.toContain(draftDeal);
  });

  test('Cocktails matches on deal title containing keyword', () => {
    const titleMatch = makeDeal({ id: 'd-tm', title: 'Margarita Monday', category: 'Happy Hour' });
    const result = filterDealsByCategory([titleMatch, draftDeal], 'Cocktails');
    expect(result).toContain(titleMatch);
    expect(result).not.toContain(draftDeal);
  });

  test('Bites matches on items keyword', () => {
    const itemMatch = makeDeal({ id: 'd-im', title: 'Happy Hour', category: 'Specials', items: ['appetizer', 'beer'] });
    const result = filterDealsByCategory([itemMatch], 'Bites');
    expect(result).toContain(itemMatch);
  });

  test('returns empty array when no deals match', () => {
    const noMatch = makeDeal({ id: 'd-nm', title: 'Sparkling Water', category: 'Non-Alcoholic' });
    expect(filterDealsByCategory([noMatch], 'Cocktails')).toHaveLength(0);
  });

  test('returns empty array when deals list is empty', () => {
    expect(filterDealsByCategory([], 'Draft')).toEqual([]);
  });

  test('deals with null items do not throw', () => {
    const noItems = makeDeal({ id: 'd-ni', items: [] });
    expect(() => filterDealsByCategory([noItems], 'Bites')).not.toThrow();
  });
});

// ── filterDealsBySearch ───────────────────────────────────────

describe('filterDealsBySearch', () => {
  const venue1 = makeVenue({ id: 'v1', name: "O'Malley's Irish Pub" });
  const venue2 = makeVenue({ id: 'v2', name: 'The Brewery on Allen' });
  const venueMap = new Map([
    ['v1', venue1],
    ['v2', venue2],
  ]);

  const deal1 = makeDeal({ id: 'd1', venue_id: 'v1', title: '$3 Draft Beers', category: 'Draft Beer', items: ['Yuengling'] });
  const deal2 = makeDeal({ id: 'd2', venue_id: 'v2', title: 'House Martini', category: 'Cocktail', items: ['gin', 'vermouth'] });
  const deal3 = makeDeal({ id: 'd3', venue_id: 'v1', title: 'Wing Night', category: 'Food', items: ['wings', 'ranch'] });
  const allDeals = [deal1, deal2, deal3];

  test('blank query returns all deals', () => {
    expect(filterDealsBySearch(allDeals, '', venueMap)).toEqual(allDeals);
  });

  test('whitespace-only query returns all deals', () => {
    expect(filterDealsBySearch(allDeals, '   ', venueMap)).toEqual(allDeals);
  });

  test('matches on deal title (case-insensitive)', () => {
    const result = filterDealsBySearch(allDeals, 'martini', venueMap);
    expect(result).toContain(deal2);
    expect(result).not.toContain(deal1);
  });

  test('matches on deal category', () => {
    const result = filterDealsBySearch(allDeals, 'draft', venueMap);
    expect(result).toContain(deal1);
    expect(result).not.toContain(deal2);
  });

  test('matches on deal items array', () => {
    const result = filterDealsBySearch(allDeals, 'yuengling', venueMap);
    expect(result).toContain(deal1);
    expect(result).toHaveLength(1);
  });

  test('matches on venue name via venueMap', () => {
    const result = filterDealsBySearch(allDeals, "o'malley", venueMap);
    // deal1 and deal3 both belong to v1
    expect(result).toContain(deal1);
    expect(result).toContain(deal3);
    expect(result).not.toContain(deal2);
  });

  test('matches on venue name partial (brewery)', () => {
    const result = filterDealsBySearch(allDeals, 'brewery', venueMap);
    expect(result).toContain(deal2);
    expect(result).not.toContain(deal1);
  });

  test('search is case-insensitive', () => {
    expect(filterDealsBySearch(allDeals, 'WING', venueMap)).toContain(deal3);
    expect(filterDealsBySearch(allDeals, 'wing', venueMap)).toContain(deal3);
  });

  test('returns empty array when no deals match', () => {
    expect(filterDealsBySearch(allDeals, 'sushi', venueMap)).toHaveLength(0);
  });

  test('deals whose venue is not in the map are still matched on title/category', () => {
    const orphanDeal = makeDeal({ id: 'd-orphan', venue_id: 'v-missing', title: 'Orphan Deal', category: 'Special' });
    const result = filterDealsBySearch([orphanDeal], 'orphan', venueMap);
    expect(result).toContain(orphanDeal);
  });

  test('deals with empty items array do not throw', () => {
    const noItems = makeDeal({ id: 'd-ni', items: [] });
    expect(() => filterDealsBySearch([noItems], 'beer', venueMap)).not.toThrow();
  });
});

// ── filterVenuesBySearch ──────────────────────────────────────

describe('filterVenuesBySearch', () => {
  const pub = makeVenueWithDistance({ id: 'v1', name: "O'Malley's Irish Pub", venue_type: 'Bar', address: '100 College Ave' }, 0.1);
  const brewery = makeVenueWithDistance({ id: 'v2', name: 'The Brewery on Allen', venue_type: 'Brewery', address: '200 Allen St' }, 0.5);
  const winery = makeVenueWithDistance({ id: 'v3', name: 'Allen Winery', venue_type: 'Wine Bar', address: '300 Beaver Ave' }, 1.0);
  const allVenues = [pub, brewery, winery];

  test('blank query returns all venues', () => {
    expect(filterVenuesBySearch(allVenues, '')).toEqual(allVenues);
  });

  test('matches on venue name', () => {
    const result = filterVenuesBySearch(allVenues, 'brewery');
    expect(result).toContain(brewery);
    expect(result).not.toContain(pub);
  });

  test('matches on venue_type', () => {
    const result = filterVenuesBySearch(allVenues, 'wine bar');
    expect(result).toContain(winery);
    expect(result).not.toContain(pub);
  });

  test('matches on address', () => {
    const result = filterVenuesBySearch(allVenues, 'allen st');
    expect(result).toContain(brewery);
    expect(result).not.toContain(winery);
  });

  test('multiple venues match partial name', () => {
    const result = filterVenuesBySearch(allVenues, 'allen');
    expect(result).toContain(brewery); // name contains Allen
    expect(result).toContain(winery);  // name contains Allen
    expect(result).not.toContain(pub);
  });

  test('search is case-insensitive', () => {
    expect(filterVenuesBySearch(allVenues, "O'MALLEY")).toContain(pub);
    expect(filterVenuesBySearch(allVenues, "o'malley")).toContain(pub);
  });

  test('returns empty when nothing matches', () => {
    expect(filterVenuesBySearch(allVenues, 'sushi restaurant')).toHaveLength(0);
  });

  test('venue with null venue_type does not throw', () => {
    const noType = makeVenueWithDistance({ id: 'v-nt', name: 'Mystery Bar', venue_type: null }, 0.2);
    expect(() => filterVenuesBySearch([noType], 'bar')).not.toThrow();
    // Should still match on name
    expect(filterVenuesBySearch([noType], 'mystery')).toContain(noType);
  });
});

// ── sortVenuesByMode ──────────────────────────────────────────

describe('sortVenuesByMode', () => {
  const far = makeVenueWithDistance({ id: 'v-far', name: 'Far Bar' }, 2.0);
  const mid = makeVenueWithDistance({ id: 'v-mid', name: 'Mid Bar' }, 1.0);
  const near = makeVenueWithDistance({ id: 'v-near', name: 'Near Bar' }, 0.2);
  const allVenues = [far, mid, near];

  const dealAtFar = makeDeal({ id: 'd-far', venue_id: 'v-far' });
  const dealAtNear = makeDeal({ id: 'd-near', venue_id: 'v-near' });

  test('nearest mode sorts ascending by distance', () => {
    const result = sortVenuesByMode(allVenues, 'nearest', []);
    expect(result.map((v) => v.id)).toEqual(['v-near', 'v-mid', 'v-far']);
  });

  test('nearest mode does not mutate original array', () => {
    const original = [...allVenues];
    sortVenuesByMode(allVenues, 'nearest', []);
    expect(allVenues).toEqual(original);
  });

  test('best_deal floats venues with active deals to top', () => {
    // only far and near have deals; mid does not
    const result = sortVenuesByMode(allVenues, 'best_deal', [dealAtFar, dealAtNear]);
    const ids = result.map((v) => v.id);
    // Both near and far have deals; mid does not — mid must be last
    expect(ids.indexOf('v-mid')).toBe(2);
    // Near (0.2 mi) should beat Far (2.0 mi) among deal venues
    expect(ids.indexOf('v-near')).toBeLessThan(ids.indexOf('v-far'));
  });

  test('best_deal breaks ties within deal-havers by distance', () => {
    const near2 = makeVenueWithDistance({ id: 'v-near2', name: 'Near2 Bar' }, 0.3);
    const dealAtNear2 = makeDeal({ id: 'd-near2', venue_id: 'v-near2' });
    const result = sortVenuesByMode([near, near2], 'best_deal', [dealAtNear, dealAtNear2]);
    expect(result[0].id).toBe('v-near'); // 0.2 mi < 0.3 mi
  });

  test('best_deal with no deals falls back to distance sort', () => {
    const result = sortVenuesByMode(allVenues, 'best_deal', []);
    expect(result.map((v) => v.id)).toEqual(['v-near', 'v-mid', 'v-far']);
  });
});

// ── applyDealFilters (combined pipeline) ─────────────────────

describe('applyDealFilters', () => {
  const venue = makeVenue({ id: 'v1', name: 'Sports Bar' });
  const venueMap = new Map([['v1', venue]]);

  const beerDeal = makeDeal({ id: 'd-beer', title: '$3 Draft', category: 'Draft Beer', items: ['Bud'] });
  const wineDeal = makeDeal({ id: 'd-wine', title: 'House Merlot', category: 'Wine', items: ['Merlot'] });
  const foodDeal = makeDeal({ id: 'd-food', title: 'Nacho Platter', category: 'Food', items: ['nachos'] });
  const allDeals = [beerDeal, wineDeal, foodDeal];

  test('All category + blank search returns everything', () => {
    expect(applyDealFilters(allDeals, 'All', '', venueMap)).toEqual(allDeals);
  });

  test('category filter applied before search', () => {
    // Draft category, then search "bud" — should hit beerDeal
    const result = applyDealFilters(allDeals, 'Draft', 'bud', venueMap);
    expect(result).toContain(beerDeal);
    expect(result).not.toContain(wineDeal);
  });

  test('search narrows down after category filter', () => {
    // Wine category has wineDeal; searching "merlot" should return it
    const result = applyDealFilters(allDeals, 'Wine', 'merlot', venueMap);
    expect(result).toContain(wineDeal);
    expect(result).toHaveLength(1);
  });

  test('returns empty when search matches nothing in filtered category', () => {
    // Draft category + search "merlot" — no match
    const result = applyDealFilters(allDeals, 'Draft', 'merlot', venueMap);
    expect(result).toHaveLength(0);
  });

  test('venue name search works through combined pipeline', () => {
    const result = applyDealFilters(allDeals, 'All', 'sports bar', venueMap);
    // All deals belong to 'Sports Bar' venue
    expect(result).toHaveLength(3);
  });
});

// ── applyVenueFilters (combined pipeline) ─────────────────────

describe('applyVenueFilters', () => {
  const pub = makeVenueWithDistance({ id: 'v1', name: "O'Malley's", venue_type: 'Bar', address: '100 College Ave' }, 0.5);
  const brewery = makeVenueWithDistance({ id: 'v2', name: 'Brewery', venue_type: 'Brewery', address: '200 Allen St' }, 0.2);
  const winery = makeVenueWithDistance({ id: 'v3', name: 'Winery', venue_type: 'Wine Bar', address: '300 Beaver Ave' }, 1.5);
  const allVenues = [pub, brewery, winery];

  const dealAtPub = makeDeal({ id: 'd1', venue_id: 'v1' });

  test('blank query + nearest sort returns all venues sorted by distance', () => {
    const result = applyVenueFilters(allVenues, '', 'nearest', []);
    expect(result.map((v) => v.id)).toEqual(['v2', 'v1', 'v3']);
  });

  test('search filters before sort', () => {
    const result = applyVenueFilters(allVenues, 'allen', 'nearest', []);
    // Only brewery is on Allen St
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v2');
  });

  test('best_deal sort applied after search', () => {
    const result = applyVenueFilters(allVenues, '', 'best_deal', [dealAtPub]);
    // pub (v1) has a deal, should be first; brewery (v2, 0.2mi) should beat winery (v3, 1.5mi)
    expect(result[0].id).toBe('v1');
  });

  test('returns empty when search matches nothing', () => {
    expect(applyVenueFilters(allVenues, 'xyz nonexistent', 'nearest', [])).toHaveLength(0);
  });
});
