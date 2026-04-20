import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColorPalette } from '~/lib/theme/types';
import { useAppColors } from '~/lib/theme';

interface LoginPromptProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

function createStyles(colors: AppColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
      backgroundColor: colors.background.primary,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text.primary,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    button: {
      marginTop: 8,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 10,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export function LoginPrompt({
  title = 'Log in om verder te gaan',
  message = 'Je moet ingelogd zijn om deze functie te gebruiken.',
  icon,
}: LoginPromptProps) {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      {icon ? (
        <Ionicons name={icon} size={56} color={colors.icon.muted} style={{ marginBottom: 8 }} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button onPress={handleLogin} className="min-w-52">
        Inloggen
      </Button>
    </View>
  );
}
