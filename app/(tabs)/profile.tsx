import { Button, Text, View } from "react-native";
import React from "react";
import { Link } from "expo-router";
import { useUserContext } from "@/app/auth/auth";
import { useSignOutAccount } from "@/lib/query/auth";

const Page = () => {
  const { user } = useUserContext();
  const { mutateAsync: signOut } = useSignOutAccount();

  return (
    <View>
      <Button title="Log out" onPress={() => signOut()} />
      {!user && (
        <Link href={"/(modals)/sign-in"}>
          <Text>Log in</Text>
        </Link>
      )}
    </View>
  );
};
export default Page;
