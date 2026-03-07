import { redirect } from 'next/navigation';

export default function LegacyClientProfileRedirectPage() {
  redirect('/client/profile');
}
