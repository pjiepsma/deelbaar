import { useAuth } from '../../context/AuthContext';
import { GuestAccountScreen } from './guest/GuestAccountScreen';
import { AccountConsoleScreen } from './signed/AccountConsoleScreen';

export function AccountTabScreen() {
  const { user } = useAuth();

  if (!user) {
    return <GuestAccountScreen />;
  }

  return <AccountConsoleScreen />;
}
