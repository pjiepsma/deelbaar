import type { Review, User } from '../../lib/types/payload-generated';
import type { AppLocale } from '../../context/LocaleContext';

function resolveMediaUrl(serverOrigin: string, url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = serverOrigin.replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

function reviewAuthorLabel(createdBy: Review['created_by']): string {
  if (typeof createdBy === 'number') {
    return String(createdBy);
  }
  const user = createdBy as User;
  const parts = [user.name, user.surname].filter((part) => typeof part === 'string' && part.trim().length > 0);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  if (typeof user.username === 'string' && user.username.length > 0) {
    return user.username;
  }
  return String(user.id);
}

function formatReviewDate(iso: string, locale: AppLocale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid review createdAt: ${iso}`);
  }
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export type PlaceDetailReviewRow = {
  id: number;
  rating: number;
  description: string;
  authorLabel: string;
  dateLabel: string;
  photoUrls: string[];
};

export function mapReviewsToPlaceDetailRows(
  reviews: Review[],
  serverOrigin: string,
  locale: AppLocale,
): PlaceDetailReviewRow[] {
  return reviews.map((review) => {
    const photoUrls: string[] = [];
    for (const row of review.photos ?? []) {
      const photo = row.photo;
      if (!photo || typeof photo === 'string' || typeof photo === 'number') {
        continue;
      }
      const url = resolveMediaUrl(serverOrigin, photo.url ?? photo.thumbnailURL);
      if (url) {
        photoUrls.push(url);
      }
    }
    return {
      id: review.id,
      rating: review.rating,
      description: review.description.trim(),
      authorLabel: reviewAuthorLabel(review.created_by),
      dateLabel: formatReviewDate(review.createdAt, locale),
      photoUrls,
    };
  });
}
