/**
 * Seed Minibieb (Little Free Libraries) from Apeldoorn to the database
 * Run from repo root: pnpm --filter @deelbaar/mobile exec tsx scripts/seedMinibiebs.ts
 */

import minibiebs from '../assets/data/minibieb-gelderland.json';

// Filter for Apeldoorn entries
const apeldoornMinibiebs = minibiebs.geometries.filter((item: any) =>
  item.properties.Plaatsnaam?.toLowerCase().includes('apeldoorn')
);

console.log(`Found ${apeldoornMinibiebs.length} Minibiebs in Apeldoorn\n`);

// Transform to listing format
const listings = apeldoornMinibiebs.map((minibieb: any, index: number) => {
  const [longitude, latitude] = minibieb.coordinates || [5.9699, 52.2112]; // Apeldoorn center as fallback

  return {
    name: minibieb.properties.Name || `Minibieb ${index + 1}`,
    description:
      minibieb.properties.Bijzonderheid ||
      'Een minibieb waar je gratis boeken kunt ruilen en delen met anderen in de buurt.',
    location: {
      address:
        `${minibieb.properties.Adres || ''}, ${minibieb.properties.Plaatsnaam || 'Apeldoorn'}`.trim(),
      coordinates: [longitude, latitude],
    },
    category: 'Books',
    tags: [
      { tag: 'minibieb' },
      { tag: 'books' },
      { tag: 'sharing' },
      { tag: 'community' },
      { tag: 'free' },
    ],
  };
});

// Function to seed via Payload API
async function seedListings() {
  const PAYLOAD_URL = process.env.EXPO_PUBLIC_PAYLOAD_URL || 'http://localhost:4000';

  console.log(`Seeding to: ${PAYLOAD_URL}\n`);
  console.log('⚠️  Make sure you are logged in to Payload CMS!\n');
  console.log('You need to:');
  console.log('1. Login to your Payload CMS');
  console.log('2. Get your auth token');
  console.log('3. Run this with proper authentication\n');

  console.log('Sample listing data:');
  console.log(JSON.stringify(listings[0], null, 2));
  console.log(`\n... and ${listings.length - 1} more listings\n`);

  // To actually seed, uncomment and add authentication:
  /*
  for (const listing of listings) {
    try {
      const response = await fetch(`${PAYLOAD_URL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_TOKEN_HERE`
        },
        body: JSON.stringify(listing)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Created: ${listing.name}`);
      } else {
        console.error(`✗ Failed: ${listing.name}`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error creating ${listing.name}:`, error);
    }
  }
  */
}

// Export for use in app
export const apeldoornListings = listings;

// Run if called directly
if (require.main === module) {
  seedListings();
}







