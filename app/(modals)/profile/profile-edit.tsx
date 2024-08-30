import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  ScrollView,
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
import ProfilePhotoBottomSheet from "@/app/(modals)/profile/profile-photo";
import { ImageAssets } from "@/assets/images/ImageAssets";

export default function ProfileEdit() {
  const router = useRouter();

  const { isAuthenticated, user, setUser } = useUserContext();
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
  useEffect(() => {
    if (user) {
      setFirstName(user.name);
      setEmail(user.email);
      setBio(user.bio);
    }
  }, [user]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();

  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <View>
          <Image source={avatar || ImageAssets.avatar} style={styles.avatar} />
          <TouchableOpacity
            style={styles.round}
            onPress={handlePresentModalPress}
          >
            <Ionicons style={styles.edit} name="pencil-outline" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.card}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {!edit && (
            <View style={styles.editRow}>
              <Text style={{ fontFamily: "mon-b", fontSize: 22 }}>
                {firstName}
              </Text>
              <TouchableOpacity onPress={() => setEdit(true)}>
                <Ionicons name="create-outline" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>
          )}
          {edit && (
            <View style={styles.editRow}>
              <TextInput
                placeholder="First Name"
                value={firstName || ""}
                onChangeText={setFirstName}
                style={[defaultStyles.inputField, { width: 100 }]}
              />
              <TouchableOpacity onPress={handleUpdate}>
                <Ionicons
                  name="checkmark-outline"
                  size={24}
                  color={Colors.dark}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <ProfilePhotoBottomSheet ref={bottomSheetRef} setAvatar={setAvatar} />
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
    backgroundColor: Colors.primary,
    height: 200,
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
  editRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
