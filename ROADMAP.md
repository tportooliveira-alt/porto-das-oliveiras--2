# Roadmap — Porto das Oliveiras

Plano elaborado para sair do estado atual (MVP técnico provado) até um
produto **top**: vendas reais, operação semi-automatizada, presença
digital sólida no sudoeste baiano.

---

## Norte estratégico

> **Em 90 dias o site precisa estar gerando lead qualificado pra
> visita ao terreno todos os dias úteis.**

Isso significa três coisas que TODAS precisam ser verdade:

1. **Google indexa e ranqueia** "lote em Vitória da Conquista", "loteamento
   sudoeste Bahia", "chácara perto BR-262". Hoje 0 conteúdo indexado.
2. **Visitante chega no site e fica.** Tempo médio na home > 1min30,
   bounce rate < 50%. Hoje sem dados.
3. **Visitante conversa com a gente.** ≥ 5 cliques no WhatsApp por dia em
   dias úteis. Hoje 0 (analytics acabou de entrar).

Tudo no roadmap se justifica pelo impacto direto em **um desses três**.

---

## Onde estamos hoje (resumo do que já está pronto)

✅ **Fundação técnica completa** — Drupal+Next.js+JWT bridge validado E2E
✅ **Identidade visual editorial** — paleta + Fraunces + Inter aplicadas
✅ **Vídeo Hero fotorrealista** — Veo 3.1, futuro entregue com aeroporto
✅ **Área cliente funcional** — painel, parcelas com filtros, contratos, documentos
✅ **PDF de boletos** — entity_print streaming
✅ **Analytics LGPD-friendly** — server-side sem GA
✅ **Emails transacionais** — vencendo, paga, contrato ativado
✅ **Infra de produção** — rate limit, logger, CSP, HSTS, retry, timeouts
✅ **SEO básico** — sitemap, robots, OG, JSON-LD Schema.org
✅ **CI funcionando** — typecheck + build + 12 testes unitários + 7 estáticos
✅ **Documentação** — README, STATUS, ARCHITECTURE, CONTRIBUTING, SECURITY

🔴 **Travado:** Docker quebrado (Inference Manager), credenciais OAuth/Maps/Gemini
🟡 **Não começou:** mapa interativo, cadastro pelo Next, painel admin, busca, deploy

Detalhe completo em [STATUS.md](STATUS.md).

---

## Fases do roadmap

### 🚀 Fase 0 — Destravar (30min, hoje mesmo)

**Objetivo**: site rodando localmente de ponta a ponta com OAuth real.

Bloqueia tudo. Sem isso, smoke test 5-6 não roda, `/assistente` não responde, mapa não funciona. Tudo bloqueado em **você** criar contas.

- [ ] Rodar `C:\temp\fix-docker-inference.ps1` como Admin (destrava Docker)
- [ ] `ddev start` + `composer install`
- [ ] `ddev drush en porto_analytics porto_notifications -y`
- [ ] Criar [Google OAuth client](https://console.cloud.google.com/apis/credentials) → preencher `AUTH_GOOGLE_*`
- [ ] Criar [Microsoft App registration](https://portal.azure.com) → preencher `AUTH_MICROSOFT_ENTRA_*`
- [ ] Pegar [Gemini API key](https://aistudio.google.com/apikey) → preencher `GEMINI_API_KEY`
- [ ] Pegar [Google Maps key](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com) restrita → `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- [ ] Marcar lat/lng do terreno no Google Maps (botão direito → "O que há aqui?")
- [ ] Validar smoke test passos 5-6 ao vivo

**Critério de pronto**: você loga com Google, vê parcela que criamos no `cliente.teste`, baixa o boleto PDF.

---

### 🗺️ Fase 1 — Mapa interativo (1-2 dias)

**Impacto**: visitantes que veem o mapa do loteamento ficam +60% mais tempo no site (referência de imobiliárias do segmento). Conversão por mapa é maior que por lista.

- [ ] `lib/maps/loteamento.ts` — config central com:
  - center: lat/lng do portão
  - zoom: 17 (zoom de quadra)
  - boundary: GeoJSON do perímetro do loteamento (você desenha uma vez no [geojson.io](https://geojson.io))
  - polígonos opcionais por quadra
- [ ] Schema do Drupal: campo `field_geolocation` no `lote` (lat,lng)
- [ ] `components/lotes/MapaLotes.tsx` — Google Maps JS API com:
  - Pinos coloridos por status (verde=disponível, terracota=reservado, sépia=vendido)
  - Polígono do perímetro com cor de fundo discreta
  - InfoWindow ao clicar: card do lote + CTA "Ver detalhes"
- [ ] Toggle Grid/Mapa em `/lotes` com URL state (`?view=mapa`)
- [ ] Filtros laterais sincronizados (filtrar mapa quando muda status)
- [ ] Tracking: `lote_visualizado` ao clicar no pino, `mapa_aberto` quando toggle

**Critério de pronto**: abre `/lotes?view=mapa` no mobile e desktop, clica num pino, vê detalhes, clica no card → vai pro detalhe.

---

### 🤖 Fase 2 — Assistente de busca real (1 dia)

**Impacto**: público da nossa região não está acostumado a sites complexos. Falar em PT-BR ("quero um lote acima de 400m² com vista") converte muito mais que mexer em filtros.

- [ ] `lib/gemini/buscaSemantica.ts` — recebe pergunta natural, retorna filtros estruturados
- [ ] Prompt engineering: dar pro Gemini o catálogo enxuto (id+atributos) e pedir JSON `{status, faixaPrecoMin, faixaPrecoMax, faixaMetragemMin, faixaMetragemMax, ordenacao}`
- [ ] Aplicar filtros no JSON:API e devolver lotes
- [ ] UI conversacional em `/assistente`: input → cards de resposta com "achei estes":
- [ ] Sugestões pré-prontas: "Lote mais barato", "Acima de 400m²", "Pronto pra construir"
- [ ] Histórico curto no localStorage (5 últimas buscas)
- [ ] Rate limit já está em `/api/gemini/*` (10/min via middleware)

**Critério de pronto**: "lote acima de 400m² perto da entrada por menos de 150 mil" retorna 3 cards corretos em < 4s.

---

### 📊 Fase 3 — Painel admin operacional (2-3 dias)

**Impacto**: hoje o vendedor abre o admin Drupal (clunky). Com painel próprio em Next.js, ele opera em metade do tempo e vê leads do dia ao abrir.

Telas novas em `app/(admin)/`:

- [ ] **`/admin/leads`** — quem clicou no WhatsApp últimas 24h:
  - lote, origem (card/detalhe/hero), timestamp, IP hashed
  - Filtros: dia/semana/mês
  - Botão "marcar como respondido"
- [ ] **`/admin/lotes`** — CRUD pelo Next em vez do admin Drupal:
  - Listar + filtrar
  - Editar inline (status, preço)
  - Bulk: marcar 10 lotes como reservados de uma vez
- [ ] **`/admin/parcelas`** — financeiro:
  - Próximos 7 dias vencendo
  - Bulk "marcar como paga" (dispara email automaticamente via hook que já existe)
  - Audit log: quem mudou o quê quando
- [ ] **`/admin/relatorios`** — KPI cards consumindo `RegistradorEventos`:
  - Lotes mais visualizados (semana, mês)
  - Conversão WhatsApp/visitante por lote
  - Volume de logins
  - Receita projetada vs. recebida
- [ ] Layout `(admin)` com role guard (só `vendedor`, `financeiro`, `administrador`)

**Critério de pronto**: você abre `/admin/leads` de manhã e vê quem clicou no WhatsApp ontem, sem precisar abrir Drupal.

---

### 📱 Fase 4 — Otimização mobile (1-2 dias)

**Impacto**: 70%+ do tráfego é mobile (Bahia, classe média). Hoje testamos no desktop. Cada bug mobile = lead perdido.

- [ ] **Audit Lighthouse mobile** — score > 90 em performance/SEO/a11y
- [ ] **Imagens responsive** com `next/image` em todo lugar (não `<img>` ou bg-image)
- [ ] **Webp/AVIF** servidos automaticamente
- [ ] **Fonts**: `font-display: swap` (já está com next/font)
- [ ] **Hero video mobile**: reduzir bitrate, poster otimizado, lazy autoplay com Intersection Observer
- [ ] **CSS crítico inline** dos primeiros 800px
- [ ] **Service Worker offline-first** com Workbox: vê home + último lote visto offline
- [ ] **Add to Home Screen** — PWA com manifest.json + icons
- [ ] **WhatsApp button flutuante** no mobile (sempre acessível, posição inferior direita)

**Critério de pronto**: Lighthouse mobile > 90, instala como PWA no Android, abre offline.

---

### 🔍 Fase 5 — SEO local & conteúdo (1 semana, contínuo)

**Impacto**: tráfego orgânico ranqueado é o canal mais barato. Quem busca "lote em Vitória da Conquista" tem alta intenção de compra.

- [ ] **Página `/sobre`** — história do loteamento, foto da equipe, alvará, documentação
- [ ] **Blog `/diario`** — artigos curtos:
  - "Como financiar seu lote direto com a gente"
  - "Documentação para escritura no Porto"
  - "Vitória da Conquista vista do Porto"
  - "Andamento da obra · semana 12"
- [ ] **FAQ schema markup** em `/sobre` (rich snippet no Google)
- [ ] **LocalBusiness schema** com endereço, telefone, horário
- [ ] **Google Search Console** + sitemap submetido
- [ ] **Google My Business** linkado ao site
- [ ] **Backlinks**: cadastro em diretórios locais (Solutudo, Apontador, Yelp se relevante)
- [ ] **Pixel de Meta + Google Ads** preparado (sem ainda comprar mídia, mas preparar)

**Critério de pronto**: ranqueando top 10 pra "loteamento Vitória da Conquista" em 90 dias.

---

### 🏗️ Fase 6 — Operação & confiabilidade (1 semana)

**Impacto**: quando o site começar a vender, queda = R$ perdido. Hoje a infra é frágil (rate limit em memória, Drupal local, sem monitoring).

- [ ] **Deploy Vercel** do `web-frontend`:
  - Domínio próprio (sugestão: `porto-das-oliveiras.com.br`)
  - Preview deploys por PR
  - Env vars de produção todas configuradas
- [ ] **Deploy Drupal** em Pantheon Basic ou Platform.sh Starter:
  - Backups diários automatizados
  - SSL via Let's Encrypt
  - CORS configurado pro domínio Vercel em `services.yml`
- [ ] **Upstash Redis** pro rate limit multi-instance (replace in-memory)
- [ ] **Sentry** no Next.js + Drupal:
  - Source maps no Vercel
  - PII scrubbing (LGPD)
- [ ] **UptimeRobot** apontando pra `/api/health` (alerta SMS/email se cair)
- [ ] **Cron real** do Drupal (não DDEV) pra rodar lembretes de parcela
- [ ] **Status page** pública (statuspage.io ou self-hosted Cachet)
- [ ] **Runbook** em [docs/RUNBOOK.md] — o que fazer em cada cenário de falha

**Critério de pronto**: site rodando em produção 99.5% do tempo, sem você tocar.

---

### 🎬 Fase 7 — Conteúdo audiovisual (1 semana, paralelo com tudo)

**Impacto**: imobiliário sem foto/vídeo bonito vende muito menos. Vídeo do Veo é placeholder enquanto não vem material real.

- [ ] **Sessão de fotos profissional** no terreno (não selfie de celular):
  - Aérea (drone Mavic 3 mesmo que aluguemos)
  - Detalhes da infraestrutura (vias, postes, redes)
  - Pessoas usando o espaço (autorização de imagem)
- [ ] **Vídeo institucional** 60s — você ou um sócio falando direto pra câmera:
  - "Por que decidimos abrir aqui"
  - Tour aéreo
  - Depoimento de comprador pioneiro
- [ ] **Galeria por lote** — quando o user marca lote no Drupal, sobe 3-5 fotos da vista daquele lote específico
- [ ] **Variações do Hero** — 3 vídeos curtos do Veo já gerados, gente carrossel automático

**Critério de pronto**: visitante consegue se imaginar morando lá só vendo as imagens.

---

### 💸 Fase 8 — Conversão & nutrição (1 semana)

**Impacto**: nem todo mundo compra na primeira visita. Capturar email + nutrir é o que separa quem vende 1 vs. 10 por mês.

- [ ] **Captura de email** em pontos estratégicos:
  - "Me avise quando voltar a vender" em lote vendido
  - "Receber novidades do loteamento" no footer
  - "Baixar guia de financiamento" gated (PDF rico)
- [ ] **Sequência de emails** de nutrição (5 emails em 30 dias):
  - 1: boas-vindas + tour fotográfico
  - 2: como funciona o financiamento direto
  - 3: depoimento de comprador
  - 4: andamento da obra
  - 5: "agora ou nunca" — lote específico oferecido com bônus
- [ ] **Calculadora de parcelas** em `/lotes/:slug`:
  - Entrada + prazo → parcela mensal
  - "Fale com a gente sobre essa simulação" → WhatsApp pré-preenchido
- [ ] **Tour virtual 360º** se rolar orçamento (Matterport ou similar)
- [ ] **Carrinho/reserva online** — cliente reserva por 48h via Stripe Checkout (ou Mercado Pago):
  - Sinal de R$ 500 retido
  - Vira contrato se confirma
  - Devolvido se desiste

**Critério de pronto**: 30+ emails capturados/semana, 1+ reserva online/semana.

---

## Ordem recomendada (priorização por impacto/esforço)

| Sprint | Foco | Esforço | Impacto |
|---|---|---|---|
| Sprint 0 (hoje) | Fase 0 — destravar | 30min | Bloqueio total |
| Sprint 1 | Fase 1 — mapa | 2 dias | Alto |
| Sprint 2 | Fase 4 — mobile + Fase 7 — fotos | 3 dias | Alto |
| Sprint 3 | Fase 6 — deploy produção | 5 dias | Crítico p/ vender |
| Sprint 4 | Fase 5 — SEO local | 1 semana + contínuo | Alto, lento |
| Sprint 5 | Fase 3 — painel admin | 3 dias | Alto p/ operação |
| Sprint 6 | Fase 8 — conversão | 1 semana | Multiplicador |
| Sprint 7 | Fase 2 — assistente IA | 1 dia | Diferenciação |

**Insight**: priorizamos `mobile + deploy + SEO` **antes** do painel admin, porque a primeira fase vende vs. a segunda automatiza o que você já faz à mão. Sempre prefira "ferramenta que vende" sobre "ferramenta que poupa tempo".

---

## KPIs por sprint (pra saber se está funcionando)

| KPI | Hoje | 30d | 60d | 90d |
|---|---|---|---|---|
| Lotes indexados pelo Google | 0 | 50 | 50 | 50 |
| Sessões orgânicas/mês | 0 | 100 | 400 | 1000 |
| Tempo médio na home | — | 1min | 1m30 | 2min |
| Cliques no WhatsApp/dia útil | 0 | 2 | 5 | 8 |
| Emails capturados | 0 | 30 | 100 | 250 |
| Reservas online | 0 | 0 | 1 | 5 |
| Lighthouse mobile | ~75 | 85 | 90 | 95 |

---

## Princípios de execução

1. **Sempre dá pra rodar.** CI verde em todo PR. Site em produção 99%+.
2. **Mobile-first.** Quem está no Galaxy A14 manda, não você no MacBook.
3. **Texto em português, peso baiano.** Sem corporativismo, sem "missão e valores".
4. **Cada feature precisa de uma métrica.** Se não dá pra medir o impacto, não está pronta.
5. **Custo zero por padrão.** Vercel free, Pantheon Basic, Upstash free, Gemini free. Só sobe pra pago quando o uso justifica.
6. **LGPD por design.** Sem GA, sem Hotjar, sem terceiros tracker. Tudo no nosso backend.
7. **Acessível.** Galera mais velha vai comprar tanto quanto millennial. Não deixa ninguém pra trás.

---

## Coisa que NÃO está no roadmap (deliberadamente)

- App nativo iOS/Android — site responsivo + PWA cobre 95% do valor.
- IA pra gerar descrição de lote — vendedor escreve melhor com peso humano.
- Marketplace de imóveis terceiros — foco no Porto, não dispersa.
- Tour 3D fotorrealista do terreno — caro e duvido que move ponteiro.
- White label pra outros loteamentos — primeiro vendemos o nosso.

---

## Como retomar amanhã

Abrir esse arquivo e este STATUS.md. Pegar o **primeiro item não-marcado** da fase atual. Se a fase atual está pronta, ir pra próxima na ordem recomendada.

Cada item desbloqueia um critério de pronto. Cada critério de pronto, um KPI. Cada KPI, um cliente mais perto.
