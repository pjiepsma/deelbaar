import { type Endpoint } from 'payload'
import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'

export const geocodeListingsEndpoint: Endpoint = {
  path: '/geocode-listings',
  method: 'post',
  handler: async (req) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return Response.json({ message: 'Unauthorized' }, { status: 403 })
      }

      const requestedCollection = readCollectionParam(req)
      if (requestedCollection === null) {
        return Response.json(
          {
            message: `Invalid collection. Use one of: ${MAP_PLACE_COLLECTION_SLUGS.join(', ')}`,
          },
          { status: 400 },
        )
      }

      const targetCollections = requestedCollection ? [requestedCollection] : [...MAP_PLACE_COLLECTION_SLUGS]
      const docsByCollection = await collectPlaceDocsWithoutCoordinates(req, targetCollections)
      const total = docsByCollection.reduce((acc, row) => acc + row.docs.length, 0)

      if (total === 0) {
        return Response.json({ message: 'No places found that need geocoding', total: 0, collections: targetCollections })
      }

      geocodeInBackground(req, docsByCollection).catch((err) => {
        console.error('Background geocoding error:', err)
      })

      return Response.json({
        message: `Started geocoding ${total} places`,
        total,
        collections: targetCollections,
      })
    } catch (error) {
      console.error('Geocode endpoint error:', error)
      return Response.json(
        { message: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 },
      )
    }
  },
}

function readCollectionParam(req: Parameters<Endpoint['handler']>[0]): MapPlaceCollectionSlug | null | undefined {
  const bodyCollection =
    req.data && typeof req.data === 'object' ? (req.data as Record<string, unknown>).collection : undefined
  const queryCollection =
    req.query && typeof req.query === 'object'
      ? (req.query as Record<string, unknown>).collection
      : undefined
  const raw = (typeof bodyCollection === 'string' ? bodyCollection : queryCollection) ?? undefined
  if (raw === undefined) {
    return undefined
  }
  if (typeof raw !== 'string') {
    return null
  }
  const value = raw.trim() as MapPlaceCollectionSlug
  return MAP_PLACE_COLLECTION_SLUGS.includes(value) ? value : null
}

async function collectPlaceDocsWithoutCoordinates(
  req: Parameters<Endpoint['handler']>[0],
  collections: readonly MapPlaceCollectionSlug[],
): Promise<Array<{ collection: MapPlaceCollectionSlug; docs: Array<Record<string, unknown>> }>> {
  const rows: Array<{ collection: MapPlaceCollectionSlug; docs: Array<Record<string, unknown>> }> = []

  for (const collection of collections) {
    const result = await req.payload.find({
      collection,
      limit: 5000,
      depth: 0,
    })
    const docs = result.docs.filter((doc) => {
      const location = (doc as { location?: { coordinates?: unknown; address?: unknown } }).location
      return !location?.coordinates && typeof location?.address === 'string' && location.address.trim().length > 0
    }) as Array<Record<string, unknown>>
    rows.push({ collection, docs })
  }

  return rows
}

async function geocodeInBackground(
  req: Parameters<Endpoint['handler']>[0],
  docsByCollection: Array<{ collection: MapPlaceCollectionSlug; docs: Array<Record<string, unknown>> }>,
) {
  const total = docsByCollection.reduce((acc, row) => acc + row.docs.length, 0)
  console.log(`🗺️  Starting geocoding for ${total} places...`)

  let succeeded = 0
  let failed = 0

  for (const { collection, docs } of docsByCollection) {
    for (const place of docs) {
      try {
        const location = place.location as { address?: string } | undefined
        const address = location?.address
      if (!address) {
          failed++
          continue
      }

        const encodedAddress = encodeURIComponent(address)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=nl&limit=1`

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Deelbaar-API/1.0',
          },
        })

        if (!response.ok) {
          console.error(`Failed to geocode ${collection}/${String(place.id)}: HTTP ${response.status}`)
          failed++
          await delay(1000)
          continue
        }

        const data = await response.json()

        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          const locationData = place.location && typeof place.location === 'object' ? place.location : {}

          await req.payload.update({
            collection,
            id: String(place.id),
            data: {
              location: {
                ...locationData,
                coordinates: [parseFloat(lon), parseFloat(lat)],
              },
            },
          })

          console.log(`✓ Geocoded ${collection}/${String(place.id)}: [${lon}, ${lat}]`)
          succeeded++
        } else {
          console.warn(`✗ No results for ${collection}/${String(place.id)} (${address})`)
          failed++
        }

        await delay(1000)
      } catch (error) {
        console.error(`Error geocoding ${collection}/${String(place.id)}:`, error)
        failed++
        await delay(1000)
      }
    }
  }

  console.log('\n🎉 Geocoding complete!')
  console.log(`   ✓ Succeeded: ${succeeded}`)
  console.log(`   ✗ Failed: ${failed}`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

