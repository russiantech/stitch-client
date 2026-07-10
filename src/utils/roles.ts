import type { User } from '@/types/index.ts';

export type NavRole = 'customer' | 'admin' | 'staff' | 'driver';

export function getNavRole(user: User | null | undefined, isAdmin: () => boolean): NavRole {
  if (isAdmin()) return 'admin';
  if (user?.roles.includes('staff') || user?.roles.includes('manager')) return 'staff';
  if (user?.roles.includes('driver')) return 'driver';
  return 'customer';
}

