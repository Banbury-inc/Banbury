import type { ImageUrlTabPayload } from '../../../../pages/Workspaces/types'
import type { GooglePlaceDetails, GooglePlacePhoto } from './googlePlaceDetailsTypes'
import { buildGooglePlacePhotoProxyUrl } from './buildGooglePlacePhotoProxyUrl'

interface HandlePlacePhotoClickParams {
  details: GooglePlaceDetails
  photo: GooglePlacePhoto
  index: number
  onPhotoOpen?: (image: ImageUrlTabPayload) => void
}

export function handlePlacePhotoClick({
  details,
  photo,
  index,
  onPhotoOpen,
}: HandlePlacePhotoClickParams) {
  if (!onPhotoOpen) return

  const placeName = details.name?.trim() || 'Place'
  const photoNumber = index + 1
  const title = `${placeName} photo ${photoNumber}`

  onPhotoOpen({
    imageUrl: buildGooglePlacePhotoProxyUrl(photo.name, { maxWidthPx: 1600, maxHeightPx: 1600 }),
    title,
    alt: `${placeName} photo ${photoNumber}`,
  })
}
