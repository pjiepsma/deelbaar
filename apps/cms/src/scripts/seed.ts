import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

import { buildApeldoornListingsSeed } from './seed-data/apeldoornListings'
import { ensureSeedMediaPool } from './seed-data/seedPlacePhotos'

const payload = await getPayload({ config })

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    console.log('ℹ️  Running seed without destructive cleanup')

    // Create Users
    console.log('👥 Creating users...')

    const adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'info@deelbaar.com',
        password: 'Test@123',
        username: 'deelbaar-admin',
        name: 'Deelbaar',
        surname: 'Admin',
        role: 'admin',
        isAnonymous: false,
        _verified: true,
      },
      overrideAccess: true,
    })
    console.log('  ✅ Created admin user')

    const users = []
    const userSeeds = [
      {
        email: 'john.doe@example.com',
        username: 'johndoe',
        name: 'John',
        surname: 'Doe',
        address: {
          street: 'Main Street',
          houseNumber: '123',
          postalCode: '1012 AB',
          city: 'Amsterdam',
          coordinates: [4.9041, 52.3676],
        },
      },
      {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        name: 'Jane',
        surname: 'Smith',
        address: {
          street: 'Oak Avenue',
          houseNumber: '456',
          postalCode: '3011 CD',
          city: 'Rotterdam',
          coordinates: [4.4792, 51.9225],
        },
      },
      {
        email: 'bob.wilson@example.com',
        username: 'bobwilson',
        name: 'Bob',
        surname: 'Wilson',
        address: {
          street: 'Elm Street',
          houseNumber: '22',
          postalCode: '3511 DE',
          city: 'Utrecht',
          coordinates: [5.1214, 52.0907],
        },
      },
      {
        email: 'alice.brown@example.com',
        username: 'alicebrown',
        name: 'Alice',
        surname: 'Brown',
        address: {
          street: 'Garden Road',
          houseNumber: '321',
          postalCode: '2514 EF',
          city: 'Den Haag',
          coordinates: [4.3007, 52.0705],
        },
      },
      {
        email: 'charlie.davis@example.com',
        username: 'charliedavis',
        name: 'Charlie',
        surname: 'Davis',
        address: {
          street: 'Elm Street',
          houseNumber: '654',
          postalCode: '5611 GH',
          city: 'Eindhoven',
          coordinates: [5.4697, 51.4416],
        },
      },
    ]

    for (const userData of userSeeds) {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: userData.email,
          password: 'password123',
          username: userData.username,
          name: userData.name,
          surname: userData.surname,
          role: 'user',
          isAnonymous: false,
          address: userData.address,
          _verified: true,
        },
        overrideAccess: true,
      })
      users.push(user)
      console.log(`  ✅ Created user: ${userData.username}`)
    }

    // Create map places (Apeldoorn cluster — same data as `pnpm seed:listings`)
    console.log('📦 Creating places...')

    console.log('🖼️  Creating seed media pool...')
    const seedMediaIds = await ensureSeedMediaPool(payload)
    console.log(`  ✅ Created ${seedMediaIds.length} seed media items`)

    const listingsData = buildApeldoornListingsSeed([adminUser.id, ...users.map((u) => u.id)], {
      mediaIds: seedMediaIds,
      adminId: adminUser.id,
    })

    const places: Array<{ collection: 'kiosks' | 'markets' | 'taps'; id: string | number; name: string }> = []
    for (const placeSeed of listingsData) {
      const place = await payload.create({
        collection: placeSeed.collection,
        data: placeSeed.data,
        overrideAccess: true,
      })
      places.push({
        collection: placeSeed.collection,
        id: place.id,
        name: placeSeed.data.name,
      })
      console.log(`  ✅ Created place: ${placeSeed.data.name} (${placeSeed.collection})`)
    }

    // Create Reviews
    console.log('⭐ Creating reviews...')

    const reviewsData = [
      {
        place: { relationTo: places[0]!.collection, value: places[0]!.id },
        created_by: users[1].id,
        rating: 5,
        description: 'Amazing selection of books! Found some great reads here.',
      },
      {
        place: { relationTo: places[0]!.collection, value: places[0]!.id },
        created_by: users[2].id,
        rating: 4,
        description: "Great concept! Would love to see more children's books.",
      },
      {
        place: { relationTo: places[1]!.collection, value: places[1]!.id },
        created_by: users[0].id,
        rating: 5,
        description: 'Saved me a trip to the hardware store! All tools are well-maintained.',
      },
      {
        place: { relationTo: places[2]!.collection, value: places[2]!.id },
        created_by: users[4].id,
        rating: 4,
        description: 'My kids love visiting! They enjoy swapping toys.',
      },
      {
        place: { relationTo: places[3]!.collection, value: places[3]!.id },
        created_by: users[0].id,
        rating: 5,
        description: 'What a brilliant idea! Got some tomato seeds and they grew beautifully.',
      },
    ]

    const createdReviews = []
    for (const reviewData of reviewsData) {
      const review = await payload.create({
        collection: 'reviews',
        data: reviewData,
        overrideAccess: true,
      })
      createdReviews.push(review)
      console.log(`  ✅ Created review`)
    }

    // Create Listing Claims
    const cloneAddress = (
      address:
        | {
            street?: string
            houseNumber?: string
            postalCode?: string
            city?: string
            coordinates?: number[] | null
          }
        | null
        | undefined,
    ) => {
      if (!address) {
        return undefined
      }

      return {
        street: address.street,
        houseNumber: address.houseNumber,
        postalCode: address.postalCode,
        city: address.city,
        coordinates: Array.isArray(address.coordinates)
          ? [...address.coordinates]
          : address.coordinates,
      }
    }

    console.log('📄 Creating place claims...')
    const listingClaims = []
    const listingClaimSeeds = [
      {
        placeIndex: 0,
        userIndex: 0,
        status: 'approved',
        distanceMeters: 75,
        notes: 'Approved automatically for neighbourhood steward.',
      },
      {
        placeIndex: 2,
        userIndex: 4,
        status: 'pending',
        distanceMeters: 220,
        notes: 'Awaiting proof of residency before approval.',
      },
    ] as const

    for (const claimSeed of listingClaimSeeds) {
      const placeDoc = places[claimSeed.placeIndex]
      const userDoc = users[claimSeed.userIndex]

      if (!placeDoc || !userDoc) {
        console.warn('⚠️  Skipping claim seed due to missing place or user', claimSeed)
        continue
      }

      const claim = await payload.create({
        collection: 'requests',
        data: {
          place: { relationTo: placeDoc.collection, value: placeDoc.id },
          user: userDoc.id,
          status: claimSeed.status,
          distanceMeters: claimSeed.distanceMeters,
          addressSnapshot: cloneAddress(userDoc.address ?? userSeeds[claimSeed.userIndex]?.address),
          notes: claimSeed.notes,
        },
        overrideAccess: true,
      })

      listingClaims.push(claim)
      console.log(`  ✅ Created ${claimSeed.status} claim for ${placeDoc.name}`)
    }

    // Create follows (place + area)
    console.log('🔔 Creating follows...')
    const followsSeed = [
      {
        user: users[0].id,
        targetType: 'place',
        place: { relationTo: places[0]!.collection, value: places[0]!.id },
      },
      {
        user: users[1].id,
        targetType: 'place',
        place: { relationTo: places[1]!.collection, value: places[1]!.id },
      },
      {
        user: users[2].id,
        targetType: 'area',
        area: {
          name: 'Apeldoorn Centrum',
          latitude: 52.2116,
          longitude: 5.9699,
          radiusMeters: 4000,
        },
      },
    ] as const

    for (const followData of followsSeed) {
      await payload.create({
        collection: 'follows',
        data: {
          ...followData,
          active: true,
        },
        overrideAccess: true,
      })
      console.log(`  ✅ Created ${followData.targetType} follow`)
    }

    // Create entitlements
    console.log('🧭 Creating entitlements...')
    const entitlementSeeds = [
      { user: users[0].id, scope: 'province', source: 'seed' },
      { user: users[1].id, scope: 'country', source: 'seed' },
      { user: users[2].id, scope: 'world', source: 'seed' },
    ] as const

    for (const entitlementData of entitlementSeeds) {
      await payload.create({
        collection: 'entitlements',
        data: {
          ...entitlementData,
          status: 'active',
          metadata: { seeded: true },
        },
        overrideAccess: true,
      })
      console.log(`  ✅ Created ${entitlementData.scope} entitlement`)
    }

    // Create wishes
    console.log('🌟 Creating wishes...')
    const wishesSeed = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        category: 'book',
        description: 'Classic American novel about the Jazz Age',
        created_by: users[0].id,
        location: {
          latitude: 52.3676,
          longitude: 4.9041,
          radius: 25,
        },
      },
      {
        title: 'Baby Diapers',
        category: 'hygiene',
        brand: 'Pampers',
        description: 'Size 4 diapers preferred',
        created_by: users[3].id,
        location: {
          latitude: 52.0705,
          longitude: 4.3007,
          radius: 15,
        },
      },
    ] as const

    for (const wishData of wishesSeed) {
      await payload.create({
        collection: 'wishes',
        data: {
          ...wishData,
          status: 'active',
        },
        overrideAccess: true,
      })
      console.log(`  ✅ Created wish: ${wishData.title}`)
    }

    // Create reports
    console.log('🚩 Creating reports...')
    await payload.create({
      collection: 'reports',
      data: {
        targetType: 'place',
        place: { relationTo: places[0]!.collection, value: places[0]!.id },
        reason: 'misleading',
        details: 'Opening hours appear outdated in listing details.',
        status: 'open',
        createdBy: users[2].id,
      },
      overrideAccess: true,
    })
    const firstReview = createdReviews[0]
    if (!firstReview) {
      throw new Error('Seed invariant failed: expected at least one created review.')
    }

    await payload.create({
      collection: 'reports',
      data: {
        targetType: 'review',
        review: firstReview.id,
        reason: 'spam',
        details: 'Looks like promotional content.',
        status: 'in_review',
        createdBy: users[1].id,
        reviewedBy: adminUser.id,
      },
      overrideAccess: true,
    })
    console.log('  ✅ Created reports')

    console.log('\n✨ Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${users.length + 1} users created`)
    console.log(`   - ${places.length} places created`)
    console.log(`   - ${reviewsData.length} reviews created`)
    console.log(`   - ${listingClaims.length} place claims created`)
    console.log(`   - ${followsSeed.length} follows created`)
    console.log(`   - ${entitlementSeeds.length} entitlements created`)
    console.log(`   - ${wishesSeed.length} wishes created`)
    console.log('   - 2 reports created')
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: info@deelbaar.com / Test@123')
    console.log('   User: john.doe@example.com / password123\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    exit(1)
  }

  exit(0)
}

await seed()
