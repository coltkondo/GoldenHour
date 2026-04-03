import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { venuesApi } from '../../services/adminApi';

interface FormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  neighborhood: string;
  venue_type: string;
  google_place_id: string;
  price_level: string;
  rating: string;
  description: string;
}

const emptyForm: FormData = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone: '',
  website: '',
  neighborhood: '',
  venue_type: '',
  google_place_id: '',
  price_level: '',
  rating: '',
  description: '',
};

export default function VenueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      venuesApi
        .get(id)
        .then((venue) => {
          setForm({
            name: venue.name || '',
            address: venue.address || '',
            latitude: venue.latitude?.toString() || '',
            longitude: venue.longitude?.toString() || '',
            phone: venue.phone || '',
            website: venue.website || '',
            neighborhood: venue.neighborhood || '',
            venue_type: venue.venue_type || '',
            google_place_id: venue.google_place_id || '',
            price_level: venue.price_level?.toString() || '',
            rating: venue.rating?.toString() || '',
            description: venue.description || '',
          });
        })
        .catch(() => setError('Failed to load venue'));
    }
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: form.name,
      address: form.address,
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
      phone: form.phone || null,
      website: form.website || null,
      neighborhood: form.neighborhood || null,
      venue_type: form.venue_type || null,
      google_place_id: form.google_place_id || null,
      price_level: form.price_level ? parseInt(form.price_level) : null,
      rating: form.rating ? parseFloat(form.rating) : null,
      description: form.description || null,
    };

    try {
      if (isEdit && id) {
        await venuesApi.update(id, payload);
      } else {
        await venuesApi.create(payload);
      }
      navigate('/venues');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <h1>{isEdit ? 'Edit Bar' : 'Add New Bar'}</h1>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Address *</label>
            <input name="address" value={form.address} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Latitude *</label>
            <input
              name="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Longitude *</label>
            <input
              name="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input name="website" value={form.website} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Neighborhood</label>
            <input name="neighborhood" value={form.neighborhood} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Venue Type</label>
            <select name="venue_type" value={form.venue_type} onChange={handleChange}>
              <option value="">Select type...</option>
              <option value="bar">Bar</option>
              <option value="restaurant">Restaurant</option>
              <option value="rooftop">Rooftop</option>
              <option value="brewery">Brewery</option>
              <option value="pub">Pub</option>
              <option value="lounge">Lounge</option>
              <option value="sports_bar">Sports Bar</option>
              <option value="wine_bar">Wine Bar</option>
              <option value="cocktail_bar">Cocktail Bar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Google Place ID</label>
            <input name="google_place_id" value={form.google_place_id} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Price Level (1-4)</label>
            <select name="price_level" value={form.price_level} onChange={handleChange}>
              <option value="">—</option>
              <option value="1">$ (Budget)</option>
              <option value="2">$$ (Moderate)</option>
              <option value="3">$$$ (Upscale)</option>
              <option value="4">$$$$ (Premium)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Rating (0-5)</label>
            <input
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Bar' : 'Create Bar'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/venues')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
