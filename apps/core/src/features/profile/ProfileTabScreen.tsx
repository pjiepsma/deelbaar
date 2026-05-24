import { useAuth } from '../../context/AuthContext';
import { ProfileGuestAuthStack } from '../../navigation/AuthStack';
import { ProfileSignedInScreen } from './ProfileSignedInScreen';

export function ProfileTabScreen() {
  const { user } = useAuth();

  if (!user) {
    return <ProfileGuestAuthStack />;
  }

  return <ProfileSignedInScreen />;
}
