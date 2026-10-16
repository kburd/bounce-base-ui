import { useEffect, useRef, useState } from 'react'
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
import { defaultFilters } from './lib/filterBounces'
import { adaptAiCriteria, toCatalogFilters, toInventorySearchCriteria } from './lib/catalogSearchAdapter'
import { useBounces } from './hooks/useBounces'
import { useInventorySearch } from './hooks/useInventorySearch'
import type { Bounce, BounceFilters } from './types/bounce'
import type { AiSearchResponse } from './lib/aiSearch'

function App() {
  const [route, setRoute] = useState(() => readAppRoute(window.location))
  const [selectedBounce, setSelectedBounce] = useState<Bounce | null>(null)
  const [aiSearchNotice, setAiSearchNotice] = useState<string | null>(null)
  const search = useInventorySearch(toInventorySearchCriteria(route.filters), route.view === 'catalog')
  const searchRef = useRef(search)
  searchRef.current = search
  const { bounces } = useBounces(route.view === 'home')
  const { view } = route
  const catalogFilters = toCatalogFilters(search.request)
  const hasStructuredFilters = [catalogFilters.category, catalogFilters.useType, catalogFilters.company, catalogFilters.minPrice, catalogFilters.maxPrice, catalogFilters.size].some((value) => value.trim() !== '')

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = readAppRoute(window.location)
      setRoute(nextRoute)
      if (nextRoute.view === 'catalog') searchRef.current.applyCriteria(toInventorySearchCriteria(nextRoute.filters))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToCatalog = (nextFilters: BounceFilters) => {
    window.history.pushState({}, '', buildCatalogHref(nextFilters))
    setRoute({ view: 'catalog', filters: nextFilters })
    search.applyCriteria(toInventorySearchCriteria(nextFilters))
    setAiSearchNotice(null)
  }

  const updateFilters = (nextFilters: BounceFilters) => {
    window.history.replaceState({}, '', buildCatalogHref(nextFilters))
    setRoute({ view: 'catalog', filters: nextFilters })
    search.applyCriteria({
      ...toInventorySearchCriteria(nextFilters),
      sortBy: search.request.sortBy,
      sortDirection: search.request.sortDirection,
    })
    setAiSearchNotice(null)
  }

  const clearSearch = () => {
    window.history.replaceState({}, '', buildCatalogHref(defaultFilters))
    setRoute({ view: 'catalog', filters: defaultFilters })
    search.clearSearch()
    setAiSearchNotice(null)
  }

  const handleAiSearchResponse = (response: AiSearchResponse) => {
    let criteria = toInventorySearchCriteria(defaultFilters)
    let notice: string | null = null

    if (!response.success) {
      notice = 'AI search could not process that request. You can browse the inventory below.'
    } else if (!response.implemented) {
      notice = 'AI search is not available yet. You can browse the inventory below.'
    } else if (response.criteria) {
      try {
        const adapted = adaptAiCriteria(response.criteria)
        criteria = adapted.criteria
      } catch {
        notice = 'AI search criteria could not be applied yet. You can browse the inventory below.'
      }
    } else {
      notice = 'AI search did not return usable criteria. You can browse the inventory below.'
    }

    const nextFilters = toCatalogFilters(criteria)
    window.history.pushState({}, '', buildCatalogHref(nextFilters))
    setRoute({ view: 'catalog', filters: nextFilters })
    search.applyCriteria(criteria)
    setAiSearchNotice(notice)
  }

  const activeCriteria = [
    ...(search.request.keyword ? [{ label: `Keyword: ${search.request.keyword}`, remove: () => updateFilters({ ...catalogFilters, search: '' }) }] : []),
    ...search.request.filters.map((filter, index) => ({
      label: `${filter.field}: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`,
      remove: () => updateFilters(toCatalogFilters({
        ...search.request,
        filters: search.request.filters.filter((_, filterIndex) => filterIndex !== index),
      })),
    })),
  ]

  const navigateHome = () => {
    window.history.pushState({}, '', getHomeHref())
    setRoute({ view: 'home', filters: defaultFilters })
    setAiSearchNotice(null)
  }

  return (
    <main className="app-shell" aria-labelledby="page-title">
      <Header />
      {view === 'home' ? (
        <HomePage bounces={bounces} onNavigate={navigateToCatalog} onAiSearchResponse={handleAiSearchResponse} catalogHref={buildCatalogHref} />
      ) : (
        <>
          <a className="back-home" href={getHomeHref()} onClick={(event) => { event.preventDefault(); navigateHome() }}>← Back to home</a>
          {aiSearchNotice && <p className="ai-search-notice" role="status">{aiSearchNotice}</p>}
          <FilterBar filters={catalogFilters} hasActiveFilters={hasStructuredFilters} onChange={updateFilters} onClear={() => updateFilters({ ...catalogFilters, category: '', useType: '', company: '', minPrice: '', maxPrice: '', size: '' })} />
          {activeCriteria.length > 0 && <section className="active-search" aria-label="Active search criteria">
            <h2>Active search</h2>
            <div className="active-search-chips">{activeCriteria.map((criterion, index) => <button className="filter-chip" key={`${criterion.label}-${index}`} type="button" onClick={criterion.remove}>{criterion.label}<span aria-hidden="true"> ×</span><span className="sr-only">Remove</span></button>)}</div>
            <button className="secondary clear-search" type="button" onClick={clearSearch}>Clear search</button>
          </section>}
          <div className="search-controls">
            <label>Sort by<select value={`${search.request.sortBy}:${search.request.sortDirection}`} onChange={(event) => {
              const [sortBy, direction] = event.target.value.split(':') as ['name' | 'price', 'asc' | 'desc']
              search.setSorting(sortBy, direction)
            }}><option value="name:asc">Name (A–Z)</option><option value="price:asc">Price (low to high)</option><option value="price:desc">Price (high to low)</option></select></label>
            <label>Results per page<select value={search.request.pageSize} onChange={(event) => search.setPageSize(Number(event.target.value))}><option value={20}>20</option><option value={40}>40</option><option value={80}>80</option></select></label>
          </div>
          {search.isLoading && <LoadingState />}
          {!search.isLoading && search.error && <ErrorState onRetry={search.retry} />}
          {!search.isLoading && !search.error && <>
            <p className="result-count" role="status">{search.total === 0 ? 'No products found' : `Showing ${(search.request.page - 1) * search.request.pageSize + 1}–${Math.min(search.request.page * search.request.pageSize, search.total)} of ${search.total} products`}</p>
            {search.items.length === 0
              ? <EmptyState title="No products match your search." message="Try broadening your keyword or removing some filters." actionLabel="Clear filters" onAction={() => updateFilters({ ...catalogFilters, category: '', useType: '', company: '', minPrice: '', maxPrice: '', size: '' })} />
              : <section className="card-grid" aria-label="Bounce inventory results">{search.items.map((bounce) => <BounceCard key={`${bounce.id}-${bounce.product_url ?? bounce.name}`} bounce={bounce} onSelect={setSelectedBounce} />)}</section>}
            <nav className="pagination" aria-label="Inventory result pages">
              <button className="secondary" type="button" onClick={search.previousPage} disabled={search.request.page <= 1 || search.isLoading}>Previous</button>
              <span>Page {search.request.page} of {search.totalPages}</span>
              <button className="secondary" type="button" onClick={search.nextPage} disabled={search.request.page >= search.totalPages || search.isLoading}>Next</button>
            </nav>
          </>}
        </>
      )}
      {selectedBounce && <BounceDetailModal bounce={selectedBounce} onClose={() => setSelectedBounce(null)} />}
    </main>
  )
}

export default App
