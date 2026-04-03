export type UserRole = 'client' | 'barber' | 'admin' | 'super_admin';

export type User = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: UserRole;
  tenant_id?: string | null;
  barbershop_id?: string | null;
  unit_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
