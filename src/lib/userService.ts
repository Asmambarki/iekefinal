import { supabase } from './supabase';

export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

// Fetch the current user's profile from user_profiles table
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// Update last_login_at timestamp
export async function touchLastLogin(userId: string) {
  await supabase
    .from('user_profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

// List all employee profiles (admin only)
export async function listUserProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

// Create a new employee account (admin only — uses Supabase Admin API via RPC)
export async function createEmployeeAccount(params: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}): Promise<UserProfile> {
  // Use a Supabase RPC function that runs with service role server-side
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_email: params.email,
    p_password: params.password,
    p_full_name: params.full_name,
    p_role: params.role,
    p_phone: params.phone ?? null,
  });

  if (error) throw error;
  return data as UserProfile;
}

// Update a user profile (admin only)
export async function updateUserProfile(
  id: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'active' | 'phone'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Update own profile (any role — cannot change own role)
export async function updateOwnProfile(
  id: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Change own password via Supabase Auth
export async function changeOwnPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Log an activity
export async function logActivity(params: {
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}): Promise<void> {
  // Fire-and-forget — don't block UI on logging errors
  supabase.from('activity_logs').insert({
    ...params,
    created_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.warn('Activity log failed:', error.message);
  });
}

// Fetch activity logs (admin = all, employee = own only)
export async function getActivityLogs(userId?: string): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}
