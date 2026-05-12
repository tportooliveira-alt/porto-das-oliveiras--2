# Testes estáticos (Fases 1–5.8)

Validações que rodam **sem DDEV/Docker/PHP** — só Node + alguns deps via
o `package.json` do `web-frontend`.

## Como rodar

```powershell
# Instalar deps em pasta fora do OneDrive (OneDrive trava o npm)
cp -r web-frontend C:/temp/porto-test
cd C:/temp/porto-test
npm install --no-audit --no-fund
cp ../../tests/*.mjs ./
```

Depois cada teste:

```powershell
node yaml-check.mjs      # Fase 3 — sintaxe YAML
node composer-check.mjs  # Fase 4 — composer.json estrutura
node php-check.mjs       # Fase 5 — services/routing vs classes
node xref-check.mjs      # Fase 5.5 — referências entre config/sync
node php-sanity.mjs      # Fase 5.6 — chaves, namespaces, strict_types
node jwt-cycle.mjs       # Fase 5.7 — mint + verify HS256 + rejeições
node cookie-decode.mjs   # Fase 5.8 — encode/decode cookie NextAuth
```

Todos devem sair com **exit 0**. Re-rodar após cada mudança no backend
ou no auth.

## O que cada teste cobre

| Script | Cobertura |
|---|---|
| `yaml-check.mjs` | 18 YAMLs parseiam |
| `composer-check.mjs` | composer.json válido + chaves obrigatórias |
| `php-check.mjs` | services.yml/routing.yml apontam para classes que existem; aridade do construtor bate |
| `xref-check.mjs` | `field.field.*` ↔ `field.storage.*` ↔ `node.type.*` consistentes |
| `php-sanity.mjs` | PHPs com `<?php`, `strict_types`, namespace, chaves balanceadas |
| `jwt-cycle.mjs` | HS256 mint/verify, rejeita segredo/issuer errados e exp passado |
| `cookie-decode.mjs` | Cookie NextAuth carrega/recupera `drupalJwt` intacto; salt/secret errados lançam |

## Por que separar disso o smoke test "real" (DDEV)

Estes testes não substituem o smoke test ponta-a-ponta — provam apenas
que **a fundação compila e os contratos batem**. Faltam:

- Drupal subindo e respondendo no JSON:API.
- View "Minhas Parcelas" com Contextual Filter funcionando.
- OAuth Google/Microsoft.
- Auto-provisionamento de usuário via `porto_auth`.

Esses passos vivem em [../SMOKE-TEST.md](../SMOKE-TEST.md) e exigem
Docker/DDEV + credenciais OAuth.
