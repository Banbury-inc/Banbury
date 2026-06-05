export interface GooglePlacePhotoAttribution {
  displayName?: string
  uri?: string
}

export interface GooglePlacePhoto {
  name: string
  widthPx?: number
  heightPx?: number
  authorAttributions: GooglePlacePhotoAttribution[]
}

export interface GooglePlaceReview {
  rating?: number
  text: string
  relativePublishTimeDescription?: string
  authorDisplayName?: string
  authorUri?: string
}

export interface GooglePlaceAmenityGroup {
  title: string
  items: string[]
}

export interface GooglePlaceDetails {
  id?: string
  name?: string
  address?: string
  phoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  businessStatus?: string
  priceLevel?: string
  rating?: number
  userRatingCount?: number
  types: string[]
  primaryType?: string
  isOpenNow?: boolean
  weekdayDescriptions: string[]
  photos: GooglePlacePhoto[]
  reviews: GooglePlaceReview[]
  amenityGroups: GooglePlaceAmenityGroup[]
}

export interface GooglePlaceDetailsResponse {
  isConfigured: boolean
  place?: GooglePlaceDetails
}
