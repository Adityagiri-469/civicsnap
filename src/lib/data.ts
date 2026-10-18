import type { CivicReport, UserProfile } from './types';

export const DEMO_CITIZEN_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Jane Citizen',
  email: 'citizen@civicsnap.org',
  phone: '+1 (555) 234-5678',
  role: 'citizen',
  created_at: '2026-01-10T08:00:00Z'
};

export const DEMO_ADMIN_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Officer Marcus Davis',
  email: 'admin@civicsnap.org',
  phone: '+1 (555) 876-5432',
  role: 'admin',
  created_at: '2025-11-01T09:30:00Z'
};

export const INITIAL_REPORTS: CivicReport[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    reference_id: 'CS-2026-00001',
    user_id: '00000000-0000-0000-0000-000000000001', // Jane Citizen's report
    title: 'Severe crater pothole damaging vehicle rims',
    description: 'A deep 14-inch diameter pothole has formed in the right lane of Market St directly in front of the public transit stop. Multiple cyclists and cars have suffered flat tires.',
    category: 'pothole',
    status: 'in_progress',
    priority: 'high',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '1150 Market St',
    neighborhood: 'Civic Center',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    assigned_department: 'Public Works / Streets',
    admin_notes: 'Asphalt crew dispatched under work order #PW-9821. Expected patching completion by Friday.',
    upvotes: 38,
    created_at: '2026-10-12T09:15:00Z',
    updated_at: '2026-10-14T14:20:00Z',
    submitter_name: 'Jane Citizen'
  },
  {
    id: 'e285a867-0c7f-4318-8f5b-9a40552735f1',
    reference_id: 'CS-2026-00003',
    user_id: '00000000-0000-0000-0000-000000000099', // Another citizen
    title: 'Bulk furniture and construction debris dumped in alleyway',
    description: 'Discarded mattresses, drywalls, and broken wooden pallets blocking access to residential garages and trash collection bins.',
    category: 'trash',
    status: 'submitted',
    priority: 'medium',
    latitude: 37.7600,
    longitude: -122.4200,
    address: '88 Clarion Alley',
    neighborhood: 'Mission District',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    assigned_department: 'Sanitation Dept',
    admin_notes: 'Queue ticket generated for heavy debris collection unit.',
    upvotes: 24,
    created_at: '2026-10-15T11:05:00Z',
    updated_at: '2026-10-15T11:05:00Z',
    submitter_name: 'Carlos Mendez'
  },
  {
    id: '8d49fc60-6247-11ed-b5ea-0242ac120004',
    reference_id: 'CS-2026-00006',
    user_id: '00000000-0000-0000-0000-000000000001', // Jane Citizen's report
    title: 'Overflowing commercial waste container on sidewalk',
    description: 'Uncovered commercial dumpsters spilling refuse onto public walking path.',
    category: 'trash',
    status: 'submitted',
    priority: 'low',
    latitude: 37.7780,
    longitude: -122.4150,
    address: '100 Larkin Street',
    neighborhood: 'Civic Center',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    assigned_department: 'Sanitation Dept',
    admin_notes: 'Sanitation inspection scheduled.',
    upvotes: 9,
    created_at: '2026-10-16T08:30:00Z',
    updated_at: '2026-10-16T08:30:00Z',
    submitter_name: 'Jane Citizen'
  }
];
