import { redirect } from 'next/navigation';

export default function LegacyClientSubscriptionsRedirectPage() {
  redirect('/client/subscriptions');
}
