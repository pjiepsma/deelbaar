import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip } from 'heroui-native';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

/**
 * Playground tab — horizontal card carousel (HeroUI Card + reanimated-carousel).
 * Map dock uses the same carousel library; this page is a safe UI lab.
 */
const StyledIonicons = withUniwind(Ionicons);

type PlayCard = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tag: string;
  title: string;
  description: string;
};

const PLAY_CARDS: PlayCard[] = [
  {
    id: '1',
    icon: 'albums-outline',
    tag: 'Carousel',
    title: 'Swipe through ideas',
    description:
      'Horizontal parallax carousel with HeroUI cards — same stack as the map listings dock, without map data.',
  },
  {
    id: '2',
    icon: 'color-palette-outline',
    tag: 'HeroUI',
    title: 'Cards & tokens',
    description:
      'Surface variants, Chip labels, and Tailwind classes stay aligned with the native design system.',
  },
  {
    id: '3',
    icon: 'flash-outline',
    tag: 'Motion',
    title: 'Reanimated under the hood',
    description:
      'Gestures and snapping come from react-native-reanimated-carousel — smooth on device, easy to tune.',
  },
  {
    id: '4',
    icon: 'map-outline',
    tag: 'Product',
    title: 'Then try the map',
    description:
      'The real minibieb carousel lives in the map tab bottom sheet — this tab is only for experiments.',
  },
  {
    id: '5',
    icon: 'heart-outline',
    tag: 'Deelbaar',
    title: 'Share what you do not use',
    description:
      'A gentle nudge: list something, borrow something, keep things circulating in your neighbourhood.',
  },
];

const { width: windowWidth } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 300;

export default function SheetPlaygroundScreen() {
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goRelative = useCallback((delta: number) => {
    const len = PLAY_CARDS.length;
    const next = (activeIndex + delta + len) % len;
    carouselRef.current?.scrollTo({ index: next, animated: true });
  }, [activeIndex]);

  const renderItem = useCallback(
    ({ item }: { item: PlayCard }) => {
      return (
        <View className="flex-1 justify-center px-5">
          <Card variant="secondary" className="border border-border/70 shadow-md">
            <Card.Header className="flex-row items-center justify-between pb-0">
              <StyledIonicons name={item.icon} size={24} className="text-accent" />
              <Chip color="accent" size="sm" variant="soft">
                <Chip.Label>{item.tag}</Chip.Label>
              </Chip>
            </Card.Header>
            <Card.Body className="gap-1.5 pt-3">
              <Card.Title className="text-lg">{item.title}</Card.Title>
              <Card.Description className="text-sm leading-5">{item.description}</Card.Description>
            </Card.Body>
            <Card.Footer className="flex-row flex-wrap gap-2 pt-3">
              <Button variant="primary" size="sm" onPress={() => goRelative(1)}>
                <Button.Label>Nice</Button.Label>
              </Button>
              <Button variant="tertiary" size="sm" onPress={() => goRelative(-1)}>
                <Button.Label>Skip</Button.Label>
              </Button>
            </Card.Footer>
          </Card>
        </View>
      );
    },
    [goRelative],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View
        accessibilityLabel="Playground tab loaded"
        className="border-b-4 border-accent bg-accent/15 px-3.5 py-2.5">
        <Text className="text-base font-extrabold text-foreground">Playground · card carousel</Text>
        <Text className="mt-1 text-xs text-muted">Swipe cards horizontally — HeroUI + reanimated-carousel.</Text>
      </View>

      <View className="flex-1 bg-background pb-4 pt-2">
        <Carousel
          ref={carouselRef}
          loop
          width={windowWidth}
          height={CAROUSEL_HEIGHT}
          data={PLAY_CARDS}
          scrollAnimationDuration={280}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.92,
            parallaxScrollingOffset: 42,
            parallaxAdjacentItemScale: 0.88,
          }}
          onSnapToItem={setActiveIndex}
          renderItem={renderItem}
        />

        <View className="items-center gap-3 px-6 pt-2">
          <Text className="text-sm font-semibold text-muted">
            {activeIndex + 1} / {PLAY_CARDS.length}
          </Text>
          <View className="flex-row flex-wrap justify-center gap-1.5">
            {PLAY_CARDS.map((c, i) => (
              <View
                key={c.id}
                className={`size-2 rounded-full ${i === activeIndex ? 'bg-accent' : 'bg-separator'}`}
                accessibilityLabel={i === activeIndex ? `Slide ${i + 1} active` : `Slide ${i + 1}`}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
