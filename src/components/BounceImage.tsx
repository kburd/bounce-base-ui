import { useState } from 'react'

type Props = { src: string | null; alt: string; large?: boolean }
export function BounceImage({ src, alt, large = false }: Props) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className={large ? 'image-placeholder image-placeholder-large' : 'image-placeholder'} aria-label={alt}>No image available</div>
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}
