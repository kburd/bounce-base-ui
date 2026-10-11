/**
 * Opaque API boundary: the response shape remains undefined until the API contract is agreed.
 * Replace the intentional throw below with the real HTTP request once endpoint, auth, and
 * request/response schemas are defined.
 */
export type NaturalLanguageSearchResult = unknown

export class AISearchNotImplementedError extends Error {
  constructor() {
    super('AI search is not connected yet.')
    this.name = 'AISearchNotImplementedError'
  }
}

export async function submitNaturalLanguageSearch(request: string): Promise<NaturalLanguageSearchResult> {
  if (!request.trim()) {
    throw new Error('A search request is required.')
  }

  // TODO: Implement the API call here after its contract is defined. Do not infer criteria locally.
  throw new AISearchNotImplementedError()
}
