import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionsApi } from '../../services/adminApi'
import type { Submission } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  new_deal: 'New Deal',
  deal_update: 'Deal Update',
  deal_expired: 'Deal Expired',
  new_bar: 'New Bar',
  bar_closed: 'Bar Closed',
  bar_update: 'Bar Update',
}

const AUTO_APPLY_DESCRIPTION: Record<string, string> = {
  new_bar: 'A new bar will be created with the submitted data.',
  bar_closed: 'The related bar will be marked as closed (inactive).',
  bar_update: 'The related bar will be updated with the submitted data.',
  new_deal: 'A new deal will be created with the submitted data.',
  deal_expired: 'The related deal will be marked as expired (inactive).',
  deal_update: 'The related deal will be updated with the submitted data.',
}

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sub, setSub] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    submissionsApi.get(id!).then(data => {
      setSub(data)
      setLoading(false)
    })
  }, [id])

  async function handleReview(status: 'approved' | 'rejected') {
    setSubmitting(true)
    setResult(null)
    try {
      await submissionsApi.review(id!, { status, admin_notes: adminNotes || undefined })
      setResult(status === 'approved' ? 'Approved! Changes applied.' : 'Rejected.')
      setTimeout(() => navigate('/submissions'), 1500)
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!sub) return <div className="error">Submission not found</div>

  const isPending = sub.status === 'pending'

  return (
    <div className="review-detail">
      <button className="back-btn" onClick={() => navigate('/submissions')}>← Back</button>

      <div className="page-header">
        <h1>{TYPE_LABELS[sub.submission_type] ?? sub.submission_type}</h1>
        <span className={`status-pill status-${sub.status}`}>
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>
      </div>

      <div className="detail-meta">
        <span>Submitted by <strong>{sub.submitter_username}</strong></span>
        <span>{new Date(sub.created_at).toLocaleString()}</span>
        {sub.points_awarded > 0 && <span className="points-awarded">+{sub.points_awarded} pts awarded</span>}
      </div>

      {isPending && (
        <div className="auto-apply-notice">
          <strong>On approval:</strong> {AUTO_APPLY_DESCRIPTION[sub.submission_type]}
        </div>
      )}

      <div className="detail-section">
        <h3>Submitted Data</h3>
        <pre className="json-block">{JSON.stringify(sub.submitted_data, null, 2)}</pre>
      </div>

      {sub.related_bar_id && (
        <div className="detail-section">
          <h3>Related Bar ID</h3>
          <code>{sub.related_bar_id}</code>
        </div>
      )}
      {sub.related_deal_id && (
        <div className="detail-section">
          <h3>Related Deal ID</h3>
          <code>{sub.related_deal_id}</code>
        </div>
      )}

      {isPending ? (
        <div className="review-actions">
          <div className="form-group">
            <label htmlFor="notes">Admin Notes (optional)</label>
            <textarea
              id="notes"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Reason for rejection, corrections made, etc."
              rows={3}
            />
          </div>
          {result && <div className={`result-msg ${result.startsWith('Error') ? 'error' : 'success'}`}>{result}</div>}
          <div className="review-btns">
            <button
              className="btn btn-approve"
              onClick={() => handleReview('approved')}
              disabled={submitting}
            >
              Approve & Apply
            </button>
            <button
              className="btn btn-reject"
              onClick={() => handleReview('rejected')}
              disabled={submitting}
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-section">
          <h3>Review Decision</h3>
          <p><strong>Status:</strong> {sub.status}</p>
          {sub.admin_notes && <p><strong>Notes:</strong> {sub.admin_notes}</p>}
          {sub.reviewed_at && <p><strong>Reviewed at:</strong> {new Date(sub.reviewed_at).toLocaleString()}</p>}
        </div>
      )}
    </div>
  )
}
