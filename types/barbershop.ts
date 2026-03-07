export type BarbershopStatus = 'active' | 'trial' | 'suspended' | 'disabled';
export type BarbershopPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type Barbershop = {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  address?: string | null;
  status: BarbershopStatus;
  plan: BarbershopPlan;
  plan_expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type BarbershopInput = Omit<Barbershop, 'id' | 'created_at' | 'updated_at'> & { id?: string };
