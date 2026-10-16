import { createClient } from '@supabase/supabase-js'
import type { Bounce, BounceCategory, BounceUseType } from '../types/bounce'
import type { InventoryFilter, InventorySearchRequest, InventorySearchResult } from '../types/inventorySearch'

export const INVENTORY_TABLE_NAME = 'company_inventory'
export const COMPANY_TABLE_NAME = 'companies'
export const COMPANY_URL_TABLE_NAME = 'company_urls'
export const INVENTORY_RESULT_LIMIT = 500

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

const cleanText = (value: unknown): string | null => {
  if (typeof value !== 'string') return value == null ? null : String(value)
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeCategory = (value: unknown): BounceCategory => {
  const category = cleanText(value)
  if (category === 'BounceHouse' || category === 'Combo' || category === 'WaterSlide' || category === 'ObstacleCourse' || category === 'Game') return category
  return 'Unknown'
}

const normalizeUseType = (value: unknown): BounceUseType => {
  const useType = cleanText(value)
  if (useType === 'Dry' || useType === 'Wet' || useType === 'Both' || useType === 'Unknown') return useType
  return 'Unknown'
}

const normalizePrice = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export const isValidHttpUrl = (value: string | null | undefined) => {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const normalizeBounce = (
  record: Record<string, unknown>,
  companyNames: Map<string, string>,
  productUrls: Map<string, string>,
): Bounce => ({
  id: record.id as string | number,
  name: cleanText(record.name) ?? 'Unnamed bounce rental',
  company: companyNames.get(String(record.company_id)) ?? 'Unknown company',
  category: normalizeCategory(record.category),
  use_type: normalizeUseType(record.use_type),
  price: normalizePrice(record.price),
  size: cleanText(record.size),
  image_url: isValidHttpUrl(cleanText(record.image_url)) ? cleanText(record.image_url) : null,
  product_url: isValidHttpUrl(productUrls.get(String(record.company_url_id)))
    ? productUrls.get(String(record.company_url_id)) ?? null
    : null,
})

export async function fetchBounces(): Promise<Bounce[]> {
  if (!supabase) {
    throw new Error('Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
  }

  const { data, error } = await supabase
    .from(INVENTORY_TABLE_NAME)
    .select('id,name,company_id,company_url_id,category,use_type,price,size,image_url')
    .order('company_id', { ascending: true })
    .order('name', { ascending: true })
    .limit(INVENTORY_RESULT_LIMIT)

  if (error) throw error

  const inventory = data ?? []
  if (inventory.length === 0) return []

  const companyIds = [...new Set(inventory.map((record) => record.company_id).filter((id) => id != null))]
  const { data: companies, error: companiesError } = await supabase
    .from(COMPANY_TABLE_NAME)
    .select('id,name')
    .in('id', companyIds)

  if (companiesError) throw companiesError

  const companyUrlIds = [...new Set(inventory.map((record) => record.company_url_id).filter((id) => id != null))]
  const { data: companyUrls, error: companyUrlsError } = companyUrlIds.length
    ? await supabase
      .from(COMPANY_URL_TABLE_NAME)
      .select('id,url')
      .in('id', companyUrlIds)
    : { data: [], error: null }

  if (companyUrlsError) throw companyUrlsError

  const companyNames = new Map(
    (companies ?? []).flatMap((company) => {
      const name = cleanText(company.name)
      return name ? [[String(company.id), name] as const] : []
    }),
  )

  const productUrls = new Map(
    (companyUrls ?? []).flatMap((companyUrl) => {
      const url = cleanText(companyUrl.url)
      return url ? [[String(companyUrl.id), url] as const] : []
    }),
  )

  return inventory.map((record) => normalizeBounce(record, companyNames, productUrls))
}

const categoryValues: BounceCategory[] = ['BounceHouse', 'Combo', 'WaterSlide', 'ObstacleCourse', 'Game', 'Unknown']
const useTypeValues: BounceUseType[] = ['Dry', 'Wet', 'Both', 'Unknown']

function validateInventoryFilter(filter: InventoryFilter): void {
  const value = filter.value
  const isTextValue = typeof value === 'string' && value.trim().length > 0

  if (filter.operator === 'in') {
    if (filter.field !== 'category' || !Array.isArray(value) || value.length === 0 || value.some((item) => !categoryValues.includes(item as BounceCategory))) {
      throw new Error('Unsupported inventory filter.')
    }
    return
  }

  if (filter.field === 'price') {
    if ((filter.operator !== 'less_than_or_equal' && filter.operator !== 'greater_than_or_equal') || typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('Unsupported inventory filter.')
    }
    return
  }

  if (filter.field === 'category') {
    if (filter.operator !== 'equals' || !isTextValue || !categoryValues.includes(value as BounceCategory)) throw new Error('Unsupported inventory filter.')
    return
  }

  if (filter.field === 'use_type') {
    if (filter.operator !== 'equals' || !isTextValue || !useTypeValues.includes(value as BounceUseType)) throw new Error('Unsupported inventory filter.')
    return
  }

  if (filter.field === 'name' || filter.field === 'size' || filter.field === 'company') {
    if ((filter.operator !== 'contains' && filter.operator !== 'equals') || !isTextValue) throw new Error('Unsupported inventory filter.')
    return
  }

  throw new Error('Unsupported inventory filter.')
}

export async function searchBounces(request: InventorySearchRequest): Promise<InventorySearchResult<Bounce>> {
  if (!supabase) {
    throw new Error('Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
  }
  if (!Number.isInteger(request.page) || request.page < 1 || !Number.isInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > 100) {
    throw new Error('Invalid inventory pagination request.')
  }
  request.filters.forEach(validateInventoryFilter)

  let companyIds: (string | number)[] | null = null
  const companyFilters = request.filters.filter((filter) => filter.field === 'company')
  for (const filter of companyFilters) {
    const companyQuery = supabase.from(COMPANY_TABLE_NAME).select('id').ilike('name', filter.operator === 'contains' ? `%${filter.value as string}%` : filter.value as string)
    const { data, error } = await companyQuery
    if (error) throw error
    const matches = (data ?? []).map((company) => company.id as string | number)
    companyIds = companyIds === null ? matches : companyIds.filter((id) => matches.includes(id))
  }

  if (companyIds && companyIds.length === 0) {
    return { items: [], total: 0, page: request.page, pageSize: request.pageSize }
  }

  let query = supabase
    .from(INVENTORY_TABLE_NAME)
    .select('id,name,company_id,company_url_id,category,use_type,price,size,image_url', { count: 'exact' })

  if (request.keyword.trim()) query = query.ilike('name', `%${request.keyword.trim()}%`)
  if (companyIds) query = query.in('company_id', companyIds)
  for (const filter of request.filters) {
    validateInventoryFilter(filter)
    const value = filter.value
    if (filter.field === 'company') continue
    if (filter.operator === 'in') query = query.in('category', value as string[])
    else if (filter.operator === 'less_than_or_equal') query = query.lte('price', value as number)
    else if (filter.operator === 'greater_than_or_equal') query = query.gte('price', value as number)
    else if (filter.field === 'name' && filter.operator === 'contains') query = query.ilike('name', `%${value as string}%`)
    else if (filter.field === 'size' && filter.operator === 'contains') query = query.ilike('size', `%${value as string}%`)
    else if (filter.field === 'name' && filter.operator === 'equals') query = query.eq('name', value as string)
    else if (filter.field === 'size' && filter.operator === 'equals') query = query.eq('size', value as string)
    else if (filter.field === 'category') query = query.eq('category', value as string)
    else if (filter.field === 'use_type') query = query.eq('use_type', value as string)
  }

  query = query.order(request.sortBy, { ascending: request.sortDirection === 'asc', nullsFirst: false })
  if (request.sortBy !== 'name') query = query.order('name', { ascending: true })

  const start = (request.page - 1) * request.pageSize
  const { data, error, count } = await query.range(start, start + request.pageSize - 1)
  if (error) throw error

  const inventory = data ?? []
  const companyIdSet = [...new Set(inventory.map((record) => record.company_id).filter((id) => id != null))]
  const companyUrlIdSet = [...new Set(inventory.map((record) => record.company_url_id).filter((id) => id != null))]
  const [{ data: companies, error: companiesError }, companyUrlsResult] = await Promise.all([
    companyIdSet.length
      ? supabase.from(COMPANY_TABLE_NAME).select('id,name').in('id', companyIdSet)
      : Promise.resolve({ data: [], error: null }),
    companyUrlIdSet.length
      ? supabase.from(COMPANY_URL_TABLE_NAME).select('id,url').in('id', companyUrlIdSet)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (companiesError) throw companiesError
  if (companyUrlsResult.error) throw companyUrlsResult.error

  const companyNames = new Map((companies ?? []).flatMap((company) => {
    const name = cleanText(company.name)
    return name ? [[String(company.id), name] as const] : []
  }))
  const productUrls = new Map((companyUrlsResult.data ?? []).flatMap((companyUrl) => {
    const url = cleanText(companyUrl.url)
    return url ? [[String(companyUrl.id), url] as const] : []
  }))

  return {
    items: inventory.map((record) => normalizeBounce(record, companyNames, productUrls)),
    total: count ?? 0,
    page: request.page,
    pageSize: request.pageSize,
  }
}
