import { useAuth } from '../../context/AuthContext';
import { ProfileGuestScreen } from './ProfileGuestScreen';
import { ProfileSignedInScreen } from './ProfileSignedInScreen';

export function ProfileTabScreen() {
  const { user } = useAuth();

  if (!user) {
    return <ProfileGuestScreen />;
  }

  return <ProfileSignedInScreen />;
}
