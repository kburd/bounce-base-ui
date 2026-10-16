import { defaultFilters } from './filterBounces'
import type { BounceFilters } from '../types/bounce'
import type { InventoryFilter, InventorySearchCriteria } from '../types/inventorySearch'

export function toInventorySearchCriteria(filters: BounceFilters): InventorySearchCriteria {
  const inventoryFilters: InventoryFilter[] = []
  if (filters.category) {
    const categories = filters.category.split('|')
    inventoryFilters.push(categories.length > 1
      ? { field: 'category', operator: 'in', value: categories }
      : { field: 'category', operator: 'equals', value: categories[0] })
  }
  if (filters.useType) inventoryFilters.push({ field: 'use_type', operator: 'equals', value: filters.useType })
  if (filters.company) inventoryFilters.push({ field: 'company', operator: 'contains', value: filters.company })
  if (filters.size) inventoryFilters.push({ field: 'size', operator: 'contains', value: filters.size })
  if (filters.minPrice.trim() && Number.isFinite(Number(filters.minPrice))) {
    inventoryFilters.push({ field: 'price', operator: 'greater_than_or_equal', value: Number(filters.minPrice) })
  }
  if (filters.maxPrice.trim() && Number.isFinite(Number(filters.maxPrice))) {
    inventoryFilters.push({ field: 'price', operator: 'less_than_or_equal', value: Number(filters.maxPrice) })
  }

  return { keyword: filters.search, filters: inventoryFilters, sortBy: 'name', sortDirection: 'asc' }
}

export function toCatalogFilters(criteria: InventorySearchCriteria): BounceFilters {
  const filters = { ...defaultFilters, search: criteria.keyword }
  for (const filter of criteria.filters) {
    if (filter.field === 'name' && filter.operator === 'contains' && !filters.search) {
      filters.search = String(filter.value)
    } else if (filter.field === 'category' && (filter.operator === 'equals' || filter.operator === 'in')) {
      filters.category = Array.isArray(filter.value) ? filter.value.join('|') : String(filter.value)
    } else if (filter.field === 'use_type' && filter.operator === 'equals') {
      filters.useType = String(filter.value)
    } else if (filter.field === 'company' && (filter.operator === 'equals' || filter.operator === 'contains')) {
      filters.company = String(filter.value)
    } else if (filter.field === 'size' && (filter.operator === 'equals' || filter.operator === 'contains')) {
      filters.size = String(filter.value)
    } else if (filter.field === 'price' && filter.operator === 'greater_than_or_equal') {
      filters.minPrice = String(filter.value)
    } else if (filter.field === 'price' && filter.operator === 'less_than_or_equal') {
      filters.maxPrice = String(filter.value)
    }
  }
  return filters
}

export interface AdaptedAiCriteria {
  criteria: InventorySearchCriteria
  unsupported: string[]
}

/** Adapts object- or array-shaped AI criteria into the validated inventory search contract. */
export function adaptAiCriteria(input: Record<string, unknown> | unknown[]): AdaptedAiCriteria {
  let keyword = ''
  const filters: InventoryFilter[] = []
  const unsupported: string[] = []
  const criteria = Array.isArray(input) ? input : []

  if (Array.isArray(input)) {
    for (const raw of criteria) {
      if (!raw || typeof raw !== 'object' || !('field' in raw) || !('operator' in raw) || !('value' in raw)) {
        unsupported.push('unknown criterion')
        continue
      }
      const criterion = raw as { field: unknown; operator: unknown; value: unknown }
      const field = criterion.field
      const operator = criterion.operator
      const rawValue = criterion.value
      if (typeof field !== 'string' || typeof operator !== 'string') {
        unsupported.push('unknown criterion')
        continue
      }

      if (field === 'price' && (operator === 'less_than_or_equal' || operator === 'greater_than_or_equal')) {
        const value = typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' ? Number(rawValue) : NaN
        if (Number.isFinite(value) && value >= 0) filters.push({ field: 'price', operator, value })
        else unsupported.push('price')
      } else if (field === 'category' && operator === 'equals' && typeof rawValue === 'string') {
        const category = rawValue.trim().toLowerCase()
        const categoryMap: Record<string, string> = {
          'bounce house': 'BounceHouse',
          bouncehouse: 'BounceHouse',
          'bounce house with slide': 'Combo',
          'combo': 'Combo',
          'water slide': 'WaterSlide',
          waterslide: 'WaterSlide',
          'obstacle course': 'ObstacleCourse',
          game: 'Game',
        }
        const mappedCategory = categoryMap[category]
        if (mappedCategory) filters.push({ field: 'category', operator: 'equals', value: mappedCategory })
        else unsupported.push(`category (${rawValue})`)
      } else if (field === 'theme' && operator === 'equals' && typeof rawValue === 'string' && rawValue.trim()) {
        // There is no theme column. Search inventory names for the requested theme instead.
        keyword = [keyword, rawValue.trim()].filter(Boolean).join(' ')
      } else if (field === 'name' && (operator === 'contains' || operator === 'equals') && typeof rawValue === 'string') {
        keyword = [keyword, rawValue.trim()].filter(Boolean).join(' ')
      } else if ((field === 'use_type' || field === 'size' || field === 'company')
        && (operator === 'equals' || operator === 'contains') && typeof rawValue === 'string') {
        filters.push({ field, operator, value: rawValue })
      } else {
        unsupported.push(field)
      }
    }
  } else {
    const objectCriteria = input
    if (typeof objectCriteria.keyword === 'string') keyword = objectCriteria.keyword
    if (Array.isArray(objectCriteria.filters)) {
      const adapted = adaptAiCriteria(objectCriteria.filters)
      filters.push(...adapted.criteria.filters)
      keyword = [keyword, adapted.criteria.keyword].filter(Boolean).join(' ')
      unsupported.push(...adapted.unsupported)
    }
    for (const field of ['category', 'use_type', 'size', 'company'] as const) {
      const value = objectCriteria[field]
      if (typeof value === 'string' && value.trim()) {
        filters.push({ field, operator: field === 'category' || field === 'use_type' ? 'equals' : 'contains', value })
      }
    }
    const maxPrice = objectCriteria.max_price ?? objectCriteria.price_max
    const minPrice = objectCriteria.min_price ?? objectCriteria.price_min
    for (const [value, operator] of [[minPrice, 'greater_than_or_equal'], [maxPrice, 'less_than_or_equal']] as const) {
      if (value === undefined) continue
      const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      if (Number.isFinite(number) && number >= 0) filters.push({ field: 'price', operator, value: number })
      else unsupported.push('price')
    }
  }

  return {
    criteria: { keyword, filters, sortBy: 'name', sortDirection: 'asc' },
    unsupported: [...new Set(unsupported)],
  }
}