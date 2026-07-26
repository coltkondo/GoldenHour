import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi, AdminUser, PointTransaction } from '../../services/adminApi';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [found, txns] = await Promise.all([
        usersApi.get(id),
        usersApi.pointHistory(id),
      ]);
      setUser(found);
      setTransactions(txns);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const toggleActive = async () => {
    if (!user) return;
    if (!confirm(`${user.active ? 'Deactivate' : 'Reactivate'} ${user.username}?`)) return;
    setActioning(true);
    try {
      if (user.active) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.reactivate(user.id);
      }
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (error || !user) return <div className="error-banner">{error || 'User not found'}</div>;

  return (
    <div className="page">
      <button className="btn btn-secondary" style={{ marginBottom: 20 }} onClick={() => navigate('/users')}>
        ← Back to Users
      </button>

      {/* User card */}
      <div className="detail-card" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 4 }}>{user.username}</h2>
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>{user.email}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-brand' : 'badge-neutral'}`}>{user.role}</span>
              <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                {user.active ? 'Active' : 'Deactivated'}
              </span>
            </div>
          </div>
          <button
            className={`btn ${user.active ? 'btn-danger' : 'btn-secondary'}`}
            onClick={toggleActive}
            disabled={actioning}
          >
            {actioning ? '…' : user.active ? 'Deactivate Account' : 'Reactivate Account'}
          </button>
        </div>

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat-item">
            <div className="stat-value">{user.points_balance.toLocaleString()}</div>
            <div className="stat-label">Points</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user.submission_count}</div>
            <div className="stat-label">Submissions</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user.approved_count}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{new Date(user.created_at).toLocaleDateString()}</div>
            <div className="stat-label">Joined</div>
          </div>
        </div>
      </div>

      {/* Point history */}
      <h3 style={{ marginBottom: 12 }}>Point History</h3>
      {transactions.length === 0 ? (
        <div className="empty-state">No point transactions yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Points</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ color: '#aaa', fontSize: 13 }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{tx.transaction_type}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.points >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                    {tx.points >= 0 ? '+' : ''}{tx.points}
                  </td>
                  <td style={{ color: '#ccc', fontSize: 13 }}>{tx.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
