import './global.css';

import { HeroUINativeProvider } from 'heroui-native';
import { Stepper } from 'heroui-native-pro';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
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
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
