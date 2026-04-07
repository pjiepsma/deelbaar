import type { TaskConfig } from 'payload'

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
    try {
      console.log('🗺️  Starting geocoding task...\n')
      console.log('📊 Configuration:')
      console.log(`   - Batch size: ${BATCH_SIZE}`)
      console.log(`   - Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`)
      console.log(`   - Max retries: ${MAX_RETRIES}`)
      console.log('')

      // First, count total listings that need geocoding
      const totalCount = await payload.count({
        collection: 'listings',
        where: {
          and: [
            {
              'location.address': {
                exists: true,
              },
            },
            {
              or: [
                {
                  'location.coordinates': {
                    exists: false,
                  },
                },
                {
                  'location.coordinates': {
                    equals: null,
                  },
                },
              ],
            },
          ],
        },
      })

      if (totalCount.totalDocs === 0) {
        console.log('✅ No listings found that need geocoding')
        return {
          output: {
            success: true,
            message: 'No listings found that need geocoding',
            totalProcessed: 0,
            totalSuccess: 0,
            totalFailed: 0,
          },
        }
      }

      console.log(`📋 Total listings to geocode: ${totalCount.totalDocs}`)
      console.log(`📦 Processing in batches of ${BATCH_SIZE}`)
      console.log(
        `⏱️  Estimated time: ~${Math.ceil((totalCount.totalDocs * DELAY_BETWEEN_REQUESTS) / 1000)} seconds\n`,
      )

      let totalProcessed = 0
      let totalSuccess = 0
      let totalFailed = 0
      const allErrors: Array<{ id: string; name: string; error: string }> = []
      let batchNumber = 0

      // Process in batches
      while (true) {
        batchNumber++

        // Find listings without coordinates but with addresses
        const listingsWithoutCoords = await payload.find({
          collection: 'listings',
          where: {
            and: [
              {
                'location.address': {
                  exists: true,
                },
              },
              {
                or: [
                  {
                    'location.coordinates': {
                      exists: false,
                    },
                  },
                  {
                    'location.coordinates': {
                      equals: null,
                    },
                  },
                ],
              },
            ],
          },
          limit: BATCH_SIZE,
          depth: 0,
        })

        if (listingsWithoutCoords.docs.length === 0) {
          break // No more listings to process
        }

        console.log(`\n📦 Batch ${batchNumber} (${listingsWithoutCoords.docs.length} listings)`)
        console.log('─'.repeat(60))

        let batchSuccess = 0
        let batchFailed = 0

        // Process each listing in this batch
        for (let i = 0; i < listingsWithoutCoords.docs.length; i++) {
          const listing = listingsWithoutCoords.docs[i]
          const address = listing.location?.address

          if (!address) {
            batchFailed++
            totalFailed++
            const error = {
              id: String(listing.id),
              name: listing.name || 'Unknown',
              error: 'No address found',
            }
            allErrors.push(error)
            console.log(
              `   ⚠️  [${i + 1}/${listingsWithoutCoords.docs.length}] Skipping "${listing.name}" - no address`,
            )
            continue
          }

          try {
            const progress = `[${totalProcessed + i + 1}/${totalCount.totalDocs}]`
            process.stdout.write(`   ${progress} Geocoding "${listing.name.substring(0, 40)}"... `)

            const coordinates = await geocodeAddress(address)

            if (coordinates) {
              // Update the listing with coordinates
              await payload.update({
                collection: 'listings',
                id: listing.id,
                data: {
                  location: {
                    ...listing.location,
                    coordinates,
                  },
                },
              })

              batchSuccess++
              totalSuccess++
              console.log(`✅ [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`)
            } else {
              batchFailed++
              totalFailed++
              const error = {
                id: String(listing.id),
                name: listing.name || 'Unknown',
                error: 'Could not geocode address',
              }
              allErrors.push(error)
              console.log(`❌ Failed`)
            }
          } catch (err: unknown) {
            batchFailed++
            totalFailed++
            const errorMessage = err instanceof Error ? err.message : String(err)
            const errorInfo = {
              id: String(listing.id),
              name: listing.name || 'Unknown',
              error: errorMessage,
            }
            allErrors.push(errorInfo)
            console.log(`❌ Error: ${errorInfo.error}`)
          }
        }

        totalProcessed += listingsWithoutCoords.docs.length

        console.log(
          `\n   ✅ Batch ${batchNumber} completed: ${batchSuccess} succeeded, ${batchFailed} failed`,
        )
        console.log(
          `   📊 Overall progress: ${totalProcessed}/${totalCount.totalDocs} (${totalSuccess} succeeded, ${totalFailed} failed)`,
        )
      }

      // Final Summary
      console.log('\n' + '='.repeat(60))
      console.log('📊 Final Geocoding Summary')
      console.log('='.repeat(60))
      console.log(`✅ Successfully geocoded: ${totalSuccess} listings`)
      console.log(`❌ Failed: ${totalFailed} listings`)
      console.log(`📋 Total processed: ${totalProcessed} listings`)

      if (allErrors.length > 0) {
        console.log(`\n⚠️  Errors (showing first 20 of ${allErrors.length}):`)
        allErrors.slice(0, 20).forEach(({ name, error }) => {
          console.log(`   - ${name}: ${error}`)
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
