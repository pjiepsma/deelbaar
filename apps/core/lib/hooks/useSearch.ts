import { useQuery } from '@tanstack/react-query'
import { getPayloadSdk, payloadSdkTry } from '../api/payloadSdk'
import { ListingRecord } from '../types/models'

interface SearchOptions {
  category?: string
  location?: { lat: number; lon: number }
  radius?: number
}

/**
 * Search listings using Payload's built-in REST API with complex where queries
 */
export function useListingsSearch(query: string, options?: SearchOptions) {
  return useQuery({
    queryKey: ['listings', 'search', query, options],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return { docs: [], totalDocs: 0 }
      }

      // Build complex where clause
      const whereConditions: any[] = [
        // Only live listings
        { publishStatus: { equals: 'live' } },
        // Text search across multiple fields
        {
          or: [
            { name: { contains: query } },
            { description: { contains: query } },
            { 'tags.tag': { contains: query } },
          ],
        },
      ]

      // Add category filter if provided
      if (options?.category) {
        whereConditions.push({ category: { equals: options.category } })
      }

      // Add geospatial filter if location provided
      if (options?.location) {
        const { lat, lon } = options.location
        const radius = options.radius || 50000 // 50km default

        whereConditions.push({
          'location.coordinates': {
            near: [lon, lat, radius],
          },
        })
      }

      const where = {
        and: whereConditions,
      }

      // Execute search
      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'listings',
          where,
          limit: 50,
          depth: 2,
        })
      )

      if (error) {
        console.error('[useListingsSearch] Error:', error)
        throw new Error(error.message)
      }

      // Calculate distances if location provided
      let docs = (data?.docs || []) as ListingRecord[]

      if (options?.location) {
        docs = docs.map((listing) => {
          if (listing.location?.coordinates) {
            const [lon, lat] = listing.location.coordinates
            const distance = calculateDistance(
              options.location!.lat,
              options.location!.lon,
              lat,
              lon
            )
            return {
              ...listing,
              distance: Math.round(distance * 100) / 100, // Round to 2 decimals
            }
          }
          return listing
        })

        // Sort by distance
        docs.sort((a: any, b: any) => {
          return (a.distance || Infinity) - (b.distance || Infinity)
        })
      }

      return {
        docs,
        totalDocs: data?.totalDocs || 0,
      }
    },
    enabled: query.trim().length > 0, // Only search if query is not empty
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Haversine formula to calculate distance between two coordinates (in kilometers)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}



