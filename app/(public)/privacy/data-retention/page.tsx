export default function DataRetentionPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 rounded-2xl border border-borderc bg-slate-950/35 p-6">
      <h1 className="text-2xl font-semibold">Politica de Retencao de Dados</h1>
      <ul className="list-disc pl-5 text-sm text-text-secondary">
        <li>Eventos de agendamento e cobranca: 5 anos para fins legais e auditoria.</li>
        <li>Dados de autenticacao e seguranca: ate 12 meses apos ultima atividade.</li>
        <li>Dados pessoais sob solicitacao LGPD podem ser anonimizados ou excluidos conforme base legal.</li>
      </ul>
    </div>
  );
}
