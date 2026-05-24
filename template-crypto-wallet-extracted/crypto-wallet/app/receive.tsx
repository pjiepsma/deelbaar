import { useRouter } from "expo-router";
import { CloseButton, Text } from "heroui-native";
import { View } from "react-native";

import { AppText } from "@/components/shared/app-text";
import {
  ExternalAccountItem,
  type ExternalAccountIconName,
} from "@/components/wallet/external-account-item";
import { ReceiveAddressCard } from "@/components/wallet/receive-address-card";
import { MOCK_WALLET } from "@/lib/mocks/wallet";

interface ExternalAccount {
  id: "binance" | "coinbase";
  label: string;
  description: string;
  iconName: ExternalAccountIconName;
}

const EXTERNAL_ACCOUNTS: readonly ExternalAccount[] = [
  {
    id: "binance",
    label: "Binance",
    description: "Withdraw from your exchange account",
    iconName: "binance",
  },
  {
    id: "coinbase",
    label: "Coinbase",
    description: "Withdraw from your exchange account",
    iconName: "coinbase",
  },
];

export default function ReceiveRoute(): React.ReactElement {
  const router = useRouter();

  const handleClose = (): void => {
    router.back();
  };

  const handleQrPress = (): void => {
    // TODO: open a dedicated QR view once the QR rendering pipeline lands.
  };

  const handleAccountPress = (id: ExternalAccount["id"]): (() => void) => {
    return (): void => {
      // TODO: deep-link into the chosen exchange's withdraw flow.
      void id;
    };
  };

  return (
    <View className="bg-background flex-1 px-5 pt-5 gap-6">
      <View className="flex-row items-center justify-between">
        <Text.Heading type="h3">Receive</Text.Heading>
        <CloseButton onPress={handleClose} />
      </View>

      <AppText className="text-sm text-muted">
        Fund your wallet by transferring crypto from another wallet or account.
      </AppText>

      <ReceiveAddressCard
        name={MOCK_WALLET.name}
        address={MOCK_WALLET.address}
        avatarUrl={MOCK_WALLET.avatarUrl}
        onQrPress={handleQrPress}
      />

      <View className="gap-3">
        <Text.Heading type="h6" color="muted">
          From an account
        </Text.Heading>

        <View className="gap-3">
          {EXTERNAL_ACCOUNTS.map((account) => (
            <ExternalAccountItem
              key={account.id}
              label={account.label}
              description={account.description}
              iconName={account.iconName}
              onPress={handleAccountPress(account.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
