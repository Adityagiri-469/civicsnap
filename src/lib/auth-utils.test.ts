import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  hasAdminAccess,
  canAccessRoute,
  formatRole
} from './auth-utils.ts';

test('validateEmail handles valid and invalid emails', () => {
  assert.equal(validateEmail('test@example.com').valid, true);
  assert.equal(validateEmail('user.name+tag@domain.co.uk').valid, true);
  assert.equal(validateEmail('invalid-email').valid, false);
  assert.equal(validateEmail('').valid, false);
  assert.equal(validateEmail('   ').valid, false);
});

test('validatePassword validates minimum length and complexity score', () => {
  const empty = validatePassword('');
  assert.equal(empty.valid, false);
  assert.equal(empty.score, 0);

  const short = validatePassword('Short1!');
  assert.equal(short.valid, false);
  assert.match(short.error || '', /8 characters/i);

  const validComplex = validatePassword('CivicSnap2026!');
  assert.equal(validComplex.valid, true);
  assert.equal(validComplex.score >= 3, true);
  assert.equal(validComplex.rules.minLength, true);
  assert.equal(validComplex.rules.hasNumber, true);
});

test('hasAdminAccess correctly evaluates roles', () => {
  assert.equal(hasAdminAccess('admin'), true);
  assert.equal(hasAdminAccess('citizen'), false);
  assert.equal(hasAdminAccess(null), false);
  assert.equal(hasAdminAccess(undefined), false);
  assert.equal(hasAdminAccess('superadmin'), false); // strictly admin
});

test('canAccessRoute blocks unauthorized users and citizens from /admin', () => {
  // Unauthenticated user attempting to view /admin
  const unauthAdmin = canAccessRoute(null, '/admin');
  assert.equal(unauthAdmin.allowed, false);
  assert.match(unauthAdmin.redirectTo || '', /\/login/);

  // Citizen attempting to view /admin
  const citizenAdmin = canAccessRoute('citizen', '/admin');
  assert.equal(citizenAdmin.allowed, false);
  assert.equal(citizenAdmin.redirectTo, '/');

  // Citizen attempting to view /admin/CS-2026-00001
  const citizenAdminDetail = canAccessRoute('citizen', '/admin/CS-2026-00001');
  assert.equal(citizenAdminDetail.allowed, false);
  assert.equal(citizenAdminDetail.redirectTo, '/');

  // Admin accessing /admin and /admin/CS-2026-00001
  const adminAdmin = canAccessRoute('admin', '/admin');
  assert.equal(adminAdmin.allowed, true);

  const adminAdminDetail = canAccessRoute('admin', '/admin/CS-2026-00001');
  assert.equal(adminAdminDetail.allowed, true);

  // Citizen accessing /my-reports
  const citizenMyReports = canAccessRoute('citizen', '/my-reports');
  assert.equal(citizenMyReports.allowed, true);

  // Unauth accessing /my-reports
  const unauthMyReports = canAccessRoute(null, '/my-reports');
  assert.equal(unauthMyReports.allowed, false);
  assert.match(unauthMyReports.redirectTo || '', /\/login/);

  // Public route /explore accessible by all
  assert.equal(canAccessRoute(null, '/explore').allowed, true);
  assert.equal(canAccessRoute('citizen', '/explore').allowed, true);
});

test('formatRole returns readable user friendly labels', () => {
  assert.equal(formatRole('admin'), 'Municipal Admin');
  assert.equal(formatRole('citizen'), 'Citizen');
  assert.equal(formatRole(), 'Citizen');
});
