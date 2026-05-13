import Link from 'next/link';

type Props = {
  titulo: string;
  descricao?: string;
  acaoLabel?: string;
  acaoHref?: string;
};

export default function EmptyState({ titulo, descricao, acaoLabel, acaoHref }: Props) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-card border border-dashed border-linha bg-areia-clara/40 p-10 text-center">
      {/* Ícone decorativo — círculo com pontinho */}
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-linha bg-branco">
        <span className="h-2 w-2 rounded-full bg-terracota" aria-hidden />
      </span>
      <h3 className="font-serif text-[22px] font-medium tracking-tightest text-sepia">{titulo}</h3>
      {descricao && (
        <p className="max-w-md text-[14px] leading-relaxed text-sepia-soft">{descricao}</p>
      )}
      {acaoLabel && acaoHref && (
        <Link
          href={acaoHref}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-sepia/20 px-5 py-2 text-[12px] font-medium uppercase tracking-[0.1em] text-sepia transition-colors hover:bg-sepia hover:text-branco"
        >
          {acaoLabel}
        </Link>
      )}
    </div>
  );
}
