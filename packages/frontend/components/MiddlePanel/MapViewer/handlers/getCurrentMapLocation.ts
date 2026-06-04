import { MapPlaceLocation } from '../../../../pages/Workspaces/types'

export function getCurrentMapLocation(fallbackLocation: MapPlaceLocation): Promise<MapPlaceLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation)
    return Promise.resolve(fallbackLocation)

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          name: 'Current location',
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: 12,
        })
      },
      () => resolve(fallbackLocation),
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 8000,
      }
    )
  })
}
