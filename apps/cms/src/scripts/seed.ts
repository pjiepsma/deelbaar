import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

import { buildApeldoornListingsSeed } from './seed-data/apeldoornListings'

const payload = await getPayload({ config })

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await payload.delete({ collection: 'requests', where: {} })
    await payload.delete({ collection: 'reviews', where: {} })
    await payload.delete({ collection: 'listings', where: {} })
    await payload.delete({ collection: 'media', where: {} })
    await payload.delete({ collection: 'users', where: {} })

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
      },
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
        },
      })
      users.push(user)
      console.log(`  ✅ Created user: ${userData.username}`)
    }

    // Create Listings (Apeldoorn cluster — same data as `pnpm seed:listings`)
    console.log('📦 Creating listings...')

    const listingsData = buildApeldoornListingsSeed([adminUser.id, ...users.map((u) => u.id)])

    const listings = []
    for (const listingData of listingsData) {
      const listing = await payload.create({
        collection: 'listings',
        data: listingData,
      })
      listings.push(listing)
      console.log(`  ✅ Created listing: ${listingData.name}`)
    }

    // Create Reviews
    console.log('⭐ Creating reviews...')

    const reviewsData = [
      {
        listing: listings[0].id,
        created_by: users[1].id,
        rating: 5,
        description: 'Amazing selection of books! Found some great reads here.',
      },
      {
        listing: listings[0].id,
        created_by: users[2].id,
        rating: 4,
        description: "Great concept! Would love to see more children's books.",
      },
      {
        listing: listings[1].id,
        created_by: users[0].id,
        rating: 5,
        description: 'Saved me a trip to the hardware store! All tools are well-maintained.',
      },
      {
        listing: listings[2].id,
        created_by: users[4].id,
        rating: 4,
        description: 'My kids love visiting! They enjoy swapping toys.',
      },
      {
        listing: listings[3].id,
        created_by: users[0].id,
        rating: 5,
        description: 'What a brilliant idea! Got some tomato seeds and they grew beautifully.',
      },
    ]

    for (const reviewData of reviewsData) {
      await payload.create({
        collection: 'reviews',
        data: reviewData,
      })
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

    console.log('📄 Creating listing claims...')
    const listingClaims = []
    const listingClaimSeeds = [
      {
        listingIndex: 0,
        userIndex: 0,
        status: 'approved',
        distanceMeters: 75,
        notes: 'Approved automatically for neighbourhood steward.',
      },
      {
        listingIndex: 2,
        userIndex: 4,
        status: 'pending',
        distanceMeters: 220,
        notes: 'Awaiting proof of residency before approval.',
      },
    ] as const

    for (const claimSeed of listingClaimSeeds) {
      const listingDoc = listings[claimSeed.listingIndex]
      const userDoc = users[claimSeed.userIndex]

      if (!listingDoc || !userDoc) {
        console.warn('⚠️  Skipping claim seed due to missing listing or user', claimSeed)
        continue
      }

      const claim = await payload.create({
        collection: 'requests',
        data: {
          listing: listingDoc.id,
          user: userDoc.id,
          status: claimSeed.status,
          distanceMeters: claimSeed.distanceMeters,
          addressSnapshot: cloneAddress(userDoc.address ?? userSeeds[claimSeed.userIndex]?.address),
          notes: claimSeed.notes,
        },
      })

      listingClaims.push(claim)
      console.log(`  ✅ Created ${claimSeed.status} claim for ${listingDoc.name}`)
    }

    // Favorites temporarily disabled - will be added back later
    console.log('❤️  Favorites skipped for now')

    console.log('\n✨ Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${users.length + 1} users created`)
    console.log(`   - ${listings.length} listings created`)
    console.log(`   - ${reviewsData.length} reviews created`)
    console.log(`   - ${listingClaims.length} listing claims created`)
    console.log(`   - Favorites and pictures temporarily disabled`)
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: info@deelbaar.com / Test@123')
    console.log('   User: john.doe@example.com / password123\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    exit(1)
  }

  exit(0)
}

seed()
