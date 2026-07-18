import type { Bounce, BounceFilters } from '../types/bounce'

export const defaultFilters: BounceFilters = { search: '', category: '', useType: '', company: '', minPrice: '', maxPrice: '' }
export const hasActiveFilters = (filters: BounceFilters) => Object.values(filters).some((value) => value.trim() !== '')

export function filterBounces(bounces: Bounce[], filters: BounceFilters) {
  const search = filters.search.trim().toLowerCase()
  const min = filters.minPrice === '' ? null : Number(filters.minPrice)
  const max = filters.maxPrice === '' ? null : Number(filters.maxPrice)
  const hasPriceFilter = min !== null || max !== null

  return bounces.filter((bounce) => {
    if (search && !`${bounce.name} ${bounce.company}`.toLowerCase().includes(search)) return false
    if (filters.category && bounce.category !== filters.category) return false
    if (filters.useType && bounce.use_type !== filters.useType) return false
    if (filters.company && bounce.company !== filters.company) return false
    if (hasPriceFilter) {
      if (bounce.price == null) return false
      if (min !== null && Number.isFinite(min) && bounce.price < min) return false
      if (max !== null && Number.isFinite(max) && bounce.price > max) return false
    }
    return true
  })
}
