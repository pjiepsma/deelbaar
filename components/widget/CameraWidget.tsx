import { CameraCapturedPicture, CameraType } from 'expo-camera';
import { CameraView, useCameraPermissions } from 'expo-camera/next';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Icon } from 'react-native-elements';

export interface Props {
  onCaptured: (photo: CameraCapturedPicture) => void;
  onClose: () => void;
}

const isAndroid = Platform.OS === 'android';

export const CameraWidget = (props: Props) => {
  // @ts-ignore
  const cameraRef = useRef<Camera>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);

  // Getting width and height of the screen
  const { width } = useWindowDimensions();
  const height = Math.round((width * 16) / 9);

  const captureImageAsync = async () => {
    if (loading) {
      return;
    }
    if (cameraRef.current && ready) {
      setLoading(true);
      const options = {
        base64: true,
        quality: 0.5,
        skipProcessing: isAndroid,
      };
      const photo = await cameraRef.current.takePictureAsync(options);
      setLoading(false);
      props.onCaptured(photo);
      props.onClose();
    }
  };

  const onReady = () => {
    if (!permission) {
      requestPermission();
    } else {
      setReady(true);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={{ ...styles.camera, height, width: '100%' }}
        onCameraReady={onReady}
        facing={CameraType.back}>
        <TouchableOpacity onPress={props.onClose} style={styles.backButton}>
          <Icon name="chevron-left" type="font-awesome" color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shutterButton} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
        <View style={styles.bottomCamera}>
          <TouchableOpacity
            disabled={loading}
            style={styles.shutterButton}
            onPress={captureImageAsync}>
            <ActivityIndicator animating={loading} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  camera: {
    flex: 1,
  },
  bottomCamera: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 30,
    backgroundColor: 'transparent',
  },
  shutterButton: {
    width: 70,
    height: 70,
    bottom: 15,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
