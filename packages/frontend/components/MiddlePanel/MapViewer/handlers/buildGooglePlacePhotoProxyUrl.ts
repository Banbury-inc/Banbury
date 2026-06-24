interface BuildGooglePlacePhotoProxyUrlOptions {
  maxWidthPx?: number
  maxHeightPx?: number
}

function appendPhotoSizeParam(params: URLSearchParams, key: string, value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return

  params.set(key, String(Math.round(value)))
}

export function buildGooglePlacePhotoProxyUrl(
  photoResourceName: string,
  options: BuildGooglePlacePhotoProxyUrlOptions = {}
): string {
  const params = new URLSearchParams({ name: photoResourceName })
  appendPhotoSizeParam(params, 'maxWidthPx', options.maxWidthPx)
  appendPhotoSizeParam(params, 'maxHeightPx', options.maxHeightPx)

  return `/api/maps/google-place-photo?${params.toString()}`
}
