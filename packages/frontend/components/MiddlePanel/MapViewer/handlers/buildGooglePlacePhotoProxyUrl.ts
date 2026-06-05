export function buildGooglePlacePhotoProxyUrl(photoResourceName: string): string {
  const params = new URLSearchParams({ name: photoResourceName })

  return `/api/maps/google-place-photo?${params.toString()}`
}
