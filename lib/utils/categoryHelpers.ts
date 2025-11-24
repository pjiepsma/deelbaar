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

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'book':
      return '#a27070';
    case 'food':
      return '#ab947c';
    case 'hygiene':
      return '#b6ac8f';
    case 'community':
      return '#9bb393';
    case 'other':
      return '#a0b9be';
    default:
      return '#a0b9be';
  }
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
