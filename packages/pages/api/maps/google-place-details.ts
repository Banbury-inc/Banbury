import type { NextApiRequest, NextApiResponse } from 'next'
import type {
  GooglePlaceAmenityGroup,
  GooglePlaceDetails,
  GooglePlaceDetailsResponse,
  GooglePlacePhoto,
  GooglePlaceReview,
} from '@/components/MiddlePanel/MapViewer/handlers/googlePlaceDetailsTypes'

interface GooglePlaceDetailsRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
}

interface GoogleLocalizedText {
  text?: string
  languageCode?: string
}

interface GoogleOpeningHours {
  openNow?: boolean
  weekdayDescriptions?: string[]
}

interface GoogleAuthorAttribution {
  displayName?: string
  uri?: string
  photoUri?: string
}

interface GooglePhoto {
  name?: string
  widthPx?: number
  heightPx?: number
  authorAttributions?: GoogleAuthorAttribution[]
}

interface GoogleReview {
  name?: string
  relativePublishTimeDescription?: string
  rating?: number
  text?: GoogleLocalizedText | string
  originalText?: GoogleLocalizedText | string
  authorAttribution?: GoogleAuthorAttribution
}

interface GooglePlace extends Record<string, unknown> {
  id?: string
  displayName?: GoogleLocalizedText
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  businessStatus?: string
  priceLevel?: string
  rating?: number
  userRatingCount?: number
  types?: string[]
  primaryTypeDisplayName?: GoogleLocalizedText
  currentOpeningHours?: GoogleOpeningHours
  regularOpeningHours?: GoogleOpeningHours
  photos?: GooglePhoto[]
  reviews?: GoogleReview[]
  accessibilityOptions?: Record<string, boolean | undefined>
  parkingOptions?: Record<string, boolean | undefined>
  paymentOptions?: Record<string, boolean | undefined>
}

interface GoogleTextSearchResponse {
  places?: GooglePlace[]
}

const MAX_PHOTOS = 5
const MAX_REVIEWS = 5

const GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.businessStatus',
  'places.priceLevel',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.primaryTypeDisplayName',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
].join(',')

const GOOGLE_PLACE_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'businessStatus',
  'priceLevel',
  'rating',
  'userRatingCount',
  'types',
  'primaryTypeDisplayName',
  'currentOpeningHours',
  'regularOpeningHours',
  'photos',
  'reviews',
  'accessibilityOptions',
  'parkingOptions',
  'paymentOptions',
  'dineIn',
  'takeout',
  'delivery',
  'curbsidePickup',
  'reservable',
  'outdoorSeating',
  'restroom',
  'allowsDogs',
  'goodForChildren',
  'goodForGroups',
  'servesBeer',
  'servesWine',
  'servesBreakfast',
  'servesLunch',
  'servesDinner',
  'servesCoffee',
  'servesVegetarianFood',
  'servesBrunch',
  'servesCocktails',
  'servesDessert',
].join(',')

const ACCESSIBILITY_LABELS: Record<string, string> = {
  wheelchairAccessibleEntrance: 'Wheelchair-accessible entrance',
  wheelchairAccessibleParking: 'Wheelchair-accessible parking',
  wheelchairAccessibleRestroom: 'Wheelchair-accessible restroom',
  wheelchairAccessibleSeating: 'Wheelchair-accessible seating',
}

const PARKING_LABELS: Record<string, string> = {
  freeParking: 'Free parking',
  paidParking: 'Paid parking',
  freeStreetParking: 'Free street parking',
  paidStreetParking: 'Paid street parking',
  valetParking: 'Valet parking',
  freeGarageParking: 'Free garage parking',
  paidGarageParking: 'Paid garage parking',
}

const PAYMENT_LABELS: Record<string, string> = {
  acceptsCreditCards: 'Accepts credit cards',
  acceptsDebitCards: 'Accepts debit cards',
  acceptsCashOnly: 'Cash only',
  acceptsNfc: 'Accepts contactless / NFC',
}

const ROOT_SERVICE_FIELDS: { key: string; label: string }[] = [
  { key: 'dineIn', label: 'Dine-in' },
  { key: 'takeout', label: 'Takeout' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'curbsidePickup', label: 'Curbside pickup' },
  { key: 'reservable', label: 'Reservations' },
  { key: 'outdoorSeating', label: 'Outdoor seating' },
  { key: 'restroom', label: 'Restroom' },
  { key: 'allowsDogs', label: 'Dogs allowed' },
  { key: 'goodForChildren', label: 'Good for children' },
  { key: 'goodForGroups', label: 'Good for groups' },
  { key: 'servesBeer', label: 'Serves beer' },
  { key: 'servesWine', label: 'Serves wine' },
  { key: 'servesBreakfast', label: 'Serves breakfast' },
  { key: 'servesBrunch', label: 'Serves brunch' },
  { key: 'servesLunch', label: 'Serves lunch' },
  { key: 'servesDinner', label: 'Serves dinner' },
  { key: 'servesCoffee', label: 'Serves coffee' },
  { key: 'servesVegetarianFood', label: 'Vegetarian options' },
  { key: 'servesCocktails', label: 'Serves cocktails' },
  { key: 'servesDessert', label: 'Serves dessert' },
]

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
}

function getTextQuery({ name, address }: GooglePlaceDetailsRequest) {
  const parts = [name, address]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map(part => part.trim())

  return [...new Set(parts)].join(', ')
}

function getRequestBody(input: GooglePlaceDetailsRequest) {
  const textQuery = getTextQuery(input)
  const body: Record<string, unknown> = {
    textQuery,
    languageCode: 'en',
    maxResultCount: 1,
  }

  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    body.locationBias = {
      circle: {
        center: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
        radius: 500,
      },
    }
  }

  return body
}

function normalizePriceLevel(priceLevel?: string) {
  if (!priceLevel || priceLevel === 'PRICE_LEVEL_UNSPECIFIED') return undefined

  return priceLevel
    .replace('PRICE_LEVEL_', '')
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function labelsFromBooleanRecord(
  record: Record<string, boolean | undefined> | undefined,
  labelMap: Record<string, string>
): string[] {
  if (!record) return []

  return Object.entries(record)
    .filter((entry): entry is [string, true] => entry[1] === true)
    .map(([key]) => labelMap[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim())
}

function buildAmenityGroups(place: GooglePlace): GooglePlaceAmenityGroup[] {
  const groups: GooglePlaceAmenityGroup[] = []

  const accessibility = labelsFromBooleanRecord(place.accessibilityOptions, ACCESSIBILITY_LABELS)
  if (accessibility.length > 0) groups.push({ title: 'Accessibility', items: accessibility })

  const parking = labelsFromBooleanRecord(place.parkingOptions, PARKING_LABELS)
  if (parking.length > 0) groups.push({ title: 'Parking', items: parking })

  const payment = labelsFromBooleanRecord(place.paymentOptions, PAYMENT_LABELS)
  if (payment.length > 0) groups.push({ title: 'Payment', items: payment })

  const services: string[] = []
  for (const { key, label } of ROOT_SERVICE_FIELDS) {
    if (place[key] === true) services.push(label)
  }
  if (services.length > 0) groups.push({ title: 'Services', items: services })

  return groups
}

function reviewTextToString(text: GoogleLocalizedText | string | undefined): string {
  if (typeof text === 'string') return text
  if (text && typeof text === 'object' && 'text' in text && typeof text.text === 'string') return text.text

  return ''
}

function reviewBodyText(r: GoogleReview): string {
  const primary = reviewTextToString(r.text)
  if (primary.trim()) return primary

  return reviewTextToString(r.originalText)
}

function normalizePhotos(photos: GooglePhoto[] | undefined): GooglePlacePhoto[] {
  if (!photos?.length) return []

  return photos
    .slice(0, MAX_PHOTOS)
    .map((p): GooglePlacePhoto | null => {
      if (!p.name?.trim()) return null

      return {
        name: p.name,
        widthPx: p.widthPx,
        heightPx: p.heightPx,
        authorAttributions: (p.authorAttributions ?? []).map(a => ({
          displayName: a.displayName,
          uri: a.uri?.startsWith('//') ? `https:${a.uri}` : a.uri,
        })),
      }
    })
    .filter((p): p is GooglePlacePhoto => p !== null)
}

function normalizeReviews(reviews: GoogleReview[] | undefined): GooglePlaceReview[] {
  if (!reviews?.length) return []

  const sorted = [...reviews].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

  return sorted.slice(0, MAX_REVIEWS).map(r => {
    const rawText = reviewBodyText(r)
    const uri = r.authorAttribution?.uri

    return {
      rating: r.rating,
      text: rawText,
      relativePublishTimeDescription: r.relativePublishTimeDescription,
      authorDisplayName: r.authorAttribution?.displayName,
      authorUri: uri?.startsWith('//') ? `https:${uri}` : uri,
    }
  })
}

function mergePlace(searchHit: GooglePlace, details: GooglePlace | null): GooglePlace {
  if (!details) return { ...searchHit }

  return {
    ...searchHit,
    ...details,
    displayName: details.displayName ?? searchHit.displayName,
    formattedAddress: details.formattedAddress ?? searchHit.formattedAddress,
    nationalPhoneNumber: details.nationalPhoneNumber ?? searchHit.nationalPhoneNumber,
    internationalPhoneNumber: details.internationalPhoneNumber ?? searchHit.internationalPhoneNumber,
    websiteUri: details.websiteUri ?? searchHit.websiteUri,
    googleMapsUri: details.googleMapsUri ?? searchHit.googleMapsUri,
    businessStatus: details.businessStatus ?? searchHit.businessStatus,
    priceLevel: details.priceLevel ?? searchHit.priceLevel,
    rating: details.rating ?? searchHit.rating,
    userRatingCount: details.userRatingCount ?? searchHit.userRatingCount,
    types: details.types?.length ? details.types : searchHit.types,
    primaryTypeDisplayName: details.primaryTypeDisplayName ?? searchHit.primaryTypeDisplayName,
    currentOpeningHours: details.currentOpeningHours ?? searchHit.currentOpeningHours,
    regularOpeningHours: details.regularOpeningHours ?? searchHit.regularOpeningHours,
    photos: details.photos?.length ? details.photos : searchHit.photos,
    reviews: details.reviews?.length ? details.reviews : searchHit.reviews,
    accessibilityOptions: details.accessibilityOptions ?? searchHit.accessibilityOptions,
    parkingOptions: details.parkingOptions ?? searchHit.parkingOptions,
    paymentOptions: details.paymentOptions ?? searchHit.paymentOptions,
  }
}

function normalizePlace(place: GooglePlace): GooglePlaceDetails {
  const openingHours = place.currentOpeningHours || place.regularOpeningHours

  return {
    id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber,
    websiteUri: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    businessStatus: place.businessStatus,
    priceLevel: normalizePriceLevel(place.priceLevel as string | undefined),
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    types: place.types ?? [],
    primaryType: place.primaryTypeDisplayName?.text,
    isOpenNow: openingHours?.openNow,
    weekdayDescriptions: openingHours?.weekdayDescriptions ?? [],
    photos: normalizePhotos(place.photos),
    reviews: normalizeReviews(place.reviews),
    amenityGroups: buildAmenityGroups(place),
  }
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlace | null> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_PLACE_DETAILS_FIELD_MASK,
      },
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  try {
    return (await response.json()) as GooglePlace
  } catch {
    return null
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GooglePlaceDetailsResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = getGooglePlacesApiKey()
  if (!apiKey) return res.status(200).json({ isConfigured: false })

  const input = req.body as GooglePlaceDetailsRequest
  const textQuery = getTextQuery(input)
  if (!textQuery) return res.status(400).json({ error: 'Place name or address is required' })

  let response: Response
  try {
    response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(getRequestBody(input)),
    })
  } catch {
    return res.status(502).json({ error: 'Failed to connect to Google Places API' })
  }

  if (!response.ok) return res.status(502).json({ error: 'Failed to fetch Google place details' })

  const data = await response.json() as GoogleTextSearchResponse
  const searchHit = data.places?.[0]
  if (!searchHit) return res.status(200).json({ isConfigured: true, place: undefined })

  let merged: GooglePlace = { ...searchHit }
  if (typeof searchHit.id === 'string' && searchHit.id.length > 0) {
    const details = await fetchPlaceDetails(searchHit.id, apiKey)
    merged = mergePlace(searchHit, details)
  }

  return res.status(200).json({ isConfigured: true, place: normalizePlace(merged) })
}
