import { useLocalSearchParams, useRouter } from 'expo-router';
import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '../../context/LocaleContext';
import { fetchCmsLegalPage } from '../../lib/legal/fetchCmsLegalPage';
import type { CmsLegalDocument, CmsLegalPage } from '../../lib/legal/cmsLegal.types';
import { firstRouteParam } from '../../navigation/routeParams';
import { ScreenBackChrome } from '../../components/shared/screen-back-chrome';

function parseLegalPage(raw: string | undefined): CmsLegalPage {
  if (raw === 'terms' || raw === 'privacy' || raw === 'about') {
    return raw;
  }
  throw new Error(`LegalDocumentScreen requires legal page param, got: ${raw ?? 'undefined'}`);
}

export function LegalDocumentScreen() {
  const params = useLocalSearchParams<{ page?: string | string[] }>();
  const page = parseLegalPage(firstRouteParam(params.page));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();

  const [document, setDocument] = useState<CmsLegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = await fetchCmsLegalPage(page);
      setDocument(doc);
    } catch (_e) {
      setError(t('legal.couldNotLoad'));
      setDocument(null);
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenBackChrome onBack={() => router.back()} accessibilityLabel={t('listing.back')} />
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" />
        </View>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View className="flex-1 bg-background">
        <ScreenBackChrome onBack={() => router.back()} accessibilityLabel={t('listing.back')} />
        <View className="flex-1 px-4" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
          <Text className="text-foreground text-lg font-semibold">{t('legal.unavailableTitle')}</Text>
          <Text className="text-muted mt-2 text-base leading-6">{t('legal.couldNotLoad')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenBackChrome onBack={() => router.back()} accessibilityLabel={t('listing.back')} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
      >
        <Text className="text-foreground text-2xl font-semibold">{document.title}</Text>
        <Text className="text-foreground mt-4 text-base leading-6">{document.body}</Text>
      </ScrollView>
    </View>
  );
}
