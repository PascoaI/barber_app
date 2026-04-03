export type TenantStatus = 'active' | 'inactive';

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
  updated_at?: string;
};

export type TenantSettings = {
  tenant_id: string;
  barbershop_name: string;
  logo_url?: string | null;
  branding_primary: string;
  branding_secondary: string;
  business_hours: Record<string, { enabled: boolean; open: string; close: string }>;
  created_at?: string;
  updated_at?: string;
};

export type TenantOnboardingRequestStatus = 'pending' | 'approved' | 'rejected';

export type TenantOnboardingRequest = {
  id: string;
  barbershop_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  barbers_count?: number | null;
  notes?: string | null;
  requested_slug?: string | null;
  status: TenantOnboardingRequestStatus;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  tenant_id?: string | null;
  created_admin_user_id?: string | null;
  created_at: string;
  updated_at?: string;
};
