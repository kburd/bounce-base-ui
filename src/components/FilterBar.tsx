import type { BounceFilters } from '../types/bounce'

const schemaCategories = ['BounceHouse', 'Combo', 'WaterSlide', 'ObstacleCourse', 'Game', 'Unknown']
const schemaUseTypes = ['Dry', 'Wet', 'Both', 'Unknown']
const categoryLabels: Record<string, string> = {
  BounceHouse: 'Bounce House',
  Combo: 'Combo',
  WaterSlide: 'Water Slide',
  ObstacleCourse: 'Obstacle Course',
  Game: 'Game',
  Unknown: 'Unknown',
  'Combo|WaterSlide': 'Combos & Slides',
}

type Props = { filters: BounceFilters; hasActiveFilters: boolean; onChange: (filters: BounceFilters) => void; onClear: () => void }
const update = (filters: BounceFilters, key: keyof BounceFilters, value: string) => ({ ...filters, [key]: value })

export function FilterBar({ filters, hasActiveFilters, onChange, onClear }: Props) {
  return (
    <section className="filters" aria-labelledby="filters-title">
      <div className="filters-header"><h2 id="filters-title">Filter catalog</h2>{hasActiveFilters && <button className="secondary" onClick={onClear}>Clear filters</button>}</div>
      <div className="filter-grid">
        <label>Keyword<input type="search" value={filters.search} onChange={(e) => onChange(update(filters, 'search', e.target.value))} placeholder="Search bounce names" /></label>
        <label>Category<select value={filters.category} onChange={(e) => onChange(update(filters, 'category', e.target.value))}><option value="">All categories</option>{schemaCategories.map((c) => <option key={c} value={c}>{categoryLabels[c] ?? c}</option>)}<option value="Combo|WaterSlide">Combos &amp; Slides</option></select></label>
        <label>Use type<select value={filters.useType} onChange={(e) => onChange(update(filters, 'useType', e.target.value))}><option value="">All use types</option>{schemaUseTypes.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
        <label>Company<input type="search" value={filters.company} onChange={(e) => onChange(update(filters, 'company', e.target.value))} placeholder="Any company name" /></label>
        <label>Size<input type="search" value={filters.size} onChange={(e) => onChange(update(filters, 'size', e.target.value))} placeholder="Any size" /></label>
        <label>Min price<input type="number" min="0" inputMode="numeric" value={filters.minPrice} onChange={(e) => onChange(update(filters, 'minPrice', e.target.value))} placeholder="No min" /></label>
        <label>Max price<input type="number" min="0" inputMode="numeric" value={filters.maxPrice} onChange={(e) => onChange(update(filters, 'maxPrice', e.target.value))} placeholder="No max" /></label>
      </div>
    </section>
  )
}
