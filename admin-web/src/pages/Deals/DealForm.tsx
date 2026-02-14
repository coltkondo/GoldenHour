import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dealsApi, venuesApi } from '../../services/adminApi'
import { Venue } from '../../types'

interface FormData {
  venue_id: string
  title: string
  description: string
  category: string
  deal_type: string
  original_price: string
  deal_price: string
  discount_percentage: string
  items: string
}

const emptyForm: FormData = {
  venue_id: '', title: '', description: '', category: 'drinks',
  deal_type: 'special_price', original_price: '', deal_price: '',
  discount_percentage: '', items: '',
}

export default function DealForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormData>(emptyForm)
  const [venues, setVenues] = useState<Venue[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    venuesApi.list({ limit: 200, active_only: true }).then((v) => setVenues(v as Venue[])).catch(() => {})
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      dealsApi.get(id).then((deal) => {
        setForm({
          venue_id: deal.venue_id || '',
          title: deal.title || '',
          description: deal.description || '',
          category: deal.category || 'drinks',
          deal_type: deal.deal_type || 'special_price',
          original_price: deal.original_price?.toString() || '',
          deal_price: deal.deal_price?.toString() || '',
          discount_percentage: deal.discount_percentage?.toString() || '',
          items: deal.items?.join(', ') || '',
        })
      }).catch(() => setError('Failed to load deal'))
    }
  }, [id, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload: any = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      deal_type: form.deal_type,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      deal_price: form.deal_price ? parseFloat(form.deal_price) : null,
      discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
      items: form.items ? form.items.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    try {
      if (isEdit && id) {
        await dealsApi.update(id, payload)
      } else {
        payload.venue_id = form.venue_id
        await dealsApi.create(payload)
      }
      navigate('/deals')
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="page">
      <h1>{isEdit ? 'Edit Deal' : 'Add New Deal'}</h1>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          {!isEdit && (
            <div className="form-group">
              <label>Bar *</label>
              <select name="venue_id" value={form.venue_id} onChange={handleChange} required>
                <option value="">Select a bar...</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="drinks">Drinks</option>
              <option value="food">Food</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label>Deal Type</label>
            <select name="deal_type" value={form.deal_type} onChange={handleChange}>
              <option value="special_price">Special Price</option>
              <option value="discount">Discount</option>
              <option value="bogo">BOGO</option>
              <option value="free">Free</option>
            </select>
          </div>
          <div className="form-group">
            <label>Original Price</label>
            <input name="original_price" type="number" step="0.01" min="0" value={form.original_price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Deal Price</label>
            <input name="deal_price" type="number" step="0.01" min="0" value={form.deal_price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Discount %</label>
            <input name="discount_percentage" type="number" step="1" min="0" max="100" value={form.discount_percentage} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group full-width">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
        </div>
        <div className="form-group full-width">
          <label>Items (comma-separated)</label>
          <input name="items" value={form.items} onChange={handleChange} placeholder="Well drinks, House wine, Draft beer" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/deals')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
