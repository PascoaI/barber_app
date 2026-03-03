'use client';

import { NextAppointmentCard } from '@/components/client/NextAppointmentCard';

export default function ClientHomePage() {
  return (
    <div className="max-w-4xl mx-auto grid gap-4">
      <h1 className="text-2xl font-semibold">Painel do Cliente</h1>
      <NextAppointmentCard />
    </div>
  );
}
