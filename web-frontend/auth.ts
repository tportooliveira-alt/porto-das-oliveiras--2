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
 *  - O token é guardado no objeto de sessão e usado por chamadas server-side.
 */

const DRUPAL_JWT_AUDIENCE = 'drupal';
const DRUPAL_JWT_ISSUER   = 'porto-frontend';
const DRUPAL_JWT_TTL_SEC  = 60 * 60; // 1h

async function mintDrupalJwt(profile: {
  email: string;
  name?: string | null;
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
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      // Apenas exigimos um email verificado (ambos provedores entregam isso).
      return Boolean(profile?.email);
    },

    async jwt({ token, account, profile }) {
      // Roda no sign-in inicial: gera o JWT para o Drupal e anexa ao token.
      if (account && profile?.email) {
        token.email = profile.email;
        token.name  = profile.name ?? null;
        token.drupalJwt = await mintDrupalJwt({
          email: profile.email,
          name:  profile.name ?? null,
          provider: account.provider,
        });
        token.drupalJwtExp = Math.floor(Date.now() / 1000) + DRUPAL_JWT_TTL_SEC;
      }

      // Renovação preguiçosa: se o JWT do Drupal está perto de expirar, refresca.
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
      // Não expomos o JWT do Drupal para o client; só dados úteis na UI.
      session.user = {
        ...session.user,
        email: (token.email as string) ?? session.user?.email ?? '',
        name:  (token.name as string | null) ?? session.user?.name ?? null,
      };
      return session;
    },
  },
});
