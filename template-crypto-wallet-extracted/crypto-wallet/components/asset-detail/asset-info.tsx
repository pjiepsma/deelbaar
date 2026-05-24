import { View } from "react-native";
import { Text } from "heroui-native";

import type { Asset } from "@/lib/types/asset";

export interface AssetInfoProps {
  asset: Asset;
}

export const AssetInfo = ({ asset }: AssetInfoProps): React.ReactElement => {
  return (
    <View className="gap-2 px-5">
      <Text.Heading type="h6">About {asset.name}</Text.Heading>
      <Text.Paragraph type="body-sm">{asset.description}</Text.Paragraph>
    </View>
  );
};
