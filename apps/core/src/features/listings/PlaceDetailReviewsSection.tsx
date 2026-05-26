import { Ionicons } from '@expo/vector-icons';
import { PressableFeedback } from 'heroui-native';
import { Image, ScrollView, Text, View } from 'react-native';

import type { AuthUser } from '../../lib/api/auth/authClient';
import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  PLACE_DETAIL_ACCENT,
  PLACE_DETAIL_HORIZONTAL_PADDING,
  PLACE_DETAIL_LINK,
  PLACE_DETAIL_SECTION_GAP,
  PLACE_DETAIL_SURFACE,
  PLACE_DETAIL_TEXT_MUTED,
  PLACE_DETAIL_TEXT_PRIMARY,
} from './placeDetail.constants';
import type { PlaceDetailReviewRow } from './placeDetailReviews.model';

type Props = {
  reviews: PlaceDetailReviewRow[];
  user: AuthUser | null | undefined;
  t: TranslateFn;
  onLeaveReviewPress: () => void;
};

export function PlaceDetailReviewsSection({ reviews, user, t, onLeaveReviewPress }: Props) {
  const signedIn = !!user;

  return (
    <View style={{ gap: PLACE_DETAIL_SECTION_GAP }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 20, fontWeight: '700' }}>
          {t('listing.reviewsTitle')}
        </Text>
        <PressableFeedback
          onPress={onLeaveReviewPress}
          accessibilityLabel={t('listing.leaveReview')}
          isDisabled={!signedIn}
        >
          <Text
            style={{
              color: signedIn ? PLACE_DETAIL_LINK : PLACE_DETAIL_TEXT_MUTED,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            {t('listing.leaveReview')}
          </Text>
        </PressableFeedback>
      </View>

      {reviews.length === 0 ? (
        <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 15 }}>{t('listing.noReviews')}</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
}

function ReviewCard({ review }: { review: PlaceDetailReviewRow }) {
  return (
    <View
      style={{
        backgroundColor: PLACE_DETAIL_SURFACE,
        borderRadius: 12,
        padding: PLACE_DETAIL_HORIZONTAL_PADDING - 4,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <StarRating rating={review.rating} />
        <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 13 }}>{review.dateLabel}</Text>
      </View>
      <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 15, fontWeight: '600' }}>{review.authorLabel}</Text>
      <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 15, lineHeight: 22 }}>{review.description}</Text>
      {review.photoUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {review.photoUrls.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={{ width: 72, height: 72, borderRadius: 8 }}
                resizeMode="cover"
              />
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= rating ? 'star' : 'star-outline'}
        size={16}
        color={PLACE_DETAIL_ACCENT}
      />,
    );
  }
  return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
}
