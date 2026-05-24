import { useRouter } from "expo-router";
import { Button, Text } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { View } from "react-native";

import { SingleColorIcon } from "@/components/icons/single-color";

export const RecentActivity = (): React.ReactElement => {
  const router = useRouter();

  const handleSeeAll = (): void => {
    router.navigate("/(tabs)/activity");
  };

  return (
    <View className="mt-6 gap-3 px-5">
      <Text.Heading type="h6" color="muted">
        Recent activity
      </Text.Heading>
      <EmptyState className="rounded-3xl bg-surface">
        <EmptyState.Header>
          <EmptyState.Media variant="icon" className="bg-separator-secondary/30">
            <SingleColorIcon name="clock" size={24} colorClassName="accent-muted" />
          </EmptyState.Media>
          <EmptyState.Title>Transactions will appear here</EmptyState.Title>
          <EmptyState.Description>
            Send, receive, or swap to start your on-chain history.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
      <Button variant="secondary" onPress={handleSeeAll}>
        All activity
      </Button>
    </View>
  );
};
