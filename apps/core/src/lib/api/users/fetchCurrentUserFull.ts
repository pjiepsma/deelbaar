import type { User } from '../../types/payload-generated';
import { payloadClient } from '../PayloadClient';

const USERS_ME_PATH = '/users/me';

export async function fetchCurrentUserFull(depth = 2): Promise<User | null> {
  try {
    const response = await payloadClient.request<{ user?: User | null }>(
      `${USERS_ME_PATH}?depth=${encodeURIComponent(String(depth))}`,
      { method: 'GET' },
    );
    return response.user ?? null;
  } catch {
    return null;
  }
}
