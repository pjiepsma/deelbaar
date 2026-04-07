import type { LocationObject } from 'expo-location';
import { createContext, ReactNode, useContext, useState } from 'react';

import { useAuth } from './AuthProvider';
import { useModerationNotifications } from '../hooks/usePayloadQuery';

export const UserContext = createContext<{
  profile: any | null;
  location: LocationObject | null;
  setLocation: (location: LocationObject | null) => void;
}>({
  profile: null,
  location: null,
  setLocation: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationObject | null>(null);

  // Enable moderation notifications for logged-in users
  useModerationNotifications();

  // Use the user directly as profile (from Payload auth)
  // User already contains: id, email, username, name, surname, avatar, role
  const profile = user;

  return (
    <UserContext.Provider value={{ profile, setLocation, location }}>
      {children}
    </UserContext.Provider>
  );
};
