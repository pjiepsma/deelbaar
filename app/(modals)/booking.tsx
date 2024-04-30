import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";

const Booking = () => {
  return (
    <View>
      <View>
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="password"
          secureTextEntry={true}
          nativeID="password"
          onChangeText={(text) => {
            passwordRef.current = text;
          }}
          style={styles.textInput}
        />
      </View>
    </View>
  );
};

export default Booking;

const styles = StyleSheet.create({});
