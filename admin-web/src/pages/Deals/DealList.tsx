import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dealsApi, venuesApi } from '../../services/adminApi';
import { DealWithVenue, Venue } from '../../types';
import StatusToggle from '../../components/StatusToggle';

export default function DealList() {
  const [deals, setDeals] = useState<DealWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dealTypes, setDealTypes] = useState<string[]>([]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealsApi.list({
        search: search || undefined,
        venue_id: venueFilter || undefined,
        category: categoryFilter || undefined,
        deal_type: typeFilter || undefined,
        active_only: activeFilter === '' ? undefined : activeFilter === 'true',
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 200,
      });
      setDeals(data as DealWithVenue[]);
    } catch (err) {
      console.error('Failed to load deals', err);
    }
    setLoading(false);
  }, [search, venueFilter, categoryFilter, typeFilter, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    venuesApi
      .list({ limit: 200 })
      .then((v) => setVenues(v as Venue[]))
      .catch(() => {});
    dealsApi
      .categories()
      .then(setCategories)
      .catch(() => {});
    dealsApi
      .dealTypes()
      .then(setDealTypes)
      .catch(() => {});
  }, []);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const handleToggle = async (id: string) => {
    await dealsApi.toggleActive(id);
    fetchDeals();
  };

  const sortIndicator = (col: string) => {
    if (sortBy !== col) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '—';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Deals</h1>
        <Link to="/deals/new" className="btn btn-primary">
          Add Deal
        </Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Bars</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          {dealTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="table-info">{deals.length} deals found</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('title')}>
                    Title{sortIndicator('title')}
                  </th>
                  <th>Bar</th>
                  <th className="sortable" onClick={() => handleSort('category')}>
                    Category{sortIndicator('category')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('deal_type')}>
                    Type{sortIndicator('deal_type')}
                  </th>
                  <th>Price</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className={!d.active ? 'row-inactive' : ''}>
                    <td className="cell-name">{d.title}</td>
                    <td>{d.venue_name || '—'}</td>
                    <td>
                      <span className="badge">{d.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-outline">{d.deal_type}</span>
                    </td>
                    <td>
                      {d.deal_price !== null ? (
                        <span>
                          {d.original_price !== null && (
                            <span className="price-original">{formatPrice(d.original_price)}</span>
                          )}{' '}
                          {formatPrice(d.deal_price)}
                          {d.discount_percentage !== null && (
                            <span className="price-discount"> ({d.discount_percentage}% off)</span>
                          )}
                        </span>
                      ) : d.discount_percentage !== null ? (
                        <span className="price-discount">{d.discount_percentage}% off</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="cell-items">{d.items?.length ? d.items.join(', ') : '—'}</td>
                    <td>
                      <StatusToggle active={d.active} onToggle={() => handleToggle(d.id)} />
                    </td>
                    <td>
                      <Link to={`/deals/${d.id}/edit`} className="btn btn-small">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">
                      No deals found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
