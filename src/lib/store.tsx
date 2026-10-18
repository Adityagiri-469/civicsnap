import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { CivicReport, ReportCategory, ReportPriority, ReportStatus, UserProfile } from './types';
import { DEMO_ADMIN_USER, DEMO_CITIZEN_USER, INITIAL_REPORTS } from './data';
import { formatReferenceId } from './report-utils';

interface CivicContextType {
  // Auth
  user: UserProfile | null;
  isLoading: boolean;
  isSupabaseLive: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: 'citizen' | 'admin' }>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Reports
  reports: CivicReport[];
  isLoadingReports: boolean;
  addReport: (reportData: {
    title: string;
    description: string;
    category: ReportCategory;
    priority?: ReportPriority;
    latitude: number;
    longitude: number;
    address: string;
    neighborhood: string;
    image_url?: string;
  }) => Promise<{ success: boolean; report?: CivicReport; error?: string }>;
  updateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    adminNotes?: string,
    assignedDepartment?: string
  ) => Promise<{ success: boolean; error?: string }>;
  upvoteReport: (reportId: string) => Promise<void>;
  getReportByReferenceId: (refId: string) => CivicReport | undefined;
  getReportById: (id: string) => CivicReport | undefined;
}

const CivicContext = createContext<CivicContextType | undefined>(undefined);

const LOCAL_STORAGE_REPORTS_KEY = 'civicsnap_reports_v4';
const LOCAL_STORAGE_DEMO_USERS_KEY = 'civicsnap_registered_users';
const LOCAL_STORAGE_ACTIVE_USER_KEY = 'civicsnap_active_session';

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseLive = useMemo(() => isSupabaseConfigured(), []);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Initialize reports from local storage or seed data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (saved) {
        const parsed: CivicReport[] = JSON.parse(saved);
        const removedReferenceIds = new Set(['CS-2026-00002', 'CS-2026-00004', 'CS-2026-00005']);
        const removedIds = new Set([
          'c9a64694-8149-4171-a083-7c30985c5454',
          '6b29fc40-6247-11ed-b5ea-0242ac120002',
          '7c39fc50-6247-11ed-b5ea-0242ac120003'
        ]);
        // Normalize any old cached categories to the 4 valid ones
        const validCategories: ReportCategory[] = ['pothole', 'trash', 'water_leak', 'other'];
        const sanitized = parsed
          .filter(r => !removedReferenceIds.has(r.reference_id) && !removedIds.has(r.id))
          .map(r => ({
            ...r,
            category: validCategories.includes(r.category) ? r.category : 'other'
          }));
        setReports(sanitized);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(sanitized));
      } else {
        setReports(INITIAL_REPORTS);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
      }
    } catch {
      setReports(INITIAL_REPORTS);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  // Fetch Supabase profile for authenticated user using actual UUID
  const fetchSupabaseProfile = useCallback(async (userId: string, userEmail: string): Promise<UserProfile> => {
    const TARGET_ADMIN_UUID = '14d35499-b225-4f48-94aa-a8f1436b9fa4';
    const isTargetAdmin = userId === TARGET_ADMIN_UUID;

    // Use .select() without .single() to avoid PostgREST HTTP 406 (PGRST116) coercion crash on 0 rows
    const { data: rows, error, status } = await supabase
      .from('profiles')
      .select('id, name, phone, role, created_at, updated_at')
      .eq('id', userId);

    if (error) {
      console.error('[CivicSnap Auth] Supabase PostgREST error during profile query:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status,
        queriedId: userId
      });
      throw new Error(
        `Profile fetch query error: ${error.message} [Code: ${error.code || 'UNKNOWN'}, Details: ${error.details || 'None'}, Hint: ${error.hint || 'None'}]`
      );
    }

    if (!rows || rows.length === 0) {
      console.warn('[CivicSnap Auth] 0 rows returned from public.profiles for UUID:', userId, {
        queriedId: userId,
        userEmail,
        targetAdminUUID: TARGET_ADMIN_UUID,
        isTargetAdmin
      });

      // If this authenticated user is the verified target admin, preserve their admin access seamlessly
      if (isTargetAdmin) {
        return {
          id: TARGET_ADMIN_UUID,
          name: userEmail ? userEmail.split('@')[0] : 'Administrator',
          phone: '',
          role: 'admin',
          email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // Default fallback for authenticated citizens
      return {
        id: userId,
        name: userEmail ? userEmail.split('@')[0] : 'Citizen',
        phone: '',
        role: 'citizen',
        email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const data = rows[0];

    return {
      id: data.id,
      name: data.name || (userEmail ? userEmail.split('@')[0] : 'Citizen'),
      phone: data.phone || '',
      role: (data.role === 'admin' || isTargetAdmin) ? 'admin' : 'citizen',
      email: userEmail,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }, []);

  // Initialize and persist session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);

      if (isSupabaseLive) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            try {
              const profile = await fetchSupabaseProfile(session.user.id, session.user.email || '');
              if (mounted) setUser(profile);
            } catch (profileErr) {
              console.error('[CivicSnap Auth] Failed to load profile for existing session:', profileErr);
              if (mounted) setUser(null);
            }
          } else if (mounted) {
            setUser(null);
          }
        } catch (err) {
          console.error('[CivicSnap Auth] Error initializing Supabase session:', err);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setIsLoading(false);
        }

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (event === 'SIGNED_OUT' || !session?.user) {
            setUser(null);
            setIsLoading(false);
            return;
          }

          if (session?.user) {
            setIsLoading(true);
            try {
              const profile = await fetchSupabaseProfile(session.user.id, session.user.email || '');
              if (mounted) setUser(profile);
            } catch (err) {
              console.error('[CivicSnap Auth] Error in onAuthStateChange profile fetch:', err);
            } finally {
              if (mounted) setIsLoading(false);
            }
          }
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      } else {
        // Fallback demo storage mode
        try {
          const savedActiveUser = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
          if (savedActiveUser && mounted) {
            setUser(JSON.parse(savedActiveUser));
          }
        } catch (e) {
          console.error('Error parsing stored demo session:', e);
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [isSupabaseLive, fetchSupabaseProfile]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: 'citizen' | 'admin' }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseLive) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });

        if (error) {
          console.error('[CivicSnap Auth] Supabase signInWithPassword error:', error);
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: 'Login succeeded but user data was missing from Supabase response.' };
        }

        // Fetch user profile from public.profiles using authenticated user's actual UUID
        try {
          const profile = await fetchSupabaseProfile(data.user.id, data.user.email || trimmedEmail);
          setUser(profile);
          return { success: true, role: profile.role };
        } catch (profileErr) {
          const errorMsg = profileErr instanceof Error ? profileErr.message : 'Failed to fetch user profile';
          console.error('[CivicSnap Auth] Profile fetch failed after login for UUID:', data.user.id, profileErr);
          return {
            success: false,
            error: `Login succeeded, but profile retrieval failed: ${errorMsg}`
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        console.error('[CivicSnap Auth] Unexpected login error:', err);
        return { success: false, error: msg };
      }
    }

    // 1. Check Admin Accounts (Default admin or Aditya Giri)
    if (trimmedEmail === DEMO_ADMIN_USER.email || trimmedEmail === 'adityagiri162667@gmail.com') {
      if (password === 'Admin123!' || password.length >= 6) {
        const adminProfile: UserProfile = {
          ...DEMO_ADMIN_USER,
          name: trimmedEmail === 'adityagiri162667@gmail.com' ? 'Aditya Giri (Admin)' : DEMO_ADMIN_USER.name,
          email: trimmedEmail
        };
        setUser(adminProfile);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(adminProfile));
        return { success: true, role: 'admin' };
      }
      return { success: false, error: 'Incorrect password. (Password must be at least 6 characters)' };
    }

    // 2. Check Demo Citizen
    if (trimmedEmail === DEMO_CITIZEN_USER.email) {
      if (password === 'Citizen123!') {
        setUser(DEMO_CITIZEN_USER);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(DEMO_CITIZEN_USER));
        return { success: true, role: 'citizen' };
      }
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // 3. Check dynamically registered demo users
    try {
      const storedUsersRaw = localStorage.getItem(LOCAL_STORAGE_DEMO_USERS_KEY);
      const storedUsers: Array<{ profile: UserProfile; passwordHash: string }> = storedUsersRaw
        ? JSON.parse(storedUsersRaw)
        : [];
      
      const found = storedUsers.find(u => u.profile.email.toLowerCase() === trimmedEmail);
      if (found) {
        if (found.passwordHash === password) {
          setUser(found.profile);
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(found.profile));
          return { success: true, role: found.profile.role };
        }
        return { success: false, error: 'Incorrect password for this account.' };
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      error: 'Account not found. Please verify your email address or create a new account.'
    };
  };

  // Sign Up handler
  const signUp = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (isSupabaseLive) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: cleanName,
              phone: phone?.trim() || '',
              role: 'citizen' // RLS / Trigger enforces citizen
            }
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // If email confirmation is enabled on Supabase project
        if (data.user && !data.session) {
          return {
            success: true,
            requiresEmailConfirmation: true
          };
        }

        if (data.user) {
          const profile = await fetchSupabaseProfile(data.user.id, data.user.email || trimmedEmail);
          setUser(profile);
          return { success: true };
        }

        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign up failed';
        return { success: false, error: msg };
      }
    }

    // Demo Mode Sign Up
    // Check if email already used
    if (trimmedEmail === DEMO_ADMIN_USER.email || trimmedEmail === DEMO_CITIZEN_USER.email) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    try {
      const storedUsersRaw = localStorage.getItem(LOCAL_STORAGE_DEMO_USERS_KEY);
      const storedUsers: Array<{ profile: UserProfile; passwordHash: string }> = storedUsersRaw
        ? JSON.parse(storedUsersRaw)
        : [];

      if (storedUsers.some(u => u.profile.email.toLowerCase() === trimmedEmail)) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      // Determine role: Aditya Giri and emails containing 'admin' receive municipal admin role
      const isAdminAccount =
        trimmedEmail === 'adityagiri162667@gmail.com' ||
        trimmedEmail.includes('admin');

      const newProfile: UserProfile = {
        id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
        name: cleanName,
        email: trimmedEmail,
        phone: phone?.trim() || '',
        role: isAdminAccount ? 'admin' : 'citizen',
        created_at: new Date().toISOString()
      };

      storedUsers.push({ profile: newProfile, passwordHash: password });
      localStorage.setItem(LOCAL_STORAGE_DEMO_USERS_KEY, JSON.stringify(storedUsers));

      // Auto login in demo mode
      setUser(newProfile);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, JSON.stringify(newProfile));

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to save account in browser storage.' };
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    if (isSupabaseLive) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase sign out error:', err);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
  };

  // Forgot Password handler
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseLive) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/login`
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Password reset failed';
        return { success: false, error: msg };
      }
    }

    // Demo Mode: simulate instant success
    return { success: true };
  };

  // Add Report handler
  const addReport = async (reportData: {
    title: string;
    description: string;
    category: ReportCategory;
    priority?: ReportPriority;
    latitude: number;
    longitude: number;
    address: string;
    neighborhood: string;
    image_url?: string;
  }): Promise<{ success: boolean; report?: CivicReport; error?: string }> => {
    try {
      // Generate reference ID: count existing + 1
      const nextSequence = reports.length + 1;
      const refId = formatReferenceId(nextSequence);

      const newReport: CivicReport = {
        id: crypto.randomUUID ? crypto.randomUUID() : `rep-${Date.now()}`,
        reference_id: refId,
        user_id: user ? user.id : null,
        title: reportData.title.trim(),
        description: reportData.description.trim(),
        category: reportData.category,
        status: 'submitted',
        priority: reportData.priority || 'medium',
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address.trim(),
        neighborhood: reportData.neighborhood.trim() || 'Central District',
        image_url: reportData.image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        assigned_department: 'Municipal Intake',
        admin_notes: 'Automated intake verification pending.',
        upvotes: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitter_name: user ? user.name : 'Anonymous Citizen'
      };

      if (isSupabaseLive) {
        try {
          const { data, error } = await supabase
            .from('reports')
            .insert({
              reference_id: newReport.reference_id,
              user_id: newReport.user_id,
              title: newReport.title,
              description: newReport.description,
              category: newReport.category,
              status: newReport.status,
              priority: newReport.priority,
              latitude: newReport.latitude,
              longitude: newReport.longitude,
              address: newReport.address,
              neighborhood: newReport.neighborhood,
              image_url: newReport.image_url,
              assigned_department: newReport.assigned_department,
              admin_notes: newReport.admin_notes,
              upvotes: 1
            })
            .select()
            .single();

          if (!error && data) {
            newReport.id = data.id;
          }
        } catch (supabaseErr) {
          console.warn('Supabase insert failed, continuing with local store:', supabaseErr);
        }
      }

      const updatedList = [newReport, ...reports];
      setReports(updatedList);
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedList));

      return { success: true, report: newReport };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      return { success: false, error: msg };
    }
  };

  // Update Report Status (Admin Only!)
  const updateReportStatus = async (
    reportId: string,
    newStatus: ReportStatus,
    adminNotes?: string,
    assignedDepartment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Crucial role check!
    if (!user || user.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only municipal administrators are authorized to update report status and assignments.'
      };
    }

    if (isSupabaseLive) {
      try {
        const updatePayload: Record<string, unknown> = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes;
        if (assignedDepartment !== undefined) updatePayload.assigned_department = assignedDepartment;

        const { error } = await supabase
          .from('reports')
          .update(updatePayload)
          .eq('id', reportId);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update report in database';
        return { success: false, error: msg };
      }
    }

    const updated = reports.map(r => {
      if (r.id === reportId || r.reference_id === reportId) {
        return {
          ...r,
          status: newStatus,
          admin_notes: adminNotes !== undefined ? adminNotes : r.admin_notes,
          assigned_department: assignedDepartment !== undefined ? assignedDepartment : r.assigned_department,
          updated_at: new Date().toISOString()
        };
      }
      return r;
    });

    setReports(updated);
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));

    return { success: true };
  };

  // Upvote Report
  const upvoteReport = async (reportId: string): Promise<void> => {
    const updated = reports.map(r => {
      if (r.id === reportId || r.reference_id === reportId) {
        return { ...r, upvotes: r.upvotes + 1 };
      }
      return r;
    });
    setReports(updated);
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updated));
  };

  const getReportByReferenceId = useCallback((refId: string) => {
    return reports.find(r => r.reference_id.toUpperCase() === refId.toUpperCase() || r.id === refId);
  }, [reports]);

  const getReportById = useCallback((id: string) => {
    return reports.find(r => r.id === id || r.reference_id.toUpperCase() === id.toUpperCase());
  }, [reports]);

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isSupabaseLive,
    login,
    signUp,
    logout,
    resetPassword,
    reports,
    isLoadingReports,
    addReport,
    updateReportStatus,
    upvoteReport,
    getReportByReferenceId,
    getReportById
  }), [
    user,
    isLoading,
    isSupabaseLive,
    login,
    signUp,
    logout,
    resetPassword,
    reports,
    isLoadingReports,
    addReport,
    updateReportStatus,
    upvoteReport,
    getReportByReferenceId,
    getReportById
  ]);

  return (
    <CivicContext.Provider value={contextValue}>
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = (): CivicContextType => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};
