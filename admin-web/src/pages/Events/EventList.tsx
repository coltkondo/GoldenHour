import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../../services/adminApi';
import { Event } from '../../types';

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const TYPE_COLORS: Record<string, string> = {
  nfl: '#3b82f6', cfb: '#f97316', nba: '#a855f7', mlb: '#22c55e',
  nhl: '#64748b', ufc: '#ef4444', fifa: '#10b981', local: '#f59e0b',
  trivia: '#8b5cf6', karaoke: '#ec4899', live_music: '#06b6d4', flex: '#6366f1', other: '#9ca3af',
};

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  useEffect(() => {
    eventsApi.eventTypes().then(setEventTypes).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    eventsApi.list({ event_type: typeFilter || undefined, upcoming_only: upcomingOnly })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [typeFilter, upcomingOnly]);

  const handleToggle = async (id: string) => {
    await eventsApi.toggleActive(id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, active: !e.active } : e));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await eventsApi.delete(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ Add Event</Link>
      </div>

      <div className="filters">
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => setUpcomingOnly(e.target.checked)}
          />
          Upcoming only
        </label>
      </div>

      {loading ? (
        <div className="loading">Loading events…</div>
      ) : (
        <>
          <div className="table-info">{events.length} event{events.length !== 1 ? 's' : ''}</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>Series</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td colSpan={7} className="empty-row">No events found.</td></tr>
                )}
                {events.map((e) => (
                  <tr key={e.id} className={!e.active ? 'row-inactive' : ''}>
                    <td className="cell-name">
                      {e.name}
                      {e.is_sponsored && (
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                          SPONSORED
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.venue_name ?? '—'}</td>
                    <td>
                      {e.event_type ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: TYPE_COLORS[e.event_type] ?? 'var(--text-secondary)',
                          background: `${TYPE_COLORS[e.event_type] ?? '#9ca3af'}22`,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {e.event_type.toUpperCase()}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDt(e.start_datetime)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {e.series_id ? e.series_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${e.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggle(e.id)}
                      >
                        {e.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/events/${e.id}/edit`} className="action-link">Edit</Link>
                        <button
                          className="link-btn"
                          style={{ color: 'var(--danger)', fontSize: 13 }}
                          onClick={() => handleDelete(e.id, e.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
