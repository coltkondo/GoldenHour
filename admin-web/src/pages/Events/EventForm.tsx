import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi, venuesApi } from '../../services/adminApi';
import { Venue } from '../../types';

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  // Convert ISO (UTC) to local datetime-local input value
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}

const SERIES_MODE_HELP = 'Enter one date per line: YYYY-MM-DDTHH:MM (e.g. 2026-09-06T13:00)';

export default function EventForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seriesMode, setSeriesMode] = useState(false);
  const [seriesDates, setSeriesDates] = useState('');
  const [endOffsetMins, setEndOffsetMins] = useState('');

  const [form, setForm] = useState({
    venue_id: '',
    name: '',
    description: '',
    event_type: '',
    start_datetime: '',
    end_datetime: '',
    image_url: '',
    is_sponsored: false,
    is_recurring: false,
    active: true,
    verified: true,
  });

  useEffect(() => {
    venuesApi.list({ limit: 200, active_only: true }).then((vs) =>
      setVenues(vs.sort((a, b) => a.name.localeCompare(b.name)))
    ).catch(() => {});
    eventsApi.eventTypes().then(setEventTypes).catch(() => {});

    if (isEdit && id) {
      eventsApi.get(id)
        .then((e) => {
          setForm({
            venue_id: e.venue_id,
            name: e.name,
            description: e.description ?? '',
            event_type: e.event_type ?? '',
            start_datetime: toLocalInput(e.start_datetime),
            end_datetime: toLocalInput(e.end_datetime),
            image_url: e.image_url ?? '',
            is_sponsored: e.is_sponsored,
            is_recurring: e.is_recurring,
            active: e.active,
            verified: e.verified,
          });
        })
        .catch(() => setError('Could not load event.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (seriesMode && !isEdit) {
        const lines = seriesDates.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) { setError('Enter at least one date.'); setSaving(false); return; }
        await eventsApi.createSeries({
          venue_id: form.venue_id,
          name: form.name,
          description: form.description || null,
          event_type: form.event_type || null,
          start_datetimes: lines.map((l) => toIso(l)),
          end_time_offset_minutes: endOffsetMins ? parseInt(endOffsetMins, 10) : null,
          image_url: form.image_url || null,
          is_sponsored: form.is_sponsored,
        });
      } else if (isEdit && id) {
        await eventsApi.update(id, {
          name: form.name,
          description: form.description || null,
          event_type: form.event_type || null,
          start_datetime: toIso(form.start_datetime),
          end_datetime: form.end_datetime ? toIso(form.end_datetime) : null,
          image_url: form.image_url || null,
          is_sponsored: form.is_sponsored,
          is_recurring: form.is_recurring,
          active: form.active,
          verified: form.verified,
        });
      } else {
        await eventsApi.create({
          venue_id: form.venue_id,
          name: form.name,
          description: form.description || null,
          event_type: form.event_type || null,
          start_datetime: toIso(form.start_datetime),
          end_datetime: form.end_datetime ? toIso(form.end_datetime) : null,
          image_url: form.image_url || null,
          is_sponsored: form.is_sponsored,
          is_recurring: form.is_recurring,
          active: form.active,
          verified: form.verified,
        });
      }
      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={() => navigate('/events')}>← Back to Events</button>
      <h1>{isEdit ? 'Edit Event' : 'Add Event'}</h1>

      {!isEdit && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { val: false, label: 'Single event' },
            { val: true, label: 'Series (multiple dates)' },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              type="button"
              className={seriesMode === val ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setSeriesMode(val)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label>Bar *</label>
            <select
              value={form.venue_id}
              onChange={(e) => set('venue_id', e.target.value)}
              required
            >
              <option value="">Select bar…</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Event Type</label>
            <select value={form.event_type} onChange={(e) => set('event_type', e.target.value)}>
              <option value="">None</option>
              {eventTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Event Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Country Night, UFC 310, Penn State vs Ohio State"
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What's happening, specials, who's performing…"
          />
        </div>

        {seriesMode && !isEdit ? (
          <>
            <div className="form-group full-width">
              <label>Dates (one per line, format: YYYY-MM-DDTHH:MM)</label>
              <textarea
                rows={8}
                value={seriesDates}
                onChange={(e) => setSeriesDates(e.target.value)}
                placeholder={`2026-09-06T13:00\n2026-09-13T13:00\n2026-09-20T13:00`}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{SERIES_MODE_HELP}</span>
            </div>
            <div className="form-group">
              <label>Duration (minutes, optional)</label>
              <input
                type="number"
                value={endOffsetMins}
                onChange={(e) => setEndOffsetMins(e.target.value)}
                placeholder="e.g. 180 for 3 hours"
              />
            </div>
          </>
        ) : (
          <div className="form-grid">
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(e) => set('start_datetime', e.target.value)}
                required={!seriesMode}
              />
            </div>
            <div className="form-group">
              <label>End Date & Time</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => set('end_datetime', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="form-group full-width">
          <label>Image URL (optional)</label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {[
            { key: 'is_sponsored', label: 'Sponsored' },
            { key: 'is_recurring', label: 'Recurring series' },
            { key: 'verified', label: 'Verified' },
            { key: 'active', label: 'Active' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={(form as any)[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : seriesMode && !isEdit ? 'Create Series' : isEdit ? 'Save Changes' : 'Create Event'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
