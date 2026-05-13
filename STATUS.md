# Estado do projeto

Atualizado em 2026-05-13.

Resumo: a **fundação técnica está provada end-to-end** e o **produto está
quase pronto pro MVP**. O caminho público (Drupal → JSON:API → Next.js)
funciona. O caminho autenticado (Next.js → JWT → porto_auth → Drupal) também
funciona, validado com tokens mintados manualmente. Falta apenas
**credenciais externas que você precisa criar** para o produto rodar
ao vivo.

---

## ✅ Feito

### Fundação técnica
- Monorepo: `web-frontend/` (Next.js 14 App Router) + `web-backend/` (Drupal 11 / DDEV)
- Drupal 11 instalado com profile `standard` + 9 módulos contrib + **4 módulos custom**:
  - **porto_auth** — JWT bridge NextAuth↔Drupal + hook_node_access (bloqueia anonymous em parcela/contrato)
  - **porto_banking** — cliente OAuth client_credentials + sync de boletos + **PDF via entity_print**
  - **porto_analytics** — eventos server-side com IP hashed diariamente
  - **porto_notifications** — emails transacionais (vencendo / paga / contrato ativado)
- DDEV + Mailpit + MariaDB + nginx-fpm
- Smoke test 1-4 validado em máquina real (Win11 + WSL2 + Docker + DDEV)

### Modelo de conteúdo
- 3 content types versionados em `web-backend/config/sync/`: `lote`, `contrato`, `parcela`
- ~25 campos criados via `scripts/bootstrap-content-model.php`
- 2 roles: `vendedor`, `financeiro`
- Hook node_access bloqueia anonymous em bundles financeiros
- Views REST `/api/minhas-parcelas` e `/api/meus-contratos` com Contextual Filter `[current-user:uid]` (script `bootstrap-views.php`)

### Frontend (público)
- Home com Hero + vídeo Veo 3.1 fotorrealista (`sobrevoo.mp4`)
- `/lotes` com **filtros laterais** (status, quadra, preço, m², ordenação) + URL state
- `/lotes/:uuid` com metadata SEO + JSON-LD + breadcrumb
- `/assistente` (estrutura, Gemini key dummy)
- 404, loading skeletons, error boundaries (público e cliente)
- `sitemap.xml` dinâmico (lotes disponíveis priority 0.8, vendidos 0.5)
- `robots.txt` dinâmico (bloqueia área autenticada + /api/*)

### Frontend (área cliente)
- `/painel` — saudação + ResumoFinanceiroCard + 3 contratos em destaque + atalhos
- `/parcelas` — filtros pill (Todas/Em aberto/Vencidas/Pagas), ordenação inteligente, tabela desktop / cards mobile
- `/contratos` — grid de cards com status badge
- `/documentos` — EmptyState com CTA WhatsApp
- Layout autenticado com BrandMark + nav + skip link
- **PDF de boleto** baixável por parcela (`<BoletoLink>` dispara analytics)

### Identidade visual editorial
- Paleta: verde-oliva, terracota, areia, sépia, branco quente, marrom-sépia
- Tipografia: Fraunces (serif display) + Inter (sans) + JetBrains Mono (mono)
- Componentes: BrandMark, CtaPrimary, CtaSecondary, Hero, VideoFrame, PlayButton, LoteCard, StatusBadge, LoteFilters, ParcelaRow, ParcelaStatusBadge, ContratoCard, ResumoFinanceiroCard, EmptyState, BoletoLink, TrackView, WhatsappButton
- Tokens em CSS vars + Tailwind config
- `prefers-reduced-motion` global

### Infra & qualidade
- **GitHub Actions CI**: typecheck + build + 8 scripts de teste estático
- **12 testes unitários** da lógica financeira (`tests/parcelas-logic.mjs`) — pegaram um bug real de timezone
- `next.config.mjs` com CSP + HSTS + X-Frame-Options + Permissions-Policy
- `drupalFetch` com `DrupalError`, retry curto, timeout 8s
- Middleware com **rate limiting** (60/min geral, 10/min Gemini, 20/min auth)
- **Logger estruturado** (JSON em prod, pretty em dev) com correlation id (`x-request-id`)
- `/api/health` + `/api/version` para monitoring
- Skip link "Pular para o conteúdo" em ambos os layouts
- Refresh do JWT do Drupal automático quando faltam <60s pra expirar

### Analytics LGPD-friendly (server-side, sem GA)
- Tabela `porto_eventos` no Drupal com IP hashed diariamente
- 8 tipos: `lote_visualizado`, `lote_listado`, `whatsapp_clicado`, `busca_executada`, `login_iniciado`, `login_concluido`, `parcela_baixada`, `contrato_visualizado`
- API proxy Edge no Next com `sendBeacon`
- Tracker disparado em: LoteCard, /lotes/:slug, WhatsappButton (com `origem`), BoletoLink

### Emails transacionais
- **3 disparos** via Mailpit (dev) / SMTP (prod):
  - Parcela vencendo (cron diário, 7 e 1 dia antes)
  - Parcela paga (hook_node_update)
  - Contrato ativado (insert/update para status=ativo)
- Texto plain PT-BR, idempotente, log de metadata sem conteúdo

### Vídeo
- **2 versões versionadas** geradas no Google Vids/Flow (Veo 3.1):
  - `sobrevoo.mp4` (v2 atual) — fotorrealista com aeroporto detalhado + porto seco + sem montanhas
  - `sobrevoo-v1.mp4` (backup) — primeira tentativa
- Ambas usaram **Ingredients to Video**: foto real do canteiro → futuro entregue

### Documentação
- [README.md](README.md) — setup pós-clone + troubleshooting de 6 pegadinhas reais
- [STATUS.md](STATUS.md) — este arquivo
- [ARCHITECTURE.md](ARCHITECTURE.md) — diagrama Next↔Drupal↔OAuth↔Gemini↔Banking + 4 camadas IDOR + fluxo JWT
- [CONTRIBUTING.md](CONTRIBUTING.md) — branches, Conventional Commits PT, fluxo PR
- [SECURITY.md](SECURITY.md) — canal de reporte + 72h SLA + escopo + práticas em vigor
- [SMOKE-TEST.md](SMOKE-TEST.md) — roteiro original (passos 1-4 validados)
- [tests/README.md](tests/README.md) — como rodar os testes estáticos

---

## 🔴 Falta — bloqueado em você (5min cada)

Cada item destrava um pedaço grande do produto.

### 1. Docker Desktop funcionando
Hoje quebra ao subir por causa do **Inference Manager** (feature de IA do Docker
Desktop) que tenta criar socket em path Windows com espaço. Soluções:

**Opção A (recomendada):** Settings do Docker Desktop → Features in development
→ **Desabilitar** "Use Docker AI / Inference Manager" → Apply & Restart.

**Opção B:** Reinstalar o Docker Desktop preservando dados.

**Opção C:** Mover seu usuário Windows pra um nome sem espaço (radical).

### 2. Credenciais OAuth + IA

| Variável | Onde criar | Pra quê |
|---|---|---|
| `AUTH_GOOGLE_ID` / `_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client → redirect `http://localhost:3000/api/auth/callback/google` | Login Google |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` | [Azure Portal](https://portal.azure.com) → App registrations → "Personal + any directory" → redirect `/api/auth/callback/microsoft-entra-id` | Login Microsoft/Hotmail |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Assistente de IA |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | [Cloud Console → Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com) → credencial restrita por domínio | Mapa interativo em /lotes |
| Lat/lng do terreno | Google Maps → click direito → "O que há aqui?" | Centro do mapa |

Quando criar, basta colar no `web-frontend/.env.local` (modelo em `.env.example`).
Sem isso, smoke test passos 5-6 + `/assistente` real + mapa não rodam.

### 3. Dependências do Drupal
Quando Docker subir, rode (uma vez):

```bash
cd web-backend
ddev start
ddev composer require drupal/entity_print  # se ainda não instalado
ddev drush en porto_analytics porto_notifications -y
ddev drush scr scripts/bootstrap-views.php
ddev drush cr
ddev drush config:export -y
git add web-backend/config/sync/ && git commit -m "chore: export config (views minhas-parcelas + meus-contratos)"
```

---

## 🟡 Próximos blocos engenheiráveis (posso fazer sem desbloqueio externo)

### Bloco 1 — Conteúdo
- **Cadastrar lote pelo Next.js** — em vez de usar admin Drupal, vendedores cadastram pelo site (com a paleta editorial). Reusa JWT bridge.
- **Lotes similares** no rodapé do `/lotes/:slug` (mesma quadra, mesma faixa de preço)
- **Search Drupal Search API** — busca interna full-text (sem precisar de Gemini)
- **Newsletter / interesse em lote** — "me avise quando voltar a vender"

### Bloco 2 — Painel admin (vendedor / financeiro)
- Telas Next.js consumindo `RegistradorEventos::contarPorTipo()` e `lotesMaisVisualizados()`
- Audit log do financeiro: quem mudou `field_pago` quando
- Bulk actions (marcar várias parcelas como pagas)

### Bloco 3 — Integração mapa (depende só de Google Maps key + lat/lng)
- Componente `<LotesMapa>` com pinos coloridos por status
- Click no pino → `/lotes/:slug`
- Toggle Grid/Mapa em `/lotes`
- Filtros sincronizados com a sidebar

### Bloco 4 — Hardening adicional (recomendo só após produção)
- **Upstash Redis** pro rate limit multi-instance
- **Sentry** no Next.js + watchdog/syslog no Drupal
- **CSRF token explícito** (hoje só `SameSite=lax`)
- **Lighthouse CI** falhando PRs que pioram score
- **A11y audit completo** (focus traps, ARIA expandido)

### Bloco 5 — Deploy
- Vercel pro `web-frontend` (vars de ambiente + domínio + preview)
- Pantheon / Platform.sh / VPS pro Drupal
- CORS produção em `services.yml`
- Backups automatizados do banco

---

## 📋 Variáveis de ambiente (`web-frontend/.env.local`)

Lista completa do que o código consome. Copiar de `.env.example`.

### Obrigatórias para rodar (sempre)
- `AUTH_SECRET` — base64 32 bytes. Gerar com `openssl rand -base64 32`. Criptografa o cookie da sessão NextAuth.
- `NEXTAUTH_URL` — origem do site. Dev: `http://localhost:3000`. Prod: `https://porto.com.br`.
- `DRUPAL_BASE_URL` — `http://porto-das-oliveiras.ddev.site` em dev, URL pública do Drupal em prod.
- `DRUPAL_JWT_SECRET` — 48+ chars. **Mesmo valor** salvo na Key `porto_frontend_jwt` no Drupal.

### Obrigatórias para área autenticada
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client
- `AUTH_MICROSOFT_ENTRA_ID_ID` / `AUTH_MICROSOFT_ENTRA_ID_SECRET` — Microsoft App registration
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER` — `https://login.microsoftonline.com/common/v2.0` (default no .env.example)
- `AUTH_MICROSOFT_ENTRA_ID_TENANT` — opcional, default `common` (aceita Hotmail/Outlook)

### Obrigatórias para features específicas
- `GEMINI_API_KEY` — `/assistente` real
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — mapa interativo em `/lotes`
- `NEXT_PUBLIC_SITE_URL` — URL pública pro sitemap/robots/og:url. Dev: `http://localhost:3000`.

### Opcionais (observabilidade)
- `LOG_LEVEL` — `debug` | `info` | `warn` | `error`. Default: `debug` em dev, `info` em prod.
- `NEXT_PUBLIC_GIT_SHA` — preenchido pelo CI/Vercel automaticamente em prod.

---

## Histórico de commits (14 hoje)

| Hash | Mudança |
|---|---|
| `d1ed544` | feat(notifications): emails transacionais via Mailpit/SMTP |
| `0b39434` | feat(boletos): PDF de parcela via entity_print + tracking |
| `e8050cc` | feat(analytics): tracking server-side LGPD-friendly |
| `4a57f84` | feat(infra): rate limit + logger + a11y + docs operacionais |
| `814c529` | feat(infra): SEO + CI + testes + ARCHITECTURE |
| `0f3c241` | feat(cliente): área autenticada completa |
| `c2aa063` | feat(lotes): filtros laterais com URL state |
| `b1a2385` | feat(hero): v2 do vídeo gerado — fotorrealista |
| `21b79e5` | feat(hero): integra vídeo gerado no Veo 3.1 |
| `da95ba3` | design: identidade visual + Hero versão A |
| `9e6ee98` | docs: STATUS.md |
| `18b1b4b` | docs: setup pós-clone + troubleshooting |
| `b5843be` | fix(lotes): obter por UUID em vez de filter[path.alias] |
| `6a9b1cb` | feat: smoke test ponta-a-ponta passou + fixes |

---

## Próximos passos imediatos quando retomar

1. **Destravar Docker** (Settings → desabilitar Inference Manager)
2. `cd web-backend && ddev start && ddev composer install`
3. `ddev drush en porto_analytics porto_notifications -y && ddev drush cr`
4. Confirmar `http://porto-das-oliveiras.ddev.site` respondendo
5. Confirmar `http://localhost:3000` respondendo (dev server)
6. Pegar credenciais externas (Google OAuth + Maps + Gemini) — uma de cada vez
7. Conforme cada credencial cair, atacamos:
   - OAuth → smoke test 5-6 ao vivo
   - Gemini → `/assistente` funcional
   - Maps + GPS → bloco 3 (mapa interativo)
