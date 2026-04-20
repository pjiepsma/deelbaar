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
    case 'farm':
      return 'tractor';
    case 'other':
      return 'map-marker-alt';
    default:
      return 'map-marker-alt';
  }
}

/** Ink-family tints so map markers stay readable but match the two-tone UI */
const CATEGORY_COLORS_MAP: Record<string, string> = {
  book: '#3E3131',
  food: '#5A4A4A',
  hygiene: '#4A4A52',
  community: '#524848',
  farm: '#5C4D32',
  other: '#6B5A5A',
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
    case 'farm':
      return 'Boerderijautomaat';
    case 'other':
      return 'Anders';
    default:
      return 'Onbekend';
  }
}
