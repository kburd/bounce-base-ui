import { useEffect, useRef } from 'react'
import { formatPrice } from '../lib/format'
import type { Bounce } from '../types/bounce'
import { BounceImage } from './BounceImage'

type Props = { bounce: Bounce; onClose: () => void }
export function BounceDetailModal({ bounce, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.body.classList.add('modal-open')
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close product details">×</button>
        <div className="modal-grid">
          <div className="modal-image"><BounceImage src={bounce.image_url} alt={`${bounce.name} from ${bounce.company}`} large /></div>
          <div className="modal-details">
            <p className="company-name">{bounce.company}</p>
            <h2 id="modal-title">{bounce.name}</h2>
            <dl>
              <div><dt>Category</dt><dd>{bounce.category}</dd></div>
              <div><dt>Use type</dt><dd>{bounce.use_type}</dd></div>
              <div><dt>Price</dt><dd>{formatPrice(bounce.price)}</dd></div>
              {bounce.size && <div><dt>Size</dt><dd>{bounce.size}</dd></div>}
            </dl>
            <p className="external-note">Original listing opens on the rental company website.</p>
            {bounce.product_url ? <a className="primary-link" href={bounce.product_url} target="_blank" rel="noopener noreferrer">View original listing</a> : <p className="unavailable-link">Original listing link unavailable.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
