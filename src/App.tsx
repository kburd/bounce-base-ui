import { useMemo, useState } from 'react'
import './App.css'
import { BounceCard } from './components/BounceCard'
import { BounceDetailModal } from './components/BounceDetailModal'
import { EmptyState } from './components/EmptyState'
import { ErrorState } from './components/ErrorState'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { LoadingState } from './components/LoadingState'
import { defaultFilters, filterBounces, hasActiveFilters } from './lib/filterBounces'
import { useBounces } from './hooks/useBounces'
import type { Bounce, BounceFilters } from './types/bounce'

function App() {
  const { bounces, isLoading, error, retry } = useBounces()
  const [filters, setFilters] = useState<BounceFilters>(defaultFilters)
  const [selectedBounce, setSelectedBounce] = useState<Bounce | null>(null)
  const activeFilters = hasActiveFilters(filters)
  const filteredBounces = useMemo(() => filterBounces(bounces, filters), [bounces, filters])

  return (
    <main className="app-shell" aria-labelledby="page-title">
      <Header />
      {isLoading && <LoadingState />}
      {!isLoading && error && <ErrorState onRetry={retry} />}
      {!isLoading && !error && bounces.length === 0 && <EmptyState title="No bounce inventory is currently available." />}
      {!isLoading && !error && bounces.length > 0 && (
        <>
          <FilterBar filters={filters} bounces={bounces} hasActiveFilters={activeFilters} onChange={setFilters} onClear={() => setFilters(defaultFilters)} />
          <p className="result-count" role="status">Showing {filteredBounces.length} of {bounces.length} products</p>
          {filteredBounces.length === 0 ? <EmptyState title="No products match the selected filters." message="Try broadening your search or clearing filters." actionLabel="Clear filters" onAction={() => setFilters(defaultFilters)} /> : <section className="card-grid" aria-label="Bounce inventory results">{filteredBounces.map((bounce) => <BounceCard key={`${bounce.id}-${bounce.product_url ?? bounce.name}`} bounce={bounce} onSelect={setSelectedBounce} />)}</section>}
        </>
      )}
      {selectedBounce && <BounceDetailModal bounce={selectedBounce} onClose={() => setSelectedBounce(null)} />}
    </main>
  )
}

export default App
