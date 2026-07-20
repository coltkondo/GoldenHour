import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { venuesApi, dealsApi } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalVenues: 0,
    activeVenues: 0,
    totalDeals: 0,
    activeDeals: 0,
  });
  const [loading, setLoading] = useState(true);

  async function downloadCSV(path: string, filename: string) {
    const res = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <button
            className="btn btn-secondary"
            onClick={() => downloadCSV(`${API_URL}/admin/export/venues.csv`, 'venues.csv')}
          >
            Export Bars CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => downloadCSV(`${API_URL}/admin/export/deals.csv`, 'deals.csv')}
          >
            Export Deals CSV
          </button>
        </div>
      </div>
    </div>
  );
}
