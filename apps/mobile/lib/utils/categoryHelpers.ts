/**
 * Category helper functions for listings
 */

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'book':
      return 'book';
    case 'food':
      return 'store';
    case 'hygiene':
      return 'pump-medical';
    case 'community':
      return 'utensils';
    case 'other':
      return 'map-marker-alt';
    default:
      return 'map-marker-alt';
  }
}

/** Saturated, distinct colors (color-blind safe, no red-green adjacency) */
const CATEGORY_COLORS_MAP: Record<string, string> = {
  book: '#4F46E5', // indigo-600 – knowledge
  food: '#D97706', // amber-600 – food
  hygiene: '#0891B2', // cyan-600 – clean
  community: '#059669', // emerald-600 – community
  other: '#7C3AED', // violet-600 – neutral
};

export { CATEGORY_COLORS_MAP };

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS_MAP[category] ?? CATEGORY_COLORS_MAP.other;
}

export function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'book':
      return 'Minibieb';
    case 'food':
      return 'Voedselkast';
    case 'hygiene':
      return 'Hygiënekast';
    case 'community':
      return 'Gemeenschapskast';
    case 'other':
      return 'Anders';
    default:
      return 'Onbekend';
  }
}
