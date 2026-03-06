export type BarbershopStatus = 'active' | 'disabled';

export type Barbershop = {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string;
  address?: string | null;
  status: BarbershopStatus;
  plan?: string | null;
  plan_expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type BarbershopInput = Omit<Barbershop, 'id' | 'created_at' | 'updated_at'> & { id?: string };
