# Arquitetura

Documento vivo da arquitetura do Porto das Oliveiras. Atualize quando
mudar um contrato entre camadas, não quando mudar implementação interna.

## Visão geral

```
                    ┌────────────────────────────────┐
                    │           Visitante            │
                    │   (público) ou (autenticado)   │
                    └──────────────┬─────────────────┘
                                   │  HTTPS
                                   ▼
        ┌─────────────────────────────────────────────────┐
        │  web-frontend/  Next.js 14 (App Router) — SSR   │
        │                                                  │
        │  • Server Components fazem fetch direto no       │
        │    Drupal (server-side, sem expor JWT).          │
        │  • Client Components só p/ interatividade        │
        │    (filtros, animações, vídeo player).           │
        │  • NextAuth.js v5 com providers Google +         │
        │    Microsoft Entra ID. JWT do Drupal vive        │
        │    dentro do cookie da sessão NextAuth.          │
        │  • Gemini consumido em Route Handlers.           │
        └────┬───────────────────┬───────────────────┬─────┘
             │                   │                   │
             │ /jsonapi/* (HS256│                   │ Gemini SDK
             │  Bearer quando    │                   │ (server)
             │  autenticado)     │                   │
             ▼                   ▼                   ▼
   ┌────────────────────┐   ┌──────────┐    ┌───────────────────┐
   │  web-backend/      │   │  OAuth   │    │ Google AI Studio  │
   │  Drupal 11 (DDEV)  │   │  (Google,│    │ generativeai      │
   │                    │   │  MS)     │    │                   │
   │  • JSON:API        │   └──────────┘    └───────────────────┘
   │  • porto_auth      │
   │    (JWT bridge)    │
   │  • porto_banking   │
   │    (boletos)       │
   │  • Views REST com  │
   │    Contextual      │
   │    Filter [uid]    │
   └────────┬───────────┘
            │
            │ HTTP (server-to-server)
            ▼
   ┌────────────────────┐
   │ API bancária       │
   │ (OAuth2 +          │
   │  client_credentials│
   │  token cacheado    │
   │  em State)         │
   └────────────────────┘
```

## Pacotes principais

| Pacote | Propósito | Onde vive |
|---|---|---|
| `web-frontend/` | Site público + área autenticada do cliente | Vercel (futuro) |
| `web-backend/` | Drupal headless: modelagem, JSON:API, JWT bridge, sincronia bancária | DDEV local; Pantheon/VPS (futuro) |
| `tests/` | Validações estáticas em Node — rodam em CI sem Docker | GitHub Actions |

## Fluxo de autenticação

1. Visitante clica em **Entrar com Google/Microsoft** em `/login`.
2. NextAuth.js v5 (`auth.ts`) executa o OAuth dance e retorna ao callback.
3. No callback `jwt()`, mintamos um **JWT HS256** com claims:
   - `email`, `name`, `provider`
   - `iss: 'porto-frontend'`, `aud: 'drupal'`
   - `sub: email`
   - `iat`, `exp` (1h)
4. Esse JWT é colocado em `token.drupalJwt` e criptografado dentro do cookie
   de sessão do NextAuth (JWE, derivado de `AUTH_SECRET`).
5. Server Components chamam `drupalFetch('/jsonapi/...', { autenticado: true })`.
6. `drupalFetch` lê o cookie, descriptografa, extrai `drupalJwt` e envia como
   `Authorization: Bearer <jwt>`.
7. No Drupal, `porto_auth` (`JwtBridgeAuthenticator`) valida HS256 com a
   `Key` `porto_frontend_jwt`, valida `iss`/`aud`/`exp`, e:
   - Busca user por email.
   - Se não existir, **auto-provisiona** com role `authenticated`.
   - Retorna a entidade User; Drupal continua o pipeline como se fosse
     login interno.

**Segredo compartilhado**: o valor de `AUTH_SECRET` (Next) ≠ `DRUPAL_JWT_SECRET`
(Next, usado pra assinar o JWT que vai pro Drupal) ≠ `porto_frontend_jwt`
Key no Drupal. O **`DRUPAL_JWT_SECRET` precisa ser idêntico** à Key no Drupal.

## Camadas de defesa contra IDOR

O cliente nunca passa `uid` na URL. Defesas em profundidade:

1. **`hook_node_access`** em `porto_auth.module` — bloqueia anônimo nos
   bundles `parcela` e `contrato`.
2. **Views REST com Contextual Filter `[current-user:uid]`** — endpoints
   `/api/minhas-parcelas` e `/api/meus-contratos` cravam o filtro no servidor.
   `validate type=user fail=access denied` rejeita uid alheio.
3. **`drupalFetch` envia o JWT do user atual** — não dá pra passar outro.
4. **`jsonapi_role_access`** — anonymous só vê o que está explicitamente liberado.

## Data fetching no Next.js

Convenções:

- **Listas públicas** (lotes, lotes/:slug): `revalidate: 60` — cache de 1min.
- **Catalogação SSG** ainda não usada (volume baixo). Quando passar de 200
  lotes, migrar `/lotes/:slug` para `generateStaticParams`.
- **Listas privadas** (parcelas, contratos): `revalidate: 0` ou `dynamic: 'force-dynamic'`
  — não cacheia dados sensíveis entre usuários.
- **Erros do Drupal** viram `DrupalError` com `status`, `isAuthError`,
  `isNotFound`, `isServerError`. Páginas decidem o que fazer.
- **Retry curto** em 5xx (1 tentativa + 250ms de backoff). 4xx nunca repete.
- **Timeout** de 8s por chamada — evita travar o SSR.

## SEO

- `app/sitemap.ts` gera sitemap dinâmico (todos os lotes + páginas estáticas).
- `app/robots.ts` bloqueia área autenticada e `/api/*`.
- `app/(public)/lotes/[slug]/page.tsx` exporta `generateMetadata()` com
  Open Graph, Twitter Card e canonical.
- Cada detalhe de lote inclui JSON-LD `Product` com `Offer.availability`
  conforme o status (InStock / PreOrder / OutOfStock).

## Segurança em headers

`next.config.mjs` aplica em todas as rotas:

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), interest-cohort=()` |
| `Content-Security-Policy` | restrito a `'self'` + origens conhecidas (Google Maps, Gemini, OAuth) |
| `Strict-Transport-Security` (prod) | `max-age=31536000; includeSubDomains; preload` |

## Diretório de código

```
web-frontend/
├── app/
│   ├── (public)/         Layout público (header transparente, footer claro)
│   │   ├── page.tsx       Home (Hero + cards de lote)
│   │   ├── lotes/         Lista + detalhe
│   │   ├── assistente/    Gemini chat
│   │   ├── loading.tsx    Skeleton público
│   │   └── error.tsx      Error boundary público
│   ├── (auth)/login       Login com OAuth providers
│   ├── (cliente)/         Layout autenticado (header opaco + nav)
│   │   ├── painel/        Resumo + próxima parcela
│   │   ├── parcelas/      Tabela + filtros pill
│   │   ├── contratos/     Cards
│   │   ├── documentos/    EmptyState
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]   NextAuth handlers
│   │   ├── gemini/              Route handlers IA
│   │   ├── health/              Healthcheck JSON
│   │   └── version/             Build info
│   ├── sitemap.ts        Sitemap dinâmico
│   ├── robots.ts         robots.txt dinâmico
│   ├── fonts.ts          next/font (Fraunces + Inter + Mono)
│   ├── globals.css       Tokens CSS + utilitários
│   └── not-found.tsx     404 customizado
├── components/
│   ├── hero/             Hero, VideoFrame, PlayButton
│   ├── lotes/            LoteCard, StatusBadge, LoteFilters
│   ├── parcelas/         ParcelaRow, ParcelaStatusBadge, ResumoFinanceiroCard
│   ├── contratos/        ContratoCard
│   ├── shared/           BrandMark, EmptyState, WhatsappButton
│   └── ui/               CtaPrimary, CtaSecondary
├── lib/
│   ├── drupal/           client (auth+retry), lotes, parcelas, contratos, types
│   ├── gemini/           SDK wrapper
│   ├── whatsapp/         link builder
│   └── utils.ts          formatarBRL, formatarData, cn
├── auth.ts               NextAuth config + JWT mint
├── middleware.ts         Auth guard (redirects)
├── next.config.mjs       Headers + image patterns
├── tailwind.config.ts    Design tokens
└── tsconfig.json

web-backend/
├── .ddev/config.yaml
├── composer.json
├── composer.lock
├── config/sync/          YAMLs versionados (content types, fields, roles)
├── scripts/
│   ├── bootstrap-content-model.php    Cria campos via FieldConfig API
│   └── bootstrap-views.php             Cria Views REST com Contextual Filter
└── web/
    └── modules/custom/
        ├── porto_auth/    JWT bridge + hook_node_access
        └── porto_banking/ Cliente HTTP + SyncService

tests/                    Scripts estáticos rodando em CI
├── yaml-check.mjs
├── composer-check.mjs
├── php-check.mjs
├── xref-check.mjs
├── php-sanity.mjs
├── jwt-cycle.mjs
├── cookie-decode.mjs
└── parcelas-logic.mjs    Unit tests da lógica financeira

.github/workflows/ci.yml  GitHub Actions: typecheck + tests/* em PRs
```

## Convenções

- **Idioma**: comentários e nomes de função em português brasileiro (domínio
  é Brasil). Mensagens de log e erros internos em português também.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`). Mensagem curta na primeira linha, descrição abaixo.
- **Sem libs pesadas** de UI — preferir componentes próprios em Tailwind.
- **Server Components por padrão**; `'use client'` só quando precisar de
  interatividade.
- **Drupal config tem que ser versionada** em `config/sync` antes de ir
  pra produção. Mudanças manuais no admin → `drush config:export -y` →
  commit.
