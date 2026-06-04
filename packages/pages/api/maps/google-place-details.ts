import type { NextApiRequest, NextApiResponse } from 'next'

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

interface GooglePlace {
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
}

interface GoogleTextSearchResponse {
  places?: GooglePlace[]
}

export interface GooglePlaceDetailsResponse {
  isConfigured: boolean
  place?: {
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
  }
}

const GOOGLE_PLACES_FIELD_MASK = [
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

function normalizePlace(place: GooglePlace): GooglePlaceDetailsResponse['place'] {
  const openingHours = place.currentOpeningHours || place.regularOpeningHours

  return {
    id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber,
    websiteUri: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    businessStatus: place.businessStatus,
    priceLevel: normalizePriceLevel(place.priceLevel),
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    types: place.types ?? [],
    primaryType: place.primaryTypeDisplayName?.text,
    isOpenNow: openingHours?.openNow,
    weekdayDescriptions: openingHours?.weekdayDescriptions ?? [],
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
        'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASK,
      },
      body: JSON.stringify(getRequestBody(input)),
    })
  } catch {
    return res.status(502).json({ error: 'Failed to connect to Google Places API' })
  }

  if (!response.ok) return res.status(502).json({ error: 'Failed to fetch Google place details' })

  const data = await response.json() as GoogleTextSearchResponse
  const place = data.places?.[0]

  return res.status(200).json({ isConfigured: true, place: place ? normalizePlace(place) : undefined })
}
