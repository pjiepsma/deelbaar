import * as React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import Carousel from "react-native-reanimated-carousel";
import { window, ElementsText } from "@/constants";
import { useToggleButton } from "@/hooks/useToggleButton";
import SButton from "./SButton";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useState } from "react";

const PAGE_WIDTH = window.width / 5;
const PAGE_HEIGHT = 40;
const DATA: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    name: "Books",
    icon: "library-outline",
  },
  {
    name: "Water",
    icon: "water-outline",
  },
  {
    name: "Tiny homes",
    icon: "home",
  },
  {
    name: "Food",
    icon: "fast-food-outline",
  },
  {
    name: "Groceries",
    icon: "cart-outline",
  },
  {
    name: "Clothes",
    icon: "shirt-outline",
  },
  {
    name: "Electronics",
    icon: "phone-portrait-outline",
  },
];

interface ExploreProps {
  onCategoryChanged: (category: string) => void;
}

const ExploreCarousel = ({ onCategoryChanged }: ExploreProps) => {
  const ref = React.useRef<ICarouselInstance>(null);
  const [activeItem, setActiveItem] = useState(DATA[0]);

  const activeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scaleX: withTiming(activeItem.name.length / 4, { duration: 200 }) },
      ],
    };
  }, [activeItem]);

  const onProgressChange = (
    _offsetProgress: number,
    absoluteProgress: number,
  ) => {
    const currentIndex = ref.current?.getCurrentIndex() || 0;

    if (absoluteProgress > 0.5 || currentIndex === 0) {
      onCategoryChanged(DATA[currentIndex].name);

      setActiveItem(DATA[currentIndex]);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.actionRow}>
          <Link href={"/(modals)/booking"} asChild>
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search-outline" size={24} color="black" />
              <View>
                <Text
                  style={{
                    fontFamily: "mon-sb",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Where to?
                </Text>
                <Text style={{ fontFamily: "mon-sb", color: Colors.grey }}>
                  Anywhere Any Week
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <Carousel
          ref={ref}
          style={{
            width: window.width,
            height: PAGE_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          }}
          onProgressChange={onProgressChange}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          data={DATA}
          renderItem={({ item, animationValue }) => {
            return (
              <Item
                animationValue={animationValue}
                label={item.name}
                icon={item.icon}
                onPress={() => {
                  ref.current?.scrollTo({
                    count: animationValue.value,
                    animated: true,
                  });
                }}
              />
            );
          }}
        />
        <Animated.View style={[styles.active, activeStyle]}></Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default ExploreCarousel;

interface Props {
  animationValue: Animated.SharedValue<number>;
  label: string;
  icon: any;
  onPress?: () => void;
}

const Item: React.FC<Props> = (props) => {
  const animatedRef = useAnimatedRef();

  const { animationValue, label, icon, onPress } = props;
  const translateY = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [0.5, 1, 0.5],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [animationValue]);

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animationValue.value,
      [-1, 0, 1],
      ["#b6bbc0", Colors.primary, "#b6bbc0"],
    );
    return {
      color,
    };
  }, [animationValue]);

  const onPressIn = React.useCallback(() => {
    translateY.value = withTiming(-8, { duration: 250 });
  }, [translateY]);

  const onPressOut = React.useCallback(() => {
    translateY.value = withTiming(0, { duration: 250 });
  }, [translateY]);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        ref={animatedRef}
        style={[
          {
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          },
          containerStyle,
        ]}
      >
        <Ionicons name={icon} size={24} />
        <View
          style={{
            height: 20,
            display: "flex",
            alignSelf: "center",
          }}
        >
          <Animated.Text
            style={[
              {
                fontSize: 10,
                color: "#26292E",
                display: "flex",
                flexDirection: "column",
              },
              colorStyle,
            ]}
          >
            {label}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  container: {
    paddingTop: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 10,
    padding: 6,
    alignItems: "center",
    width: 280,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#c2c2c2",
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 1,
      height: 1,
    },
  },
  filterBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#A2A0A2",
    borderRadius: 30,
  },
  active: {
    marginBottom: "auto",
    backgroundColor: "black",
    height: 2,
    width: 25,
    marginLeft: "auto",
    marginRight: "auto",
  },
});
