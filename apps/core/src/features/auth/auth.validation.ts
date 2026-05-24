import { authConfig } from '../../config/auth.config';

export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmailValid(value: string): boolean {
  if (!value) {
    return false;
  }
  return value.includes('@');
}

export function isPasswordValid(value: string): boolean {
  return value.length >= authConfig.minPasswordLength;
}
