import PropTypes from 'prop-types'

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="l-nav">
        <div className="l-nav-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M3 3h18v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
          <span>SplitReceipt</span>
        </div>
        <div className="l-nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why us</a>
        </div>
        <div className="l-nav-actions">
          <button type="button" className="l-btn-text" onClick={onGetStarted}>
            Log in
          </button>
          <button type="button" className="l-btn-pill" onClick={onGetStarted}>
            Sign up free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="l-hero">
        <h1>
          Split any bill,<br />
          fairly and fast
        </h1>
        <p className="l-hero-sub">
          Snap a receipt. We read every item, tax, and tip with OCR — then
          split it proportionally so everyone pays exactly what they owe.
        </p>
        <div className="l-hero-btns">
          <button type="button" className="l-btn-white" onClick={onGetStarted}>
            Start splitting
          </button>
          <a href="#how" className="l-btn-outline">
            See how it works
          </a>
        </div>
      </section>

      {/* Demo mockup area */}
      <section className="l-demo">
        <div className="l-demo-window">
          <div className="l-demo-bar">
            <div className="l-dot" />
            <div className="l-dot" />
            <div className="l-dot" />
          </div>
          <div className="l-demo-body">
            <div className="l-demo-col">
              <div className="l-demo-label">Receipt items</div>
              <div className="l-demo-row"><span>Paneer Tikka</span><span>₹320</span></div>
              <div className="l-demo-row"><span>Butter Naan × 2</span><span>₹120</span></div>
              <div className="l-demo-row"><span>Dal Makhani</span><span>₹280</span></div>
              <div className="l-demo-row"><span>Masala Chai × 3</span><span>₹150</span></div>
              <div className="l-demo-row l-demo-total"><span>GST (5%)</span><span>₹43.50</span></div>
              <div className="l-demo-row l-demo-total"><span>Total</span><span>₹913.50</span></div>
            </div>
            <div className="l-demo-col">
              <div className="l-demo-label">Split result</div>
              <div className="l-demo-person">
                <div className="l-demo-avatar">B</div>
                <div><strong>Bhuvan</strong><br /><span className="l-demo-amt">₹365.40</span></div>
              </div>
              <div className="l-demo-person">
                <div className="l-demo-avatar">R</div>
                <div><strong>Rahul</strong><br /><span className="l-demo-amt">₹274.05</span></div>
              </div>
              <div className="l-demo-person">
                <div className="l-demo-avatar">A</div>
                <div><strong>Ananya</strong><br /><span className="l-demo-amt">₹274.05</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How */}
      <section className="l-section" id="how">
        <h2>How it works</h2>
        <div className="l-steps">
          <div className="l-step-card">
            <div className="l-step-num">1</div>
            <h3>Upload receipt</h3>
            <p>Take a photo. Our OCR reads every line — items, prices, taxes, service charges.</p>
          </div>
          <div className="l-step-card">
            <div className="l-step-num">2</div>
            <h3>Assign items</h3>
            <p>Add your group and tap to assign dishes. Shared items get split automatically.</p>
          </div>
          <div className="l-step-card">
            <div className="l-step-num">3</div>
            <h3>Get the split</h3>
            <p>Everyone's share includes proportional tax and service charge. Done in seconds.</p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="l-section" id="why">
        <h2>Built for real dinners</h2>
        <div className="l-features">
          <div className="l-feat">
            <h3>Instant OCR</h3>
            <p>No manual entry. Just a photo.</p>
          </div>
          <div className="l-feat">
            <h3>Editable results</h3>
            <p>Fix anything the scan got wrong.</p>
          </div>
          <div className="l-feat">
            <h3>Saved groups</h3>
            <p>Your crew is remembered next time.</p>
          </div>
          <div className="l-feat">
            <h3>Proportional tax</h3>
            <p>Taxes split by what you ate, not equally.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta">
        <h2>Stop doing bill math</h2>
        <p>Sign up in 10 seconds. No credit card.</p>
        <button type="button" className="l-btn-white" onClick={onGetStarted}>
          Create free account
        </button>
      </section>

      {/* Footer */}
      <footer className="l-footer">
        <span>SplitReceipt</span>
        <span>©Bhuvan S Shetty 2026</span>
      </footer>
    </div>
  )
}

LandingPage.propTypes = {
  onGetStarted: PropTypes.func.isRequired,
}

export default LandingPage
