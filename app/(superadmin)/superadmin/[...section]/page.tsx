import { notFound, redirect } from 'next/navigation';
import LegacyRoutePage from '@/app/_components/LegacyRoutePage';

export default function SuperAdminDomainPage({ params }: { params: { section: string[] } }) {
  const parts = params.section || [];
  const [first, second, third] = parts;

  if (first === 'login' && parts.length === 1) return <LegacyRoutePage slug="super-admin-login" />;
  if (first === 'dashboard' && parts.length === 1) return <LegacyRoutePage slug="super-admin-tenants" />;
  if (first === 'barbershops' && parts.length === 1) return <LegacyRoutePage slug="super-admin-tenants" />;
  if (first === 'barbershops' && second === 'new') return <LegacyRoutePage slug="super-admin-barbershop-form" />;
  if (first === 'barbershops' && second && !third) {
    redirect(`/superadmin/barbershops/${second}/edit`);
  }
  if (first === 'barbershops' && second && third === 'edit') {
    return <LegacyRoutePage slug="super-admin-barbershop-form" />;
  }

  return notFound();
}
