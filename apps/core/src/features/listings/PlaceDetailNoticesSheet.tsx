import { BottomSheet } from 'heroui-native';
import { ScrollView, Text, View } from 'react-native';

import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  PLACE_DETAIL_BLOCK_GAP,
  PLACE_DETAIL_SECTION_GAP,
  PLACE_DETAIL_SURFACE,
  PLACE_DETAIL_TEXT_BODY,
  PLACE_DETAIL_TEXT_MUTED,
  PLACE_DETAIL_TEXT_PRIMARY,
} from './placeDetail.constants';
import type { PlaceDetailNotice } from './placeDetail.model';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notices: PlaceDetailNotice[];
  focusedNoticeId: string | null;
  t: TranslateFn;
};

export function PlaceDetailNoticesSheet({
  isOpen,
  onOpenChange,
  notices,
  focusedNoticeId,
  t,
}: Props) {
  const ordered =
    focusedNoticeId == null
      ? notices
      : [
          ...notices.filter((notice) => notice.id === focusedNoticeId),
          ...notices.filter((notice) => notice.id !== focusedNoticeId),
        ];

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('listing.noticesSheetTitle')}</BottomSheet.Title>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: PLACE_DETAIL_SECTION_GAP, paddingBottom: PLACE_DETAIL_BLOCK_GAP }}>
              {ordered.map((notice) => (
                <View
                  key={notice.id}
                  style={{
                    backgroundColor: PLACE_DETAIL_SURFACE,
                    borderRadius: 12,
                    padding: 14,
                    gap: 6,
                  }}
                >
                  <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 16, fontWeight: '700' }}>
                    {notice.title}
                  </Text>
                  {notice.detail ? (
                    <Text style={{ color: PLACE_DETAIL_TEXT_BODY, fontSize: 15, lineHeight: 22 }}>
                      {notice.detail}
                    </Text>
                  ) : (
                    <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 14 }}>
                      {t('listing.noticeNoDetail')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
