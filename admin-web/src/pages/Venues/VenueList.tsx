import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { venuesApi } from '../../services/adminApi';
import { VenueWithDeals } from '../../types';
import StatusToggle from '../../components/StatusToggle';

export default function VenueList() {
  const [venues, setVenues] = useState<VenueWithDeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [venueType, setVenueType] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [venueTypes, setVenueTypes] = useState<string[]>([]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await venuesApi.list({
        search: search || undefined,
        neighborhood: neighborhood || undefined,
        venue_type: venueType || undefined,
        active_only: activeFilter === '' ? undefined : activeFilter === 'true',
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 200,
      });
      setVenues(data as VenueWithDeals[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bars';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, neighborhood, venueType, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    venuesApi
      .neighborhoods()
      .then(setNeighborhoods)
      .catch(() => {});
    venuesApi
      .venueTypes()
      .then(setVenueTypes)
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
    await venuesApi.toggleActive(id);
    fetchVenues();
  };

  const sortIndicator = (col: string) => {
    if (sortBy !== col) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bars</h1>
        <Link to="/venues/new" className="btn btn-primary">
          Add Bar
        </Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search bars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          className="filter-select"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={venueType}
          onChange={(e) => setVenueType(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          {venueTypes.map((t) => (
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

      {loadError && (
        <div className="error-banner">
          Failed to load bars: {loadError} —{' '}
          <button className="link-btn" onClick={fetchVenues}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="table-info">{venues.length} bars found</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    Name{sortIndicator('name')}
                  </th>
                  <th>Address</th>
                  <th className="sortable" onClick={() => handleSort('neighborhood')}>
                    Neighborhood{sortIndicator('neighborhood')}
                  </th>
                  <th>Type</th>
                  <th>Deals</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id} className={!v.active ? 'row-inactive' : ''}>
                    <td className="cell-name">{v.name}</td>
                    <td className="cell-address">{v.address}</td>
                    <td>{v.neighborhood || '—'}</td>
                    <td>{v.venue_type || '—'}</td>
                    <td>
                      <span className="deal-count">
                        {v.active_deals_count}/{v.deals_count}
                      </span>
                    </td>
                    <td>
                      <StatusToggle active={v.active} onToggle={() => handleToggle(v.id)} />
                    </td>
                    <td>
                      <Link to={`/venues/${v.id}/edit`} className="btn btn-small">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {venues.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No bars found
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
