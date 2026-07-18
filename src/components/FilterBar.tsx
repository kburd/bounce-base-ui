import type { Bounce, BounceFilters } from '../types/bounce'

const schemaCategories = ['Bouncer', 'Combo', 'Slide', 'Obstacle Course', 'Game', 'Unknown']
const schemaUseTypes = ['Dry', 'Wet', 'Both', 'Unknown']

type Props = { filters: BounceFilters; bounces: Bounce[]; hasActiveFilters: boolean; onChange: (filters: BounceFilters) => void; onClear: () => void }
const update = (filters: BounceFilters, key: keyof BounceFilters, value: string) => ({ ...filters, [key]: value })
const presentOptions = (values: string[], schema: string[]) => schema.filter((value) => values.includes(value))

export function FilterBar({ filters, bounces, hasActiveFilters, onChange, onClear }: Props) {
  const categories = presentOptions([...new Set(bounces.map((b) => b.category))], schemaCategories)
  const useTypes = presentOptions([...new Set(bounces.map((b) => b.use_type))], schemaUseTypes)
  const companies = [...new Set(bounces.map((b) => b.company).filter(Boolean))].sort((a, b) => a.localeCompare(b))

  return (
    <section className="filters" aria-labelledby="filters-title">
      <div className="filters-header"><h2 id="filters-title">Filter catalog</h2>{hasActiveFilters && <button className="secondary" onClick={onClear}>Clear filters</button>}</div>
      <div className="filter-grid">
        <label>Search<input type="search" value={filters.search} onChange={(e) => onChange(update(filters, 'search', e.target.value))} placeholder="Name or company" /></label>
        <label>Category<select value={filters.category} onChange={(e) => onChange(update(filters, 'category', e.target.value))}><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label>Use type<select value={filters.useType} onChange={(e) => onChange(update(filters, 'useType', e.target.value))}><option value="">All use types</option>{useTypes.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
        <label>Company<select value={filters.company} onChange={(e) => onChange(update(filters, 'company', e.target.value))}><option value="">All companies</option>{companies.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label>Min price<input type="number" min="0" inputMode="numeric" value={filters.minPrice} onChange={(e) => onChange(update(filters, 'minPrice', e.target.value))} placeholder="No min" /></label>
        <label>Max price<input type="number" min="0" inputMode="numeric" value={filters.maxPrice} onChange={(e) => onChange(update(filters, 'maxPrice', e.target.value))} placeholder="No max" /></label>
      </div>
    </section>
  )
}
