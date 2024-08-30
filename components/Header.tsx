import * as React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";

import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import Explore from "@/components/Explore";
import hairlineWidth = StyleSheet.hairlineWidth;
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

interface HeaderProps {
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

const Header = ({ onNotificationsPress, onProfilePress }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.notifications}
        ></TouchableOpacity>
        <Text style={styles.headerText}>Deelbaar</Text>
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.notifications}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    backgroundColor: "#fff",
  },
  filter: {
    paddingLeft: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  notifications: {
    paddingRight: 10,
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerText: {
    color: Colors.primary,
    fontSize: 30,
  },
});
