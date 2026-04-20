import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Button } from 'heroui-native/button';

/**
 * Example screen using HeroUI Native + RN primitives (Tailwind utilities via Uniwind).
 */
export default function ExampleNativeWindGluestack() {
  const [name, setName] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 24 }}>
        <TextInput
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
          }}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <Button variant="primary" style={{ marginTop: 16 }} onPress={() => {}}>
          <Button.Label>Continue</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
