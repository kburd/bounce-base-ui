import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { submitNaturalLanguageSearch, type AiSearchResponse } from '../lib/aiSearch'

type SearchStatus = 'idle' | 'loading' | 'success' | 'not-implemented' | 'error'
type Props = { onSearchResponse: (response: AiSearchResponse) => void }

export function NaturalLanguageSearch({ onSearchResponse }: Props) {
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')
  const isSubmitting = useRef(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedRequest = request.trim()
    if (!trimmedRequest || isSubmitting.current) return

    isSubmitting.current = true
    setStatus('loading')
    try {
      const response = await submitNaturalLanguageSearch(trimmedRequest)
      setStatus(response.implemented ? 'success' : 'not-implemented')
      onSearchResponse(response)
    } catch {
      setStatus('error')
    } finally {
      isSubmitting.current = false
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const statusMessage = status === 'loading'
    ? 'Contacting AI search…'
    : status === 'success'
      ? 'Your AI search request was processed.'
      : status === 'not-implemented'
        ? 'AI search is not available yet. Please browse the catalog while we work on this feature.'
        : status === 'error'
          ? 'We couldn’t connect to AI search. Please check your connection and try again.'
        : ''

  return (
    <section className="ai-search" aria-labelledby="ai-search-title">
      <div className="ai-search-heading">
        <span className="ai-search-icon" aria-hidden="true">✦</span>
        <div>
          <p className="eyebrow">Natural-language search</p>
          <h2 id="ai-search-title">Tell us what you’re looking for</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} aria-busy={status === 'loading'}>
        <label className="sr-only" htmlFor="natural-language-request">Describe the bounce house rental you want</label>
        <textarea
          id="natural-language-request"
          value={request}
          onChange={(event) => {
            setRequest(event.target.value)
            if (status !== 'loading') setStatus('idle')
          }}
          onKeyDown={handleKeyDown}
          placeholder="A princess-themed bounce house with a slide for a birthday party, under $300."
          rows={3}
          aria-describedby="ai-search-help ai-search-status"
        />
        <div className="ai-search-footer">
          <p id="ai-search-help">Describe the style, features, or budget you have in mind.</p>
          <button className="ai-search-submit" type="submit" disabled={!request.trim() || status === 'loading'}>
            {status === 'loading' && <span className="search-spinner" aria-hidden="true" />}
            {status === 'loading' ? 'Searching…' : 'Find my bounce house'}
          </button>
        </div>
        <p id="ai-search-status" className={`ai-search-status ${status}`} role="status" aria-live="polite">{statusMessage}</p>
      </form>
    </section>
  )
}
