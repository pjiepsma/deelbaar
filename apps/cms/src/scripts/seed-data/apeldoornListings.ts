/**
 * Shared listing fixtures around Apeldoorn, NL (GeoJSON: [lng, lat]).
 * Used by full `pnpm seed` and by `pnpm seed:listings` only.
 */

type ListingType = 'little' | 'farm' | 'waterpoint'
type LittleSubtype = 'books' | 'hygiene' | 'community' | 'other'
type FarmSubtype = 'honey' | 'milk' | 'meat' | 'vegetables' | 'other'
type WaterpointSubtype = 'indoor' | 'outdoor'

export type ApeldoornListingTemplate = {
  name: string
  description: string
  listingType: ListingType
  littleSubtype?: LittleSubtype | null
  farmSubtype?: FarmSubtype | null
  waterpointSubtype?: WaterpointSubtype | null
  location: {
    address: string
    coordinates: [number, number]
  }
  tags: { tag: string }[]
}

export const APELDOORN_LISTING_TEMPLATES: ApeldoornListingTemplate[] = [
  {
    name: 'Minibieb Grote Kerkhof',
    description: 'Centrum: kinderboeken en romans. Neem mee, breng terug.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Grote Kerkhof, Apeldoorn, Netherlands',
      coordinates: [5.9688, 52.2108],
    },
    tags: [{ tag: 'books' }, { tag: 'centrum' }],
  },
  {
    name: 'Oranjepark minibieb',
    description: 'Kleine kast bij het park; vooral jeugd en strip.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Oranjepark, Apeldoorn, Netherlands',
      coordinates: [5.9582, 52.2141],
    },
    tags: [{ tag: 'books' }, { tag: 'park' }],
  },
  {
    name: 'Berg en Bos boekenhoek',
    description: 'Rustige plek nabij het bos; natuur- en wandelgidsen.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Berg en Bos, Apeldoorn, Netherlands',
      coordinates: [5.9455, 52.2054],
    },
    tags: [{ tag: 'books' }, { tag: 'nature' }],
  },
  {
    name: 'Osseveld voedselkast',
    description: 'Blij inhoud: conserven, pasta, lang houdbaar.',
    listingType: 'farm',
    farmSubtype: 'other',
    location: {
      address: 'Osseveld, Apeldoorn, Netherlands',
      coordinates: [5.982, 52.2183],
    },
    tags: [{ tag: 'food' }, { tag: 'community' }],
  },
  {
    name: 'De Maten ruilplank',
    description: 'Klein spul voor de buurt: gereedschap, spellen, boeken.',
    listingType: 'little',
    littleSubtype: 'community',
    location: {
      address: 'De Maten, Apeldoorn, Netherlands',
      coordinates: [5.9885, 52.1982],
    },
    tags: [{ tag: 'tools' }, { tag: 'sharing' }],
  },
  {
    name: 'Kayersdijk kinderbieb',
    description: 'Prentenboeken en jeugdromans; ouders gezocht als vrijwilligers.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Kayersdijk, Apeldoorn, Netherlands',
      coordinates: [5.9712, 52.2075],
    },
    tags: [{ tag: 'books' }, { tag: 'kids' }],
  },
  {
    name: 'Korenmolen buurtbieb',
    description: 'Historische romans en streekromanen.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Korenmolenkwartier, Apeldoorn, Netherlands',
      coordinates: [5.9634, 52.213],
    },
    tags: [{ tag: 'books' }, { tag: 'local' }],
  },
  {
    name: 'Julianapark hygiene-punt',
    description: 'Shampoo, zeep, maandverband — neem wat je nodig hebt.',
    listingType: 'little',
    littleSubtype: 'hygiene',
    location: {
      address: 'Julianapark, Apeldoorn, Netherlands',
      coordinates: [5.951, 52.2088],
    },
    tags: [{ tag: 'hygiene' }, { tag: 'park' }],
  },
  {
    name: 'Apeldoorn-Zuid boekenkast',
    description: 'Thriller en fantasy; ook Engelse titels.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Apeldoorn-Zuid, Netherlands',
      coordinates: [5.9355, 52.1955],
    },
    tags: [{ tag: 'books' }, { tag: 'fantasy' }],
  },
  {
    name: 'Vogelkwartier zadenbieb',
    description: 'Groentezaden en kruidplantjes ruilen.',
    listingType: 'farm',
    farmSubtype: 'vegetables',
    location: {
      address: 'Vogelkwartier, Apeldoorn, Netherlands',
      coordinates: [5.9765, 52.2248],
    },
    tags: [{ tag: 'seeds' }, { tag: 'garden' }],
  },
  {
    name: 'Station Apeldoorn minibieb',
    description: 'Reislectuur en korte verhalen voor pendelaars.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Stationsplein, Apeldoorn, Netherlands',
      coordinates: [5.9697, 52.2084],
    },
    tags: [{ tag: 'books' }, { tag: 'travel' }],
  },
  {
    name: 'Hoofdstraat free little library',
    description: 'Klassiekers en non-fictie; Engels/Nederlands gemengd.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Hoofdstraat, Apeldoorn, Netherlands',
      coordinates: [5.9655, 52.2112],
    },
    tags: [{ tag: 'books' }, { tag: 'centrum' }],
  },
  {
    name: 'Eendrachtspark ruilkast',
    description: 'Bordspellen en puzzels voor buurtbewoners.',
    listingType: 'little',
    littleSubtype: 'other',
    location: {
      address: 'Eendrachtspark, Apeldoorn, Netherlands',
      coordinates: [5.9382, 52.2025],
    },
    tags: [{ tag: 'games' }, { tag: 'community' }],
  },
  {
    name: 'Zuidbroek honingautomaat (demo)',
    description: 'Demo-locatie voor lokale honing uit de regio.',
    listingType: 'farm',
    farmSubtype: 'honey',
    location: {
      address: 'Zuidbroek, Apeldoorn, Netherlands',
      coordinates: [5.9912, 52.1995],
    },
    tags: [{ tag: 'farm' }, { tag: 'local' }],
  },
  {
    name: 'Loolaan wijkbieb',
    description: 'Romans en feelgood; graag netjes terugzetten.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Loolaan, Apeldoorn, Netherlands',
      coordinates: [5.9285, 52.2058],
    },
    tags: [{ tag: 'books' }],
  },
  {
    name: 'Zevenhuizen community shelf',
    description: 'Huishoudspullen en kleine cadeaus voor wie het kan gebruiken.',
    listingType: 'little',
    littleSubtype: 'community',
    location: {
      address: 'Zevenhuizen, Apeldoorn, Netherlands',
      coordinates: [5.9975, 52.1885],
    },
    tags: [{ tag: 'community' }, { tag: 'sharing' }],
  },
  {
    name: 'Noorderpark kinderbieb',
    description: 'Peuters en kleuters; ook leesvoorbeelden voor ouders.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Noorderpark, Apeldoorn, Netherlands',
      coordinates: [5.955, 52.2185],
    },
    tags: [{ tag: 'books' }, { tag: 'kids' }],
  },
  {
    name: 'Wilmerspark snack-ruil',
    description: 'Lang houdbaar eten en drinken voor de buurt.',
    listingType: 'farm',
    farmSubtype: 'other',
    location: {
      address: 'Wilmerspark, Apeldoorn, Netherlands',
      coordinates: [5.9735, 52.216],
    },
    tags: [{ tag: 'food' }, { tag: 'park' }],
  },
  {
    name: 'Componistenbuurt boekenrek',
    description: 'Biografieën en muziekboeken.',
    listingType: 'little',
    littleSubtype: 'books',
    location: {
      address: 'Componistenbuurt, Apeldoorn, Netherlands',
      coordinates: [5.961, 52.199],
    },
    tags: [{ tag: 'books' }, { tag: 'music' }],
  },
  {
    name: 'Apeldoorn Centrum hygiene-kast',
    description: 'Tandenborstels, deodorant, basis hygiene — anoniem pakken.',
    listingType: 'little',
    littleSubtype: 'hygiene',
    location: {
      address: 'Marktplein, Apeldoorn, Netherlands',
      coordinates: [5.92699, 52.19895],
    },
    tags: [{ tag: 'hygiene' }, { tag: 'centrum' }],
  },
  {
    name: 'Stadhuis drinkwater (demo)',
    description: 'Openbaar drinkwaterpunt binnen.',
    listingType: 'waterpoint',
    waterpointSubtype: 'indoor',
    location: {
      address: 'Marktplein, Apeldoorn, Netherlands',
      coordinates: [5.9692, 52.211],
    },
    tags: [{ tag: 'water' }, { tag: 'demo' }],
  },
  {
    name: 'Oranjepark fontein (demo)',
    description: 'Buitenwatertappunt bij het park.',
    listingType: 'waterpoint',
    waterpointSubtype: 'outdoor',
    location: {
      address: 'Oranjepark, Apeldoorn, Netherlands',
      coordinates: [5.9575, 52.2145],
    },
    tags: [{ tag: 'water' }, { tag: 'park' }],
  },
]

type PlaceCreatePayload = {
  name: string
  publishStatus: 'live'
  description: string
  owner: string | number
  location: {
    address: string
    coordinates: [number, number]
  }
  tags: { tag: string }[]
  kioskSubtype?: string | null
  marketSubtype?: string | null
  tapSubtype?: string | null
}

export type ApeldoornPlaceSeedRow = {
  collection: 'kiosks' | 'markets' | 'taps'
  data: PlaceCreatePayload
}

function resolveCollectionAndSubtype(row: ApeldoornListingTemplate): {
  collection: ApeldoornPlaceSeedRow['collection']
  subtypeField: 'kioskSubtype' | 'marketSubtype' | 'tapSubtype'
  subtypeValue: string
} {
  if (row.listingType === 'little') {
    const subtype = row.littleSubtype
    if (!subtype) {
      throw new Error(`Missing littleSubtype for ${row.name}`)
    }
    return { collection: 'kiosks', subtypeField: 'kioskSubtype', subtypeValue: subtype }
  }
  if (row.listingType === 'farm') {
    const subtype = row.farmSubtype
    if (!subtype) {
      throw new Error(`Missing farmSubtype for ${row.name}`)
    }
    return { collection: 'markets', subtypeField: 'marketSubtype', subtypeValue: subtype }
  }
  const subtype = row.waterpointSubtype
  if (!subtype) {
    throw new Error(`Missing waterpointSubtype for ${row.name}`)
  }
  return { collection: 'taps', subtypeField: 'tapSubtype', subtypeValue: subtype }
}

export function buildApeldoornListingsSeed(ownerIds: (string | number)[]): ApeldoornPlaceSeedRow[] {
  if (ownerIds.length === 0) {
    throw new Error('buildApeldoornListingsSeed: at least one owner id is required')
  }

  return APELDOORN_LISTING_TEMPLATES.map((row, index) => {
    const kind = resolveCollectionAndSubtype(row)
    const data: PlaceCreatePayload = {
      name: row.name,
      publishStatus: 'live',
      description: row.description,
      owner: ownerIds[index % ownerIds.length]!,
      location: row.location,
      tags: row.tags,
      kioskSubtype: null,
      marketSubtype: null,
      tapSubtype: null,
    }
    data[kind.subtypeField] = kind.subtypeValue
    return { collection: kind.collection, data }
  })
}
