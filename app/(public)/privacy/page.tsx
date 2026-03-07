import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 rounded-2xl border border-borderc bg-slate-950/35 p-6">
      <h1 className="text-2xl font-semibold">Politica de Privacidade</h1>
      <p className="text-sm text-text-secondary">
        Coletamos apenas dados necessarios para autenticacao, agendamento, cobranca e operacao da plataforma.
      </p>
      <ul className="list-disc pl-5 text-sm text-text-secondary">
        <li>Consentimento e registrado no momento do cadastro.</li>
        <li>Logs administrativos e eventos criticos sao auditados para seguranca operacional.</li>
        <li>Solicitacoes de exclusao ou anonimização podem ser feitas pelo titular.</li>
      </ul>
      <p className="text-sm text-text-secondary">
        Consulte tambem nossa{' '}
        <Link href="/privacy/data-retention" className="underline">
          politica de retencao de dados
        </Link>.
      </p>
    </div>
  );
}
