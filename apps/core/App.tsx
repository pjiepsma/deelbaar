import './global.css';

import Mapbox from '@rnmapbox/maps';
import { HeroUINativeProvider } from 'heroui-native';
import { Stepper } from 'heroui-native-pro';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

Mapbox.setAccessToken(
  'pk.eyJ1IjoicGllcnJpb3VzIiwiYSI6ImNtbjI3enA4eDAyZ28ycHF6MTUwcmEydDkifQ.IPJXZkse-z1uhz66afpuPA'
);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View style={{ flex: 1 }}>
          <Mapbox.MapView style={{ flex: 1 }}>
            <Mapbox.Camera
              zoomLevel={12}
              centerCoordinate={[4.9041, 52.3676]}
            />
          </Mapbox.MapView>
          <View
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 24,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderRadius: 12,
              padding: 12,
            }}
          >
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
        </View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
