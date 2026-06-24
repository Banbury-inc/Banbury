import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

const mapPlaceSchema = z.object({
  name: z.string().optional().describe("Display name for the place."),
  address: z.string().optional().describe("Optional street address or place description."),
  categories: z.array(z.string()).optional().describe("Optional place categories."),
  mapboxId: z.string().optional().describe("Optional Mapbox feature id."),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees."),
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees."),
  zoom: z.number().min(0).max(22).default(14).describe("Preferred Mapbox zoom level."),
})

function normalizePlace(place: z.infer<typeof mapPlaceSchema>) {
  return {
    ...place,
    name: place.name?.trim() || "Selected place",
    zoom: place.zoom ?? 14,
  }
}

function getMapToolsDisabledResult() {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { map_tools?: boolean }
  if (prefs.map_tools !== false) return null

  return JSON.stringify({
    success: false,
    error: "Map tools are disabled by user preference",
  })
}

export const mapOpenViewerTool = tool(
  async (input: { place?: z.infer<typeof mapPlaceSchema> }) => {
    const disabledResult = getMapToolsDisabledResult()
    if (disabledResult) return disabledResult

    const place = input.place ? normalizePlace(input.place) : null

    return JSON.stringify({
      success: true,
      action: "open",
      place,
      places: place ? [place] : [],
      message: place ? `Opening map at ${place.name}.` : "Opening map viewer.",
    })
  },
  {
    name: "map_open_viewer",
    description:
      "Open the map viewer in the workspace middle panel. Optionally provide a place with longitude and latitude to center the map.",
    schema: z.object({
      place: mapPlaceSchema.optional().describe("Optional place to center and highlight when opening the map."),
    }),
  }
)

export const mapHighlightPlacesTool = tool(
  async (input: { places: z.infer<typeof mapPlaceSchema>[]; title?: string }) => {
    const disabledResult = getMapToolsDisabledResult()
    if (disabledResult) return disabledResult

    const places = input.places.map(normalizePlace)

    return JSON.stringify({
      success: true,
      action: "highlight",
      title: input.title?.trim() || (places.length === 1 ? places[0].name : "Highlighted places"),
      place: places[0] ?? null,
      places,
      message: `Highlighting ${places.length} ${places.length === 1 ? "place" : "places"} on the map.`,
    })
  },
  {
    name: "map_highlight_places",
    description:
      "Open or update the map viewer and highlight one or more places with markers. Requires longitude and latitude for each place.",
    schema: z.object({
      title: z.string().optional().describe("Optional tab title for the highlighted map."),
      places: z.array(mapPlaceSchema).min(1).describe("Places to highlight on the map."),
    }),
  }
)

export const mapFavoritePlacesTool = tool(
  async (input: { places: z.infer<typeof mapPlaceSchema>[]; openMap?: boolean }) => {
    const disabledResult = getMapToolsDisabledResult()
    if (disabledResult) return disabledResult

    const places = input.places.map(normalizePlace)

    return JSON.stringify({
      success: true,
      action: "favorite",
      openMap: input.openMap !== false,
      place: places[0] ?? null,
      places,
      message: `Saving ${places.length} ${places.length === 1 ? "place" : "places"} to favorites.`,
    })
  },
  {
    name: "map_favorite_places",
    description:
      "Save one or more places as map favorites. Requires longitude and latitude for each place. Can also open the map to those places.",
    schema: z.object({
      openMap: z.boolean().optional().describe("Whether to also open the map and highlight these places. Defaults to true."),
      places: z.array(mapPlaceSchema).min(1).describe("Places to save as favorites."),
    }),
  }
)
