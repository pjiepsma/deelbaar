import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

import { buildApeldoornListingsSeed } from './seed-data/apeldoornListings'
import { clearSeedMedia, ensureSeedMediaPool } from './seed-data/seedPlacePhotos'

const payload = await getPayload({ config })

/**
 * Clears place-related rows and recreates Apeldoorn seed places only.
 * Expects users to exist (run full `pnpm seed` once on an empty DB).
 */
async function seedListings() {
  console.log('🌱 Places-only seed (Apeldoorn cluster)...')

  try {
    console.log('🗑️  Clearing reviews, claims, and places...')
    await payload.delete({ collection: 'requests', where: {} })
    await payload.delete({ collection: 'reviews', where: {} })
    await payload.delete({ collection: 'kiosks', where: {} })
    await payload.delete({ collection: 'markets', where: {} })
    await payload.delete({ collection: 'taps', where: {} })

    const usersResult = await payload.find({
      collection: 'users',
      limit: 200,
      depth: 0,
    })

    const ownerUsers = usersResult.docs.filter((u) => u.role === 'admin' || u.role === 'user')
    const ownerIds = ownerUsers.map((u) => u.id)
    const adminUser = ownerUsers.find((u) => u.role === 'admin')

    if (ownerIds.length === 0 || !adminUser) {
      console.error('❌ No admin/user accounts found. Run full `pnpm seed` first.')
      exit(1)
    }

    console.log('🖼️  Refreshing seed media pool...')
    await clearSeedMedia(payload)
    const seedMediaIds = await ensureSeedMediaPool(payload)
    console.log(`  ✅ Created ${seedMediaIds.length} seed media items`)

    const listingsData = buildApeldoornListingsSeed(ownerIds, {
      mediaIds: seedMediaIds,
      adminId: adminUser.id,
    })

    console.log('📦 Creating places...')
    const places = []
    for (const placeSeed of listingsData) {
      const place = await payload.create({
        collection: placeSeed.collection,
        data: placeSeed.data,
      })
      places.push(place)
      console.log(`  ✅ Created place: ${placeSeed.data.name} (${placeSeed.collection})`)
    }

    console.log('\n✨ Places-only seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${places.length} places created (Apeldoorn area, all live)`)
    console.log('   - Reviews and claims were cleared (re-run full seed if you need them)')
    console.log('   - Favorites skipped for now\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    exit(1)
  }

  exit(0)
}

await seedListings()
