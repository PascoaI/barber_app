export type BookingStatus = 'awaiting_payment' | 'pending' | 'confirmed' | 'canceled' | 'completed' | 'no_show';

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
  created_at?: string;
  updated_at?: string;
};
