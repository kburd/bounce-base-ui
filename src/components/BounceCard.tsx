import { BounceImage } from './BounceImage'
import type { Bounce } from '../types/bounce'
import { formatPrice } from '../lib/format'

type Props = { bounce: Bounce; onSelect: (bounce: Bounce) => void }
export function BounceCard({ bounce, onSelect }: Props) {
  return (
    <button className="bounce-card" onClick={() => onSelect(bounce)} aria-label={`View details for ${bounce.name} from ${bounce.company}`}>
      <div className="card-image"><BounceImage src={bounce.image_url} alt={`${bounce.name} from ${bounce.company}`} /></div>
      <div className="card-body">
        <p className="company-name">{bounce.company}</p>
        <h2>{bounce.name}</h2>
        <div className="pill-row"><span>{bounce.category}</span><span>{bounce.use_type}</span></div>
        <p className="price">{formatPrice(bounce.price)}</p>
        {bounce.size && <p className="meta"><strong>Size:</strong> {bounce.size}</p>}
      </div>
    </button>
  )
}
