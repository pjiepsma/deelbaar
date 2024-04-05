import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef } from "react";
import Colors from "@/constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
// import * as Haptics from "expo-haptics";

const categories: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
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

interface Props {
  onCategoryChanged: (category: string) => void;
}

const ExploreHeader = ({ onCategoryChanged }: Props) => {
  const scrollRef = useRef<ScrollView>(null);
  const itemsRef = useRef<Array<TouchableOpacity | null>>([]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectCategory = (index: number) => {
    const selected = itemsRef.current[index];
    setActiveIndex(index);

    selected?.measureLayout(scrollRef.current?.getInnerViewNode(), (x) => {
      scrollRef.current?.scrollTo({
        x: x - 16,
        animated: true,
      });
    });

    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChanged(categories[index].name);
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
        <ScrollView
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: "center",
            gap: 30,
            paddingHorizontal: 16,
          }}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              ref={(el) => (itemsRef.current[index] = el)}
              key={index}
              style={
                activeIndex === index
                  ? styles.categoriesBtnActive
                  : styles.categoriesBtn
              }
              onPress={() => selectCategory(index)}
            >
              <Ionicons
                name={category.icon}
                size={24}
                color={activeIndex === index ? Colors.dark : Colors.grey}
              />
              <Text
                style={
                  activeIndex === index
                    ? styles.categoryTextActive
                    : styles.categoryText
                }
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ExploreHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  container: {
    paddingTop: 10,
    backgroundColor: "#fff",
    height: 130,
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
  categoryText: {
    fontSize: 14,
    fontFamily: "mon-sb",
    color: Colors.grey,
  },
  categoryTextActive: {
    fontSize: 14,
    fontFamily: "mon-sb",
    color: "#000",
  },
  categoriesBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },
  categoriesBtnActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: "#000",
    borderBottomWidth: 4,
    paddingBottom: 4,
  },
});
