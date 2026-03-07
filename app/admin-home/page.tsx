import { redirect } from 'next/navigation';

export default function LegacyAdminHomeRedirectPage() {
  redirect('/admin/home');
}
