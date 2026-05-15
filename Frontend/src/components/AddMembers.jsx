import PropTypes from 'prop-types'

function AddMembers({
  people,
  personInput,
  onPersonInputChange,
  onAddPerson,
  onRemovePerson,
  onBack,
  onNext,
}) {
  return (
    <section className="panel people">
      <div className="panel-header">
        <h2>2. Add members</h2>
        <span className="tag">{people.length} diners</span>
      </div>
      <div className="input-row">
        <input
          type="text"
          placeholder="Add a person"
          value={personInput}
          onChange={(event) => onPersonInputChange(event.target.value)}
        />
        <button type="button" className="ghost" onClick={onAddPerson}>
          Add
        </button>
      </div>
      <div className="pill-row">
        {people.map((name) => (
          <span className="pill" key={name}>
            {name}
            <button type="button" onClick={() => onRemovePerson(name)}>
              Remove
            </button>
          </span>
        ))}
      </div>
      <div className="step-actions">
        <button type="button" className="ghost" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="primary"
          onClick={onNext}
          disabled={people.length === 0}
        >
          Assign Items
        </button>
      </div>
    </section>
  )
}

AddMembers.propTypes = {
  people: PropTypes.arrayOf(PropTypes.string).isRequired,
  personInput: PropTypes.string.isRequired,
  onPersonInputChange: PropTypes.func.isRequired,
  onAddPerson: PropTypes.func.isRequired,
  onRemovePerson: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
}

export default AddMembers
