import './App.css'

function App() {
  return (
    <main className="landing-page" aria-labelledby="page-title">
      <section className="hero-card">
        <div className="catalog-illustration" aria-hidden="true">
          <div className="bounce-house">
            <span className="roof" />
            <span className="tower tower-left" />
            <span className="tower tower-right" />
            <span className="door" />
          </div>
          <div className="catalog-lines">
            <span />
            <span />
            <span />
          </div>
        </div>

        <p className="eyebrow">Rental inventory marketplace</p>
        <h1 id="page-title">Bounce Base</h1>
        <p className="tagline">Find and compare bounce house rentals near you.</p>
        <p className="status">Inventory search is coming soon.</p>
      </section>
    </main>
  )
}

export default App
