import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

function ReceiptHistory({ API_BASE, authFetch, currency }) {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedReceipt, setExpandedReceipt] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const response = await authFetch(`${API_BASE}/api/v1/receipt/history?page=${page}&limit=5`)
        if (!response.ok) {
          throw new Error('Failed to fetch history')
        }
        const data = await response.json()
        setReceipts(data.receipts)
        setTotalPages(data.totalPages)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [API_BASE, authFetch, page])

  const toggleExpand = (id) => {
    if (expandedReceipt === id) {
      setExpandedReceipt(null)
    } else {
      setExpandedReceipt(id)
    }
  }

  return (
    <section className="panel history">
      <div className="panel-header">
        <h2>Previous Receipts</h2>
      </div>
      {loading ? (
        <div className="empty">
          <p>Loading history...</p>
        </div>
      ) : error ? (
        <div className="empty">
          <p className="error" style={{ color: 'var(--red)' }}>{error}</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="empty">
          <p>No previous receipts found.</p>
        </div>
      ) : (
        <>
          <div className="items" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {receipts.map((rec) => (
              <div className="item" key={rec._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <div 
                  onClick={() => toggleExpand(rec._id)} 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                >
                  <div>
                    <p style={{ fontWeight: '500', color: 'var(--white)' }}>
                      {new Date(rec.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                      {rec.items.length} items
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{currency(rec.total)}</span>
                    <button type="button" className="ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', pointerEvents: 'none' }}>
                      {expandedReceipt === rec._id ? 'Hide' : 'View Split'}
                    </button>
                  </div>
                </div>
                
                {expandedReceipt === rec._id && (
                  <div className="receipt-details" style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', width: '100%' }}>
                    <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '8px' }}>Items</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {rec.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--white)' }}>{item.name} <span style={{ color: 'var(--gray)' }}>x{item.quantity || 1}</span></span>
                          <span style={{ color: 'var(--white)' }}>{currency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {rec.splitResult && rec.splitResult.perPerson && (
                      <>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--gray)', marginTop: '16px', marginBottom: '8px' }}>Split Summary (Who pays what)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {rec.splitResult.perPerson.map((person) => (
                            <div key={person.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--white)', fontWeight: '500' }}>{person.name}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: '500' }}>{currency(person.total)}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray)', paddingLeft: '8px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                  <span>Subtotal:</span>
                                  <span>{currency(person.subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                  <span>Taxes & Fees:</span>
                                  <span>{currency(person.taxShare + person.serviceShare)}</span>
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>Items:</span>
                                  <ul style={{ listStyle: 'none', paddingLeft: '8px', margin: 0 }}>
                                    {person.itemShares.map((share, idx) => (
                                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span>{share.itemName}</span>
                                        <span>{currency(share.amount)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px' }}>
            <button 
              type="button" 
              className="ghost" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '6px 12px' }}
            >
              Previous
            </button>
            <span style={{ color: 'var(--gray)' }}>Page {page} of {totalPages}</span>
            <button 
              type="button" 
              className="ghost" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '6px 12px' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  )
}

ReceiptHistory.propTypes = {
  API_BASE: PropTypes.string.isRequired,
  authFetch: PropTypes.func.isRequired,
  currency: PropTypes.func.isRequired,
}

export default ReceiptHistory
