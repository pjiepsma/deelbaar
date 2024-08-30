import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

export const renderListItem = (title, iconName, onPress, modal = true) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemIconText}>
      <Ionicons name={iconName} size={24} style={styles.icon} />
      <Text style={styles.listItemText}>{title}</Text>
    </View>
    {modal && (
      <Ionicons
        name="chevron-forward-outline"
        size={24}
        style={styles.chevronIcon}
      />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  listItemIconText: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  icon: {
    color: "#000",
  },
  chevronIcon: {
    color: "#6e6e6e",
  },
});
