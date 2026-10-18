import type { UserRole } from './types';

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email address is required' };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
  score: number; // 0 to 4
  rules: {
    minLength: boolean;
    hasNumber: boolean;
    hasLetter: boolean;
    hasSpecialOrUpper: boolean;
  };
} {
  const minLength = (password || '').length >= 8;
  const hasNumber = /\d/.test(password || '');
  const hasLetter = /[a-zA-Z]/.test(password || '');
  const hasSpecialOrUpper = /[A-Z]/.test(password || '') || /[^a-zA-Z0-9]/.test(password || '');

  let score = 0;
  if (minLength) score++;
  if (hasNumber) score++;
  if (hasLetter) score++;
  if (hasSpecialOrUpper) score++;

  if (!password) {
    return {
      valid: false,
      error: 'Password is required',
      score: 0,
      rules: { minLength: false, hasNumber: false, hasLetter: false, hasSpecialOrUpper: false }
    };
  }

  if (!minLength) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
      score,
      rules: { minLength, hasNumber, hasLetter, hasSpecialOrUpper }
    };
  }

  return {
    valid: true,
    score,
    rules: { minLength, hasNumber, hasLetter, hasSpecialOrUpper }
  };
}

export function hasAdminAccess(role?: UserRole | string | null): boolean {
  return role === 'admin';
}

export function canAccessRoute(
  role: UserRole | string | null | undefined,
  path: string
): { allowed: boolean; redirectTo?: string; reason?: string } {
  const cleanPath = path.split('?')[0].toLowerCase();

  // Admin route check: /admin or /admin/...
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    if (!role) {
      return {
        allowed: false,
        redirectTo: `/login?redirect=${encodeURIComponent(path)}`,
        reason: 'Authentication required to access admin portal'
      };
    }
    if (role !== 'admin') {
      return {
        allowed: false,
        redirectTo: '/',
        reason: 'Access denied: Citizen accounts do not have municipal administrative privileges'
      };
    }
  }

  // My Reports check: /my-reports
  if (cleanPath === '/my-reports' || cleanPath.startsWith('/my-reports/')) {
    if (!role) {
      return {
        allowed: false,
        redirectTo: `/login?redirect=${encodeURIComponent(path)}`,
        reason: 'Please sign in to view your submitted reports'
      };
    }
  }

  return { allowed: true };
}

export function formatRole(role?: string | null): string {
  if (role === 'admin') return 'Municipal Admin';
  return 'Citizen';
}
