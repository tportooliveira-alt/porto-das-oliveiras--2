import Link from 'next/link';

type Props = {
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md';
};

export default function BrandMark({ tone = 'dark', size = 'md' }: Props) {
  const color = tone === 'light' ? 'text-branco' : 'text-sepia';
  const dotColor = tone === 'light' ? 'bg-areia' : 'bg-oliva';
  const textSize = size === 'sm' ? 'text-[15px]' : 'text-[18px]';

  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${color}`} aria-label="Porto das Oliveiras">
      <span
        className={`${dotColor} h-2 w-2 rounded-full transition-transform duration-500 ease-out-soft group-hover:scale-125`}
        aria-hidden
      />
      <span className={`font-serif ${textSize} tracking-tightest font-medium leading-none`}>
        Porto das Oliveiras
      </span>
    </Link>
  );
}
