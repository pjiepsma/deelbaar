import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import Colors from '~/constants/Colors';

const Layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarLabelStyle: { fontFamily: 'mon-sb', fontSize: 12 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      {/*<Tabs.Screen*/}
      {/*  name="profile"*/}
      {/*  options={{*/}
      {/*    tabBarLabel: 'Profile',*/}
      {/*    tabBarIcon: ({ color, size }) => (*/}
      {/*      <Ionicons name="person-circle-outline" size={size} color={color} />*/}
      {/*    ),*/}
      {/*  }}*/}
      {/*/>*/}
    </Tabs>
  );
};
export default Layout;
