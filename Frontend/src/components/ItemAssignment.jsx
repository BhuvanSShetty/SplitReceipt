import PropTypes from 'prop-types'

function ItemAssignment({
  receipt,
  people,
  assignments,
  onToggleAssignment,
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
          {receipt.items.map((item) => (
            <div className="assignment" key={item.id}>
              <div className="assignment-header">
                <div>
                  <p className="item-name">{item.name}</p>
                  <p className="item-meta">{currency(item.price)}</p>
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
                {people.map((name) => (
                  <label key={name} className="checkbox">
                    <input
                      type="checkbox"
                      checked={(assignments[item.id] || []).includes(name)}
                      onChange={() => onToggleAssignment(item.id, name)}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
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
      })
    ),
  }),
  people: PropTypes.arrayOf(PropTypes.string).isRequired,
  assignments: PropTypes.object.isRequired,
  onToggleAssignment: PropTypes.func.isRequired,
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
