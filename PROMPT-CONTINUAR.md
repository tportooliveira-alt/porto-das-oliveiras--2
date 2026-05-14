# Prompt para continuar no Claude Code (VS Code)

Cole tudo abaixo na primeira mensagem da nova sessão.

---

```
Você vai continuar o desenvolvimento do "Porto das Oliveiras", site
institucional + área autenticada de um loteamento residencial em Vitória
da Conquista, Bahia.

═══════════════════════════════════════════════════════════════════════
ANTES DE QUALQUER COISA: LEIA OS 3 ARQUIVOS NA RAIZ DO REPO
═══════════════════════════════════════════════════════════════════════

1. README.md       — setup local + troubleshooting de 6 pegadinhas reais
2. STATUS.md       — feito vs pendente, variáveis .env documentadas
3. ROADMAP.md      — plano 90 dias com 8 fases priorizadas

E mais 3 quando precisar:
- ARCHITECTURE.md  — diagrama Next↔Drupal↔OAuth↔Gemini + camadas IDOR
- CONTRIBUTING.md  — convenções (commits em PT, Conventional Commits)
- SECURITY.md      — superfície de ataque + práticas em vigor

═══════════════════════════════════════════════════════════════════════
ESTADO ATUAL (resumo executivo)
═══════════════════════════════════════════════════════════════════════

Monorepo: web-frontend/ (Next.js 14 App Router) + web-backend/ (Drupal 11
DDEV). Smoke test ponta-a-ponta passou. Identidade visual editorial
aplicada (Fraunces + Inter + paleta terrosa). Vídeo Hero fotorrealista
do Veo 3.1 integrado.

JÁ ESTÁ PRONTO:
- 4 módulos custom Drupal: porto_auth (JWT bridge), porto_banking
  (boletos + PDF via entity_print), porto_analytics (eventos LGPD-
  friendly server-side), porto_notifications (emails transacionais).
- Frontend público: home com Hero, /lotes com filtros laterais URL state,
  /lotes/:uuid com SEO+JSON-LD, /assistente (estrutura).
- Frontend cliente autenticado: /painel com ResumoFinanceiroCard +
  contratos, /parcelas com filtros pill + tabela/cards mobile,
  /contratos, /documentos.
- PDF de boleto por parcela (entity_print, view mode pdf).
- Emails: parcela vencendo (cron 7d/1d), parcela paga (hook update),
  contrato ativado.
- Infra: rate limit middleware, logger estruturado com correlation
  id (x-request-id), CSP+HSTS+X-Frame-Options, /api/health, /api/version.
- SEO: sitemap dinâmico, robots, generateMetadata com OG, JSON-LD.
- CI: GitHub Actions com typecheck + build + 12 testes unitários
  da lógica financeira + 7 estáticos de YAML/PHP/JWT.
- Skip link + prefers-reduced-motion (a11y baseline).

TRAVADO (você vai destravar OU me dizer pra atacar outra fase):
- Docker Desktop com bug do Inference Manager (path Windows c/ espaço).
  Fix está em C:\temp\fix-docker-inference.ps1 — precisa rodar como
  Admin uma vez e reabrir Docker Desktop.
- Credenciais externas faltando: Google OAuth, Microsoft Entra,
  Gemini API key, Google Maps key + lat/lng do terreno.

═══════════════════════════════════════════════════════════════════════
PRÓXIMA AÇÃO (em ordem)
═══════════════════════════════════════════════════════════════════════

SPRINT 0 — Destravar (segue o ROADMAP.md fase 0):

1. Pergunte ao user se já rodou o fix-docker-inference.ps1 e Docker
   está rodando. Se não, oriente o passo a passo.
2. Quando Docker subir, execute em sequência:
     cd web-backend
     ddev start
     ddev composer install
     ddev drush en porto_analytics porto_notifications -y
     ddev drush scr scripts/bootstrap-views.php
     ddev drush cr
     ddev drush config:export -y
3. Confirme http://porto-das-oliveiras.ddev.site retornando 200 e
   http://localhost:3000 renderizando a home.
4. Pergunte ao user se já criou cada credencial do .env.example.
   Se faltar alguma, oriente onde criar (link console).

SPRINT 1 (depois) — Fase 1 do ROADMAP: mapa interativo
   Precisa: NEXT_PUBLIC_GOOGLE_MAPS_KEY + lat/lng do terreno
   Entregáveis: lib/maps/loteamento.ts, components/lotes/MapaLotes.tsx,
   toggle Grid/Mapa em /lotes, pinos coloridos por status, InfoWindow,
   sincronização com filtros, tracking de cliques no pino.

═══════════════════════════════════════════════════════════════════════
CONVENÇÕES — SIGA À RISCA
═══════════════════════════════════════════════════════════════════════

- Idioma: comentários, nomes de função, mensagens de erro e logs em
  PORTUGUÊS brasileiro. Identificadores técnicos (TypeScript, frameworks)
  em inglês.
- Commits: Conventional Commits em PT, primeira linha imperativa <72ch.
  Tipos: feat, fix, docs, refactor, test, chore, perf, style.
- Server Components por padrão. 'use client' só quando necessário
  (interatividade real).
- Tokens visuais SEMPRE via CSS vars / Tailwind config. Nunca hardcode
  hex em componentes.
- Animations sempre dentro de @media (prefers-reduced-motion).
- Mudanças no Drupal admin → ddev drush config:export -y + commit.
- TypeScript strict: true. Não desabilitar.
- Imagens: next/image sempre. Nunca <img>.
- Texto institucional: peso baiano, sem corporativismo. "30 minutos do
  centro" > "localização privilegiada".
- LGPD por design. Sem GA, sem Hotjar, sem terceiros que rastreiem.

═══════════════════════════════════════════════════════════════════════
ESTRUTURA DE COMUNICAÇÃO
═══════════════════════════════════════════════════════════════════════

- Antes de mudanças grandes, mostre o plano em bullet points e pergunte.
- TodoWrite SEMPRE em tarefas multi-step. Marca completed imediatamente.
- Mensagens curtas, sem floreio. Vá direto ao ponto.
- Use português brasileiro coloquial moderado nas respostas.
- Quando algo bloquear (Docker, credencial, decisão), seja explícito
  sobre o que falta e DE QUEM (você ou eu).
- Roda os scripts em tests/*.mjs antes de mexer em parcelas.ts ou
  client.ts (são unit tests + contract tests).

═══════════════════════════════════════════════════════════════════════
COMECE PERGUNTANDO
═══════════════════════════════════════════════════════════════════════

"Vamos retomar. Pra eu saber por onde atacar:
 1. Docker já está rodando (fix-docker-inference.ps1 aplicado)?
 2. Já tem alguma das 5 credenciais externas (Google OAuth, Microsoft
    Entra, Gemini, Maps + lat/lng)?
 3. Prefere seguir a ordem do ROADMAP.md (Fase 0 → 1 → 4 → ...) ou
    quer pular pra alguma fase específica?"

A partir das respostas, ataque a fase correta.
```

---

## Sugestões de melhoria (paralelas ao ROADMAP)

Lista de ideias que ainda **não estão no ROADMAP** mas que valem considerar.
Cada uma com **impacto esperado** e **esforço estimado**.

### 🌱 Produto

**1. Tour de orientação no primeiro acesso ao cliente (3h)**
- Impacto: cliente entende a área em 30s, reduz tickets de "como acho meu boleto?"
- Onboarding em 4 passos via biblioteca leve (driver.js ou shepherd.js)
- Marca progresso no localStorage; aparece só uma vez

**2. Lembrete via WhatsApp Business API (2 dias)**
- Impacto: WhatsApp tem 95% open rate, email tem 20%
- Notificação "parcela vence amanhã" via WhatsApp
- API oficial da Meta tem free tier (1000 conversas/mês)
- Refator: porto_notifications.module passa a ter "canal" (email|whatsapp|sms)

**3. Indique e ganhe (2 dias)**
- Impacto: imobiliário se vende muito por indicação
- Cliente logado pega link único → quem comprar via esse link dá desconto
- Tabela `porto_indicacoes` no Drupal
- Tela em `/painel/indicar` com share via WhatsApp

**4. Tour 360° no terreno (Matterport ou Kuula) (1 dia + custo externo)**
- Impacto: visitante online "vê" o terreno antes de visitar fisicamente
- Embed no `/lotes/:uuid` em vez de só fotos
- ~US$60/mês Matterport, Kuula tem free tier

**5. Cálculo de financiamento direto + simulação salvável (1 dia)**
- Em `/lotes/:uuid`: slider de entrada + prazo → parcela mensal
- "Salvar simulação" → manda email com PDF
- Botão "Conversar sobre essa proposta" → WhatsApp pré-preenchido com a simulação

**6. Status público da obra (1 dia)**
- Página `/obra` com timeline + fotos do andamento
- "Atualizado em 12 mai 2026 · 73% concluído"
- Drupal content type `andamento_obra` com fotos + descrição

### 🔧 Engenharia

**7. E2E real com Playwright (2 dias)**
- Hoje só temos testes estáticos + unit
- Smoke test do SMOKE-TEST.md em código
- Roda no CI a cada PR

**8. Visual regression com Playwright + percy.io (1 dia)**
- Snapshot de cada página em desktop + mobile
- PR que muda CSS sem querer fica visível

**9. Bundle analyzer (30min)**
- `next-bundle-analyzer` em `npm run analyze`
- Identifica pacotes pesados (provável: jose, generative-ai)

**10. PR templates + issue templates GitHub (30min)**
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug.md` e `feature.md`

**11. Dependabot ou Renovate (10min)**
- Atualização automática de deps com PRs
- Renovate é mais flexível (group, schedule)

**12. Conventional commits enforcement (30min)**
- `commitlint` + husky pre-commit
- Bloqueia mensagem fora do padrão

**13. Type-safe env via `@t3-oss/env-nextjs` (1h)**
- Hoje qualquer env var é `string | undefined`
- Lib gera erro de build se faltar var crítica
- Doc oficial dos requirements vivo no código

**14. OpenTelemetry / Vercel Analytics (4h)**
- Traces distribuídos Next → Drupal
- Identifica latência por rota

### 🎯 SEO & marketing

**15. RSS feed do blog (30min)**
- `app/diario/rss.xml/route.ts`
- Importante pra ser pego por agregadores e Google Discover

**16. AMP pages alternativas (1 dia)**
- Hoje Google ainda dá boost pra AMP em mobile
- `/lotes/:uuid?amp=1` versão simplificada

**17. Schema.org BreadcrumbList (30min)**
- Já temos visual; falta o JSON-LD
- Aparece como breadcrumb no Google search result

**18. Page Speed Insights monitoring (1h)**
- Cron diário medindo a home + 1 lote
- Alerta se score cai > 5 pontos

**19. Pixel Meta + Google Ads (preparação) (1h)**
- Tags via Server-Side Tag Manager (LGPD-friendly)
- Conversion: cliques WhatsApp, emails capturados

**20. Schema.org RealEstateAgent (15min)**
- LocalBusiness mais rico, aparece com mapa no Google

### 🏗️ Operação

**21. Webhook Drupal → Vercel revalidate (1h)**
- Quando lote muda status no Drupal, dispara revalidate no Next
- Hoje cache stale por até 60s (revalidate: 60)

**22. Audit log de tudo que acontece (1 dia)**
- Tabela `porto_audit` no Drupal
- Quem mudou status de lote/parcela quando
- Painel admin pra consultar

**23. Backups versionados do banco (S3 + 30 dias) (2h)**
- Hoje Pantheon faz backup mas só 30 dias
- Spawn de cron pra S3 com retenção indefinida

**24. Healthcheck do worker bancário (1h)**
- Endpoint que reporta última sync de boleto bem-sucedida
- Se > 24h, alerta

**25. Sentry + Slack alerts (2h)**
- Já planejado no roadmap; documentar canal Slack/Discord

### 💼 UX detalhes

**26. Loading state otimista nos filtros de /lotes (30min)**
- Hoje URL state navega → SSR → render. Fica aparente.
- React Transitions ou `useOptimistic` pra suavizar

**27. Botão "voltar pro topo" (15min)**
- Aparece após scroll de 800px
- Pequeno botão circular flutuante terracota

**28. Compartilhar lote em redes sociais (1h)**
- Botão "Compartilhar" no /lotes/:uuid
- Web Share API + fallback links (WhatsApp, X, Telegram, copiar URL)

**29. Modo escuro opcional (3h)**
- prefers-color-scheme + toggle salvo
- Paleta inversa: branco quente → marrom-sépia escuro

**30. Histórico de boletos baixados (1h)**
- Em `/painel`: "Últimos boletos baixados"
- Consulta direta `porto_eventos` filtrando `parcela_baixada` por uid

---

## Como usar este documento

1. Copie tudo dentro do bloco `` ``` `` no topo
2. Cole na primeira mensagem da nova sessão do Claude Code (VS Code)
3. O agente vai ler README + STATUS + ROADMAP e perguntar 3 coisas
4. Você responde → ele ataca a fase certa

Se quiser priorizar uma sugestão da lista de melhorias, é só falar
ex: "antes do ROADMAP, faz a sugestão 5 (cálculo de financiamento)".
