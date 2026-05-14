import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

function ReceiptCard({
  receipt,
  totals,
  editingItems,
  itemEdits,
  onStartEdit,
  onUpdateEdit,
  onSaveEdit,
  onCancelEdit,
  newItem,
  onNewItemChange,
  onAddItem,
  onUpdateTotals,
  currency,
}) {
  const [isEditingTotals, setIsEditingTotals] = useState(false)
  const [editedTaxes, setEditedTaxes] = useState(0)
  const [editedService, setEditedService] = useState(0)

  useEffect(() => {
    if (totals) {
      setEditedTaxes(totals.taxes)
      setEditedService(totals.service)
    }
  }, [totals, isEditingTotals])

  const handleSaveTotals = () => {
    onUpdateTotals(Number(editedTaxes) || 0, Number(editedService) || 0)
    setIsEditingTotals(false)
  }
  return (
    <section className="panel receipt">
      <div className="panel-header">
        <h2>3. Confirm items</h2>
        <span className="tag">{receipt ? receipt.source : 'Waiting'}</span>
      </div>
      {!receipt ? (
        <div className="empty">
          <p>Analyze a receipt to view extracted items.</p>
        </div>
      ) : (
        <>
          <div className="items">
            {receipt.items.map((item) => (
              <div className="item" key={item.id}>
                <div>
                  {editingItems[item.id] ? (
                    <div className="edit-fields">
                      <input
                        type="text"
                        value={itemEdits[item.id]?.name || ''}
                        onChange={(event) =>
                          onUpdateEdit(item.id, 'name', event.target.value)
                        }
                      />
                      <input
                        type="number"
                        value={itemEdits[item.id]?.price || ''}
                        onChange={(event) =>
                          onUpdateEdit(item.id, 'price', event.target.value)
                        }
                      />
                      <input
                        type="number"
                        value={itemEdits[item.id]?.quantity || ''}
                        onChange={(event) =>
                          onUpdateEdit(item.id, 'quantity', event.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <p className="item-name">{item.name}</p>
                      <p className="item-meta">
                        Item ID {item.id} · Qty {item.quantity || 1}
                      </p>
                    </>
                  )}
                </div>
                <div className="item-actions">
                  <span className="amount">{currency(item.price)}</span>
                  {editingItems[item.id] ? (
                    <div className="edit-actions">
                      <button type="button" onClick={() => onSaveEdit(item.id)}>
                        Save
                      </button>
                      <button type="button" onClick={() => onCancelEdit(item.id)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => onStartEdit(item)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="add-item">
            <div className="edit-fields">
              <input
                type="text"
                value={newItem.name}
                onChange={(event) => onNewItemChange('name', event.target.value)}
                placeholder="Add item name"
              />
              <input
                type="number"
                value={newItem.price}
                onChange={(event) => onNewItemChange('price', event.target.value)}
                placeholder="Price"
              />
              <input
                type="number"
                value={newItem.quantity}
                onChange={(event) => onNewItemChange('quantity', event.target.value)}
                placeholder="Qty"
              />
            </div>
            <button type="button" className="secondary" onClick={onAddItem}>
              Add item
            </button>
          </div>
          <div className="totals">
            <div>
              <span>Items</span>
              <strong>{currency(totals.itemTotal)}</strong>
            </div>
            {isEditingTotals ? (
              <>
                <div>
                  <span>GST / Taxes</span>
                  <input
                    type="number"
                    value={editedTaxes}
                    onChange={(e) => setEditedTaxes(e.target.value)}
                    style={{ width: '100px', textAlign: 'right', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--white)' }}
                  />
                </div>
                <div>
                  <span>Service</span>
                  <input
                    type="number"
                    value={editedService}
                    onChange={(e) => setEditedService(e.target.value)}
                    style={{ width: '100px', textAlign: 'right', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--white)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button type="button" className="ghost" onClick={handleSaveTotals} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Save</button>
                  <button type="button" className="ghost" onClick={() => setIsEditingTotals(false)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>GST / Taxes</span>
                  <strong>{currency(totals.taxes)}</strong>
                </div>
                <div>
                  <span>Service</span>
                  <strong>{currency(totals.service)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="ghost" onClick={() => setIsEditingTotals(true)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                    Edit Taxes/Service
                  </button>
                </div>
              </>
            )}
            <div className="grand">
              <span>Total</span>
              <strong>{currency(totals.grand)}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

ReceiptCard.propTypes = {
  receipt: PropTypes.shape({
    source: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
      })
    ),
  }),
  totals: PropTypes.shape({
    itemTotal: PropTypes.number.isRequired,
    taxes: PropTypes.number.isRequired,
    service: PropTypes.number.isRequired,
    grand: PropTypes.number.isRequired,
  }),
  editingItems: PropTypes.object.isRequired,
  itemEdits: PropTypes.object.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onUpdateEdit: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  newItem: PropTypes.shape({
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    quantity: PropTypes.string.isRequired,
  }).isRequired,
  onNewItemChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onUpdateTotals: PropTypes.func.isRequired,
  currency: PropTypes.func.isRequired,
}

ReceiptCard.defaultProps = {
  receipt: null,
  totals: null,
}

export default ReceiptCard
