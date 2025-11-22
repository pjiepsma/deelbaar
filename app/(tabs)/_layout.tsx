import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import OnboardingModal from '~/components/OnboardingModal';
import { NotificationBell } from '~/components/NotificationBell';
import Colors from '~/constants/Colors';

export default function TabsLayout() {
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
          },
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
            title: 'Kasten',
            headerTitle: 'Kasten',
            headerTransparent: true,
            headerStyle: {
              backgroundColor: 'transparent',
            },
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? Colors.primary + '15' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={focused ? 'business' : 'business-outline'}
                  size={focused ? 20 : 18}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist/index"
          options={{
            title: 'Wensen',
            headerTitle: 'Wensen',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? Colors.accent + '15' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={focused ? 'heart' : 'heart-outline'}
                  size={focused ? 20 : 18}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="favorites/index"
          options={{
            title: 'Favorieten',
            headerTitle: 'Favorieten',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? Colors.warning + '15' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={focused ? 'star' : 'star-outline'}
                  size={focused ? 20 : 18}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="my-home/index"
          options={{
            title: 'Mijn kasten',
            headerTitle: 'Mijn kasten',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? Colors.secondary + '20' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={focused ? 'library' : 'library-outline'}
                  size={focused ? 20 : 18}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account',
            headerTitle: 'Account',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? Colors.info + '15' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={focused ? 20 : 18}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
      <OnboardingModal />
    </>
  );
}
