import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSystem } from '~/lib/powersync/PowerSync';
import { SelectProfile } from '~/lib/powersync/Queries';
import { useAuth } from '~/lib/providers/AuthProvider';
import { LocationObject } from 'expo-location';

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
  const { powersync, attachmentQueue } = useSystem();
  const [profile, setProfile] = useState<any | null>(null);
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationObject | null>(null);

  useEffect(() => {
    if (user) {
      powersync
        .get(SelectProfile, [user.id])
        .then((profile) => {
          const uri = attachmentQueue?.getLocalUri(profile.local_uri);
          setProfile({ ...profile, local_uri: uri });
        })
        .catch((error) => console.error(error.message));
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ profile, setLocation, location }}>
      {children}
    </UserContext.Provider>
  );
};
