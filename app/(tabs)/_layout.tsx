import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { NotificationBell } from '~/components/NotificationBell';
import OnboardingModal from '~/components/OnboardingModal';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';

export default function TabsLayout() {
  const { user } = useAuth();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => <NotificationBell />,
          headerStyle: {
            backgroundColor: Colors.background.primary,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: Colors.text.tertiary,
          },
          headerTintColor: Colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: Colors.background.primary,
            borderTopColor: Colors.border.light,
            borderTopWidth: 1,
            height: 88, // iOS height
            paddingBottom: 28, // iOS safe area
            paddingTop: 8,
            elevation: 0, // Remove Android shadow
            shadowOpacity: 0, // Remove iOS shadow
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Kaart',
            headerTitle: 'Kaart',
            headerTransparent: true,
            headerStyle: {
              backgroundColor: 'transparent',
            },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'map' : 'map-outline'}
                size={focused ? 20 : 18}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist/index"
          options={{
            title: 'Wensen',
            headerTitle: 'Wensen',
            headerRight: () => <NotificationBell disabled={!user} />,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={focused ? 20 : 18}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites/index"
          options={{
            title: 'Favorieten',
            headerTitle: 'Favorieten',
            headerRight: () => <NotificationBell disabled={!user} />,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'star' : 'star-outline'}
                size={focused ? 20 : 18}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="my-home/index"
          options={{
            title: 'Mijn kasten',
            headerTitle: 'Mijn kasten',
            headerRight: () => <NotificationBell disabled={!user} />,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'business' : 'business-outline'}
                size={focused ? 20 : 18}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={focused ? 20 : 18}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <OnboardingModal />
    </>
  );
}
