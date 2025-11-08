import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  Button,
  ButtonText,
  Box,
  Text as GluestackText,
  Input,
  InputField,
  VStack,
  HStack,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';

/**
 * Example component demonstrating NativeWind and Gluestack UI usage
 */
export default function ExampleNativeWindGluestack() {
  const [name, setName] = useState('');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* NativeWind Styling */}
      <View className="p-6">
        <Text className="text-3xl font-bold text-primary mb-2">
          NativeWind + Gluestack UI
        </Text>
        <Text className="text-gray-600 mb-6">
          This example shows both libraries working together
        </Text>

        {/* Tailwind-styled container with Gluestack components */}
        <View className="bg-white rounded-lg p-4 shadow-md mb-4">
          <GluestackText fontSize="$lg" fontWeight="$semibold" mb="$3">
            Gluestack UI Components
          </GluestackText>

          <VStack space="md">
            <Input>
              <InputField
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
              />
            </Input>

            <HStack space="sm">
              <Button size="sm" variant="solid" action="primary" flex={1}>
                <ButtonText>Primary</ButtonText>
              </Button>
              <Button size="sm" variant="outline" action="secondary" flex={1}>
                <ButtonText>Secondary</ButtonText>
              </Button>
            </HStack>

            {name && (
              <Box>
                <Badge action="success" variant="solid">
                  <BadgeText>Hello, {name}!</BadgeText>
                </Badge>
              </Box>
            )}
          </VStack>
        </View>

        {/* Pure NativeWind Styling */}
        <View className="bg-primary rounded-lg p-4 mb-4">
          <Text className="text-white text-lg font-semibold mb-2">
            NativeWind Utilities
          </Text>
          <Text className="text-white opacity-90">
            Using Tailwind classes directly on React Native components
          </Text>
        </View>

        {/* Grid-like layout with Tailwind */}
        <View className="flex-row flex-wrap gap-2">
          <View className="bg-success rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-white font-semibold">Success</Text>
          </View>
          <View className="bg-warning rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-white font-semibold">Warning</Text>
          </View>
          <View className="bg-danger rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-white font-semibold">Danger</Text>
          </View>
          <View className="bg-info rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-white font-semibold">Info</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}


