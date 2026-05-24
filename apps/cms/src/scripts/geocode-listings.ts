import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'
import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'

const payload = await getPayload({ config })

const DELAY_BETWEEN_REQUESTS = parseInt(process.env.DELAY_MS || '1000', 10)
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10)

async function geocodeAddress(address: string, retryCount = 0): Promise<[number, number] | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=nl`
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Deelbaar-API/1.0',
      },
    })
    if (!response.ok) {
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        return geocodeAddress(address, retryCount + 1)
      }
      return null
    }
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null
    }
    return [lon, lat]
  } catch {
    if (retryCount < MAX_RETRIES) {
      return geocodeAddress(address, retryCount + 1)
    }
    return null
  }
}

function needsGeocoding(place: { location?: { coordinates?: unknown } }): boolean {
  const coordinates = place.location?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return true
  }
  const [longitude, latitude] = coordinates
  return typeof longitude !== 'number' || typeof latitude !== 'number'
}

async function geocodeCollection(collection: MapPlaceCollectionSlug): Promise<{ ok: number; failed: number }> {
  const places = await payload.find({
    collection,
    where: {
      and: [{ 'location.address': { exists: true } }, { 'location.address': { not_equals: '' } }],
    },
    limit: 10000,
    depth: 0,
  })

  let ok = 0
  let failed = 0
  for (const place of places.docs) {
    if (!needsGeocoding(place)) {
      continue
    }
    const address = place.location?.address
    if (typeof address !== 'string' || address.trim().length === 0) {
      failed += 1
      continue
    }
    const coordinates = await geocodeAddress(address)
    if (!coordinates) {
      failed += 1
      continue
    }
    await payload.update({
      collection,
      id: place.id,
      data: {
        location: {
          ...place.location,
          coordinates,
        },
      },
    })
    ok += 1
  }
  return { ok, failed }
}

async function geocodeMapPlaces() {
  let totalOk = 0
  let totalFailed = 0
  for (const collection of MAP_PLACE_COLLECTION_SLUGS) {
    console.log(`🗺️  Geocoding ${collection}...`)
    const result = await geocodeCollection(collection)
    totalOk += result.ok
    totalFailed += result.failed
    console.log(`   ✅ ${collection}: ${result.ok} geocoded, ${result.failed} failed`)
  }
  console.log(`\nDone. ${totalOk} geocoded, ${totalFailed} failed.`)
}

geocodeMapPlaces()
  .then(() => {
    exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    exit(1)
  })
