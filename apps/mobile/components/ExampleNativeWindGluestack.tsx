import { YStack, XStack, Text, Button, Input } from 'tamagui';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';

/**
 * Example component demonstrating Tamagui UI usage
 */
export default function ExampleNativeWindGluestack() {
  const [name, setName] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <YStack padding={24}>
        <Text fontSize={24} fontWeight="700" color="#0F0D08" marginBottom={8}>
          Tamagui UI
        </Text>
        <Text fontSize={14} color="#6b7280" marginBottom={24}>
          This example shows Tamagui design system components
        </Text>

        <YStack backgroundColor="white" borderRadius={12} padding={16} marginBottom={16} shadowColor="black" shadowOpacity={0.08} shadowRadius={8}>
          <Text fontSize={18} fontWeight="600" marginBottom={12}>
            Tamagui Components
          </Text>

          <YStack gap={16}>
            <Input placeholder="Enter your name" value={name} onChangeText={setName} />

            <XStack gap={8}>
              <Button size="$3" flex={1}>
                <Text color="white">Primary</Text>
              </Button>
              <Button size="$3" variant="outline" flex={1}>
                <Text>Secondary</Text>
              </Button>
            </XStack>

            {name && (
              <XStack backgroundColor="#22C55E" paddingHorizontal={12} paddingVertical={8} borderRadius={8} alignSelf="flex-start">
                <Text color="white">Hello, {name}!</Text>
              </XStack>
            )}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
