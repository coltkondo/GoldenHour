import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, AdminUser } from '../../services/adminApi';

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.list({ active_only: activeOnly, limit: 200 });
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeOnly]);

  const toggleActive = async (user: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`${user.active ? 'Deactivate' : 'Reactivate'} ${user.username}?`)) return;
    setActioning(user.id);
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
      setActioning(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#aaa', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading users…</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Points</th>
                <th>Submissions</th>
                <th>Approved</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/users/${u.id}`)}
                  style={{ cursor: 'pointer', opacity: u.active ? 1 : 0.5 }}
                >
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td style={{ color: '#aaa', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-brand' : 'badge-neutral'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.points_balance.toLocaleString()}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.submission_count}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.approved_count}</td>
                  <td style={{ color: '#aaa', fontSize: 13 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={(e) => toggleActive(u, e)}
                      disabled={actioning === u.id}
                    >
                      {actioning === u.id ? '…' : u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="empty-state">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
