'use client';

type Props = {
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
};

export default function PlayButton({ size = 96, onClick, ariaLabel = 'Reproduzir vídeo' }: Props) {
  const inner = size * 0.34;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="group relative flex items-center justify-center rounded-full bg-branco/15 backdrop-blur-sm transition-all duration-500 ease-out-soft hover:bg-branco/25 hover:scale-[1.04] focus-visible:scale-[1.04]"
      style={{ width: size, height: size }}
    >
      {/* Anel decorativo */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-branco/40 transition-transform duration-700 ease-out-soft group-hover:scale-110"
      />
      {/* Triângulo */}
      <svg
        viewBox="0 0 24 24"
        width={inner}
        height={inner}
        fill="currentColor"
        className="text-branco translate-x-[1px]"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
