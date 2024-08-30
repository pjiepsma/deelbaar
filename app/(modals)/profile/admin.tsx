import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  ScaledSize,
  Dimensions,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useNavigation, useRouter } from "expo-router";
import Gelderland from "@/assets/data/minibieb-gelderland.json";
import { renderListItem } from "@/components/ListItem";
import * as Location from "expo-location";
import { ICategory, ITags } from "@/types";
import { useCreateListing } from "@/lib/query/posts";

export default function ProfileEdit() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useUserContext();
  const {
    data: creator,
    isLoading,
    isError: isErrorCreators,
  } = useGetUserById(user.id); // Fetch farovites of User instead of whole user. Filter data by category and use
  const [firstName, setFirstName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [avatar, setAvatar] = useState<ImagePickerAsset | null>(null);
  const [bio, setBio] = useState(user?.bio);
  const uniqueListings = [
    ...new Map(
      Gelderland.geometries.map((item) => [item.properties.Adres, item]),
    ).values(),
  ];

  useEffect(() => {
    if (user) {
      setFirstName(user.name);
      setEmail(user.email);
      setBio(user.bio);
    }
  }, [user]);

  const window: ScaledSize = Dimensions.get("window");
  const { mutateAsync: createListing } = useCreateListing();
  const convertGeometryToLocation = async (address: string, city: string) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    return await Location.geocodeAsync(`${address} ${city}`);

    return null;
  };

  const handleJSONListing = async (properties) => {
    const [postalCode, city] = properties.Plaatsnaam.match(/\d{4} \w{2}|.+$/g);
    const locationArray = await convertGeometryToLocation(
      properties.Adres,
      city,
    );
    if (!locationArray) return;
    const location = locationArray[0];

    const geometry = {
      address: properties.Adres,
      city: city,
      province: properties.Provincie,
      postal: postalCode,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const listing = await createListing({
      creator: user.id,
      owner: "Onbekend",
      name: properties.Name,
      description: properties.Bijzonderheid,
      category: ICategory.Books,
      files: [],
      geometry: geometry,
      tags: [],
    });
    console.log(JSON.stringify(listing));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <View>
          {renderListItem("Listings", "pricetags-outline", () =>
            router.navigate("/(modals)/listing/listing-add"),
          )}
        </View>
      </TouchableOpacity>
      <ScrollView style={styles.container}>
        {uniqueListings.map((item, index) => {
          return listItem(
            item.properties,
            "settings-outline",
            () => handleJSONListing(item.properties),
            true,
            index,
          );
        })}
      </ScrollView>
    </View>
  );
}

export const listItem = (
  properties,
  iconName,
  onPress,
  modal = true,
  index,
) => (
  <View style={styles.item} key={index}>
    <Text>{`${properties.Adres} ${properties.Plaatsnaam}`}</Text>
    <TouchableOpacity onPress={onPress} style={styles.addButton}>
      <Text>Add</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flex: 1,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: Colors.grey,
    justifyContent: "space-between",
  },
  addButton: {
    width: 30,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
});
