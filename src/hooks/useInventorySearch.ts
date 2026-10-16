import { useEffect, useRef, useState } from 'react'
import { searchBounces } from '../lib/supabase'
import type { Bounce } from '../types/bounce'
import type { InventoryFilter, InventorySearchCriteria, InventorySearchRequest, InventorySearchResult, InventorySortField } from '../types/inventorySearch'

export const DEFAULT_INVENTORY_PAGE_SIZE = 20

const emptyResult: InventorySearchResult<Bounce> = { items: [], total: 0, page: 1, pageSize: DEFAULT_INVENTORY_PAGE_SIZE }

function createRequest(criteria?: Partial<InventorySearchCriteria>): InventorySearchRequest {
  return {
    keyword: criteria?.keyword?.trim() ?? '',
    filters: criteria?.filters ?? [],
    page: 1,
    pageSize: DEFAULT_INVENTORY_PAGE_SIZE,
    sortBy: criteria?.sortBy ?? 'name',
    sortDirection: criteria?.sortDirection ?? 'asc',
  }
}

function requestKey(request: InventorySearchRequest): string {
  return JSON.stringify({ ...request, keyword: request.keyword.trim() })
}

export function useInventorySearch(initialCriteria?: Partial<InventorySearchCriteria>, enabled = true) {
  const [request, setRequest] = useState(() => createRequest(initialCriteria))
  const [settled, setSettled] = useState<{ key: string; result: InventorySearchResult<Bounce> | null; error: string | null } | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const requestId = useRef(0)
  const requestRef = useRef(request)
  const settledRef = useRef(settled)
  const key = requestKey(request)
  const currentKey = useRef(key)
  requestRef.current = request
  settledRef.current = settled
  currentKey.current = key

  useEffect(() => {
    if (!enabled || (settledRef.current?.key === key && settledRef.current.error === null)) return
    const id = ++requestId.current
    let cancelled = false
    const currentRequest = requestRef.current

    void searchBounces(currentRequest).then((result) => {
      if (cancelled || id !== requestId.current || currentKey.current !== key) return
      const lastPage = Math.max(1, Math.ceil(result.total / currentRequest.pageSize))
      if (currentRequest.page > lastPage) {
        setRequest((current) => currentKey.current === key ? { ...current, page: lastPage } : current)
        return
      }
      setSettled({ key, result, error: null })
    }).catch(() => {
      if (cancelled || id !== requestId.current || currentKey.current !== key) return
      setSettled({ key, result: null, error: 'We could not search inventory right now. Please try again.' })
    })

    return () => {
      cancelled = true
    }
  }, [enabled, key, refreshToken])

  const updateRequest = (update: (current: InventorySearchRequest) => InventorySearchRequest) => {
    setRequest((current) => {
      const next = update(current)
      return JSON.stringify(next) === JSON.stringify(current) ? current : next
    })
  }

  const setKeyword = (keyword: string) => updateRequest((current) => ({ ...current, keyword, page: 1 }))
  const addFilter = (filter: InventoryFilter) => updateRequest((current) => ({ ...current, filters: [...current.filters, filter], page: 1 }))
  const updateFilter = (index: number, filter: InventoryFilter) => updateRequest((current) => ({
    ...current,
    filters: current.filters.map((existing, itemIndex) => itemIndex === index ? filter : existing),
    page: 1,
  }))
  const removeFilter = (index: number) => updateRequest((current) => ({
    ...current,
    filters: current.filters.filter((_, itemIndex) => itemIndex !== index),
    page: 1,
  }))
  const clearFilters = () => updateRequest((current) => ({ ...current, filters: [], page: 1 }))
  const clearSearch = () => updateRequest((current) => ({ ...createRequest(), pageSize: current.pageSize }))
  const setSorting = (sortBy: InventorySortField, sortDirection: 'asc' | 'desc') => updateRequest((current) => ({ ...current, sortBy, sortDirection, page: 1 }))
  const setPageSize = (pageSize: number) => {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return
    updateRequest((current) => ({ ...current, pageSize, page: 1 }))
  }
  const setPage = (page: number) => updateRequest((current) => {
    const lastPage = Math.max(1, Math.ceil((settled?.key === key ? settled.result?.total ?? 0 : 0) / current.pageSize))
    const validPage = Math.min(Math.max(1, Math.floor(page)), lastPage)
    return { ...current, page: validPage }
  })
  const applyCriteria = (criteria: InventorySearchCriteria) => updateRequest((current) => ({
    ...current,
    keyword: criteria.keyword.trim(),
    filters: criteria.filters,
    sortBy: criteria.sortBy,
    sortDirection: criteria.sortDirection,
    page: 1,
  }))
  const retry = () => {
    setSettled(null)
    setRefreshToken((token) => token + 1)
  }

  const hasCurrentResult = settled?.key === key
  const result = hasCurrentResult ? settled.result : null
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / request.pageSize))

  return {
    request,
    items: result?.items ?? emptyResult.items,
    total,
    totalPages,
    isLoading: enabled && !hasCurrentResult,
    error: hasCurrentResult ? settled.error : null,
    setKeyword,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    clearSearch,
    setSorting,
    setPageSize,
    setPage,
    retry,
    previousPage: () => setPage(request.page - 1),
    nextPage: () => setPage(request.page + 1),
    applyCriteria,
  }
}