import './global.css';

import Mapbox from '@rnmapbox/maps';
import { Card, HeroUINativeProvider } from 'heroui-native';
import { Stepper } from 'heroui-native-pro';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '');

const Tab = createBottomTabNavigator();

function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView style={{ flex: 1 }}>
        <Mapbox.Camera zoomLevel={12} centerCoordinate={[4.9041, 52.3676]} />
      </Mapbox.MapView>
    </View>
  );
}

function SavedScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Card>
        <Card.Body>
          <Card.Title>Saved listings</Card.Title>
          <Card.Description>
            Followed and favorite listings will appear here.
          </Card.Description>
        </Card.Body>
      </Card>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Stepper>
        <Stepper.Step>
          <Stepper.Rail />
          <Stepper.Content>
            <Stepper.Title>Account</Stepper.Title>
            <Stepper.Description>Create your account</Stepper.Description>
          </Stepper.Content>
        </Stepper.Step>
        <Stepper.Step>
          <Stepper.Rail />
          <Stepper.Content>
            <Stepper.Title>Profile</Stepper.Title>
            <Stepper.Description>Set up your profile</Stepper.Description>
          </Stepper.Content>
        </Stepper.Step>
      </Stepper>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarLabelStyle: { fontSize: 12 },
            }}
          >
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="Saved" component={SavedScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
