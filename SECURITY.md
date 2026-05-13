# Política de segurança

## Reportar uma vulnerabilidade

Encontrou uma falha? **Não abra issue pública.** Mande para:

📧 **tportooliveira@gmail.com**

com:
- Descrição do problema
- Passos para reproduzir
- Impacto que você consegue causar
- Versão / commit do código onde testou

Respondemos em até **72h em dias úteis** com:
1. Confirmação do recebimento
2. Avaliação inicial (severidade + escopo)
3. Plano de correção com prazo

Você fica no loop até o fix sair em produção.

## O que está em escopo

- **`web-frontend/`** (Next.js): vulnerabilidades de auth, XSS, CSRF, IDOR,
  exposição de dados sensíveis, SSRF, prototype pollution.
- **`web-backend/`** (Drupal + custom modules): acesso indevido a recursos,
  bypass de Contextual Filters, RCE em `porto_banking` ou `porto_auth`,
  injection no JWT, leaks no JSON:API.
- **Pipeline OAuth**: tomada de conta, redirect aberto, token leak.
- **Integração bancária**: bypass do OAuth client_credentials, leak do token
  cacheado em State, sync indevida.

## O que NÃO está em escopo

- Drupal core / módulos contrib (reporte direto no [drupal.org/security](https://www.drupal.org/security)).
- Next.js / NextAuth (reporte no [vercel/next.js](https://github.com/vercel/next.js/security)).
- Vulnerabilidades que exigem acesso físico ou social engineering pesado.
- Self-XSS, ataques contra outros usuários no mesmo navegador.
- Best-practice violations sem impacto demonstrável (ex.: header X ausente
  sem cenário de ataque).
- Spam / abuse de formulários públicos (use os mecanismos de rate limit
  expostos em `lib/rateLimit.ts`).

## Superfície de ataque atual

### Pública (sem login)

- `GET /` — home com vídeo + cards de lote.
- `GET /lotes` — catálogo com filtros via querystring.
- `GET /lotes/:uuid` — detalhe (UUID v4 estrito).
- `GET /assistente` — chat com Gemini (rate-limit 10 req/min por IP).
- `GET /api/health`, `GET /api/version` — diagnostico.
- `POST /api/gemini/*` — chamadas à IA (rate-limit + sanitização server-side).

### Autenticada (cookie NextAuth + JWT Drupal)

- `GET /painel`, `/parcelas`, `/contratos`, `/documentos` — guard via middleware.
- Cada server component faz fetch no Drupal com `Authorization: Bearer`.
- JWT do Drupal renova preguiçosamente quando faltam <60s para expirar.

### Camadas de defesa contra IDOR

1. `hook_node_access` em `porto_auth.module` bloqueia anonymous em
   bundles financeiros (parcela, contrato).
2. Views REST `/api/minhas-parcelas` e `/api/meus-contratos` têm
   Contextual Filter `[current-user:uid]` cravado, `validate type=user
   fail=access denied`.
3. `drupalFetch` só envia o JWT do usuário logado; não dá pra forjar.
4. `jsonapi_role_access` mantém só o que está explicitamente liberado.

## Práticas seguras já em vigor

- Headers de segurança em `next.config.mjs`: CSP, HSTS (prod), X-Frame-Options,
  Referrer-Policy, Permissions-Policy.
- Cookies de sessão com flag `Secure` em produção, `HttpOnly` sempre,
  `SameSite=lax`.
- `AUTH_SECRET` e `DRUPAL_JWT_SECRET` são variáveis de ambiente, **nunca**
  versionadas.
- Rate limit em todas as rotas `/api/*` (60/min por IP, 10/min em
  `/api/gemini`, 20/min em `/api/auth`).
- Timeouts em todas as chamadas externas (`drupalFetch`: 8s).
- Retry curto só em 5xx — 4xx nunca repete pra não amplificar abuse.
- `dangerouslySetInnerHTML` só usado para `description` do lote, que vem
  do Drupal e passa pelo filtro de texto do Drupal (não é input do user).

## Pendências de hardening (transparência)

- Rate limit hoje é em memória, single-instance. Migrar pra Upstash Redis
  ou Vercel KV antes de escalar.
- Falta CSRF token explícito nos forms — hoje protegido apenas pelo
  `SameSite=lax` do cookie, que é o padrão moderno mas não é defesa total.
- Sem WAF nem DDoS protection na frente — Vercel mitiga parcialmente.
- Logs estruturados mas ainda não centralizados (sem Sentry/Datadog).
