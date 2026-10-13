import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Button, Label, TextArea, TextField } from 'heroui-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  PLACE_DETAIL_ACCENT,
  PLACE_DETAIL_BLOCK_GAP,
  PLACE_DETAIL_SECTION_GAP,
  PLACE_DETAIL_TEXT_MUTED,
  PLACE_DETAIL_TEXT_PRIMARY,
} from './placeDetail.constants';

const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_DESCRIPTION_LENGTH = 3;

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  errorMessage: string | null;
  t: TranslateFn;
  onSubmit: (payload: { rating: number; description: string }) => void;
};

export function PlaceDetailLeaveReviewSheet({
  isOpen,
  onOpenChange,
  submitting,
  errorMessage,
  t,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(MAX_RATING);
  const [description, setDescription] = useState('');

  const canSubmit =
    !submitting &&
    Number.isInteger(rating) &&
    rating >= MIN_RATING &&
    rating <= MAX_RATING &&
    description.trim().length >= MIN_DESCRIPTION_LENGTH;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDescription('');
          setRating(MAX_RATING);
        }
        onOpenChange(open);
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('listing.leaveReview')}</BottomSheet.Title>
          <View style={{ gap: PLACE_DETAIL_SECTION_GAP, paddingBottom: PLACE_DETAIL_BLOCK_GAP }}>
            <View style={{ gap: 8 }}>
              <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
                {t('listing.reviewRatingLabel')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: MAX_RATING }, (_, index) => {
                  const value = index + 1;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setRating(value)}
                      accessibilityRole="button"
                      accessibilityLabel={t('listing.reviewRatingStar', { count: String(value) })}
                    >
                      <Ionicons
                        name={value <= rating ? 'star' : 'star-outline'}
                        size={28}
                        color={PLACE_DETAIL_ACCENT}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField isDisabled={submitting}>
              <Label>{t('listing.reviewDescriptionLabel')}</Label>
              <TextArea
                value={description}
                onChangeText={setDescription}
                placeholder={t('listing.reviewDescriptionPlaceholder')}
              />
            </TextField>

            {errorMessage ? (
              <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 14 }}>{errorMessage}</Text>
            ) : null}

            <Button
              variant="primary"
              isDisabled={!canSubmit}
              onPress={() => onSubmit({ rating, description: description.trim() })}
            >
              <Button.Label>
                {submitting ? t('listing.reviewSubmitting') : t('listing.reviewSubmit')}
              </Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
