import {
  Dimensions,
  ScaledSize,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Colors from "@/constants/Colors";
import Gelderland from "@/assets/data/minibieb-gelderland.json";

import { useUserContext } from "@/app/auth/auth";
import { useCreateListing, useGetListingById } from "@/lib/query/posts";
import * as Location from "expo-location";
import { LocationGeocodedAddress } from "expo-location";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { Link, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { defaultStyles } from "@/constants/Styles";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@/components/carousel/Slider";
import Picker from "@/components/listing/Picker";
import { ICategory, ITags } from "@/types";

type FormValues = {
  email: string;
  password: string;
};

export default function ListingEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  let { data, isLoading } = useGetListingById(id);

  const navigation = useNavigation();
  const { user } = useUserContext();
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<LocationGeocodedAddress | null>(null);
  const [images, setImages] = useState<any>([]);

  useEffect(() => {
    /*
            export type IListing = {
                creator: string;
                owner: string;
                name: string;
                description: string;
                category: ICategory;
                images: [];
                geometry: IGeometry;
                tags: ITags[];
              };
            */
    if (!data) return;

    const { name } = data.document;
    console.log(name);
  }, [data]);

  const {
    register,
    setValue,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <View style={defaultStyles.container}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.modalBar}>
                <View style={defaultStyles.row}>
                  <TouchableOpacity
                    style={styles.roundButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="chevron-back" size={24} color={"#000"} />
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Nieuw punt</Text>
                </View>

                <View>
                  <TouchableOpacity
                    style={styles.roundedButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.white}>Toevoegen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          ),
        }}
      />
      <View style={styles.container}>
        <Link href={`/listing/address`} asChild>
          <TouchableOpacity>
            <Text>Photo</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
            {/*In *color* display location with a cross behind it*/}
          </TouchableOpacity>
        </Link>
        <Slider images={images} deleteImage={() => {}} />
        <Picker
          image={images[0]?.imageUrl}
          setImage={(image: any) =>
            setImages((state) => {
              return [...state, image];
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.grey,
  },
  map: {
    aspectRatio: 1,
  },
  mapContainer: {
    width: 200,
    height: 200,
  },
  ///
  label: {
    color: "white",
    margin: 20,
    marginLeft: 0,
  },
  button: {
    marginTop: 40,
    color: "white",
    height: 40,
    backgroundColor: "#ec5990",
    borderRadius: 4,
  },
  form: {
    flex: 1,
    // justifyContent: "center",
    // // paddingTop: Constants.statusBarHeight,
    // padding: 8,
    backgroundColor: Colors.grey,
  },
  input: {
    backgroundColor: "white",
    borderColor: "none",
    height: 40,
    padding: 10,
    borderRadius: 4,
  },

  // container: {
  //   flex: 1,
  //   backgroundColor: "white",
  // },
  // image: {
  //   height: IMG_HEIGHT,
  //   width: width,
  // },
  infoContainer: {
    padding: 24,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "mon-sb",
  },
  location: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: "mon-sb",
  },
  rooms: {
    fontSize: 16,
    color: Colors.grey,
    marginVertical: 4,
    fontFamily: "mon",
  },
  ratings: {
    fontSize: 16,
    fontFamily: "mon-sb",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.grey,
    marginVertical: 16,
  },
  host: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: Colors.grey,
  },
  hostView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    height: "100%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerPrice: {
    fontSize: 18,
    fontFamily: "mon-sb",
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    color: Colors.primary,
  },
  roundedButton: {
    padding: 10,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  white: {
    color: "white",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  header: {
    backgroundColor: "#fff",
    height: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.grey,
  },
  headerText: {
    fontSize: 20,
    fontFamily: "mon",
  },
  description: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: "mon",
  },

  safeArea: {
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 10,
  },
});
