export type BookingStatus = 'awaiting_payment' | 'pending' | 'confirmed' | 'in_progress' | 'canceled' | 'completed' | 'no_show';

export type Booking = {
  id: string;
  tenant_id: string;
  unit_id: string;
  barbershop_id?: string;
  client_id?: string;
  barber_id: string;
  service_id: string;
  start_datetime: string;
  end_datetime: string;
  status: BookingStatus;
  status_reason?: string | null;
  delay_minutes?: number | null;
  delay_reason?: string | null;
  transferred_from_barber_id?: string | null;
  transferred_to_barber_id?: string | null;
  rescheduled_from?: string | null;
  rescheduled_by?: 'barber' | 'admin' | 'client' | 'system' | null;
  created_at?: string;
  updated_at?: string;
};
