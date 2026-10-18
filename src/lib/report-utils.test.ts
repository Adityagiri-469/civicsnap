import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReferenceId,
  getStatusBadgeInfo,
  getCategoryInfo,
  filterReports
} from './report-utils.ts';
import type { CivicReport } from './types.ts';

test('formatReferenceId formats standard reference numbers with padding', () => {
  assert.equal(formatReferenceId(1), 'CS-2026-00001');
  assert.equal(formatReferenceId(42), 'CS-2026-00042');
  assert.equal(formatReferenceId(1025), 'CS-2026-01025');
  assert.equal(formatReferenceId(5, 2027), 'CS-2027-00005');
});

test('getStatusBadgeInfo returns correct labels for all statuses', () => {
  assert.equal(getStatusBadgeInfo('submitted').label, 'Submitted');
  assert.equal(getStatusBadgeInfo('under_review').label, 'Under Review');
  assert.equal(getStatusBadgeInfo('in_progress').label, 'In Progress');
  assert.equal(getStatusBadgeInfo('resolved').label, 'Resolved');
  assert.equal(getStatusBadgeInfo('rejected').label, 'Closed / Out of Scope');
});

test('getCategoryInfo maps categories to proper departments and colors', () => {
  assert.equal(getCategoryInfo('pothole').label, 'Pothole & Pavement');
  assert.equal(getCategoryInfo('pothole').department, 'Public Works / Streets');
  assert.equal(getCategoryInfo('water_leak').department, 'Water & Sewer Utility');
  assert.equal(getCategoryInfo('trash').department, 'Sanitation Dept');
});

test('filterReports filters by search query, category, and user ownership', () => {
  const mockReports: CivicReport[] = [
    {
      id: 'rep-1',
      reference_id: 'CS-2026-00001',
      user_id: 'user-alice',
      title: 'Deep pothole near Oak Street',
      description: 'Dangerous pothole damaging tires',
      category: 'pothole',
      status: 'submitted',
      priority: 'high',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '742 Evergreen Terrace',
      neighborhood: 'Downtown',
      upvotes: 4,
      created_at: '2026-10-15T10:00:00Z',
      updated_at: '2026-10-15T10:00:00Z'
    },
    {
      id: 'rep-2',
      reference_id: 'CS-2026-00002',
      user_id: 'user-bob',
      title: 'Water leak flooding sidewalk on 5th Ave',
      description: 'Main pipe burst causing water overflow',
      category: 'water_leak',
      status: 'resolved',
      priority: 'medium',
      latitude: 37.7750,
      longitude: -122.4180,
      address: '500 5th Avenue',
      neighborhood: 'North End',
      upvotes: 12,
      created_at: '2026-10-14T10:00:00Z',
      updated_at: '2026-10-15T12:00:00Z'
    }
  ];

  // Search by keyword
  const resultsByQuery = filterReports(mockReports, { query: 'pothole' });
  assert.equal(resultsByQuery.length, 1);
  assert.equal(resultsByQuery[0].id, 'rep-1');

  // Filter by category
  const resultsByCategory = filterReports(mockReports, { category: 'water_leak' });
  assert.equal(resultsByCategory.length, 1);
  assert.equal(resultsByCategory[0].id, 'rep-2');

  // Filter by user ownership (Alice only)
  const resultsAlice = filterReports(mockReports, { userId: 'user-alice', onlyMine: true });
  assert.equal(resultsAlice.length, 1);
  assert.equal(resultsAlice[0].id, 'rep-1');

  // Filter by user ownership (Bob only)
  const resultsBob = filterReports(mockReports, { userId: 'user-bob', onlyMine: true });
  assert.equal(resultsBob.length, 1);
  assert.equal(resultsBob[0].id, 'rep-2');

  // Filter non-existent user
  const resultsUnknown = filterReports(mockReports, { userId: 'user-charlie', onlyMine: true });
  assert.equal(resultsUnknown.length, 0);
});
