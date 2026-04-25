import { Stepper } from 'heroui-native-pro';
import { View } from 'react-native';

const SCREEN_PADDING = 16;

export function ProfileScreen() {
  return (
    <View style={{ flex: 1, padding: SCREEN_PADDING }}>
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
