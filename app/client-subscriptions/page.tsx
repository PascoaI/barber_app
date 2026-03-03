'use client';

import { SubscriptionProgress } from '@/components/client/SubscriptionProgress';

export default function ClientSubscriptionsPage() {
  return (
    <div className="max-w-4xl mx-auto grid gap-4">
      <h1 className="text-2xl font-semibold">Assinatura</h1>
      <SubscriptionProgress />
    </div>
  );
}
