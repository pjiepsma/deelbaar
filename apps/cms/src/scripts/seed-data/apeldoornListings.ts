/**
 * Shared listing fixtures around Apeldoorn, NL (GeoJSON: [lng, lat]).
 * Used by full `pnpm seed` and by `pnpm seed:listings` only.
 */

export type ListingCategory = 'book' | 'food' | 'hygiene' | 'community' | 'farm' | 'other'

export type ApeldoornListingTemplate = {
  name: string
  description: string
  category: ListingCategory
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
    category: 'book',
    location: {
      address: 'Grote Kerkhof, Apeldoorn, Netherlands',
      coordinates: [5.9688, 52.2108],
    },
    tags: [{ tag: 'books' }, { tag: 'centrum' }],
  },
  {
    name: 'Oranjepark minibieb',
    description: 'Kleine kast bij het park; vooral jeugd en strip.',
    category: 'book',
    location: {
      address: 'Oranjepark, Apeldoorn, Netherlands',
      coordinates: [5.9582, 52.2141],
    },
    tags: [{ tag: 'books' }, { tag: 'park' }],
  },
  {
    name: 'Berg en Bos boekenhoek',
    description: 'Rustige plek nabij het bos; natuur- en wandelgidsen.',
    category: 'book',
    location: {
      address: 'Berg en Bos, Apeldoorn, Netherlands',
      coordinates: [5.9455, 52.2054],
    },
    tags: [{ tag: 'books' }, { tag: 'nature' }],
  },
  {
    name: 'Osseveld voedselkast',
    description: 'Blij inhoud: conserven, pasta, lang houdbaar.',
    category: 'food',
    location: {
      address: 'Osseveld, Apeldoorn, Netherlands',
      coordinates: [5.982, 52.2183],
    },
    tags: [{ tag: 'food' }, { tag: 'community' }],
  },
  {
    name: 'De Maten ruilplank',
    description: 'Klein spul voor de buurt: gereedschap, spellen, boeken.',
    category: 'community',
    location: {
      address: 'De Maten, Apeldoorn, Netherlands',
      coordinates: [5.9885, 52.1982],
    },
    tags: [{ tag: 'tools' }, { tag: 'sharing' }],
  },
  {
    name: 'Kayersdijk kinderbieb',
    description: 'Prentenboeken en jeugdromans; ouders gezocht als vrijwilligers.',
    category: 'book',
    location: {
      address: 'Kayersdijk, Apeldoorn, Netherlands',
      coordinates: [5.9712, 52.2075],
    },
    tags: [{ tag: 'books' }, { tag: 'kids' }],
  },
  {
    name: 'Korenmolen buurtbieb',
    description: 'Historische romans en streekromanen.',
    category: 'book',
    location: {
      address: 'Korenmolenkwartier, Apeldoorn, Netherlands',
      coordinates: [5.9634, 52.213],
    },
    tags: [{ tag: 'books' }, { tag: 'local' }],
  },
  {
    name: 'Julianapark hygiene-punt',
    description: 'Shampoo, zeep, maandverband — neem wat je nodig hebt.',
    category: 'hygiene',
    location: {
      address: 'Julianapark, Apeldoorn, Netherlands',
      coordinates: [5.951, 52.2088],
    },
    tags: [{ tag: 'hygiene' }, { tag: 'park' }],
  },
  {
    name: 'Apeldoorn-Zuid boekenkast',
    description: 'Thriller en fantasy; ook Engelse titels.',
    category: 'book',
    location: {
      address: 'Apeldoorn-Zuid, Netherlands',
      coordinates: [5.9355, 52.1955],
    },
    tags: [{ tag: 'books' }, { tag: 'fantasy' }],
  },
  {
    name: 'Vogelkwartier zadenbieb',
    description: 'Groentezaden en kruidplantjes ruilen.',
    category: 'food',
    location: {
      address: 'Vogelkwartier, Apeldoorn, Netherlands',
      coordinates: [5.9765, 52.2248],
    },
    tags: [{ tag: 'seeds' }, { tag: 'garden' }],
  },
  {
    name: 'Station Apeldoorn minibieb',
    description: 'Reislectuur en korte verhalen voor pendelaars.',
    category: 'book',
    location: {
      address: 'Stationsplein, Apeldoorn, Netherlands',
      coordinates: [5.9697, 52.2084],
    },
    tags: [{ tag: 'books' }, { tag: 'travel' }],
  },
  {
    name: 'Hoofdstraat free little library',
    description: 'Klassiekers en non-fictie; Engels/Nederlands gemengd.',
    category: 'book',
    location: {
      address: 'Hoofdstraat, Apeldoorn, Netherlands',
      coordinates: [5.9655, 52.2112],
    },
    tags: [{ tag: 'books' }, { tag: 'centrum' }],
  },
  {
    name: 'Eendrachtspark ruilkast',
    description: 'Bordspellen en puzzels voor buurtbewoners.',
    category: 'other',
    location: {
      address: 'Eendrachtspark, Apeldoorn, Netherlands',
      coordinates: [5.9382, 52.2025],
    },
    tags: [{ tag: 'games' }, { tag: 'community' }],
  },
  {
    name: 'Zuidbroek boerderijautomaat (demo)',
    description: 'Demo-locatie voor boerderijautomaat-producten in de buurt.',
    category: 'farm',
    location: {
      address: 'Zuidbroek, Apeldoorn, Netherlands',
      coordinates: [5.9912, 52.1995],
    },
    tags: [{ tag: 'farm' }, { tag: 'local' }],
  },
  {
    name: 'Loolaan wijkbieb',
    description: 'Romans en feelgood; graag netjes terugzetten.',
    category: 'book',
    location: {
      address: 'Loolaan, Apeldoorn, Netherlands',
      coordinates: [5.9285, 52.2058],
    },
    tags: [{ tag: 'books' }],
  },
  {
    name: 'Zevenhuizen community shelf',
    description: 'Huishoudspullen en kleine cadeaus voor wie het kan gebruiken.',
    category: 'community',
    location: {
      address: 'Zevenhuizen, Apeldoorn, Netherlands',
      coordinates: [5.9975, 52.1885],
    },
    tags: [{ tag: 'community' }, { tag: 'sharing' }],
  },
  {
    name: 'Noorderpark kinderbieb',
    description: 'Peuters en kleuters; ook leesvoorbeelden voor ouders.',
    category: 'book',
    location: {
      address: 'Noorderpark, Apeldoorn, Netherlands',
      coordinates: [5.955, 52.2185],
    },
    tags: [{ tag: 'books' }, { tag: 'kids' }],
  },
  {
    name: 'Wilmerspark snack-ruil',
    description: 'Lang houdbaar eten en drinken voor de buurt.',
    category: 'food',
    location: {
      address: 'Wilmerspark, Apeldoorn, Netherlands',
      coordinates: [5.9735, 52.216],
    },
    tags: [{ tag: 'food' }, { tag: 'park' }],
  },
  {
    name: 'Componistenbuurt boekenrek',
    description: 'Biografieën en muziekboeken.',
    category: 'book',
    location: {
      address: 'Componistenbuurt, Apeldoorn, Netherlands',
      coordinates: [5.961, 52.199],
    },
    tags: [{ tag: 'books' }, { tag: 'music' }],
  },
  {
    name: 'Apeldoorn Centrum hygiene-kast',
    description: 'Tandenborstels, deodorant, basis hygiene — anoniem pakken.',
    category: 'hygiene',
    location: {
      address: 'Marktplein, Apeldoorn, Netherlands',
      coordinates: [5.92699, 52.19895],
    },
    tags: [{ tag: 'hygiene' }, { tag: 'centrum' }],
  },
]

export type ListingCreatePayload = {
  name: string
  publishStatus: 'live'
  description: string
  category: ListingCategory
  owner: string
  location: {
    address: string
    coordinates: [number, number]
  }
  tags: { tag: string }[]
}

/**
 * Assigns rotating owners from the given user ids (admin + seeded users, etc.).
 */
export function buildApeldoornListingsSeed(ownerIds: string[]): ListingCreatePayload[] {
  if (ownerIds.length === 0) {
    throw new Error('buildApeldoornListingsSeed: at least one owner id is required')
  }

  return APELDOORN_LISTING_TEMPLATES.map((row, index) => ({
    name: row.name,
    publishStatus: 'live' as const,
    description: row.description,
    category: row.category,
    owner: ownerIds[index % ownerIds.length]!,
    location: row.location,
    tags: row.tags,
  }))
}
