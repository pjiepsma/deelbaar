import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    />
  );
}
