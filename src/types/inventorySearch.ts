export type InventoryFilterField = 'name' | 'category' | 'use_type' | 'price' | 'size' | 'company'
export type InventoryFilterOperator = 'equals' | 'contains' | 'less_than_or_equal' | 'greater_than_or_equal' | 'in'
export type InventoryFilterValue = string | number | string[]
export type InventorySortField = 'name' | 'price'

export interface InventoryFilter {
  field: InventoryFilterField
  operator: InventoryFilterOperator
  value: InventoryFilterValue
}

export interface InventorySearchRequest {
  keyword: string
  filters: InventoryFilter[]
  page: number
  pageSize: number
  sortBy: InventorySortField
  sortDirection: 'asc' | 'desc'
}

export interface InventorySearchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type InventorySearchCriteria = Pick<InventorySearchRequest, 'keyword' | 'filters' | 'sortBy' | 'sortDirection'>