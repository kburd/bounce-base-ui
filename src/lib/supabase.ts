import { createClient } from '@supabase/supabase-js'
import type { Bounce, BounceCategory, BounceUseType } from '../types/bounce'

export const INVENTORY_TABLE_NAME = 'candidate_extractions'
export const INVENTORY_RESULT_LIMIT = 500

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const cleanText = (value: unknown): string | null => {
  if (typeof value !== 'string') return value == null ? null : String(value)
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeCategory = (value: unknown): BounceCategory => {
  const category = cleanText(value)
  if (category === 'Bouncer' || category === 'Combo' || category === 'Slide' || category === 'Obstacle Course' || category === 'Game') return category
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

const normalizeBounce = (record: Record<string, unknown>): Bounce => ({
  id: record.id as string | number,
  name: cleanText(record.name) ?? 'Unnamed bounce rental',
  company: cleanText(record.company) ?? 'Unknown company',
  category: normalizeCategory(record.category),
  use_type: normalizeUseType(record.use_type),
  price: normalizePrice(record.price),
  size: cleanText(record.size),
  image_url: isValidHttpUrl(cleanText(record.image_url)) ? cleanText(record.image_url) : null,
  product_url: isValidHttpUrl(cleanText(record.product_url)) ? cleanText(record.product_url) : null,
})

export async function fetchBounces(): Promise<Bounce[]> {
  if (!supabase) {
    throw new Error('Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.')
  }

  const { data, error } = await supabase
    .from(INVENTORY_TABLE_NAME)
    .select('id,name,company,category,use_type,price,size,image_url,product_url')
    .order('company', { ascending: true })
    .order('name', { ascending: true })
    .limit(INVENTORY_RESULT_LIMIT)

  if (error) throw error
  return (data ?? []).map((record) => normalizeBounce(record))
}
