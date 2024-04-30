import { Button, Text, View } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { useUserContext } from "@/app/auth/auth";
import { useSignOutAccount } from "@/lib/query/auth";
import Position from "@/components/Position";

const Page = () => {
  const { isAuthenticated, user } = useUserContext();
  const { mutateAsync: signOut } = useSignOutAccount();

  return (
    <View>
      <Position />
      <View>
        {isAuthenticated && (
          <Button title="Log out" onPress={() => signOut()} />
        )}
        <Link href={"/(modals)/sign-in"}>
          <Text>Log in</Text>
        </Link>
      </View>
    </View>
  );
};
export default Page;
