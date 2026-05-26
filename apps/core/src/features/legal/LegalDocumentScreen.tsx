import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../auth/auth.types';
import { useLocale } from '../../context/LocaleContext';
import { fetchCmsLegalPage } from '../../lib/legal/fetchCmsLegalPage';
import type { CmsLegalDocument } from '../../lib/legal/cmsLegal.types';

type Route = RouteProp<RootStackParamList, 'LegalDocument'>;

export function LegalDocumentScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { page } = route.params;

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

  useLayoutEffect(() => {
    if (document?.title) {
      navigation.setOptions({ title: document.title });
      return;
    }
    navigation.setOptions({ title: t(`profile.legalRows.${page}`) });
  }, [document?.title, navigation, page, t]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (error || !document) {
    return (
      <View
        className="flex-1 bg-background px-4"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <Text className="text-foreground text-lg font-semibold">{t('legal.unavailableTitle')}</Text>
        <Text className="text-muted mt-2 text-base leading-6">{t('legal.couldNotLoad')}</Text>
      </View>
    );
  }

  return (
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
  );
}
