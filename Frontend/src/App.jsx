import { useEffect, useMemo, useState } from 'react'
import AddMembers from './components/AddMembers.jsx'
import ItemAssignment from './components/ItemAssignment.jsx'
import LoginPage from './components/LoginPage.jsx'
import RegisterPage from './components/RegisterPage.jsx'
import ReceiptCard from './components/ReceiptCard.jsx'
import SplitSummary from './components/SplitSummary.jsx'
import LandingPage from './components/LandingPage.jsx'
import ParticleCanvas from './components/ParticleCanvas.jsx'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050'

const currency = (value) => {
  const amount = Number(value) || 0
  return `INR ${amount.toFixed(2)}`
}

function App() {
  const [step, setStep] = useState('landing')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [preprocessedUrl, setPreprocessedUrl] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [people, setPeople] = useState([])
  const [personInput, setPersonInput] = useState('')
  const [assignments, setAssignments] = useState({})
  const [splitResult, setSplitResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingItems, setEditingItems] = useState({})
  const [itemEdits, setItemEdits] = useState({})
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '1' })
  const [authError, setAuthError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    members: '',
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

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

  const updateLoginForm = (field, value) => {
    setLoginForm({ ...loginForm, [field]: value })
  }

  const handleLogin = async () => {
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Login failed.')
      }
      setPeople(payload.user.members || [])
      setCurrentUser(payload.user)
      setLoginForm({ email: '', password: '' })
      setIsAuthenticated(true)
      setStep('upload')
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const updateRegisterForm = (field, value) => {
    setRegisterForm({ ...registerForm, [field]: value })
  }

  const handleRegister = async () => {
    setAuthError('')
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          members: registerForm.members,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Registration failed.')
      }
      setRegisterForm({ name: '', email: '', password: '', members: '' })
      setPeople(payload.user.members || [])
      setCurrentUser(payload.user)
      setIsAuthenticated(true)
      setStep('upload')
    } catch (err) {
      setAuthError(err.message)
    }
  }

  const fetchSession = async () => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      })
      if (!response.ok) {
        setIsAuthenticated(false)
        return
      }
      const payload = await response.json()
      setPeople(payload.user.members || [])
      setCurrentUser(payload.user)
      setIsAuthenticated(true)
      if (step === 'landing' || step === 'login' || step === 'register') {
        setStep('upload')
      }
    } catch (err) {
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated && step !== 'landing' && step !== 'login' && step !== 'register') {
      setStep('login')
    }
  }, [authLoading, isAuthenticated, step])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      // best effort
    }
    setIsAuthenticated(false)
    setCurrentUser(null)
    setPeople([])
    setReceipt(null)
    setAssignments({})
    setSplitResult(null)
    setFile(null)
    setPreviewUrl('')
    setPreprocessedUrl('')
    setWarnings([])
    setError('')
    setEditingItems({})
    setItemEdits({})
    setNewItem({ name: '', price: '', quantity: '1' })
    setPersonInput('')
    setAuthError('')
    setLoginForm({ email: '', password: '' })
    setRegisterForm({ name: '', email: '', password: '', members: '' })
    setStep('landing')
  }

  // Compress image on the client to avoid timeout on free-tier hosting
  const compressImage = (imageFile, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => resolve(new File([blob], imageFile.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        )
      }
      img.src = URL.createObjectURL(imageFile)
    })
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Upload a receipt photo to continue.')
      return
    }

    setLoading(true)
    setError('')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('image', compressed)

      const response = await fetch(`${API_BASE}/api/receipt/analyze`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || 'Receipt analysis failed.')
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
      if (err.name === 'AbortError') {
        setError('Request timed out. Try a clearer or smaller photo.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      clearTimeout(timeout)
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
      [item.id]: {
        name: item.name,
        price: String(item.price ?? ''),
        quantity: String(item.quantity ?? 1),
      },
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
        quantity: Number(edit.quantity) || 1,
      }
    })
    setReceipt({ ...receipt, items: nextItems })
    setEditingItems({ ...editingItems, [itemId]: false })
  }

  const updateNewItem = (field, value) => {
    setNewItem({ ...newItem, [field]: value })
  }

  const addManualItem = () => {
    if (!receipt) return
    const trimmedName = newItem.name.trim()
    const price = Number(newItem.price)
    const quantity = Number(newItem.quantity) || 1
    if (!trimmedName || !Number.isFinite(price) || price <= 0) return

    const itemId = `manual-${Date.now()}`
    const updatedItems = [
      ...receipt.items,
      {
        id: itemId,
        name: trimmedName,
        price,
        quantity,
      },
    ]
    setReceipt({ ...receipt, items: updatedItems })
    setAssignments({ ...assignments, [itemId]: [] })
    setNewItem({ name: '', price: '', quantity: '1' })
  }

  const cancelItemEdit = (itemId) => {
    setEditingItems({ ...editingItems, [itemId]: false })
  }

  const handleSplit = async (overrideAssignments) => {
    if (!receipt) return
    const resolvedAssignments =
      overrideAssignments && overrideAssignments.target
        ? assignments
        : overrideAssignments || assignments
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/receipt/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receipt,
          people,
          assignments: resolvedAssignments,
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

  // Landing page
  if (step === 'landing') {
    return (
      <>
        <ParticleCanvas />
        <LandingPage onGetStarted={() => setStep('login')} />
      </>
    )
  }

  // Auth pages
  if (step === 'login') {
    return (
      <>
        <ParticleCanvas />
        <div className="auth-container">
          <LoginPage
            email={loginForm.email}
            password={loginForm.password}
            error={authError}
            onFieldChange={updateLoginForm}
            onLogin={handleLogin}
            onShowRegister={() => setStep('register')}
            onBackToLanding={() => setStep('landing')}
          />
        </div>
      </>
    )
  }

  if (step === 'register') {
    return (
      <>
        <ParticleCanvas />
        <div className="auth-container">
          <RegisterPage
            name={registerForm.name}
            email={registerForm.email}
            password={registerForm.password}
            members={registerForm.members}
            error={authError}
            onFieldChange={updateRegisterForm}
            onRegister={handleRegister}
            onBackToLogin={() => setStep('login')}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <ParticleCanvas />
      <div className="app-shell">
        {/* Top bar */}
        {isAuthenticated && (
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-brand">SplitReceipt</span>
            </div>
            <nav className="topbar-steps">
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
            <div className="topbar-right">
              <span className="topbar-user">{currentUser?.email || ''}</span>
              <button type="button" className="ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </header>
        )}

        {/* Main content */}
        <main className={`app-content ${step === 'assign' ? 'app-content--wide' : ''}`}>
          {step === 'upload' && (
            <section className="panel">
              <div className="panel-header">
                <h2>Upload receipt</h2>
                <span className="tag">Step 1</span>
              </div>
              <p className="panel-subtitle">
                Take a crisp, top-down photo for the best OCR result.
              </p>
              <label className="file-drop">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <div className="file-drop-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--grey-3)'}}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div>
                    <strong>Click to upload</strong>
                    <span>JPG or PNG, under 2 MB</span>
                  </div>
                </div>
              </label>
              {previewUrl ? (
                <div className="preview">
                  <img src={previewUrl} alt="Receipt preview" />
                </div>
              ) : (
                <div className="preview placeholder">
                  <p>No photo selected yet</p>
                </div>
              )}
              {preprocessedUrl && (
                <div className="preview">
                  <img src={preprocessedUrl} alt="Preprocessed for OCR" />
                </div>
              )}
              <button className="primary" type="button" onClick={handleAnalyze} disabled={loading}>
                {loading ? 'Analyzing…' : 'Analyze receipt'}
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
            <div className="assign-grid">
              <ReceiptCard
                receipt={receipt}
                totals={totals}
                editingItems={editingItems}
                itemEdits={itemEdits}
                onStartEdit={startEditItem}
                onUpdateEdit={updateItemEdit}
                onSaveEdit={saveItemEdit}
                onCancelEdit={cancelItemEdit}
                newItem={newItem}
                onNewItemChange={updateNewItem}
                onAddItem={addManualItem}
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
                error={error}
                loading={loading}
                currency={currency}
              />
            </div>
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
    </>
  )
}

export default App
