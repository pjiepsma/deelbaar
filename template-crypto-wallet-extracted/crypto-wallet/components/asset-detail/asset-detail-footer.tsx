import { Button } from "heroui-native";
import { View } from "react-native";

import type { Asset } from "@/lib/types/asset";
export interface AssetDetailFooterProps {
  asset: Asset;
}

export const AssetDetailFooter = ({ asset }: AssetDetailFooterProps): React.ReactElement => {
  return (
    <View className="px-5 pt-2 pb-safe-offset-3 bg-background">
      <Button>{`Buy ${asset.ticker}`}</Button>
    </View>
  );
};
