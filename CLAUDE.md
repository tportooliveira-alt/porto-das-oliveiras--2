# CLAUDE.md — Porto das Oliveiras

Guia obrigatório para o Claude Code. Leia antes de tocar em qualquer arquivo.

---

## O que é esse projeto

Sistema de vendas e gestão imobiliária para o **loteamento Porto das Oliveiras**
(Vitória da Conquista — BA). Clientes compram lotes, assinam contratos e
acompanham parcelas pelo site.

---

## Stack — NÃO ALTERAR as escolhas abaixo

| Camada | Tecnologia | Por quê não muda |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | já implantado |
| Backend | **Drupal 11 headless + DDEV** | decisão do cliente — é o CMS que ele opera |
| Auth | NextAuth.js v5 (Google + Microsoft OAuth) | integrado ao JWT bridge do Drupal |
| IA | Google Gemini (`@google/generative-ai`) | chave já contratada |
| Banco | MariaDB via DDEV (local) / banco do host Drupal (prod) | gerenciado pelo Drupal |
| Deploy frontend | Vercel | |
| Deploy backend | Pantheon / VPS (a definir) | qualquer host que rode PHP + MariaDB |

> ⚠️ O backend **é Drupal**. Não sugira trocar por Supabase, Firebase, NestJS
> ou qualquer outro. A modelagem de conteúdo, o JSON:API e os módulos custom
> vivem no Drupal e isso não muda.

---

## Como rodar localmente

### Pré-requisitos
- Node.js 20+
- Docker Desktop (com WSL2 no Windows — ver README troubleshooting)
- DDEV

### Backend
```bash
cd web-backend
ddev start
ddev composer install
# Primeiro setup (uma vez):
ddev drush site:install standard --site-name="Porto das Oliveiras" -y
ddev drush en jsonapi_extras jsonapi_views jsonapi_role_access key restui \
  pathauto entity_print porto_auth porto_banking porto_analytics \
  porto_notifications -y
ddev drush scr scripts/bootstrap-content-model.php
ddev drush scr scripts/bootstrap-views.php
ddev drush config:export -y
```
Backend responde em: `http://porto-das-oliveiras.ddev.site`

### Frontend
```bash
# No Windows: copiar para fora do OneDrive antes do npm install
cd web-frontend
npm install
cp .env.example .env.local   # preencher DRUPAL_JWT_SECRET + credenciais OAuth
npm run dev                  # http://localhost:3000
```

---

## Variáveis de ambiente obrigatórias

Ver `.env.example` para lista completa. As críticas:

| Var | Onde criar |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DRUPAL_JWT_SECRET` | Mesmo valor da Key `porto_frontend_jwt` no Drupal |
| `AUTH_GOOGLE_ID/SECRET` | Google Cloud Console → OAuth client |
| `AUTH_MICROSOFT_ENTRA_ID_*` | Azure Portal → App registrations |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Cloud Console → Maps JavaScript API |

---

## Arquitetura em 30 segundos

```
Browser
  └── Next.js (Vercel)
        ├── Server Components → drupalFetch() → Drupal JSON:API
        ├── NextAuth.js → OAuth (Google / Microsoft) → minta JWT HS256 → Drupal
        ├── Route Handlers → Gemini SDK (IA assistente)
        └── Middleware → rate limit + auth guard
```

Fluxo JWT completo: `auth.ts` minta JWT → salva no cookie NextAuth →
`drupalFetch()` lê e envia como Bearer → `porto_auth` valida e auto-provisiona user.

Detalhes completos em `ARCHITECTURE.md`.

---

## Modelo de conteúdo (Drupal)

Três content types principais:

**lote** — imóvel à venda
- `title` (nome do lote, ex: "Lote 12 Quadra B")
- `field_status` — `disponivel | reservado | vendido`
- `field_valor` — decimal
- `field_quadra`, `field_numero`, `field_area_m2`, `field_descricao`
- `field_latitude`, `field_longitude` (para mapa)

**contrato** — vínculo cliente ↔ lote
- `field_lote` — referência entity para `lote`
- `field_cliente_uid` — UID do Drupal user
- `field_status_contrato` — `pendente | ativo | quitado | cancelado`
- `field_valor_total`, `field_data_assinatura`

**parcela** — prestação do contrato
- `field_contrato` — referência entity para `contrato`
- `field_valor_parcela`, `field_data_vencimento`, `field_pago` (boolean)
- `field_numero_parcela`, `field_boleto_url`

---

## Regras obrigatórias ao codar

1. **Idioma**: comentários, funções, logs e mensagens de erro em **português brasileiro**.
   Identificadores técnicos do framework ficam em inglês (`useState`, `boolean`, etc.).

2. **Server Components por padrão** — `'use client'` só quando precisar de
   interatividade real (filtros, animações, vídeo).

3. **Nunca hardcode `#hex`** em componentes — use os tokens CSS em `globals.css`
   e `tailwind.config.ts`.

4. **Mudança no Drupal admin** → sempre exportar e commitar:
   ```bash
   ddev drush config:export -y
   git add web-backend/config/sync/
   git commit -m "chore(drupal): exportar config — <o que mudou>"
   ```

5. **Dados privados** (parcelas, contratos): `revalidate: 0` — nunca cacheia.
   Dados públicos (lotes): `revalidate: 60`.

6. **IDOR**: nunca expor `uid` em URL. As Views REST usam
   `[current-user:uid]` como Contextual Filter — não contornar isso.

7. **Sem libs pesadas de UI** (MUI, shadcn, etc.) — componentes próprios em Tailwind.

---

## Módulos custom do Drupal

| Módulo | Responsabilidade |
|---|---|
| `porto_auth` | JWT bridge NextAuth↔Drupal + `hook_node_access` |
| `porto_banking` | Cliente OAuth boletos + PDF via `entity_print` |
| `porto_analytics` | Tracking server-side LGPD-friendly (IP hashed diário) |
| `porto_notifications` | Emails transacionais (parcela vencendo, paga, contrato ativado) |

---

## Testes

```bash
# Typecheck
cd web-frontend && npm run typecheck

# Testes estáticos (sem Docker)
node tests/yaml-check.mjs
node tests/composer-check.mjs
node tests/php-check.mjs
node tests/xref-check.mjs
node tests/php-sanity.mjs
node tests/jwt-cycle.mjs
node tests/cookie-decode.mjs
node tests/parcelas-logic.mjs

# CI roda tudo isso em todo PR (ver .github/workflows/ci.yml)
```

---

## O que está pronto vs. o que falta

### ✅ Pronto
- Páginas públicas: home (vídeo), `/lotes` com filtros, `/lotes/:slug` com SEO
- Área cliente: painel, parcelas, contratos, documentos (empty), boleto PDF
- Auth JWT completo (Google + Microsoft → Drupal)
- Analytics LGPD, emails transacionais, rate limit, logger, CI

### 🔴 Bloqueado (depende de credenciais externas)
- Docker Desktop: desabilitar Inference Manager em Settings → Features in development
- Google OAuth, Microsoft OAuth, Gemini key, Google Maps key

### 🟡 Próximos blocos
1. **Mapa interativo** (`LotesMapa`) — pinos coloridos por status, toggle Grid/Mapa
2. **Cadastro de lote pelo Next.js** — formulário para vendedor, sem precisar do admin Drupal
3. **Lotes similares** — rodapé do `/lotes/:slug`
4. **Painel admin** — dashboard vendedor/financeiro com analytics

---

## Arquivos-chave para ler antes de mexer

| Arquivo | Conteúdo |
|---|---|
| `ARCHITECTURE.md` | Diagrama completo + fluxo JWT + camadas IDOR |
| `STATUS.md` | O que está feito, o que falta, histórico de commits |
| `web-frontend/auth.ts` | Mint do JWT + config NextAuth |
| `web-frontend/lib/drupal/client.ts` | `drupalFetch()` com retry/timeout/DrupalError |
| `web-backend/web/modules/custom/porto_auth/` | JWT bridge no Drupal |
