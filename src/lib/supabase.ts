import { createClient } from '@supabase/supabase-js'
import type { Bounce, BounceCategory, BounceUseType } from '../types/bounce'

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
