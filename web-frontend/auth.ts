import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { SignJWT } from 'jose';

/**
 * Configuração central do NextAuth v5.
 *
 * Estratégia:
 *  - Login social Google + Microsoft (aceita Hotmail/Outlook via tenant "common").
 *  - Após o sign-in, geramos um JWT HS256 assinado com segredo compartilhado
 *    com o Drupal. O Drupal valida esse JWT na chamada JSON:API e
 *    auto-provisiona o usuário (módulo custom porto_auth) caso ainda não exista.
 *  - O JWT do Drupal fica no token interno do NextAuth (cookie criptografado),
 *    NÃO é exposto no objeto session retornado ao client.
 */

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
    email: profile.email,
    name:  profile.name ?? profile.email,
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

/**
 * Microsoft Entra ID devolve o email em `email` (contas pessoais) ou
 * `preferred_username` (contas corporativas). Normalizamos aqui.
 */
function extrairEmail(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  const candidato = (typeof p.email === 'string' && p.email)
    || (typeof p.preferred_username === 'string' && p.preferred_username)
    || null;
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
      // "common" aceita contas pessoais (Hotmail/Outlook) E corporativas.
      // Em produção, use o tenant ID específico se quiser restringir.
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT ?? 'common'}/v2.0`,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      return extrairEmail(profile) !== null;
    },

    async jwt({ token, account, profile }) {
      // Sign-in inicial: anexa email/nome ao token e gera JWT para o Drupal.
      if (account && profile) {
        const email = extrairEmail(profile);
        if (email) {
          token.email = email;
          token.name  = extrairNome(profile);
          token.drupalJwt = await mintDrupalJwt({
            email,
            name: token.name ?? null,
            provider: account.provider,
          });
          token.drupalJwtExp = Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC;
        }
      }

      // Renovação preguiçosa quando faltam < 60s para expirar.
      const agora = Math.floor(Date.now() / 1000);
      const exp = typeof token.drupalJwtExp === 'number' ? token.drupalJwtExp : 0;
      if (token.email && exp - agora < 60) {
        token.drupalJwt = await mintDrupalJwt({
          email: token.email as string,
          name:  (token.name as string | null) ?? null,
          provider: 'refresh',
        });
        token.drupalJwtExp = Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC;
      }

      return token;
    },

    async session({ session, token }) {
      // Apenas dados de UI. O drupalJwt fica no token (cookie), não aqui.
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email ?? '';
        session.user.name  = (token.name as string | null) ?? session.user.name ?? null;
      }
      return session;
    },
  },
});
