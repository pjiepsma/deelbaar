import { router, type Href } from 'expo-router';

export const AuthPath = {
  start: '/auth',
  loginEmail: '/auth/login-email',
  signUp: '/auth/sign-up',
  forgotPassword: '/auth/forgot-password',
  forgotPasswordSent: '/auth/forgot-password-sent',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/callback',
  welcome: '/auth/welcome',
  notifications: '/auth/notifications',
  allowLocation: '/auth/allow-location',
} as const;

export function authPush(href: Href): void {
  router.push(href);
}

export function authReplace(href: Href): void {
  router.replace(href);
}

export function authLoginEmailHref(initialEmail?: string): Href {
  if (!initialEmail) {
    return AuthPath.loginEmail;
  }
  return { pathname: AuthPath.loginEmail, params: { initialEmail } };
}

export function authSignUpHref(initialEmail?: string): Href {
  if (!initialEmail) {
    return AuthPath.signUp;
  }
  return { pathname: AuthPath.signUp, params: { initialEmail } };
}

export function authForgotPasswordHref(initialEmail?: string): Href {
  if (!initialEmail) {
    return AuthPath.forgotPassword;
  }
  return { pathname: AuthPath.forgotPassword, params: { initialEmail } };
}

export function authForgotPasswordSentHref(email: string): Href {
  return { pathname: AuthPath.forgotPasswordSent, params: { email } };
}

export function authVerifyEmailHref(email: string): Href {
  return { pathname: AuthPath.verifyEmail, params: { email } };
}

export function authNotificationsHref(source: 'signup' | 'postLogin'): Href {
  return { pathname: AuthPath.notifications, params: { source } };
}

export function authAllowLocationHref(source: 'signup' | 'postLogin'): Href {
  return { pathname: AuthPath.allowLocation, params: { source } };
}
