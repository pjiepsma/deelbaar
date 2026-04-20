import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'
import { readFileSync, existsSync } from 'fs'
import { DOMParser } from '@xmldom/xmldom'
import path from 'path'

const payload = await getPayload({ config })

// Configuration - can be overridden via environment variables
const KML_FILE_PATH = process.env.KML_FILE_PATH || './data/import.kml'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10)
const DEFAULT_OWNER_EMAIL = process.env.DEFAULT_OWNER_EMAIL || 'info@deelbaar.com'
const DEFAULT_CATEGORY = (process.env.DEFAULT_CATEGORY || 'other') as
  | 'book'
  | 'food'
  | 'hygiene'
  | 'community'
  | 'farm'
  | 'other'
const DEFAULT_PUBLISH_STATUS = (process.env.DEFAULT_PUBLISH_STATUS || 'draft') as 'draft' | 'live'

export interface ParsedPlacemark {
  name: string
  description?: string
  location?: {
    type: 'Point' | 'LineString' | 'Polygon'
    coordinates: number[] | number[][] | number[][][]
  }
  address?: string
  extendedData?: Record<string, string>
  styleUrl?: string
}

// Parse Google KML export
export function parseGoogleKML(filePath: string): ParsedPlacemark[] {
  console.log(`📖 Reading KML file: ${filePath}`)

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = readFileSync(filePath, 'utf8')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(content, 'text/xml')

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror')[0]
  if (parseError) {
    throw new Error(`Failed to parse KML file: ${parseError.textContent}`)
  }

  const placemarks = xmlDoc.getElementsByTagName('Placemark')
  const data: ParsedPlacemark[] = []

  console.log(`   Found ${placemarks.length} placemarks`)

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i]
    const item: ParsedPlacemark = {
      name: '',
    }

    // Extract name
    const nameEl = placemark.getElementsByTagName('name')[0]
    if (nameEl) {
      item.name = nameEl.textContent?.trim() || `Location ${i + 1}`
    } else {
      item.name = `Location ${i + 1}`
    }

    // Extract address tag if available
    const addressEl = placemark.getElementsByTagName('address')[0]
    if (addressEl) {
      item.address = addressEl.textContent?.trim() || ''
    }

    // Extract description (often contains HTML in Google exports)
    const descEl = placemark.getElementsByTagName('description')[0]
    if (descEl) {
      const desc = descEl.textContent?.trim() || ''
      item.description = desc
    }

    // Extract coordinates - handle Point, LineString, and Polygon
    const point = placemark.getElementsByTagName('Point')[0]
    const lineString = placemark.getElementsByTagName('LineString')[0]
    const polygon = placemark.getElementsByTagName('Polygon')[0]

    if (point) {
      const coordsEl = point.getElementsByTagName('coordinates')[0]
      if (coordsEl) {
        const coords = coordsEl.textContent?.trim().split(',') || []
        if (coords.length >= 2) {
          item.location = {
            type: 'Point',
            coordinates: [parseFloat(coords[0]), parseFloat(coords[1])], // [longitude, latitude]
          }
        }
      }
    } else if (lineString) {
      const coordsEl = lineString.getElementsByTagName('coordinates')[0]
      if (coordsEl) {
        const coordPairs = coordsEl.textContent?.trim().split(/\s+/)
        item.location = {
          type: 'LineString',
          coordinates: coordPairs
            .map((pair) => {
              const [lon, lat] = pair.split(',')
              return [parseFloat(lon), parseFloat(lat)]
            })
            .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat)),
        }
      }
    } else if (polygon) {
      const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0]
      if (outerBoundary) {
        const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0]
        const coordsEl = linearRing.getElementsByTagName('coordinates')[0]
        if (coordsEl) {
          const coordPairs = coordsEl.textContent?.trim().split(/\s+/)
          item.location = {
            type: 'Polygon',
            coordinates: [
              coordPairs
                .map((pair) => {
                  const [lon, lat] = pair.split(',')
                  return [parseFloat(lon), parseFloat(lat)]
                })
                .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat)),
            ],
          }
        }
      }
    }

    // Extract style information
    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]
    if (styleUrl) {
      item.styleUrl = styleUrl.textContent?.trim()
    }

    // Extract extended data
    const extendedData = placemark.getElementsByTagName('ExtendedData')[0]
    if (extendedData) {
      const dataElements = extendedData.getElementsByTagName('Data')
      const extended: Record<string, string> = {}

      for (let j = 0; j < dataElements.length; j++) {
        const dataEl = dataElements[j]
        const name = dataEl.getAttribute('name')
        const valueEl = dataEl.getElementsByTagName('value')[0]
        if (name && valueEl) {
          extended[name] = valueEl.textContent?.trim() || ''
        }
      }

      if (Object.keys(extended).length > 0) {
        item.extendedData = extended
      }
    }

    // Only add items with valid location data (Points only for now, as Listings uses point type)
    if (item.location && item.location.type === 'Point') {
      data.push(item)
    } else if (item.location) {
      console.log(`   ⚠️  Skipping ${item.name} - ${item.location.type} geometry not supported (only Points are supported for Listings)`)
    } else {
      console.log(`   ⚠️  Skipping ${item.name} - no valid coordinates found`)
    }
  }

  return data
}

// Clean HTML from description text
export function cleanHtmlDescription(html: string): string {
  if (!html) return ''
  
  // Remove CDATA wrapper if present
  let cleaned = html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  
  // Remove HTML tags but preserve line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')
  cleaned = cleaned.replace(/<\/p>/gi, '\n')
  cleaned = cleaned.replace(/<[^>]+>/g, '')
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim()
  
  return cleaned
}

// Parse Bijzonderheid (special notes) to extract facility keywords
export function parseFacilitiesFromBijzonderheid(bijzonderheid: string): string[] {
  if (!bijzonderheid) return []
  
  const facilities: string[] = []
  const lower = bijzonderheid.toLowerCase()
  
  // Map Dutch keywords to facility values
  if (lower.includes('binnen') || lower.includes('indoor')) {
    facilities.push('indoor')
  }
  if (lower.includes('buiten') || lower.includes('outdoor')) {
    facilities.push('outdoor')
  }
  if (lower.includes('24/7') || lower.includes('24 uur') || lower.includes('altijd')) {
    facilities.push('24_7_access')
  }
  if (lower.includes('rolstoel') || lower.includes('toegankelijk') || lower.includes('wheelchair')) {
    facilities.push('wheelchair_accessible')
  }
  if (lower.includes('parkeer') || lower.includes('parking')) {
    facilities.push('parking')
  }
  if (lower.includes('overdekt') || lower.includes('shelter')) {
    facilities.push('sheltered')
  }
  if (lower.includes('verlicht') || lower.includes('licht') || lower.includes('lighting')) {
    facilities.push('lighting')
  }
  if (lower.includes('gratis') || lower.includes('free')) {
    facilities.push('free_access')
  }
  
  return facilities
}

async function importKMLToPayload() {
  try {
    console.log('🗺️  Starting KML import to Payload CMS...\n')

    // Resolve file path (support both absolute and relative paths)
    const filePath = path.isAbsolute(KML_FILE_PATH)
      ? KML_FILE_PATH
      : path.resolve(process.cwd(), KML_FILE_PATH)

    // Parse KML
    const parsedData = parseGoogleKML(filePath)

    if (parsedData.length === 0) {
      console.log('❌ No valid placemarks found in KML file')
      return
    }

    console.log(`\n✅ Parsed ${parsedData.length} locations with Point geometry\n`)

    // Get default owner
    let defaultOwner: string | null = null
    if (DEFAULT_OWNER_EMAIL) {
      try {
        const users = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: DEFAULT_OWNER_EMAIL,
            },
          },
          limit: 1,
        })

        if (users.docs.length > 0) {
          defaultOwner = users.docs[0].id
          console.log(`👤 Using owner: ${DEFAULT_OWNER_EMAIL}`)
        } else {
          console.log(`⚠️  Warning: Owner email "${DEFAULT_OWNER_EMAIL}" not found. Listings will be created without owner.`)
        }
      } catch (error) {
        console.log(`⚠️  Warning: Could not find owner: ${error}`)
      }
    }

    console.log(`📦 Batch size: ${BATCH_SIZE}`)
    console.log(`📂 Category: ${DEFAULT_CATEGORY}`)
    console.log(`📄 Publish status: ${DEFAULT_PUBLISH_STATUS}\n`)

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
      const listing: any = {
        name: item.name,
        description: description.trim(),
        category: DEFAULT_CATEGORY,
        publishStatus: DEFAULT_PUBLISH_STATUS,
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
          listing.facilities.facilities = facilities.map(facility => ({ facility }))
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
      const tagFields = ['Adres', 'Plaatsnaam', 'Provincie', 'Bijzonderheid', 'Internet', 'Beheerder']
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
          listing.tags.push({ tag: `${key}: ${value}` })
        })
      }

      return listing
    })

    // Batch insert
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ name: string; error: string }> = []

    console.log('📥 Inserting listings in batches...\n')

    for (let i = 0; i < listingsData.length; i += BATCH_SIZE) {
      const batch = listingsData.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(listingsData.length / BATCH_SIZE)

      console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`)

      // Process batch items individually to handle errors gracefully
      for (const listingData of batch) {
        try {
          await payload.create({
            collection: 'listings',
            data: listingData,
          })
          successCount++
        } catch (error: any) {
          errorCount++
          const errorMsg = error?.message || String(error)
          errors.push({ name: listingData.name, error: errorMsg })
          console.log(`      ❌ Failed to create "${listingData.name}": ${errorMsg}`)
        }
      }

      console.log(`   ✅ Batch ${batchNum} completed (${successCount} successful, ${errorCount} errors so far)\n`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Import Summary')
    console.log('='.repeat(60))
    console.log(`✅ Successfully imported: ${successCount} listings`)
    console.log(`❌ Failed: ${errorCount} listings`)

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:')
      errors.forEach(({ name, error }) => {
        console.log(`   - ${name}: ${error}`)
      })
    }

    // Statistics
    const pointCount = parsedData.filter((d) => d.location?.type === 'Point').length
    console.log(`\n📈 Statistics:`)
    console.log(`   - Points: ${pointCount}`)
    console.log(`   - Lines: ${parsedData.filter((d) => d.location?.type === 'LineString').length}`)
    console.log(`   - Polygons: ${parsedData.filter((d) => d.location?.type === 'Polygon').length}`)

    console.log('\n✨ Import completed!\n')
  } catch (error: any) {
    console.error('\n❌ Import failed:', error?.message || error)
    throw error
  }
}

// Run the import only when executed directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  importKMLToPayload()
    .then(() => {
      exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error)
      exit(1)
    })
}

