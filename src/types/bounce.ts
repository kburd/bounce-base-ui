export type BounceCategory = 'Bouncer' | 'Combo' | 'Slide' | 'Obstacle Course' | 'Game' | 'Unknown'
export type BounceUseType = 'Dry' | 'Wet' | 'Both' | 'Unknown'

export type Bounce = {
  id: string | number
  name: string
  company: string
  category: BounceCategory
  use_type: BounceUseType
  price: number | null
  size: string | null
  image_url: string | null
  product_url: string | null
}

export type BounceFilters = {
  search: string
  category: string
  useType: string
  company: string
  minPrice: string
  maxPrice: string
}
