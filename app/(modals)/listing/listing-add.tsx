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
import { useCreateListing } from "@/lib/query/posts";
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

export default function ListingAdd() {
  const { mutateAsync: createListing } = useCreateListing();
  const { user } = useUserContext();
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<LocationGeocodedAddress | null>(null);
  const { width } = Dimensions.get("window");
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [text, onChangeText] = React.useState("Useless Text");
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

  const objectExample = {
    type: "GeometryCollection",
    geometries: [
      {
        type: "Point",
        coordinates: [0, 0],
        properties: {
          Name: "Minibieb Jumbo",
          Adres: "Sluijtersstraat 9",
          Plaatsnaam: "7312 SV Apeldoorn",
          Provincie: "Gelderland",
          Bijzonderheid: null, // caption
          Beheerder: null, // creator
          Internet: null, // image
        },
      },
    ],
  };

  /*
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      Adres: "Sluijtersstraat 9",
                      Plaatsnaam: "7312 SV Apeldoorn",
                      Provincie: "Gelderland",
                  
                      
                              creator
                            relationship with creator, skip for now
                            -
                            favorites
                            relationship with favorites (skip for now)
                            -
                            caption bijzonderhden
                            string
                            -
                            favorite
                            relationship with favorite
                            -
                            location
                            string
                            -
                            images
                               */

  const { post } = useLocalSearchParams();
  const [images, setImages] = useState<any[]>([]);
  useEffect(() => {
    if (post) {
      console.log("From Modal: ", post);
      // Post updated, do something with `post`
      // For example, send the post to the server
    }
  }, [post]);

  const onError: SubmitErrorHandler<FormValues> = (errors, e) => {
    return console.log(errors);
  };

  useEffect(() => {
    onLocateMe();
  }, []);

  const deleteImage = (index: number) => {
    const newArray = [
      ...images.slice(0, index), // Elements before the one to delete
      ...images.slice(index + 1), // Elements after the one to delete
    ];
    setImages(newArray); // Triggers a re-render with the new array
    console.log(JSON.stringify(images));
  };

  const onLocateMe = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    if (objectExample.geometries[0].properties.Adres) {
      let location = await Location.geocodeAsync(
        `${objectExample.geometries[0].properties.Adres} ${objectExample.geometries[0].properties.Plaatsnaam}`,
      );
      console.log("location from address: ", location);
    }

    let location = await Location.getCurrentPositionAsync({});

    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  };
  const navigation = useNavigation();

  const pickLocation = useCallback(async (event: any) => {
    const location = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };
    setLocation(location);
    let addresses = await Location.reverseGeocodeAsync(location);
    setAddress(addresses[0]);
  }, []);

  const [data, setData] = useState("");
  const windowWidth = useWindowDimensions().width;
  const window: ScaledSize = Dimensions.get("window");
  const PAGE_WIDTH = window.width;

  const handleListing = async () => {
    if (!images) return;

    const file = {
      name: images[0].fileName || "",
      type: images[0].mimeType || "",
      size: images[0].fileSize || 0,
      uri: images[0].uri || "",
    };

    const geometry = {
      address: "",
      city: "",
      province: "",
      postal: "",
      latitude: location.latitude,
      longitude: location.longitude,
    };

    const listing = await createListing({
      creator: user.id,
      name: "Minibieb Dummy",
      description: "Minibieb Dummy",
      category: ICategory.Books,
      files: [],
      geometry: geometry,
      tags: [ITags.Dutch],
    });
  };

  const { ...methods } = useForm();
  const [formError, setError] = useState<Boolean>(false);

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
                    onPress={() => handleListing}
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
        <Slider images={images} deleteImage={deleteImage} />
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
  },
});
