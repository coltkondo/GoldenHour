import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { venuesApi, dealsApi } from '../services/adminApi';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVenues: 0,
    activeVenues: 0,
    totalDeals: 0,
    activeDeals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      venuesApi.count(),
      venuesApi.count({ active_only: true }),
      dealsApi.count(),
      dealsApi.count({ active_only: true }),
    ])
      .then(([total, active, totalDeals, activeDeals]) => {
        setStats({
          totalVenues: total.count,
          activeVenues: active.count,
          totalDeals: totalDeals.count,
          activeDeals: activeDeals.count,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.activeVenues}</div>
          <div className="stat-label">Active Bars</div>
          <div className="stat-sub">{stats.totalVenues} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.activeDeals}</div>
          <div className="stat-label">Active Deals</div>
          <div className="stat-sub">{stats.totalDeals} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalVenues - stats.activeVenues}</div>
          <div className="stat-label">Inactive Bars</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalDeals - stats.activeDeals}</div>
          <div className="stat-label">Inactive Deals</div>
        </div>
      </div>
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/venues/new" className="btn btn-primary">
            Add New Bar
          </Link>
          <Link to="/deals/new" className="btn btn-primary">
            Add New Deal
          </Link>
          <a href="/api/v1/admin/export/venues.csv" className="btn btn-secondary">
            Export Bars CSV
          </a>
          <a href="/api/v1/admin/export/deals.csv" className="btn btn-secondary">
            Export Deals CSV
          </a>
        </div>
      </div>
    </div>
  );
}
