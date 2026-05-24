import { Button, colorKit, ListGroup, ScrollShadow, Text, useThemeColor } from "heroui-native";
import { ScrollView, View } from "react-native";

import { AssetListItem } from "@/components/assets/asset-list-item";
import { MOCK_ASSETS } from "@/lib/mocks/assets";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyledLinearGradient = withUniwind(LinearGradient);

export const AssetsList = (): React.ReactElement => {
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor("background");

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between pt-4 pb-2 pl-5 pr-4">
        <Text.Heading type="h6" color="muted">
          Explore tokens
        </Text.Heading>
        <Button size="sm" variant="tertiary" className="h-9">
          Manage
        </Button>
      </View>
      <View className="flex-1">
        <ScrollShadow
          LinearGradientComponent={LinearGradient}
          size={insets.bottom + 250}
          visibility="bottom"
        >
          <ScrollView
            contentContainerClassName="pb-safe-offset-24 px-5 pt-3"
            showsVerticalScrollIndicator={false}
          >
            <ListGroup className="bg-transparent shadow-none">
              {MOCK_ASSETS.map((asset, index) => (
                <AssetListItem key={index} asset={asset} />
              ))}
            </ListGroup>
          </ScrollView>
        </ScrollShadow>
        <StyledLinearGradient
          colors={[
            colorKit.setAlpha(backgroundColor, 1).hex(),
            colorKit.setAlpha(backgroundColor, 0).hex(),
          ]}
          className="absolute top-0 left-0 right-0 h-10"
          pointerEvents="none"
        />
      </View>
    </View>
  );
};
