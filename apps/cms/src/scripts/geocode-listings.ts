import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

const payload = await getPayload({ config })

// Configuration - can be overridden via environment variables
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10)
const DRY_RUN = process.env.DRY_RUN === 'true'
const DELAY_BETWEEN_REQUESTS = parseInt(process.env.DELAY_MS || '1000', 10) // 1 second default
const CONTINUE_ON_ERROR = process.env.CONTINUE_ON_ERROR !== 'false' // Default: true
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

async function geocodeListings() {
  try {
    console.log('🗺️  Starting standalone geocoding process...\n')
    console.log('📊 Configuration:')
    console.log(`   - Batch size: ${BATCH_SIZE}`)
    console.log(`   - Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`)
    console.log(`   - Max retries: ${MAX_RETRIES}`)
    console.log(`   - Continue on error: ${CONTINUE_ON_ERROR}`)
    if (DRY_RUN) {
      console.log('   - ⚠️  DRY RUN MODE - No listings will be updated')
    }
    console.log('')

    // Get all listings with addresses and filter in JavaScript
    // This is more reliable than Payload's query for checking missing nested fields
    const allListings = await payload.find({
      collection: 'listings',
      where: {
        and: [
          {
            'location.address': {
              exists: true,
            },
          },
          {
            'location.address': {
              not_equals: '',
            },
          },
        ],
      },
      limit: 10000, // Get all listings
      depth: 0,
    })

    // Filter listings that need geocoding (no valid coordinates)
    const listingsNeedingGeocoding = allListings.docs.filter((listing) => {
      const coords = listing.location?.coordinates
      // Check if coordinates are missing, null, or invalid
      if (!coords) return true
      if (!Array.isArray(coords)) return true
      if (coords.length !== 2) return true
      // Check if coordinates are valid numbers
      if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return true
      // Check if coordinates are not NaN
      if (isNaN(coords[0]) || isNaN(coords[1])) return true
      return false
    })

    const totalListings = await payload.count({
      collection: 'listings',
    })

    console.log(`📊 Debug info:`)
    console.log(`   - Total listings: ${totalListings.totalDocs}`)
    console.log(`   - Listings with address: ${allListings.docs.length}`)
    console.log(`   - Listings needing geocoding: ${listingsNeedingGeocoding.length}`)

    if (listingsNeedingGeocoding.length === 0) {
      console.log('\n✅ No listings found that need geocoding')
      if (allListings.docs.length > 0) {
        console.log('💡 Tip: All listings with addresses already have coordinates')
        // Show sample
        const sample = allListings.docs.slice(0, 3)
        console.log(`\n🔍 Sample listings with addresses:`)
        sample.forEach((listing, idx) => {
          const coords = listing.location?.coordinates
          const hasCoords =
            coords &&
            Array.isArray(coords) &&
            coords.length === 2 &&
            typeof coords[0] === 'number' &&
            typeof coords[1] === 'number'
          console.log(
            `   ${idx + 1}. "${listing.name}" - Address: "${listing.location?.address?.substring(0, 50)}..." - Has coords: ${hasCoords ? 'Yes' : 'No'}`,
          )
          if (coords) {
            console.log(`      Coordinates: ${JSON.stringify(coords)}`)
          }
        })
      }
      return
    }

    const totalCount = { totalDocs: listingsNeedingGeocoding.length }

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
    let currentIndex = 0
    while (currentIndex < listingsNeedingGeocoding.length) {
      batchNumber++

      // Get next batch from the filtered list
      const batch = listingsNeedingGeocoding.slice(currentIndex, currentIndex + BATCH_SIZE)
      const listingsWithoutCoords = { docs: batch }

      if (listingsWithoutCoords.docs.length === 0) {
        break // No more listings to process
      }

      currentIndex += BATCH_SIZE

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
            if (!DRY_RUN) {
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
            }

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
        } catch (err: any) {
          batchFailed++
          totalFailed++
          const error = {
            id: String(listing.id),
            name: String(listing.name || 'Unknown'),
            error: String(err?.message || err || 'Unknown error'),
          }
          allErrors.push(error)
          console.log(`❌ Error: ${error.error}`)

          if (!CONTINUE_ON_ERROR) {
            throw err
          }
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

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no listings were actually updated')
    }

    if (allErrors.length > 0) {
      console.log(`\n⚠️  Errors (showing first 20 of ${allErrors.length}):`)
      allErrors.slice(0, 20).forEach(({ name, error }) => {
        console.log(`   - ${name}: ${error}`)
      })
      if (allErrors.length > 20) {
        console.log(`   ... and ${allErrors.length - 20} more errors`)
      }
    }

    // Re-check if there are more listings to geocode (after processing)
    const remainingListings = await payload.find({
      collection: 'listings',
      where: {
        and: [
          {
            'location.address': {
              exists: true,
            },
          },
          {
            'location.address': {
              not_equals: '',
            },
          },
        ],
      },
      limit: 10000,
      depth: 0,
    })

    const remaining = remainingListings.docs.filter((listing) => {
      const coords = listing.location?.coordinates
      if (!coords) return true
      if (!Array.isArray(coords)) return true
      if (coords.length !== 2) return true
      if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return true
      if (isNaN(coords[0]) || isNaN(coords[1])) return true
      return false
    })

    if (remaining.length > 0) {
      console.log(`\n💡 Note: ${remaining.length} listings still need geocoding.`)
      console.log(`   Run this script again to continue processing.`)
    } else {
      console.log(`\n🎉 All listings have been geocoded!`)
    }

    console.log('\n✨ Standalone geocoding process completed!\n')
  } catch (error: any) {
    console.error('\n❌ Geocoding failed:', error?.message || error)
    throw error
  }
}

// Run the geocoding
geocodeListings()
  .then(() => {
    exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    exit(1)
  })
