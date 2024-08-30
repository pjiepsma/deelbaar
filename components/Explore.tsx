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
  Extrapolation,
  interpolate,
  interpolateColor,
  measure,
  SharedValue,
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
import { useEffect, useState } from "react";
import hairlineWidth = StyleSheet.hairlineWidth;

const PAGE_WIDTH = window.width / 5;
const PAGE_HEIGHT = 50;

interface ExploreProps {
  onCategoryChanged: (category: string) => void;
  data: {
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[];
}

const Explore = ({ onCategoryChanged, data }: ExploreProps) => {
  const ref = React.useRef<ICarouselInstance>(null);
  const [activeItem, setActiveItem] = useState(data[1]);
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
      onCategoryChanged(data[currentIndex].name);

      setActiveItem(data[currentIndex]);
    }
  };
  return (
    <View style={styles.container}>
      <Carousel
        loop={data.length > 5}
        ref={ref}
        style={{
          width: window.width,
          height: PAGE_HEIGHT,
          justifyContent: "center",
          alignItems: "center",

          backgroundColor: "#fff",
        }}
        onProgressChange={onProgressChange}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        data={data}
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
  );
};

export default Explore;

interface Props {
  animationValue: SharedValue<number>;
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
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  }, [animationValue]);

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animationValue.value,
      [-1, 0, 1],
      [Colors.grey, Colors.primary, Colors.grey],
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
                color: Colors.secondary,
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
  container: {
    height: 40,
    display: "flex",
    backgroundColor: "#fff",
    borderBottomColor: Colors.grey,
    borderBottomWidth: hairlineWidth,
  },
  active: {
    backgroundColor: "red",
    height: 2,
    width: 25,
    marginLeft: "auto",
    marginRight: "auto",
  },
});
