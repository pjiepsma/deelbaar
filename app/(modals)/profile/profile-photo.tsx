import React, {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity } from "react-native";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/Styles";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker/src/ImagePicker.types";

interface Props {
  setAvatar: (avatar: ImagePickerAsset) => void;
}

const ProfilePhotoBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ setAvatar }: Props, ref) => {
    const snapPoints = useMemo(() => ["20%"], []);

    const renderBackdrop = useCallback(
      (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
      [],
    );

    const selectImage = async (useLibrary: boolean) => {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      };

      if (useLibrary) {
        result = await ImagePicker.launchImageLibraryAsync(options);
      } else {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      }

      if (!result.canceled) {
        setAvatar(result.assets[0]);
      }
    };

    return (
      <View style={styles.container}>
        <BottomSheetModal
          ref={ref}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
        >
          <View style={styles.container}>
            <Text style={styles.header}>Profile photo</Text>
            <View style={styles.separatorLine}></View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => selectImage(false)}
            >
              <Text style={styles.text}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => selectImage(true)}
            >
              <Text style={styles.text}>Choose existing picture</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "white",
    gap: 2,
    padding: 10,
  },
  header: {
    color: Colors.grey,
    fontSize: 20,
  },
  contentContainer: {
    backgroundColor: "white",
  },
  separatorLine: {
    borderBottomColor: Colors.grey,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  button: {
    color: "white",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  text: {
    color: "white",
  },
});

export default ProfilePhotoBottomSheet;
