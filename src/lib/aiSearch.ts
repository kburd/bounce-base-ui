import { hasSupabaseConfig, supabase } from './supabase'

export interface AiSearchResponse {
  success: boolean
  implemented: boolean
  query: string
  criteria: Record<string, unknown> | AiSearchCriterion[] | null
  message: string
  results?: unknown[]
  count?: number
}

export interface AiSearchCriterion {
  field: string
  operator: string
  value: unknown
  required?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isAiSearchResponse = (value: unknown): value is AiSearchResponse => {
  if (!isRecord(value)) return false
  const criteriaValid = value.criteria === null
    || isRecord(value.criteria)
    || (Array.isArray(value.criteria) && value.criteria.every((criterion) => (
      isRecord(criterion)
      && typeof criterion.field === 'string'
      && typeof criterion.operator === 'string'
      && 'value' in criterion
    )))

  return typeof value.success === 'boolean'
    && typeof value.implemented === 'boolean'
    && typeof value.query === 'string'
    && criteriaValid
    && typeof value.message === 'string'
}

export async function submitNaturalLanguageSearch(request: string): Promise<AiSearchResponse> {
  const query = request.trim()
  if (!query) {
    throw new Error('A search request is required.')
  }

  if (!hasSupabaseConfig || !supabase) {
    throw new Error('AI search is unavailable.')
  }

  const { data, error } = await supabase.functions.invoke<AiSearchResponse>('ai-search', {
    body: { query },
  })

  if (error) throw error
  if (!isAiSearchResponse(data)) throw new Error('AI search returned an invalid response.')

  return data
}
