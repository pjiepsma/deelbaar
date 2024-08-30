import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "expo-router";
import { useUserContext } from "@/app/auth/auth";
import { useSignOutAccount } from "@/lib/query/auth";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { defaultStyles } from "@/constants/Styles";
import { useGetUserById, useUpdateUser } from "@/lib/query/user";
import { ImagePickerAsset } from "expo-image-picker/src/ImagePicker.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ImageAssets } from "@/assets/images/ImageAssets";
import LogOutBottomSheet from "@/app/(modals)/profile/log-out";
import logOut from "@/app/(modals)/profile/log-out";
import { renderListItem } from "@/components/ListItem";

export default function Profile() {
  const router = useRouter();

  const { isAuthenticated, user, setUser, isAdmin } = useUserContext();
  const { mutateAsync: signOut } = useSignOutAccount();
  const { mutateAsync: updateUser } = useUpdateUser();

  const {
    data: creator,
    isLoading,
    isError: isErrorCreators,
  } = useGetUserById(user.id); // Fetch farovites of User instead of whole user. Filter data by category and use

  const [firstName, setFirstName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [avatar, setAvatar] = useState<ImagePickerAsset | null>(null);
  const [bio, setBio] = useState(user?.bio);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.name);
      setEmail(user.email);
      setBio(user.bio);
    }
  }, [user]);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const handleCloseModalPress = () => bottomSheetRef.current?.close();
  const handleLogoutPress = async () => {
    console.log("Logout");

    bottomSheetRef.current?.close();
    await signOut();
  };

  const handleUpdate = async () => {
    const updatedUser = await updateUser({
      userId: user.id,
      name: firstName,
      bio: bio,
      file: { name: avatar?.fileName, type: avatar?.type, uri: avatar?.uri },
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    });

    setUser({
      ...user,
      name: updatedUser?.name,
      bio: updatedUser?.bio,
      imageUrl: updatedUser?.imageUrl,
    });
  };

  const [edit, setEdit] = useState(false);

  const GuestScreen = ({ navigation }) => {
    return (
      <View>
        <Text style={styles.subtitle}>
          Log in to start finding your next gem.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("(modals)/profile/sign-in")}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
        <Text style={styles.signUpText}>
          Don't have an account?
          <Text
            style={styles.signUpLink}
            onPress={() => navigation.navigate("(modals)/profile/sign-up")}
          >
            Sign up
          </Text>
        </Text>
      </View>
    );
  };
  const UserScreen = ({ navigation }) => {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ fontFamily: "mon-b", fontSize: 22 }}>
            Hi, {firstName}!
          </Text>
        </View>

        <View style={styles.listContainer}>
          {renderListItem("Listings", "pricetags-outline", () =>
            navigation.navigate("(modals)/listing/listings"),
          )}
          {renderListItem("Personal information", "person-circle-outline", () =>
            navigation.navigate("(modals)/profile/profile-edit"),
          )}
          {renderListItem(
            "Log out",
            "log-out-outline",
            () => handlePresentModalPress(),
            false,
          )}
          {isAdmin &&
            renderListItem("Admin", "shield-outline", () =>
              navigation.navigate("(modals)/profile/admin"),
            )}
        </View>
        <LogOutBottomSheet
          ref={bottomSheetRef}
          onCancel={handleCloseModalPress} // handleCloseModalPress
          onLogout={handleLogoutPress} // handleLogoutPress
        />
      </View>
    );
  };
  const ProfileScreen = ({ navigation }) => {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Image source={ImageAssets.pointBook} style={styles.character} />
        </View>
        {isAuthenticated ? (
          <UserScreen navigation={navigation} />
        ) : (
          <GuestScreen navigation={navigation} />
        )}
        <View style={styles.listContainer}>
          {renderListItem("Settings", "settings-outline", () =>
            navigation.navigate("Settings"),
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ProfileScreen navigation={router} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#6e6e6e",
    marginBottom: 16,
    textAlign: "center",
  },
  loginButton: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpText: {
    fontSize: 14,
    color: "#6e6e6e",
    marginTop: 8,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  listContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  versionText: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
    color: "#6e6e6e",
    fontSize: 12,
  },
  // headerContainer: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   padding: 24,
  // },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    position: "absolute",
    right: -10,
    justifyContent: "center",
    borderColor: Colors.light,
    borderWidth: 2,
  },
  edit: {
    color: "white",
    alignSelf: "center",
  },
  // header: {
  //   fontFamily: "mon-b",
  //   fontSize: 24,
  // },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 2,
    },
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.grey,
    borderColor: "white",
    borderWidth: 2,
  },
  character: {
    width: 100,
    height: 100,
  },
  // editRow: {
  //   flex: 1,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   gap: 8,
  // },
  modal: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 4,
    borderRadius: 12,
  },
});
