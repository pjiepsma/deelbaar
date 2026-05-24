export const authConfig = {
  minPasswordLength: 6,
  secureStorageKeys: {
    authToken: 'deelbaar_auth_token',
    pendingNotificationsAfterLogin: 'deelbaar_auth_pending_notifications',
  },
} as const;
