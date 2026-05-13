import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type CommonProps = {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

type AsLinkProps = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, 'href' | 'children'>;
type AsButtonProps = CommonProps & { href?: undefined } & ComponentProps<'button'>;

type Props = AsLinkProps | AsButtonProps;

const SIZES = {
  sm: 'px-5 py-3 text-[13px]',
  md: 'px-7 py-4 text-[14px]',
  lg: 'px-8 py-5 text-[15px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.06em] ' +
  'bg-terracota text-branco rounded-full ' +
  'shadow-[0_8px_24px_-8px_rgba(200,112,79,0.45)] ' +
  'transition-all duration-300 ease-out-soft ' +
  'hover:bg-terracota-escuro hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(200,112,79,0.55)] ' +
  'active:translate-y-0';

export default function CtaPrimary(props: Props) {
  const { children, size = 'md', ...rest } = props;
  const className = `${BASE} ${SIZES[size]}`;

  if ('href' in rest && rest.href) {
    const { href, ...linkRest } = rest as AsLinkProps;
    return (
      <Link href={href} className={className} {...linkRest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  );
}
