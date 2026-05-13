import { NextResponse } from 'next/server';

/**
 * Expõe a versão buildada do app.
 *
 * Vercel injeta automaticamente VERCEL_GIT_COMMIT_SHA. Em local/dev
 * cai no env NEXT_PUBLIC_GIT_SHA (opcional) ou 'dev'.
 */
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    name: 'porto-das-oliveiras-frontend',
    version: process.env.npm_package_version ?? '0.1.0',
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.NEXT_PUBLIC_GIT_SHA ??
      'dev',
    env: process.env.NODE_ENV,
    deployedAt:
      process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE ??
      new Date(0).toISOString(),
  });
}
