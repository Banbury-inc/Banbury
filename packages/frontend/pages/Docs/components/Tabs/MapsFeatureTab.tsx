import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function MapsFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Maps
        </Typography>

        <Typography variant="p" className="mb-4">
          Explore locations in an interactive Mapbox map inside the workspace. Search for places, get directions, save favorites, draw measurements, and layer weather and traffic data. The agent can open the map, highlight locations, and save places when the <strong>Maps</strong> tool is enabled in the composer.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Where to find Maps</Typography>
          <Typography variant="p" className="mb-3">
            In the workspace left sidebar, open <strong>Maps</strong>. Use <strong>Open Map</strong> to launch a map tab in the middle panel, or click a saved favorite or recent place to jump back to it.
          </Typography>
          <Typography variant="p">
            Maps require a configured <code className="text-sm">NEXT_PUBLIC_MAPBOX_TOKEN</code>. When Google Places is configured, selected locations can show enriched details such as hours, ratings, photos, and a link to Google Maps.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Visibility</Typography>
          <Typography variant="list">
            <li>The agent can open the map viewer and see the current place, highlighted markers, and saved drawings for a location.</li>
            <li>Place search, directions routes, and layer settings are visible in the map UI as you work.</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Actions — you can</Typography>
          <Typography variant="list">
            <li><strong>Search places</strong> with Mapbox Search and fly to a selected result.</li>
            <li><strong>View place details</strong> in the side panel, including categories, hours, contact info, and photos when available.</li>
            <li><strong>Get directions</strong> between an origin and destination with driving, walking, and cycling profiles.</li>
            <li><strong>Save favorites</strong> and revisit them from the Maps sidebar; recent places are tracked automatically.</li>
            <li><strong>Draw on the map</strong> with points, distance lines, and area polygons; label features, save them to a place, or export GeoJSON.</li>
            <li><strong>Change basemaps</strong> (Standard, Streets, Satellite, Outdoors, Light, Dark) and toggle overlays such as traffic, terrain, 3D buildings, weather radar, temperature, and wind.</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Actions — Banbury can</Typography>
          <Typography variant="p" className="mb-3">
            Enable the <strong>Maps</strong> tool in the composer tool menu (enabled by default). The agent can then:
          </Typography>
          <Typography variant="list">
            <li><strong>Open the map viewer</strong> — optionally centered on a place with longitude, latitude, and zoom.</li>
            <li><strong>Highlight places</strong> — open or update the map with one or more markers and an optional tab title.</li>
            <li><strong>Save map favorites</strong> — persist places to your favorites list and optionally open the map to those locations.</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Saved places</Typography>
          <Typography variant="p" className="mb-3">
            Favorites and recents live in the Maps left panel. Each saved place stores its name, coordinates, zoom level, and any drawings you saved for that location. You can delete places you no longer need.
          </Typography>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Related features</Typography>
          <Typography variant="list">
            <li>
              <Link href="/docs/browse-feature" className="underline underline-offset-4">Browse</Link> — web research when you need information beyond what the map shows
            </li>
            <li>
              <Link href="/docs/calendar-feature" className="underline underline-offset-4">Calendar</Link> — plan events and travel alongside location context
            </li>
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
