import { SearchField } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { FavoriteTokensRow } from "@/components/search/favorite-tokens-row";
import { TopTokensSection } from "@/components/search/top-tokens-section";
import { Screen } from "@/components/shared/screen";
import { DEFAULT_TOKEN_SORT_ID, type TokenSortOptionId } from "@/lib/config/token-sort";

export default function SearchRoute(): React.ReactElement {
  const [query, setQuery] = useState<string>("");
  const [sortId, setSortId] = useState<TokenSortOptionId>(DEFAULT_TOKEN_SORT_ID);

  return (
    <Screen withTabBarSpacing>
      <View className="px-5 pt-4">
        <SearchField value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              placeholder="Search tokens, addresses, NFTs"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              className="ios:shadow-none android:shadow-none"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </View>
      <View className="pt-5">
        <FavoriteTokensRow />
      </View>
      <View className="flex-1 pt-5">
        <TopTokensSection query={query} sortId={sortId} onSortChange={setSortId} />
      </View>
    </Screen>
  );
}
