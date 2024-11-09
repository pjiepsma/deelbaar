// styles/commonStyles.ts
import { StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';

export const commonStyles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
});
