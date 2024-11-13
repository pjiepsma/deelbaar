import Entypo from '@expo/vector-icons/Entypo';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Font from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AnimatedSplash from '~/components/AnimatedSplash';
import Colors from '~/constants/Colors';
import { AuthProvider } from '~/lib/AuthProvider';
import { PowerSyncProvider } from '~/lib/powersync/PowerSyncProvider';
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayout = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Set the navigation bar color to match your app's theme color
    NavigationBar.setBackgroundColorAsync(Colors.primary); // Replace with your desired color
    NavigationBar.setButtonStyleAsync('light');
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
        // const [loaded, error] = useFonts({
        //   mon: require('../assets/fonts/Montserrat-Regular.ttf'),
        //   'mon-b': require('../assets/fonts/Montserrat-Bold.ttf'),
        //   'mon-sb': require('../assets/fonts/Montserrat-SemiBold.ttf'),
        // });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }
  // onLayout={onLayoutRootView}
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AnimatedSplash onFinish={onLayoutRootView} />
      {/*//   <PowerSyncProvider>*/}
      {/*//     <SafeAreaProvider>*/}
      {/*//       <BottomSheetModalProvider>*/}
      {/*//         <AuthProvider>*/}
      {/*//           <InitialLayout />*/}
      {/*//         </AuthProvider>*/}
      {/*//       </BottomSheetModalProvider>*/}
      {/*//     </SafeAreaProvider>*/}
      {/*//   </PowerSyncProvider>*/}
    </GestureHandlerRootView>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Match your splash background color
  },
});
