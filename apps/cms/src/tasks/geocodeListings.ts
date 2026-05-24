import type { TaskConfig } from 'payload'
import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'

// Configuration - can be overridden via environment variables
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10)
const DELAY_BETWEEN_REQUESTS = parseInt(process.env.DELAY_MS || '1000', 10) // 1 second default
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10)

// Geocode an address using OpenStreetMap Nominatim (free, no API key required)
async function geocodeAddress(address: string, retryCount = 0): Promise<[number, number] | null> {
  try {
    // Rate limiting: Nominatim requires max 1 request per second
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))

    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=nl`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Deelbaar-API/1.0', // Required by Nominatim
      },
    })

    if (!response.ok) {
      // Retry on server errors
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.log(
          `   ⚠️  Server error ${response.status}, retrying... (${retryCount + 1}/${MAX_RETRIES})`,
        )
        await new Promise((resolve) => setTimeout(resolve, 2000 * (retryCount + 1))) // Exponential backoff
        return geocodeAddress(address, retryCount + 1)
      }
      throw new Error(`Geocoding API returned ${response.status}`)
    }

    const data = await response.json()

    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      return [lon, lat] // Return as [longitude, latitude] for MongoDB
    }

    return null
  } catch (error) {
    // Retry on network errors
    if (retryCount < MAX_RETRIES && error instanceof Error && !error.message.includes('returned')) {
      console.log(`   ⚠️  Network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, 2000 * (retryCount + 1)))
      return geocodeAddress(address, retryCount + 1)
    }
    console.error(`Geocoding error for "${address}":`, error)
    return null
  }
}

export const geocodeListings: TaskConfig = {
  slug: 'geocodeListings',
  handler: async (args) => {
    const { req } = args
    const { payload } = req
    const rawCollection = (args.input && typeof args.input === 'object'
      ? (args.input as Record<string, unknown>).collection
      : undefined) as unknown

    const targetCollections = resolveCollections(rawCollection)
    if (!targetCollections) {
      return {
        state: 'failed' as const,
        errorMessage: `Invalid collection. Use one of: ${MAP_PLACE_COLLECTION_SLUGS.join(', ')}`,
      }
    }
    try {
      console.log('🗺️  Starting geocoding task...\n')
      console.log('📊 Configuration:')
      console.log(`   - Batch size: ${BATCH_SIZE}`)
      console.log(`   - Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`)
      console.log(`   - Max retries: ${MAX_RETRIES}`)
      console.log(`   - Collections: ${targetCollections.join(', ')}`)
      console.log('')

      let totalCount = 0
      const totalByCollection: Record<MapPlaceCollectionSlug, number> = {
        kiosks: 0,
        markets: 0,
        taps: 0,
      }

      for (const collection of targetCollections) {
        const count = await payload.count({
          collection,
          where: {
            and: [
              { 'location.address': { exists: true } },
              {
                or: [
                  { 'location.coordinates': { exists: false } },
                  { 'location.coordinates': { equals: null } },
                ],
              },
            ],
          },
        })
        totalByCollection[collection] = count.totalDocs
        totalCount += count.totalDocs
      }

      if (totalCount === 0) {
        console.log('✅ No places found that need geocoding')
        return {
          output: {
            success: true,
            message: 'No places found that need geocoding',
            totalProcessed: 0,
            totalSuccess: 0,
            totalFailed: 0,
          },
        }
      }

      console.log(`📋 Total places to geocode: ${totalCount}`)
      for (const collection of targetCollections) {
        console.log(`   - ${collection}: ${totalByCollection[collection]}`)
      }
      console.log(`📦 Processing in batches of ${BATCH_SIZE}`)
      console.log(`⏱️  Estimated time: ~${Math.ceil((totalCount * DELAY_BETWEEN_REQUESTS) / 1000)} seconds\n`)

      let totalProcessed = 0
      let totalSuccess = 0
      let totalFailed = 0
      const allErrors: Array<{ id: string; name: string; collection: MapPlaceCollectionSlug; error: string }> = []

      for (const collection of targetCollections) {
        let collectionBatchNumber = 0

        while (true) {
          collectionBatchNumber += 1
          const placesWithoutCoords = await payload.find({
            collection,
            where: {
              and: [
                { 'location.address': { exists: true } },
                {
                  or: [
                    { 'location.coordinates': { exists: false } },
                    { 'location.coordinates': { equals: null } },
                  ],
                },
              ],
            },
            limit: BATCH_SIZE,
            depth: 0,
          })

          if (placesWithoutCoords.docs.length === 0) {
            break
          }

          console.log(`\n📦 ${collection} batch ${collectionBatchNumber} (${placesWithoutCoords.docs.length} places)`)
          console.log('─'.repeat(60))

          let batchSuccess = 0
          let batchFailed = 0

          for (let i = 0; i < placesWithoutCoords.docs.length; i++) {
            const place = placesWithoutCoords.docs[i]
            const placeName = place.name || 'Unknown'
            const address = place.location?.address

            if (!address) {
              batchFailed += 1
              totalFailed += 1
              allErrors.push({
                id: String(place.id),
                name: placeName,
                collection,
                error: 'No address found',
              })
              console.log(`   ⚠️  [${i + 1}/${placesWithoutCoords.docs.length}] Skipping "${placeName}" - no address`)
              continue
            }

            try {
              const progress = `[${totalProcessed + i + 1}/${totalCount}]`
              process.stdout.write(`   ${progress} Geocoding "${String(placeName).substring(0, 40)}"... `)

              const coordinates = await geocodeAddress(address)

              if (coordinates) {
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

                batchSuccess += 1
                totalSuccess += 1
                console.log(`✅ [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`)
              } else {
                batchFailed += 1
                totalFailed += 1
                allErrors.push({
                  id: String(place.id),
                  name: placeName,
                  collection,
                  error: 'Could not geocode address',
                })
                console.log('❌ Failed')
              }
            } catch (err: unknown) {
              batchFailed += 1
              totalFailed += 1
              allErrors.push({
                id: String(place.id),
                name: placeName,
                collection,
                error: err instanceof Error ? err.message : String(err),
              })
              console.log(`❌ Error: ${err instanceof Error ? err.message : String(err)}`)
            }
          }

          totalProcessed += placesWithoutCoords.docs.length

          console.log(`\n   ✅ Batch completed: ${batchSuccess} succeeded, ${batchFailed} failed`)
          console.log(`   📊 Overall progress: ${totalProcessed}/${totalCount} (${totalSuccess} succeeded, ${totalFailed} failed)`)
        }
      }

      // Final Summary
      console.log('\n' + '='.repeat(60))
      console.log('📊 Final Geocoding Summary')
      console.log('='.repeat(60))
      console.log(`✅ Successfully geocoded: ${totalSuccess} places`)
      console.log(`❌ Failed: ${totalFailed} places`)
      console.log(`📋 Total processed: ${totalProcessed} places`)

      if (allErrors.length > 0) {
        console.log(`\n⚠️  Errors (showing first 20 of ${allErrors.length}):`)
        allErrors.slice(0, 20).forEach(({ collection, name, error }) => {
          console.log(`   - ${collection}/${name}: ${error}`)
        })
        if (allErrors.length > 20) {
          console.log(`   ... and ${allErrors.length - 20} more errors`)
        }
      }

      console.log('\n✨ Geocoding task completed!\n')

      return {
        output: {
          success: true,
          message: `Geocoding completed: ${totalSuccess} succeeded, ${totalFailed} failed`,
          totalProcessed,
          totalSuccess,
          totalFailed,
          collections: targetCollections,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('\n❌ Geocoding task failed:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}

function resolveCollections(rawCollection: unknown): MapPlaceCollectionSlug[] | null {
  if (rawCollection === undefined || rawCollection === null || rawCollection === '') {
    return [...MAP_PLACE_COLLECTION_SLUGS]
  }
  if (typeof rawCollection !== 'string') {
    return null
  }
  const parsed = rawCollection.trim() as MapPlaceCollectionSlug
  if (!MAP_PLACE_COLLECTION_SLUGS.includes(parsed)) {
    return null
  }
  return [parsed]
}
