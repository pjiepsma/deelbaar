import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { type SingleColorIconName } from "@/components/icons/single-color";
import { useHomeLayoutMetrics } from "@/lib/contexts/home-layout-metrics-context";

import { QuickActionCard } from "./quick-action-card";

type QuickActionId = "send" | "receive" | "swap" | "buy-sell";

interface QuickAction {
  id: QuickActionId;
  label: string;
  iconName: SingleColorIconName;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { id: "send", label: "Send", iconName: "arrow-up-right" },
  { id: "receive", label: "Receive", iconName: "arrow-down-left" },
  { id: "swap", label: "Swap", iconName: "arrows-left-right" },
  { id: "buy-sell", label: "Buy/Sell", iconName: "credit-card" },
];

export const QuickActions = (): React.ReactElement => {
  const { onQuickActionsLayout } = useHomeLayoutMetrics();
  const router = useRouter();

  const handleActionPress = (id: QuickActionId): (() => void) | undefined => {
    if (id === "send") {
      return (): void => router.push("/send");
    }
    if (id === "receive") {
      return (): void => router.push("/receive");
    }
    if (id === "swap") {
      return (): void => router.push("/swap");
    }
    if (id === "buy-sell") {
      return (): void => router.push("/buy-sell");
    }
    return undefined;
  };

  return (
    <View onLayout={onQuickActionsLayout} className="mt-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5"
      >
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.id}
            label={action.label}
            iconName={action.iconName}
            onPress={handleActionPress(action.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
