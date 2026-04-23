import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

import { buildApeldoornListingsSeed } from './scripts/seed-data/apeldoornListings'

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
    await payload.delete({ collection: 'email-templates', where: {} })
    await payload.delete({ collection: 'users', where: {} })

    // Create Users
    console.log('👥 Creating users...')

    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@example.com',
        password: 'password123',
        username: 'admin',
        name: 'Admin',
        surname: 'User',
        role: 'admin',
        isAnonymous: false,
        _verified: true,
      },
      overrideAccess: true,
    })
    console.log('  ✅ Created admin user')

    const adminInfo = await payload.create({
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
    console.log('  ✅ Created Deelbaar info admin account')

    const users = []
    const userNames = [
      { email: 'john.doe@example.com', username: 'johndoe', name: 'John', surname: 'Doe' },
      { email: 'jane.smith@example.com', username: 'janesmith', name: 'Jane', surname: 'Smith' },
      { email: 'bob.wilson@example.com', username: 'bobwilson', name: 'Bob', surname: 'Wilson' },
      { email: 'alice.brown@example.com', username: 'alicebrown', name: 'Alice', surname: 'Brown' },
      {
        email: 'charlie.davis@example.com',
        username: 'charliedavis',
        name: 'Charlie',
        surname: 'Davis',
      },
    ]

    for (const userData of userNames) {
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
          _verified: true,
        },
        overrideAccess: true,
      })
      users.push(user)
      console.log(`  ✅ Created user: ${userData.username}`)
    }

    // Create Email Templates
    console.log('📧 Creating email templates...')

    const existingVerificationTemplate = await payload.find({
      collection: 'email-templates',
      where: {
        type: { equals: 'email-verification' },
      },
      limit: 1,
    })

    if (existingVerificationTemplate.docs.length === 0) {
      await payload.create({
        collection: 'email-templates',
        data: {
          name: 'Email Verification Template',
          type: 'email-verification',
          subject: 'Verifieer je emailadres - {{user.name}}',
          html: [
            {
              type: 'h2',
              children: [{ text: 'Email Verificatie - Deelbaar' }],
            },
            {
              type: 'p',
              children: [
                { text: 'Hallo ' },
                { text: '{{user.name}}', bold: true },
                { text: ',' },
              ],
            },
            {
              type: 'p',
              children: [{ text: 'Bedankt voor het registreren bij Deelbaar! Klik op de onderstaande knop om je emailadres te verifiëren:' }],
            },
            {
              type: 'p',
              children: [
                {
                  type: 'a',
                  url: '{{verificationUrl}}',
                  children: [{ text: 'Email Verifiëren', bold: true }],
                },
              ],
            },
            {
              type: 'p',
              children: [{ text: 'Deze link verloopt over 24 uur.' }],
            },
            {
              type: 'p',
              children: [{ text: 'Als je geen account hebt aangemaakt bij Deelbaar, negeer dan deze email.' }],
            },
          ],
          isActive: true,
        },
      })
      console.log('  ✅ Created email verification template')
    }

    const existingResetTemplate = await payload.find({
      collection: 'email-templates',
      where: {
        type: { equals: 'password-reset' },
      },
      limit: 1,
    })

    if (existingResetTemplate.docs.length === 0) {
      await payload.create({
        collection: 'email-templates',
        data: {
          name: 'Password Reset Template',
          type: 'password-reset',
          subject: 'Reset je wachtwoord - {{user.name}}',
          html: [
            {
              type: 'h2',
              children: [{ text: 'Wachtwoord Reset - Deelbaar' }],
            },
            {
              type: 'p',
              children: [
                { text: 'Hallo ' },
                { text: '{{user.name}}', bold: true },
                { text: ',' },
              ],
            },
            {
              type: 'p',
              children: [{ text: 'Je hebt een wachtwoord reset aangevraagd. Klik op de onderstaande link om je wachtwoord te resetten:' }],
            },
            {
              type: 'p',
              children: [
                {
                  type: 'a',
                  url: '{{resetUrl}}',
                  children: [{ text: 'Wachtwoord Resetten', bold: true }],
                },
              ],
            },
            {
              type: 'p',
              children: [{ text: 'Deze link verloopt over 1 uur.' }],
            },
            {
              type: 'p',
              children: [{ text: 'Als je geen wachtwoord reset hebt aangevraagd, negeer dan deze email.' }],
            },
          ],
          isActive: true,
        },
      })
      console.log('  ✅ Created password reset template')
    }

    // Create Listings (Apeldoorn cluster — same data as `pnpm seed:listings`)
    console.log('📦 Creating listings...')

    const listingsData = buildApeldoornListingsSeed([adminInfo.id, ...users.map((u) => u.id)])

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

    // Add Favorites to Users
    console.log('❤️  Adding favorites to users...')

    const favoritesData = [
      { userIndex: 0, listingIndex: 1 },
      { userIndex: 1, listingIndex: 0 },
      { userIndex: 2, listingIndex: 2 },
      { userIndex: 3, listingIndex: 3 },
      { userIndex: 4, listingIndex: 4 },
    ]

    for (const favoriteData of favoritesData) {
      const user = users[favoriteData.userIndex]
      const listing = listings[favoriteData.listingIndex]

      // Get current user data
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
      })

      // Add favorite to user's favorites array
      const currentFavorites = currentUser.favorites || []
      currentFavorites.push({ listing: listing.id })

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          favorites: currentFavorites,
        },
      })
      console.log(`  ✅ Added favorite for user: ${user.email}`)
    }

    // Create Wishes
    console.log('🌟 Creating wishes...')
    const wishesData = [
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
        title: 'Tampons',
        category: 'hygiene',
        brand: 'Any brand',
        description: 'Need tampons urgently, any brand is fine',
        created_by: users[1].id,
        location: {
          latitude: 51.9225,
          longitude: 4.4792,
          radius: 10,
        },
      },
      {
        title: 'Electric Drill',
        category: 'tool',
        description: 'Need a drill for a weekend project',
        created_by: users[2].id,
        location: {
          latitude: 52.0907,
          longitude: 5.1214,
          radius: 20,
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
      {
        title: 'Winter Jacket',
        category: 'clothing',
        description: "Men's winter jacket, size L",
        created_by: users[4].id,
        location: {
          latitude: 51.4416,
          longitude: 5.4697,
          radius: 30,
        },
      },
    ]

    const wishes = []
    for (const wishData of wishesData) {
      const wish = await payload.create({
        collection: 'wishes',
        data: wishData,
      })
      wishes.push(wish)
      console.log(`  ✅ Created wish: ${wishData.title}`)
    }

    console.log('\n✨ Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - ${users.length + 1} users created`)
    console.log(`   - ${listings.length} listings created`)
    console.log(`   - ${reviewsData.length} reviews created`)
    console.log(`   - ${favoritesData.length} favorites added to users`)
    console.log(`   - ${wishes.length} wishes created`)
    console.log('\n🔐 Login credentials:')
    console.log('   Admin: admin@example.com / password123')
    console.log('   Deelbaar Admin: info@deelbaar.com / Test@123')
    console.log('   User: john.doe@example.com / password123\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    exit(1)
  }

  exit(0)
}

seed()
