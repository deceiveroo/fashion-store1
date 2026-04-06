export type StaffRole = 'admin' | 'manager' | 'support';

const STAFF: StaffRole[] = ['admin', 'manager', 'support'];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return !!role && STAFF.includes(role as StaffRole);
}

/** Полный доступ: настройки, пользователи, маркетинг */
export function canManageSettings(role: string | undefined | null): boolean {
  return role === 'admin';
}

export function canManageProducts(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'manager';
}

export function canManageOrders(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'support';
}

export function canViewCustomers(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'support';
}

export function canManageUsers(role: string | undefined | null): boolean {
  return role === 'admin';
}
