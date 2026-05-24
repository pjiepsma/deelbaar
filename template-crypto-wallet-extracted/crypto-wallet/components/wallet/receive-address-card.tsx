import { Avatar, PressableFeedback, useToast } from "heroui-native";
import { View } from "react-native";

import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";
import { CopyAddressToast } from "@/components/wallet/copy-address-toast";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { truncateAddress } from "@/lib/utils/format";

export interface ReceiveAddressCardProps {
  name: string;
  address: string;
  avatarUrl?: string;
  onQrPress?: () => void;
}

export const ReceiveAddressCard = ({
  name,
  address,
  avatarUrl,
  onQrPress,
}: ReceiveAddressCardProps): React.ReactElement => {
  const { toast } = useToast();

  const handleCopyPress = (): void => {
    void copyToClipboard(address);
    toast.show({
      duration: 2000,
      component: (props): React.ReactElement => (
        <CopyAddressToast {...props} description={truncateAddress(address, 6, 6)} />
      ),
    });
  };

  const fallbackInitials = name.slice(0, 2).toUpperCase();

  return (
    <View className="flex-row items-center gap-3 rounded-3xl p-3 bg-surface">
      <Avatar>
        <Avatar.Image source={{ uri: avatarUrl }} />
        <Avatar.Fallback>{fallbackInitials}</Avatar.Fallback>
      </Avatar>

      <View className="flex-1">
        <AppText className="text-base font-semibold text-foreground" numberOfLines={1}>
          {name}
        </AppText>
        <AppText className="text-xs text-muted" numberOfLines={1}>
          {truncateAddress(address, 6, 6)}
        </AppText>
      </View>

      <View className="flex-row items-center gap-2">
        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel="Copy wallet address"
          onPress={handleCopyPress}
          className="size-10 items-center justify-center rounded-full bg-separator-secondary/30"
        >
          <SingleColorIcon name="copy" size={18} colorClassName="accent-foreground" />
        </PressableFeedback>

        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel="Show wallet QR code"
          onPress={onQrPress}
          className="size-10 items-center justify-center rounded-full bg-separator-secondary/30"
        >
          <SingleColorIcon name="qr-code" size={18} colorClassName="accent-foreground" />
        </PressableFeedback>
      </View>
    </View>
  );
};
