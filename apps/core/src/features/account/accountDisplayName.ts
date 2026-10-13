import type { AuthUser } from '../../lib/api/auth/authClient';

export function accountDisplayName(user: AuthUser): string {
  const nameParts = [user.name?.trim(), user.surname?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }
  const email = user.email.trim();
  if (!email) {
    throw new Error('AuthUser has no displayable name or email');
  }
  return email;
}

export function accountInitials(user: AuthUser): string {
  const parts: string[] = [];
  const given = user.name?.trim();
  const family = user.surname?.trim();
  if (given && given.length > 0) {
    parts.push(given.charAt(0));
  }
  if (family && family.length > 0) {
    parts.push(family.charAt(0));
  }
  if (parts.length > 0) {
    return parts.join('').toUpperCase().slice(0, 2);
  }
  const email = user.email.trim();
  if (!email) {
    throw new Error('AuthUser has no email for initials');
  }
  return email.charAt(0).toUpperCase();
}
