import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColorPalette } from '~/lib/theme/types';
import { useAppColors } from '~/lib/theme';

interface HikeItemProps {
  onPress: () => void;
}

function createStyles(colors: AppColorPalette) {
  return StyleSheet.create({
    card: {
      height: 170,
      backgroundColor: colors.background.secondary,
      borderRadius: 10,
      padding: 10,
      marginHorizontal: 25,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.light,
      shadowColor: colors.dark,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
      elevation: 3,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    subtitle: {
      color: colors.text.secondary,
      fontSize: 14,
    },
    button: {
      width: 150,
      alignItems: 'center',
      borderColor: colors.border.medium,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      justifyContent: 'center',
      backgroundColor: colors.background.secondary,
    },
    buttonText: {
      color: colors.dark,
      fontWeight: 'bold',
      fontSize: 14,
    },
  });
}

const ListingCard: React.FC<HikeItemProps> = ({ onPress }) => {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Helaas, geen minibiebs in dit gebied.</Text>
        <Text style={styles.subtitle}>Probeer een andere locatie</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Expand search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ListingCard;
