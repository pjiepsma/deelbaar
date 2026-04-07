import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  parseGoogleKML,
  cleanHtmlDescription,
  parseFacilitiesFromBijzonderheid,
} from '../../../../scripts/import-kml'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()
    const file = formData.get('kmlFile') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save uploaded file temporarily
    const tempPath = join(tmpdir(), `import-${Date.now()}.kml`)
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(tempPath, buffer)

    try {
      // Parse the KML file
      const parsedData = parseGoogleKML(tempPath)

      if (parsedData.length === 0) {
        return NextResponse.json(
          { error: 'No valid placemarks found in KML file' },
          { status: 400 },
        )
      }

      // Import logic here (similar to your existing script)
      const defaultOwnerEmail = process.env.DEFAULT_OWNER_EMAIL || 'info@deelbaar.com'
      const defaultCategory = (formData.get('category') as string) || 'other'
      const defaultPublishStatus = (formData.get('publishStatus') as string) || 'draft'

      // Get default owner
      let defaultOwner: string | number | null = null
      try {
        const users = await payload.find({
          collection: 'users',
          where: { email: { equals: defaultOwnerEmail } },
          limit: 1,
        })
        if (users.docs.length > 0) {
          defaultOwner = users.docs[0].id
        }
      } catch (_error) {
        console.log('Warning: Could not find default owner')
      }

      // Transform data to Payload Listings format
      const listingsData = parsedData.map((item) => {
        const extendedData = item.extendedData || {}

        // Build address from ExtendedData (Adres + Plaatsnaam) or use address tag
        let fullAddress = item.address || ''
        if (!fullAddress && extendedData.Adres && extendedData.Plaatsnaam) {
          fullAddress = `${extendedData.Adres}, ${extendedData.Plaatsnaam}`
        } else if (!fullAddress && extendedData.Adres) {
          fullAddress = extendedData.Adres
        } else if (!fullAddress && extendedData.Plaatsnaam) {
          fullAddress = extendedData.Plaatsnaam
        }
        if (!fullAddress) {
          fullAddress = item.name
        }

        // Build description: clean HTML description and add Bijzonderheid
        let description = ''
        if (item.description) {
          description = cleanHtmlDescription(item.description)
        }

        // Add Bijzonderheid to description if present
        const bijzonderheid = extendedData.Bijzonderheid?.trim()
        if (bijzonderheid && bijzonderheid !== description) {
          if (description) {
            description += `\n\nBijzonderheden: ${bijzonderheid}`
          } else {
            description = bijzonderheid
          }
        }

        // Fallback description
        if (!description) {
          description = `Minibieb locatie: ${item.name}`
          if (fullAddress) {
            description += `\nAdres: ${fullAddress}`
          }
        }

        // Build listing object
        const listing: {
          name: string
          description: string
          category: string
          publishStatus: string
          location: { address: string; coordinates: [number, number] }
          owner?: string | number
          facilities?: {
            facilities?: Array<{ facility: string }>
            contactInfo?: string
            rules?: string
          }
          tags?: Array<{ tag: string }>
        } = {
          name: item.name,
          description: description.trim(),
          category: defaultCategory,
          publishStatus: defaultPublishStatus,
          location: {
            address: fullAddress,
            coordinates: item.location?.coordinates as [number, number], // [longitude, latitude]
          },
        }

        if (defaultOwner) {
          listing.owner = defaultOwner
        }

        // Parse facilities from Bijzonderheid
        const facilities = parseFacilitiesFromBijzonderheid(bijzonderheid || '')
        const beheerder = extendedData.Beheerder?.trim()
        const internet = extendedData.Internet?.trim()

        if (facilities.length > 0 || internet || beheerder || bijzonderheid) {
          listing.facilities = {}

          if (facilities.length > 0) {
            listing.facilities.facilities = facilities.map((facility) => ({ facility }))
          }

          // Build contact info from Beheerder and Internet fields
          const contactParts: string[] = []
          if (beheerder) {
            contactParts.push(`Beheerder: ${beheerder}`)
          }
          if (internet) {
            contactParts.push(internet)
          }

          if (contactParts.length > 0) {
            listing.facilities.contactInfo = contactParts.join(' | ')
          }

          // Add Bijzonderheid as rules if it contains useful info
          if (bijzonderheid && bijzonderheid.length > 10) {
            listing.facilities.rules = bijzonderheid
          }
        }

        // Add tags from ExtendedData (excluding fields we've already used)
        const tagFields = [
          'Adres',
          'Plaatsnaam',
          'Provincie',
          'Bijzonderheid',
          'Internet',
          'Beheerder',
        ]
        const remainingData = Object.entries(extendedData)
          .filter(([key]) => !tagFields.includes(key))
          .filter(([, value]) => value && value.trim())

        if (remainingData.length > 0 || extendedData.Provincie) {
          listing.tags = []

          // Always add province as a tag
          if (extendedData.Provincie?.trim()) {
            listing.tags.push({ tag: `Provincie: ${extendedData.Provincie.trim()}` })
          }

          // Add other remaining fields as tags
          remainingData.forEach(([key, value]) => {
            listing.tags!.push({ tag: `${key}: ${value}` })
          })
        }

        return listing
      })

      // Import listings
      let successCount = 0
      const errors: Array<{ name: string; error: string }> = []

      for (const listingData of listingsData) {
        try {
          await payload.create({
            collection: 'listings',
            data: listingData,
          })
          successCount++
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push({ name: listingData.name, error: errorMsg })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Imported ${successCount} listings successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        results: { success: successCount, errors },
      })
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempPath)
      } catch (error) {
        console.error('Failed to clean up temp file:', error)
      }
    }
  } catch (error) {
    console.error('KML import error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
