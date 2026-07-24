import { useEffect, useState } from 'react';
import { analyticsApi, AnalyticsSummary } from '../../services/adminApi';

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const TYPE_LABELS: Record<string, string> = {
  new_deal: 'New Deal',
  deal_update: 'Deal Update',
  deal_expired: 'Deal Expired',
  new_bar: 'New Bar',
  bar_update: 'Bar Update',
  bar_closed: 'Bar Closed',
};

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function DailyChart({ data, color, label }: { data: { date: string; count: number }[]; color: string; label: string }) {
  if (data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No {label.toLowerCase()} in this period.</div>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
        {data.map(({ date, count }) => (
          <div key={date} title={`${fmtDate(date)}: ${count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max((count / max) * 64, count > 0 ? 4 : 1)}px`,
              background: count > 0 ? color : 'var(--border)',
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.2s',
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(data[0].date)}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    analyticsApi.summary(period)
      .then(setData)
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3 }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: period === p.value ? 'var(--bg-surface)' : 'transparent',
                color: period === p.value ? 'var(--brand)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading analytics…</div>}

      {data && !loading && (
        <>
          {/* ── Key metrics ── */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-number">{data.submissions.total}</div>
              <div className="stat-label">Submissions</div>
              <div className="stat-sub">{data.submissions.by_status.pending} pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--success)' }}>{data.signups.total}</div>
              <div className="stat-label">New Signups</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#a78bfa' }}>{data.corroborations.total}</div>
              <div className="stat-label">Corroborations</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--warning)' }}>
                {data.submissions.approval_rate !== null
                  ? `${Math.round(data.submissions.approval_rate * 100)}%`
                  : '—'}
              </div>
              <div className="stat-label">Approval Rate</div>
              <div className="stat-sub">
                {data.submissions.duplicate_rate > 0
                  ? `${Math.round(data.submissions.duplicate_rate * 100)}% flagged dupes`
                  : 'No dupes flagged'}
              </div>
            </div>
          </div>

          {/* ── Activity charts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Submissions / day', daily: data.submissions.daily, color: 'var(--brand)' },
              { label: 'Signups / day', daily: data.signups.daily, color: 'var(--success)' },
              { label: 'Corroborations / day', daily: data.corroborations.daily, color: '#a78bfa' },
            ].map(({ label, daily, color }) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  {label}
                </div>
                <DailyChart data={daily} color={color} label={label} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* ── Submission types ── */}
            <div>
              <h2>Submissions by Type</h2>
              <div className="stat-card" style={{ padding: '16px 20px' }}>
                {Object.keys(TYPE_LABELS).length === 0 || Object.values(data.submissions.by_type).every((v) => v === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No submissions this period.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(data.submissions.by_type)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const max = Math.max(...Object.values(data.submissions.by_type));
                        return (
                          <div key={type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{TYPE_LABELS[type] ?? type}</span>
                            </div>
                            <MiniBar value={count} max={max} color="var(--brand)" />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Status breakdown + market ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2>Submission Status</h2>
                <div className="stat-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'approved', label: 'Approved', color: 'var(--success)' },
                      { key: 'pending', label: 'Pending', color: 'var(--warning)' },
                      { key: 'rejected', label: 'Rejected', color: 'var(--danger)' },
                    ].map(({ key, label, color }) => {
                      const count = data.submissions.by_status[key] ?? 0;
                      const max = Math.max(...Object.values(data.submissions.by_status));
                      return (
                        <div key={key}>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                          <MiniBar value={count} max={max} color={color} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {data.markets.length > 0 && (
                <div>
                  <h2>By Market</h2>
                  <div className="stat-card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.markets.map((m) => (
                        <div key={m.market_slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {m.market_slug.replace(/-/g, ' ')}
                          </span>
                          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                            <span><span style={{ color: 'var(--brand)' }}>{m.submissions}</span> <span style={{ color: 'var(--text-muted)' }}>sub</span></span>
                            <span><span style={{ color: 'var(--success)' }}>{m.signups}</span> <span style={{ color: 'var(--text-muted)' }}>signup</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Top submitters ── */}
          <div style={{ marginBottom: 32 }}>
            <h2>Top Submitters</h2>
            {data.top_submitters.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No submissions this period.</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Approved</th>
                      <th>Pending</th>
                      <th>Pts Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_submitters.map((u, i) => (
                      <tr key={u.username}>
                        <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                        <td className="cell-name">{u.username}</td>
                        <td style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{u.approved}</td>
                        <td style={{ color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>{u.pending}</td>
                        <td style={{ color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>{u.points_earned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Top corroborators (farming monitor) ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Top Corroborators</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Watch for unusually high counts — farming risk</span>
            </div>
            {data.top_corroborators.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No corroborations this period.</div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Corroborations</th>
                      <th>Avg / day</th>
                      <th>Pts Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_corroborators.map((u, i) => {
                      const avgPerDay = (u.count / period).toFixed(1);
                      const isSuspicious = u.count / period > 5;
                      return (
                        <tr key={u.username} style={isSuspicious ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                          <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                          <td className="cell-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {u.username}
                            {isSuspicious && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: 'var(--danger)',
                                background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 4,
                              }}>
                                ⚠ HIGH
                              </span>
                            )}
                          </td>
                          <td style={{ color: '#a78bfa', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{u.count}</td>
                          <td style={{ color: isSuspicious ? 'var(--danger)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                            {avgPerDay}
                          </td>
                          <td style={{ color: 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>{u.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
