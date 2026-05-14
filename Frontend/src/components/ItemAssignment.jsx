import PropTypes from 'prop-types'

function ItemAssignment({
  receipt,
  people,
  assignments,
  onSetQuantity,
  onAssignEveryone,
  onClearAssignments,
  onSplit,
  onSplitEqually,
  onBack,
  error,
  loading,
  currency,
}) {
  return (
    <section className="panel assign">
      <div className="panel-header">
        <h2>4. Assign items</h2>
        <span className="tag">Split rules</span>
      </div>
      {!receipt ? (
        <div className="empty">
          <p>Items will appear here after analysis.</p>
        </div>
      ) : (
        <div className="assignments">
          {receipt.items.map((item) => {
            const itemAssignment = assignments[item.id] || {}
            const totalAssigned = Object.values(itemAssignment).reduce((s, v) => s + v, 0)
            const qty = item.quantity || 1

            return (
              <div className="assignment" key={item.id}>
                <div className="assignment-header">
                  <div>
                    <p className="item-name">
                      {item.name}
                      {qty > 1 && <span className="qty-badge"> ×{qty}</span>}
                    </p>
                    <p className="item-meta">
                      {currency(item.price)}
                      {qty > 1 && (
                        <span className="unit-price"> ({currency(item.price / qty)} each)</span>
                      )}
                    </p>
                    {qty > 1 && totalAssigned > 0 && (
                      <p className="qty-status" style={{ fontSize: '0.75rem', color: totalAssigned === qty ? 'var(--green, #22c55e)' : 'var(--amber, #f59e0b)', marginTop: '2px' }}>
                        {totalAssigned}/{qty} assigned
                      </p>
                    )}
                  </div>
                  <div className="assignment-actions">
                    <button type="button" onClick={() => onAssignEveryone(item.id)}>
                      Everyone
                    </button>
                    <button type="button" onClick={() => onClearAssignments(item.id)}>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="checkbox-row">
                  {people.map((name) => {
                    const personQty = itemAssignment[name] || 0

                    if (qty <= 1) {
                      // Simple checkbox for single-quantity items
                      return (
                        <label key={name} className="checkbox">
                          <input
                            type="checkbox"
                            checked={personQty > 0}
                            onChange={() => onSetQuantity(item.id, name, personQty > 0 ? 0 : 1)}
                          />
                          <span>{name}</span>
                        </label>
                      )
                    }

                    // Quantity selector for multi-quantity items
                    const maxCanAssign = qty - totalAssigned + personQty
                    return (
                      <div key={name} className="qty-assign">
                        <span className="qty-assign-name">{name}</span>
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={personQty <= 0}
                            onClick={() => onSetQuantity(item.id, name, personQty - 1)}
                          >
                            −
                          </button>
                          <span className="qty-value">{personQty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            disabled={personQty >= maxCanAssign}
                            onClick={() => onSetQuantity(item.id, name, personQty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="step-actions">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onSplitEqually}
          disabled={!receipt || loading || people.length === 0}
        >
          Split entire bill equally
        </button>
        <button
          className="primary"
          type="button"
          onClick={() => onSplit()}
          disabled={!receipt || loading}
        >
          {loading ? 'Splitting...' : 'Generate split'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  )
}

ItemAssignment.propTypes = {
  receipt: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number,
      })
    ),
  }),
  people: PropTypes.arrayOf(PropTypes.string).isRequired,
  assignments: PropTypes.object.isRequired,
  onSetQuantity: PropTypes.func.isRequired,
  onAssignEveryone: PropTypes.func.isRequired,
  onClearAssignments: PropTypes.func.isRequired,
  onSplit: PropTypes.func.isRequired,
  onSplitEqually: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  currency: PropTypes.func.isRequired,
}

ItemAssignment.defaultProps = {
  receipt: null,
  error: '',
}

export default ItemAssignment
