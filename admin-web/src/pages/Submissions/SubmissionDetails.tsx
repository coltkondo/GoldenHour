import type { Submission } from '../../types';

interface FieldDef {
  label: string;
  key: string;
  type?: 'bool' | 'array';
}

const ISSUE_LABELS: Record<string, string> = {
  price_wrong: 'Price is wrong',
  time_wrong: 'Hours / time is wrong',
  days_wrong: 'Days offered are wrong',
  description_wrong: 'Description is wrong',
  no_longer_active: 'Deal is no longer active',
  name: 'Bar name is wrong',
  address: 'Address is wrong',
  phone: 'Phone number is wrong',
  website: 'Website is wrong',
  other: 'Something else is wrong',
  bar_closed: 'Bar is permanently closed',
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'One time',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const FIELD_SETS: Record<string, FieldDef[]> = {
  new_deal: [
    { label: 'Bar', key: 'bar_name' },
    { label: 'Deal', key: 'title' },
    { label: 'Days', key: 'days', type: 'array' },
    { label: 'All day', key: 'is_all_day', type: 'bool' },
    { label: 'Start time', key: 'start_time' },
    { label: 'End time', key: 'end_time' },
    { label: 'Price note', key: 'price_note' },
  ],
  deal_update: [
    { label: 'Bar', key: 'bar_name' },
    { label: 'Deal', key: 'deal_title' },
    { label: "What's wrong", key: 'issue_type' },
    { label: 'Correction', key: 'correction' },
  ],
  deal_expired: [
    { label: 'Bar', key: 'bar_name' },
    { label: 'Deal', key: 'deal_title' },
  ],
  new_bar: [
    { label: 'Bar name', key: 'name' },
    { label: 'Address', key: 'address' },
    { label: 'Neighborhood', key: 'neighborhood' },
    { label: 'Latitude', key: 'latitude' },
    { label: 'Longitude', key: 'longitude' },
    { label: 'Description', key: 'description' },
  ],
  bar_update: [
    { label: 'Bar', key: 'bar_name' },
    { label: 'Correction', key: 'correction' },
  ],
  bar_closed: [{ label: 'Bar', key: 'bar_name' }],
  new_event: [
    { label: 'Bar', key: 'bar_name' },
    { label: 'Event name', key: 'event_name' },
    { label: 'Event type', key: 'event_type' },
    { label: 'Repeats', key: 'recurrence_type' },
    { label: 'Date', key: 'event_date' },
    { label: 'Start time', key: 'start_time' },
    { label: 'End time', key: 'end_time' },
    { label: 'Days', key: 'days', type: 'array' },
    { label: 'Day of month', key: 'day_of_month' },
    { label: 'Notes', key: 'notes' },
    { label: 'Description', key: 'description' },
  ],
};

function formatValue(field: FieldDef, raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (Array.isArray(raw)) {
    return raw.length === 0 ? null : raw.join(', ');
  }
  if (field.type === 'bool') return raw ? 'Yes' : 'No';
  if (field.key === 'issue_type') return ISSUE_LABELS[String(raw)] ?? String(raw);
  if (field.key === 'recurrence_type') return RECURRENCE_LABELS[String(raw)] ?? String(raw);
  return String(raw);
}

export default function SubmissionDetails({ submission }: { submission: Submission }) {
  const fields = FIELD_SETS[submission.submission_type];
  const data = submission.submitted_data ?? {};

  const rows: Array<{ label: string; value: string }> = [];
  if (fields) {
    for (const field of fields) {
      const value = formatValue(field, data[field.key]);
      if (value !== null) rows.push({ label: field.label, value });
    }
  } else {
    for (const [key, raw] of Object.entries(data)) {
      const value = formatValue({ label: key, key }, raw);
      if (value !== null) rows.push({ label: key, value });
    }
  }

  if (rows.length === 0) {
    return <div className="empty-state">No submitted data.</div>;
  }

  return (
    <div className="field-grid">
      {rows.map((row) => (
        <div className="field" key={row.label}>
          <span className="field-label">{row.label}</span>
          <span className="field-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
