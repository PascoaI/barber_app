import { redirect } from 'next/navigation';

export default function LegacyClientHistoryRedirectPage() {
  redirect('/client/history');
}
