import type { MouseEvent } from 'react'
import { defaultFilters } from '../lib/filterBounces'
import type { Bounce, BounceFilters } from '../types/bounce'
import { BounceImage } from './BounceImage'

type Props = {
  bounces: Bounce[]
  onNavigate: (filters: BounceFilters) => void
  catalogHref: (filters: BounceFilters) => string
}

const categories: { label: string; description: string; symbol: string; className: string; filters: BounceFilters; imageIndex?: number }[] = [
  { label: 'Bounce Houses', description: 'Classic bounce-house rentals.', symbol: '🏰', className: 'bounce-houses', filters: { ...defaultFilters, category: 'BounceHouse' } },
  { label: 'Combos', description: 'Bounce-house and slide combos.', symbol: '🌊', className: 'combos-slides', filters: { ...defaultFilters, category: 'Combo' } },
  { label: 'Obstacle Courses', description: 'Inflatables built for active play.', symbol: '🏁', className: 'obstacle-courses', filters: { ...defaultFilters, category: 'ObstacleCourse' } },
  { label: 'Water Slides', description: 'Cool off with water-slide rentals.', symbol: '💦', className: 'combos-slides', filters: { ...defaultFilters, category: 'WaterSlide' }, imageIndex: 1 },
]

function followCatalogLink(event: MouseEvent<HTMLAnchorElement>, filters: BounceFilters, onNavigate: Props['onNavigate']) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  onNavigate(filters)
}

export function HomePage({ bounces, onNavigate, catalogHref }: Props) {
  const pricePresets = [
    { label: 'Under $300', detail: 'Up to $299.99', filters: { ...defaultFilters, maxPrice: '299.99' } },
    { label: '$300–$500', detail: 'Compare rentals from $300 to $500', filters: { ...defaultFilters, minPrice: '300', maxPrice: '500' } },
  ]

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">Discover your next rental</p>
        <h2 id="home-title">Find the perfect rental.</h2>
      </section>

      <section className="discovery-section" aria-labelledby="categories-title">
        <div className="section-heading">
          <div><p className="eyebrow">Start exploring</p><h2 id="categories-title">Browse by category</h2></div>
        </div>
        <div className="category-grid">
          {categories.map((category) => {
            const matchingCategories = category.filters.category.split('|')
            const samples = bounces
              .filter((bounce) => matchingCategories.includes(bounce.category) && bounce.image_url)
              .filter((bounce, index, all) => all.findIndex((candidate) => candidate.image_url === bounce.image_url) === index)
            const sample = samples[category.imageIndex ?? 0]

            return (
              <a key={category.label} className="category-card" href={catalogHref(category.filters)} onClick={(event) => followCatalogLink(event, category.filters, onNavigate)}>
                <span className={`category-art ${category.className}`} aria-hidden="true">
                  {sample?.image_url ? <BounceImage src={sample.image_url} alt="" /> : <span>{category.symbol}</span>}
                </span>
                <span className="category-card-copy"><strong>{category.label}</strong><span>{category.description}</span></span>
                <span className="category-arrow" aria-hidden="true">↗</span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="discovery-section browse-by-section" aria-labelledby="browse-by-title">
        <div className="section-heading"><div><p className="eyebrow">Narrow it down</p><h2 id="browse-by-title">Browse by</h2></div></div>
        <div className="browse-links">
          {pricePresets.map((preset) => (
            <a key={preset.label} className="browse-link-card" href={catalogHref(preset.filters)} onClick={(event) => followCatalogLink(event, preset.filters, onNavigate)}>
              <span><strong>{preset.label}</strong><small>{preset.detail}</small></span><span aria-hidden="true">→</span>
            </a>
          ))}
          <a className="browse-link-card" href={catalogHref(defaultFilters)} onClick={(event) => followCatalogLink(event, defaultFilters, onNavigate)}>
            <span><strong>Explore companies</strong><small>Filter listings by company in the catalog</small></span><span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="all-inventory" aria-label="Browse all inventory">
        <div><h2>Ready to compare?</h2><p>See every rental and use the catalog filters to narrow your options.</p></div>
        <a className="primary-link" href={catalogHref(defaultFilters)} onClick={(event) => followCatalogLink(event, defaultFilters, onNavigate)}>Browse all inventory</a>
      </section>
    </div>
  )
}