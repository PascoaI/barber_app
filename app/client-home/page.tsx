import { redirect } from 'next/navigation';

export default function LegacyClientHomeRedirectPage() {
  redirect('/client/home');
}
