import { redirect } from 'next/navigation';

export default function LegacyAdminSettingsRedirectPage() {
  redirect('/admin/settings');
}
