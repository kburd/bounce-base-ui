import { defaultFilters } from './filterBounces'
import type { BounceFilters } from '../types/bounce'

export type AppRoute = { view: 'home' | 'catalog'; filters: BounceFilters }

const filterKeys: (keyof BounceFilters)[] = ['search', 'category', 'useType', 'company', 'minPrice', 'maxPrice']

export function readAppRoute(location: Pick<Location, 'search'>): AppRoute {
  const params = new URLSearchParams(location.search)
  const hasFilterParams = filterKeys.some((key) => params.has(key))
  const view = params.get('view') === 'catalog' || hasFilterParams ? 'catalog' : 'home'
  const filters = Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? defaultFilters[key]])) as BounceFilters
  return { view, filters }
}

export function buildCatalogHref(filters: BounceFilters, pathname = window.location.pathname): string {
  const params = new URLSearchParams({ view: 'catalog' })
  filterKeys.forEach((key) => {
    if (filters[key].trim()) params.set(key, filters[key])
  })
  return `${pathname}?${params.toString()}`
}

export function getHomeHref(pathname = window.location.pathname): string {
  return pathname
}