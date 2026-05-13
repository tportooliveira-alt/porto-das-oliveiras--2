import EmptyState from '@/components/shared/EmptyState';

export default function DocumentosPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="kicker mb-3 text-oliva">☉ Arquivos</p>
        <h1 className="font-serif text-display-md tracking-tighter2 text-sepia">
          Meus documentos
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-sepia-soft">
          Escrituras, contratos digitalizados, comprovantes de pagamento e demais documentos do seu cadastro.
        </p>
      </header>

      <EmptyState
        titulo="Em construção."
        descricao="O download de documentos será servido via stream privado do Drupal. Enquanto isso, fale com o financeiro para receber suas vias por e-mail."
        acaoLabel="Solicitar documentos"
        acaoHref="https://wa.me/5577999999999?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20meus%20documentos."
      />
    </div>
  );
}
