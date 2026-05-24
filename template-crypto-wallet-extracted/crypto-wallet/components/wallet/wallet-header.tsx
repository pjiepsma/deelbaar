import { Avatar } from "heroui-native";
import { View } from "react-native";

import { AppText } from "@/components/shared/app-text";
import { ThemeSelect } from "@/components/shared/theme-select";
import { CopyAddressButton } from "@/components/wallet/copy-address-button";
import { useHomeLayoutMetrics } from "@/lib/contexts/home-layout-metrics-context";
import { MOCK_WALLET } from "@/lib/mocks/wallet";

export const WalletHeader = (): React.ReactElement => {
  const { onWalletHeaderLayout } = useHomeLayoutMetrics();

  return (
    <View onLayout={onWalletHeaderLayout} className="flex-row items-center gap-3 px-5 pt-4">
      <Avatar>
        <Avatar.Image source={{ uri: MOCK_WALLET.avatarUrl }} />
        <Avatar.Fallback>{MOCK_WALLET.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
      </Avatar>
      <View className="flex-1">
        <AppText className="text-base font-semibold text-foreground" numberOfLines={1}>
          {MOCK_WALLET.name}
        </AppText>
        <CopyAddressButton address={MOCK_WALLET.address} />
      </View>
      <ThemeSelect />
    </View>
  );
};
