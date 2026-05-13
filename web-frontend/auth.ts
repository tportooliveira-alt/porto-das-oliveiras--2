import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { SignJWT } from 'jose';

const DRUPAL_JWT_AUDIENCE = 'drupal';
const DRUPAL_JWT_ISSUER   = 'porto-frontend';
const DRUPAL_JWT_TTL_SEC  = 60 * 60; // 1h

async function mintDrupalJwt(profile: {
  email: string;
  name: string | null;
  provider: string;
}): Promise<string> {
  const secret = process.env.DRUPAL_JWT_SECRET;
  if (!secret) throw new Error('DRUPAL_JWT_SECRET não configurado');

  const chave = new TextEncoder().encode(secret);
  return await new SignJWT({
    email:    profile.email,
    name:     profile.name ?? profile.email,
    provider: profile.provider,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(DRUPAL_JWT_ISSUER)
    .setAudience(DRUPAL_JWT_AUDIENCE)
    .setSubject(profile.email)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC)
    .sign(chave);
}

/** Busca as roles Drupal do usuário logo após o mint do JWT. */
async function buscarRolesDrupal(jwt: string): Promise<string[]> {
  const base = process.env.DRUPAL_BASE_URL ?? 'http://porto-das-oliveiras.ddev.site';
  try {
    const resp = await fetch(`${base}/api/minhas-roles`, {
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { roles?: string[] };
    return Array.isArray(data.roles) ? data.roles : [];
  } catch {
    return []; // Falha silenciosa — não bloqueia o login
  }
}

function extrairEmail(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  const candidato =
    (typeof p.email === 'string' && p.email) ||
    (typeof p.preferred_username === 'string' && p.preferred_username) ||
    null;
  return candidato && candidato.includes('@') ? candidato : null;
}

function extrairNome(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  if (typeof p.name === 'string' && p.name) return p.name;
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    MicrosoftEntraID({
      clientId:     process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT ?? 'common'}/v2.0`,
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      return extrairEmail(profile) !== null;
    },

    async jwt({ token, account, profile }) {
      // ── Sign-in inicial ─────────────────────────────────────────────
      if (account && profile) {
        const email = extrairEmail(profile);
        if (email) {
          token.email = email;
          token.name  = extrairNome(profile);

          const novoDrupalJwt = await mintDrupalJwt({
            email,
            name:     token.name ?? null,
            provider: account.provider,
          });
          token.drupalJwt    = novoDrupalJwt;
          token.drupalJwtExp = Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC;

          // Busca roles Drupal em background — não bloqueia login se falhar.
          token.drupalRoles  = await buscarRolesDrupal(novoDrupalJwt);
        }
      }

      // ── Renovação preguiçosa (< 60s para expirar) ──────────────────
      const agora = Math.floor(Date.now() / 1000);
      const exp   = typeof token.drupalJwtExp === 'number' ? token.drupalJwtExp : 0;
      if (token.email && exp - agora < 60) {
        const renovado = await mintDrupalJwt({
          email:    token.email as string,
          name:     (token.name as string | null) ?? null,
          provider: 'refresh',
        });
        token.drupalJwt    = renovado;
        token.drupalJwtExp = Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC;
        // Atualiza roles na renovação também.
        token.drupalRoles  = await buscarRolesDrupal(renovado);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email       = (token.email as string)       ?? session.user.email ?? '';
        session.user.name        = (token.name as string | null) ?? session.user.name  ?? null;
        session.user.drupalRoles = (token.drupalRoles as string[]) ?? [];
      }
      return session;
    },
  },
});
