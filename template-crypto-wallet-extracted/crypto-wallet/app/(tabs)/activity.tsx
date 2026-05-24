import { useRouter } from "expo-router";

import { SingleColorIcon } from "@/components/icons/single-color";
import { EmptyList } from "@/components/shared/empty-list";
import { Screen } from "@/components/shared/screen";

export default function ActivityRoute(): React.ReactElement {
  const router = useRouter();

  const handleCta = (): void => {
    router.navigate("/(tabs)/search");
  };

  return (
    <Screen withTabBarSpacing>
      <EmptyList
        icon={<SingleColorIcon name="inbox" size={28} colorClassName="accent-muted" />}
        title="No activity yet"
        description="Your transactions will appear here once you start moving funds."
        ctaLabel="Explore assets"
        onPress={handleCta}
      />
    </Screen>
  );
}
