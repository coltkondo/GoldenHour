import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../../services/adminApi';
import type { Submission } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

const TYPE_LABELS: Record<string, string> = {
  new_deal: 'New Deal',
  deal_update: 'Deal Update',
  deal_expired: 'Deal Expired',
  new_bar: 'New Bar',
  bar_closed: 'Bar Closed',
  bar_update: 'Bar Update',
};

export default function PendingReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    load();
  }, [statusFilter, typeFilter]);

  async function load() {
    setLoading(true);
    try {
      const [subs, cnt] = await Promise.all([
        submissionsApi.list({
          status: statusFilter || undefined,
          submission_type: typeFilter || undefined,
        }),
        submissionsApi.count({ status: statusFilter || undefined }),
      ]);
      setSubmissions(subs);
      setTotalCount(cnt.count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Submissions</h1>
        <span className="count-badge">{totalCount} total</span>
      </div>

      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">No submissions found.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Points Awarded</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <span className="type-badge">
                    {TYPE_LABELS[sub.submission_type] ?? sub.submission_type}
                  </span>
                </td>
                <td>{sub.submitter_username}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ color: STATUS_COLORS[sub.status] ?? '#666' }}
                  >
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </td>
                <td>{sub.points_awarded > 0 ? `+${sub.points_awarded} pts` : '—'}</td>
                <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                <td>
                  <Link to={`/submissions/${sub.id}`} className="action-link">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
