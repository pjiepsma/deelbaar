import { Endpoint } from "payload";

export const geocodeListingsEndpoint: Endpoint = {
  path: "/geocode-listings",
  method: "post",
  handler: async (req) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return Response.json(
          { message: "Unauthorized" },
          { status: 403 }
        );
      }

      // Find all listings - we'll filter in code since coordinates are undefined
      const allListings = await req.payload.find({
        collection: "listings",
        limit: 1000,
      });
      
      // Filter for listings without coordinates but with addresses
      const listings = {
        docs: allListings.docs.filter((doc: any) => {
          return !doc.location?.coordinates && doc.location?.address;
        }),
      };

      const total = listings.docs.length;
      
      console.log(`🗺️  Found ${total} listings without coordinates`);

      if (total === 0) {
        return Response.json({
          message: "No listings found that need geocoding",
          total: 0,
        });
      }

      // Start geocoding process in background
      // We'll process them one by one with rate limiting
      geocodeInBackground(req, listings.docs).catch((err) => {
        console.error("Background geocoding error:", err);
      });

      return Response.json({
        message: `Started geocoding ${total} listings`,
        total,
      });
    } catch (error: any) {
      console.error("Geocode endpoint error:", error);
      return Response.json(
        { message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  },
};

// Background geocoding function
async function geocodeInBackground(req: any, listings: any[]) {
  console.log(`🗺️  Starting geocoding for ${listings.length} listings...`);
  
  let succeeded = 0;
  let failed = 0;

  for (const listing of listings) {
    try {
      const address = listing.location?.address;
      if (!address) {
        failed++;
        continue;
      }

      // Use OpenStreetMap Nominatim (free, no API key required)
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=nl&limit=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Deelbaar-API/1.0",
        },
      });

      if (!response.ok) {
        console.error(`Failed to geocode ${listing.name}: HTTP ${response.status}`);
        failed++;
        await delay(1000); // Rate limit: 1 request per second
        continue;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        
        // Update listing with coordinates
        await req.payload.update({
          collection: "listings",
          id: listing.id,
          data: {
            location: {
              ...listing.location,
              coordinates: [parseFloat(lon), parseFloat(lat)],
            },
          },
        });

        console.log(`✓ Geocoded ${listing.name}: [${lon}, ${lat}]`);
        succeeded++;
      } else {
        console.warn(`✗ No results for ${listing.name} (${address})`);
        failed++;
      }

      // Rate limit: 1 request per second (Nominatim requirement)
      await delay(1000);
    } catch (error: any) {
      console.error(`Error geocoding ${listing.name}:`, error.message);
      failed++;
      await delay(1000);
    }
  }

  console.log(`\n🎉 Geocoding complete!`);
  console.log(`   ✓ Succeeded: ${succeeded}`);
  console.log(`   ✗ Failed: ${failed}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

