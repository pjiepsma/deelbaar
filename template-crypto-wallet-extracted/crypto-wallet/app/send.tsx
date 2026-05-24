import { useRouter } from "expo-router";
import { CloseButton, PressableFeedback, SearchField, Text } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";

export default function SendRoute(): React.ReactElement {
  const router = useRouter();
  const [recipient, setRecipient] = useState<string>("");

  const handleClose = (): void => {
    router.back();
  };

  const handleScanPress = (): void => {
    // TODO: open QR scanner once it lands.
  };

  return (
    <View className="bg-background flex-1 px-5 pt-5 gap-6">
      <View className="flex-row items-center justify-between">
        <Text.Heading type="h3">Send</Text.Heading>
        <CloseButton onPress={handleClose} />
      </View>

      <SearchField value={recipient} onChange={setRecipient}>
        <SearchField.Group>
          <SearchField.SearchIcon>
            <AppText className="text-base/5 font-medium text-muted">To</AppText>
          </SearchField.SearchIcon>
          <SearchField.Input
            placeholder="ENS or Address"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoFocus
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <PressableFeedback
        accessibilityRole="button"
        accessibilityLabel="Scan QR code"
        onPress={handleScanPress}
        className="rounded-3xl"
      >
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-full bg-separator-secondary/30">
            <SingleColorIcon name="qr-code" size={24} colorClassName="accent-foreground" />
          </View>
          <View>
            <AppText className="text-sm font-medium text-foreground">Scan QR Code</AppText>
            <AppText className="text-xs text-muted">Tap to scan address</AppText>
          </View>
        </View>
      </PressableFeedback>
    </View>
  );
}
