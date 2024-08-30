import React from "react";

import {
  ButtonProps as RNButtonProps,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Href, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface ButtonProps extends RNButtonProps {
  link: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const LinkButton = ({ link, text, icon }: ButtonProps) => {
  return (
    <Link href={`${link}` as Href<string>} asChild>
      <TouchableOpacity style={styles.button}>
        <Text>{text}</Text>
        <Ionicons name={icon} size={24} color="black" />
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
  },
});
