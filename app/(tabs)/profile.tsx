import { Button, Text, View } from "react-native";
import React from "react";
import { useAuth } from "@/app/auth/auth";
import { Link } from "expo-router";

const Page = () => {
  const { signOut, user } = useAuth();
  return (
    <View>
      <Button title="Log out" onPress={() => signOut()}></Button>
      {!user && (
        <Link href={"/(modals)/sign-in"}>
          <Text>Log in</Text>
        </Link>
      )}
    </View>
  );
};
export default Page;
