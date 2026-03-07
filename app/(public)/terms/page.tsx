export default function TermsPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 rounded-2xl border border-borderc bg-slate-950/35 p-6">
      <h1 className="text-2xl font-semibold">Termos de Uso</h1>
      <p className="text-sm text-text-secondary">
        Este sistema e disponibilizado para gestao de operacoes de barbearias em modelo SaaS multi-tenant.
      </p>
      <ul className="list-disc pl-5 text-sm text-text-secondary">
        <li>O acesso e pessoal e intransferivel.</li>
        <li>Uso indevido, fraude ou tentativa de invasao implicam suspensao imediata.</li>
        <li>Dados operacionais sao tratados conforme a Politica de Privacidade.</li>
        <li>Recursos podem ser limitados conforme plano contratado e status de pagamento.</li>
      </ul>
    </div>
  );
}
