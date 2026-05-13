# Estado do projeto

Atualizado em 2026-05-13.

Resumo: a **fundação técnica está provada end-to-end**. O caminho público
(Drupal → JSON:API → Next.js) funciona. O caminho autenticado
(Next.js → JWT → porto_auth → Drupal) também funciona, validado com tokens
mintados manualmente. O que falta para o produto rodar de verdade é design,
credenciais externas e camadas de produto que dependem deles.

---

## Feito ✅

### Fundação técnica
- Monorepo organizado: `web-frontend/` (Next.js 14 App Router) +
  `web-backend/` (Drupal 11 headless via DDEV).
- DDEV configurado (PHP 8.3, MariaDB 10.11, nginx-fpm) com fix do binário
  docker-compose e fallback do packagist CDN.
- Drupal 11 instalado com `standard` profile + 9 módulos:
  `jsonapi_extras`, `jsonapi_views`, `jsonapi_role_access`, `key`,
  `restui`, `pathauto`, `entity_print`, `porto_auth`, `porto_banking`.

### Modelo de conteúdo
- 3 content types: `lote`, `contrato`, `parcela` — versionados em
  [web-backend/config/sync/](web-backend/config/sync/).
- ~25 campos versionados ou criados via
  [bootstrap-content-model.php](web-backend/scripts/bootstrap-content-model.php).
- 2 roles: `vendedor`, `financeiro` (além de anonymous/authenticated padrão).

### Módulos custom
- **porto_auth** — ponte JWT NextAuth ↔ Drupal:
  - `JwtBridgeAuthenticator` valida HS256, decodifica claims, auto-provisiona
    user pelo email.
  - `porto_auth.module` com `hook_node_access` bloqueia anonymous em
    `parcela`/`contrato`.
- **porto_banking** — sincronização de boletos:
  - `BankingApiClient` (OAuth client_credentials, token cacheado em State,
    `rtrim` defensivo na baseUri, `is_array` no JSON).
  - `BoletoSyncService` (orquestra import, idempotência via
    `field_codigo_externo`, `hasField` defensivo antes de set/save).

### Frontend
- Páginas implementadas:
  - `/` — home com card do lote (verificado renderizando Q01-L01).
  - `/lotes` — lista pública.
  - `/lotes/:slug` — detalhe via UUID (verificado).
  - `/assistente` — form de busca via Gemini (estrutura OK; Gemini só
    responde com chave real).
  - `/login` (rota existe; precisa OAuth).
  - `/painel`, `/contratos`, `/parcelas`, `/documentos` (estrutura criada).
- NextAuth.js v5 com providers Google e Microsoft Entra ID configurados.
- `lib/drupal/client.ts` mintando JWT HS256 do cookie NextAuth e
  enviando como `Authorization: Bearer` ao Drupal.

### Testes estáticos
- 7 scripts em [tests/](tests/) — todos passando:
  - `yaml-check`, `composer-check`, `php-check`, `xref-check`,
    `php-sanity`, `jwt-cycle`, `cookie-decode`.
- Scripts agora resolvem o root via `import.meta.url`
  (rodam em qualquer worktree, não exigem caminho hardcoded).

### Smoke test end-to-end
Smoke test do [SMOKE-TEST.md](SMOKE-TEST.md), passos 1-4 validados em
máquina real (Win11 + WSL2 + Docker Desktop + DDEV):

| Passo | Status | Evidência |
|---|---|---|
| 1. Backend Drupal sobe | ✅ | DDEV up, 9 módulos habilitados |
| 2. Key JWT compartilhada | ✅ | `porto_frontend_jwt` salva via drush |
| 3. Lote Q01-L01 cadastrado | ✅ | Aparece em `/jsonapi/node/lote` |
| 4. Home Next.js renderiza | ✅ | Card com badge "Disponível" em localhost:3000 |

JWT bridge validado adicionalmente sem precisar de OAuth:
- Mintar token jose → bater no Drupal → auto-provisionou `cliente.teste@gmail.com` (uid=2)
- Criado contrato (nid=2) + parcela (nid=3) atrelados a esse user
- Filtro `filter[field_cliente.meta.drupal_internal__target_id]=2`:
  retorna parcela para o dono, vazio para outros
- Anonymous: bloqueado em `/jsonapi/node/parcela` (meta omitted) e
  livre em `/jsonapi/node/lote` (público) ✅

### Documentação
- [README.md](README.md) com setup completo pós-clone + tabela de variáveis +
  troubleshooting das 6 pegadinhas encontradas.
- [tests/README.md](tests/README.md) com estrutura de execução (tests/ +
  junction `web-backend`).
- [SMOKE-TEST.md](SMOKE-TEST.md) — roteiro original.

---

## Falta fazer 🔧

### Bloqueado por credenciais externas (você precisa criar)
- [ ] **OAuth Google**: Cloud Console → OAuth client com redirect
      `http://localhost:3000/api/auth/callback/google` →
      preencher `AUTH_GOOGLE_ID/SECRET` em `.env.local`.
- [ ] **OAuth Microsoft**: Azure Portal → App registration "Personal +
      any directory" com redirect
      `http://localhost:3000/api/auth/callback/microsoft-entra-id` →
      preencher `AUTH_MICROSOFT_ENTRA_ID_ID/SECRET`.
- [ ] **Gemini API key**: aistudio.google.com/apikey → `GEMINI_API_KEY`.
- [ ] Refazer `npm run dev` no `web-frontend` após popular `.env.local`.

### Smoke test passos 5-6 (depende do bloco acima)
- [ ] Login do cliente (`/login` → Google ou Microsoft → callback → `/painel`).
- [ ] Validar que `ddev drush user:list` mostra o user recém-criado pelo OAuth.
- [ ] Criar contrato + parcela pelo admin Drupal apontando para o user OAuth.
- [ ] Acessar `/parcelas` no Next.js logado: parcela aparece.
- [ ] Logar com outra conta: parcela **não** aparece.

### Design (Claude Designer)
- [ ] Identidade visual (paleta, tipografia, logo).
- [ ] Mockups de todas as telas (ver prompt no histórico do chat).
- [ ] Aplicar tokens de design no Tailwind config + revisar componentes
      existentes (`LoteCard`, `StatusBadge`, `WhatsappButton`, layouts).

### Produto (próximo do smoke test passar)
- [ ] **View "Minhas Parcelas"** no Drupal com Contextual Filter
      `[current-user:uid]` — endpoint dedicado em vez de filtro manipulável
      pelo cliente. Hoje qualquer authenticated pode (em tese) filtrar pelo
      uid de outro usuário; o `hook_node_access` já barra anonymous, mas
      a View cravada é a proteção limpa contra IDOR.
- [ ] **Entity Print PDF** para boletos — gerar PDF estilizado de
      cada parcela.
- [ ] **Gemini avançado** — embeddings dos lotes para busca semântica
      ("lote acima de 400m² com vista").
- [ ] **Integração bancária real** — credenciais OAuth client_credentials
      em produção, agendamento do `BoletoSyncService::sincronizarUltimoDia()`
      via cron/advancedqueue.

### Infraestrutura / deploy
- [ ] **Vercel** — deploy do `web-frontend` (variáveis de ambiente,
      domínio, preview deploys).
- [ ] **Hospedagem Drupal** — Pantheon, Platform.sh ou VPS própria
      (DDEV é só local).
- [ ] **CORS em produção** — restringir origem ao domínio Vercel no
      `services.yml` do Drupal.
- [ ] **CI** — rodar `tests/*.mjs` + `npm run typecheck` em PRs.
- [ ] **Backups** automatizados do banco Drupal.

### Qualidade / hardening
- [ ] Testes E2E (Playwright/Cypress) cobrindo os fluxos validados manualmente.
- [ ] Testes unitários PHPUnit para `BankingApiClient` e
      `JwtBridgeAuthenticator`.
- [ ] Logging estruturado em produção.
- [ ] Monitoramento (Sentry no Next.js, watchdog/syslog no Drupal).

---

## Estado dos serviços agora

| Serviço | URL | Estado |
|---|---|---|
| Drupal admin | http://porto-das-oliveiras.ddev.site/user/login | `admin / qEJLX68sFN` |
| Drupal JSON:API | http://porto-das-oliveiras.ddev.site/jsonapi/node/lote | 200, retorna 1 lote |
| Next.js dev | http://localhost:3000 | 200, renderiza home |

Para retomar do zero em outra máquina: seguir [README.md](README.md) ou
[SMOKE-TEST.md](SMOKE-TEST.md). Toda a configuração necessária está
versionada — nenhum estado "mágico" vive só na máquina atual.
