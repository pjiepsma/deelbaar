import { Button, useToast } from "heroui-native";

import { SingleColorIcon } from "@/components/icons/single-color";
import { CopyAddressToast } from "@/components/wallet/copy-address-toast";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { truncateAddress } from "@/lib/utils/format";

export interface CopyAddressButtonProps {
  address: string;
}

export const CopyAddressButton = ({ address }: CopyAddressButtonProps): React.ReactElement => {
  const { toast } = useToast();

  const handlePress = (): void => {
    void copyToClipboard(address);
    toast.show({
      duration: 2000,
      component: (props) => (
        <CopyAddressToast {...props} description={truncateAddress(address, 6, 6)} />
      ),
    });
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      accessibilityLabel="Copy wallet address"
      className="h-auto px-0 self-start rounded-none"
      onPress={handlePress}
    >
      <Button.Label className="text-muted text-xs">{truncateAddress(address)}</Button.Label>
      <SingleColorIcon name="copy" size={16} colorClassName="accent-muted" />
    </Button>
  );
};
