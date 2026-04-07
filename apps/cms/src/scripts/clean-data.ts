import { getPayload } from 'payload'
import config from '@payload-config'
import { exit } from 'process'

async function clean() {
  const payload = await getPayload({ config })

  console.log('🗑️  Cleaning all data (keeping admin users only)...\n')

  // All collections to clean completely
  const collectionsToWipe = ['requests', 'reviews', 'listings', 'wishes', 'media'] as const

  // Clean all collections completely
  for (const collection of collectionsToWipe) {
    try {
      const result = await payload.delete({
        collection,
        where: {},
      })
      const deleted = result.docs?.length || 0
      if (deleted > 0) {
        console.log(`  ✅ Cleared ${collection} (${deleted} documents)`)
      } else {
        console.log(`  ℹ️  ${collection} was already empty`)
      }
    } catch (error: any) {
      console.log(`  ⚠️  Failed to clear ${collection}: ${error?.message || error}`)
    }
  }

  // Handle users separately - delete all non-admin users only
  // (We keep all admin users to maintain access)
  try {
    // First, get all users
    const allUsers = await payload.find({
      collection: 'users',
      where: {},
      limit: 1000,
    })

    const nonAdminUsers = allUsers.docs.filter((user: any) => user.role !== 'admin')
    const adminUsers = allUsers.docs.filter((user: any) => user.role === 'admin')

    // Delete all non-admin users
    if (nonAdminUsers.length > 0) {
      let deleted = 0
      for (const user of nonAdminUsers) {
        try {
          await payload.delete({
            collection: 'users',
            id: user.id,
          })
          deleted++
        } catch (error: any) {
          console.log(`  ⚠️  Failed to delete user ${user.email}: ${error?.message || error}`)
        }
      }
      console.log(`  ✅ Cleared ${deleted} non-admin users`)
    } else {
      console.log(`  ℹ️  No non-admin users to delete`)
    }

    // Report kept admin users
    if (adminUsers.length > 0) {
      console.log(`  ℹ️  Kept ${adminUsers.length} admin user(s)`)
    } else {
      console.log(`  ⚠️  Warning: No admin users found!`)
    }
  } catch (error: any) {
    console.log(`  ⚠️  Failed to clean users: ${error?.message || error}`)
  }

  console.log('\n✅ Data cleaning completed!')
}

clean()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to clean data:', error)
    process.exit(1)
  })
