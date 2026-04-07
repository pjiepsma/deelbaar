import { StyleSheet, Platform, Dimensions } from 'react-native';

import Colors from '~/constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Modern Design System Components
export const defaultStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  // Typography System
  text: {
    // Display
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400',
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400',
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400',
      letterSpacing: 0,
    },

    // Headline
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400',
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400',
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400',
      letterSpacing: 0,
    },

    // Title
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500',
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },

    // Body
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.4,
    },

    // Label
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  },

  // Input Fields
  inputField: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Colors.radius.lg,
    paddingHorizontal: Colors.spacing.md,
    paddingVertical: Colors.spacing.sm,
    backgroundColor: Colors.background.primary,
    fontSize: 16,
    color: Colors.text.primary,
    ...Colors.shadowTokens.sm,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.background.tertiary,
    color: Colors.text.tertiary,
  },

  // Text Area
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: Colors.spacing.sm,
  },

  // Buttons
  btn: {
    minHeight: 56,
    borderRadius: Colors.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Colors.spacing.lg,
    paddingVertical: Colors.spacing.sm,
    ...Colors.shadowTokens.md,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnSecondary: {
    backgroundColor: Colors.secondary,
  },
  btnAccent: {
    backgroundColor: Colors.accent,
  },
  btnSuccess: {
    backgroundColor: Colors.success,
  },
  btnWarning: {
    backgroundColor: Colors.warning,
  },
  btnError: {
    backgroundColor: Colors.error,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnTextPrimary: {
    color: Colors.white,
  },
  btnTextSecondary: {
    color: Colors.text.primary,
  },
  btnIcon: {
    position: 'absolute',
    left: Colors.spacing.md,
  },

  // Button Sizes
  btnSmall: {
    minHeight: 40,
    paddingHorizontal: Colors.spacing.md,
    paddingVertical: Colors.spacing.xs,
  },
  btnLarge: {
    minHeight: 64,
    paddingHorizontal: Colors.spacing.xl,
    paddingVertical: Colors.spacing.md,
  },

  // Cards
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: Colors.radius.xl,
    padding: Colors.spacing.lg,
    marginVertical: Colors.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Colors.shadowTokens.lg,
  },
  cardElevated: {
    ...Colors.shadowTokens.xl,
  },

  // Layout Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  flex1: {
    flex: 1,
  },
  flexWrap: {
    flexWrap: 'wrap',
  },

  // Spacing
  gap: {
    xs: { gap: Colors.spacing.xs },
    sm: { gap: Colors.spacing.sm },
    md: { gap: Colors.spacing.md },
    lg: { gap: Colors.spacing.lg },
    xl: { gap: Colors.spacing.xl },
  },

  // Padding
  p: {
    xs: { padding: Colors.spacing.xs },
    sm: { padding: Colors.spacing.sm },
    md: { padding: Colors.spacing.md },
    lg: { padding: Colors.spacing.lg },
    xl: { padding: Colors.spacing.xl },
  },

  // Margin
  m: {
    xs: { margin: Colors.spacing.xs },
    sm: { margin: Colors.spacing.sm },
    md: { margin: Colors.spacing.md },
    lg: { margin: Colors.spacing.lg },
    xl: { margin: Colors.spacing.xl },
  },

  // Legacy support
  footer: {
    position: 'absolute',
    height: 100,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    paddingVertical: Colors.spacing.sm,
    paddingHorizontal: Colors.spacing.lg,
    borderTopColor: Colors.border.light,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  roundedButton: {
    padding: Colors.spacing.sm,
    height: 48,
    borderRadius: Colors.radius.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Special Components
  gradientButton: {
    borderRadius: Colors.radius.lg,
    overflow: 'hidden',
  },

  // Animations
  fadeIn: {
    opacity: 0,
  },
  fadeInVisible: {
    opacity: 1,
  },

  // Loading States
  skeleton: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Colors.radius.md,
  },

  // Status Indicators
  badge: {
    paddingHorizontal: Colors.spacing.sm,
    paddingVertical: Colors.spacing.xs,
    borderRadius: Colors.radius.full,
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },

  // Modal Styles
  modal: {
    margin: Colors.spacing.lg,
    borderRadius: Colors.radius.xl,
    backgroundColor: Colors.background.primary,
    maxHeight: screenHeight * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  modalBackdrop: {
    backgroundColor: Colors.background.modal,
  },

  // Tab Bar
  tabBar: {
    backgroundColor: Colors.background.primary,
    borderTopColor: Colors.border.light,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? Colors.spacing.sm : 0,
    height: Platform.OS === 'ios' ? 88 : 64,
  },

  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Colors.spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Colors.spacing.lg,
  },
  emptyStateTitle: {
    ...defaultStyles.text.titleLarge,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Colors.spacing.md,
  },
  emptyStateDescription: {
    ...defaultStyles.text.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Colors.spacing.xl,
  },

  // Toast/Notification Styles
  toast: {
    position: 'absolute',
    top: Colors.spacing.xl,
    left: Colors.spacing.lg,
    right: Colors.spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
