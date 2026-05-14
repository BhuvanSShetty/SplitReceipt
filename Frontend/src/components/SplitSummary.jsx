import PropTypes from 'prop-types'

function SplitSummary({ splitResult, onBack, onReset, currency }) {
  return (
    <section className="panel results">
      <div className="panel-header">
        <h2>5. Final balances</h2>
        <span className="tag">Equal tax split</span>
      </div>
      {!splitResult ? (
        <div className="empty">
          <p>Finalize assignments to see who owes what.</p>
        </div>
      ) : (
        <div className="results-grid">
          {splitResult.perPerson.map((person) => (
            <div className="result" key={person.name}>
              <div className="result-header">
                <h3>{person.name}</h3>
                <strong>{currency(person.total)}</strong>
              </div>
              <div className="result-row">
                <span>Items</span>
                <span>{currency(person.subtotal)}</span>
              </div>
              <div className="result-row">
                <span>GST</span>
                <span>{currency(person.taxShare)}</span>
              </div>
              <div className="result-row">
                <span>Service</span>
                <span>{currency(person.serviceShare)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="step-actions">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onReset}>
          New receipt
        </button>
      </div>
    </section>
  )
}

SplitSummary.propTypes = {
  splitResult: PropTypes.shape({
    perPerson: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        total: PropTypes.number.isRequired,
        subtotal: PropTypes.number.isRequired,
        taxShare: PropTypes.number.isRequired,
        serviceShare: PropTypes.number.isRequired,
      })
    ),
  }),
  onBack: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  currency: PropTypes.func.isRequired,
}

SplitSummary.defaultProps = {
  splitResult: null,
}

export default SplitSummary
