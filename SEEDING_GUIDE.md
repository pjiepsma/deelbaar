# 📚 Seeding Minibiebs Guide

## What's Been Set Up

I've created a seeding system for Apeldoorn Minibiebs (Little Free Libraries) that you can use directly in your app!

## Files Created

1. **`scripts/seedApeldoornMinibiebs.json`** - Sample data with 3 Apeldoorn Minibiebs
2. **`components/SeedMinibiebs.tsx`** - React Native component to seed data
3. **`scripts/seedMinibiebs.ts`** - Script to process all Apeldoorn entries from your JSON data

## How to Use

### Option 1: In-App Seeding (Easiest!)

1. **Login to your app** (you must be authenticated)
2. **Navigate to Profile → Admin page**
3. **Tap "Seed 3 Minibiebs" button**
4. Done! The listings will be created with you as the owner

The admin page now has a seeding section at the top that looks like this:

```
┌─────────────────────────────────┐
│ Seed Apeldoorn Minibiebs        │
│ This will create 3 Minibieb     │
│ listings in Apeldoorn...        │
│                                  │
│ [Seed 3 Minibiebs]              │
└─────────────────────────────────┘
```

### Option 2: Command Line (For batch processing)

```bash
cd E:\Git\deelbaar
npx tsx scripts/seedMinibiebs.ts
```

## Data Structure

Each Minibieb listing has:
- **name**: "Minibieb Stayokay Apeldoorn"
- **description**: Description of the Minibieb
- **location**: 
  - **address**: "Asselsestraat 330, 7312 DG Apeldoorn"
  - **coordinates**: [longitude, latitude]
- **category**: "Books"
- **tags**: ["minibieb", "books", "sharing", "community"]
- **owner**: Your user ID (auto-set when seeding)

## Available Data

From your `minibieb-gelderland.json`, there are:
- **127 Apeldoorn entries** total
- Currently seeding **3 sample entries**:
  1. Minibieb Stayokay Apeldoorn
  2. Pakkast Apeldoorn
  3. Little Free Library Apeldoorn

## To Seed All 127 Apeldoorn Minibiebs

If you want to seed ALL Apeldoorn entries:

1. Run the script: `npx tsx scripts/seedMinibiebs.ts`
2. It will show you all 127 listings
3. Uncomment the seeding code in the script
4. Add your authentication token
5. Run again to actually seed them

## Testing

After seeding:
1. Go to the Map tab
2. Navigate to Apeldoorn area (coordinates: 52.2112, 5.9699)
3. You should see the Minibieb markers on the map
4. Tap markers to see details in the bottom sheet carousel

## Troubleshooting

**"You must be logged in"**
- Make sure you're authenticated in the app
- Check the Profile → Auth page to verify login

**"Failed to create listing"**
- Check your Payload CMS backend is running
- Verify the API URL in your .env file
- Check network connectivity

**Listings not showing on map**
- Make sure your location is set to Apeldoorn area
- Check the map zoom level (should be zoomed in enough)
- Verify the listings were created in the database

## Next Steps

Want to seed more categories or locations?
1. Copy `SeedMinibiebs.tsx`
2. Update the JSON data file
3. Customize for your new category/location
4. Add to admin page

Happy seeding! 🌱📚


