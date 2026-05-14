import { useMemo, useState } from 'react'
import AddMembers from './components/AddMembers.jsx'
import ItemAssignment from './components/ItemAssignment.jsx'
import ReceiptCard from './components/ReceiptCard.jsx'
import SplitSummary from './components/SplitSummary.jsx'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const currency = (value) => {
  const amount = Number(value) || 0
  return `INR ${amount.toFixed(2)}`
}

function App() {
  const [step, setStep] = useState('upload')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [preprocessedUrl, setPreprocessedUrl] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [people, setPeople] = useState(['Bhuvan', 'Rahul', 'Aman'])
  const [personInput, setPersonInput] = useState('')
  const [assignments, setAssignments] = useState({})
  const [splitResult, setSplitResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingItems, setEditingItems] = useState({})
  const [itemEdits, setItemEdits] = useState({})

  const totals = useMemo(() => {
    if (!receipt) return null
    const itemTotal = receipt.items.reduce((sum, item) => sum + item.price, 0)
    const taxes = receipt.taxes.reduce((sum, tax) => sum + tax.amount, 0)
    const service = receipt.serviceCharges.reduce((sum, fee) => sum + fee.amount, 0)
    return {
      itemTotal,
      taxes,
      service,
      grand: itemTotal + taxes + service,
    }
  }, [receipt])

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return
    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
    setPreprocessedUrl('')
    setReceipt(null)
    setWarnings([])
    setAssignments({})
    setSplitResult(null)
    setError('')
    setEditingItems({})
    setItemEdits({})
    setStep('upload')
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Upload a receipt photo to continue.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${API_BASE}/api/receipt/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Receipt analysis failed.')
      }

      const payload = await response.json()
      setReceipt(payload.receipt)
      setPreprocessedUrl(payload.preprocessedImage || '')
      setWarnings(payload.warnings || [])

      const nextAssignments = {}
      payload.receipt.items.forEach((item) => {
        nextAssignments[item.id] = []
      })
      setAssignments(nextAssignments)
      setStep('members')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPerson = () => {
    const trimmed = personInput.trim()
    if (!trimmed) return
    if (people.includes(trimmed)) {
      setPersonInput('')
      return
    }
    setPeople([...people, trimmed])
    setPersonInput('')
  }

  const handleRemovePerson = (name) => {
    setPeople(people.filter((person) => person !== name))
    const nextAssignments = { ...assignments }
    Object.keys(nextAssignments).forEach((itemId) => {
      nextAssignments[itemId] = nextAssignments[itemId].filter(
        (person) => person !== name
      )
    })
    setAssignments(nextAssignments)
  }

  const toggleAssignment = (itemId, name) => {
    const current = assignments[itemId] || []
    const exists = current.includes(name)
    const next = exists
      ? current.filter((person) => person !== name)
      : [...current, name]
    setAssignments({ ...assignments, [itemId]: next })
  }

  const assignEveryone = (itemId) => {
    setAssignments({ ...assignments, [itemId]: [...people] })
  }

  const clearAssignments = (itemId) => {
    setAssignments({ ...assignments, [itemId]: [] })
  }

  const startEditItem = (item) => {
    setEditingItems({ ...editingItems, [item.id]: true })
    setItemEdits({
      ...itemEdits,
      [item.id]: { name: item.name, price: String(item.price ?? '') },
    })
  }

  const updateItemEdit = (itemId, field, value) => {
    setItemEdits({
      ...itemEdits,
      [itemId]: { ...itemEdits[itemId], [field]: value },
    })
  }

  const saveItemEdit = (itemId) => {
    if (!receipt) return
    const edit = itemEdits[itemId]
    if (!edit) return
    const nextItems = receipt.items.map((item) => {
      if (item.id !== itemId) return item
      return {
        ...item,
        name: edit.name.trim() || item.name,
        price: Number(edit.price) || 0,
      }
    })
    setReceipt({ ...receipt, items: nextItems })
    setEditingItems({ ...editingItems, [itemId]: false })
  }

  const cancelItemEdit = (itemId) => {
    setEditingItems({ ...editingItems, [itemId]: false })
  }

  const handleSplit = async (overrideAssignments) => {
    if (!receipt) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/receipt/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt,
          people,
          assignments: overrideAssignments || assignments,
        }),
      })

      if (!response.ok) {
        throw new Error('Split calculation failed.')
      }

      const payload = await response.json()
      setSplitResult(payload)
      setStep('results')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSplitEqually = async () => {
    if (!receipt || people.length === 0) return
    const nextAssignments = {}
    receipt.items.forEach((item) => {
      nextAssignments[item.id] = [...people]
    })
    setAssignments(nextAssignments)
    await handleSplit(nextAssignments)
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Receipt split studio</p>
          <h1>Upload a bill. Assign items. Split the total in seconds.</h1>
          <p className="subtitle">
            OCR extracts items, AI tags prices, and the split screen allocates
            GST and service charges proportionally.
          </p>
        </div>
        <div className="hero-card">
          <h2>How it works</h2>
          <ol>
            <li>Drop a restaurant photo.</li>
            <li>Confirm items and assign people.</li>
            <li>Generate the final balance sheet.</li>
          </ol>
        </div>
      </header>

      <nav className="steps">
        {['upload', 'members', 'assign', 'results'].map((key, index) => (
          <button
            key={key}
            type="button"
            className={`step ${step === key ? 'active' : ''}`}
            onClick={() => setStep(key)}
            disabled={key !== 'upload' && !receipt}
          >
            <span>{index + 1}</span>
            {key}
          </button>
        ))}
      </nav>

      <main className="layout">
        {step === 'upload' && (
          <section className="panel upload">
          <div className="panel-header">
            <h2>1. Upload receipt</h2>
            <span className="tag">Image only</span>
          </div>
          <p className="panel-subtitle">
            Use a crisp, top-down photo for the cleanest OCR result.
          </p>
          <label className="file-drop">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <div>
              <strong>Choose a file</strong>
              <span>JPG or PNG, under 2 MB</span>
            </div>
          </label>
          {previewUrl ? (
            <div className="preview">
              <img src={previewUrl} alt="Receipt preview" />
            </div>
          ) : (
            <div className="preview placeholder">
              <p>No photo selected yet.</p>
            </div>
          )}
          {preprocessedUrl && (
            <div className="preview">
              <img src={preprocessedUrl} alt="Preprocessed for OCR" />
            </div>
          )}
          <button className="primary" type="button" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Run OCR + AI'}
          </button>
          {error && <p className="error">{error}</p>}
          {warnings.length > 0 && (
            <div className="warning">
              <p>Heads up</p>
              <ul>
                {warnings.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        )}

        {step === 'members' && (
          <AddMembers
            people={people}
            personInput={personInput}
            onPersonInputChange={setPersonInput}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
            onBack={() => setStep('upload')}
            onNext={() => setStep('assign')}
          />
        )}

        {step === 'assign' && (
          <>
            <ReceiptCard
              receipt={receipt}
              totals={totals}
              editingItems={editingItems}
              itemEdits={itemEdits}
              onStartEdit={startEditItem}
              onUpdateEdit={updateItemEdit}
              onSaveEdit={saveItemEdit}
              onCancelEdit={cancelItemEdit}
              currency={currency}
            />
            <ItemAssignment
              receipt={receipt}
              people={people}
              assignments={assignments}
              onToggleAssignment={toggleAssignment}
              onAssignEveryone={assignEveryone}
              onClearAssignments={clearAssignments}
              onSplit={handleSplit}
              onSplitEqually={handleSplitEqually}
              onBack={() => setStep('members')}
              loading={loading}
              currency={currency}
            />
          </>
        )}

        {step === 'results' && (
          <SplitSummary
            splitResult={splitResult}
            onBack={() => setStep('assign')}
            onReset={() => setStep('upload')}
            currency={currency}
          />
        )}
      </main>
    </div>
  )
}

export default App
