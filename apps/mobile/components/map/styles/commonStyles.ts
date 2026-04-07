// styles/commonStyles.ts
import { StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';

export const commonStyles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    ...Colors.shadowTokens.md,
  },
  shadow: Colors.shadowTokens.md,
});
