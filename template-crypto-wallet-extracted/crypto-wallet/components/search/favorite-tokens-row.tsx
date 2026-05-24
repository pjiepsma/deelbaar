import { FlatList, type ListRenderItem } from "react-native";

import { FavoriteTokenCard } from "@/components/search/favorite-token-card";
import { MOCK_FAVORITE_ASSETS } from "@/lib/mocks/assets";
import type { Asset } from "@/lib/types/asset";

const FAVORITES_LIMIT = 3;

const VISIBLE_FAVORITES = MOCK_FAVORITE_ASSETS.slice(0, FAVORITES_LIMIT);

const renderFavoriteCard: ListRenderItem<Asset> = ({ item }) => <FavoriteTokenCard asset={item} />;

const keyExtractor = (asset: Asset): string => asset.id;

export const FavoriteTokensRow = (): React.ReactElement => {
  return (
    <FlatList
      data={VISIBLE_FAVORITES}
      renderItem={renderFavoriteCard}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 gap-3"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
};
