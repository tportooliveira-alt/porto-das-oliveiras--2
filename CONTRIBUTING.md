# Contribuindo

Guia rápido para mexer no Porto das Oliveiras. Leia antes de abrir o primeiro PR.

## Setup local

Pré-requisitos, comandos e troubleshooting estão em [README.md](README.md).
Resumo:

```bash
# Backend
cd web-backend
ddev start
ddev composer install
# ... ver README para o bootstrap completo

# Frontend (fora do OneDrive — copiar para C:\temp\porto-test no Windows)
cd web-frontend  # ou C:\temp\porto-test
npm install
cp .env.example .env.local   # preencher
npm run dev
```

## Branches

- `main` — sempre verde, deployável.
- `feat/<nome-curto>` — features novas.
- `fix/<nome-curto>` — bug fixes.
- `chore/<nome-curto>` — refactor, deps, infra.
- `docs/<nome-curto>` — só documentação.

Trabalhe direto em main apenas para emergências. Tudo mais via PR.

## Commits — Conventional Commits

Formato: `<tipo>(<escopo opcional>): <descrição curta>`

| Tipo | Quando usar |
|---|---|
| `feat` | Funcionalidade nova visível ao usuário |
| `fix` | Bug fix |
| `docs` | Só documentação |
| `refactor` | Refator sem mudança de comportamento |
| `test` | Testes novos ou consertos em testes |
| `chore` | Infra, build, deps, configs |
| `perf` | Otimização de performance |
| `style` | Formatação, sem código novo |

Primeira linha **em português**, imperativo, ≤72 caracteres. Corpo opcional
explicando o **porquê**, não o quê (o diff já mostra o quê).

Exemplo:

```
fix(lotes): obter por UUID em vez de filter[path.alias]

O JSON:API do Drupal não expõe o pseudo-campo `path` por padrão,
então `filter[path.alias]=...` retornava 500. Trocado pelo endpoint
canônico /jsonapi/node/lote/<uuid>.
```

## Pull Requests

- Título no formato de commit (`feat: ...`).
- Descrição com **antes / depois** sempre que possível — screenshot, vídeo
  ou GIF se for visual.
- Marque como **Draft** enquanto WIP.
- CI tem que estar verde antes de marcar como ready for review.
- Squash merge é o default.

## Convenções de código

### Idioma

- **Comentários, nomes de função, mensagens de erro e logs** em
  português brasileiro. O domínio é Brasil; tradução é fricção.
- **Identificadores técnicos** (tipos, classes do framework, palavras
  reservadas) ficam em inglês — não traduza `useState`, `boolean`, etc.

### TypeScript

- `strict: true` no `tsconfig.json` — não desabilitar.
- Tipos vivem em `lib/drupal/types.ts` (domínio) e ao lado do uso (utility).
- Server Components por padrão. `'use client'` só com motivo claro.

### CSS / Tailwind

- Tokens em `globals.css` (CSS vars) e `tailwind.config.ts` (Tailwind colors,
  fontSize, etc.). Nunca hardcode `#hex` em componentes.
- Animations sempre wrapped em `@media (prefers-reduced-motion: reduce)` —
  está no globals.css.

### Drupal

- Mudanças no admin **sempre** seguidas de `ddev drush config:export -y`
  e commit do `config/sync`.
- Custom modules em `web/modules/custom/` com `strict_types=1` no topo
  de cada PHP.
- Hook implementations em `<modulo>.module`, services em `<modulo>.services.yml`.

## Testes

- **Lógica pura** (cálculos, normalizações): unit test em `tests/*.mjs`
  rodando com `node --test` style ou `assert/strict`. Sem framework.
- **Estrutura/config**: scripts estáticos em `tests/` validam YAMLs, PHP
  sanity, JSON:API contracts. Rodam em CI sem Docker.
- **End-to-end**: documente em `SMOKE-TEST.md` os passos manuais até a
  gente ter Playwright.

CI roda em todo PR:
1. `npm run typecheck`
2. `npm run build`
3. Todos os scripts em `tests/*.mjs`

PR não merge se qualquer um falhar.

## Segurança

- **Nunca** commitar `.env.local`, `settings.local.php` ou qualquer arquivo
  com credenciais. `.gitignore` cobre os comuns, mas confira.
- Encontrou vulnerabilidade? Veja [SECURITY.md](SECURITY.md).

## Dúvidas

Abra uma issue com a label `pergunta`. Resposta dentro de 48h em dia útil.
