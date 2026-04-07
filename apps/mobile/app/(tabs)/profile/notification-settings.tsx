import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionRow } from '../../../components/ActionRow';
import { useAuth } from '../../../lib/providers/AuthProvider';
import { useNotifications } from '../../../lib/providers/NotificationProvider';

export default function NotificationSettings() {
  const {
    notificationSettings,
    updateNotificationSettings,
    registerForPushNotifications,
    expoPushToken,
    isLoading,
    error,
  } = useNotifications();
  const { user } = useAuth();

  const handleToggleSetting = async (key: string, value: boolean) => {
    const updatedSettings = { ...notificationSettings, [key]: value };
    await updateNotificationSettings(updatedSettings);
  };

  const handleRegisterNotifications = async () => {
    const success = await registerForPushNotifications();
    if (success) {
      console.log('Push notifications registered successfully');
    } else {
      console.log('Failed to register push notifications');
    }
  };

  const settingsOptions = [
    {
      key: 'reviews',
      label: 'Nieuwe reviews',
      description: 'Ontvang notificaties wanneer iemand je listing reviewt',
    },
    {
      key: 'favorites',
      label: 'Nieuwe favorieten',
      description: 'Ontvang notificaties wanneer iemand je listing toevoegt aan favorieten',
    },
    {
      key: 'photoRequests',
      label: 'Foto aanvragen',
      description: 'Ontvang notificaties wanneer iemand een foto wil toevoegen aan je listing',
    },
    {
      key: 'statusUpdates',
      label: 'Status updates',
      description: "Ontvang notificaties over de goedkeuring van je foto's",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-6 text-gray-900">Notificatie instellingen</Text>

        {error && (
          <View className="mb-4 p-4 bg-red-50 rounded-lg">
            <Text className="text-red-700 font-medium">Fout</Text>
            <Text className="text-red-600 text-sm mt-1">{error}</Text>
          </View>
        )}

        {!expoPushToken ? (
          <View className="mb-6 p-4 bg-blue-50 rounded-lg">
            <Text className="text-lg font-semibold mb-2 text-blue-900">
              Push notificaties inschakelen
            </Text>
            <Text className="text-sm text-blue-700 mb-4">
              Om notificaties te ontvangen moet je push notificaties inschakelen voor deze app.
            </Text>
            <TouchableOpacity
              onPress={handleRegisterNotifications}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-blue-300' : 'bg-blue-600'}`}>
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">Bezig met registreren...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-center">Inschakelen</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mb-6 p-4 bg-green-50 rounded-lg">
            <Text className="text-lg font-semibold text-green-900">Push notificaties actief</Text>
            <Text className="text-sm text-green-700 mb-2">
              Je ontvangt notificaties op dit apparaat.
            </Text>
            <Text className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
              {expoPushToken}
            </Text>
          </View>
        )}

        <Text className="text-lg font-semibold mb-4 text-gray-900">
          Welke notificaties wil je ontvangen?
        </Text>

        {settingsOptions.map((option) => (
          <ActionRow
            key={option.key}
            label={option.label}
            subLabel={option.description}
            rightElement={
              <TouchableOpacity
                onPress={() => handleToggleSetting(option.key, !notificationSettings[option.key])}
                disabled={isLoading}
                className={`w-12 h-6 rounded-full p-1 ${notificationSettings[option.key] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <View
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notificationSettings[option.key] ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </TouchableOpacity>
            }
          />
        ))}

        <View className="mt-8 p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm text-gray-600">
            Notificaties helpen je om op de hoogte te blijven van activiteit op je listings. Je kunt
            deze instellingen altijd aanpassen in je profiel.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}







