import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

import { buildApeldoornListingsSeed } from './seed-data/apeldoornListings'

const payload = await getPayload({ config })

/**
 * Clears listing-related rows and recreates Apeldoorn seed listings only.
 * Expects users to exist (run full `pnpm seed` once on an empty DB).
 */
async function seedListings() {
  console.log('🌱 Listings-only seed (Apeldoorn cluster)...')

  try {
    console.log('🗑️  Clearing reviews, claims, and listings...')
    await payload.delete({ collection: 'requests', where: {} })
    await payload.delete({ collection: 'reviews', where: {} })
    await payload.delete({ collection: 'listings', where: {} })

    const usersResult = await payload.find({
      collection: 'users',
      limit: 200,
      depth: 0,
    })

    const ownerIds = usersResult.docs
      .filter((u) => u.role === 'admin' || u.role === 'user')
      .map((u) => u.id)

    if (ownerIds.length === 0) {
      console.error('❌ No admin/user accounts found. Run full `pnpm seed` first.')
      exit(1)
    }

    const listingsData = buildApeldoornListingsSeed(ownerIds)

    console.log('📦 Creating listings...')
    const listings = []
    for (const listingData of listingsData) {
      const listing = await payload.create({
        collection: 'listings',
        data: listingData,
      })
      listings.push(listing)
      console.log(`  ✅ Created listing: ${listingData.name}`)
    }

    console.log('\n✨ Listings-only seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${listings.length} listings created (Apeldoorn area, all live)`)
    console.log('   - Reviews and claims were cleared (re-run full seed if you need them)')
    console.log('   - Favorites skipped for now\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    exit(1)
  }

  exit(0)
}

seedListings()
