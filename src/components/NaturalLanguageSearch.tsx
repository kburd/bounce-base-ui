import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { AISearchNotImplementedError, submitNaturalLanguageSearch } from '../lib/aiSearch'

type SearchStatus = 'idle' | 'loading' | 'success' | 'not-implemented' | 'error'

export function NaturalLanguageSearch() {
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedRequest = request.trim()
    if (!trimmedRequest || status === 'loading') return

    setStatus('loading')
    try {
      await submitNaturalLanguageSearch(trimmedRequest)
      setStatus('success')
    } catch (error) {
      setStatus(error instanceof AISearchNotImplementedError ? 'not-implemented' : 'error')
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const statusMessage = status === 'loading'
    ? 'Submitting your request…'
    : status === 'success'
      ? 'Your request was submitted. Search criteria will be available once the API contract is defined.'
      : status === 'not-implemented'
        ? 'Natural-language search is not connected yet. Your request is saved here so you can try again later.'
        : status === 'error'
          ? 'We couldn’t submit your request. Please try again later.'
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
      <form onSubmit={handleSubmit}>
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
            {status === 'loading' ? 'Submitting…' : 'Find my bounce house'}
          </button>
        </div>
        <p id="ai-search-status" className={`ai-search-status ${status}`} role="status" aria-live="polite">{statusMessage}</p>
      </form>
    </section>
  )
}
