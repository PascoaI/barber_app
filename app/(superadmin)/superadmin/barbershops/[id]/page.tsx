import { redirect } from 'next/navigation';

export default function SuperAdminBarbershopPage({ params }: { params: { id: string } }) {
  redirect(`/superadmin/barbershops/${params.id}/edit`);
}
