import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BounceCard } from './components/BounceCard'
import { BounceDetailModal } from './components/BounceDetailModal'
import { EmptyState } from './components/EmptyState'
import { ErrorState } from './components/ErrorState'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { LoadingState } from './components/LoadingState'
import { buildCatalogHref, getHomeHref, readAppRoute } from './lib/catalogNavigation'
import { defaultFilters, filterBounces, hasActiveFilters } from './lib/filterBounces'
import { useBounces } from './hooks/useBounces'
import type { Bounce, BounceFilters } from './types/bounce'

function App() {
  const { bounces, isLoading, error, retry } = useBounces()
  const [route, setRoute] = useState(() => readAppRoute(window.location))
  const [selectedBounce, setSelectedBounce] = useState<Bounce | null>(null)
  const { view, filters } = route
  const activeFilters = hasActiveFilters(filters)
  const filteredBounces = useMemo(() => filterBounces(bounces, filters), [bounces, filters])

  useEffect(() => {
    const handlePopState = () => setRoute(readAppRoute(window.location))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToCatalog = (nextFilters: BounceFilters) => {
    window.history.pushState({}, '', buildCatalogHref(nextFilters))
    setRoute({ view: 'catalog', filters: nextFilters })
  }

  const updateFilters = (nextFilters: BounceFilters) => {
    window.history.replaceState({}, '', buildCatalogHref(nextFilters))
    setRoute({ view: 'catalog', filters: nextFilters })
  }

  const navigateHome = () => {
    window.history.pushState({}, '', getHomeHref())
    setRoute({ view: 'home', filters: defaultFilters })
  }

  return (
    <main className="app-shell" aria-labelledby="page-title">
      <Header />
      {view === 'home' ? (
        <HomePage bounces={bounces} onNavigate={navigateToCatalog} catalogHref={buildCatalogHref} />
      ) : (
        <>
          <a className="back-home" href={getHomeHref()} onClick={(event) => { event.preventDefault(); navigateHome() }}>← Back to home</a>
          {isLoading && <LoadingState />}
          {!isLoading && error && <ErrorState onRetry={retry} />}
          {!isLoading && !error && bounces.length === 0 && <EmptyState title="No bounce inventory is currently available." />}
          {!isLoading && !error && bounces.length > 0 && (
            <>
              <FilterBar filters={filters} bounces={bounces} hasActiveFilters={activeFilters} onChange={updateFilters} onClear={() => updateFilters(defaultFilters)} />
              <p className="result-count" role="status">Showing {filteredBounces.length} of {bounces.length} products</p>
              {filteredBounces.length === 0 ? <EmptyState title="No products match the selected filters." message="Try broadening your search or clearing filters." actionLabel="Clear filters" onAction={() => updateFilters(defaultFilters)} /> : <section className="card-grid" aria-label="Bounce inventory results">{filteredBounces.map((bounce) => <BounceCard key={`${bounce.id}-${bounce.product_url ?? bounce.name}`} bounce={bounce} onSelect={setSelectedBounce} />)}</section>}
            </>
          )}
        </>
      )}
      {selectedBounce && <BounceDetailModal bounce={selectedBounce} onClose={() => setSelectedBounce(null)} />}
    </main>
  )
}

export default App
